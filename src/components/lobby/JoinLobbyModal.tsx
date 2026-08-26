"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLobbyBrowser } from "@/hooks/useLobbyBrowser";
import { getSavedNickname, rememberRoom } from "@/lib/identity";
import type { RoomSummary } from "@/types/game";

export function JoinLobbyModal({
  room,
  open,
  onOpenChange,
}: {
  room: RoomSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { joinRoom } = useLobbyBrowser();
  const [nickname, setNickname] = useState(getSavedNickname());
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!room) return;
    setError(null);
    if (!nickname.trim()) {
      setError("Nickname is required.");
      return;
    }
    setLoading(true);
    const res = await joinRoom({ roomId: room.id, nickname: nickname.trim(), password });
    setLoading(false);
    if (!res.ok || !res.roomId) {
      setError(res.error ?? "Failed to join lobby.");
      return;
    }
    rememberRoom(res.roomId);
    onOpenChange(false);
    router.push(`/room/${res.roomId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-tight flex items-center gap-2">
            $ join {room?.name}
            {room?.hasPassword && <Lock className="size-4 text-muted-foreground" />}
          </DialogTitle>
          <DialogDescription>
            {room ? `${room.playerCount}/${room.maxPlayers} engineers connected.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="join-nickname">Player Nickname</Label>
            <Input
              id="join-nickname"
              placeholder="e.g. octocat"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={24}
              autoFocus
            />
          </div>
          {room?.hasPassword && (
            <div className="grid gap-2">
              <Label htmlFor="join-password">Lobby Password</Label>
              <Input
                id="join-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={64}
              />
            </div>
          )}
          {error && <p className="text-sm text-hacker">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Join Lobby
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
