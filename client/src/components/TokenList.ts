export interface TokenDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const AVAILABLE_TOKENS: TokenDef[] = [
  { id: 'model_0', name: 'Mario', emoji: '🍄', color: '#ED1C24' },
  { id: 'model_1', name: 'Pengu', emoji: '🔵', color: '#0068B4' },
  { id: 'model_2', name: 'R2-D2', emoji: '🤖', color: '#D3D3D3' },
  { id: 'model_3', name: 'Robot', emoji: '⚙️', color: '#00A859' },
];

export function getTokenDef(id: string): TokenDef {
  return AVAILABLE_TOKENS.find(t => t.id === id) || AVAILABLE_TOKENS[0];
}
