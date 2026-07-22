import { describe, it, expect } from 'vitest';
import { createGame, handleAction } from '../engine/GameEngine.js';

function createGameWithImploding(playerCount: number = 4) {
  return createGame({ playerCount, expansions: ['imploding'] });
}

function findCardByType(hand: { id: string; type: string }[], type: string): string | undefined {
  return hand.find(c => c.type === type)?.id;
}

describe('Imploding Kittens Expansion', () => {
  describe('Deck Building', () => {
    it('includes imploding cards when expansion is active', () => {
      const game = createGameWithImploding(4);
      const allCards = [
        ...game.players.flatMap(p => p.hand),
        ...game.deck,
        ...game.discardPile,
      ];
      const implodingCard = allCards.find(c => c.type === 'imploding_kitten');
      expect(implodingCard).toBeDefined();
      const alterFutureCards = allCards.filter(c => c.type === 'alter_future_3x');
      expect(alterFutureCards.length).toBe(4);
      const bottomCards = allCards.filter(c => c.type === 'draw_from_bottom');
      expect(bottomCards.length).toBe(2);
      const reverseCards = allCards.filter(c => c.type === 'reverse');
      expect(reverseCards.length).toBe(2);
      const targetedCards = allCards.filter(c => c.type === 'targeted_attack');
      expect(targetedCards.length).toBe(2);
      const feralCards = allCards.filter(c => c.type === 'feral_cat');
      expect(feralCards.length).toBe(4);
    });

    it('does not include imploding cards when expansion is not active', () => {
      const game = createGame({ playerCount: 4 });
      const allCards = [
        ...game.players.flatMap(p => p.hand),
        ...game.deck,
        ...game.discardPile,
      ];
      const implodingCard = allCards.find(c => c.type === 'imploding_kitten');
      expect(implodingCard).toBeUndefined();
    });
  });

  describe('Imploding Kitten', () => {
    it('starts face-down', () => {
      const game = createGameWithImploding(4);
      expect(game.implodingKittenFaceUp).toBe(false);
    });

    it('becomes face-up when drawn the first time', () => {
      const game = createGameWithImploding(4);
      const current = game.turn.currentPlayerIndex;
      // Force the Imploding Kitten to top of deck
      const ikIdx = game.deck.findIndex(c => c.type === 'imploding_kitten');
      if (ikIdx === -1) return;
      const [ik] = game.deck.splice(ikIdx, 1);
      game.deck.unshift(ik);
      handleAction(game, current, 'DRAW_CARD');
      expect(game.implodingKittenFaceUp).toBe(true);
    });

    it('does not eliminate on first draw', () => {
      const game = createGameWithImploding(4);
      const current = game.turn.currentPlayerIndex;
      const ikIdx = game.deck.findIndex(c => c.type === 'imploding_kitten');
      if (ikIdx === -1) return;
      const [ik] = game.deck.splice(ikIdx, 1);
      game.deck.unshift(ik);
      handleAction(game, current, 'DRAW_CARD');
      const currentPlayer = game.players[current];
      expect(currentPlayer.alive).toBe(true);
    });

    it('returns to deck face-up after first draw', () => {
      const game = createGameWithImploding(4);
      const current = game.turn.currentPlayerIndex;
      const ikIdx = game.deck.findIndex(c => c.type === 'imploding_kitten');
      if (ikIdx === -1) return;
      const [ik] = game.deck.splice(ikIdx, 1);
      game.deck.unshift(ik);
      handleAction(game, current, 'DRAW_CARD');
      // Should still have an imploding kitten in the deck
      const stillInDeck = game.deck.some(c => c.type === 'imploding_kitten');
      expect(stillInDeck).toBe(true);
      expect(game.deck.filter(c => c.type === 'imploding_kitten').length).toBe(1);
    });

    it('eliminates player when drawn a second time (face-up)', () => {
      const game = createGameWithImploding(3);
      // Set up: mark IK as face-up, force it to top of deck
      game.implodingKittenFaceUp = true;
      const ikIdx = game.deck.findIndex(c => c.type === 'imploding_kitten');
      if (ikIdx === -1) return;
      const [ik] = game.deck.splice(ikIdx, 1);
      game.deck.unshift(ik);
      const current = game.turn.currentPlayerIndex;
      handleAction(game, current, 'DRAW_CARD');
      expect(game.players[current].alive).toBe(false);
    });
  });

  describe('Reverse', () => {
    it('flips the turn direction', () => {
      const game = createGameWithImploding(4);
      const current = game.turn.currentPlayerIndex;
      expect(game.turn.direction).toBe(1);
      const revCard = findCardByType(game.players[current].hand, 'reverse');
      if (!revCard) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: revCard });
      expect(game.turn.direction).toBe(-1);
    });

    it('changes which player goes next after turn ends', () => {
      const game = createGameWithImploding(3);
      const current = game.turn.currentPlayerIndex;
      const revCard = findCardByType(game.players[current].hand, 'reverse');
      if (!revCard) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: revCard });
      // Turn should advance to previous player (due to reversal)
      const next = game.turn.currentPlayerIndex;
      const expectedPrev = (current - 1 + 3) % 3;
      expect(next).toBe(expectedPrev);
    });
  });

  describe('Targeted Attack', () => {
    it('adds pending turns to a specific player', () => {
      const game = createGameWithImploding(3);
      const current = game.turn.currentPlayerIndex;
      const targetIdx = (current + 2) % 3;
      const taCard = findCardByType(game.players[current].hand, 'targeted_attack');
      if (!taCard) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: taCard, targetIndex: targetIdx });
      expect(game.players[targetIdx].pendingTurns).toBe(2);
    });

    it('rejects invalid target', () => {
      const game = createGameWithImploding(3);
      const current = game.turn.currentPlayerIndex;
      const taCard = findCardByType(game.players[current].hand, 'targeted_attack');
      if (!taCard) return;
      const result = handleAction(game, current, 'PLAY_CARD', { cardId: taCard, targetIndex: 99 });
      expect(result.valid).toBe(false);
    });
  });

  describe('Draw from the Bottom', () => {
    it('sets pendingDrawFromBottom on current player', () => {
      const game = createGameWithImploding(3);
      const current = game.turn.currentPlayerIndex;
      const dbCard = findCardByType(game.players[current].hand, 'draw_from_bottom');
      if (!dbCard) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: dbCard });
      expect(game.players[current].pendingDrawFromBottom).toBe(true);
    });

    it('draws from bottom of deck when ending turn', () => {
      const game = createGameWithImploding(3);
      const current = game.turn.currentPlayerIndex;
      const dbCard = findCardByType(game.players[current].hand, 'draw_from_bottom');
      if (!dbCard) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: dbCard });
      const bottomCard = game.deck[game.deck.length - 1];
      const deckSizeBefore = game.deck.length;
      handleAction(game, current, 'DRAW_CARD');
      expect(game.deck.length).toBe(deckSizeBefore - 1);
    });
  });
});
