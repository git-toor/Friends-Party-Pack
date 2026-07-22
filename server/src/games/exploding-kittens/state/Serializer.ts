import type { GameState, Card } from '../engine/types.js';

export interface ClientPlayerView {
  id: string;
  name: string;
  index: number;
  cardCount: number;
  alive: boolean;
  pendingTurns: number;
}

export interface ClientGameState {
  myHand: { id: string; type: string; name: string }[];
  opponents: ClientPlayerView[];
  deckSize: number;
  discardCount: number;
  turn: {
    currentPlayerIndex: number;
    direction: number;
    phase: string;
    attackCount: number;
  };
  actionStack: { type: string; playerIndex: number; status: string }[];
  nopeWindow: {
    expiresAt: number;
    chain: { playerIndex: number }[];
  } | null;
  settings: { playerCount: number };
  winner: number | null;
}

export function serializeState(state: GameState, playerIndex: number): ClientGameState {
  const player = state.players[playerIndex];
  return {
    myHand: player.hand.map(c => ({
      id: c.id,
      type: c.type,
      name: c.definition.name,
    })),
    opponents: state.players
      .filter(p => p.index !== playerIndex)
      .map(p => ({
        id: p.id,
        name: p.name,
        index: p.index,
        cardCount: p.hand.length,
        alive: p.alive,
        pendingTurns: p.pendingTurns,
      })),
    deckSize: state.deck.length,
    discardCount: state.discardPile.length,
    turn: {
      currentPlayerIndex: state.turn.currentPlayerIndex,
      direction: state.turn.direction,
      phase: state.turn.phase,
      attackCount: state.turn.attackCount,
    },
    actionStack: state.actionStack.map(a => ({
      type: a.type,
      playerIndex: a.playerIndex,
      status: a.status,
    })),
    nopeWindow: state.nopeWindow
      ? {
          expiresAt: state.nopeWindow.expiresAt,
          chain: state.nopeWindow.chain.map(c => ({ playerIndex: c.playerIndex })),
        }
      : null,
    settings: { playerCount: state.settings.playerCount },
    winner: state.winner,
  };
}
