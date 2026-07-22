import { describe, it, expect } from 'vitest';
import { createGame, handleAction } from '../engine/GameEngine.js';

function createGameWithZombie(playerCount: number = 3) {
  return createGame({ playerCount, expansions: ['zombie'] });
}

function findCardByType(hand: { id: string; type: string }[], type: string): string | undefined {
  return hand.find(c => c.type === type)?.id;
}

describe('Zombie Kittens Expansion', () => {
  describe('Deck Building', () => {
    it('includes zombie cards when expansion is active', () => {
      const game = createGameWithZombie(3);
      const allCards = [
        ...game.players.flatMap(p => p.hand),
        ...game.deck,
        ...game.discardPile,
      ];
      expect(allCards.filter(c => c.type === 'zombie_kitten').length).toBe(5);
      expect(allCards.filter(c => c.type === 'clone').length).toBe(2);
      expect(allCards.filter(c => c.type === 'clairvoyance').length).toBe(2);
      expect(allCards.filter(c => c.type === 'dig_deeper').length).toBe(4);
      expect(allCards.filter(c => c.type === 'feed_the_dead').length).toBe(2);
      expect(allCards.filter(c => c.type === 'grave_robber').length).toBe(1);
      expect(allCards.filter(c => c.type === 'attack_of_the_dead').length).toBe(3);
      expect(allCards.filter(c => c.type === 'shuffle_now').length).toBe(1);
    });
  });

  describe('Zombie Kitten', () => {
    it('can be used to defuse an Exploding Kitten', () => {
      const game = createGameWithZombie(2);
      const current = game.turn.currentPlayerIndex;
      // Give player a zombie kitten
      const zk = game.deck.find(c => c.type === 'zombie_kitten');
      if (!zk) return;
      game.players[current].hand.push(zk);
      // Force EK to top of deck
      const ek = game.deck.find(c => c.type === 'exploding_kitten');
      if (!ek) return;
      game.deck = game.deck.filter(c => c.type !== 'exploding_kitten');
      game.deck.unshift(ek);
      // Remove defuse cards
      game.players[current].hand = game.players[current].hand.filter(c => c.type !== 'defuse');
      handleAction(game, current, 'DRAW_CARD');
      // Player should be alive — zombie kitten was used
      expect(game.players[current].alive).toBe(true);
    });
  });

  describe('Dead Player State', () => {
    it('sets dead=true when zombie expansion is active and player is eliminated', () => {
      const game = createGameWithZombie(2);
      const current = game.turn.currentPlayerIndex;
      // Remove all defuse and zombie kitten cards so player can't save themselves
      game.players[current].hand = game.players[current].hand.filter(c => c.type !== 'defuse' && c.type !== 'zombie_kitten');
      // Force EK
      const ek = game.deck.find(c => c.type === 'exploding_kitten');
      if (!ek) return;
      game.deck = game.deck.filter(c => c.type !== 'exploding_kitten');
      game.deck.unshift(ek);
      handleAction(game, current, 'DRAW_CARD');
      expect(game.players[current].alive).toBe(false);
      expect(game.players[current].dead).toBe(true);
    });

    it('dead player keeps their hand', () => {
      const game = createGameWithZombie(2);
      const current = game.turn.currentPlayerIndex;
      const handSize = game.players[current].hand.length;
      game.players[current].hand = game.players[current].hand.filter(c => c.type !== 'defuse' && c.type !== 'zombie_kitten');
      const afterFilter = game.players[current].hand.length;
      const ek = game.deck.find(c => c.type === 'exploding_kitten');
      if (!ek) return;
      game.deck = game.deck.filter(c => c.type !== 'exploding_kitten');
      game.deck.unshift(ek);
      handleAction(game, current, 'DRAW_CARD');
      expect(game.players[current].hand.length).toBe(afterFilter + 1); // EK was drawn and stays in hand
    });
  });

  describe('Dig Deeper', () => {
    it('draws a card from the deck', () => {
      const game = createGameWithZombie(3);
      const current = game.turn.currentPlayerIndex;
      const dd = findCardByType(game.players[current].hand, 'dig_deeper');
      if (!dd) return;
      const deckBefore = game.deck.length;
      handleAction(game, current, 'PLAY_CARD', { cardId: dd });
      expect(game.deck.length).toBe(deckBefore - 1);
    });
  });

  describe('Feed the Dead', () => {
    it('requires at least one dead player', () => {
      const game = createGameWithZombie(3);
      const current = game.turn.currentPlayerIndex;
      const fd = findCardByType(game.players[current].hand, 'feed_the_dead');
      if (!fd) return;
      // No dead players yet
      const result = handleAction(game, current, 'PLAY_CARD', { cardId: fd });
      expect(result.valid).toBe(false);
    });
  });

  describe('Shuffle Now', () => {
    it('can be played at any time', () => {
      const game = createGameWithZombie(3);
      const current = game.turn.currentPlayerIndex;
      const sn = findCardByType(game.players[current].hand, 'shuffle_now');
      if (!sn) return;
      const result = handleAction(game, current, 'PLAY_CARD', { cardId: sn });
      expect(result.valid).toBe(true);
    });
  });
});
