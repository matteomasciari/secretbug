import type { ClientGameState, GameState, RoomState } from "@/types/game";
import { eligibleNominees, getAlivePlayers, teamOf } from "./gameEngine";

/**
 * Builds the per-player redacted view of the game state. This is the ONLY
 * place secret information (roles, hidden hands) may cross the wire, and it
 * must only include what `viewerId` is allowed to know.
 */
export function buildClientState(room: RoomState, viewerId: string): ClientGameState {
  const game: GameState = room.game;
  const viewer = game.players.find((p) => p.id === viewerId);
  const isGameOver = game.phase === "GAME_OVER";

  const players = game.players.map((p) => {
    const revealForEveryone = isGameOver;
    const revealForSelf = p.id === viewerId;
    return {
      id: p.id,
      nickname: p.nickname,
      isHost: p.isHost,
      isReady: p.isReady,
      isConnected: p.isConnected,
      isAlive: p.isAlive,
      seat: p.seat,
      revealedRole: revealForEveryone || revealForSelf ? p.role : null,
    };
  });

  const votes: { [playerId: string]: boolean } = {};
  for (const p of game.players) {
    votes[p.id] = game.votes[p.id] !== undefined;
  }

  const allAliveVoted =
    getAlivePlayers(game).length > 0 &&
    getAlivePlayers(game).every((p) => game.votes[p.id] !== undefined);
  const revealedVotes = allAliveVoted || isGameOver ? { ...game.votes } : null;

  let fellowHackers: { id: string; nickname: string }[] | null = null;
  let juniorDevId: string | null = null;
  if (viewer && (viewer.role === "HACKER" || (viewer.role === "JUNIOR_DEV" && isGameOver))) {
    fellowHackers = game.players
      .filter((p) => p.role === "HACKER" && p.id !== viewer.id)
      .map((p) => ({ id: p.id, nickname: p.nickname }));
    const jd = game.players.find((p) => p.role === "JUNIOR_DEV");
    juniorDevId = jd?.id ?? null;
  }

  const presidentHand =
    viewer && viewer.id === game.leadEngineerId && game.phase === "LEGISLATIVE_PRESIDENT"
      ? game.presidentHand
      : null;
  const chancellorHand =
    viewer && viewer.id === game.codeReviewerId && game.phase === "LEGISLATIVE_CHANCELLOR"
      ? game.chancellorHand
      : null;

  return {
    roomId: room.id,
    roomName: room.settings.name,
    phase: game.phase,
    players,
    leadEngineerId: game.leadEngineerId,
    previousLeadEngineerId: game.previousLeadEngineerId,
    codeReviewerId: game.codeReviewerId,
    previousCodeReviewerId: game.previousCodeReviewerId,
    nominatedReviewerId: game.nominatedReviewerId,
    eligibleNominees: game.phase === "NOMINATION" ? eligibleNominees(game) : [],
    votes,
    revealedVotes,
    stabileCount: game.stabileCount,
    criticoCount: game.criticoCount,
    deployFailureCount: game.deployFailureCount,
    deckCount: game.deck.length,
    discardCount: game.discard.length,
    executionPending: game.executionPending,
    winner: game.winner,
    winReason: game.winReason,
    log: game.log,
    nightReadyCount: game.nightAcks.length,
    nightTotalCount: getAlivePlayers(game).length,
    you: {
      id: viewerId,
      role: viewer?.role ?? null,
      team: teamOf(viewer?.role ?? null),
      fellowHackers,
      juniorDevId,
      presidentHand,
      chancellorHand,
      isHost: viewer?.isHost ?? false,
      nightAcked: viewer ? game.nightAcks.includes(viewer.id) : false,
    },
  };
}
