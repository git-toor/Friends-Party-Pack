import type { CardDefinition, Card, CardType } from '../engine/types.js';
import { baseCards } from './definitions/base.js';
import { implodingCards } from './definitions/imploding.js';
import { streakingCards } from './definitions/streaking.js';
import { barkingCards } from './definitions/barking.js';
import { zombieCards } from './definitions/zombie.js';

const registry = new Map<CardType, CardDefinition>();
const allExpansions: CardDefinition[] = [];

export function registerDefinitions(defs: CardDefinition[]): void {
  for (const def of defs) {
    registry.set(def.id, def);
    allExpansions.push(def);
  }
}

export function getDefinition(type: CardType): CardDefinition | undefined {
  return registry.get(type);
}

export function getAllDefinitions(expansions?: string[]): CardDefinition[] {
  if (!expansions || expansions.length === 0) {
    return [...allExpansions.filter(d => d.expansion === 'base')];
  }
  return [...allExpansions.filter(d => expansions.includes(d.expansion) || d.expansion === 'base')];
}

export function createCard(type: CardType, id?: string): Card {
  const def = getDefinition(type);
  if (!def) throw new Error(`Unknown card type: ${type}`);
  return { id: id || crypto.randomUUID(), type, definition: def };
}

registerDefinitions(baseCards);
registerDefinitions(implodingCards);
registerDefinitions(streakingCards);
registerDefinitions(barkingCards);
registerDefinitions(zombieCards);
