"use client";

import { useState } from "react";
import { Bug, Wifi, WifiOff } from "lucide-react";
import { useLobbyBrowser } from "@/hooks/useLobbyBrowser";
import { CreateLobbyModal } from "@/components/lobby/CreateLobbyModal";
import { JoinLobbyModal } from "@/components/lobby/JoinLobbyModal";
import { LobbyCard } from "@/components/lobby/LobbyCard";
import type { RoomSummary } from "@/types/game";

export default function HomePage() {
  const { rooms, connected } = useLobbyBrowser();
  const [selectedRoom, setSelectedRoom] = useState<RoomSummary | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Bug className="size-8 text-devops text-shadow-glow" strokeWidth={2.5} />
          <h1 className="text-3xl font-bold tracking-tight">
            SECRET<span className="text-devops">_</span>BUG
          </h1>
        </div>
        <p className="text-muted-foreground">
          A social deduction game for software developers. Ship releases, hunt bugs, find the
          Junior Dev before it&apos;s too late.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {connected ? (
            <>
              <Wifi className="size-3.5 text-devops" />
              <span>connected</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3.5 text-hacker" />
              <span>connecting...</span>
            </>
          )}
        </div>
        <CreateLobbyModal />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          $ ls ./active-lobbies
        </h2>
        {rooms.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            No active lobbies. Create one to get the team together.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rooms.map((room) => (
              <LobbyCard
                key={room.id}
                room={room}
                onClick={() => {
                  setSelectedRoom(room);
                  setJoinOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <JoinLobbyModal room={selectedRoom} open={joinOpen} onOpenChange={setJoinOpen} />
    </main>
  );
}
