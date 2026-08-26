import type { ClientGameState, RoomSummary, VoteValue, PRCard } from "./game";

export interface AckResponse<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface CreateRoomPayload {
  lobbyName: string;
  password: string; // empty string = no password
  hostNickname: string;
  maxPlayers: number;
  playerId: string; // client-persisted id
}

export interface JoinRoomPayload {
  roomId: string;
  nickname: string;
  password: string;
  playerId: string;
}

export interface RejoinRoomPayload {
  roomId: string;
  playerId: string;
}

export interface NominatePayload {
  roomId: string;
  nomineeId: string;
}

export interface VotePayload {
  roomId: string;
  vote: VoteValue;
}

export interface DiscardPayload {
  roomId: string;
  card: PRCard;
}

export interface ExecutePayload {
  roomId: string;
  targetId: string;
}

export interface ClientToServerEvents {
  "lobby:list": (cb: (rooms: RoomSummary[]) => void) => void;
  "lobby:create": (
    payload: CreateRoomPayload,
    cb: (res: AckResponse<{ roomId: string }>) => void
  ) => void;
  "lobby:join": (
    payload: JoinRoomPayload,
    cb: (res: AckResponse<{ roomId: string }>) => void
  ) => void;
  "lobby:rejoin": (
    payload: RejoinRoomPayload,
    cb: (res: AckResponse<{ roomId: string }>) => void
  ) => void;
  "lobby:leave": (payload: { roomId: string }, cb: (res: AckResponse) => void) => void;
  "lobby:toggleReady": (payload: { roomId: string }, cb: (res: AckResponse) => void) => void;
  "lobby:startGame": (payload: { roomId: string }, cb: (res: AckResponse) => void) => void;

  "game:acknowledgeNight": (payload: { roomId: string }, cb: (res: AckResponse) => void) => void;
  "game:nominate": (payload: NominatePayload, cb: (res: AckResponse) => void) => void;
  "game:vote": (payload: VotePayload, cb: (res: AckResponse) => void) => void;
  "game:presidentDiscard": (payload: DiscardPayload, cb: (res: AckResponse) => void) => void;
  "game:chancellorDiscard": (payload: DiscardPayload, cb: (res: AckResponse) => void) => void;
  "game:execute": (payload: ExecutePayload, cb: (res: AckResponse) => void) => void;
  "game:returnToLobby": (payload: { roomId: string }, cb: (res: AckResponse) => void) => void;
}

export interface ServerToClientEvents {
  "lobby:rooms": (rooms: RoomSummary[]) => void;
  "game:state": (state: ClientGameState) => void;
  "game:error": (message: string) => void;
  "room:kicked": (reason: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

export interface SocketData {
  playerId?: string;
  roomId?: string;
}
