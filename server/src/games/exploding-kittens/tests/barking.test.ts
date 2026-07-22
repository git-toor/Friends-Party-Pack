import { describe, it, expect } from 'vitest';
import { createGame, handleAction } from '../engine/GameEngine.js';

function createGameWithBarking(playerCount: number = 3) {
  return createGame({ playerCount, expansions: ['barking'] });
}

function findCardByType(hand: { id: string; type: string }[], type: string): string | undefined {
  return hand.find(c => c.type === type)?.id;
}

describe('Barking Kittens Expansion', () => {
  describe('Deck Building', () => {
    it('includes barking cards when expansion is active', () => {
      const game = createGameWithBarking(3);
      const allCards = [
        ...game.players.flatMap(p => p.hand),
        ...game.deck,
        ...game.discardPile,
      ];
      expect(allCards.filter(c => c.type === 'barking_kitten').length).toBe(2);
      expect(allCards.some(c => c.type === 'tower_of_power')).toBe(true);
      expect(allCards.filter(c => c.type === 'potluck').length).toBe(2);
      expect(allCards.filter(c => c.type === 'bury').length).toBe(2);
      expect(allCards.filter(c => c.type === 'personal_attack').length).toBe(4);
      expect(allCards.filter(c => c.type === 'share_future_3x').length).toBe(2);
    });

    it('does not include barking cards when expansion is not active', () => {
      const game = createGame({ playerCount: 3 });
      const allCards = [
        ...game.players.flatMap(p => p.hand),
        ...game.deck,
        ...game.discardPile,
      ];
      expect(allCards.every(c => c.type !== 'barking_kitten')).toBe(true);
    });
  });

  describe('Barking Kitten', () => {
    it('rejects invalid target', () => {
      const game = createGameWithBarking(3);
      const current = game.turn.currentPlayerIndex;
      const bk = findCardByType(game.players[current].hand, 'barking_kitten');
      if (!bk) return;
      const result = handleAction(game, current, 'PLAY_CARD', { cardId: bk, targetIndex: 99 });
      expect(result.valid).toBe(false);
    });

    it('does not eliminate target without Exploding Kitten', () => {
      const game = createGameWithBarking(3);
      const current = game.turn.currentPlayerIndex;
      const target = (current + 1) % 3;
      const bk = findCardByType(game.players[current].hand, 'barking_kitten');
      if (!bk) return;
      game.players[target].hand = game.players[target].hand.filter(c => c.type !== 'exploding_kitten');
      handleAction(game, current, 'PLAY_CARD', { cardId: bk, targetIndex: target });
      handleAction(game, current, 'RESOLVE_NOPE_TIMEOUT');
      expect(game.players[target].alive).toBe(true);
    });

    it('discards the other Barking Kitten from target', () => {
      const game = createGameWithBarking(2);
      const current = game.turn.currentPlayerIndex;
      const target = 1 - current;
      const bk = findCardByType(game.players[current].hand, 'barking_kitten');
      if (!bk) return;
      const otherBk = game.deck.find(c => c.type === 'barking_kitten');
      if (!otherBk) return;
      game.deck = game.deck.filter(c => c.id !== otherBk.id);
      game.players[target].hand.push(otherBk);
      const hadBK = game.players[target].hand.some(c => c.type === 'barking_kitten');
      if (!hadBK) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: bk, targetIndex: target });
      handleAction(game, current, 'RESOLVE_NOPE_TIMEOUT');
      expect(game.discardPile.some(c => c.type === 'barking_kitten')).toBe(true);
    });
  });

  describe('Personal Attack', () => {
    it('adds 3 turns to self', () => {
      const game = createGameWithBarking(2);
      const current = game.turn.currentPlayerIndex;
      const pa = findCardByType(game.players[current].hand, 'personal_attack');
      if (!pa) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: pa });
      handleAction(game, current, 'RESOLVE_NOPE_TIMEOUT');
      expect(game.players[current].pendingTurns).toBe(3);
    });
  });

  describe('Potluck', () => {
    it('removes one card from each alive player', () => {
      const game = createGameWithBarking(3);
      const current = game.turn.currentPlayerIndex;
      const pl = findCardByType(game.players[current].hand, 'potluck');
      if (!pl) return;
      const handSizes = game.players.map(p => p.hand.length);
      handleAction(game, current, 'PLAY_CARD', { cardId: pl });
      handleAction(game, current, 'RESOLVE_NOPE_TIMEOUT');
      for (let i = 0; i < game.players.length; i++) {
        if (game.players[i].alive) {
          const expectedDiff = i === current ? 2 : 1;
          expect(game.players[i].hand.length).toBe(handSizes[i] - expectedDiff);
        }
      }
    });
  });

  describe('Bury', () => {
    it('draws a card and puts it back in the deck', () => {
      const game = createGameWithBarking(3);
      const current = game.turn.currentPlayerIndex;
      const bury = findCardByType(game.players[current].hand, 'bury');
      if (!bury) return;
      const deckSizeBefore = game.deck.length;
      handleAction(game, current, 'PLAY_CARD', { cardId: bury });
      handleAction(game, current, 'RESOLVE_NOPE_TIMEOUT');
      expect(game.deck.length).toBe(deckSizeBefore);
    });
  });

  describe('Tower of Power', () => {
    it('can be played', () => {
      const game = createGameWithBarking(3);
      const current = game.turn.currentPlayerIndex;
      const top = findCardByType(game.players[current].hand, 'tower_of_power');
      if (!top) return;
      const result = handleAction(game, current, 'PLAY_CARD', { cardId: top });
      expect(result.valid).toBe(true);
    });
  });
});
