import type { CardDefinition } from '../../engine/types.js';

export const personalCards: CardDefinition[] = [
  {
    id: 'personal_attack', name: 'Personal Attack', expansion: 'personal',
    copies: 4,
    playable: {},
    effect: { type: 'ADD_TURNS', amount: 3, stackable: true, selfTarget: true },
    category: 'action',
  },
  {
    id: 'share_future_3x', name: 'Share the Future', expansion: 'personal',
    copies: 2,
    playable: {},
    effect: { type: 'SHARE_FUTURE', amount: 3 },
    category: 'action',
  },
];
