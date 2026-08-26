"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PartyPopper, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClientGameState, WinReason } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";
import { cn } from "@/lib/utils";

const WIN_REASON_TEXT: Record<WinReason, string> = {
  STABILE_TRACK_COMPLETE: "5 Release Stabili shipped to production.",
  CRITICO_TRACK_COMPLETE: "3 Bug Critici merged to production.",
  JUNIOR_DEV_ELECTED: "The Junior Dev was appointed Code Reviewer.",
  JUNIOR_DEV_EXECUTED: "The Junior Dev was identified and removed from the team.",
};

function roleLabel(role: string) {
  if (role === "DEVOPS") return "DevOps";
  if (role === "HACKER") return "Hacker";
  return "Junior Dev";
}

export function GameOverModal({
  state,
  actions,
  onExit,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
  onExit: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const devopsWon = state.winner === "DEVOPS";

  async function handleReturn() {
    setLoading(true);
    const res = await actions.returnToLobby();
    setLoading(false);
    if (!res.ok) toast.error(res.error ?? "Could not return to lobby.");
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className={cn("sm:max-w-lg", devopsWon ? "border-devops/40" : "border-hacker/40")}
      >
        <DialogHeader className="items-center text-center">
          <PartyPopper className={cn("size-10", devopsWon ? "text-devops" : "text-hacker")} />
          <DialogTitle className="font-mono text-2xl">
            {devopsWon ? "DevOps Team Wins" : "Hacker Team Wins"}
          </DialogTitle>
          <DialogDescription>{state.winReason && WIN_REASON_TEXT[state.winReason]}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {state.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-sm"
            >
              <span className={cn(!p.isAlive && "text-muted-foreground line-through")}>
                {p.nickname}
              </span>
              {p.revealedRole && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-mono",
                    p.revealedRole === "DEVOPS"
                      ? "border-devops/50 text-devops"
                      : "border-hacker/50 text-hacker"
                  )}
                >
                  {roleLabel(p.revealedRole)}
                </Badge>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          {state.you.isHost ? (
            <Button onClick={handleReturn} disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Return to Lobby
            </Button>
          ) : (
            <Button variant="outline" onClick={onExit} className="w-full">
              Back to Lobby Browser
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
