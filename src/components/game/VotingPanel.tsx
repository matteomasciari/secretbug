"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelShell } from "./NominationPanel";
import type { ClientGameState } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";
import { cn } from "@/lib/utils";

export function VotingPanel({
  state,
  actions,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
}) {
  const [loading, setLoading] = useState<"APPROVA" | "REJECT" | null>(null);
  const me = state.players.find((p) => p.id === state.you.id);
  const nominee = state.players.find((p) => p.id === state.nominatedReviewerId);
  const leadNickname = state.players.find((p) => p.id === state.leadEngineerId)?.nickname;
  const hasVoted = !!state.votes[state.you.id];
  const votedCount = Object.values(state.votes).filter(Boolean).length;
  const totalAlive = state.players.filter((p) => p.isAlive).length;

  async function castVote(vote: "APPROVA" | "REJECT") {
    setLoading(vote);
    const res = await actions.vote(vote);
    setLoading(null);
    if (!res.ok) toast.error(res.error ?? "Could not vote.");
  }

  if (state.revealedVotes) {
    const approvals = Object.values(state.revealedVotes).filter((v) => v === "APPROVA").length;
    const rejections = Object.values(state.revealedVotes).filter((v) => v === "REJECT").length;
    return (
      <PanelShell title="votes revealed">
        <div className="flex flex-wrap justify-center gap-2">
          {state.players
            .filter((p) => p.isAlive)
            .map((p) => {
              const vote = state.revealedVotes?.[p.id];
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs",
                    vote === "APPROVA" ? "border-devops/50 text-devops" : "border-hacker/50 text-hacker"
                  )}
                >
                  {vote === "APPROVA" ? <Check className="size-3" /> : <X className="size-3" />}
                  {p.nickname}
                </div>
              );
            })}
        </div>
        <p className="text-sm text-muted-foreground">
          {approvals} APPROVA / {rejections} REJECT
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="voting phase">
      <p className="text-center text-sm text-muted-foreground">
        <span className="text-foreground font-medium">{leadNickname}</span> nominated{" "}
        <span className="text-foreground font-medium">{nominee?.nickname}</span> as Code Reviewer.
      </p>
      {me?.isAlive ? (
        hasVoted ? (
          <p className="text-sm text-muted-foreground">
            Vote submitted. Waiting for others... ({votedCount}/{totalAlive})
          </p>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={() => castVote("APPROVA")}
              disabled={loading !== null}
              className="glow-devops bg-devops text-devops-foreground hover:bg-devops/90"
            >
              <Check className="size-4" />
              APPROVA
            </Button>
            <Button
              onClick={() => castVote("REJECT")}
              disabled={loading !== null}
              variant="destructive"
              className="glow-hacker"
            >
              <X className="size-4" />
              REJECT
            </Button>
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          You&apos;ve been removed from the team and can no longer vote. ({votedCount}/{totalAlive})
        </p>
      )}
    </PanelShell>
  );
}
