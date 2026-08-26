"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TerminalSquare } from "lucide-react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSavedNickname } from "@/lib/identity";
import { WaitingRoom } from "@/components/room/WaitingRoom";
import { GameBoard } from "@/components/game/GameBoard";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const {
    state,
    fatalError,
    joinPrompt,
    joinWithNicknamePassword,
    actions,
  } = useGameRoom(roomId);

  if (fatalError) {
    return (
      <ErrorScreen message={fatalError} onBack={() => router.push("/")} />
    );
  }

  if (joinPrompt.needed) {
    return (
      <JoinPromptScreen
        onSubmit={joinWithNicknamePassword}
        error={joinPrompt.error}
        onBack={() => router.push("/")}
      />
    );
  }

  if (!state) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-devops" />
        <p className="font-mono text-sm">$ connecting...</p>
      </main>
    );
  }

  if (state.phase === "LOBBY") {
    return <WaitingRoom state={state} actions={actions} onLeave={() => router.push("/")} />;
  }

  return <GameBoard state={state} actions={actions} onExit={() => router.push("/")} />;
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-hacker">[ERROR] {message}</p>
      <Button variant="outline" onClick={onBack}>
        Back to lobby browser
      </Button>
    </main>
  );
}

function JoinPromptScreen({
  onSubmit,
  error,
  onBack,
}: {
  onSubmit: (nickname: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  error: string | null;
  onBack: () => void;
}) {
  const [nickname, setNickname] = useState(getSavedNickname());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(nickname.trim(), password);
    setLoading(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="flex items-center gap-2">
        <TerminalSquare className="size-6 text-devops" />
        <h1 className="font-mono text-lg font-semibold">join session</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nickname">Player Nickname</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
            autoFocus
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Lobby Password (if any)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={64}
          />
        </div>
        {error && <p className="text-sm text-hacker">{error}</p>}
        <Button type="submit" disabled={loading || !nickname.trim()}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Join
        </Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to lobby browser
        </Button>
      </form>
    </main>
  );
}
