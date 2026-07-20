import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LobbyManager, type CreateLobbyRequest } from '../src/lobby/LobbyManager.js';

describe('Phase 3: Lobby System', () => {
  const manager = new LobbyManager();
  let lobbyId: string;
  let hostId: string;
  let guestId: string;

  it('generates 4-char codes', () => {
    for (let i = 0; i < 100; i++) {
      const code = (manager as any).generateCode();
      expect(code).toHaveLength(4);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it('creates a lobby', () => {
    const req: CreateLobbyRequest = { gameId: 'yahtzee', playerName: 'Host', maxPlayers: 4 };
    const result = manager.create(req);
    expect('error' in result).toBe(false);
    const r = result as any;
    expect(r.lobby.code).toHaveLength(4);
    expect(r.lobby.gameId).toBe('yahtzee');
    expect(r.lobby.status).toBe('OPEN');
    expect(r.playerId).toBeTruthy();
    lobbyId = r.lobby.id;
    hostId = r.playerId;
  });

  it('rejects invalid create requests', () => {
    const r = manager.create({} as any);
    expect('error' in r).toBe(true);
    expect((r as any).error).toBeTruthy();
  });

  it('joins a lobby', () => {
    const lobby = (manager as any).repo.findById(lobbyId);
    const result = manager.join(lobby.code, 'Alice');
    expect('error' in result).toBe(false);
    const r = result as any;
    expect(r.players).toHaveLength(2);
    guestId = r.playerId;
  });

  it('rejects duplicate names', () => {
    const lobby = (manager as any).repo.findById(lobbyId);
    const result = manager.join(lobby.code, 'Alice');
    expect('error' in result).toBe(true);
  });

  it('rejects join for nonexistent code', () => {
    const result = manager.join('ZZZZ', 'Test');
    expect('error' in result).toBe(true);
  });

  it('toggles ready state', () => {
    let state = manager.ready(lobbyId, hostId, true);
    expect('error' in state).toBe(false);
    expect((state as any).players.find((p: any) => p.isHost)!.ready).toBe(true);

    state = manager.ready(lobbyId, hostId, false);
    expect((state as any).players.find((p: any) => p.isHost)!.ready).toBe(false);
  });

  it('fails start when not all ready', () => {
    manager.ready(lobbyId, hostId, true);
    const result = manager.start(lobbyId, hostId);
    expect('error' in result).toBe(true);
  });

  it('fails start for non-host', () => {
    manager.ready(lobbyId, hostId, true);
    manager.ready(lobbyId, guestId, true);
    const result = manager.start(lobbyId, 'fake-id');
    expect('error' in result).toBe(true);
    expect((result as any).error).toContain('host');
  });

  it('starts game when all ready by host', () => {
    manager.ready(lobbyId, hostId, true);
    manager.ready(lobbyId, guestId, true);
    const result = manager.start(lobbyId, hostId);
    expect('error' in result).toBe(false);
    expect((result as any).lobby.status).toBe('STARTED');
  });

  it('rejects join after start', () => {
    const lobby = (manager as any).repo.findById(lobbyId);
    const result = manager.join(lobby.code, 'Bob');
    expect('error' in result).toBe(true);
  });

  it('rejects double start', () => {
    const result = manager.start(lobbyId, hostId);
    expect('error' in result).toBe(true);
  });
});
