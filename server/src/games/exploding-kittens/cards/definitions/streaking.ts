import type { CardDefinition } from '../../engine/types.js';

export const streakingCards: CardDefinition[] = [
  {
    id: 'streaking_kitten', name: 'Streaking Kitten', expansion: 'streaking',
    copies: 1,
    playable: { requiresTarget: true },
    effect: { type: 'STREAKING_KITTEN' },
    category: 'action',
  },
  {
    id: 'super_skip', name: 'Super Skip', expansion: 'streaking',
    copies: 1,
    playable: {},
    effect: { type: 'SUPER_SKIP' },
    category: 'action',
  },
  {
    id: 'see_future_5x', name: 'See the Future (5x)', expansion: 'streaking',
    copies: 1,
    playable: {},
    effect: { type: 'SEE_FUTURE', amount: 5 },
    category: 'action',
  },
  {
    id: 'alter_future_5x', name: 'Alter the Future (5x)', expansion: 'streaking',
    copies: 1,
    playable: {},
    effect: { type: 'ALTER_FUTURE', amount: 5 },
    category: 'action',
  },
  {
    id: 'swap_top_bottom', name: 'Swap Top and Bottom', expansion: 'streaking',
    copies: 3,
    playable: {},
    effect: { type: 'SWAP_TOP_BOTTOM' },
    category: 'action',
  },
  {
    id: 'garbage_collection', name: 'Garbage Collection', expansion: 'streaking',
    copies: 1,
    playable: {},
    effect: { type: 'GARBAGE_COLLECTION' },
    category: 'action',
  },
  {
    id: 'catomic_bomb', name: 'Catomic Bomb', expansion: 'streaking',
    copies: 1,
    playable: {},
    effect: { type: 'CATOMIC_BOMB' },
    category: 'action',
  },
  {
    id: 'mark', name: 'Mark', expansion: 'streaking',
    copies: 3,
    playable: { requiresTarget: true },
    effect: { type: 'MARK' },
    category: 'action',
  },
  {
    id: 'curse_cat_butt', name: 'Curse of the Cat Butt', expansion: 'streaking',
    copies: 2,
    playable: { requiresTarget: true },
    effect: { type: 'CURSE_CAT_BUTT' },
    category: 'action',
  },
];
