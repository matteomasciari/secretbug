"use client";

import { LogOut, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StabileTrack, CriticoTrack, DeployFailureTracker, DeckPile } from "./Tracks";
import { PlayerGrid } from "./PlayerGrid";
import { ActivityLog } from "./ActivityLog";
import { RoleRevealModal } from "./RoleRevealModal";
import { NominationPanel } from "./NominationPanel";
import { VotingPanel } from "./VotingPanel";
import { LegislativePanel } from "./LegislativePanel";
import { ExecutionPanel } from "./ExecutionPanel";
import { GameOverModal } from "./GameOverModal";
import type { ClientGameState, GamePhase } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";

const PHASE_LABEL: Record<GamePhase, string> = {
  LOBBY: "lobby",
  NIGHT: "role assignment",
  NOMINATION: "nomination",
  VOTING: "voting",
  LEGISLATIVE_PRESIDENT: "pr review",
  LEGISLATIVE_CHANCELLOR: "pr review",
  EXECUTION: "execution",
  GAME_OVER: "game over",
};

export function GameBoard({
  state,
  actions,
  onExit,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
  onExit: () => void;
}) {
  async function handleLeave() {
    await actions.leave();
    onExit();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bug className="size-5 text-devops" />
          <h1 className="text-lg font-bold tracking-tight">{state.roomName}</h1>
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
            {PHASE_LABEL[state.phase]}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLeave}>
          <LogOut className="size-4" />
          Leave
        </Button>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border/60 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <StabileTrack count={state.stabileCount} />
          <CriticoTrack count={state.criticoCount} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DeployFailureTracker count={state.deployFailureCount} />
          <DeckPile deckCount={state.deckCount} discardCount={state.discardCount} />
        </div>
      </section>

      <PlayerGrid state={state} />

      <PhasePanel state={state} actions={actions} />

      <ActivityLog log={state.log} />

      {state.phase === "NIGHT" && !state.you.nightAcked && (
        <RoleRevealModal state={state} actions={actions} />
      )}
      {state.phase === "GAME_OVER" && (
        <GameOverModal state={state} actions={actions} onExit={onExit} />
      )}
    </main>
  );
}

function PhasePanel({
  state,
  actions,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
}) {
  switch (state.phase) {
    case "NOMINATION":
      return <NominationPanel state={state} actions={actions} />;
    case "VOTING":
      return <VotingPanel state={state} actions={actions} />;
    case "LEGISLATIVE_PRESIDENT":
    case "LEGISLATIVE_CHANCELLOR":
      return <LegislativePanel state={state} actions={actions} />;
    case "EXECUTION":
      return <ExecutionPanel state={state} actions={actions} />;
    default:
      return null;
  }
}
