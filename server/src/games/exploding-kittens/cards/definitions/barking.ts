import type { CardDefinition } from '../../engine/types.js';

export const barkingCards: CardDefinition[] = [
  {
    id: 'barking_kitten', name: 'Barking Kitten', expansion: 'barking',
    copies: 2,
    playable: { requiresTarget: true },
    effect: { type: 'BARKING_KITTEN' },
    category: 'cat',
  },
  {
    id: 'tower_of_power', name: 'Tower of Power', expansion: 'barking',
    copies: 1,
    playable: {},
    effect: { type: 'TOWER_OF_POWER' },
    category: 'action',
  },
  {
    id: 'potluck', name: 'Potluck', expansion: 'barking',
    copies: 2,
    playable: {},
    effect: { type: 'POTLUCK' },
    category: 'action',
  },
  {
    id: 'bury', name: 'Bury', expansion: 'barking',
    copies: 2,
    playable: {},
    effect: { type: 'BURY' },
    category: 'action',
  },
  {
    id: 'personal_attack', name: 'Personal Attack', expansion: 'barking',
    copies: 4,
    playable: {},
    effect: { type: 'ADD_TURNS', amount: 3, stackable: true, selfTarget: true },
    category: 'action',
  },
  {
    id: 'share_future_3x', name: 'Share the Future', expansion: 'barking',
    copies: 2,
    playable: {},
    effect: { type: 'SHARE_FUTURE', amount: 3 },
    category: 'action',
  },
];
