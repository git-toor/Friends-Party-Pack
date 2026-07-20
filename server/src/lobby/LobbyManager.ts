import { v4 as uuid } from 'uuid';
import { LobbyRepository } from './LobbyRepository.js';

// ─── Types ─────────────────────────────────────────────────
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

export interface CreateLobbyRequest {
  gameId: string;
  playerName: string;
  maxPlayers: number;
  settings?: Record<string, unknown>;
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

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;
const MAX_CODE_GENERATION_ATTEMPTS = 20;

export class LobbyManager {
  private repo = new LobbyRepository();

  generateCode(): string {
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      let code = '';
      for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      if (!this.repo.findByCode(code)) return code;
    }
    return uuid().slice(0, 4).toUpperCase();
  }

  create(req: CreateLobbyRequest): { lobby: Lobby; playerId: string } | ApiError {
    if (!req.gameId || !req.playerName?.trim()) {
      return { error: 'gameId and playerName are required' };
    }
    const maxPlayers = Math.min(Math.max(req.maxPlayers || 4, 2), 8);
    const playerId = uuid();
    const lobby: Lobby = {
      id: uuid(),
      code: this.generateCode(),
      gameId: req.gameId,
      hostPlayerId: playerId,
      status: 'OPEN',
      maxPlayers,
      settings: req.settings || {},
      createdAt: Date.now(),
    };
    this.repo.create(lobby);
    this.repo.addPlayer({
      id: playerId,
      lobbyId: lobby.id,
      name: req.playerName.trim(),
      isHost: true,
      ready: false,
      joinedAt: Date.now(),
    });
    return { lobby, playerId };
  }

  join(code: string, playerName: string): JoinLobbyResponse | ApiError {
    if (!playerName?.trim()) return { error: 'Name is required' };
    const lobby = this.repo.findByCode(code.toUpperCase());
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.status !== 'OPEN') return { error: 'Game already started' };

    const players = this.repo.getPlayers(lobby.id);
    if (players.length >= lobby.maxPlayers) return { error: 'Lobby is full' };
    if (players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      return { error: 'Name already taken' };
    }

    const playerId = uuid();
    const player: LobbyPlayer = {
      id: playerId,
      lobbyId: lobby.id,
      name: playerName.trim(),
      isHost: false,
      ready: false,
      joinedAt: Date.now(),
    };
    this.repo.addPlayer(player);

    return { lobbyId: lobby.id, playerId, lobby, players: [...players, player] };
  }

  ready(lobbyId: string, playerId: string, isReady: boolean): LobbyState | ApiError {
    const lobby = this.repo.findById(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    this.repo.setReady(lobbyId, playerId, isReady);
    return this.getState(lobbyId);
  }

  start(lobbyId: string, playerId: string): LobbyState | ApiError {
    const lobby = this.repo.findById(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostPlayerId !== playerId) return { error: 'Only host can start' };
    if (lobby.status !== 'OPEN') return { error: 'Already started' };

    const players = this.repo.getPlayers(lobbyId);
    if (players.length < 2) return { error: 'Need at least 2 players' };
    if (!players.every(p => p.ready)) return { error: 'Not all players ready' };

    this.repo.updateStatus(lobbyId, 'STARTED');
    return this.getState(lobbyId);
  }

  leave(lobbyId: string, playerId: string): LobbyState | ApiError {
    const lobby = this.repo.findById(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    this.repo.removePlayer(lobbyId, playerId);
    return this.getState(lobbyId);
  }

  getState(lobbyId: string): LobbyState {
    const lobby = this.repo.findById(lobbyId)!;
    const players = this.repo.getPlayers(lobbyId);
    return { lobby, players };
  }
}
