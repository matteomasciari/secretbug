"use client";

import { useState } from "react";
import { Bug, ShieldAlert, UserCog, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ClientGameState } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";
import { cn } from "@/lib/utils";

export function RoleRevealModal({
  state,
  actions,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
}) {
  const [loading, setLoading] = useState(false);
  const { role, team, fellowHackers, juniorDevId, nightAcked } = state.you;

  async function handleAck() {
    setLoading(true);
    await actions.acknowledgeNight();
    setLoading(false);
  }

  const isHacker = role === "HACKER";
  const isJuniorDev = role === "JUNIOR_DEV";
  const isDevops = role === "DEVOPS";

  const juniorDevNickname = state.players.find((p) => p.id === juniorDevId)?.nickname;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "sm:max-w-md",
          isDevops && "border-devops/40",
          (isHacker || isJuniorDev) && "border-hacker/40"
        )}
      >
        <DialogHeader className="items-center text-center">
          {isDevops && <UserCog className="size-10 text-devops" />}
          {isHacker && <Bug className="size-10 text-hacker" />}
          {isJuniorDev && <ShieldAlert className="size-10 text-hacker" />}
          <DialogTitle className="font-mono text-xl">
            {isDevops && "You are on the DevOps Team"}
            {isHacker && "You are a Hacker"}
            {isJuniorDev && "You are the Junior Dev"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isDevops &&
              "Ship 5 Release Stabili, or help the team identify and vote out the Junior Dev."}
            {isHacker &&
              "Sneak 3 Bug Critici into production, or get the Junior Dev appointed Code Reviewer."}
            {isJuniorDev &&
              "You don't know who the Hackers are. If you're appointed Code Reviewer after 2 Bug Critici, your team wins instantly. Don't get executed."}
          </DialogDescription>
        </DialogHeader>

        {isHacker && fellowHackers && (
          <div className="rounded-md border border-hacker/30 bg-hacker/5 p-3 text-sm">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-hacker">
              fellow hackers
            </p>
            {fellowHackers.length === 0 ? (
              <p className="text-muted-foreground">None — you&apos;re working solo.</p>
            ) : (
              <ul className="list-inside list-disc">
                {fellowHackers.map((h) => (
                  <li key={h.id}>{h.nickname}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-hacker">
              junior dev
            </p>
            <p>{juniorDevNickname ?? "unknown"}</p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {state.nightReadyCount}/{state.nightTotalCount} engineers have reviewed their assignment
        </p>

        <DialogFooter>
          <Button
            className="w-full"
            variant={team === "HACKER" ? "destructive" : "default"}
            onClick={handleAck}
            disabled={loading || nightAcked}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {nightAcked ? "Waiting for others..." : "Understood"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
