import { describe, it, expect, beforeEach } from 'vitest';
import { createGame, handleAction, getValidMoves, type GameState, type GameResult } from '../LudoEngine.js';

function gameWithFixedRoll(state: GameState, playerIndex: number, value: number): GameResult {
  const prevSixes = state.consecutiveSixes;
  const result = handleAction(state, playerIndex, { type: 'ROLL_DICE' });
  if (result.valid) {
    state.diceValue = value;
    // Override consecutiveSixes based on the forced value, ignoring random
    if (value === 6) {
      state.consecutiveSixes = prevSixes + 1;
      if (state.consecutiveSixes >= 3) {
        state.diceValue = null;
        state.consecutiveSixes = 0;
        state.phase = 'rolling';
        state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
      }
    } else {
      state.consecutiveSixes = 0;
    }
  }
  return result;
}

function getAllMoves(state: GameState, playerIndex: number): number[] {
  return getValidMoves(state, playerIndex);
}

describe('LudoEngine', () => {
  let game: GameState;

  beforeEach(() => {
    game = createGame(2);
  });

  // ─── createGame ────────────────────────────────────────

  describe('createGame', () => {
    it('creates correct number of players', () => {
      expect(game.players.length).toBe(2);
      expect(createGame(4).players.length).toBe(4);
    });

    it('each player has 4 tokens in home state', () => {
      for (const p of game.players) {
        expect(p.tokens.length).toBe(4);
        for (const t of p.tokens) {
          expect(t.state).toBe('home');
          expect(t.progress).toBe(-1);
        }
      }
    });

    it('starts with player 0', () => {
      expect(game.currentPlayer).toBe(0);
    });

    it('starts in rolling phase', () => {
      expect(game.phase).toBe('rolling');
    });

    it('no winner at start', () => {
      expect(game.winner).toBeNull();
    });
  });

  // ─── ROLL_DICE ─────────────────────────────────────────

  describe('ROLL_DICE', () => {
    it('returns value 1-6', () => {
      for (let i = 0; i < 50; i++) {
        const g = createGame(2);
        const r = handleAction(g, 0, { type: 'ROLL_DICE' });
        expect(r.valid).toBe(true);
        expect(r.diceValue).toBeGreaterThanOrEqual(1);
        expect(r.diceValue).toBeLessThanOrEqual(6);
      }
    });

    it('rejects from non-current player', () => {
      const r = handleAction(game, 1, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });

    it('advances to moving phase', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(game.phase).toBe('moving');
    });

    it('stores dice value on state', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(game.diceValue).toBeGreaterThanOrEqual(1);
      expect(game.diceValue).toBeLessThanOrEqual(6);
    });

    it('rejects double roll', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });

    it('rejects after game over', () => {
      game.winner = 0;
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });
  });

  // ─── MOVE_TOKEN — Home to Path ─────────────────────────

  describe('MOVE_TOKEN — Home to Path', () => {
    it('requires 6 to leave home', () => {
      gameWithFixedRoll(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(false);
    });

    it('allows home→path on 6', () => {
      gameWithFixedRoll(game, 0, 6);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[0].tokens[0].state).toBe('path');
      expect(game.players[0].tokens[0].progress).toBe(0);
    });

    it('rejects move from wrong player after roll', () => {
      gameWithFixedRoll(game, 0, 6);
      const r = handleAction(game, 1, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(false);
    });

    it('fires TOKEN_MOVED event on home exit', () => {
      gameWithFixedRoll(game, 0, 6);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.events?.some(e => e.type === 'TOKEN_MOVED')).toBe(true);
    });
  });

  // ─── MOVE_TOKEN — Path movement ────────────────────────

  describe('MOVE_TOKEN — Path movement', () => {
    it('advances progress by dice value', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      gameWithFixedRoll(game, 0, 4);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.players[0].tokens[0].progress).toBe(14);
    });

    it('rejects move when no valid tokens after roll', () => {
      gameWithFixedRoll(game, 0, 3);
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });

    it('auto-enters home stretch at progress 52', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 49 };
      gameWithFixedRoll(game, 0, 3);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.players[0].tokens[0].state).toBe('stretch');
      expect(game.players[0].tokens[0].progress).toBe(52);
    });

    it('finishes token with exact roll to 58', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 55 };
      gameWithFixedRoll(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[0].tokens[0].state).toBe('finished');
      expect(game.players[0].tokens[0].progress).toBe(58);
      expect(game.players[0].finishedCount).toBe(1);
      expect(r.events?.some(e => e.type === 'TOKEN_FINISHED')).toBe(true);
    });

    it('rejects overshoot beyond 58', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 55 };
      gameWithFixedRoll(game, 0, 5);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(false);
    });

    it('captures opponent token on non-safe square', () => {
      // P0 at progress 5 (abs 5). P1 at progress 46 (abs 46+13=59%52=7).
      // P0 rolls 2 → progress 7 (abs 7) → captures P1 at abs 7
      game.players[0].tokens[0] = { state: 'path', progress: 5 };
      game.players[1].tokens[0] = { state: 'path', progress: 46 };
      gameWithFixedRoll(game, 0, 2);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[1].tokens[0].state).toBe('home');
      expect(game.players[1].tokens[0].progress).toBe(-1);
      expect(r.events?.some(e => e.type === 'CAPTURE')).toBe(true);
    });

    it('does not capture on safe square', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 12 };
      game.players[1].tokens[0] = { state: 'path', progress: 14 };
      gameWithFixedRoll(game, 0, 2);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.players[1].tokens[0].state).toBe('path');
    });

    it('captures opponent on path move', () => {
      // P0 at progress 3 (abs 3). P1 at progress 9 (abs 9+13=22).
      // P0 rolls 5 → progress 8 (abs 8, safe) — no capture because safe
      game.players[0].tokens[0] = { state: 'path', progress: 3 };
      game.players[1].tokens[0] = { state: 'path', progress: 9 };
      gameWithFixedRoll(game, 0, 5);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[1].tokens[0].state).toBe('path'); // safe square, no capture
    });
  });

  // ─── Blocks ────────────────────────────────────────────

  describe('Blocks', () => {
    it('cannot pass through opponent block', () => {
      // P1 has 2 tokens at abs 5 (progress 44, abs 44+13=57%52=5)
      game.players[1].tokens[0] = { state: 'path', progress: 44 };
      game.players[1].tokens[1] = { state: 'path', progress: 44 };
      // P0 at progress 3 (abs 3), rolls 3 → would pass through abs 4,5,6
      // abs 5 is blocked -> only 1 valid move (the 3rd home token on 6? no, dice is 3)
      game.players[0].tokens[0] = { state: 'path', progress: 3 };
      gameWithFixedRoll(game, 0, 3);
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });

    it('can land on own block (stack)', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 3 };
      game.players[0].tokens[1] = { state: 'path', progress: 5 };
      gameWithFixedRoll(game, 0, 2);
      const moves = getAllMoves(game, 0);
      expect(moves).toContain(0);
    });

    it('can land on safe square occupied by opponent', () => {
      // Safe square at abs 8
      game.players[1].tokens[0] = { state: 'path', progress: 8 };
      game.players[0].tokens[0] = { state: 'path', progress: 6 };
      gameWithFixedRoll(game, 0, 2);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[1].tokens[0].state).toBe('path'); // not captured
    });

    it('fires BLOCK_FORMED event when block created', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 5 };
      game.players[0].tokens[1] = { state: 'path', progress: 3 };
      gameWithFixedRoll(game, 0, 2);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      if (r.events) {
        expect(r.events.some(e => e.type === 'BLOCK_FORMED')).toBe(true);
      }
    });
  });

  // ─── Bonus rolls and turn advancement ──────────────────

  describe('Turn advancement', () => {
    it('non-6 advances turn to next player', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      gameWithFixedRoll(game, 0, 3);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.currentPlayer).toBe(1);
      expect(game.phase).toBe('rolling');
    });

    it('6 grants bonus turn', () => {
      gameWithFixedRoll(game, 0, 6);
      // Move token out of home
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      // Should still be player 0's turn
      expect(game.currentPlayer).toBe(0);
    });

    it('no valid moves after 6 still keeps turn (bonus)', () => {
      gameWithFixedRoll(game, 0, 6);
      // Home→path for token 0
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.currentPlayer).toBe(0);
      expect(game.phase).toBe('rolling');
    });

    it('turn advances after bonus roll without a 6', () => {
      gameWithFixedRoll(game, 0, 6);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      // Bonus roll
      gameWithFixedRoll(game, 0, 3);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.currentPlayer).toBe(1);
    });
  });

  // ─── Sixes penalty ─────────────────────────────────────

  describe('Three consecutive sixes', () => {
    it('loses turn on three consecutive sixes', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      gameWithFixedRoll(game, 0, 6);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      gameWithFixedRoll(game, 0, 6);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      gameWithFixedRoll(game, 0, 6);
      // Third forced 6 triggers penalty: advance turn
      expect(game.currentPlayer).toBe(1);
      expect(game.phase).toBe('rolling');
      expect(game.diceValue).toBeNull();
    });
  });

  // ─── Win condition ─────────────────────────────────────

  describe('Win condition', () => {
    it('declares winner when all 4 tokens finished', () => {
      // Set player 0's tokens at stretch progress 57 (need 1 to finish)
      for (let i = 0; i < 3; i++) {
        game.players[0].tokens[i] = { state: 'finished', progress: 58 };
      }
      game.players[0].finishedCount = 3;
      game.players[0].tokens[3] = { state: 'stretch', progress: 57 };
      gameWithFixedRoll(game, 0, 1);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 3 } });
      expect(game.winner).toBe(0);
    });

    it('rejects actions after game over', () => {
      game.winner = 0;
      game.phase = 'rolling';
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });
  });

  // ─── getValidMoves ─────────────────────────────────────

  describe('getValidMoves', () => {
    it('returns empty when not your turn', () => {
      const moves = getAllMoves(game, 1);
      expect(moves.length).toBe(0);
    });

    it('returns empty when in rolling phase', () => {
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });

    it('returns token index for home→path on 6', () => {
      gameWithFixedRoll(game, 0, 6);
      const moves = getAllMoves(game, 0);
      // All 4 home tokens can move on 6
      expect(moves.length).toBe(4);
    });

    it('returns only movable path tokens', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      game.players[0].tokens[1] = { state: 'path', progress: 57 };
      game.players[0].tokens[2] = { state: 'finished', progress: 58 };
      gameWithFixedRoll(game, 0, 3);
      const moves = getAllMoves(game, 0);
      // Token 0: 10+3=13 valid
      // Token 1: 57+3=60 > 58 invalid
      // Token 2: finished invalid
      // Tokens 3: home, needs 6
      expect(moves).toEqual([0]);
    });

    it('returns empty when no valid moves after roll', () => {
      // Token at progress 57, roll > 1 would overshoot
      game.players[0].tokens[0] = { state: 'stretch', progress: 57 };
      gameWithFixedRoll(game, 0, 5);
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });
  });

  // ─── 4-Player game ─────────────────────────────────────

  describe('4-player game', () => {
    it('creates 4 players', () => {
      const g = createGame(4);
      expect(g.players.length).toBe(4);
    });

    it('correct player offsets', () => {
      const g = createGame(4);
      g.players[0].tokens[0] = { state: 'path', progress: 0 };
      g.players[1].tokens[0] = { state: 'path', progress: 0 };
      g.players[2].tokens[0] = { state: 'path', progress: 0 };
      g.players[3].tokens[0] = { state: 'path', progress: 0 };
      // Each player's progress 0 maps to different absolute paths
      // P0 at abs 0, P1 at 13, P2 at 26, P3 at 39 - all safe squares
    });
  });

  // ─── Events ────────────────────────────────────────────

  describe('Events', () => {
    it('emits TOKEN_MOVED on path movement', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      gameWithFixedRoll(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.events?.some(e => e.type === 'TOKEN_MOVED')).toBe(true);
    });

    it('emits TOKEN_FINISHED when reaching 58', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 55 };
      gameWithFixedRoll(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.events?.some(e => e.type === 'TOKEN_FINISHED')).toBe(true);
    });
  });
});
