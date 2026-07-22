import type { CardDefinition, Card, CardType } from '../engine/types.js';
import { baseCards } from './definitions/base.js';

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

export function getAllDefinitions(): CardDefinition[] {
  return [...allExpansions];
}

export function createCard(type: CardType, id?: string): Card {
  const def = getDefinition(type);
  if (!def) throw new Error(`Unknown card type: ${type}`);
  return { id: id || crypto.randomUUID(), type, definition: def };
}

registerDefinitions(baseCards);
