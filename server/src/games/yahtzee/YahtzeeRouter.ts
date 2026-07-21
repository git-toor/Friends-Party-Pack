import { Router } from 'express';
import { createGame, handleAction, getAvailableCategories, getTotalScore, calculateWinners } from './YahtzeeEngine.js';
import type { YahtzeeGameState, GameAction, YahtzeeCategory } from './YahtzeeEngine.js';

const sessions = new Map<string, YahtzeeGameState>();
const wsBroadcasts = new Map<string, (payload: any) => void>();

export const yahtzeeRouter = Router();

export function createYahtzeeSession(sessionId: string, playerCount: number): void {
  sessions.set(sessionId, createGame(playerCount));
}

export function getYahtzeeState(sessionId: string, playerIndex: number) {
  const state = sessions.get(sessionId);
  if (!state) return null;
  return sanitizeState(state, playerIndex);
}

export function setWsBroadcast(sessionId: string, fn: (payload: any) => void): void {
  wsBroadcasts.set(sessionId, fn);
}

yahtzeeRouter.post('/create', (req, res) => {
  const { sessionId, playerCount } = req.body;
  if (playerCount < 2 || playerCount > 8) {
    return res.status(400).json({ error: 'Player count must be 2-8' });
  }
  createYahtzeeSession(sessionId, playerCount);
  res.json({ sessionId, state: sanitizeState(sessions.get(sessionId)!, -1) });
});

yahtzeeRouter.post('/action', (req, res) => {
  const { sessionId, playerIndex, action } = req.body as { sessionId: string; playerIndex: number; action: GameAction };
  const state = sessions.get(sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const result = handleAction(state, playerIndex, action);
  if (!result.valid) return res.status(400).json({ error: result.error });

  sessions.set(sessionId, result.state);
  const sanitized = sanitizeState(result.state, playerIndex);

      // Broadcast to all players via WS
    const broadcast = wsBroadcasts.get(sessionId);
    if (broadcast) {
      for (let i = 0; i < result.state.players.length; i++) {
        broadcast({ type: 'GAME_STATE', payload: { ...sanitizeState(result.state, i), _actionPlayer: playerIndex, forPlayerIndex: i } });
      }
      // Broadcast DICE_ROLL with dice values so all players show the same result
      if ((action as any).type === 'ROLL') {
        const diceValues = result.diceValues || null;
        broadcast({ type: 'DICE_ROLL', payload: { playerIndex, values: diceValues } });
      }
    }

  res.json({ valid: true, state: sanitized, diceValues: result.diceValues });
});

yahtzeeRouter.post('/debug/fill', (req, res) => {
  const { sessionId } = req.body;
  const state = sessions.get(sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const cats: YahtzeeCategory[] = ['ones','twos','threes','fours','fives','sixes','three_of_a_kind','four_of_a_kind','full_house','small_straight','large_straight','yahtzee','chance'];

  for (let pi = 0; pi < state.players.length; pi++) {
    const player = { ...state.players[pi] };
    player.scores = { ...player.scores };
    for (const cat of cats) {
      if (player.scores[cat] === undefined) {
        player.scores[cat] = Math.floor(Math.random() * 50) + 1;
      }
    }
    state.players[pi] = player;
  }

  state.winners = calculateWinners(state.players);
  state.started = false;

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < state.players.length; i++) {
      broadcast({ type: 'GAME_STATE', payload: { ...sanitizeState(state, i), _actionPlayer: -1, forPlayerIndex: i } });
    }
  }

  res.json({ state: sanitizeState(state, -1) });
});

yahtzeeRouter.post('/rematch', (req, res) => {
  const { sessionId } = req.body;
  const existing = sessions.get(sessionId);
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const playerCount = existing.players.length;
  const newState = createGame(playerCount);
  sessions.set(sessionId, newState);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < newState.players.length; i++) {
      broadcast({ type: 'GAME_STATE', payload: { ...sanitizeState(newState, i), _actionPlayer: -1, forPlayerIndex: i } });
    }
  }

  res.json({ state: sanitizeState(newState, -1) });
});

yahtzeeRouter.get('/state/:sessionId', (req, res) => {
  const state = sessions.get(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const playerIndex = parseInt(req.query.playerIndex as string) || 0;
  res.json(sanitizeState(state, playerIndex));
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
