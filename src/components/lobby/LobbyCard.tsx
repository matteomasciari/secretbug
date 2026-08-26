"use client";

import { Lock, Users, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RoomSummary } from "@/types/game";
import { cn } from "@/lib/utils";

export function LobbyCard({ room, onClick }: { room: RoomSummary; onClick: () => void }) {
  const full = room.playerCount >= room.maxPlayers;
  const inGame = room.status === "IN_GAME";
  const disabled = full || inGame;

  return (
    <Card
      role="button"
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "border-border/60 transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:border-devops/50 hover:glow-devops"
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {room.hasPassword ? (
            <Lock className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Circle className="size-4 shrink-0 text-devops fill-devops" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{room.name}</p>
            <p className="truncate text-xs text-muted-foreground">host: {room.hostNickname}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="size-3.5" />
            {room.playerCount}/{room.maxPlayers}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px] uppercase tracking-wide",
              inGame ? "border-hacker/50 text-hacker" : "border-devops/50 text-devops"
            )}
          >
            {inGame ? "in game" : "waiting"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
