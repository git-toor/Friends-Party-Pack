import { GameServer } from './GameServer.js';

class GameRegistry {
  private servers = new Map<string, GameServer>();
  private sessionGames = new Map<string, string>();

  register(gameId: string, server: GameServer): void {
    this.servers.set(gameId, server);
  }

  getServer(gameId: string): GameServer | undefined {
    return this.servers.get(gameId);
  }

  createSession(gameId: string, sessionId: string, playerCount: number, settings?: Record<string, unknown>): void {
    this.sessionGames.set(sessionId, gameId);
    const server = this.servers.get(gameId);
    if (!server) throw new Error(`Unknown game: ${gameId}`);
    server.createSession(sessionId, playerCount, settings);
  }

  getState(sessionId: string, playerIndex: number): any {
    const gameId = this.sessionGames.get(sessionId);
    if (!gameId) return null;
    return this.servers.get(gameId)?.getState(sessionId, playerIndex);
  }

  setWsBroadcast(sessionId: string, fn: (payload: any) => void): void {
    const gameId = this.sessionGames.get(sessionId);
    if (!gameId) return;
    this.servers.get(gameId)?.setWsBroadcast(sessionId, fn);
  }

  mountRouters(app: any): void {
    for (const [gameId, server] of this.servers) {
      app.use(`/api/games/${gameId}`, server.getRouter());
    }
  }

  getRegisteredGames(): { id: string; server: GameServer }[] {
    return Array.from(this.servers.entries()).map(([id, server]) => ({ id, server }));
  }
}

export const gameRegistry = new GameRegistry();
