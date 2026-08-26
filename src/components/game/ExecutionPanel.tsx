"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelShell } from "./NominationPanel";
import { cn } from "@/lib/utils";
import type { ClientGameState } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";

export function ExecutionPanel({
  state,
  actions,
}: {
  state: ClientGameState;
  actions: GameRoomActions;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLeadEngineer = state.leadEngineerId === state.you.id;
  const leadNickname = state.players.find((p) => p.id === state.leadEngineerId)?.nickname;

  async function handleExecute() {
    if (!selected) return;
    setLoading(true);
    const res = await actions.execute(selected);
    setLoading(false);
    if (!res.ok) toast.error(res.error ?? "Could not remove that engineer.");
  }

  if (!isLeadEngineer) {
    return (
      <PanelShell title="critical bug threshold reached">
        <p className="text-center text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{leadNickname}</span> must remove one
          engineer from the team.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="remove one engineer from the team">
      <div className="flex flex-wrap justify-center gap-2">
        {state.players
          .filter((p) => p.isAlive && p.id !== state.you.id)
          .map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                selected === p.id
                  ? "border-hacker bg-hacker/15 text-hacker"
                  : "border-border/60 hover:border-hacker/40"
              )}
            >
              {p.nickname}
            </button>
          ))}
      </div>
      <Button onClick={handleExecute} disabled={!selected || loading} variant="destructive" className="glow-hacker">
        <Skull className="size-4" />
        Remove From Team
      </Button>
    </PanelShell>
  );
}
