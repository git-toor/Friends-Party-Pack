import { describe, it, expect } from 'vitest';
import {
  createGame, handleAction, calculateScore, getTotalScore,
  getAvailableCategories, calculateWinners
} from '../src/games/yahtzee/YahtzeeEngine.js';
import type { YahtzeeGameState } from '../src/games/yahtzee/YahtzeeEngine.js';

describe('Phase 4: Yahtzee Engine', () => {
  // ─── Score Calculation ───────────────────────────────────
  describe('calculateScore', () => {
    it('ones: sums all 1s', () => {
      expect(calculateScore([1, 1, 2, 3, 4], 'ones')).toBe(2);
      expect(calculateScore([2, 3, 4, 5, 6], 'ones')).toBe(0);
    });

    it('sixes: sums all 6s', () => {
      expect(calculateScore([6, 6, 3, 4, 5], 'sixes')).toBe(12);
    });

    it('three_of_a_kind: sum if 3+ same', () => {
      expect(calculateScore([3, 3, 3, 4, 5], 'three_of_a_kind')).toBe(18);
      expect(calculateScore([2, 3, 4, 5, 6], 'three_of_a_kind')).toBe(0);
    });

    it('four_of_a_kind: sum if 4+ same', () => {
      expect(calculateScore([4, 4, 4, 4, 2], 'four_of_a_kind')).toBe(18);
      expect(calculateScore([2, 3, 4, 5, 6], 'four_of_a_kind')).toBe(0);
    });

    it('full_house: 25 if 3+2', () => {
      expect(calculateScore([1, 1, 1, 2, 2], 'full_house')).toBe(25);
      expect(calculateScore([1, 1, 1, 2, 3], 'full_house')).toBe(0);
    });

    it('small_straight: 30 for 4 consecutive', () => {
      expect(calculateScore([1, 2, 3, 4, 6], 'small_straight')).toBe(30);
      expect(calculateScore([1, 2, 3, 4, 5], 'small_straight')).toBe(30);
      expect(calculateScore([2, 3, 4, 5, 6], 'small_straight')).toBe(30);
      expect(calculateScore([1, 3, 4, 5, 6], 'small_straight')).toBe(30);
      expect(calculateScore([1, 2, 4, 5, 6], 'small_straight')).toBe(0);
    });

    it('large_straight: 40 for 5 consecutive', () => {
      expect(calculateScore([1, 2, 3, 4, 5], 'large_straight')).toBe(40);
      expect(calculateScore([2, 3, 4, 5, 6], 'large_straight')).toBe(40);
      expect(calculateScore([1, 2, 3, 4, 6], 'large_straight')).toBe(0);
    });

    it('yahtzee: 50 for 5 same', () => {
      expect(calculateScore([5, 5, 5, 5, 5], 'yahtzee')).toBe(50);
      expect(calculateScore([5, 5, 5, 5, 4], 'yahtzee')).toBe(0);
    });

    it('chance: sum of all dice', () => {
      expect(calculateScore([1, 2, 3, 4, 5], 'chance')).toBe(15);
    });
  });

  // ─── Game Creation ───────────────────────────────────────
  it('creates game for 2-8 players', () => {
    const game = createGame(4);
    expect(game.players).toHaveLength(4);
    expect(game.round).toBe(1);
    expect(game.started).toBe(true);
    expect(game.turn.phase).toBe('WAITING_FOR_ROLL');
  });

  // ─── Roll Action ────────────────────────────────────────
  it('roll produces 5 values 1-6', () => {
    const game = createGame(2);
    const result = handleAction(game, 0, { type: 'ROLL' });
    expect(result.valid).toBe(true);
    expect(result.diceValues).toHaveLength(5);
    for (const v of result.diceValues!) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
    expect(result.state.turn.phase).toBe('WAITING_FOR_KEEP');
  });

  it('roll respects kept dice', () => {
    const game = createGame(2);
    let r = handleAction(game, 0, { type: 'ROLL' });
    const dice = r.diceValues!;
    r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [0, 1, 2] } });
    expect(r.state.turn.kept[0]).toBe(true);
    expect(r.state.turn.kept[3]).toBe(false);
    expect(r.state.turn.phase).toBe('WAITING_FOR_ROLL');
    r = handleAction(r.state, 0, { type: 'ROLL' });
    expect(r.state.turn.dice[0]).toBe(dice[0]);
    expect(r.state.turn.dice[1]).toBe(dice[1]);
    expect(r.state.turn.dice[2]).toBe(dice[2]);
    expect(r.state.turn.rollPhase).toBe(3);
  });

  it('limits to 3 roll phases', () => {
    const game = createGame(2);
    let r = handleAction(game, 0, { type: 'ROLL' });
    r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [] } });
    r = handleAction(r.state, 0, { type: 'ROLL' });
    r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [] } });
    r = handleAction(r.state, 0, { type: 'ROLL' });
    expect(r.state.turn.rollPhase).toBe(3);
    expect(r.state.turn.phase).toBe('WAITING_FOR_CATEGORY');
    // Fourth roll should fail
    r = handleAction(r.state, 0, { type: 'ROLL' });
    expect(r.valid).toBe(false);
  });

  it('rejects roll from non-current player', () => {
    const game = createGame(2);
    const result = handleAction(game, 1, { type: 'ROLL' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('turn');
  });

  // ─── Keep Action ────────────────────────────────────────
  it('keeps selected dice', () => {
    const game = createGame(2);
    const r1 = handleAction(game, 0, { type: 'ROLL' });
    const r2 = handleAction(r1.state, 0, { type: 'KEEP', payload: { indices: [0, 2, 4] } });
    expect(r2.state.turn.kept).toEqual([true, false, true, false, true]);
    expect(r2.state.turn.phase).toBe('WAITING_FOR_ROLL');
  });

  // ─── Score Action ───────────────────────────────────────
  it('scores a category and advances turn', () => {
    const game = createGame(2);
    let r = handleAction(game, 0, { type: 'ROLL' });
    // Keep none to go straight to category
    r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [] } });
    if (r.state.turn.phase === 'WAITING_FOR_ROLL') {
      r = handleAction(r.state, 0, { type: 'ROLL' });
      r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [] } });
    }
    if (r.state.turn.phase === 'WAITING_FOR_ROLL') {
      r = handleAction(r.state, 0, { type: 'ROLL' });
    }
    // Now in WAITING_FOR_CATEGORY
    r = handleAction(r.state, 0, { type: 'SCORE', payload: { category: 'chance' } });
    expect(r.valid).toBe(true);
    expect(r.state.players[0].scores['chance']).toBeGreaterThan(0);
  });

  it('rejects scoring same category twice', () => {
    const game = createGame(2);
    let r = handleAction(game, 0, { type: 'ROLL' });
    r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [0, 1, 2, 3, 4] } });
    r = handleAction(r.state, 0, { type: 'SCORE', payload: { category: 'chance' } });
    expect(r.valid).toBe(true);
    expect(r.state.currentPlayerIndex).toBe(1); // advances to next player
    // Back to player 0 — roll, keep all, try scoring chance again
    r = handleAction(r.state, 1, { type: 'ROLL' });
    r = handleAction(r.state, 1, { type: 'KEEP', payload: { indices: [0, 1, 2, 3, 4] } });
    r = handleAction(r.state, 1, { type: 'SCORE', payload: { category: 'twos' } });
    expect(r.state.currentPlayerIndex).toBe(0);
    r = handleAction(r.state, 0, { type: 'ROLL' });
    r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [0, 1, 2, 3, 4] } });
    const r2 = handleAction(r.state, 0, { type: 'SCORE', payload: { category: 'chance' } });
    expect(r2.valid).toBe(false);
    expect(r2.error).toContain('already scored');
  });

  // ─── Upper Section Bonus ────────────────────────────────
  it('awards 35 bonus when upper sum >= 63', () => {
    const player = {
      scores: { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 },
      yahtzeeBonusCount: 0,
    };
    const total = getTotalScore(player);
    expect(total).toBe(63 + 35);
  });

  it('does not award bonus when upper sum < 63', () => {
    const player = {
      scores: { ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 },
      yahtzeeBonusCount: 0,
    };
    const total = getTotalScore(player);
    expect(total).toBe(21);
  });

  // ─── Available Categories ───────────────────────────────
  it('lists all 13 categories initially', () => {
    const cats = getAvailableCategories({ scores: {}, yahtzeeBonusCount: 0 });
    expect(cats).toHaveLength(13);
  });

  it('removes scored categories', () => {
    const cats = getAvailableCategories({ scores: { yahtzee: 50 }, yahtzeeBonusCount: 0 });
    expect(cats).toHaveLength(12);
    expect(cats).not.toContain('yahtzee');
  });

  // ─── Winners ────────────────────────────────────────────
  it('calculates winner with highest score', () => {
    const players = [
      { scores: { chance: 20 }, yahtzeeBonusCount: 0 },
      { scores: { chance: 30 }, yahtzeeBonusCount: 0 },
    ];
    const winners = calculateWinners(players);
    expect(winners).toEqual([1]);
  });

  it('handles tie', () => {
    const players = [
      { scores: { chance: 25 }, yahtzeeBonusCount: 0 },
      { scores: { chance: 25 }, yahtzeeBonusCount: 0 },
    ];
    const winners = calculateWinners(players);
    expect(winners).toHaveLength(2);
  });

  // ─── Full Turn Flow ─────────────────────────────────────
  it('advances to next player after scoring', () => {
    const game = createGame(2);
    let r = handleAction(game, 0, { type: 'ROLL' });
    r = handleAction(r.state, 0, { type: 'KEEP', payload: { indices: [0, 1, 2, 3, 4] } });
    r = handleAction(r.state, 0, { type: 'SCORE', payload: { category: 'ones' } });
    // Advances to next player (standard Yahtzee turn order)
    expect(r.state.currentPlayerIndex).toBe(1);
    expect(r.state.players[0].scores['ones']).toBeGreaterThanOrEqual(0);
    expect(r.state.turn.phase).toBe('WAITING_FOR_ROLL');
  });

  // ─── Game End ───────────────────────────────────────────
  it('ends game after all 13 rounds', () => {
    let game = createGame(2);
    // Fill all 13 categories for both players
    for (let round = 0; round < 13; round++) {
      for (let p = 0; p < 2; p++) {
        const cats = getAvailableCategories(game.players[p]);
        if (cats.length === 0) break;
        let r = handleAction(game, p, { type: 'ROLL' });
        r = handleAction(r.state, p, { type: 'KEEP', payload: { indices: [0, 1, 2, 3, 4] } });
        r = handleAction(r.state, p, { type: 'SCORE', payload: { category: cats[0] } });
        game = r.state;
      }
    }
    expect(game.winners.length).toBeGreaterThan(0);
  });
});
