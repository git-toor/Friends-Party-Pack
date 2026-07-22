import { Router } from 'express';

export interface GameServer {
  createSession(sessionId: string, playerCount: number, settings?: Record<string, unknown>): void;

  getState(sessionId: string, playerIndex: number): any;

  setWsBroadcast(sessionId: string, fn: (payload: any) => void): void;

  getRouter(): Router;
}
