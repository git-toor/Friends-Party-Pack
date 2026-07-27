import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_COLORS } from './constants.js';
import { Token3DOverlay } from '../../components/Token3D.js';
import * as BoardLayout from './BoardLayout.js';

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
  width: number;
  height: number;
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

const TILE_PRICES: Record<number, number> = {
  1: 60, 3: 60, 5: 200, 6: 100, 8: 100, 9: 120, 11: 140, 12: 150, 13: 140, 14: 160,
  15: 200, 16: 180, 18: 180, 19: 200, 21: 220, 23: 220, 24: 240, 25: 200, 26: 260,
  27: 260, 28: 150, 29: 280, 31: 300, 32: 300, 34: 320, 35: 200, 37: 350, 39: 400,
};

function getTileImage(index: number): string {
  const perIndex: Record<number, string> = {
    2: 'jugaad_tile_1', 17: 'jugaad_tile_2', 33: 'jugaad_tile_3',
    7: 'kismat_tile_1', 22: 'kismat_tile_2', 36: 'kismat_tile_3',
    4: 'lagaan_tile', 38: 'chanda',
  };
  const name = BOARD_DATA[index].name;
  const map: Record<string, string> = {
    'CHALO': 'chalo_tile', 'Jail': 'jail_tile', 'Free Parking': 'free_parking_tile',
    'Chalo Jail': 'chalo_jail_tile',
    'Vande Bharat': 'vande_bharat', 'Rajdhani Exp': 'rajdhani', 'Shatabdi Exp': 'shatabdi',
    'Duronto Exp': 'duronto_exp', 'Jal Vibhaag': 'jal_vibhaag', 'Bijli Vibhag': 'bijli_vibhag',
  };
  return `/art/monopoly/${perIndex[index] || map[name] || name.toLowerCase().replace(/\s+/g, '_')}_001.webp`;
}

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
    const center = BoardLayout.getTileCenter(pos);
    const tileCx = center.cx;
    const tileCy = center.cy;
    if (pts.length === 1) {
      positions.push({ playerIndex: pts[0].playerIndex, cx: tileCx, cy: tileCy });
    } else {
      const r = BoardLayout.getTileRect(pos);
      const radius = Math.min(r.width, r.height) * 0.2;
      pts.forEach((t, i) => {
        const angle = (i / pts.length) * Math.PI * 2;
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
      const center = BoardLayout.getTileCenter(Math.round(currentPos));
      result.push({
        playerIndex: stepAnim.playerIndex,
        cx: center.cx,
        cy: center.cy,
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
      const r = BoardLayout.getTileRect(bd.index);
      const color = TILE_COLORS[bd.colorKey] || '#333';
      const textColor = TILE_TEXT_COLORS[bd.colorKey] || '#fff';
      const tile: TileInfo = {
        index: bd.index,
        name: bd.name,
        shortName: bd.shortName,
        color,
        textColor,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
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
          <svg viewBox="0 0 11 11" style={{ width: '100%', height: '100%' }}>
          <defs>
            <pattern id="boardBg" patternUnits="userSpaceOnUse" width={BoardLayout.CORNER_SIZE} height={BoardLayout.CORNER_SIZE}>
              <rect width={BoardLayout.CORNER_SIZE} height={BoardLayout.CORNER_SIZE} fill="#1a1a2e" />
              <circle cx={0.5 * BoardLayout.CORNER_SIZE} cy={0.5 * BoardLayout.CORNER_SIZE} r={0.02 * BoardLayout.CORNER_SIZE} fill="#2a2a4e" />
            </pattern>

          </defs>
          {/* Board background */}
          <rect x={0} y={0} width={BoardLayout.BOARD_SIZE} height={BoardLayout.BOARD_SIZE} fill="url(#boardBg)" rx={0.3 * BoardLayout.CORNER_SIZE} />
          {/* Tiles */}
          {tiles.map(t => {
            const colorKey = BOARD_DATA[t.index].colorKey;
            const isProperty = colorKey && !['go','jail','free_parking','go_to_jail','chance','cc','tax','railroad','utility'].includes(colorKey);
            const showText = isProperty || colorKey === 'railroad' || colorKey === 'utility';
            const isCorner = t.index === 0 || t.index === 10 || t.index === 20 || t.index === 30;
            const isFullArt = !isCorner && colorKey && ['chance', 'cc', 'tax'].includes(colorKey);
            const isBottom = t.index >= 1 && t.index <= 9;
            const isTop = t.index >= 21 && t.index <= 29;
            const isLeft = t.index >= 11 && t.index <= 19;
            const isRight = t.index >= 31 && t.index <= 39;
            const isHoriz = isBottom || isTop;
            const band = isHoriz ? t.height / 6 : t.width / 6;
            const price = TILE_PRICES[t.index];

            let nameR = { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 };
            let artR  = { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 };
            let houseR = { x: 0, y: 0, w: 0, h: 0 };

            if (isBottom) {
              houseR = { x: t.x, y: t.y, w: t.width, h: band };
              artR  = { x: t.x, y: t.y + band, w: t.width, h: t.height - 2 * band, cx: t.x + t.width / 2, cy: t.y + t.height / 2 };
              nameR = { x: t.x, y: t.y + t.height - band, w: t.width, h: band, cx: t.x + t.width / 2, cy: t.y + t.height - band / 2 };
            } else if (isTop) {
              nameR = { x: t.x, y: t.y, w: t.width, h: band, cx: t.x + t.width / 2, cy: t.y + band / 2 };
              artR  = { x: t.x, y: t.y + band, w: t.width, h: t.height - 2 * band, cx: t.x + t.width / 2, cy: t.y + t.height / 2 };
              houseR = { x: t.x, y: t.y + t.height - band, w: t.width, h: band };
            } else if (isLeft) {
              nameR = { x: t.x, y: t.y, w: band, h: t.height, cx: t.x + band / 2, cy: t.y + t.height / 2 };
              artR  = { x: t.x + band, y: t.y, w: t.width - 2 * band, h: t.height, cx: t.x + t.width / 2, cy: t.y + t.height / 2 };
              houseR = { x: t.x + t.width - band, y: t.y, w: band, h: t.height };
            } else {
              houseR = { x: t.x, y: t.y, w: band, h: t.height };
              artR  = { x: t.x + band, y: t.y, w: t.width - 2 * band, h: t.height, cx: t.x + t.width / 2, cy: t.y + t.height / 2 };
              nameR = { x: t.x + t.width - band, y: t.y, w: band, h: t.height, cx: t.x + t.width - band / 2, cy: t.y + t.height / 2 };
            }

            const angle = isBottom ? 0 : (isLeft ? 90 : (isTop ? 180 : -90));
            const bandLen = isHoriz ? nameR.w : nameR.h;
            const textAreaW = 0.8 * bandLen;
            const markerCX = -0.4 * bandLen;
            const textCX = 0.1 * bandLen;
            const priceText = `₹${price}`;
            const nameFontSize = Math.min(
              (isHoriz ? 0.055 : 0.065) * BoardLayout.CORNER_SIZE,
              textAreaW / (t.shortName.length * 0.6),
              band * 0.42
            );
            const priceFontSize = Math.min(
              (isHoriz ? 0.043 : 0.053) * BoardLayout.CORNER_SIZE,
              textAreaW / (priceText.length * 0.6),
              band * 0.35
            );
            const nameY = isHoriz ? -band * 0.18 : -band * 0.19;
            const priceY = isHoriz ? band * 0.20 : band * 0.22;

            return (
            <g key={t.index}>
              {isCorner ? (
                <>
                  <rect x={t.x} y={t.y} width={t.width} height={t.height} fill={t.color} stroke="#111" strokeWidth={0.015 * BoardLayout.CORNER_SIZE} rx={0} />
                  <image href={getTileImage(t.index)} x={t.x} y={t.y} width={t.width} height={t.height} preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }} />
                </>
              ) : isFullArt ? (
                <>
                  <rect x={t.x} y={t.y} width={t.width} height={t.height} fill={t.color} stroke="#111" strokeWidth={0.015 * BoardLayout.CORNER_SIZE} rx={0} />
                  <g transform={`translate(${t.x + t.width/2}, ${t.y + t.height/2}) rotate(${angle})`}>
                    <image href={getTileImage(t.index)} x={isHoriz ? -t.width/2 : -t.height/2} y={isHoriz ? -t.height/2 : -t.width/2} width={isHoriz ? t.width : t.height} height={isHoriz ? t.height : t.width} preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }} />
                  </g>
                </>
              ) : (
                <>
                  <rect x={t.x} y={t.y} width={t.width} height={t.height} fill={t.color} stroke="#111" strokeWidth={0.015 * BoardLayout.CORNER_SIZE} rx={0} />
                  <rect x={nameR.x} y={nameR.y} width={nameR.w} height={nameR.h} fill="#fff" fillOpacity={0.12} />
                  {angle !== 0 && isHoriz ? (
                    <g transform={`translate(${artR.cx}, ${artR.cy}) rotate(${angle})`}>
                      <image href={getTileImage(t.index)} x={-artR.w / 2} y={-artR.h / 2} width={artR.w} height={artR.h} preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }} />
                    </g>
                  ) : !isHoriz ? (
                    <g transform={`translate(${artR.cx}, ${artR.cy}) rotate(${angle})`}>
                      <image href={getTileImage(t.index)} x={-artR.h / 2} y={-artR.w / 2} width={artR.h} height={artR.w} preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }} />
                    </g>
                  ) : (
                    <image href={getTileImage(t.index)} x={artR.x} y={artR.y} width={artR.w} height={artR.h} preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }} />
                  )}
                  <rect x={houseR.x} y={houseR.y} width={houseR.w} height={houseR.h} fill="#000" fillOpacity={0.15} />
                  {showText && (
                    <g transform={`translate(${nameR.cx}, ${nameR.cy}) rotate(${angle})`}>
                      <line x1={-0.3 * bandLen} y1={-band / 2} x2={-0.3 * bandLen} y2={band / 2} stroke="#111" strokeWidth={0.01 * BoardLayout.CORNER_SIZE} strokeOpacity={0.35} />
                      {isProperty && propertyOwners[t.index] !== undefined && (
                        <circle cx={markerCX} cy={0} r={0.04 * BoardLayout.CORNER_SIZE} fill={PLAYER_COLORS[propertyOwners[t.index] % PLAYER_COLORS.length]} stroke="#fff" strokeWidth={0.015 * BoardLayout.CORNER_SIZE} />
                      )}
                      <text x={textCX} y={nameY} textAnchor="middle" fill={t.textColor} fontSize={nameFontSize} fontWeight={700}>{t.shortName}</text>
                      <text x={textCX} y={priceY} textAnchor="middle" fill={t.textColor} fontSize={priceFontSize} fontWeight={600}>{priceText}</text>
                    </g>
                  )}
                  {isProperty && propertyBuildings[t.index] > 0 && (
                    <g transform={`translate(${houseR.x + houseR.w / 2 - propertyBuildings[t.index] * 0.06 * houseR.w}, ${houseR.y + 0.2 * houseR.h})`}>
                      {propertyBuildings[t.index] <= 4 ? (
                        Array.from({ length: propertyBuildings[t.index] }, (_, i) => (
                          <rect key={i} x={i * 0.12 * houseR.w} y={0} width={0.08 * houseR.w} height={0.6 * houseR.h} rx={0.02 * houseR.w} fill="#4CAF50" stroke="#388E3C" strokeWidth={0.01 * houseR.w} />
                        ))
                      ) : (
                        <rect x={-0.06 * houseR.w} y={0} width={0.12 * houseR.w} height={0.7 * houseR.h} rx={0.02 * houseR.w} fill="#F44336" stroke="#C62828" strokeWidth={0.01 * houseR.w} />
                      )}
                    </g>
                  )}
                </>
              )}
            </g>
            );
          })}

          {/* Center area with card decks */}
          <rect x={BoardLayout.CENTER_X} y={BoardLayout.CENTER_Y} width={BoardLayout.CENTER_WIDTH} height={BoardLayout.CENTER_HEIGHT} fill="#16213e" rx={0.15 * BoardLayout.CORNER_SIZE} />
          <rect x={BoardLayout.CENTER_X + 0.1 * BoardLayout.CORNER_SIZE} y={BoardLayout.CENTER_Y + 0.1 * BoardLayout.CORNER_SIZE} width={BoardLayout.CENTER_WIDTH - 0.2 * BoardLayout.CORNER_SIZE} height={BoardLayout.CENTER_HEIGHT - 0.2 * BoardLayout.CORNER_SIZE} fill="none" stroke="#2a2a4e" strokeWidth={0.03 * BoardLayout.CORNER_SIZE} rx={0.1 * BoardLayout.CORNER_SIZE} />

          {/* Kismat deck */}
          <g transform={`translate(${BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.30 - BoardLayout.CORNER_SIZE / 2}, ${BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.18})`}>
            <image href="/art/monopoly/kismat_back_001.webp"
              x={0} y={0} width={BoardLayout.CORNER_SIZE} height={1.4 * BoardLayout.CORNER_SIZE}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }} />
            <rect x={0.7 * BoardLayout.CORNER_SIZE} y={0.05 * BoardLayout.CORNER_SIZE} width={0.25 * BoardLayout.CORNER_SIZE} height={0.18 * BoardLayout.CORNER_SIZE} rx={0.06 * BoardLayout.CORNER_SIZE} fill="#e94560" />
            <text x={0.825 * BoardLayout.CORNER_SIZE} y={0.175 * BoardLayout.CORNER_SIZE} textAnchor="middle" fill="#fff" fontSize={0.12 * BoardLayout.CORNER_SIZE} fontWeight={700}>{kismatRemaining}</text>
          </g>
          <text x={BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.30} y={BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.18 + 1.55 * BoardLayout.CORNER_SIZE} textAnchor="middle" fill="#FF8C00" fontSize={0.13 * BoardLayout.CORNER_SIZE} fontWeight={700}>KISMAT</text>
          <text x={BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.30} y={BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.18 + 1.75 * BoardLayout.CORNER_SIZE} textAnchor="middle" fill="#888" fontSize={0.1 * BoardLayout.CORNER_SIZE}>(Chance)</text>

          {/* Jugaad deck */}
          <g transform={`translate(${BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.70 - BoardLayout.CORNER_SIZE / 2}, ${BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.18})`}>
            <image href="/art/monopoly/jugaad_back_001.webp"
              x={0} y={0} width={BoardLayout.CORNER_SIZE} height={1.4 * BoardLayout.CORNER_SIZE}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }} />
            <rect x={0.7 * BoardLayout.CORNER_SIZE} y={0.05 * BoardLayout.CORNER_SIZE} width={0.25 * BoardLayout.CORNER_SIZE} height={0.18 * BoardLayout.CORNER_SIZE} rx={0.06 * BoardLayout.CORNER_SIZE} fill="#e94560" />
            <text x={0.825 * BoardLayout.CORNER_SIZE} y={0.175 * BoardLayout.CORNER_SIZE} textAnchor="middle" fill="#fff" fontSize={0.12 * BoardLayout.CORNER_SIZE} fontWeight={700}>{jugaadRemaining}</text>
          </g>
          <text x={BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.70} y={BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.18 + 1.55 * BoardLayout.CORNER_SIZE} textAnchor="middle" fill="#4CAF50" fontSize={0.13 * BoardLayout.CORNER_SIZE} fontWeight={700}>JUGAAD</text>
          <text x={BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.70} y={BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.18 + 1.75 * BoardLayout.CORNER_SIZE} textAnchor="middle" fill="#888" fontSize={0.1 * BoardLayout.CORNER_SIZE}>(Community Chest)</text>

          {/* Center divider */}
          <line x1={BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.50} y1={BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.22} x2={BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH * 0.50} y2={BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.38} stroke="#2a2a4e" strokeWidth={0.03 * BoardLayout.CORNER_SIZE} strokeLinecap="round" />

          {/* Building Pool */}
          <g transform={`translate(${BoardLayout.CENTER_X + BoardLayout.CENTER_WIDTH / 2 - 1.2 * BoardLayout.CORNER_SIZE}, ${BoardLayout.CENTER_Y + BoardLayout.CENTER_HEIGHT * 0.75})`}>
            <rect width={2.4 * BoardLayout.CORNER_SIZE} height={0.55 * BoardLayout.CORNER_SIZE} rx={0.08 * BoardLayout.CORNER_SIZE} fill="#1a1a2e" stroke="#333" strokeWidth={0.02 * BoardLayout.CORNER_SIZE} />
            <rect x={0.12 * BoardLayout.CORNER_SIZE} y={0.1 * BoardLayout.CORNER_SIZE} width={0.22 * BoardLayout.CORNER_SIZE} height={0.2 * BoardLayout.CORNER_SIZE} rx={0.03 * BoardLayout.CORNER_SIZE} fill="#4CAF50" stroke="#388E3C" strokeWidth={0.01 * BoardLayout.CORNER_SIZE} />
            <rect x={0.12 * BoardLayout.CORNER_SIZE} y={0.06 * BoardLayout.CORNER_SIZE} width={0.22 * BoardLayout.CORNER_SIZE} height={0.07 * BoardLayout.CORNER_SIZE} rx={0.015 * BoardLayout.CORNER_SIZE} fill="#66BB6A" />
            <rect x={0.14 * BoardLayout.CORNER_SIZE} y={0.04 * BoardLayout.CORNER_SIZE} width={0.05 * BoardLayout.CORNER_SIZE} height={0.05 * BoardLayout.CORNER_SIZE} fill="#81C784" />
            <rect x={0.27 * BoardLayout.CORNER_SIZE} y={0.04 * BoardLayout.CORNER_SIZE} width={0.05 * BoardLayout.CORNER_SIZE} height={0.05 * BoardLayout.CORNER_SIZE} fill="#81C784" />
            <text x={0.5 * BoardLayout.CORNER_SIZE} y={0.35 * BoardLayout.CORNER_SIZE} fill="#4ecca3" fontSize={0.16 * BoardLayout.CORNER_SIZE} fontWeight={600}>×{housesRemaining}</text>
            <rect x={1.2 * BoardLayout.CORNER_SIZE} y={0.1 * BoardLayout.CORNER_SIZE} width={0.28 * BoardLayout.CORNER_SIZE} height={0.2 * BoardLayout.CORNER_SIZE} rx={0.03 * BoardLayout.CORNER_SIZE} fill="#F44336" stroke="#C62828" strokeWidth={0.01 * BoardLayout.CORNER_SIZE} />
            <rect x={1.26 * BoardLayout.CORNER_SIZE} y={0.05 * BoardLayout.CORNER_SIZE} width={0.16 * BoardLayout.CORNER_SIZE} height={0.08 * BoardLayout.CORNER_SIZE} fill="#EF5350" />
            <text x={1.65 * BoardLayout.CORNER_SIZE} y={0.35 * BoardLayout.CORNER_SIZE} fill="#e94560" fontSize={0.16 * BoardLayout.CORNER_SIZE} fontWeight={600}>×{hotelsRemaining}</text>
          </g>

          {/* Player tokens - 3D overlay */}
        </svg>
        <Token3DOverlay tokenPositions={tokenPositions} playerTokens={playerTokens} boardSize={BoardLayout.BOARD_SIZE} />
        </div>
      </div>
    </div>
  );
}
