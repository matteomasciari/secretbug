import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@/types/socket-events";
import type { Player, RoomState } from "@/types/game";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/types/game";
import { roomManager } from "./rooms";
import { verifyPassword } from "./password";
import { buildClientState } from "./redact";
import {
  acknowledgeNight,
  castVote,
  chancellorDiscard,
  createInitialGameState,
  executeTarget,
  nominate,
  presidentDiscard,
  pushLog,
  resetRoomToLobby,
  resolveVotes,
  allVotesIn,
} from "./gameEngine";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const LOBBY_CHANNEL = "lobby-browser";

function clampNick(s: string) {
  return s.trim().slice(0, 24);
}
function clampName(s: string) {
  return s.trim().slice(0, 40);
}

export function registerSocketServer(io: IOServer) {
  function broadcastRoomState(room: RoomState) {
    for (const player of room.game.players) {
      if (player.isConnected && player.socketId) {
        io.to(player.socketId).emit("game:state", buildClientState(room, player.id));
      }
    }
  }

  function broadcastLobbyList() {
    io.to(LOBBY_CHANNEL).emit("lobby:rooms", roomManager.list());
  }

  io.on("connection", (socket: IOSocket) => {
    socket.join(LOBBY_CHANNEL);

    socket.on("lobby:list", (cb) => {
      cb(roomManager.list());
    });

    socket.on("lobby:create", (payload, cb) => {
      const name = clampName(payload.lobbyName);
      const hostNickname = clampNick(payload.hostNickname);
      const maxPlayers = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, payload.maxPlayers | 0));

      if (!name) return cb({ ok: false, error: "Lobby name is required." });
      if (!hostNickname) return cb({ ok: false, error: "Nickname is required." });
      if (!payload.playerId) return cb({ ok: false, error: "Missing client id." });

      const host: Player = {
        id: payload.playerId,
        socketId: socket.id,
        nickname: hostNickname,
        isHost: true,
        isReady: true,
        isConnected: true,
        isAlive: true,
        role: null,
        seat: 0,
      };

      const room = roomManager.create({
        name,
        password: payload.password ?? "",
        maxPlayers,
        host,
      });

      socket.join(room.id);
      socket.data.playerId = payload.playerId;
      socket.data.roomId = room.id;

      pushLog(room.game, `Lobby "${name}" created by ${hostNickname}.`, "system");

      cb({ ok: true, data: { roomId: room.id } });
      broadcastRoomState(room);
      broadcastLobbyList();
    });

    socket.on("lobby:join", (payload, cb) => {
      const room = roomManager.get(payload.roomId);
      if (!room) return cb({ ok: false, error: "Lobby not found." });

      const existing = room.game.players.find((p) => p.id === payload.playerId);

      if (!existing) {
        if (room.game.phase !== "LOBBY") {
          return cb({ ok: false, error: "Game already in progress." });
        }
        if (room.passwordHash && !verifyPassword(payload.password ?? "", room.passwordHash)) {
          return cb({ ok: false, error: "Incorrect password." });
        }
        const nickname = clampNick(payload.nickname);
        if (!nickname) return cb({ ok: false, error: "Nickname is required." });
        if (room.game.players.length >= room.settings.maxPlayers) {
          return cb({ ok: false, error: "Lobby is full." });
        }
        const taken = room.game.players.some(
          (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
        );
        if (taken) return cb({ ok: false, error: "Nickname already taken in this lobby." });

        const player: Player = {
          id: payload.playerId,
          socketId: socket.id,
          nickname,
          isHost: false,
          isReady: false,
          isConnected: true,
          isAlive: true,
          role: null,
          seat: room.game.players.length,
        };
        room.game.players.push(player);
        pushLog(room.game, `${nickname} joined the lobby.`, "system");
      } else {
        existing.socketId = socket.id;
        existing.isConnected = true;
      }

      socket.join(room.id);
      socket.data.playerId = payload.playerId;
      socket.data.roomId = room.id;

      cb({ ok: true, data: { roomId: room.id } });
      broadcastRoomState(room);
      broadcastLobbyList();
    });

    socket.on("lobby:rejoin", (payload, cb) => {
      const room = roomManager.get(payload.roomId);
      if (!room) return cb({ ok: false, error: "Lobby not found." });
      const player = room.game.players.find((p) => p.id === payload.playerId);
      if (!player) return cb({ ok: false, error: "You are not part of this lobby." });

      player.socketId = socket.id;
      player.isConnected = true;
      socket.join(room.id);
      socket.data.playerId = payload.playerId;
      socket.data.roomId = room.id;

      pushLog(room.game, `${player.nickname} reconnected.`, "system");
      cb({ ok: true, data: { roomId: room.id } });
      broadcastRoomState(room);
    });

    socket.on("lobby:leave", (payload, cb) => {
      const room = roomManager.get(payload.roomId);
      const playerId = socket.data.playerId as string | undefined;
      if (!room || !playerId) return cb({ ok: true });

      if (room.game.phase === "LOBBY") {
        handlePlayerLeave(room, playerId, io, broadcastRoomState, broadcastLobbyList);
      } else {
        const player = room.game.players.find((p) => p.id === playerId);
        if (player) {
          player.isConnected = false;
          player.socketId = null;
          pushLog(room.game, `${player.nickname} left the game.`, "system");
          broadcastRoomState(room);
        }
      }
      socket.leave(room.id);
      cb({ ok: true });
    });

    socket.on("lobby:toggleReady", (payload, cb) => {
      const room = roomManager.get(payload.roomId);
      const playerId = socket.data.playerId as string | undefined;
      if (!room || !playerId) return cb({ ok: false, error: "Not in a room." });
      if (room.game.phase !== "LOBBY") return cb({ ok: false, error: "Game already started." });

      const player = room.game.players.find((p) => p.id === playerId);
      if (!player || player.isHost) return cb({ ok: false, error: "Cannot toggle host readiness." });

      player.isReady = !player.isReady;
      cb({ ok: true });
      broadcastRoomState(room);
    });

    socket.on("lobby:startGame", (payload, cb) => {
      const room = roomManager.get(payload.roomId);
      const playerId = socket.data.playerId as string | undefined;
      if (!room || !playerId) return cb({ ok: false, error: "Not in a room." });
      if (room.hostId !== playerId) return cb({ ok: false, error: "Only the host can start the game." });
      if (room.game.phase !== "LOBBY") return cb({ ok: false, error: "Game already started." });
      if (room.game.players.length < MIN_PLAYERS) {
        return cb({ ok: false, error: `Need at least ${MIN_PLAYERS} players.` });
      }

      room.game = createInitialGameState(room.game.players);
      cb({ ok: true });
      broadcastRoomState(room);
      broadcastLobbyList();
    });

    socket.on("game:acknowledgeNight", (payload, cb) => {
      runAction(payload.roomId, socket, cb, (room, playerId) => {
        acknowledgeNight(room.game, playerId);
        return null;
      });
    });

    socket.on("game:nominate", (payload, cb) => {
      runAction(payload.roomId, socket, cb, (room, playerId) =>
        nominate(room.game, playerId, payload.nomineeId)
      );
    });

    socket.on("game:vote", (payload, cb) => {
      const room = roomManager.get(payload.roomId);
      const playerId = socket.data.playerId as string | undefined;
      if (!room || !playerId) return cb({ ok: false, error: "Not in a room." });

      const err = castVote(room.game, playerId, payload.vote);
      if (err) return cb({ ok: false, error: err });

      cb({ ok: true });
      broadcastRoomState(room);

      if (allVotesIn(room.game)) {
        // Give every client a moment to see the simultaneous reveal before
        // the phase advances.
        const roomId = room.id;
        setTimeout(() => {
          const liveRoom = roomManager.get(roomId);
          if (!liveRoom || liveRoom.game.phase !== "VOTING") return;
          resolveVotes(liveRoom.game);
          broadcastRoomState(liveRoom);
        }, 2500);
      }
    });

    socket.on("game:presidentDiscard", (payload, cb) => {
      runAction(payload.roomId, socket, cb, (room, playerId) =>
        presidentDiscard(room.game, playerId, payload.card)
      );
    });

    socket.on("game:chancellorDiscard", (payload, cb) => {
      runAction(payload.roomId, socket, cb, (room, playerId) =>
        chancellorDiscard(room.game, playerId, payload.card)
      );
    });

    socket.on("game:execute", (payload, cb) => {
      runAction(payload.roomId, socket, cb, (room, playerId) =>
        executeTarget(room.game, playerId, payload.targetId)
      );
    });

    socket.on("game:returnToLobby", (payload, cb) => {
      const room = roomManager.get(payload.roomId);
      const playerId = socket.data.playerId as string | undefined;
      if (!room || !playerId) return cb({ ok: false, error: "Not in a room." });
      if (room.hostId !== playerId) return cb({ ok: false, error: "Only the host can do that." });
      if (room.game.phase !== "GAME_OVER") return cb({ ok: false, error: "Game is not over." });

      resetRoomToLobby(room);
      cb({ ok: true });
      broadcastRoomState(room);
      broadcastLobbyList();
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (!roomId || !playerId) return;
      const room = roomManager.get(roomId);
      if (!room) return;

      if (room.game.phase === "LOBBY") {
        handlePlayerLeave(room, playerId, io, broadcastRoomState, broadcastLobbyList);
      } else {
        const player = room.game.players.find((p) => p.id === playerId);
        if (player) {
          player.isConnected = false;
          player.socketId = null;
          pushLog(room.game, `${player.nickname} disconnected.`, "system");
          broadcastRoomState(room);
        }
      }
    });

    // ---- local helper closing over `socket` ----

    function runAction(
      roomId: string,
      sock: IOSocket,
      cb: (res: { ok: boolean; error?: string }) => void,
      fn: (room: RoomState, playerId: string) => string | null
    ) {
      const room = roomManager.get(roomId);
      const playerId = sock.data.playerId as string | undefined;
      if (!room || !playerId) return cb({ ok: false, error: "Not in a room." });

      const err = fn(room, playerId);
      if (err) return cb({ ok: false, error: err });

      cb({ ok: true });
      broadcastRoomState(room);
    }
  });
}

function handlePlayerLeave(
  room: RoomState,
  playerId: string,
  io: IOServer,
  broadcastRoomState: (room: RoomState) => void,
  broadcastLobbyList: () => void
) {
  const player = room.game.players.find((p) => p.id === playerId);
  if (!player) return;

  room.game.players = room.game.players.filter((p) => p.id !== playerId);
  pushLog(room.game, `${player.nickname} left the lobby.`, "system");

  if (room.game.players.length === 0) {
    roomManager.delete(room.id);
    broadcastLobbyList();
    return;
  }

  if (room.hostId === playerId) {
    const newHost = room.game.players[0];
    newHost.isHost = true;
    newHost.isReady = true;
    room.hostId = newHost.id;
    pushLog(room.game, `${newHost.nickname} is now the host.`, "system");
  }

  broadcastRoomState(room);
  broadcastLobbyList();
}
