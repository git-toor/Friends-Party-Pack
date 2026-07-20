import { getDb } from '../db/index.js';
import type { Lobby, LobbyPlayer } from './LobbyManager.js';

export class LobbyRepository {
  create(lobby: Lobby): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO lobbies (id, code, game_id, host_player_id, status, max_players, settings, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lobby.id, lobby.code, lobby.gameId, lobby.hostPlayerId, lobby.status, lobby.maxPlayers, JSON.stringify(lobby.settings), lobby.createdAt);
  }

  findByCode(code: string): Lobby | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code) as any;
    if (!row) return undefined;
    return this.rowToLobby(row);
  }

  findById(id: string): Lobby | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM lobbies WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return this.rowToLobby(row);
  }

  updateStatus(id: string, status: Lobby['status']): void {
    getDb().prepare('UPDATE lobbies SET status = ? WHERE id = ?').run(status, id);
  }

  addPlayer(player: LobbyPlayer): void {
    getDb().prepare(`
      INSERT INTO lobby_players (id, lobby_id, name, is_host, ready, joined_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(player.id, player.lobbyId, player.name, player.isHost ? 1 : 0, player.ready ? 1 : 0, player.joinedAt);
  }

  getPlayers(lobbyId: string): LobbyPlayer[] {
    const rows = getDb().prepare('SELECT * FROM lobby_players WHERE lobby_id = ? ORDER BY joined_at ASC').all(lobbyId) as any[];
    return rows.map((r: any) => ({
      id: r.id,
      lobbyId: r.lobby_id,
      name: r.name,
      isHost: !!r.is_host,
      ready: !!r.ready,
      joinedAt: r.joined_at,
    }));
  }

  removePlayer(lobbyId: string, playerId: string): void {
    getDb().prepare('DELETE FROM lobby_players WHERE lobby_id = ? AND id = ?').run(lobbyId, playerId);
  }

  setReady(lobbyId: string, playerId: string, ready: boolean): void {
    getDb().prepare('UPDATE lobby_players SET ready = ? WHERE lobby_id = ? AND id = ?').run(ready ? 1 : 0, lobbyId, playerId);
  }

  playerCount(lobbyId: string): number {
    const row = getDb().prepare('SELECT COUNT(*) as count FROM lobby_players WHERE lobby_id = ?').get(lobbyId) as any;
    return row.count;
  }

  private rowToLobby(row: any): Lobby {
    return {
      id: row.id,
      code: row.code,
      gameId: row.game_id,
      hostPlayerId: row.host_player_id,
      status: row.status,
      maxPlayers: row.max_players,
      settings: JSON.parse(row.settings || '{}'),
      createdAt: row.created_at,
    };
  }
}
