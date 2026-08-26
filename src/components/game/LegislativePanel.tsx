"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PanelShell } from "./NominationPanel";
import { PRCardView } from "./PRCardView";
import type { ClientGameState, PRCard } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";

export function LegislativePanel({
  state,
  actions,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const leadNickname = state.players.find((p) => p.id === state.leadEngineerId)?.nickname;
  const reviewerNickname = state.players.find((p) => p.id === state.codeReviewerId)?.nickname;

  const isPresidentPhase = state.phase === "LEGISLATIVE_PRESIDENT";
  const hand = isPresidentPhase ? state.you.presidentHand : state.you.chancellorHand;
  const isActor = hand !== null && hand !== undefined;

  if (!isActor) {
    return (
      <PanelShell title={isPresidentPhase ? "pr review — lead engineer" : "pr review — code reviewer"}>
        <p className="text-center text-sm text-muted-foreground">
          {isPresidentPhase
            ? `${leadNickname} is reviewing 3 pull requests and will pass 2 along.`
            : `${reviewerNickname} is reviewing 2 pull requests and will merge 1.`}
        </p>
      </PanelShell>
    );
  }

  async function handleDiscard() {
    if (selected === null || !hand) return;
    setLoading(true);
    const card = hand[selected];
    const res = isPresidentPhase
      ? await actions.presidentDiscard(card as PRCard)
      : await actions.chancellorDiscard(card as PRCard);
    setLoading(false);
    setSelected(null);
    if (!res.ok) toast.error(res.error ?? "Could not discard.");
  }

  return (
    <PanelShell
      title={isPresidentPhase ? "choose 1 to discard, pass 2 along" : "choose 1 to discard, merge the other"}
    >
      <div className="flex gap-3">
        {hand?.map((card, i) => (
          <PRCardView
            key={i}
            card={card}
            selected={selected === i}
            onClick={() => setSelected(i)}
            disabled={loading}
          />
        ))}
      </div>
      <Button onClick={handleDiscard} disabled={selected === null || loading} variant="destructive">
        Discard Selected
      </Button>
    </PanelShell>
  );
}
