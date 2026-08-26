"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClientGameState } from "@/types/game";
import type { GameRoomActions } from "@/hooks/useGameRoom";

export function NominationPanel({
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

  async function handleNominate() {
    if (!selected) return;
    setLoading(true);
    const res = await actions.nominate(selected);
    setLoading(false);
    if (!res.ok) toast.error(res.error ?? "Could not nominate.");
  }

  if (!isLeadEngineer) {
    return (
      <PanelShell title="nomination phase">
        <p className="text-center text-sm text-muted-foreground">
          Waiting for <span className="text-foreground font-medium">{leadNickname}</span> to
          nominate a Code Reviewer...
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="nomination phase — your turn">
      <p className="text-center text-sm text-muted-foreground">
        Select an engineer to nominate as Code Reviewer.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {state.eligibleNominees.map((id) => {
          const p = state.players.find((pl) => pl.id === id);
          if (!p) return null;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                selected === id
                  ? "border-devops bg-devops/15 text-devops"
                  : "border-border/60 hover:border-devops/40"
              )}
            >
              {p.nickname}
            </button>
          );
        })}
      </div>
      <Button
        onClick={handleNominate}
        disabled={!selected || loading}
        className="glow-devops mx-auto"
      >
        <UserCheck className="size-4" />
        Nominate
      </Button>
    </PanelShell>
  );
}

export function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border/60 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}
