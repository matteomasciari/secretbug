// Core domain types for Secret Bug, shared between server and client.

export type Team = "DEVOPS" | "HACKER";

export type Role = "DEVOPS" | "HACKER" | "JUNIOR_DEV";

export type PRCard = "STABILE" | "CRITICO";

export type GamePhase =
  | "LOBBY"
  | "NIGHT"
  | "NOMINATION"
  | "VOTING"
  | "LEGISLATIVE_PRESIDENT" // Lead Engineer discards 1 of 3
  | "LEGISLATIVE_CHANCELLOR" // Code Reviewer discards 1 of 2
  | "EXECUTION"
  | "GAME_OVER";

export type VoteValue = "APPROVA" | "REJECT";

export type WinReason =
  | "STABILE_TRACK_COMPLETE"
  | "CRITICO_TRACK_COMPLETE"
  | "JUNIOR_DEV_ELECTED"
  | "JUNIOR_DEV_EXECUTED";

export interface Player {
  id: string; // stable player id (persisted client-side)
  socketId: string | null; // current live socket, null if disconnected
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isAlive: boolean;
  role: Role | null;
  seat: number; // seating order, assigned at game start
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  variant: "system" | "info" | "success" | "danger" | "vote";
}

export interface VoteRecord {
  [playerId: string]: VoteValue | undefined;
}

export interface RoomSettings {
  name: string;
  maxPlayers: number; // 5-10
  hasPassword: boolean;
}

export type RoomStatus = "WAITING" | "IN_GAME";

export interface RoomSummary {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
  hasPassword: boolean;
  hostNickname: string;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  leadEngineerId: string | null;
  previousLeadEngineerId: string | null;
  codeReviewerId: string | null;
  previousCodeReviewerId: string | null;
  nominatedReviewerId: string | null;
  votes: VoteRecord;
  stabileCount: number; // enacted RELEASE STABILE cards (0-5)
  criticoCount: number; // enacted BUG CRITICO cards (0-3)
  deployFailureCount: number; // consecutive rejected votes (0-3)
  deck: PRCard[]; // face-down draw pile
  discard: PRCard[]; // discard pile
  presidentHand: PRCard[]; // 3 cards drawn for Lead Engineer
  chancellorHand: PRCard[]; // 2 cards passed to Code Reviewer
  executionPending: boolean; // execution power armed, awaiting Lead Engineer target
  executionUnlocked: boolean; // becomes true once armed for this game (fires once)
  winner: Team | null;
  winReason: WinReason | null;
  turnOrder: string[]; // player ids in seating order (alive rotation base)
  nightAcks: string[]; // player ids who have acknowledged their role during NIGHT
  log: LogEntry[];
}

export interface RoomState {
  id: string;
  settings: RoomSettings;
  passwordHash: string | null;
  hostId: string;
  createdAt: number;
  game: GameState;
}

// ---- Redacted, per-player view sent to clients ----

export interface PublicPlayer {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isAlive: boolean;
  seat: number;
  // Only populated for the viewing player, or at GAME_OVER for everyone.
  revealedRole: Role | null;
}

export interface ClientGameState {
  roomId: string;
  roomName: string;
  phase: GamePhase;
  players: PublicPlayer[];
  leadEngineerId: string | null;
  previousLeadEngineerId: string | null;
  codeReviewerId: string | null;
  previousCodeReviewerId: string | null;
  nominatedReviewerId: string | null;
  eligibleNominees: string[];
  votes: { [playerId: string]: boolean }; // whether that player has voted, not the value
  revealedVotes: VoteRecord | null; // populated once voting round resolved
  stabileCount: number;
  criticoCount: number;
  deployFailureCount: number;
  deckCount: number;
  discardCount: number;
  executionPending: boolean;
  winner: Team | null;
  winReason: WinReason | null;
  log: LogEntry[];
  nightReadyCount: number;
  nightTotalCount: number;

  // Private, viewer-specific data. Undefined unless applicable to `you`.
  you: {
    id: string;
    role: Role | null;
    team: Team | null;
    fellowHackers: { id: string; nickname: string }[] | null; // only for hackers
    juniorDevId: string | null; // only visible to hackers
    presidentHand: PRCard[] | null; // only when you are Lead Engineer in LEGISLATIVE_PRESIDENT
    chancellorHand: PRCard[] | null; // only when you are Code Reviewer in LEGISLATIVE_CHANCELLOR
    isHost: boolean;
    nightAcked: boolean;
  };
}

export const ROLE_TEAM: Record<Role, Team> = {
  DEVOPS: "DEVOPS",
  HACKER: "HACKER",
  JUNIOR_DEV: "HACKER",
};

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 10;
export const STABILE_GOAL = 5;
export const CRITICO_GOAL = 3;
export const EXECUTION_UNLOCK_AT_CRITICO = 2;
export const DEPLOY_FAILURE_LIMIT = 3;

// deck composition
export const DECK_STABILE_COUNT = 6;
export const DECK_CRITICO_COUNT = 11;

export function roleCountsForPlayers(count: number): {
  devops: number;
  hackers: number;
} {
  // hackers here excludes the Junior Dev
  const table: Record<number, { devops: number; hackers: number }> = {
    5: { devops: 3, hackers: 1 },
    6: { devops: 4, hackers: 1 },
    7: { devops: 4, hackers: 2 },
    8: { devops: 5, hackers: 2 },
    9: { devops: 5, hackers: 3 },
    10: { devops: 6, hackers: 3 },
  };
  return table[count];
}
