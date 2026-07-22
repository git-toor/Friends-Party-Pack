import type { CardDefinition } from '../../engine/types.js';

export const implodingCards: CardDefinition[] = [
  {
    id: 'imploding_kitten', name: 'Imploding Kitten', expansion: 'imploding',
    copies: 1,
    playable: {},
    effect: { type: 'IMPLODING_KITTEN', defusable: false, insert: 'face_up', nopeable: false },
    category: 'exploding',
  },
  {
    id: 'alter_future_3x', name: 'Alter the Future', expansion: 'imploding',
    copies: 4,
    playable: {},
    effect: { type: 'ALTER_FUTURE', amount: 3 },
    category: 'action',
  },
  {
    id: 'draw_from_bottom', name: 'Draw from the Bottom', expansion: 'imploding',
    copies: 2,
    playable: {},
    effect: { type: 'DRAW_FROM_BOTTOM' },
    category: 'action',
  },
  {
    id: 'reverse', name: 'Reverse', expansion: 'imploding',
    copies: 2,
    playable: {},
    effect: { type: 'REVERSE_DIRECTION' },
    category: 'action',
  },
  {
    id: 'targeted_attack', name: 'Targeted Attack', expansion: 'imploding',
    copies: 2,
    playable: { requiresTarget: true },
    effect: { type: 'TARGETED_ATTACK', amount: 2, stackable: true },
    category: 'action',
  },
  {
    id: 'feral_cat', name: 'Feral Cat', expansion: 'imploding',
    copies: 4,
    playable: { requiresTarget: true, requiresResponse: 'favor' },
    effect: { type: 'FERAL_CAT' },
    category: 'cat',
  },
];
