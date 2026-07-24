import { useMemo } from 'react';
import {
  PATH, HOME_STRETCH, HOME_TOKENS, SAFE_ABS,
  cellCenter, getBoardPosition, isSafeSquare,
  GRID,
} from './BoardLayout.js';

// Player colors
const P_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];

export function playerColorIndex(playerIndex: number, totalPlayers: number): number {
  if (totalPlayers === 2) return playerIndex === 0 ? 0 : 2;
  return playerIndex;
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
  playerIndex: number;
  totalPlayers: number;
  onTokenClick: (tokenIndex: number) => void;
}

// SVG viewBox is 1×1; all grid positions are divided by GRID=15
const C = (col: number) => (col + 0.5) / GRID;
const R = (row: number) => (row + 0.5) / GRID;
const SZ = 0.055; // tile size in viewBox units

// Base area rectangles per player (col0, row0, width in cols, height in rows)
const BASES: { c: number; r: number; w: number; h: number; color: string }[] = [
  { c: 0, r: 0, w: 6, h: 6, color: P_COLORS[0] },
  { c: 0, r: 9, w: 6, h: 6, color: P_COLORS[1] },
  { c: 9, r: 9, w: 6, h: 6, color: P_COLORS[2] },
  { c: 9, r: 0, w: 6, h: 6, color: P_COLORS[3] },
];

// Arm rectangles forming the cross
const ARMS: { c: number; r: number; w: number; h: number }[] = [
  { c: 6, r: 0, w: 3, h: 6 },  // top
  { c: 0, r: 6, w: 6, h: 3 },  // left
  { c: 9, r: 6, w: 6, h: 3 },  // right
  { c: 6, r: 9, w: 3, h: 6 },  // bottom
];

// Stacking offsets for multi-token tiles
function stackOffsets(count: number): { dx: number; dy: number }[] {
  if (count === 1) return [{ dx: 0, dy: 0 }];
  if (count === 2) return [{ dx: -0.015, dy: 0 }, { dx: 0.015, dy: 0 }];
  if (count === 3) return [{ dx: 0, dy: -0.012 }, { dx: -0.015, dy: 0.012 }, { dx: 0.015, dy: 0.012 }];
  return [
    { dx: -0.015, dy: -0.015 }, { dx: 0.015, dy: -0.015 },
    { dx: -0.015, dy: 0.015 }, { dx: 0.015, dy: 0.015 },
  ];
}

export function LudoBoard({ tokens, validMoves, totalPlayers, onTokenClick }: LudoBoardProps) {
  // Group path/stretch tokens by board position
  const tokenGroups = useMemo(() => {
    const groups = new Map<string, TokenData[]>();
    for (const tok of tokens) {
      if (tok.state !== 'path' && tok.state !== 'stretch') continue;
      const pos = getBoardPosition(tok.playerIndex, tok.progress);
      const key = `${pos.x.toFixed(4)},${pos.y.toFixed(4)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tok);
    }
    return groups;
  }, [tokens]);

  return (
    <svg viewBox="0 0 1 1" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Z-1: Dark board background */}
      <rect x={0} y={0} width={1} height={1} fill="#1a1a2e" rx={0.02} />

      {/* Z-2: Cross-shaped arm surfaces */}
      {ARMS.map((a, i) => (
        <rect key={`arm-${i}`} x={a.c / GRID} y={a.r / GRID} width={a.w / GRID} height={a.h / GRID}
          fill="#25254a" stroke="#2a2a4a" strokeWidth={0.002} />
      ))}

      {/* Z-2: Colored base zones */}
      {BASES.map((b, i) => (
        <rect key={`base-${i}`} x={b.c / GRID} y={b.r / GRID} width={b.w / GRID} height={b.h / GRID}
          fill={`${b.color}15`} stroke={`${b.color}40`} strokeWidth={0.003} rx={0.01} />
      ))}

      {/* Z-2: Center finish zone (3×3 box) */}
      <rect x={6/GRID} y={6/GRID} width={3/GRID} height={3/GRID}
        fill="#1a1a2e" stroke="rgba(255,255,255,0.1)" strokeWidth={0.003} rx={0.005} />

      {/* Z-2: Colored triangles in center */}
      <polygon points={`${C(7.5)},${C(7.5)} ${C(6)},${C(6)} ${C(6)},${C(9)}`} fill="rgba(231,76,60,0.25)" />
      <polygon points={`${C(7.5)},${C(7.5)} ${C(6)},${C(6)} ${C(9)},${C(6)}`} fill="rgba(46,204,113,0.25)" />
      <polygon points={`${C(7.5)},${C(7.5)} ${C(9)},${C(6)} ${C(9)},${C(9)}`} fill="rgba(241,196,15,0.25)" />
      <polygon points={`${C(7.5)},${C(7.5)} ${C(6)},${C(9)} ${C(9)},${C(9)}`} fill="rgba(52,152,219,0.25)" />
      {/* Center dot */}
      <circle cx={C(7.5)} cy={C(7.5)} r={0.02} fill="rgba(255,255,255,0.15)" />

      {/* Z-2: Home token starting circles */}
      {[0, 1, 2, 3].map(p =>
        HOME_TOKENS[p].map(([c, r], i) => (
          <circle key={`ht-${p}-${i}`} cx={C(c)} cy={R(r)} r={0.018}
            fill={`${P_COLORS[p]}30`} stroke={`${P_COLORS[p]}50`} strokeWidth={0.002} />
        ))
      )}

      {/* Z-2: Home stretch colored path tiles */}
      {[0, 1, 2, 3].map(p =>
        HOME_STRETCH[p].map(([c, r], i) => (
          <rect key={`hs-${p}-${i}`}
            x={c / GRID + (1 - SZ) / 2 / GRID} y={r / GRID + (1 - SZ) / 2 / GRID}
            width={SZ / GRID} height={SZ / GRID} rx={0.003}
            fill={P_COLORS[p]} opacity={0.7}
          />
        ))
      )}

      {/* Z-2: Outer path tiles */}
      {PATH.map(([c, r], i) => (
        <rect key={`p-${i}`}
          x={c / GRID + (1 - SZ) / 2 / GRID} y={r / GRID + (1 - SZ) / 2 / GRID}
          width={SZ / GRID} height={SZ / GRID} rx={0.003}
          fill="#2a2a4a" stroke="#3a3a5a" strokeWidth={0.002}
        />
      ))}

      {/* Z-3: Safe square stars (perfectly centered in cell) */}
      {PATH.filter((_, i) => SAFE_ABS.has(i)).map(([c, r]) => (
        <text key={`safe-${c}-${r}`} x={C(c)} y={R(r) + 0.018}
          textAnchor="middle" fontSize={0.035} fill="#f1c40f" opacity={0.8}>
          ★
        </text>
      ))}

      {/* Z-3: Destination highlight rings */}
      {Array.from(tokenGroups.entries()).map(([key, group]) => {
        if (!group.some(t => validMoves.includes(t.tokenIndex))) return null;
        const [x, y] = key.split(',').map(Number);
        return (
          <rect key={`dest-${key}`}
            x={x - SZ / 2 / GRID - 0.003} y={y - SZ / 2 / GRID - 0.003}
            width={SZ / GRID + 0.006} height={SZ / GRID + 0.006} rx={0.004}
            fill="none" stroke="#fbbf24" strokeWidth={0.003}
            strokeDasharray="0.008 0.006"
          >
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
          </rect>
        );
      })}

      {/* Z-3: Path tokens with stacking */}
      {Array.from(tokenGroups.entries()).map(([key, group]) => {
        const [x, y] = key.split(',').map(Number);
        const offsets = stackOffsets(group.length);
        return group.map((tok, i) => {
          const isMovable = validMoves.includes(tok.tokenIndex);
          const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
          return (
            <g key={`t-${tok.playerIndex}-${tok.tokenIndex}`}
              style={{ cursor: isMovable ? 'pointer' : 'default' }}
              onClick={() => isMovable && onTokenClick(tok.tokenIndex)}
            >
              {/* Shadow */}
              <ellipse cx={x + offsets[i].dx + 0.003} cy={y + offsets[i].dy + 0.005}
                rx={0.023} ry={0.005} fill="rgba(0,0,0,0.2)" />
              {/* Pawn body */}
              <path d={`
                M ${x + offsets[i].dx - 0.018},${y + offsets[i].dy + 0.025}
                C ${x + offsets[i].dx - 0.018},${y + offsets[i].dy + 0.025}
                  ${x + offsets[i].dx - 0.022},${y + offsets[i].dy + 0.015}
                  ${x + offsets[i].dx - 0.022},${y + offsets[i].dy + 0.005}
                C ${x + offsets[i].dx - 0.022},${y + offsets[i].dy - 0.005}
                  ${x + offsets[i].dx - 0.016},${y + offsets[i].dy - 0.012}
                  ${x + offsets[i].dx - 0.012},${y + offsets[i].dy - 0.015}
                C ${x + offsets[i].dx - 0.014},${y + offsets[i].dy - 0.022}
                  ${x + offsets[i].dx - 0.012},${y + offsets[i].dy - 0.028}
                  ${x + offsets[i].dx - 0.006},${y + offsets[i].dy - 0.032}
                C ${x + offsets[i].dx},${y + offsets[i].dy - 0.035}
                  ${x + offsets[i].dx + 0.006},${y + offsets[i].dy - 0.032}
                  ${x + offsets[i].dx + 0.012},${y + offsets[i].dy - 0.028}
                C ${x + offsets[i].dx + 0.012},${y + offsets[i].dy - 0.022}
                  ${x + offsets[i].dx + 0.014},${y + offsets[i].dy - 0.022}
                  ${x + offsets[i].dx + 0.012},${y + offsets[i].dy - 0.015}
                C ${x + offsets[i].dx + 0.016},${y + offsets[i].dy - 0.012}
                  ${x + offsets[i].dx + 0.022},${y + offsets[i].dy - 0.005}
                  ${x + offsets[i].dx + 0.022},${y + offsets[i].dy + 0.005}
                C ${x + offsets[i].dx + 0.022},${y + offsets[i].dy + 0.015}
                  ${x + offsets[i].dx + 0.018},${y + offsets[i].dy + 0.025}
                  ${x + offsets[i].dx + 0.018},${y + offsets[i].dy + 0.025}
                Z`}
                fill={P_COLORS[cIdx]} stroke="rgba(0,0,0,0.2)" strokeWidth={0.002}
              />
              {/* Head highlight */}
              <ellipse cx={x + offsets[i].dx} cy={y + offsets[i].dy - 0.022}
                rx={0.006} ry={0.004} fill="rgba(255,255,255,0.2)" />
              {/* Movable glow ring */}
              {isMovable && (
                <circle cx={x + offsets[i].dx} cy={y + offsets[i].dy} r={0.035}
                  fill="none" stroke={P_COLORS[cIdx]} strokeWidth={0.003}>
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="r" values="0.03;0.038;0.03" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        });
      })}

      {/* Home tokens (not on path) */}
      {tokens.filter(t => t.state === 'home').map(tok => {
        const homePos = HOME_TOKENS[tok.playerIndex]?.[0];
        if (!homePos) return null;
        const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
        const cx = C(homePos[0]), cy = R(homePos[1]);
        return (
          <g key={`home-${tok.playerIndex}-${tok.tokenIndex}`}>
            <ellipse cx={cx + 0.003} cy={cy + 0.005} rx={0.023} ry={0.005} fill="rgba(0,0,0,0.2)" />
            <circle cx={cx} cy={cy} r={0.022}
              fill={P_COLORS[cIdx]} stroke="rgba(0,0,0,0.2)" strokeWidth={0.002} />
            <circle cx={cx - 0.005} cy={cy - 0.005} r={0.008} fill="rgba(255,255,255,0.15)" />
          </g>
        );
      })}

      {/* Finished tokens at center */}
      {tokens.filter(t => t.state === 'finished').map(tok => {
        const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
        return (
          <circle key={`fin-${tok.playerIndex}-${tok.tokenIndex}`}
            cx={C(7.5)} cy={R(7.5)} r={0.018}
            fill={P_COLORS[cIdx]} stroke="rgba(0,0,0,0.2)" strokeWidth={0.002} opacity={0.8}
          />
        );
      })}
    </svg>
  );
}
