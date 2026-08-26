"use client";

import { AlertTriangle, Layers } from "lucide-react";
import { CRITICO_GOAL, DEPLOY_FAILURE_LIMIT, STABILE_GOAL } from "@/types/game";
import { cn } from "@/lib/utils";

export function StabileTrack({ count }: { count: number }) {
  return (
    <TrackRow label="RELEASE STABILE" accent="devops">
      {Array.from({ length: STABILE_GOAL }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex h-10 flex-1 items-center justify-center rounded-sm border font-mono text-xs font-bold",
            i < count
              ? "border-devops bg-devops/20 text-devops glow-devops"
              : "border-border/60 text-muted-foreground/40"
          )}
        >
          {i < count ? "✓" : i + 1}
        </div>
      ))}
    </TrackRow>
  );
}

export function CriticoTrack({ count }: { count: number }) {
  return (
    <TrackRow label="BUG CRITICO" accent="hacker">
      {Array.from({ length: CRITICO_GOAL }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex h-10 flex-1 items-center justify-center rounded-sm border font-mono text-xs font-bold",
            i < count
              ? "border-hacker bg-hacker/20 text-hacker glow-hacker"
              : "border-border/60 text-muted-foreground/40"
          )}
        >
          {i < count ? "✗" : i + 1}
        </div>
      ))}
    </TrackRow>
  );
}

function TrackRow({
  label,
  accent,
  children,
}: {
  label: string;
  accent: "devops" | "hacker";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p
        className={cn(
          "font-mono text-[10px] uppercase tracking-widest",
          accent === "devops" ? "text-devops" : "text-hacker"
        )}
      >
        {label}
      </p>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}

export function DeployFailureTracker({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <AlertTriangle className="size-3" />
        Deploy Failures
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: DEPLOY_FAILURE_LIMIT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "size-6 rounded-full border",
              i < count ? "border-hacker bg-hacker" : "border-border/60"
            )}
          />
        ))}
        <span className="ml-1 font-mono text-xs text-muted-foreground">
          {count}/{DEPLOY_FAILURE_LIMIT}
        </span>
      </div>
    </div>
  );
}

export function DeckPile({ deckCount, discardCount }: { deckCount: number; discardCount: number }) {
  return (
    <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Layers className="size-3.5" /> deck: {deckCount}
      </span>
      <span className="flex items-center gap-1">
        <Layers className="size-3.5 opacity-50" /> discard: {discardCount}
      </span>
    </div>
  );
}
