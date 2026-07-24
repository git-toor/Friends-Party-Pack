import { useMemo } from 'react';
import {
  PATH, HOME_STRETCH, HOME_TOKENS, SAFE_ABS,
  cellCenter, getBoardPosition,
} from './BoardLayout.js';

const P_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
const G = 1 / 15; // grid cell size in viewBox units

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

function Pawn({ cx, cy, color, isMovable }: { cx: number; cy: number; color: string; isMovable: boolean }) {
  const s = G * 0.42; // pawn scale
  return (
    <g>
      {/* Shadow */}
      <ellipse cx={cx + s*0.05} cy={cy + s*0.7} rx={s*0.6} ry={s*0.15} fill="rgba(0,0,0,0.15)" />
      {/* Base */}
      <rect x={cx - s*0.5} y={cy + s*0.3} width={s} height={s*0.3} rx={s*0.08} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={0.0015} />
      {/* Body (trapezoid) */}
      <path d={`M ${cx - s*0.35} ${cy + s*0.3} L ${cx - s*0.18} ${cy - s*0.1} L ${cx + s*0.18} ${cy - s*0.1} L ${cx + s*0.35} ${cy + s*0.3} Z`}
        fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={0.0015} />
      {/* Collar ring */}
      <rect x={cx - s*0.2} y={cy - s*0.13} width={s*0.4} height={s*0.06} rx={s*0.02} fill="rgba(0,0,0,0.1)" />
      {/* Head */}
      <circle cx={cx} cy={cy - s*0.25} r={s*0.2} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={0.0015} />
      {/* Head shine */}
      <ellipse cx={cx - s*0.06} cy={cy - s*0.3} rx={s*0.08} ry={s*0.05} fill="rgba(255,255,255,0.2)" />
      {/* Movable glow */}
      {isMovable && (
        <circle cx={cx} cy={cy} r={s*0.7} fill="none" stroke={color} strokeWidth={0.003}>
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

export function LudoBoard({ tokens, validMoves, totalPlayers, onTokenClick }: LudoBoardProps) {
  const tokenGroups = useMemo(() => {
    const groups = new Map<string, TokenData[]>();
    for (const tok of tokens) {
      if (tok.state !== 'path' && tok.state !== 'stretch') continue;
      const pos = getBoardPosition(tok.playerIndex, tok.progress);
      const key = `${pos.x.toFixed(5)},${pos.y.toFixed(5)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tok);
    }
    return groups;
  }, [tokens]);

  const stackPos = (count: number, cx: number, cy: number) => {
    const d = G * 0.018;
    if (count === 1) return [{ x: cx, y: cy }];
    if (count === 2) return [{ x: cx - d, y: cy }, { x: cx + d, y: cy }];
    if (count === 3) return [{ x: cx, y: cy - d }, { x: cx - d, y: cy + d }, { x: cx + d, y: cy + d }];
    return [
      { x: cx - d, y: cy - d }, { x: cx + d, y: cy - d },
      { x: cx - d, y: cy + d }, { x: cx + d, y: cy + d },
    ];
  };

  const cx = (col: number) => (col + 0.5) * G;
  const cy = (row: number) => (row + 0.5) * G;
  const ts = G * 0.88; // tile visual size

  const BASE_POSITIONS = [[0,0],[0,9],[9,9],[9,0]];

  return (
    <svg viewBox="0 0 1 1" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Z-1: Dark board background */}
      <rect x={0} y={0} width={1} height={1} fill="#1a1a2e" rx={0.02} />

      {/* Z-2: Cross-shaped arm surfaces */}
      {[
        [6,0,3,6],[0,6,6,3],[9,6,6,3],[6,9,3,6],
      ].map(([c,r,w,h], i) => (
        <rect key={`arm-${i}`} x={c*G} y={r*G} width={w*G} height={h*G} fill="#22224a" />
      ))}

      {/* Z-2: Colored base zones */}
      {[[0,0,0],[0,9,1],[9,9,2],[9,0,3]].map(([c,r,p]) => (
        <rect key={`base-${p}`} x={c*G} y={r*G} width={6*G} height={6*G}
          rx={0.015} fill={`${P_COLORS[p]}12`} stroke={`${P_COLORS[p]}35`} strokeWidth={0.003} />
      ))}

      {/* Z-2: Home stretch colored tiles (5 per player) */}
      {[0,1,2,3].map(p =>
        HOME_STRETCH[p].map(([c,r], i) => (
          <rect key={`hs-${p}-${i}`}
            x={c*G + (G - ts)/2} y={r*G + (G - ts)/2}
            width={ts} height={ts} rx={0.004}
            fill={P_COLORS[p]} opacity={0.55}
          />
        ))
      )}

      {/* Z-2: Outer path tiles with visible borders */}
      {PATH.map(([c,r], i) => {
        const isSafe = SAFE_ABS.has(i);
        const fill = isSafe ? '#2a2a4a' : '#25244a';
        const borderColor = isSafe ? '#f1c40f' : 'rgba(255,255,255,0.08)';
        const borderW = isSafe ? 0.003 : 0.0015;
        return (
          <rect key={`p-${i}`}
            x={c*G + (G - ts)/2} y={r*G + (G - ts)/2}
            width={ts} height={ts} rx={0.003}
            fill={fill} stroke={borderColor} strokeWidth={borderW}
          />
        );
      })}

      {/* Z-2: Center 3×3 finish zone */}
      <rect x={6*G} y={6*G} width={3*G} height={3*G}
        fill="#1a1a2e" stroke="rgba(255,255,255,0.06)" strokeWidth={0.002} />

      {/* Center colored triangles — snug inside 3×3 box */}
      <polygon points={`${cx(7.5)},${cy(7.5)} ${cx(6)},${cy(6)} ${cx(6)},${cy(9)}`} fill="rgba(231,76,60,0.2)" />
      <polygon points={`${cx(7.5)},${cy(7.5)} ${cx(6)},${cy(6)} ${cx(9)},${cy(6)}`} fill="rgba(46,204,113,0.2)" />
      <polygon points={`${cx(7.5)},${cy(7.5)} ${cx(9)},${cy(6)} ${cx(9)},${cy(9)}`} fill="rgba(241,196,15,0.2)" />
      <polygon points={`${cx(7.5)},${cy(7.5)} ${cx(6)},${cy(9)} ${cx(9)},${cy(9)}`} fill="rgba(52,152,219,0.2)" />
      {/* Center dot */}
      <circle cx={cx(7.5)} cy={cy(7.5)} r={0.015} fill="rgba(255,255,255,0.1)" />

      {/* Z-2: Home token starting circles */}
      {[0,1,2,3].map(p =>
        HOME_TOKENS[p].slice(0, Math.max(1, tokens.filter(t => t.playerIndex === p && t.state === 'home').length)).map(([c,r], i) => (
          <circle key={`ht-${p}-${i}`} cx={cx(c)} cy={cy(r)} r={G*0.2}
            fill={`${P_COLORS[p]}25`} stroke={`${P_COLORS[p]}40`} strokeWidth={0.002} />
        ))
      )}

      {/* Z-3: Safe zone ★ stars */}
      {PATH.filter((_, i) => SAFE_ABS.has(i)).map(([c,r]) => (
        <text key={`star-${c}-${r}`} x={cx(c)} y={cy(r)+G*0.3} textAnchor="middle" fontSize={G*0.55} fill="#f1c40f" opacity={0.85}>★</text>
      ))}

      {/* Z-3: Path/stretch tokens with stacking */}
      {Array.from(tokenGroups.entries()).map(([key, group]) => {
        const [x, y] = key.split(',').map(Number);
        const offsets = stackPos(group.length, x, y);
        return group.map((tok, i) => {
          const isMovable = validMoves.includes(tok.tokenIndex);
          const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
          return (
            <g key={`t-${tok.playerIndex}-${tok.tokenIndex}`}
              style={{ cursor: isMovable ? 'pointer' : 'default' }}
              onClick={() => isMovable && onTokenClick(tok.tokenIndex)}
            >
              <Pawn cx={offsets[i].x} cy={offsets[i].y} color={P_COLORS[cIdx]} isMovable={isMovable} />
            </g>
          );
        });
      })}

      {/* Home tokens (idle in base) */}
      {tokens.filter(t => t.state === 'home').map(tok => {
        const cell = HOME_TOKENS[tok.playerIndex]?.[tok.tokenIndex % 4];
        if (!cell) return null;
        const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
        const x = cx(cell[0]), y = cy(cell[1]);
        return (
          <g key={`h-${tok.playerIndex}-${tok.tokenIndex}`}>
            <circle cx={x} cy={y} r={G*0.25} fill={P_COLORS[cIdx]} stroke="rgba(0,0,0,0.2)" strokeWidth={0.002} />
            <ellipse cx={x-G*0.05} cy={y-G*0.08} rx={G*0.1} ry={G*0.06} fill="rgba(255,255,255,0.15)" />
          </g>
        );
      })}

      {/* Finished tokens at center */}
      {tokens.filter(t => t.state === 'finished').map(tok => {
        const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
        return (
          <circle key={`f-${tok.playerIndex}-${tok.tokenIndex}`}
            cx={cx(7.5)} cy={cy(7.5)} r={G*0.18}
            fill={P_COLORS[cIdx]} stroke="rgba(0,0,0,0.2)" strokeWidth={0.002} opacity={0.7} />
        );
      })}
    </svg>
  );
}
