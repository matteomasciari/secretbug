"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crown, Check, Circle, Copy, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ClientGameState } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";
import { cn } from "@/lib/utils";

export function WaitingRoom({
  state,
  actions,
  onLeave,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
  onLeave: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const me = state.players.find((p) => p.id === state.you.id);
  const canStart = state.you.isHost && state.players.length >= 5;

  async function handleStart() {
    setStarting(true);
    const res = await actions.startGame();
    setStarting(false);
    if (!res.ok) toast.error(res.error ?? "Failed to start game.");
  }

  async function handleLeave() {
    await actions.leave();
    onLeave();
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/room/${state.roomId}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied.");
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            waiting room
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{state.roomName}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={copyInviteLink}>
          <Copy className="size-3.5" />
          Invite
        </Button>
      </header>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="size-4" />
        <span>
          {state.players.length}/{10} engineers connected
        </span>
        {state.players.length < 5 && (
          <span className="text-hacker">(need {5 - state.players.length} more to start)</span>
        )}
      </div>

      <Separator />

      <ul className="flex flex-col gap-2">
        {state.players.map((p) => (
          <li
            key={p.id}
            className={cn(
              "flex items-center justify-between rounded-md border border-border/60 px-3 py-2",
              p.id === state.you.id && "border-devops/50 bg-devops/5"
            )}
          >
            <div className="flex items-center gap-2">
              {p.isHost ? (
                <Crown className="size-4 text-devops" />
              ) : (
                <Circle
                  className={cn(
                    "size-2.5",
                    p.isConnected ? "fill-devops text-devops" : "fill-muted-foreground text-muted-foreground"
                  )}
                />
              )}
              <span className="font-medium">
                {p.nickname}
                {p.id === state.you.id && <span className="text-muted-foreground"> (you)</span>}
              </span>
            </div>
            {p.isHost ? (
              <Badge variant="outline" className="border-devops/50 text-devops text-[10px]">
                HOST
              </Badge>
            ) : p.isReady ? (
              <Badge variant="outline" className="border-devops/50 text-devops text-[10px] gap-1">
                <Check className="size-3" /> READY
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                NOT READY
              </Badge>
            )}
          </li>
        ))}
      </ul>

      <Separator />

      <div className="flex items-center gap-3">
        {!state.you.isHost && me && (
          <Button
            variant={me.isReady ? "secondary" : "default"}
            onClick={() => actions.toggleReady()}
            className="flex-1"
          >
            {me.isReady ? "Mark as not ready" : "Mark as ready"}
          </Button>
        )}
        {state.you.isHost && (
          <Button
            onClick={handleStart}
            disabled={!canStart || starting}
            className="flex-1 glow-devops"
          >
            {starting ? "Starting..." : canStart ? "Start Game" : "Need 5+ players"}
          </Button>
        )}
        <Button variant="ghost" onClick={handleLeave}>
          <LogOut className="size-4" />
          Leave
        </Button>
      </div>
    </main>
  );
}
