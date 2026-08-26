import { nanoid } from "nanoid";
import type { Player, RoomState, RoomSummary } from "@/types/game";
import { hashPassword } from "./password";

class RoomManager {
  private rooms = new Map<string, RoomState>();

  create(params: {
    name: string;
    password: string;
    maxPlayers: number;
    host: Player;
  }): RoomState {
    const id = nanoid(10);
    const room: RoomState = {
      id,
      settings: {
        name: params.name,
        maxPlayers: params.maxPlayers,
        hasPassword: params.password.length > 0,
      },
      passwordHash: params.password.length > 0 ? hashPassword(params.password) : null,
      hostId: params.host.id,
      createdAt: Date.now(),
      game: {
        phase: "LOBBY",
        players: [params.host],
        leadEngineerId: null,
        previousLeadEngineerId: null,
        codeReviewerId: null,
        previousCodeReviewerId: null,
        nominatedReviewerId: null,
        votes: {},
        stabileCount: 0,
        criticoCount: 0,
        deployFailureCount: 0,
        deck: [],
        discard: [],
        presidentHand: [],
        chancellorHand: [],
        executionPending: false,
        executionUnlocked: false,
        winner: null,
        winReason: null,
        turnOrder: [],
        nightAcks: [],
        log: [],
      },
    };
    this.rooms.set(id, room);
    return room;
  }

  get(id: string): RoomState | undefined {
    return this.rooms.get(id);
  }

  delete(id: string) {
    this.rooms.delete(id);
  }

  list(): RoomSummary[] {
    return Array.from(this.rooms.values()).map((r) => ({
      id: r.id,
      name: r.settings.name,
      playerCount: r.game.players.length,
      maxPlayers: r.settings.maxPlayers,
      status: r.game.phase === "LOBBY" ? "WAITING" : "IN_GAME",
      hasPassword: r.settings.hasPassword,
      hostNickname: r.game.players.find((p) => p.id === r.hostId)?.nickname ?? "?",
    }));
  }

  findRoomByPlayerId(playerId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      if (room.game.players.some((p) => p.id === playerId)) return room;
    }
    return undefined;
  }
}

export const roomManager = new RoomManager();
