import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  PATH, SAFE_ABS,
  getBoardPosition, getHomeTokensByQuadrant,
  getHomeStretchByQuadrant, playerQuadrant,
} from './BoardLayout.js';
import { PLAYER_COLORS } from './constants.js';

const G = 1 / 15;

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
  diceValue: number | null;
  isMyTurn: boolean;
  onMoveToken: (tokenIndex: number) => void;
  stepAnim?: { tokenIndex: number; from: number; to: number; playerIndex: number } | null;
  onStepAnimDone?: () => void;
}

const cx = (col: number) => (col + 0.5) * G;
const cy = (row: number) => (row + 0.5) * G;
const ex = (col: number) => col * G;
const ts = G * 0.88;
const starSize = G * 0.5;
const KNOCKOUT_DIST = G * 0.6;
const SNAP_DIST = G * 0.7;

function tileCenter(tileIdx: number, playerIdx: number, total: number) {
  const pos = getBoardPosition(playerIdx, tileIdx, total);
  return { x: cx(pos.x), y: cy(pos.y) };
}

function homeCellCenter(tok: TokenData, total: number) {
  const q = playerQuadrant(tok.playerIndex, total);
  const cell = (getHomeTokensByQuadrant(q) || [])[tok.tokenIndex % 4];
  if (!cell) return null;
  return { x: cx(cell[0]), y: cy(cell[1]) };
}

function stackPos(count: number, cx_: number, cy_: number) {
  const d = G * 0.018;
  if (count === 1) return [{ x: cx_, y: cy_ }];
  if (count === 2) return [{ x: cx_ - d, y: cy_ }, { x: cx_ + d, y: cy_ }];
  if (count === 3) return [{ x: cx_, y: cy_ - d }, { x: cx_ - d, y: cy_ + d }, { x: cx_ + d, y: cy_ + d }];
  return [
    { x: cx_ - d, y: cy_ - d }, { x: cx_ + d, y: cy_ - d },
    { x: cx_ - d, y: cy_ + d }, { x: cx_ + d, y: cy_ + d },
  ];
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function randomFlyTarget(base: { x: number; y: number }) {
  const angle = Math.random() * Math.PI * 2;
  const r = G * (1.5 + Math.random() * 2);
  return { x: base.x + Math.cos(angle) * r, y: base.y + Math.sin(angle) * r };
}

function Pawn({ cx, cy, color, isMovable, scale = 1 }: { cx: number; cy: number; color: string; isMovable?: boolean; scale?: number }) {
  const s = G * 0.35 * scale;
  return (
    <g>
      <ellipse cx={cx + s*0.05} cy={cy + s*0.55} rx={s*0.5} ry={s*0.12} fill="rgba(0,0,0,0.12)" />
      <rect x={cx - s*0.5} y={cy + s*0.2} width={s} height={s*0.28} rx={s*0.06} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.0015} />
      <path d={`M ${cx - s*0.4} ${cy + s*0.2} L ${cx - s*0.15} ${cy - s*0.15} L ${cx + s*0.15} ${cy - s*0.15} L ${cx + s*0.4} ${cy + s*0.2} Z`}
        fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.0015} />
      <rect x={cx - s*0.2} y={cy - s*0.18} width={s*0.4} height={s*0.06} rx={s*0.015} fill="rgba(0,0,0,0.08)" />
      <circle cx={cx} cy={cy - s*0.32} r={s*0.22} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.0015} />
      <ellipse cx={cx - s*0.06} cy={cy - s*0.36} rx={s*0.08} ry={s*0.05} fill="rgba(255,255,255,0.18)" />
      {isMovable && (
        <circle cx={cx} cy={cy} r={s*0.6} fill="none" stroke={color} strokeWidth={0.003}>
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

export function LudoBoard({ tokens, validMoves, totalPlayers, onMoveToken, diceValue, isMyTurn, stepAnim, onStepAnimDone }: LudoBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{
    tokenIndex: number;
    playerIndex: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [ghosts, setGhosts] = useState<Map<string, { x: number; y: number }>>(new Map());

  // step animation
  const [stepPos, setStepPos] = useState<{ x: number; y: number } | null>(null);
  const [stepTokenIdx, setStepTokenIdx] = useState<number | null>(null);
  const stepFrameRef = useRef(0);

  // refs for stable drag handler access
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  const diceValueRef = useRef(diceValue);
  diceValueRef.current = diceValue;
  const onMoveRef = useRef(onMoveToken);
  onMoveRef.current = onMoveToken;
  const ghostsRef = useRef(ghosts);
  ghostsRef.current = ghosts;

  const toVB = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  }, []);

  const tokenPos = useCallback((tok: TokenData) => {
    if (tok.state === 'home') return homeCellCenter(tok, totalPlayers);
    if (tok.state === 'finished') return { x: cx(7.5), y: cy(7.5) };
    const p = getBoardPosition(tok.playerIndex, tok.progress, totalPlayers);
    return { x: cx(p.x), y: cy(p.y) };
  }, [totalPlayers]);

  // step animation
  useEffect(() => {
    if (!stepAnim || !onStepAnimDone) return;
    const steps: { x: number; y: number }[] = [];
    const dir = stepAnim.to > stepAnim.from ? 1 : -1;
    for (let p = stepAnim.from; p !== stepAnim.to + dir; p += dir) {
      const pos = getBoardPosition(stepAnim.playerIndex, p, totalPlayers);
      steps.push({ x: cx(pos.x), y: cy(pos.y) });
    }
    let idx = 0;
    setStepTokenIdx(stepAnim.tokenIndex);
    const tick = () => {
      if (idx >= steps.length) {
        setStepPos(null);
        setStepTokenIdx(null);
        onStepAnimDone();
        return;
      }
      setStepPos(steps[idx]);
      idx++;
      stepFrameRef.current = window.setTimeout(tick, 120);
    };
    tick();
    return () => clearTimeout(stepFrameRef.current);
  }, [stepAnim, totalPlayers, onStepAnimDone]);

  // token grouping (exclude step-animating token)
  const tokenGroups = useMemo(() => {
    const groups = new Map<string, TokenData[]>();
    for (const tok of tokens) {
      if (tok.state !== 'path' && tok.state !== 'stretch') continue;
      if (stepTokenIdx !== null && tok.tokenIndex === stepAnim?.tokenIndex && tok.playerIndex === stepAnim.playerIndex) continue;
      const pos = getBoardPosition(tok.playerIndex, tok.progress, totalPlayers);
      const key = `${pos.x.toFixed(5)},${pos.y.toFixed(5)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tok);
    }
    return groups;
  }, [tokens, stepTokenIdx, stepAnim, totalPlayers]);

  // validate and commit drop
  const commitDrop = useCallback((vb: { x: number; y: number }, d: { tokenIndex: number; playerIndex: number }) => {
    const tok = tokensRef.current.find(t => t.tokenIndex === d.tokenIndex && t.playerIndex === d.playerIndex);
    if (!tok) return false;
    const dv = diceValueRef.current;
    if (dv === null) return false;
    const targetProg = tok.state === 'home' ? 0 : tok.progress + dv;
    const targetTile = tileCenter(targetProg, tok.playerIndex, totalPlayers);
    const dDist = dist(vb, targetTile);
    if (dDist < SNAP_DIST) {
      onMoveRef.current(d.tokenIndex);
      return true;
    }
    return false;
  }, [totalPlayers]);

  // global drag listeners
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const vb = pt.matrixTransform(ctm.inverse());
      setDrag(prev => prev ? { ...prev, currentX: vb.x, currentY: vb.y } : null);

      // collision check
      const allToks = tokensRef.current;
      const curGhosts = ghostsRef.current;
      for (const tok of allToks) {
        if (tok.playerIndex === d.playerIndex) continue;
        if (tok.state !== 'path') continue;
        const pos = tokenPos(tok);
        if (!pos) continue;
        const gKey = `g-${tok.playerIndex}-${tok.tokenIndex}`;
        if (curGhosts.has(gKey)) continue;
        if (dist(vb, pos) < KNOCKOUT_DIST) {
          if (!SAFE_ABS.has(tok.progress)) {
            const target = randomFlyTarget(pos);
            setGhosts(prev => { const m = new Map(prev); m.set(gKey, target); return m; });
          }
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const svg = svgRef.current;
      if (!svg) { setDrag(null); return; }
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) { setDrag(null); return; }
      const vb = pt.matrixTransform(ctm.inverse());
      commitDrop(vb, d);
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, toVB, tokenPos, commitDrop]);

  // dismiss ghost
  const dismissGhost = useCallback((key: string) => {
    setGhosts(prev => { const m = new Map(prev); m.delete(key); return m; });
  }, []);

  const isDraggable = (tok: TokenData) => {
    if (!isMyTurn || !diceValue) return false;
    return validMoves.includes(tok.tokenIndex);
  };

  const handlePointerDown = useCallback((e: React.PointerEvent, tok: TokenData) => {
    if (!isDraggable(tok)) return;
    e.preventDefault();
    const vb = toVB(e.clientX, e.clientY);
    setDrag({
      tokenIndex: tok.tokenIndex,
      playerIndex: tok.playerIndex,
      currentX: vb.x,
      currentY: vb.y,
    });
  }, [isDraggable, toVB]);

  const pq = (pi: number) => playerQuadrant(pi, totalPlayers);
  const allQuadrants = [0, 1, 2, 3].map(q => ({
    q, isActive: Array.from({ length: totalPlayers }, (_, i) => pq(i)).includes(q),
  }));

  const draggedTokenData = drag ? tokens.find(t => t.tokenIndex === drag.tokenIndex && t.playerIndex === drag.playerIndex) : null;

  return (
    <svg ref={svgRef} viewBox="0 0 1 1" style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}>
      <rect x={0} y={0} width={1} height={1} fill="#1a1a2e" rx={0.02} />
      {[[6,0,3,6],[0,6,6,3],[9,6,6,3],[6,9,3,6]].map(([c,r,w,h], i) => (
        <rect key={`arm-${i}`} x={c*G} y={r*G} width={w*G} height={h*G} fill="#22224a" />
      ))}
      {[[0,9,0],[0,0,1],[9,0,2],[9,9,3]].map(([c,r,q]) => {
        const a = allQuadrants.find(x => x.q === q)?.isActive ?? false;
        return <rect key={`base-${q}`} x={c*G} y={r*G} width={6*G} height={6*G} rx={0.015}
          fill={a ? `${PLAYER_COLORS[q]}15` : `${PLAYER_COLORS[q]}06`}
          stroke={a ? `${PLAYER_COLORS[q]}40` : `${PLAYER_COLORS[q]}15`} strokeWidth={0.003} />;
      })}
      {[0,1,2,3].map(q => {
        const a = allQuadrants.find(x => x.q === q)?.isActive ?? false;
        return (getHomeStretchByQuadrant(q) || []).map(([c,r], i) => (
          <rect key={`hs-${q}-${i}`} x={c*G + (G - ts)/2} y={r*G + (G - ts)/2}
            width={ts} height={ts} rx={0.004}
            fill={PLAYER_COLORS[q]} opacity={a ? 0.55 : 0.12} />
        ));
      })}
      {PATH.map(([c,r], i) => {
        const s = SAFE_ABS.has(i);
        return <rect key={`p-${i}`} x={c*G + (G - ts)/2} y={r*G + (G - ts)/2}
          width={ts} height={ts} rx={0.003}
          fill={s ? '#2a2a4a' : '#25244a'}
          stroke={s ? '#f1c40f' : 'rgba(255,255,255,0.08)'}
          strokeWidth={s ? 0.003 : 0.0015} />;
      })}
      <rect x={6*G} y={6*G} width={3*G} height={3*G}
        fill="#1a1a2e" stroke="rgba(255,255,255,0.06)" strokeWidth={0.002} />
      {(() => {
        const ctr = 7.5 * G, l = ex(6), r = ex(9), t = ex(6), b = ex(9);
        return (<>
          <polygon points={`${ctr},${ctr} ${l},${t} ${l},${b}`} fill="rgba(231,76,60,0.2)" />
          <polygon points={`${ctr},${ctr} ${l},${t} ${r},${t}`} fill="rgba(46,204,113,0.2)" />
          <polygon points={`${ctr},${ctr} ${r},${t} ${r},${b}`} fill="rgba(241,196,15,0.2)" />
          <polygon points={`${ctr},${ctr} ${l},${b} ${r},${b}`} fill="rgba(52,152,219,0.2)" />
          <circle cx={ctr} cy={ctr} r={0.015} fill="rgba(255,255,255,0.1)" />
        </>);
      })()}
      {[0,1,2,3].map(q => {
        const a = allQuadrants.find(x => x.q === q)?.isActive ?? false;
        return (getHomeTokensByQuadrant(q) || []).map(([c,r], i) => (
          <circle key={`ht-${q}-${i}`} cx={cx(c)} cy={cy(r)} r={G*0.22}
            fill={a ? `${PLAYER_COLORS[q]}20` : `${PLAYER_COLORS[q]}10`}
            stroke={a ? `${PLAYER_COLORS[q]}35` : `${PLAYER_COLORS[q]}15`} strokeWidth={0.002} />
        ));
      })}
      {PATH.filter((_, i) => SAFE_ABS.has(i)).map(([c,r]) => (
        <text key={`star-${c}-${r}`} x={cx(c)} y={cy(r)} dy="0.35em"
          textAnchor="middle" fontSize={starSize} fill="#f1c40f" opacity={0.9}
          style={{ userSelect: 'none' }}>★</text>
      ))}
      {Array.from(tokenGroups.entries()).map(([key, group]) => {
        const [x, y] = key.split(',').map(Number);
        const offsets = stackPos(group.length, x, y);
        return group.map((tok, i) => {
          const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
          return (
            <g key={`t-${tok.playerIndex}-${tok.tokenIndex}`}
              style={{ cursor: isDraggable(tok) ? 'grab' : 'default' }}
              onPointerDown={e => handlePointerDown(e, tok)}>
              <Pawn cx={offsets[i].x} cy={offsets[i].y} color={PLAYER_COLORS[cIdx]}
                isMovable={validMoves.includes(tok.tokenIndex)} />
            </g>
          );
        });
      })}
      {stepPos && stepTokenIdx !== null && stepAnim && (
        <Pawn cx={stepPos.x} cy={stepPos.y}
          color={PLAYER_COLORS[playerColorIndex(stepAnim.playerIndex, totalPlayers)]} />
      )}
      {tokens.filter(t => t.state === 'home').map(tok => {
        if (drag && drag.tokenIndex === tok.tokenIndex && drag.playerIndex === tok.playerIndex) return null;
        const cell = homeCellCenter(tok, totalPlayers);
        if (!cell) return null;
        const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
        return (
          <g key={`h-${tok.playerIndex}-${tok.tokenIndex}`}
            style={{ cursor: isDraggable(tok) ? 'grab' : 'default' }}
            onPointerDown={e => handlePointerDown(e, tok)}>
            <Pawn cx={cell.x} cy={cell.y} color={PLAYER_COLORS[cIdx]}
              isMovable={validMoves.includes(tok.tokenIndex)} />
          </g>
        );
      })}
      {drag && draggedTokenData && (
        <g style={{ pointerEvents: 'none', opacity: 0.85 }}>
          <Pawn cx={drag.currentX} cy={drag.currentY}
            color={PLAYER_COLORS[playerColorIndex(draggedTokenData.playerIndex, totalPlayers)]}
            scale={1.15} />
        </g>
      )}
      {Array.from(ghosts.entries()).map(([key, pos]) => {
        const [_, pIdx, tIdx] = key.split('-');
        return (
          <g key={`g-${key}`} style={{ cursor: 'pointer', opacity: 0.6 }}
            onClick={() => dismissGhost(key)}>
            <ellipse cx={pos.x} cy={pos.y + G*0.02} rx={G*0.12} ry={G*0.03} fill="rgba(0,0,0,0.15)" />
            <rect x={pos.x - G*0.1} y={pos.y - G*0.05} width={G*0.2} height={G*0.08} rx={G*0.01}
              fill={PLAYER_COLORS[Number(pIdx)]} opacity={0.5} />
            <circle cx={pos.x} cy={pos.y - G*0.06} r={G*0.06}
              fill={PLAYER_COLORS[Number(pIdx)]} opacity={0.5} />
          </g>
        );
      })}
      {tokens.filter(t => t.state === 'finished').map(tok => {
        const cIdx = playerColorIndex(tok.playerIndex, totalPlayers);
        return (
          <circle key={`f-${tok.playerIndex}-${tok.tokenIndex}`}
            cx={cx(7.5)} cy={cy(7.5)} r={G*0.18}
            fill={PLAYER_COLORS[cIdx]} stroke="rgba(0,0,0,0.2)" strokeWidth={0.002} opacity={0.7} />
        );
      })}
    </svg>
  );
}