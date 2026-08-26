"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { getOrCreatePlayerId, getSavedNickname, rememberRoom } from "@/lib/identity";
import type { ClientGameState, VoteValue, PRCard } from "@/types/game";

interface JoinPromptState {
  needed: boolean;
  error: string | null;
}

export function useGameRoom(roomId: string) {
  const [state, setState] = useState<ClientGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [joinPrompt, setJoinPrompt] = useState<JoinPromptState>({ needed: false, error: null });
  const attemptedAutoJoin = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    const playerId = getOrCreatePlayerId();

    const onState = (s: ClientGameState) => {
      if (s.roomId === roomId) setState(s);
    };
    const onError = (message: string) => setFatalError(message);

    socket.on("game:state", onState);
    socket.on("game:error", onError);

    function tryRejoin() {
      socket.emit("lobby:rejoin", { roomId, playerId }, (res) => {
        if (!res.ok) {
          setJoinPrompt({ needed: true, error: null });
        }
      });
    }

    if (socket.connected && !attemptedAutoJoin.current) {
      attemptedAutoJoin.current = true;
      tryRejoin();
    }

    const onConnect = () => {
      setConnected(true);
      if (!attemptedAutoJoin.current) {
        attemptedAutoJoin.current = true;
        tryRejoin();
      }
    };
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("game:state", onState);
      socket.off("game:error", onError);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [roomId]);

  const joinWithNicknamePassword = useCallback(
    (nickname: string, password: string) => {
      const socket = getSocket();
      const playerId = getOrCreatePlayerId();
      return new Promise<{ ok: boolean; error?: string }>((resolve) => {
        socket.emit("lobby:join", { roomId, nickname, password, playerId }, (res) => {
          if (res.ok) {
            rememberRoom(roomId);
            setJoinPrompt({ needed: false, error: null });
          } else {
            setJoinPrompt({ needed: true, error: res.error ?? "Could not join." });
          }
          resolve({ ok: res.ok, error: res.error });
        });
      });
    },
    [roomId]
  );

  const emitAction = useCallback(
    <T extends object>(event: string, payload: T) => {
      const socket = getSocket();
      return new Promise<{ ok: boolean; error?: string }>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit(event, payload, (res: { ok: boolean; error?: string }) => resolve(res));
      });
    },
    []
  );

  const actions = {
    toggleReady: () => emitAction("lobby:toggleReady", { roomId }),
    startGame: () => emitAction("lobby:startGame", { roomId }),
    leave: () => emitAction("lobby:leave", { roomId }),
    acknowledgeNight: () => emitAction("game:acknowledgeNight", { roomId }),
    nominate: (nomineeId: string) => emitAction("game:nominate", { roomId, nomineeId }),
    vote: (vote: VoteValue) => emitAction("game:vote", { roomId, vote }),
    presidentDiscard: (card: PRCard) => emitAction("game:presidentDiscard", { roomId, card }),
    chancellorDiscard: (card: PRCard) => emitAction("game:chancellorDiscard", { roomId, card }),
    execute: (targetId: string) => emitAction("game:execute", { roomId, targetId }),
    returnToLobby: () => emitAction("game:returnToLobby", { roomId }),
  };

  return {
    state,
    connected,
    fatalError,
    joinPrompt,
    joinWithNicknamePassword,
    savedNickname: getSavedNickname(),
    actions,
  };
}

export type GameRoomActions = ReturnType<typeof useGameRoom>["actions"];
