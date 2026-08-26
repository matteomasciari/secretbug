"use client";

import { CheckCircle2, Bug } from "lucide-react";
import type { PRCard } from "@/types/game";
import { cn } from "@/lib/utils";

export function PRCardView({
  card,
  selected,
  onClick,
  disabled,
}: {
  card: PRCard;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const isStabile = card === "STABILE";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        "flex h-32 w-24 flex-col items-center justify-center gap-2 rounded-lg border-2 font-mono text-xs font-semibold transition-transform",
        isStabile
          ? "border-devops bg-devops/10 text-devops"
          : "border-hacker bg-hacker/10 text-hacker",
        onClick && "cursor-pointer hover:scale-105",
        selected && "ring-2 ring-offset-2 ring-offset-background scale-105",
        selected && (isStabile ? "ring-devops" : "ring-hacker"),
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {isStabile ? <CheckCircle2 className="size-8" /> : <Bug className="size-8" />}
      <span className="whitespace-pre-line text-center leading-tight">
        {isStabile ? "RELEASE\nSTABILE" : "BUG\nCRITICO"}
      </span>
    </button>
  );
}
