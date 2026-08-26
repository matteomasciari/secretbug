"use client";

import { PlayerSeat } from "./PlayerSeat";
import type { ClientGameState } from "@/types/game";

export function PlayerGrid({ state }: { state: ClientGameState }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
      {state.players.map((p) => (
        <PlayerSeat
          key={p.id}
          player={p}
          isYou={p.id === state.you.id}
          isLeadEngineer={p.id === state.leadEngineerId}
          isCodeReviewer={p.id === state.codeReviewerId}
          isNominee={p.id === state.nominatedReviewerId}
          hasVoted={!!state.votes[p.id]}
        />
      ))}
    </div>
  );
}
