import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PATH, HOME_STRETCH, HOME_ZONES, CENTER, getBoardPosition, getTileSize,
  isSafeSquare, absPath, type TileCoord,
} from './BoardLayout.js';
import { Tile } from './Tile.js';
import { Token } from './Token.js';

const S = 40;
const BOARD_SIZE = 640;
const BOARD_OFFSET = 20;
const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];

// Map player index to board color index (opposite sides for 2 players)
export function playerColorIndex(playerIndex: number, totalPlayers: number): number {
  if (totalPlayers === 2) return playerIndex === 0 ? 0 : 2; // Red ↔ Yellow
  return playerIndex; // Sequential for 3-4 players
}

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
  totalPlayers: number;
  onTokenClick: (tokenIndex: number) => void;
  playerNames?: Record<number, string>;
}

function CenterPiece() {
  return (
    <g>
      {/* Center background */}
      <rect x={6*S} y={6*S} width={3*S} height={3*S} fill="#1a1a2e" rx={4} />
      {/* Colored triangles meeting in center */}
      <polygon points={`${7*S},${7*S} ${6*S},${6*S} ${6*S},${9*S}`} fill="rgba(231,76,60,0.3)" />
      <polygon points={`${7*S},${7*S} ${6*S},${6*S} ${9*S},${6*S}`} fill="rgba(46,204,113,0.3)" />
      <polygon points={`${7*S},${7*S} ${9*S},${6*S} ${9*S},${9*S}`} fill="rgba(241,196,15,0.3)" />
      <polygon points={`${7*S},${7*S} ${6*S},${9*S} ${9*S},${9*S}`} fill="rgba(52,152,219,0.3)" />
      {/* Center circle */}
      <circle cx={7*S} cy={7*S} r={12} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
    </g>
  );
}

function HomeZone({ player, tokens, totalPlayers }: { player: number; tokens: TokenData[]; totalPlayers: number }) {
  const cIdx = playerColorIndex(player, totalPlayers);
  const color = PLAYER_COLORS[cIdx];
  const homeTokens = tokens.filter(t => t.playerIndex === player && t.state === 'home');
  const finishedTokens = tokens.filter(t => t.playerIndex === player && t.state === 'finished');
  const zoneTiles = HOME_ZONES[player];

  return (
    <g>
      <rect
        x={player === 0 ? S : player === 3 ? 9*S : player === 1 ? S : 9*S}
        y={player < 2 ? S : 9*S}
        width={5*S}
        height={5*S}
        rx={10}
        fill={`${color}15`}
        stroke={`${color}40`}
        strokeWidth={1.5}
      />
      {zoneTiles.map((pos, i) => (
        <circle key={i} cx={pos.x} cy={pos.y} r={8} fill={`${color}30`} stroke={`${color}50`} strokeWidth={1} />
      ))}
      {homeTokens.map((tok, i) => {
        const pos = zoneTiles[homeTokens.indexOf(tok)] || zoneTiles[i % 4];
        return (
          <Token
            key={`home-${tok.tokenIndex}`}
            pos={pos}
            colorIndex={playerColorIndex(tok.playerIndex, totalPlayers)}
            size={getTileSize()}
            movable={false}
            isDragging={false}
          />
        );
      })}
      {finishedTokens.map(tok => (
        <Token
          key={`fin-${tok.tokenIndex}`}
          pos={CENTER}
          colorIndex={playerColorIndex(tok.playerIndex, totalPlayers)}
          size={getTileSize()}
          movable={false}
          isDragging={false}
        />
      ))}
    </g>
  );
}

export function LudoBoard({ tokens, validMoves, currentPlayer, playerIndex, totalPlayers, onTokenClick, playerNames = {} }: LudoBoardProps) {
  const ts = getTileSize();
  const colorIdx = (p: number) => playerColorIndex(p, totalPlayers);

  // Group path tokens by board position for stacking
  const pathTokenGroups = useMemo(() => {
    const groups = new Map<string, TokenData[]>();
    for (const tok of tokens) {
      if (tok.state !== 'path' && tok.state !== 'stretch') continue;
      const pos = getBoardPosition(tok.playerIndex, tok.progress);
      const key = `${pos.x},${pos.y}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tok);
    }
    return groups;
  }, [tokens]);

  // Stacking offsets for multi-token tiles
  const stackPositions = (count: number, cx: number, cy: number): { x: number; y: number }[] => {
    if (count === 1) return [{ x: cx, y: cy }];
    if (count === 2) return [{ x: cx - 8, y: cy }, { x: cx + 8, y: cy }];
    if (count === 3) return [{ x: cx, y: cy - 8 }, { x: cx - 8, y: cy + 8 }, { x: cx + 8, y: cy + 8 }];
    return [
      { x: cx - 8, y: cy - 8 }, { x: cx + 8, y: cy - 8 },
      { x: cx - 8, y: cy + 8 }, { x: cx + 8, y: cy + 8 },
    ];
  };

  return (
    <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }}>
      <g transform={`translate(${BOARD_OFFSET}, ${BOARD_OFFSET})`}>
        {/* Board background */}
      <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="#1a1a2e" rx={8} />

      {/* Cross-shaped board surface */}
      <rect x={6*S} y={0} width={3*S} height={6*S} fill="#25254a" />
      <rect x={0} y={6*S} width={6*S} height={3*S} fill="#25254a" />
      <rect x={9*S} y={6*S} width={6*S} height={3*S} fill="#25254a" />
      <rect x={6*S} y={9*S} width={3*S} height={6*S} fill="#25254a" />

      {/* Home zones */}
      <HomeZone player={0} tokens={tokens} totalPlayers={totalPlayers} />
      <HomeZone player={1} tokens={tokens} totalPlayers={totalPlayers} />
      <HomeZone player={2} tokens={tokens} totalPlayers={totalPlayers} />
      <HomeZone player={3} tokens={tokens} totalPlayers={totalPlayers} />

      {/* Center */}
      <CenterPiece />

      {/* Home stretch tiles */}
      {[0, 1, 2, 3].map(p =>
        HOME_STRETCH[p].map((pos, i) => (
          <Tile key={`hs-${p}-${i}`} pos={pos} size={ts} color={PLAYER_COLORS[p]} isHomeStretch />
        ))
      )}

      {/* Path tiles */}
      {PATH.map((pos, i) => (
        <Tile key={`p-${i}`} pos={pos} size={ts} isPath isSafe={isSafeSquare(i)} />
      ))}

      {/* Destination highlights */}
      {tokens.filter(t => t.playerIndex === playerIndex && validMoves.includes(t.tokenIndex)).map(tok => {
        const dice = 3; // Placeholder — real dice value should come from state
        if (tok.state === 'home' || tok.state === 'finished') return null;
        if (tok.state === 'path' || tok.state === 'stretch') {
          // We'll highlight the destination tile for movable tokens when selected
        }
        return null;
      })}

      {/* Path/Stretch tokens */}
      {Array.from(pathTokenGroups.entries()).map(([key, group]) => {
        const [x, y] = key.split(',').map(Number);
        const positions = stackPositions(group.length, x, y);
        return group.map((tok, i) => {
          const isMovable = validMoves.includes(tok.tokenIndex);
          return (
            <g key={`t-${tok.playerIndex}-${tok.tokenIndex}`} style={{ cursor: isMovable ? 'pointer' : 'default' }} onClick={() => isMovable && onTokenClick(tok.tokenIndex)}>
              <Token pos={positions[i]} colorIndex={playerColorIndex(tok.playerIndex, totalPlayers)} size={ts} movable={isMovable && tok.state !== 'finished'} isDragging={false} />
            </g>
          );
        });
      })}
      </g>
    </svg>
  );
}
