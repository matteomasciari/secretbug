"use client";

import { Crown, ShieldCheck, Skull, WifiOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PublicPlayer, Role } from "@/types/game";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function roleLabel(role: Role) {
  if (role === "DEVOPS") return "DevOps";
  if (role === "HACKER") return "Hacker";
  return "Junior Dev";
}

function roleColorClass(role: Role) {
  if (role === "DEVOPS") return "border-devops/60 text-devops";
  return "border-hacker/60 text-hacker";
}

export function PlayerSeat({
  player,
  isLeadEngineer,
  isCodeReviewer,
  isNominee,
  isYou,
  hasVoted,
}: {
  player: PublicPlayer;
  isLeadEngineer: boolean;
  isCodeReviewer: boolean;
  isNominee: boolean;
  isYou: boolean;
  hasVoted: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg border border-border/60 px-3 py-3 text-center transition-colors",
        !player.isAlive && "opacity-40 grayscale",
        isYou && "border-devops/50 bg-devops/5",
        isLeadEngineer && "border-primary glow-devops",
        isNominee && !isLeadEngineer && "border-accent"
      )}
    >
      <div className="relative">
        <Avatar className="size-12 border border-border/60">
          <AvatarFallback className="font-mono text-sm">
            {initials(player.nickname)}
          </AvatarFallback>
        </Avatar>
        {isLeadEngineer && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="absolute -top-2 -right-2 rounded-full bg-primary p-1 text-primary-foreground" />
              }
            >
              <Crown className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Lead Engineer</TooltipContent>
          </Tooltip>
        )}
        {isCodeReviewer && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="absolute -bottom-2 -right-2 rounded-full bg-accent p-1 text-accent-foreground" />
              }
            >
              <ShieldCheck className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Code Reviewer</TooltipContent>
          </Tooltip>
        )}
        {!player.isAlive && (
          <span className="absolute -bottom-2 -left-2 rounded-full bg-hacker p-1 text-hacker-foreground">
            <Skull className="size-3" />
          </span>
        )}
        {!player.isConnected && (
          <span className="absolute -top-2 -left-2 rounded-full bg-muted p-1 text-muted-foreground">
            <WifiOff className="size-3" />
          </span>
        )}
      </div>
      <p className="max-w-20 truncate text-xs font-medium">
        {player.nickname}
        {isYou && <span className="text-muted-foreground"> (you)</span>}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {player.revealedRole && (
          <Badge
            variant="outline"
            className={cn("text-[9px] font-mono", roleColorClass(player.revealedRole))}
          >
            {roleLabel(player.revealedRole)}
          </Badge>
        )}
        {hasVoted && (
          <Badge variant="outline" className="text-[9px] font-mono border-devops/50 text-devops">
            voted
          </Badge>
        )}
      </div>
    </div>
  );
}
