import { describe, it, expect } from 'vitest';
import { createGame, handleAction } from '../engine/GameEngine.js';

function createGameWithStreaking(playerCount: number = 3) {
  return createGame({ playerCount, expansions: ['streaking'] });
}

function findCardByType(hand: { id: string; type: string }[], type: string): string | undefined {
  return hand.find(c => c.type === type)?.id;
}

describe('Streaking Kittens Expansion', () => {
  describe('Deck Building', () => {
    it('includes streaking cards when expansion is active', () => {
      const game = createGameWithStreaking(3);
      const allCards = [
        ...game.players.flatMap(p => p.hand),
        ...game.deck,
        ...game.discardPile,
      ];
      expect(allCards.some(c => c.type === 'streaking_kitten')).toBe(true);
      expect(allCards.some(c => c.type === 'super_skip')).toBe(true);
      expect(allCards.some(c => c.type === 'see_future_5x')).toBe(true);
      expect(allCards.some(c => c.type === 'alter_future_5x')).toBe(true);
      expect(allCards.filter(c => c.type === 'swap_top_bottom').length).toBe(3);
      expect(allCards.some(c => c.type === 'garbage_collection')).toBe(true);
      expect(allCards.some(c => c.type === 'catomic_bomb')).toBe(true);
      expect(allCards.filter(c => c.type === 'mark').length).toBe(3);
      expect(allCards.filter(c => c.type === 'curse_cat_butt').length).toBe(2);
    });

    it('does not include streaking cards when expansion is not active', () => {
      const game = createGame({ playerCount: 3 });
      const allCards = [
        ...game.players.flatMap(p => p.hand),
        ...game.deck,
        ...game.discardPile,
      ];
      expect(allCards.every(c => c.type !== 'streaking_kitten')).toBe(true);
    });
  });

  describe('Streaking Kitten', () => {
    it('sets streakingKitten flag when played', () => {
      const game = createGameWithStreaking(3);
      const current = game.turn.currentPlayerIndex;
      const sk = findCardByType(game.players[current].hand, 'streaking_kitten');
      if (!sk) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: sk });
      expect(game.players[current].streakingKitten).toBe(true);
    });

    it('does not add Streaking Kitten to discard pile', () => {
      const game = createGameWithStreaking(3);
      const current = game.turn.currentPlayerIndex;
      const sk = findCardByType(game.players[current].hand, 'streaking_kitten');
      if (!sk) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: sk });
      expect(game.discardPile.some(c => c.type === 'streaking_kitten')).toBe(false);
    });

    it('protects player from Exploding Kitten', () => {
      const game = createGameWithStreaking(2);
      const current = game.turn.currentPlayerIndex;
      // Give player Streaking Kitten protection
      game.players[current].streakingKitten = true;
      // Force EK to top of deck
      const ekIdx = game.deck.findIndex(c => c.type === 'exploding_kitten');
      if (ekIdx === -1) return;
      const [ek] = game.deck.splice(ekIdx, 1);
      game.deck.unshift(ek);
      handleAction(game, current, 'DRAW_CARD');
      // Player should still be alive
      expect(game.players[current].alive).toBe(true);
      // EK should be in hand
      expect(game.players[current].hand.some(c => c.type === 'exploding_kitten')).toBe(true);
    });
  });

  describe('Super Skip', () => {
    it('clears all pending turns', () => {
      const game = createGameWithStreaking(2);
      const current = game.turn.currentPlayerIndex;
      const next = 1 - current;
      const ss = findCardByType(game.players[current].hand, 'super_skip');
      if (!ss) return;
      game.players[next].pendingTurns = 5;
      handleAction(game, current, 'PLAY_CARD', { cardId: ss });
      expect(game.players[next].pendingTurns).toBe(0);
    });
  });

  describe('Swap Top and Bottom', () => {
    it('swaps first and last card in deck', () => {
      const game = createGameWithStreaking(2);
      const current = game.turn.currentPlayerIndex;
      const stb = findCardByType(game.players[current].hand, 'swap_top_bottom');
      if (!stb) return;
      const first = game.deck[0];
      const last = game.deck[game.deck.length - 1];
      handleAction(game, current, 'PLAY_CARD', { cardId: stb });
      expect(game.deck[0].id).toBe(last.id);
      expect(game.deck[game.deck.length - 1].id).toBe(first.id);
    });
  });

  describe('Garbage Collection', () => {
    it('removes one card from each alive player', () => {
      const game = createGameWithStreaking(3);
      const current = game.turn.currentPlayerIndex;
      const gc = findCardByType(game.players[current].hand, 'garbage_collection');
      if (!gc) return;
      const handSizes = game.players.map(p => p.hand.length);
      handleAction(game, current, 'PLAY_CARD', { cardId: gc });
      for (let i = 0; i < game.players.length; i++) {
        if (game.players[i].alive) {
          const expectedDiff = i === current ? 2 : 1; // Player who played Garbage Collection also lost the GC card
          expect(game.players[i].hand.length).toBe(handSizes[i] - expectedDiff);
        }
      }
    });
  });

  describe('Catomic Bomb', () => {
    it('puts all Exploding Kittens on top of deck', () => {
      const game = createGameWithStreaking(3);
      const current = game.turn.currentPlayerIndex;
      const cb = findCardByType(game.players[current].hand, 'catomic_bomb');
      if (!cb) return;
      // Move some EKs to discard and known positions in deck
      const ekCount = game.deck.filter(c => c.type === 'exploding_kitten').length;
      handleAction(game, current, 'PLAY_CARD', { cardId: cb });
      // All EKs should be at the top of the deck
      const topCards = game.deck.slice(0, ekCount);
      expect(topCards.every(c => c.type === 'exploding_kitten')).toBe(true);
    });
  });

  describe('Mark', () => {
    it('marks a random card from target player', () => {
      const game = createGameWithStreaking(3);
      const current = game.turn.currentPlayerIndex;
      const target = (current + 1) % 3;
      const mk = findCardByType(game.players[current].hand, 'mark');
      if (!mk) return;
      const targetHandSize = game.players[target].hand.length;
      handleAction(game, current, 'PLAY_CARD', { cardId: mk, targetIndex: target });
      expect(game.players[target].markedCardIds.length).toBeGreaterThanOrEqual(1);
      expect(game.players[target].hand.length).toBe(targetHandSize); // card stays in hand
    });

    it('rejects invalid target', () => {
      const game = createGameWithStreaking(3);
      const current = game.turn.currentPlayerIndex;
      const mk = findCardByType(game.players[current].hand, 'mark');
      if (!mk) return;
      const result = handleAction(game, current, 'PLAY_CARD', { cardId: mk, targetIndex: 99 });
      expect(result.valid).toBe(false);
    });
  });

  describe('Curse of the Cat Butt', () => {
    it('sets cursed flag on target player', () => {
      const game = createGameWithStreaking(3);
      const current = game.turn.currentPlayerIndex;
      const target = (current + 1) % 3;
      const cc = findCardByType(game.players[current].hand, 'curse_cat_butt');
      if (!cc) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: cc, targetIndex: target });
      expect(game.players[target].cursed).toBe(true);
    });
  });
});
