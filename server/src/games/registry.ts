import { Router } from 'express';
import { createGame, handleAction } from './yahtzee/YahtzeeEngine.js';
import type { YahtzeeGameState, GameAction, GameResult } from './yahtzee/YahtzeeEngine.js';

interface GameEngine {
  createGame(playerCount: number): YahtzeeGameState;
  handleAction(state: YahtzeeGameState, playerIndex: number, action: GameAction): GameResult;
}

const engines: Record<string, GameEngine> = {
  yahtzee: { createGame, handleAction },
};

export function getGameEngine(gameId: string): GameEngine | undefined {
  return engines[gameId];
}

export function createGameRouter(gameId: string): Router {
  const router = Router();
  // Per-game routes can be mounted here
  return router;
}
