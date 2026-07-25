import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_COLORS } from './constants.js';
import { Token3DOverlay } from '../../components/Token3D.js';

const S = 1.0;

const TILE_SPACE_IDS: string[] = [
  'chalo_tile', 'chandni_chowk', 'jugaad_tile', 'hazratganj', 'lagaan_tile', 'vande_bharat',
  'ghat_road', 'kismat_tile', 'mi_road', 'law_garden', 'jail_tile', 'mall_road',
  'jal_vibhaag', 'bapu_bazaar', 'lake_pichola', 'rajdhani', 'baga_beach',
  'jugaad_tile_2', 'white_town', 'rock_beach', 'free_parking_tile', 'mg_road', 'kismat_tile_2',
  'marina_beach', 'banjara_hills', 'shatabdi', 'park_street', 'fc_road',
  'bijli_vibhag', 'sg_highway', 'chalo_jail_tile', 'bandra_west', 'jor_bagh',
  'jugaad_tile_3', 'cyber_hub', 'duronto_exp', 'kismat_tile_3', 'marine_drive', 'chanda',
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
  go: '#C62828',
  property_brown: '#A0522D',
  property_lightblue: '#B0D4E8',
  property_pink: '#E88DB0',
  property_orange: '#E08A30',
  property_red: '#C62828',
  property_yellow: '#D4A820',
  property_green: '#2E7D32',
  property_darkblue: '#1A237E',
  railroad: '#4A4A4A',
  utility: '#707070',
  tax: '#B89668',
  chance: '#D47820',
  cc: '#3D8B40',
  jail: '#6B6B6B',
  free_parking: '#2a2a3e',
  go_to_jail: '#B71C1C',
};

const PROPERTY_PRICES: Record<string, number> = {
  property_brown: 60,
  property_lightblue: 0, // varies: 100, 120
  property_pink: 140,
  property_orange: 180,
  property_red: 220,
  property_yellow: 260,
  property_green: 300,
  property_darkblue: 350,
  railroad: 200,
  utility: 150,
};

const TILE_TEXT_COLORS: Record<string, string> = {
  property_lightblue: '#000',
  property_yellow: '#000',
  property_pink: '#000',
  free_parking: '#eee',
};

const BOARD_DATA: { index: number; name: string; shortName: string; colorKey: string }[] = [
  { index: 0, name: 'CHALO', shortName: 'CHALO', colorKey: 'go' },
  { index: 1, name: 'Chandni Chowk', shortName: 'Chandni Chowk', colorKey: 'property_brown' },
  { index: 2, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 3, name: 'Hazratganj', shortName: 'Hazratganj', colorKey: 'property_brown' },
  { index: 4, name: 'Lagaan', shortName: 'Lagaan', colorKey: 'tax' },
  { index: 5, name: 'Vande Bharat', shortName: 'Vande Bharat', colorKey: 'railroad' },
  { index: 6, name: 'Ghat Road', shortName: 'Ghat Road', colorKey: 'property_lightblue' },
  { index: 7, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 8, name: 'MI Road', shortName: 'MI Road', colorKey: 'property_lightblue' },
  { index: 9, name: 'Law Garden', shortName: 'Law Garden', colorKey: 'property_lightblue' },
  { index: 10, name: 'Jail', shortName: 'Jail', colorKey: 'jail' },
  { index: 11, name: 'Mall Road', shortName: 'Mall Road', colorKey: 'property_pink' },
  { index: 12, name: 'Jal Vibhaag', shortName: 'Jal Vibhaag', colorKey: 'utility' },
  { index: 13, name: 'Bapu Bazaar', shortName: 'Bapu Bazaar', colorKey: 'property_pink' },
  { index: 14, name: 'Lake Pichola', shortName: 'Lake Pichola', colorKey: 'property_pink' },
  { index: 15, name: 'Rajdhani Exp', shortName: 'Rajdhani Exp', colorKey: 'railroad' },
  { index: 16, name: 'Baga Beach', shortName: 'Baga Beach', colorKey: 'property_orange' },
  { index: 17, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 18, name: 'White Town', shortName: 'White Town', colorKey: 'property_orange' },
  { index: 19, name: 'Rock Beach', shortName: 'Rock Beach', colorKey: 'property_orange' },
  { index: 20, name: 'Free Parking', shortName: 'Free Parking', colorKey: 'free_parking' },
  { index: 21, name: 'MG Road', shortName: 'MG Road', colorKey: 'property_red' },
  { index: 22, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 23, name: 'Marina Beach', shortName: 'Marina Beach', colorKey: 'property_red' },
  { index: 24, name: 'Banjara Hills', shortName: 'Banjara Hills', colorKey: 'property_red' },
  { index: 25, name: 'Shatabdi Exp', shortName: 'Shatabdi Exp', colorKey: 'railroad' },
  { index: 26, name: 'Park Street', shortName: 'Park Street', colorKey: 'property_yellow' },
  { index: 27, name: 'FC Road', shortName: 'FC Road', colorKey: 'property_yellow' },
  { index: 28, name: 'Bijli Vibhag', shortName: 'Bijli Vibhag', colorKey: 'utility' },
  { index: 29, name: 'SG Highway', shortName: 'SG Highway', colorKey: 'property_yellow' },
  { index: 30, name: 'Chalo Jail', shortName: 'Chalo Jail', colorKey: 'go_to_jail' },
  { index: 31, name: 'Bandra West', shortName: 'Bandra West', colorKey: 'property_green' },
  { index: 32, name: 'Jor Bagh', shortName: 'Jor Bagh', colorKey: 'property_green' },
  { index: 33, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 34, name: 'Cyber Hub', shortName: 'Cyber Hub', colorKey: 'property_green' },
  { index: 35, name: 'Duronto Exp', shortName: 'Duronto Exp', colorKey: 'railroad' },
  { index: 36, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 37, name: 'Marine Drive', shortName: 'Marine Drive', colorKey: 'property_darkblue' },
  { index: 38, name: 'Chanda', shortName: 'Chanda', colorKey: 'tax' },
  { index: 39, name: 'Altamount Road', shortName: 'Altamount Road', colorKey: 'property_darkblue' },
];

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
    const tileCx = center.x + 0.5;
    const tileCy = center.y + 0.5;
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
        cx: center.x + 0.5,
        cy: center.y + 0.5,
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
        <div style={{ position: 'relative', width: 'min(95vw, 90vh)', height: 'min(95vw, 90vh)' }}>
          <svg viewBox={`0 0 ${11 * S} ${11 * S}`} style={{ width: '100%', height: '100%' }}>
          <defs>
            <pattern id="boardBg" patternUnits="userSpaceOnUse" width={S} height={S}>
              <rect width={S} height={S} fill="#1a1a2e" />
              <circle cx={0.5 * S} cy={0.5 * S} r={0.02 * S} fill="#2a2a4e" />
            </pattern>
          </defs>
          {/* Board background */}
          <rect x={0} y={0} width={11 * S} height={11 * S} fill="url(#boardBg)" rx={0.3 * S} />
          {/* Tiles */}
          {tiles.map(t => {
            const isProperty = BOARD_DATA[t.index].colorKey && !['go','jail','free_parking','go_to_jail','chance','cc','tax','railroad'].includes(BOARD_DATA[t.index].colorKey);
            const isCardTile = BOARD_DATA[t.index].colorKey === 'go' || BOARD_DATA[t.index].colorKey === 'chance' || BOARD_DATA[t.index].colorKey === 'cc' || BOARD_DATA[t.index].colorKey === 'tax' || BOARD_DATA[t.index].colorKey === 'jail' || BOARD_DATA[t.index].colorKey === 'free_parking' || BOARD_DATA[t.index].colorKey === 'go_to_jail' || BOARD_DATA[t.index].colorKey === 'railroad';
            const PAD = 0.15 * S;
            const IS = S - 2 * PAD;
            return (
            <g key={t.index}>
              {/* Base fill */}
              <rect x={t.x} y={t.y} width={S} height={S} fill={t.color} stroke="#111" strokeWidth={0.015 * S} rx={0} />
              {/* Property tile: image centered, name|price at bottom */}
              {isProperty && (
                <>
                  <image href={`/art/monopoly/${TILE_SPACE_IDS[t.index]}_001.webp`}
                    x={t.x + PAD} y={t.y + PAD}
                    width={IS} height={IS}
                    preserveAspectRatio="xMidYMid slice"
                    style={{ pointerEvents: 'none' }}
                    onError={e => { (e.target as SVGImageElement).style.display = 'none'; }} />
                  <text x={t.x + PAD} y={t.y + S - 0.05 * S} textAnchor="start" fill={t.textColor} fontSize={0.07 * S} fontWeight={600}>
                    {t.shortName}
                  </text>
                  <text x={t.x + S - PAD} y={t.y + S - 0.05 * S} textAnchor="end" fill={t.textColor} fontSize={0.07 * S} fontWeight={700}>
                    ₹{t.index === 1 || t.index === 3 ? 60 : t.index === 6 || t.index === 8 ? 100 : t.index === 9 ? 120 : PROPERTY_PRICES[BOARD_DATA[t.index].colorKey] || ''}
                  </text>
                </>
              )}
              {/* Kismat/Jugaad tile: full coverage art */}
              {isCardTile && (
                <image href={`/art/monopoly/${TILE_SPACE_IDS[t.index]}_001.webp`}
                  x={t.x} y={t.y} width={S} height={S}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ pointerEvents: 'none' }}
                  onError={e => { (e.target as SVGImageElement).style.display = 'none'; }} />
              )}
              {/* Railroads: name + price */}
              {BOARD_DATA[t.index].colorKey === 'railroad' && (
                <>
                  <text x={t.x + 0.08 * S} y={t.y + S - 0.08 * S} textAnchor="start" fill="#fff" fontSize={0.07 * S} fontWeight={600}>
                    {t.shortName}
                  </text>
                  <text x={t.x + S - 0.08 * S} y={t.y + S - 0.08 * S} textAnchor="end" fill="#fff" fontSize={0.07 * S} fontWeight={700}>
                    ₹200
                  </text>
                </>
              )}
              {/* Corner labels */}
              {/* Corner labels hidden — art tiles have their own text */}
              {/* Buildings on tile — at the top (above image) */}
              {isProperty && propertyBuildings[t.index] > 0 && (
                <g transform={`translate(${t.x + S / 2 - propertyBuildings[t.index] * 0.06 * S}, ${t.y + 0.06 * S})`}>
                  {propertyBuildings[t.index] <= 4 ? (
                    Array.from({ length: propertyBuildings[t.index] }, (_, i) => (
                      <rect key={i} x={i * 0.1 * S} y={-0.04 * S} width={0.08 * S} height={0.08 * S} rx={0.015 * S} fill="#4CAF50" stroke="#388E3C" strokeWidth={0.01 * S} />
                    ))
                  ) : (
                    <rect x={-0.06 * S} y={-0.06 * S} width={0.12 * S} height={0.1 * S} rx={0.015 * S} fill="#F44336" stroke="#C62828" strokeWidth={0.01 * S} />
                  )}
                </g>
              )}
              {/* Owner indicator — on the left side, beside the image */}
              {isProperty && propertyOwners[t.index] !== undefined && (
                <circle cx={t.x + 0.06 * S} cy={t.y + S / 2} r={0.05 * S} fill={PLAYER_COLORS[propertyOwners[t.index] % PLAYER_COLORS.length]} stroke="#fff" strokeWidth={0.015 * S} />
              )}
            </g>
            );
          })}

          {/* Center area with card decks */}
          <rect x={S} y={S} width={9 * S} height={9 * S} fill="#16213e" rx={0.15 * S} />

          {/* Kismat deck */}
          <g transform={`translate(${2.2 * S}, ${3.5 * S})`}>
            <image href="/art/monopoly/kismat_back_001.webp"
              x={0} y={0} width={S} height={1.4 * S}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }} />
            <rect x={0.7 * S} y={0.05 * S} width={0.25 * S} height={0.18 * S} rx={0.06 * S} fill="#e94560" />
            <text x={0.825 * S} y={0.175 * S} textAnchor="middle" fill="#fff" fontSize={0.12 * S} fontWeight={700}>{kismatRemaining}</text>
          </g>
          <text x={2.7 * S} y={5.3 * S} textAnchor="middle" fill="#FF8C00" fontSize={0.14 * S} fontWeight={700}>KISMAT</text>
          <text x={2.7 * S} y={5.5 * S} textAnchor="middle" fill="#888" fontSize={0.1 * S}>(Chance)</text>

          {/* Jugaad deck */}
          <g transform={`translate(${7.8 * S}, ${3.5 * S})`}>
            <image href="/art/monopoly/jugaad_back_001.webp"
              x={0} y={0} width={S} height={1.4 * S}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }} />
            <rect x={0.7 * S} y={0.05 * S} width={0.25 * S} height={0.18 * S} rx={0.06 * S} fill="#e94560" />
            <text x={0.825 * S} y={0.175 * S} textAnchor="middle" fill="#fff" fontSize={0.12 * S} fontWeight={700}>{jugaadRemaining}</text>
          </g>
          <text x={8.3 * S} y={5.3 * S} textAnchor="middle" fill="#4CAF50" fontSize={0.14 * S} fontWeight={700}>JUGAAD</text>
          <text x={8.3 * S} y={5.5 * S} textAnchor="middle" fill="#888" fontSize={0.1 * S}>(Community Chest)</text>

          {/* Building Pool */}
          <g transform={`translate(${5.5 * S - 1.2 * S}, ${6.5 * S})`}>
            <rect width={2.4 * S} height={0.55 * S} rx={0.08 * S} fill="#1a1a2e" stroke="#333" strokeWidth={0.02 * S} />
            <rect x={0.12 * S} y={0.1 * S} width={0.22 * S} height={0.2 * S} rx={0.03 * S} fill="#4CAF50" stroke="#388E3C" strokeWidth={0.01 * S} />
            <rect x={0.12 * S} y={0.06 * S} width={0.22 * S} height={0.07 * S} rx={0.015 * S} fill="#66BB6A" />
            <rect x={0.14 * S} y={0.04 * S} width={0.05 * S} height={0.05 * S} fill="#81C784" />
            <rect x={0.27 * S} y={0.04 * S} width={0.05 * S} height={0.05 * S} fill="#81C784" />
            <text x={0.5 * S} y={0.35 * S} fill="#4ecca3" fontSize={0.16 * S} fontWeight={600}>×{housesRemaining}</text>
            <rect x={1.2 * S} y={0.1 * S} width={0.28 * S} height={0.2 * S} rx={0.03 * S} fill="#F44336" stroke="#C62828" strokeWidth={0.01 * S} />
            <rect x={1.26 * S} y={0.05 * S} width={0.16 * S} height={0.08 * S} fill="#EF5350" />
            <text x={1.65 * S} y={0.35 * S} fill="#e94560" fontSize={0.16 * S} fontWeight={600}>×{hotelsRemaining}</text>
          </g>

          {/* Player tokens - 3D overlay */}
        </svg>
        <Token3DOverlay tokenPositions={tokenPositions} playerTokens={playerTokens} boardSize={11 * S} />
        </div>
      </div>
    </div>
  );
}
