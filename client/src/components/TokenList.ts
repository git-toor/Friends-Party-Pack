export interface TokenDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const AVAILABLE_TOKENS: TokenDef[] = [
  { id: 'elephant', name: 'Decorated Festival Indian Elephant', emoji: '🐘', color: '#7B68EE' },
  { id: 'belan', name: 'Dadi\'s Belan (Indian Rolling Pin)', emoji: '🥖', color: '#C49A5C' },
  { id: 'chappal', name: 'Rubber Chappal (Indian Flip-Flop)', emoji: '🩴', color: '#222222' },
  { id: 'dhol', name: 'Dhol (Indian Drum)', emoji: '🥁', color: '#D2691E' },
  { id: 'cutting_chai', name: 'Cutting Chai Glass (Indian Tea)', emoji: '🍵', color: '#8B4513' },
  { id: 'rickshaw', name: 'Auto Rickshaw (Indian Tuk-Tuk)', emoji: '🛺', color: '#FF6B35' },
  { id: 'chetak', name: 'Bajaj Chetak (Indian Scooter)', emoji: '🛵', color: '#3366CC' },
  { id: 'mango', name: 'Alphonso Mango (Indian Mango)', emoji: '🥭', color: '#FFB347' },
  { id: 'lotus', name: 'Lotus Flower (Indian National Flower)', emoji: '🪷', color: '#FF69B4' },
  { id: 'lassi', name: 'Lassi Kulhad (Indian Yogurt Drink)', emoji: '🥛', color: '#C4956A' },
  { id: 'vada_pav', name: 'Vada Pav (Indian Street Food)', emoji: '🥪', color: '#D4A056' },
  { id: 'temple_bell', name: 'Temple Bell (Indian Religious Bell)', emoji: '🔔', color: '#DAA520' },
];

export function getTokenDef(id: string): TokenDef {
  return AVAILABLE_TOKENS.find(t => t.id === id) || AVAILABLE_TOKENS[0];
}
