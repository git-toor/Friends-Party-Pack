export type CardType =
  | 'exploding_kitten' | 'defuse' | 'attack' | 'skip' | 'favor'
  | 'shuffle' | 'see_future_3x' | 'nope'
  | 'tacocat' | 'cattermelon' | 'hairy_potato_cat' | 'beard_cat'
  | 'imploding_kitten' | 'alter_future_3x' | 'draw_from_bottom'
  | 'reverse' | 'targeted_attack' | 'feral_cat'
  | 'streaking_kitten' | 'super_skip' | 'see_future_5x' | 'alter_future_5x'
  | 'swap_top_bottom' | 'garbage_collection' | 'catomic_bomb' | 'mark' | 'curse_cat_butt'
  | 'barking_kitten' | 'tower_of_power' | 'potluck' | 'bury'
  | 'personal_attack' | 'share_future_3x';

export type EffectType =
  | 'ADD_TURNS' | 'SKIP_TURNS' | 'FORCE_GIVE' | 'SHUFFLE_DECK'
  | 'SEE_FUTURE' | 'NOPE' | 'EXPLODE' | 'DEFUSE_AND_INSERT' | 'CAT_PAIR_SHUFFLE' | 'NONE'
  | 'IMPLODING_KITTEN' | 'ALTER_FUTURE' | 'DRAW_FROM_BOTTOM' | 'REVERSE_DIRECTION'
  | 'TARGETED_ATTACK' | 'FERAL_CAT'
  | 'STREAKING_KITTEN' | 'SUPER_SKIP' | 'SWAP_TOP_BOTTOM' | 'GARBAGE_COLLECTION'
  | 'CATOMIC_BOMB' | 'MARK' | 'CURSE_CAT_BUTT'
  | 'BARKING_KITTEN' | 'TOWER_OF_POWER' | 'POTLUCK' | 'BURY' | 'SHARE_FUTURE';

export interface EffectDefinition {
  type: EffectType;
  amount?: number;
  stackable?: boolean;
  selfTarget?: boolean;
  defusable?: boolean;
  insert?: 'face_up' | 'face_down';
  requiresResponse?: string;
  responseWindowMs?: number;
  drawCount?: number;
}

export interface CardDefinition {
  id: CardType;
  name: string;
  expansion: string;
  copies: number | ((players: number) => number);
  playable: {
    requiresTarget?: boolean;
    requiresResponse?: string;
    playAtAnyTime?: boolean;
  };
  effect: EffectDefinition;
  category: 'action' | 'cat' | 'exploding' | 'defuse';
}

export interface Card {
  id: string;
  type: CardType;
  definition: CardDefinition;
}

export interface PlayerState {
  id: string;
  name: string;
  index: number;
  hand: Card[];
  alive: boolean;
  pendingTurns: number;
  pendingDrawFromBottom?: boolean;
  streakingKitten?: boolean;
  markedCardIds: string[];
  cursed: boolean;
  stash: Card[];
}

export type ActionType =
  | 'PLAY_CARD' | 'DRAW_CARD' | 'END_TURN'
  | 'RESOLVE_DEFUSE' | 'RESOLVE_FAVOR' | 'RESOLVE_NOPE'
  | 'RESOLVE_NOPE_TIMEOUT' | 'RESOLVE_ALTER_FUTURE'
  | 'RESOLVE_GARBAGE_COLLECTION';

export interface GameAction {
  id: string;
  playerIndex: number;
  type: ActionType;
  payload?: {
    cardId?: string;
    targetIndex?: number;
    insertIndex?: number;
    cardIds?: string[];
  };
  status: 'pending' | 'awaiting_response' | 'resolving' | 'resolved' | 'noped';
  createdAt: number;
  timeout?: NodeJS.Timeout;
}

export interface GameSettings {
  playerCount: number;
  expansions?: string[];
}

export interface TurnState {
  currentPlayerIndex: number;
  direction: 1 | -1;
  phase: 'playing' | 'drawing' | 'game_over';
  attackCount: number;
}

export interface GameState {
  players: PlayerState[];
  deck: Card[];
  discardPile: Card[];
  turn: TurnState;
  actionStack: GameAction[];
  nopeWindow: {
    expiresAt: number;
    targetActionId: string;
    chain: { playerIndex: number; actionId: string }[];
    timeout?: NodeJS.Timeout;
  } | null;
  settings: GameSettings;
  winner: number | null;
  implodingKittenFaceUp: boolean;
}

export interface GameResult {
  state: GameState;
  valid: boolean;
  error?: string;
}
