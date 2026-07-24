import { useMemo } from 'react';
import {
  PATH, HOME_STRETCH, HOME_TOKENS, SAFE_ABS,
  getBoardPosition, getHomeTokens, getHomeStretch, playerQuadrant,
} from './BoardLayout.js';

const P_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
const G = 1 / 15; // grid cell size in viewBox units

export function playerColorIndex(playerIndex: number, totalPlayers: number): number {
  return playerQuadrant(playerIndex, totalPlayers);
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
  const s = G * 0.35; // pawn scale — 70% of tile
  return (
    <g>
      <ellipse cx={cx + s*0.05} cy={cy + s*0.55} rx={s*0.5} ry={s*0.12} fill="rgba(0,0,0,0.12)" />
      {/* Wide flared base */}
      <rect x={cx - s*0.5} y={cy + s*0.2} width={s} height={s*0.28} rx={s*0.06} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.0015} />
      {/* Tapered body */}
      <path d={`M ${cx - s*0.4} ${cy + s*0.2} L ${cx - s*0.15} ${cy - s*0.15} L ${cx + s*0.15} ${cy - s*0.15} L ${cx + s*0.4} ${cy + s*0.2} Z`}
        fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.0015} />
      {/* Collar */}
      <rect x={cx - s*0.2} y={cy - s*0.18} width={s*0.4} height={s*0.06} rx={s*0.015} fill="rgba(0,0,0,0.08)" />
      {/* Circular head */}
      <circle cx={cx} cy={cy - s*0.32} r={s*0.22} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.0015} />
      {/* Head highlight */}
      <ellipse cx={cx - s*0.06} cy={cy - s*0.36} rx={s*0.08} ry={s*0.05} fill="rgba(255,255,255,0.18)" />
      {/* Movable glow */}
      {isMovable && (
        <circle cx={cx} cy={cy} r={s*0.6} fill="none" stroke={color} strokeWidth={0.003}>
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite" />
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
      const pos = getBoardPosition(tok.playerIndex, tok.progress, totalPlayers);
      const key = `${pos.x.toFixed(5)},${pos.y.toFixed(5)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tok);
    }
    return groups;
  }, [tokens]);

  // Helper: get mapped quadrant for a player
  const pq = (pi: number) => playerQuadrant(pi, totalPlayers);
  // All 4 quadrants with their active state
  const allQuadrants = [0, 1, 2, 3].map(q => ({
    q,
    isActive: Array.from({ length: totalPlayers }, (_, i) => pq(i)).includes(q),
  }));

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
  const ex = (col: number) => col * G;  // exact grid edge
  const ts = G * 0.88; // tile visual size
  const starSize = G * 0.5;

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

      {/* Z-2: Colored base zones — all 4 quadrants, dim if inactive */}
      {[[0,0,0],[0,9,1],[9,9,2],[9,0,3]].map(([c,r,q]) => {
        const isActive = allQuadrants.find(a => a.q === q)?.isActive ?? false;
        return (
          <rect key={`base-${q}`} x={c*G} y={r*G} width={6*G} height={6*G}
            rx={0.015}
            fill={isActive ? `${P_COLORS[q]}15` : `${P_COLORS[q]}06`}
            stroke={isActive ? `${P_COLORS[q]}40` : `${P_COLORS[q]}15`}
            strokeWidth={0.003} />
        );
      })}

      {/* Z-2: Home stretch colored tiles — all 4 quadrants, dim if inactive */}
      {[0,1,2,3].map(q => {
        const isActive = allQuadrants.find(a => a.q === q)?.isActive ?? false;
        return (getHomeStretch(q) || []).map(([c,r], i) => (
          <rect key={`hs-${q}-${i}`}
            x={c*G + (G - ts)/2} y={r*G + (G - ts)/2}
            width={ts} height={ts} rx={0.004}
            fill={P_COLORS[q]} opacity={isActive ? 0.55 : 0.12}
          />
        ));
      })}

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

      {/* Center colored triangles — anchored to exact 3×3 edges */}
      {(() => {
        const ctr = 7.5 * G; // dead center
        const left = ex(6), right = ex(9), top = ex(6), bottom = ex(9);
        return (<>
          <polygon points={`${ctr},${ctr} ${left},${top} ${left},${bottom}`} fill="rgba(231,76,60,0.2)" />
          <polygon points={`${ctr},${ctr} ${left},${top} ${right},${top}`} fill="rgba(46,204,113,0.2)" />
          <polygon points={`${ctr},${ctr} ${right},${top} ${right},${bottom}`} fill="rgba(241,196,15,0.2)" />
          <polygon points={`${ctr},${ctr} ${left},${bottom} ${right},${bottom}`} fill="rgba(52,152,219,0.2)" />
          <circle cx={ctr} cy={ctr} r={0.015} fill="rgba(255,255,255,0.1)" />
        </>);
      })()}

      {/* Z-2: Home token starting circles — all 4 quadrants, dim if inactive */}
      {[0,1,2,3].map(q => {
        const isActive = allQuadrants.find(a => a.q === q)?.isActive ?? false;
        return (getHomeTokens(q) || []).map(([c,r], i) => (
          <circle key={`ht-${q}-${i}`} cx={cx(c)} cy={cy(r)} r={G*0.22}
            fill={isActive ? `${P_COLORS[q]}20` : `${P_COLORS[q]}10`}
            stroke={isActive ? `${P_COLORS[q]}35` : `${P_COLORS[q]}15`}
            strokeWidth={0.002} />
        ));
      })}

      {/* Z-3: Safe zone ★ stars — centered in tile */}
      {PATH.filter((_, i) => SAFE_ABS.has(i)).map(([c,r]) => (
        <text key={`star-${c}-${r}`} x={cx(c)} y={cy(r)} dy="0.35em"
          textAnchor="middle" fontSize={starSize} fill="#f1c40f" opacity={0.9}
          style={{ userSelect: 'none' }}>★</text>
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
        const q = pq(tok.playerIndex);
        const cell = getHomeTokens(q)[tok.tokenIndex % 4];
        if (!cell) return null;
        const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
        return (
          <Pawn key={`h-${tok.playerIndex}-${tok.tokenIndex}`}
            cx={cx(cell[0])} cy={cy(cell[1])} color={P_COLORS[cIdx]} isMovable={false} />
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
