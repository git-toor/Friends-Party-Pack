import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATH, HOME_STRETCH, CENTER, getBoardPosition, getTileSize } from './BoardLayout.js';
import { Tile } from './Tile.js';
import { Token } from './Token.js';

const S = 40;
const BOARD_SIZE = 600;
const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
const PLAYER_OFFSETS = [0, 13, 26, 39];
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

interface TokenData {
  playerIndex: number;
  tokenIndex: number;
  state: string;
  progress: number;
}

interface LudoBoardProps {
  tokens: TokenData[];
  validMoves: number[];
  currentPlayer: number;
  diceValue: number | null;
  phase: string;
  playerIndex: number;
  onTokenClick: (tokenIndex: number) => void;
}

function isSafeSquare(absPos: number): boolean {
  return SAFE_SQUARES.includes(absPos);
}

function absProgress(progress: number, playerIndex: number): number {
  return (progress + PLAYER_OFFSETS[playerIndex]) % 52;
}

export function LudoBoard({ tokens, validMoves, currentPlayer, diceValue, phase, playerIndex, onTokenClick }: LudoBoardProps) {
  const tileSize = getTileSize();

  // Group tokens by position for stacking
  const tokenGroups = useMemo(() => {
    const groups = new Map<string, TokenData[]>();
    for (const tok of tokens) {
      if (tok.state === 'home' || tok.state === 'finished') continue;
      const pos = getBoardPosition(tok.playerIndex, tok.progress);
      const key = `${pos.x},${pos.y}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tok);
    }
    return groups;
  }, [tokens]);

  const stackingOffsets = [
    { x: 0, y: 0 },
    { x: -8, y: 0 }, { x: 8, y: 0 },
    { x: -8, y: -8 }, { x: 8, y: 8 },
  ];

  return (
    <div style={{ width: '100%', maxWidth: BOARD_SIZE, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} style={{ width: '100%', height: 'auto' }}>
        {/* Background */}
        <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="#1a1a2e" rx={8} />

        {/* Home quadrants */}
        {/* Red quadrant (top-left) */}
        <rect x={S} y={S} width={5*S} height={5*S} fill="rgba(231,76,60,0.08)" rx={4} />
        {/* Blue quadrant (bottom-left) */}
        <rect x={S} y={9*S} width={5*S} height={5*S} fill="rgba(52,152,219,0.08)" rx={4} />
        {/* Yellow quadrant (bottom-right) */}
        <rect x={9*S} y={9*S} width={5*S} height={5*S} fill="rgba(241,196,15,0.08)" rx={4} />
        {/* Green quadrant (top-right) */}
        <rect x={9*S} y={S} width={5*S} height={5*S} fill="rgba(46,204,113,0.08)" rx={4} />

        {/* Center */}
        <rect x={6*S} y={6*S} width={3*S} height={3*S} fill="rgba(255,255,255,0.05)" rx={4} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />

        {/* Home stretch tiles */}
        {[0, 1, 2, 3].map(p => (
          HOME_STRETCH[p].map((pos, i) => (
            <Tile key={`hs-${p}-${i}`} pos={pos} size={tileSize} color={PLAYER_COLORS[p]} isSafe={false} isDestination={false} showRoutePreview={false} />
          ))
        ))}

        {/* Path tiles */}
        {PATH.map((pos, i) => (
          <Tile key={`path-${i}`} pos={pos} size={tileSize} color="rgba(255,255,255,0.06)" isSafe={isSafeSquare(i)} isDestination={false} showRoutePreview={false} />
        ))}

        {/* Tokens on path */}
        {Array.from(tokenGroups.entries()).map(([key, group]) => {
          const [x, y] = key.split(',').map(Number);
          return group.map((tok, i) => {
            const offset = stackingOffsets[i] || { x: 0, y: 0 };
            const isMovable = validMoves.includes(tok.tokenIndex);
            return (
              <Token
                key={`tok-${tok.playerIndex}-${tok.tokenIndex}`}
                pos={{ x: x + offset.x, y: y + offset.y }}
                colorIndex={tok.playerIndex}
                size={tileSize}
                movable={isMovable}
                isDragging={false}
                onDragEnd={() => isMovable && onTokenClick(tok.tokenIndex)}
              />
            );
          });
        })}

        {/* Finished tokens — show in center */}
        {tokens.filter(t => t.state === 'finished').map(tok => (
          <Token
            key={`fin-${tok.playerIndex}-${tok.tokenIndex}`}
            pos={CENTER}
            colorIndex={tok.playerIndex}
            size={tileSize}
            movable={false}
            isDragging={false}
          />
        ))}
      </svg>
    </div>
  );
}
