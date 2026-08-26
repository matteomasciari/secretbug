"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { getOrCreatePlayerId, saveNickname } from "@/lib/identity";
import type { RoomSummary } from "@/types/game";

export function useLobbyBrowser() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onRooms = (list: RoomSummary[]) => setRooms(list);
    const onConnect = () => {
      setConnected(true);
      socket.emit("lobby:list", (list) => setRooms(list));
    };
    const onDisconnect = () => setConnected(false);

    socket.on("lobby:rooms", onRooms);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) onConnect();

    return () => {
      socket.off("lobby:rooms", onRooms);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const createRoom = useCallback(
    (params: { lobbyName: string; password: string; hostNickname: string; maxPlayers: number }) => {
      const socket = getSocket();
      const playerId = getOrCreatePlayerId();
      saveNickname(params.hostNickname);
      return new Promise<{ ok: boolean; error?: string; roomId?: string }>((resolve) => {
        socket.emit(
          "lobby:create",
          { ...params, playerId },
          (res) => {
            resolve({ ok: res.ok, error: res.error, roomId: res.data?.roomId });
          }
        );
      });
    },
    []
  );

  const joinRoom = useCallback(
    (params: { roomId: string; nickname: string; password: string }) => {
      const socket = getSocket();
      const playerId = getOrCreatePlayerId();
      saveNickname(params.nickname);
      return new Promise<{ ok: boolean; error?: string; roomId?: string }>((resolve) => {
        socket.emit("lobby:join", { ...params, playerId }, (res) => {
          resolve({ ok: res.ok, error: res.error, roomId: res.data?.roomId });
        });
      });
    },
    []
  );

  return { rooms, connected, createRoom, joinRoom };
}
