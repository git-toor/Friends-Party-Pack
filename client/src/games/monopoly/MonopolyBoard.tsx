import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_COLORS } from './constants.js';
import { getTokenDef } from '../../components/TokenList.js';

const S = 1.5;

const TILE_SPACE_IDS: string[] = [
  'go', 'chandni_chowk', 'jugaad_1', 'hazratganj', 'income_tax', 'vande_bharat',
  'ghat_road', 'kismat_1', 'mi_road', 'law_garden', 'jail', 'mall_road',
  'water_supply', 'bapu_bazaar', 'lake_pichola', 'rajdhani', 'calangute',
  'jugaad_2', 'white_town', 'rock_beach', 'free_parking', 'mg_road', 'kismat_2',
  'marina_beach', 'banjara_hills', 'shatabdi', 'park_street', 'fc_road',
  'electricity_board', 'sg_highway', 'go_to_jail', 'bandra_west', 'connaught_place',
  'jugaad_3', 'cyber_hub', 'tejas', 'kismat_3', 'marine_drive', 'luxury_tax',
  'altamount_road',
];

interface TokenView {
  playerIndex: number;
  position: number;
}

interface StepAnimData {
  playerIndex: number;
  from: number;
  to: number;
}

interface MonopolyBoardProps {
  tokens: TokenView[];
  playerTokens?: Record<number, string>;
  stepAnim: StepAnimData | null;
  onStepAnimDone: () => void;
  totalPlayers: number;
  kismatRemaining?: number;
  jugaadRemaining?: number;
  housesRemaining?: number;
  hotelsRemaining?: number;
  propertyBuildings?: Record<number, number>;
  propertyOwners?: Record<number, number>;
}

interface TileInfo {
  index: number;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  x: number;
  y: number;
}

function getTilePos(position: number): { x: number; y: number } {
  if (position === 0) return { x: 10 * S, y: 10 * S };
  if (position <= 10) return { x: (10 - position) * S, y: 10 * S };
  if (position <= 20) return { x: 0, y: (10 - (position - 10)) * S };
  if (position <= 30) return { x: (position - 20) * S, y: 0 };
  return { x: 10 * S, y: (position - 30) * S };
}

const TILE_COLORS: Record<string, string> = {
  go: '#e94560',
  property_brown: '#8B4513',
  property_lightblue: '#87CEEB',
  property_pink: '#FF69B4',
  property_orange: '#FF8C00',
  property_red: '#FF0000',
  property_yellow: '#FFD700',
  property_green: '#006400',
  property_darkblue: '#00008B',
  railroad: '#2C2C2C',
  utility: '#555555',
  tax: '#C4956A',
  chance: '#FF8C00',
  cc: '#4CAF50',
  jail: '#666666',
  free_parking: '#2a2a3e',
  go_to_jail: '#D32F2F',
};

const TILE_TEXT_COLORS: Record<string, string> = {
  property_lightblue: '#000',
  property_yellow: '#000',
  property_pink: '#000',
  free_parking: '#eee',
};

const BOARD_DATA: { index: number; name: string; shortName: string; colorKey: string }[] = [
  { index: 0, name: 'GO', shortName: 'GO', colorKey: 'go' },
  { index: 1, name: 'Chandni Chowk', shortName: 'Chandni', colorKey: 'property_brown' },
  { index: 2, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 3, name: 'Hazratganj', shortName: 'Hazratgnj', colorKey: 'property_brown' },
  { index: 4, name: 'Income Tax', shortName: 'Tax', colorKey: 'tax' },
  { index: 5, name: 'Vande Bharat Exp', shortName: 'VandeBhrat', colorKey: 'railroad' },
  { index: 6, name: 'Ghat Road', shortName: 'Ghat Rd', colorKey: 'property_lightblue' },
  { index: 7, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 8, name: 'MI Road', shortName: 'MI Road', colorKey: 'property_lightblue' },
  { index: 9, name: 'Law Garden', shortName: 'Law Grdn', colorKey: 'property_lightblue' },
  { index: 10, name: 'Jail', shortName: 'JAIL', colorKey: 'jail' },
  { index: 11, name: 'Mall Road', shortName: 'Mall Rd', colorKey: 'property_pink' },
  { index: 12, name: 'Water Supply', shortName: 'Water', colorKey: 'utility' },
  { index: 13, name: 'Bapu Bazaar', shortName: 'Bapu Bzr', colorKey: 'property_pink' },
  { index: 14, name: 'Lake Pichola', shortName: 'Pichola', colorKey: 'property_pink' },
  { index: 15, name: 'Rajdhani Exp', shortName: 'Rajdhani', colorKey: 'railroad' },
  { index: 16, name: 'Calangute Bch', shortName: 'Calangute', colorKey: 'property_orange' },
  { index: 17, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 18, name: 'White Town', shortName: 'White Tn', colorKey: 'property_orange' },
  { index: 19, name: 'Rock Beach', shortName: 'Rock Bch', colorKey: 'property_orange' },
  { index: 20, name: 'Free Parking', shortName: 'FREE', colorKey: 'free_parking' },
  { index: 21, name: 'MG Road', shortName: 'MG Road', colorKey: 'property_red' },
  { index: 22, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 23, name: 'Marina Beach', shortName: 'Marina', colorKey: 'property_red' },
  { index: 24, name: 'Banjara Hills', shortName: 'Banjara', colorKey: 'property_red' },
  { index: 25, name: 'Shatabdi Exp', shortName: 'Shatabdi', colorKey: 'railroad' },
  { index: 26, name: 'Park Street', shortName: 'Park St', colorKey: 'property_yellow' },
  { index: 27, name: 'FC Road', shortName: 'FC Road', colorKey: 'property_yellow' },
  { index: 28, name: 'Electricity Bd', shortName: 'Electric', colorKey: 'utility' },
  { index: 29, name: 'SG Highway', shortName: 'SG Hwy', colorKey: 'property_yellow' },
  { index: 30, name: 'Go To Jail', shortName: 'GT JAIL', colorKey: 'go_to_jail' },
  { index: 31, name: 'Bandra West', shortName: 'Bandra W', colorKey: 'property_green' },
  { index: 32, name: 'Connaught Pl', shortName: 'C Place', colorKey: 'property_green' },
  { index: 33, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 34, name: 'Cyber Hub', shortName: 'Cyber Hb', colorKey: 'property_green' },
  { index: 35, name: 'Tejas Exp', shortName: 'Tejas', colorKey: 'railroad' },
  { index: 36, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 37, name: 'Marine Drive', shortName: 'Marine D', colorKey: 'property_darkblue' },
  { index: 38, name: 'Luxury Tax', shortName: 'Lux Tax', colorKey: 'tax' },
  { index: 39, name: 'Altamount Rd', shortName: 'Altamount', colorKey: 'property_darkblue' },
];

function TokenCircle({ playerIndex, cx, cy, tokenEmoji }: { playerIndex: number; cx: number; cy: number; tokenEmoji?: string }) {
  const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  if (tokenEmoji) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={0.22 * S} fill="#1a1a2e" stroke={color} strokeWidth={0.04 * S} />
        <text x={cx} y={cy + 0.06 * S} textAnchor="middle" fontSize={0.25 * S} dominantBaseline="middle">
          {tokenEmoji}
        </text>
      </g>
    );
  }
  return (
    <circle cx={cx} cy={cy} r={0.18 * S} fill={color} stroke="#fff" strokeWidth={0.04 * S} />
  );
}

// Compute stacked token positions for players on the same tile
function computeTokenPositions(tokens: TokenView[]): { playerIndex: number; cx: number; cy: number }[] {
  const positions: { playerIndex: number; cx: number; cy: number }[] = [];
  const byPos: Record<number, TokenView[]> = {};
  for (const t of tokens) {
    if (!byPos[t.position]) byPos[t.position] = [];
    byPos[t.position].push(t);
  }
  for (const posStr of Object.keys(byPos)) {
    const pos = parseInt(posStr);
    const pts = byPos[pos];
    const center = getTilePos(pos);
    const tileCx = center.x + S / 2;
    const tileCy = center.y + S / 2;
    if (pts.length === 1) {
      positions.push({ playerIndex: pts[0].playerIndex, cx: tileCx, cy: tileCy });
    } else {
      pts.forEach((t, i) => {
        const angle = (i / pts.length) * Math.PI * 2;
        const radius = 0.2 * S;
        positions.push({
          playerIndex: t.playerIndex,
          cx: tileCx + Math.cos(angle) * radius,
          cy: tileCy + Math.sin(angle) * radius,
        });
      });
    }
  }
  return positions;
}

export function MonopolyBoard({ tokens, playerTokens = {}, stepAnim, onStepAnimDone, totalPlayers, kismatRemaining = 16, jugaadRemaining = 16, housesRemaining = 32, hotelsRemaining = 12, propertyBuildings = {}, propertyOwners = {} }: MonopolyBoardProps) {
  const [animStep, setAnimStep] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step animation (Ludo-style: one interval tick per tile)
  useEffect(() => {
    if (!stepAnim) {
      setAnimStep(null);
      return;
    }
    const movement = ((stepAnim.to - stepAnim.from) + 40) % 40;
    if (movement === 0) {
      onStepAnimDone();
      return;
    }
    let step = 0;
    const totalSteps = movement;
    const interval = 200; // ms per tile — visible stepping like Ludo
    // Start at step 1 so the token immediately shows on the first new tile
    setAnimStep(1);

    timerRef.current = setInterval(() => {
      step++;
      const nextStep = step + 1; // we started at 1
      if (nextStep >= totalSteps) {
        if (timerRef.current) clearInterval(timerRef.current);
        setAnimStep(null);
        onStepAnimDone();
      } else {
        setAnimStep(nextStep);
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stepAnim, onStepAnimDone]);

  // Compute current token positions (with stepAnim override)
  const tokenPositions = useMemo(() => {
    if (stepAnim) {
      // When animStep is null (first render before useEffect fires),
      // show the moving player at their START position (no teleport)
      const movement = ((stepAnim.to - stepAnim.from) + 40) % 40;
      const currentPos = animStep !== null
        ? (stepAnim.from + animStep) % 40
        : stepAnim.from;
      const filteredTokens = tokens.filter(t => t.playerIndex !== stepAnim.playerIndex);
      const result = computeTokenPositions(filteredTokens);
      const center = getTilePos(Math.round(currentPos));
      result.push({
        playerIndex: stepAnim.playerIndex,
        cx: center.x + S / 2,
        cy: center.y + S / 2,
      });
      return result;
    }
    return computeTokenPositions(tokens);
  }, [tokens, stepAnim, animStep]);

  // Pinch-zoom + pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const currentZoom = useRef(1);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    currentZoom.current = Math.max(0.5, Math.min(3, currentZoom.current + delta));
    setZoom(currentZoom.current);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    };
    const handleGlobalMouseUp = () => { isPanning.current = false; };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Touch pinch-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        currentZoom.current = Math.max(0.5, Math.min(3, currentZoom.current * scale));
        setZoom(currentZoom.current);
      }
      lastPinchDist.current = dist;
    }
  }, []);

  const tiles = useMemo(() => {
    return BOARD_DATA.map(bd => {
      const pos = getTilePos(bd.index);
      const color = TILE_COLORS[bd.colorKey] || '#333';
      const textColor = TILE_TEXT_COLORS[bd.colorKey] || '#fff';
      const tile: TileInfo = {
        index: bd.index,
        name: bd.name,
        shortName: bd.shortName,
        color,
        textColor,
        x: pos.x,
        y: pos.y,
      };
      return tile;
    });
  }, []);

  return (
    <div
      ref={boardRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        width: '100%', height: '100%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isPanning.current ? 'grabbing' : 'grab',
        touchAction: 'none',
        background: 'radial-gradient(ellipse at center, #1e2a4a 0%, #0f1628 100%)',
      }}
    >
      <div style={{
        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
        transformOrigin: 'center center',
        transition: isPanning.current ? 'none' : 'transform 0.1s ease',
      }}>
        <svg viewBox={`0 0 ${11 * S} ${11 * S}`} style={{ width: 'min(95vw, 90vh)', height: 'min(95vw, 90vh)' }}>
          <defs>
            <linearGradient id="kismatGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a1a3e" />
              <stop offset="100%" stopColor="#2a2a5e" />
            </linearGradient>
            <linearGradient id="jugaadGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a2a1e" />
              <stop offset="100%" stopColor="#2a3a2e" />
            </linearGradient>
            <pattern id="boardBg" patternUnits="userSpaceOnUse" width={S} height={S}>
              <rect width={S} height={S} fill="#1a1a2e" />
              <circle cx={0.5 * S} cy={0.5 * S} r={0.02 * S} fill="#2a2a4e" />
            </pattern>
          </defs>
          {/* Board background */}
          <rect x={0} y={0} width={11 * S} height={11 * S} fill="url(#boardBg)" rx={0.3 * S} />
          {/* Tiles */}
          {tiles.map(t => {
            const isProperty = BOARD_DATA[t.index].colorKey && !['go','jail','free_parking','go_to_jail','chance','cc','tax'].includes(BOARD_DATA[t.index].colorKey);
            return (
            <g key={t.index}>
              {/* Property tile: dark fill, no outer stroke (avoids overlap with neighbors) */}
              <rect
                x={t.x} y={t.y} width={S} height={S}
                fill={isProperty ? '#1a1a2e' : t.color}
                rx={0}
              />
              {/* Property art at full opacity */}
              {isProperty && (
                <image href={`/art/monopoly/${TILE_SPACE_IDS[t.index]}_001.webp`}
                  x={t.x} y={t.y}
                  width={S} height={S}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ pointerEvents: 'none', borderRadius: 0 }}
                  onError={e => { (e.target as SVGImageElement).style.display = 'none'; }} />
              )}
              {/* Color strip at top of property tile */}
              {isProperty && (
                <rect x={t.x} y={t.y} width={S} height={0.12 * S}
                  fill={t.color} rx={0} />
              )}
              {/* Corner labels */}
              {(t.index === 0) && (
                <text x={t.x + S / 2} y={t.y + S / 2 + 0.08 * S} textAnchor="middle" fill="#fff" fontSize={0.25 * S} fontWeight={700}>GO</text>
              )}
              {(t.index === 10) && (
                <><rect x={t.x + 0.1 * S} y={t.y + 0.1 * S} width={S - 0.2 * S} height={S - 0.2 * S} fill="none" stroke="#999" strokeWidth={0.03 * S} rx={0.05 * S} />
                <rect x={t.x + 0.15 * S} y={t.y + 0.1 * S} width={S - 0.3 * S} height={S - 0.2 * S} fill="none" stroke="#777" strokeWidth={0.02 * S} rx={0.03 * S} />
                <rect x={t.x + 0.1 * S} y={t.y + 0.1 * S} width={S - 0.2 * S} height={S - 0.2 * S} fill="none" stroke="#888" strokeWidth={0.015 * S} />
                <line x1={t.x + 0.22 * S} y1={t.y + 0.1 * S} x2={t.x + 0.22 * S} y2={t.y + S - 0.1 * S} stroke="#888" strokeWidth={0.02 * S} />
                <line x1={t.x + 0.38 * S} y1={t.y + 0.1 * S} x2={t.x + 0.38 * S} y2={t.y + S - 0.1 * S} stroke="#888" strokeWidth={0.02 * S} />
                <line x1={t.x + 0.54 * S} y1={t.y + 0.1 * S} x2={t.x + 0.54 * S} y2={t.y + S - 0.1 * S} stroke="#888" strokeWidth={0.02 * S} />
                <line x1={t.x + 0.7 * S} y1={t.y + 0.1 * S} x2={t.x + 0.7 * S} y2={t.y + S - 0.1 * S} stroke="#888" strokeWidth={0.02 * S} />
                <text x={t.x + S / 2} y={t.y + S / 2 + 0.2 * S} textAnchor="middle" fill="#fff" fontSize={0.15 * S} fontWeight={700}>JAIL</text>
                <text x={t.x + S / 2} y={t.y + 0.2 * S} textAnchor="middle" fill="#aaa" fontSize={0.08 * S}>Just</text>
                <text x={t.x + S / 2} y={t.y + 0.28 * S} textAnchor="middle" fill="#aaa" fontSize={0.08 * S}>Visiting</text></>
              )}
              {(t.index === 20) && (
                <><text x={t.x + S / 2} y={t.y + S / 2 - 0.1 * S} textAnchor="middle" fill="#eee" fontSize={0.13 * S} fontWeight={600}>FREE</text>
                <text x={t.x + S / 2} y={t.y + S / 2 + 0.08 * S} textAnchor="middle" fill="#eee" fontSize={0.13 * S} fontWeight={600}>PARKING</text></>
              )}
              {(t.index === 30) && (
                <><text x={t.x + S / 2} y={t.y + S / 2 - 0.1 * S} textAnchor="middle" fill="#fff" fontSize={0.12 * S} fontWeight={600}>GO TO</text>
                <text x={t.x + S / 2} y={t.y + S / 2 + 0.08 * S} textAnchor="middle" fill="#fff" fontSize={0.12 * S} fontWeight={600}>JAIL</text></>
              )}
              {/* Name at bottom of tile */}
              {isProperty && (
                <text x={t.x + S / 2} y={t.y + S - 0.14 * S} textAnchor="middle" fill="#fff" fontSize={0.08 * S} fontWeight={600}>
                  {t.shortName}
                </text>
              )}
              {/* Price below name */}
              {isProperty && (
                <text x={t.x + S / 2} y={t.y + S - 0.05 * S} textAnchor="middle" fill="#4ecca3" fontSize={0.07 * S} fontWeight={700}>
                  ₹{t.index === 5 || t.index === 15 || t.index === 25 || t.index === 35 ? 200 : t.index === 12 || t.index === 28 ? 150 : BOARD_DATA[t.index].colorKey === 'property_brown' ? 60 : BOARD_DATA[t.index].colorKey === 'property_lightblue' ? (t.index === 9 ? 120 : 100) : ''}
                </text>
              )}
              {/* Buildings on tile */}
              {propertyBuildings[t.index] > 0 && (
                <g transform={`translate(${t.x + S / 2 - propertyBuildings[t.index] * 0.06 * S}, ${t.y + S - 0.18 * S})`}>
                  {propertyBuildings[t.index] <= 4 ? (
                    Array.from({ length: propertyBuildings[t.index] }, (_, i) => (
                      <g key={i} transform={`translate(${i * 0.12 * S}, 0)`}>
                        <rect x={0} y={-0.08 * S} width={0.1 * S} height={0.1 * S} rx={0.015 * S} fill="#4CAF50" stroke="#388E3C" strokeWidth={0.01 * S} />
                        <rect x={0.01 * S} y={-0.12 * S} width={0.08 * S} height={0.04 * S} rx={0.01 * S} fill="#66BB6A" />
                        <rect x={0.02 * S} y={-0.14 * S} width={0.02 * S} height={0.02 * S} fill="#81C784" />
                        <rect x={0.06 * S} y={-0.14 * S} width={0.02 * S} height={0.02 * S} fill="#81C784" />
                      </g>
                    ))
                  ) : (
                    <g>
                      <rect x={-0.08 * S} y={-0.12 * S} width={0.16 * S} height={0.16 * S} rx={0.02 * S} fill="#F44336" stroke="#C62828" strokeWidth={0.01 * S} />
                      <rect x={-0.04 * S} y={-0.16 * S} width={0.08 * S} height={0.04 * S} fill="#EF5350" />
                      <rect x={-0.01 * S} y={-0.02 * S} width={0.02 * S} height={0.02 * S} fill="#fff" opacity={0.3} />
                      <rect x={0.02 * S} y={-0.06 * S} width={0.02 * S} height={0.02 * S} fill="#fff" opacity={0.3} />
                    </g>
                  )}
                </g>
              )}
              {/* Owner indicator on tile */}
              {propertyOwners[t.index] !== undefined && (
                <circle cx={t.x + 0.15 * S} cy={t.y + 0.15 * S} r={0.06 * S} fill={PLAYER_COLORS[propertyOwners[t.index] % PLAYER_COLORS.length]} stroke="#fff" strokeWidth={0.015 * S} />
              )}
            </g>
            );
          })}

          {/* Center area with card decks */}
          <rect x={S} y={S} width={9 * S} height={9 * S} fill="#16213e" rx={0.15 * S} />
          
          {/* Kismat deck (reduced by half) */}
          <g transform={`translate(${2.2 * S}, ${3.5 * S})`}>
            <rect width={1 * S} height={1.4 * S} rx={0.1 * S} fill="rgba(0,0,0,0.3)" transform={`translate(${0.03 * S}, ${0.03 * S})`} />
            <rect width={1 * S} height={1.4 * S} rx={0.1 * S} fill="url(#kismatGrad)" stroke="#333366" strokeWidth={0.02 * S} />
            <text x={0.5 * S} y={0.7 * S} textAnchor="middle" fill="#FF8C00" fontSize={0.35 * S} fontWeight={800}>★</text>
            <rect x={0.7 * S} y={0.05 * S} width={0.25 * S} height={0.18 * S} rx={0.06 * S} fill="#e94560" />
            <text x={0.83 * S} y={0.17 * S} textAnchor="middle" fill="#fff" fontSize={0.12 * S} fontWeight={700}>{kismatRemaining}</text>
          </g>
          <text x={2.7 * S} y={5.3 * S} textAnchor="middle" fill="#FF8C00" fontSize={0.14 * S} fontWeight={700}>KISMAT</text>
          <text x={2.7 * S} y={5.5 * S} textAnchor="middle" fill="#888" fontSize={0.1 * S}>(Chance)</text>

          {/* Jugaad deck (reduced by half) */}
          <g transform={`translate(${7.8 * S}, ${3.5 * S})`}>
            <rect width={1 * S} height={1.4 * S} rx={0.1 * S} fill="rgba(0,0,0,0.3)" transform={`translate(${0.03 * S}, ${0.03 * S})`} />
            <rect width={1 * S} height={1.4 * S} rx={0.1 * S} fill="url(#jugaadGrad)" stroke="#336633" strokeWidth={0.02 * S} />
            <text x={0.5 * S} y={0.7 * S} textAnchor="middle" fill="#4CAF50" fontSize={0.35 * S} fontWeight={800}>✦</text>
            <rect x={0.7 * S} y={0.05 * S} width={0.25 * S} height={0.18 * S} rx={0.06 * S} fill="#e94560" />
            <text x={0.83 * S} y={0.17 * S} textAnchor="middle" fill="#fff" fontSize={0.12 * S} fontWeight={700}>{jugaadRemaining}</text>
          </g>
          <text x={8.3 * S} y={5.3 * S} textAnchor="middle" fill="#4CAF50" fontSize={0.14 * S} fontWeight={700}>JUGAAD</text>
          <text x={8.3 * S} y={5.5 * S} textAnchor="middle" fill="#888" fontSize={0.1 * S}>(Community Chest)</text>

          {/* Building Pool */}
          <g transform={`translate(${5.5 * S - 1.2 * S}, ${6.5 * S})`}>
            <rect width={2.4 * S} height={0.5 * S} rx={0.08 * S} fill="#1a1a2e" stroke="#333" strokeWidth={0.02 * S} />
            {/* Houses */}
            <rect x={0.1 * S} y={0.08 * S} width={0.2 * S} height={0.18 * S} rx={0.03 * S} fill="#4CAF50" stroke="#388E3C" strokeWidth={0.01 * S} />
            <rect x={0.1 * S} y={0.05 * S} width={0.2 * S} height={0.06 * S} rx={0.02 * S} fill="#66BB6A" />
            <rect x={0.12 * S} y={0.04 * S} width={0.04 * S} height={0.04 * S} fill="#81C784" />
            <rect x={0.24 * S} y={0.04 * S} width={0.04 * S} height={0.04 * S} fill="#81C784" />
            <text x={0.45 * S} y={0.32 * S} fill="#4ecca3" fontSize={0.14 * S} fontWeight={600}>×{housesRemaining}</text>
            {/* Hotels */}
            <rect x={1.1 * S} y={0.08 * S} width={0.28 * S} height={0.18 * S} rx={0.02 * S} fill="#F44336" stroke="#C62828" strokeWidth={0.01 * S} />
            <rect x={1.16 * S} y={0.04 * S} width={0.16 * S} height={0.06 * S} fill="#EF5350" />
            <text x={1.5 * S} y={0.32 * S} fill="#e94560" fontSize={0.14 * S} fontWeight={600}>×{hotelsRemaining}</text>
          </g>

          {/* Player tokens */}
          {tokenPositions.map((tp, i) => (
            <TokenCircle key={`${tp.playerIndex}-${i}`} playerIndex={tp.playerIndex} cx={tp.cx} cy={tp.cy}
              tokenEmoji={playerTokens[tp.playerIndex] ? getTokenDef(playerTokens[tp.playerIndex]).emoji : undefined} />
          ))}
        </svg>
      </div>
    </div>
  );
}
