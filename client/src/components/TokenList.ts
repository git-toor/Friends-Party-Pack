export interface TokenDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const AVAILABLE_TOKENS: TokenDef[] = [
  { id: 'rickshaw', name: 'Auto Rickshaw', emoji: '🛺', color: '#FF6B35' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', color: '#7B68EE' },
  { id: 'peacock', name: 'Peacock', emoji: '🦚', color: '#00BFFF' },
  { id: 'taj', name: 'Taj Mahal', emoji: '🏛️', color: '#FFD700' },
  { id: 'cricket', name: 'Cricket Bat', emoji: '🏏', color: '#32CD32' },
  { id: 'train', name: 'Train', emoji: '🚂', color: '#DC143C' },
  { id: 'lotus', name: 'Lotus', emoji: '🪷', color: '#FF69B4' },
  { id: 'temple', name: 'Temple', emoji: '🛕', color: '#FF8C00' },
  { id: 'namaste', name: 'Namaste', emoji: '🙏', color: '#9370DB' },
  { id: 'chai', name: 'Chai', emoji: '🫖', color: '#8B4513' },
  { id: 'samosa', name: 'Samosa', emoji: '🥟', color: '#DAA520' },
  { id: 'diya', name: 'Diya', emoji: '🪔', color: '#FF4500' },
];

export function getTokenDef(id: string): TokenDef {
  return AVAILABLE_TOKENS.find(t => t.id === id) || AVAILABLE_TOKENS[0];
}
