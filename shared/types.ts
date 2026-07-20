// ─── Lobby Types ─────────────────────────────────────────
export interface Lobby {
  id: string;
  code: string;
  gameId: string;
  hostPlayerId: string;
  status: 'OPEN' | 'STARTED' | 'FINISHED';
  maxPlayers: number;
  settings: Record<string, unknown>;
  createdAt: number;
}

export interface LobbyPlayer {
  id: string;
  lobbyId: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  joinedAt: number;
}

export interface LobbyState {
  lobby: Lobby;
  players: LobbyPlayer[];
}

// ─── Game Types ──────────────────────────────────────────
export interface GameMeta {
  id: string;
  name: string;
  icon: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

// ─── WebSocket Message Types ────────────────────────────
export type WsMessageType =
  | 'CONNECTED'
  | 'PING'
  | 'LOBBY_UPDATED'
  | 'GAME_STARTED'
  | 'GAME_STATE'
  | 'YOUR_TURN'
  | 'DICE_ROLL_RESULT'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'ERROR';

export interface WsMessage {
  type: WsMessageType;
  payload?: unknown;
}

// ─── API Types ──────────────────────────────────────────
export interface CreateLobbyRequest {
  gameId: string;
  playerName: string;
  maxPlayers: number;
  settings?: Record<string, unknown>;
}

export interface CreateLobbyResponse {
  lobbyId: string;
  code: string;
  playerId: string;
}

export interface JoinLobbyRequest {
  code: string;
  playerName: string;
}

export interface JoinLobbyResponse {
  lobbyId: string;
  playerId: string;
  lobby: Lobby;
  players: LobbyPlayer[];
}

export interface ApiError {
  error: string;
}
