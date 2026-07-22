import type { GameState, GameSettings, GameAction, GameResult, Card } from './types.js';
import type { EffectCallbacks, EffectResult } from './EffectEngine.js';
import { resolveEffect } from './EffectEngine.js';
import { canPlayCard, canDrawCard, createAction, advanceTurn, isNopeable, resolveDrawCard } from './ActionEngine.js';
import { createCard, getAllDefinitions } from '../cards/registry.js';
import { shuffleArray } from './EffectEngine.js';
import { serializeState } from '../state/Serializer.js';

export function createGame(settings: GameSettings): GameState {
  const playerCount = settings.playerCount;
  const state: GameState = {
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `Player ${i + 1}`,
      index: i,
      hand: [],
      alive: true,
      pendingTurns: 0,
    })),
    deck: [],
    discardPile: [],
    turn: {
      currentPlayerIndex: Math.floor(Math.random() * playerCount),
      direction: 1,
      phase: 'playing',
      attackCount: 0,
    },
    actionStack: [],
    nopeWindow: null,
    settings,
    winner: null,
  };

  state.deck = buildDeck(playerCount);
  dealCards(state, playerCount);
  return state;
}

function buildDeck(playerCount: number): Card[] {
  const deck: Card[] = [];
  const defs = getAllDefinitions();
  for (const def of defs) {
    const count = typeof def.copies === 'function' ? def.copies(playerCount) : def.copies;
    for (let i = 0; i < count; i++) {
      deck.push(createCard(def.id));
    }
  }
  shuffleArray(deck);
  return deck;
}

function dealCards(state: GameState, playerCount: number): void {
  const handSize = playerCount <= 3 ? 7 : 5;
  const explodingCards = state.deck.filter(c => c.type === 'exploding_kitten');
  const nonExploding = state.deck.filter(c => c.type !== 'exploding_kitten');
  for (const player of state.players) {
    player.hand = nonExploding.splice(0, handSize);
  }
  state.deck = [...nonExploding, ...explodingCards];
  shuffleArray(state.deck);
}

export function handleAction(
  state: GameState,
  playerIndex: number,
  actionType: string,
  payload?: any
): GameResult {
  const makeCallbacks = (): EffectCallbacks => ({
    pushAction: (action: GameAction) => {
      state.actionStack.push(action);
    },
    queueNopeWindow: (actionId: string) => {
      const windowMs = 3000;
      state.nopeWindow = {
        expiresAt: Date.now() + windowMs,
        targetActionId: actionId,
        chain: [],
      };
    },
    cancelNopeWindow: () => {
      state.nopeWindow = null;
    },
    broadcast: (event: string, _payload: any) => {},
    endTurn: () => {
      advanceTurn(state);
    },
  });

  switch (actionType) {
    case 'PLAY_CARD': {
      const cardId = payload?.cardId;
      const player = state.players[playerIndex];
      const playedCard = player.hand.find(c => c.id === cardId);

      // During nope window, only Nope cards can be played (from any player)
      if (state.nopeWindow) {
        if (!playedCard || playedCard.type !== 'nope') {
          return { state, valid: false, error: 'Only Nope can be played during nope window. Use RESOLVE_NOPE action.' };
        }
        // Allow Nope from any player — bypass turn check
      } else {
        const err = canPlayCard(state, playerIndex, cardId);
        if (err) return { state, valid: false, error: err };
      }
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return { state, valid: false, error: 'Card not in hand' };
      const card = player.hand.splice(cardIndex, 1)[0];
      state.discardPile.push(card);

      const action = createAction('PLAY_CARD', playerIndex, payload);
      const callbacks = makeCallbacks();
      const effectResult = resolveEffect(state, card.definition.effect, action, callbacks);

      if (!effectResult.success) {
        player.hand.push(card); // Put the card back
        state.discardPile.pop();
        return { state, valid: false, error: 'Card effect failed' };
      }

      if (effectResult.nopeable && isNopeable(action)) {
        callbacks.queueNopeWindow(action.id);
      }

      return { state, valid: true };
    }

    case 'DRAW_CARD': {
      const err = canDrawCard(state, playerIndex);
      if (err) return { state, valid: false, error: err };

      const callbacks = makeCallbacks();
      return resolveDrawCard(state, playerIndex, callbacks);
    }

    case 'RESOLVE_DEFUSE': {
      if (state.turn.currentPlayerIndex !== playerIndex) {
        return { state, valid: false, error: 'Not your turn' };
      }
      const player = state.players[playerIndex];
      const defuseIdx = player.hand.findIndex(c => c.type === 'defuse');
      if (defuseIdx === -1) return { state, valid: false, error: 'No Defuse card' };
      player.hand.splice(defuseIdx, 1)[0];
      const explodingKitten: Card = {
        id: crypto.randomUUID(),
        type: 'exploding_kitten',
        definition: { id: 'exploding_kitten', name: 'Exploding Kitten', expansion: 'base', copies: 0, playable: {}, effect: { type: 'EXPLODE', defusable: true }, category: 'exploding' },
      };
      const insertIdx = payload?.insertIndex ?? Math.floor(Math.random() * (state.deck.length + 1));
      state.deck.splice(insertIdx, 0, explodingKitten);
      advanceTurn(state);
      return { state, valid: true };
    }

    case 'RESOLVE_FAVOR': {
      const victimIdx = payload?.victimIndex ?? state.actionStack.find(a => a.type === 'RESOLVE_FAVOR')?.playerIndex;
      if (victimIdx === undefined) return { state, valid: false, error: 'No favor pending' };
      const victim = state.players[victimIdx];
      if (!victim.alive) return { state, valid: false, error: 'Victim is eliminated' };
      const cardId = payload?.cardId;
      const cardIndex = victim.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return { state, valid: false, error: 'Card not found in victim hand' };
      const stolenCard = victim.hand.splice(cardIndex, 1)[0];
      state.players[playerIndex].hand.push(stolenCard);
      const favorActions = state.actionStack.filter(a => a.type === 'RESOLVE_FAVOR');
      for (const fa of favorActions) {
        fa.status = 'resolved';
      }
      state.actionStack = state.actionStack.filter(a => !(a.type === 'RESOLVE_FAVOR'));
      advanceTurn(state);
      return { state, valid: true };
    }

    case 'RESOLVE_NOPE': {
      if (!state.nopeWindow) return { state, valid: false, error: 'No nope window' };
      const player = state.players[playerIndex];
      const nopeIdx = player.hand.findIndex(c => c.type === 'nope');
      if (nopeIdx === -1) return { state, valid: false, error: 'No Nope card' };
      player.hand.splice(nopeIdx, 1);
      state.nopeWindow.chain.push({ playerIndex, actionId: crypto.randomUUID() });
      if (state.nopeWindow.timeout) {
        clearTimeout(state.nopeWindow.timeout);
      }
      state.nopeWindow.expiresAt = Date.now() + 3000;
      return { state, valid: true };
    }

    case 'RESOLVE_NOPE_TIMEOUT': {
      if (!state.nopeWindow) return { state, valid: false, error: 'No nope window' };
      const chainLength = state.nopeWindow.chain.length;
      if (chainLength % 2 === 1) {
        // Last Nope wins - cancel the target action
        const targetAction = state.actionStack.find(a => a.id === state.nopeWindow?.targetActionId);
        if (targetAction) {
          targetAction.status = 'noped';
        }
      }
      state.nopeWindow = null;
      advanceTurn(state);
      return { state, valid: true };
    }

    case 'END_TURN': {
      if (state.turn.currentPlayerIndex !== playerIndex) {
        return { state, valid: false, error: 'Not your turn' };
      }
      if (state.turn.phase !== 'playing') {
        return { state, valid: false, error: 'Cannot end turn now' };
      }
      state.turn.phase = 'drawing';
      const callbacks = makeCallbacks();
      return resolveDrawCard(state, playerIndex, callbacks);
    }

    default:
      return { state, valid: false, error: `Unknown action: ${actionType}` };
  }
}
