"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalSquare, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLobbyBrowser } from "@/hooks/useLobbyBrowser";
import { getSavedNickname, rememberRoom } from "@/lib/identity";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/types/game";

export function CreateLobbyModal() {
  const router = useRouter();
  const { createRoom } = useLobbyBrowser();
  const [open, setOpen] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [password, setPassword] = useState("");
  const [hostNickname, setHostNickname] = useState(getSavedNickname());
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!lobbyName.trim() || !hostNickname.trim()) {
      setError("Lobby name and nickname are required.");
      return;
    }
    setLoading(true);
    const res = await createRoom({
      lobbyName: lobbyName.trim(),
      password,
      hostNickname: hostNickname.trim(),
      maxPlayers,
    });
    setLoading(false);
    if (!res.ok || !res.roomId) {
      setError(res.error ?? "Failed to create lobby.");
      return;
    }
    rememberRoom(res.roomId);
    setOpen(false);
    router.push(`/room/${res.roomId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="glow-devops font-semibold" />}>
        <TerminalSquare className="size-4" />
        New Lobby
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-devops/20">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-tight">$ init --new-lobby</DialogTitle>
          <DialogDescription>
            Spin up a new session. You&apos;ll be the host and Lead Engineer rotation starts once
            5+ engineers join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lobby-name">Lobby Name</Label>
            <Input
              id="lobby-name"
              placeholder="e.g. prod-standup"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lobby-password">Lobby Password (optional)</Label>
            <Input
              id="lobby-password"
              type="password"
              placeholder="leave empty for public"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={64}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="host-nickname">Your Nickname</Label>
            <Input
              id="host-nickname"
              placeholder="e.g. root"
              value={hostNickname}
              onChange={(e) => setHostNickname(e.target.value)}
              maxLength={24}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="max-players">Max Players ({MIN_PLAYERS}-{MAX_PLAYERS})</Label>
            <Input
              id="max-players"
              type="number"
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              onBlur={() =>
                setMaxPlayers((v) => Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, v || MIN_PLAYERS)))
              }
            />
          </div>
          {error && <p className="text-sm text-hacker">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full glow-devops">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create Lobby
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
