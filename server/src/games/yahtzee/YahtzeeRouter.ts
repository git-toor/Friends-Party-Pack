import { Router } from 'express';
import { createGame, handleAction, getAvailableCategories, getTotalScore } from './YahtzeeEngine.js';
import type { YahtzeeGameState, GameAction } from './YahtzeeEngine.js';

// In-memory game sessions (will be replaced with DB-backed in Phase 6)
const sessions = new Map<string, YahtzeeGameState>();

export const yahtzeeRouter = Router();

// POST /api/games/yahtzee/create
yahtzeeRouter.post('/create', (req, res) => {
  const { sessionId, playerCount } = req.body;
  if (playerCount < 2 || playerCount > 8) {
    return res.status(400).json({ error: 'Player count must be 2-8' });
  }
  const game = createGame(playerCount);
  sessions.set(sessionId, game);
  res.json({ sessionId, state: sanitizeState(game, -1) });
});

// POST /api/games/yahtzee/action
yahtzeeRouter.post('/action', (req, res) => {
  const { sessionId, playerIndex, action } = req.body as { sessionId: string; playerIndex: number; action: GameAction };
  const state = sessions.get(sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const result = handleAction(state, playerIndex, action);
  if (!result.valid) return res.status(400).json({ error: result.error });

  sessions.set(sessionId, result.state);
  res.json({
    valid: true,
    state: sanitizeState(result.state, playerIndex),
    diceValues: result.diceValues,
  });
});

// GET /api/games/yahtzee/state/:sessionId?playerIndex=0
yahtzeeRouter.get('/state/:sessionId', (req, res) => {
  const state = sessions.get(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const playerIndex = parseInt(req.query.playerIndex as string) || 0;
  res.json(sanitizeState(state, playerIndex));
});

// POST /api/games/yahtzee/available-categories
yahtzeeRouter.post('/available-categories', (req, res) => {
  const { scores } = req.body;
  const categories = getAvailableCategories({ scores, yahtzeeBonusCount: 0 });
  res.json({ categories });
});

function sanitizeState(state: YahtzeeGameState, currentPlayerIndex: number) {
  return {
    currentPlayerIndex: state.currentPlayerIndex,
    round: state.round,
    totalRounds: state.totalRounds,
    winners: state.winners,
    started: state.started,
    isMyTurn: currentPlayerIndex === state.currentPlayerIndex,
    turn: state.turn,
    players: state.players.map((p, i) => ({
      ...p,
      isCurrentPlayer: i === state.currentPlayerIndex,
      totalScore: getTotalScore(p),
      availableCategories: i === currentPlayerIndex ? getAvailableCategories(p) : [],
    })),
  };
}
