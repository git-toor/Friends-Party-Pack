import type { GameState, GameAction, GameResult, Card } from './types.js';
import { resolveEffect } from './EffectEngine.js';
import { getDefinition } from '../cards/registry.js';

export function canPlayCard(state: GameState, playerIndex: number, cardId: string): string | null {
  if (state.turn.phase === 'game_over') return 'Game is over';
  if (state.winner !== null) return 'Game is over';
  if (state.turn.currentPlayerIndex !== playerIndex) return 'Not your turn';
  if (state.nopeWindow && !state.players[playerIndex].hand.some(c => c.type === 'nope')) return 'Cannot play now (nope window)';
  const player = state.players[playerIndex];
  if (!player.alive) return 'Player is eliminated';
  const card = player.hand.find(c => c.id === cardId);
  if (!card) return 'Card not in hand';
  if (card.type === 'exploding_kitten') return 'Cannot play Exploding Kitten';
  if (card.type === 'imploding_kitten') return 'Cannot play Imploding Kitten';
  if (card.type === 'defuse') return 'Cannot play Defuse outside of explosion';
  const def = getDefinition(card.type);
  if (!def) return 'Unknown card type';
  return null; // valid
}

export function canDrawCard(state: GameState, playerIndex: number): string | null {
  if (state.turn.phase === 'game_over') return 'Game is over';
  if (state.turn.currentPlayerIndex !== playerIndex) return 'Not your turn';
  if (state.turn.phase !== 'playing' && state.turn.phase !== 'drawing') return 'Cannot draw now';
  const player = state.players[playerIndex];
  if (!player.alive) return 'Player is eliminated';
  return null;
}

export function createAction(
  type: GameAction['type'],
  playerIndex: number,
  payload?: GameAction['payload']
): GameAction {
  return {
    id: crypto.randomUUID(),
    playerIndex,
    type,
    payload,
    status: 'pending',
    createdAt: Date.now(),
  };
}

export function isNopeable(action: GameAction): boolean {
  if (action.type === 'DRAW_CARD' || action.type === 'RESOLVE_DEFUSE') return false;
  return true;
}

export function advanceTurn(state: GameState): void {
  if (state.turn.phase === 'game_over' || state.winner !== null) return;
  const current = state.players[state.turn.currentPlayerIndex];
  if (current.pendingTurns > 0) {
    current.pendingTurns--;
    if (current.pendingTurns > 0) return; // still same player's turn
  }
  // Move to next alive player
  let next = state.turn.currentPlayerIndex + state.turn.direction;
  if (next < 0) next = state.players.length - 1;
  if (next >= state.players.length) next = 0;
  let attempts = 0;
  while (!state.players[next].alive && attempts < state.players.length) {
    next += state.turn.direction;
    if (next < 0) next = state.players.length - 1;
    if (next >= state.players.length) next = 0;
    attempts++;
  }
  state.turn.currentPlayerIndex = next;
  state.turn.phase = 'playing';
  state.turn.attackCount = 0;
}

export function resolveDrawCard(state: GameState, playerIndex: number, callbacks: any): GameResult {
  if (state.deck.length === 0) {
    return { state, valid: false, error: 'Deck is empty' };
  }
  const player = state.players[playerIndex];
  const drawFromBottom = player.pendingDrawFromBottom;
  player.pendingDrawFromBottom = false;

  const card = drawFromBottom ? state.deck.pop()! : state.deck.shift()!;
  player.hand.push(card);
  callbacks.broadcast('CARD_DRAWN', { playerIndex, hasCard: true, cardType: card.type });

  if (card.type === 'exploding_kitten') {
    if (player.streakingKitten) {
      callbacks.broadcast('STREAKING_KITTEN_SAVED', { playerIndex });
    } else {
      const effect = getDefinition('exploding_kitten')?.effect;
      if (effect) {
        const result = resolveEffect(state, effect, createAction('DRAW_CARD', playerIndex), callbacks);
        if (result.eliminated && result.eliminated.length > 0) {
          checkWinCondition(state);
          if (state.turn.phase === 'game_over') return { state, valid: true };
        }
        if (result.requiresResponse) return { state, valid: true };
      }
    }
  } else if (card.type === 'imploding_kitten') {
    const effect = getDefinition('imploding_kitten')?.effect;
    if (effect) {
      const result = resolveEffect(state, effect, createAction('DRAW_CARD', playerIndex), callbacks);
      if (result.eliminated && result.eliminated.length > 0) {
        checkWinCondition(state);
        if (state.turn.phase === 'game_over') return { state, valid: true };
      }
      if (result.requiresResponse) return { state, valid: true };
    }
  }
  advanceTurn(state);
  return { state, valid: true };
}

function checkWinCondition(state: GameState): void {
  const alive = state.players.filter(p => p.alive);
  if (alive.length <= 1) {
    state.turn.phase = 'game_over';
    state.winner = alive[0]?.index ?? null;
  }
}
