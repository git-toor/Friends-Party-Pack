import { describe, it, expect } from 'vitest';
import { createGame, handleAction } from '../engine/GameEngine.js';

function createTestGame(playerCount: number = 3) {
  return createGame({ playerCount });
}

function findCardByType(hand: { id: string; type: string }[], type: string): string | undefined {
  return hand.find(c => c.type === type)?.id;
}

describe('Exploding Kittens Engine', () => {
  describe('createGame', () => {
    it('creates correct number of players', () => {
      const game = createTestGame(4);
      expect(game.players).toHaveLength(4);
      expect(game.players.every(p => p.alive)).toBe(true);
    });

    it('deals 7 cards to each player for 3 players', () => {
      const game = createTestGame(3);
      for (const player of game.players) {
        expect(player.hand.length).toBe(7);
      }
    });

    it('deals 5 cards for 5+ players', () => {
      const game = createTestGame(5);
      for (const player of game.players) {
        expect(player.hand.length).toBe(5);
      }
    });

    it('has correct Exploding Kitten count (players - 1)', () => {
      for (let p = 2; p <= 5; p++) {
        const game = createTestGame(p);
        const ekCount = game.deck.filter(c => c.type === 'exploding_kitten').length;
        expect(ekCount).toBe(p - 1);
      }
    });

    it('has correct Defuse count (players + 1)', () => {
      const game = createTestGame(3);
      const defuseCount = game.deck.filter(c => c.type === 'defuse').length +
        game.players.reduce((sum, p) => sum + p.hand.filter(c => c.type === 'defuse').length, 0);
      expect(defuseCount).toBe(4);
    });

    it('starts in playing phase', () => {
      const game = createTestGame(3);
      expect(game.turn.phase).toBe('playing');
    });

    it('starts with no winner', () => {
      const game = createTestGame(3);
      expect(game.winner).toBeNull();
    });
  });

  describe('PLAY_CARD', () => {
    it('rejects action from non-current player', () => {
      const game = createTestGame(3);
      const otherPlayer = game.players.find(p => p.index !== game.turn.currentPlayerIndex)!;
      const cardId = findCardByType(otherPlayer.hand, 'skip');
      if (!cardId) return;
      const result = handleAction(game, otherPlayer.index, 'PLAY_CARD', { cardId });
      expect(result.valid).toBe(false);
    });

    it('rejects playing Exploding Kitten', () => {
      const game = createTestGame(3);
      const current = game.players[game.turn.currentPlayerIndex];
      // Manually add an EK to hand for testing
      const ekCard = game.deck.find(c => c.type === 'exploding_kitten');
      if (!ekCard) { return; }
      game.deck = game.deck.filter(c => c.id !== ekCard.id);
      current.hand.push(ekCard);
      const result = handleAction(game, game.turn.currentPlayerIndex, 'PLAY_CARD', { cardId: ekCard.id });
      expect(result.valid).toBe(false);
    });

    it('rejects playing Defuse outside of explosion', () => {
      const game = createTestGame(3);
      const current = game.players[game.turn.currentPlayerIndex];
      const defuseCard = findCardByType(current.hand, 'defuse');
      if (!defuseCard) return;
      const result = handleAction(game, game.turn.currentPlayerIndex, 'PLAY_CARD', { cardId: defuseCard });
      expect(result.valid).toBe(false);
    });

    it('removes card from hand immediately but defers discard until nope resolution', () => {
      const game = createTestGame(3);
      const current = game.players[game.turn.currentPlayerIndex];
      const skipCard = findCardByType(current.hand, 'skip');
      if (!skipCard) return;
      const handSizeBefore = current.hand.length;
      const discardBefore = game.discardPile.length;
      handleAction(game, game.turn.currentPlayerIndex, 'PLAY_CARD', { cardId: skipCard });
      expect(current.hand.length).toBe(handSizeBefore - 1); // removed from hand immediately
      expect(game.discardPile.length).toBe(discardBefore); // not yet discarded (deferred)
      // After nope resolution, card moves to discard
      handleAction(game, game.turn.currentPlayerIndex, 'RESOLVE_NOPE_TIMEOUT');
      expect(game.discardPile.length).toBe(discardBefore + 1);
    });
  });

  describe('Attack', () => {
    it('adds 2 pending turns to next player', () => {
      const game = createTestGame(2);
      const current = game.turn.currentPlayerIndex;
      const next = 1 - current;
      const attackCard = findCardByType(game.players[current].hand, 'attack');
      if (!attackCard) return;
      expect(game.nopeWindow).toBeNull();
      handleAction(game, current, 'PLAY_CARD', { cardId: attackCard });
      expect(game.nopeWindow).not.toBeNull(); // deferred
      handleAction(game, current, 'RESOLVE_NOPE_TIMEOUT'); // execute effect
      expect(game.players[next].pendingTurns).toBe(3);
    });
  });

  describe('Skip', () => {
    it('ends the turn when no attack is pending', () => {
      const game = createTestGame(4);
      const current = game.turn.currentPlayerIndex;
      let skipCard: string | undefined;
      for (const p of game.players) {
        skipCard = findCardByType(p.hand, 'skip');
        if (skipCard) {
          const [card] = p.hand.splice(p.hand.findIndex(c => c.id === skipCard), 1);
          game.players[current].hand.push(card);
          break;
        }
      }
      if (!skipCard) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: skipCard });
      expect(game.nopeWindow).not.toBeNull(); // Skip is now nopeable
      handleAction(game, current, 'RESOLVE_NOPE_TIMEOUT'); // execute deferred effect
      expect(game.turn.currentPlayerIndex).not.toBe(current);
    });
  });

  describe('Shuffle', () => {
    it('does not change deck length', () => {
      const game = createTestGame(3);
      const current = game.players[game.turn.currentPlayerIndex];
      const shuffleCard = findCardByType(current.hand, 'shuffle');
      if (!shuffleCard) return;
      const deckSizeBefore = game.deck.length;
      handleAction(game, game.turn.currentPlayerIndex, 'PLAY_CARD', { cardId: shuffleCard });
      expect(game.deck.length).toBe(deckSizeBefore);
    });
  });

  describe('DRAW_CARD', () => {
    it('draws a card from the deck to hand', () => {
      const game = createTestGame(2);
      const current = game.players[game.turn.currentPlayerIndex];
      const handSizeBefore = current.hand.length;
      const deckSizeBefore = game.deck.length;
      handleAction(game, game.turn.currentPlayerIndex, 'DRAW_CARD');
      expect(current.hand.length).toBe(handSizeBefore + 1);
      expect(game.deck.length).toBe(deckSizeBefore - 1);
    });

    it('advances turn after drawing a non-Exploding card', () => {
      const game = createTestGame(2);
      const currentIdx = game.turn.currentPlayerIndex;
      handleAction(game, currentIdx, 'DRAW_CARD');
      if (game.players[currentIdx].alive) {
        expect(game.turn.currentPlayerIndex).not.toBe(currentIdx);
      }
    });
  });

  describe('Nope', () => {
    it('opens a nope window after an attack is played', () => {
      const game = createTestGame(2);
      const current = game.turn.currentPlayerIndex;
      const attackCard = findCardByType(game.players[current].hand, 'attack');
      if (!attackCard) return;
      handleAction(game, current, 'PLAY_CARD', { cardId: attackCard });
      expect(game.nopeWindow).not.toBeNull();
    });
  });

  describe('Favor', () => {
    it('requires a valid target', () => {
      const game = createTestGame(2);
      const current = game.players[game.turn.currentPlayerIndex];
      const favorCard = findCardByType(current.hand, 'favor');
      if (!favorCard) return;
      const result = handleAction(game, game.turn.currentPlayerIndex, 'PLAY_CARD', { cardId: favorCard, targetIndex: -1 });
      expect(result.valid).toBe(false);
    });
  });

  describe('RESOLVE_DEFUSE', () => {
    it('returns error if player has no Defuse', () => {
      const game = createTestGame(2);
      const player = game.players[game.turn.currentPlayerIndex];
      // Remove all Defuse cards
      player.hand = player.hand.filter(c => c.type !== 'defuse');
      const result = handleAction(game, game.turn.currentPlayerIndex, 'RESOLVE_DEFUSE', {});
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No Defuse or Zombie Kitten card');
    });
  });

  describe('END_TURN', () => {
    it('rejects end turn from non-current player', () => {
      const game = createTestGame(3);
      const other = game.players.find(p => p.index !== game.turn.currentPlayerIndex)!;
      const result = handleAction(game, other.index, 'END_TURN');
      expect(result.valid).toBe(false);
    });
  });

  describe('Win Condition', () => {
    it('declares winner when only one player remains', () => {
      const game = createTestGame(2);
      // Eliminate one player by drawing an EK without Defuse
      const currentIdx = game.turn.currentPlayerIndex;
      const elimPlayer = game.players[currentIdx];
      elimPlayer.hand = elimPlayer.hand.filter(c => c.type !== 'defuse');
      // Put EK on top of deck
      const ek = game.deck.find(c => c.type === 'exploding_kitten');
      if (!ek) return;
      game.deck = game.deck.filter(c => c.type !== 'exploding_kitten');
      game.deck.unshift(ek);
      handleAction(game, currentIdx, 'DRAW_CARD');
      expect(game.winner).toBe(1 - currentIdx);
      expect(game.turn.phase).toBe('game_over');
    });
  });
});
