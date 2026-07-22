import type { CardDefinition } from '../../engine/types.js';

export const zombieCards: CardDefinition[] = [
  {
    id: 'zombie_kitten', name: 'Zombie Kitten', expansion: 'zombie',
    copies: 5,
    playable: { requiresResponse: 'zombie_revive' },
    effect: { type: 'ZOMBIE_KITTEN', reviveTarget: true },
    category: 'defuse',
  },
  {
    id: 'clone', name: 'Clone', expansion: 'zombie',
    copies: 2,
    playable: {},
    effect: { type: 'NONE' },
    category: 'action',
  },
  {
    id: 'clairvoyance', name: 'Clairvoyance', expansion: 'zombie',
    copies: 2,
    playable: {},
    effect: { type: 'NONE' },
    category: 'action',
  },
  {
    id: 'dig_deeper', name: 'Dig Deeper', expansion: 'zombie',
    copies: 4,
    playable: {},
    effect: { type: 'DIG_DEEPER' },
    category: 'action',
  },
  {
    id: 'feed_the_dead', name: 'Feed the Dead', expansion: 'zombie',
    copies: 2,
    playable: {},
    effect: { type: 'FEED_THE_DEAD' },
    category: 'action',
  },
  {
    id: 'grave_robber', name: 'Grave Robber', expansion: 'zombie',
    copies: 1,
    playable: {},
    effect: { type: 'GRAVE_ROBBER' },
    category: 'action',
  },
  {
    id: 'attack_of_the_dead', name: 'Attack of the Dead', expansion: 'zombie',
    copies: 3,
    playable: {},
    effect: { type: 'ATTACK_OF_THE_DEAD', amount: 2 },
    category: 'action',
  },
  {
    id: 'shuffle_now', name: 'Shuffle Now', expansion: 'zombie',
    copies: 1,
    playable: { playAtAnyTime: true },
    effect: { type: 'SHUFFLE_DECK' },
    category: 'action',
  },
];
