import { nanoid } from "nanoid";
import type {
  GameState,
  LogEntry,
  Player,
  PRCard,
  Role,
  RoomState,
  Team,
  VoteValue,
} from "@/types/game";
import {
  CRITICO_GOAL,
  DEPLOY_FAILURE_LIMIT,
  EXECUTION_UNLOCK_AT_CRITICO,
  ROLE_TEAM,
  STABILE_GOAL,
  roleCountsForPlayers,
} from "@/types/game";
import { createDeck, drawCards, shuffle } from "./deck";

export function makeLog(
  message: string,
  variant: LogEntry["variant"] = "system"
): LogEntry {
  return { id: nanoid(8), timestamp: Date.now(), message, variant };
}

export function pushLog(
  game: GameState,
  message: string,
  variant: LogEntry["variant"] = "system"
) {
  game.log.push(makeLog(message, variant));
  if (game.log.length > 200) game.log.shift();
}

export function getPlayer(game: GameState, id: string | null): Player | undefined {
  if (!id) return undefined;
  return game.players.find((p) => p.id === id);
}

export function getAlivePlayers(game: GameState): Player[] {
  return game.players.filter((p) => p.isAlive);
}

/** Returns the next alive player id in seating order after `fromId`. */
export function getNextInRotation(game: GameState, fromId: string): string {
  const order = game.turnOrder;
  const startIdx = order.indexOf(fromId);
  for (let step = 1; step <= order.length; step++) {
    const idx = (startIdx + step) % order.length;
    const candidate = getPlayer(game, order[idx]);
    if (candidate && candidate.isAlive) return candidate.id;
  }
  return fromId;
}

export function eligibleNominees(game: GameState): string[] {
  const alive = getAlivePlayers(game);
  const aliveCount = alive.length;
  return alive
    .filter((p) => p.id !== game.leadEngineerId)
    .filter((p) => p.id !== game.previousCodeReviewerId)
    .filter((p) => aliveCount <= 5 || p.id !== game.previousLeadEngineerId)
    .map((p) => p.id);
}

export function createInitialGameState(players: Player[]): GameState {
  const count = players.length;
  const { devops, hackers } = roleCountsForPlayers(count);

  const roles: Role[] = [
    ...Array(devops).fill("DEVOPS"),
    ...Array(hackers).fill("HACKER"),
    "JUNIOR_DEV",
  ];
  const shuffledRoles = shuffle(roles);

  const seatOrder = shuffle(players.map((p) => p.id));

  const rolledPlayers: Player[] = players.map((p) => {
    const seat = seatOrder.indexOf(p.id);
    return {
      ...p,
      role: shuffledRoles[seat],
      seat,
      isAlive: true,
    };
  });
  rolledPlayers.sort((a, b) => a.seat - b.seat);

  const firstLead = rolledPlayers[0]?.id ?? null;

  const game: GameState = {
    phase: "NIGHT",
    players: rolledPlayers,
    leadEngineerId: firstLead,
    previousLeadEngineerId: null,
    codeReviewerId: null,
    previousCodeReviewerId: null,
    nominatedReviewerId: null,
    votes: {},
    stabileCount: 0,
    criticoCount: 0,
    deployFailureCount: 0,
    deck: createDeck(),
    discard: [],
    presidentHand: [],
    chancellorHand: [],
    executionPending: false,
    executionUnlocked: false,
    winner: null,
    winReason: null,
    turnOrder: rolledPlayers.map((p) => p.id),
    nightAcks: [],
    log: [],
  };

  pushLog(game, `Role assignment complete. ${count} engineers on the team.`, "system");
  pushLog(
    game,
    `${getPlayer(game, firstLead)?.nickname ?? "Someone"} is the first Lead Engineer.`,
    "info"
  );

  return game;
}

export function acknowledgeNight(game: GameState, playerId: string) {
  if (game.phase !== "NIGHT") return;
  if (!game.nightAcks.includes(playerId)) game.nightAcks.push(playerId);

  const aliveIds = getAlivePlayers(game).map((p) => p.id);
  const allAcked = aliveIds.every((id) => game.nightAcks.includes(id));
  if (allAcked) {
    game.phase = "NOMINATION";
    pushLog(game, "All engineers have reviewed their assignment. Nomination phase begins.", "system");
  }
}

export function nominate(game: GameState, actorId: string, nomineeId: string): string | null {
  if (game.phase !== "NOMINATION") return "Not in nomination phase.";
  if (actorId !== game.leadEngineerId) return "Only the Lead Engineer can nominate.";
  if (!eligibleNominees(game).includes(nomineeId)) return "That player is not eligible.";

  game.nominatedReviewerId = nomineeId;
  game.votes = {};
  game.phase = "VOTING";
  pushLog(
    game,
    `Lead Engineer ${getPlayer(game, actorId)?.nickname} nominated ${
      getPlayer(game, nomineeId)?.nickname
    } as Code Reviewer.`,
    "info"
  );
  return null;
}

export function castVote(game: GameState, playerId: string, vote: VoteValue): string | null {
  if (game.phase !== "VOTING") return "Not in voting phase.";
  const player = getPlayer(game, playerId);
  if (!player || !player.isAlive) return "You are not eligible to vote.";
  if (game.votes[playerId]) return "You already voted.";

  game.votes[playerId] = vote;
  pushLog(game, `${player.nickname} cast a vote.`, "vote");
  return null;
}

export interface VoteResolution {
  resolved: boolean;
  approved?: boolean;
  gameOver?: boolean;
}

export function allVotesIn(game: GameState): boolean {
  const alive = getAlivePlayers(game);
  return alive.every((p) => game.votes[p.id] !== undefined);
}

export function resolveVotes(game: GameState): VoteResolution {
  if (!allVotesIn(game)) return { resolved: false };

  const alive = getAlivePlayers(game);
  const approvals = alive.filter((p) => game.votes[p.id] === "APPROVA").length;
  const rejections = alive.length - approvals;
  const approved = approvals > rejections;

  pushLog(
    game,
    `Vote result: ${approvals} APPROVA / ${rejections} REJECT. Government ${
      approved ? "approved" : "rejected"
    }.`,
    approved ? "success" : "danger"
  );

  if (approved) {
    game.deployFailureCount = 0;
    game.codeReviewerId = game.nominatedReviewerId;

    const reviewer = getPlayer(game, game.codeReviewerId);
    if (reviewer?.role === "JUNIOR_DEV" && game.criticoCount >= EXECUTION_UNLOCK_AT_CRITICO) {
      game.winner = "HACKER";
      game.winReason = "JUNIOR_DEV_ELECTED";
      game.phase = "GAME_OVER";
      pushLog(
        game,
        `${reviewer.nickname} was the Junior Dev all along, now appointed Code Reviewer. Hackers win!`,
        "danger"
      );
      return { resolved: true, approved: true, gameOver: true };
    }

    const { drawn, deck, discard } = drawCards(game.deck, game.discard, 3);
    game.deck = deck;
    game.discard = discard;
    game.presidentHand = drawn;
    game.chancellorHand = [];
    game.phase = "LEGISLATIVE_PRESIDENT";
    pushLog(game, `Lead Engineer is reviewing 3 pull requests.`, "system");
    return { resolved: true, approved: true };
  }

  game.deployFailureCount += 1;
  game.nominatedReviewerId = null;
  game.codeReviewerId = null;

  if (game.deployFailureCount >= DEPLOY_FAILURE_LIMIT) {
    const { drawn, deck, discard } = drawCards(game.deck, game.discard, 1);
    game.deck = deck;
    game.discard = discard;
    const [card] = drawn;
    enactCard(game, card, true);
    game.deployFailureCount = 0;
    game.previousLeadEngineerId = null;
    game.previousCodeReviewerId = null;
    pushLog(
      game,
      `3 consecutive deploy failures! CI auto-merges the top PR: ${cardLabel(card)}.`,
      "danger"
    );

    if (game.winner) return { resolved: true, approved: false, gameOver: true };
  }

  game.previousLeadEngineerId = game.leadEngineerId;
  const nextLead = getNextInRotation(game, game.leadEngineerId!);
  game.leadEngineerId = nextLead;
  game.votes = {};
  game.phase = "NOMINATION";
  pushLog(
    game,
    `${getPlayer(game, nextLead)?.nickname} is now the Lead Engineer.`,
    "info"
  );

  return { resolved: true, approved: false };
}

function cardLabel(card: PRCard) {
  return card === "STABILE" ? "RELEASE STABILE" : "BUG CRITICO";
}

function enactCard(game: GameState, card: PRCard, isChaos: boolean) {
  if (card === "STABILE") {
    game.stabileCount += 1;
  } else {
    game.criticoCount += 1;
  }
  pushLog(
    game,
    `${isChaos ? "Auto-enacted" : "Enacted"}: ${cardLabel(card)}. (${game.stabileCount}/${STABILE_GOAL} stable, ${game.criticoCount}/${CRITICO_GOAL} critical)`,
    card === "STABILE" ? "success" : "danger"
  );
  checkTrackWinConditions(game);
}

function checkTrackWinConditions(game: GameState) {
  if (game.stabileCount >= STABILE_GOAL) {
    game.winner = "DEVOPS";
    game.winReason = "STABILE_TRACK_COMPLETE";
    game.phase = "GAME_OVER";
    pushLog(game, `5 Release Stabili shipped. DevOps Team wins!`, "success");
    return;
  }
  if (game.criticoCount >= CRITICO_GOAL) {
    game.winner = "HACKER";
    game.winReason = "CRITICO_TRACK_COMPLETE";
    game.phase = "GAME_OVER";
    pushLog(game, `3 Bug Critici merged to production. Hacker Team wins!`, "danger");
    return;
  }
}

export function presidentDiscard(game: GameState, actorId: string, card: PRCard): string | null {
  if (game.phase !== "LEGISLATIVE_PRESIDENT") return "Not the right phase.";
  if (actorId !== game.leadEngineerId) return "Only the Lead Engineer can act now.";
  const idx = game.presidentHand.indexOf(card);
  if (idx === -1) return "Invalid card.";

  const remaining = [...game.presidentHand];
  remaining.splice(idx, 1);
  game.discard.push(card);
  game.chancellorHand = remaining;
  game.presidentHand = [];
  game.phase = "LEGISLATIVE_CHANCELLOR";
  pushLog(game, `Lead Engineer passed 2 pull requests to the Code Reviewer.`, "system");
  return null;
}

export function chancellorDiscard(game: GameState, actorId: string, card: PRCard): string | null {
  if (game.phase !== "LEGISLATIVE_CHANCELLOR") return "Not the right phase.";
  if (actorId !== game.codeReviewerId) return "Only the Code Reviewer can act now.";
  const idx = game.chancellorHand.indexOf(card);
  if (idx === -1) return "Invalid card.";

  const remaining = [...game.chancellorHand];
  remaining.splice(idx, 1);
  game.discard.push(card);
  const [enacted] = remaining;
  game.chancellorHand = [];

  enactCard(game, enacted, false);
  if (game.winner) return null;

  if (game.criticoCount >= EXECUTION_UNLOCK_AT_CRITICO && !game.executionUnlocked) {
    game.phase = "EXECUTION";
    game.executionPending = true;
    pushLog(
      game,
      `Critical bug threshold reached. Lead Engineer must remove one engineer from the team.`,
      "danger"
    );
    return null;
  }

  advanceRound(game);
  return null;
}

export function executeTarget(game: GameState, actorId: string, targetId: string): string | null {
  if (game.phase !== "EXECUTION") return "Not the right phase.";
  if (actorId !== game.leadEngineerId) return "Only the Lead Engineer can act now.";
  const target = getPlayer(game, targetId);
  if (!target || !target.isAlive) return "Invalid target.";

  target.isAlive = false;
  game.executionPending = false;
  game.executionUnlocked = true;

  if (target.role === "JUNIOR_DEV") {
    game.winner = "DEVOPS";
    game.winReason = "JUNIOR_DEV_EXECUTED";
    game.phase = "GAME_OVER";
    pushLog(
      game,
      `${target.nickname} was removed from the team and revealed as the Junior Dev. DevOps Team wins!`,
      "success"
    );
    return null;
  }

  pushLog(game, `${target.nickname} was removed from the team.`, "danger");
  advanceRound(game);
  return null;
}

function advanceRound(game: GameState) {
  game.previousLeadEngineerId = game.leadEngineerId;
  game.previousCodeReviewerId = game.codeReviewerId;
  const nextLead = getNextInRotation(game, game.leadEngineerId!);
  game.leadEngineerId = nextLead;
  game.codeReviewerId = null;
  game.nominatedReviewerId = null;
  game.votes = {};
  game.phase = "NOMINATION";
  pushLog(game, `${getPlayer(game, nextLead)?.nickname} is now the Lead Engineer.`, "info");
}

export function teamOf(role: Role | null): Team | null {
  return role ? ROLE_TEAM[role] : null;
}

export function resetRoomToLobby(room: RoomState) {
  room.game.players = room.game.players.map((p) => ({
    ...p,
    role: null,
    isAlive: true,
    isReady: p.isHost,
  }));
  room.game = {
    phase: "LOBBY",
    players: room.game.players,
    leadEngineerId: null,
    previousLeadEngineerId: null,
    codeReviewerId: null,
    previousCodeReviewerId: null,
    nominatedReviewerId: null,
    votes: {},
    stabileCount: 0,
    criticoCount: 0,
    deployFailureCount: 0,
    deck: [],
    discard: [],
    presidentHand: [],
    chancellorHand: [],
    executionPending: false,
    executionUnlocked: false,
    winner: null,
    winReason: null,
    turnOrder: [],
    nightAcks: [],
    log: [],
  };
}
