import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MonopolyBoard } from './MonopolyBoard.js';
import { Dice, type DiceHandle } from './Dice.js';
import { OpponentBar } from './OpponentBar.js';
import { PropertyFan } from './PropertyFan.js';
import type { PropertyCardData } from './PropertyCard.js';
import { sounds } from './sounds.js';
import { PLAYER_NAMES } from './constants.js';

interface GameEvent {
  type: 'PLAYER_MOVED' | 'PASSED_GO' | 'BOUGHT_PROPERTY' | 'PAID_RENT' | 'PAID_TAX'
    | 'WENT_TO_JAIL' | 'BANKRUPT' | 'PLAYER_WON' | 'ROLLED_DOUBLES' | 'THREE_DOUBLES'
    | 'TURN_ENDED' | 'DREW_CARD' | 'CARD_EFFECT' | 'BUNGALOW_BUILT' | 'VILLA_BUILT'
    | 'BUNGALOW_SOLD' | 'VILLA_SOLD' | 'GHOOS_PAID' | 'SIFARISH_USED';
  playerIndex: number;
  amount?: number; toPlayer?: number; propertyIndex?: number;
  from?: number; to?: number;
  cardType?: 'kismat' | 'jugaad'; cardIndex?: number; cardText?: string;
}

interface PlayerState { money: number; position: number; inJail: boolean; jailTurns: number; jailFreeCards: number; bankrupt: boolean; monopolies: string[]; }
interface PropertyState { owner: number | null; houses: number; mortgaged: boolean; }

interface MonopolyClientState {
  players: PlayerState[]; properties: Record<string, PropertyState>;
  currentPlayer: number; phase: string;
  dice: [number, number] | null; diceTotal: number | null;
  doublesCount: number; rolledBy: number | null;
  lastAction: string | null; landedIndex: number | null;
  winner: number | null; validActions: string[];
  housesRemaining: number; hotelsRemaining: number;
  eventLog: any[];
}

interface MonopolyGameProps {
  playerCount?: number; playerIndex?: number;
  playerName?: string; playerId?: string; sessionId?: string;
  players?: { name: string; index: number; id?: string }[];
  gameStatePush?: any; diceEvent?: any; nsfw?: boolean;
}

const EMPTY_STATE: MonopolyClientState = {
  players: [], properties: {}, currentPlayer: 0, phase: 'waiting_for_roll',
  dice: null, diceTotal: null, doublesCount: 0, rolledBy: null,
  lastAction: null, landedIndex: null, winner: null,
  validActions: [], housesRemaining: 32, hotelsRemaining: 12, eventLog: [],
};

const SPACE_DATA: { index: number; name: string; spaceId: string; group?: number; price?: number }[] = [
  { index: 0, name: 'GO', spaceId: 'go' },
  { index: 1, name: 'Chandni Chowk', spaceId: 'chandni_chowk', group: 0, price: 60 },
  { index: 2, name: 'Jugaad', spaceId: 'jugaad_1' },
  { index: 3, name: 'Hazratganj', spaceId: 'hazratganj', group: 0, price: 60 },
  { index: 4, name: 'Income Tax', spaceId: 'income_tax' },
  { index: 5, name: 'Vande Bharat Exp', spaceId: 'vande_bharat', price: 200 },
  { index: 6, name: 'Ghat Road', spaceId: 'ghat_road', group: 1, price: 100 },
  { index: 7, name: 'Kismat', spaceId: 'kismat_1' },
  { index: 8, name: 'MI Road', spaceId: 'mi_road', group: 1, price: 100 },
  { index: 9, name: 'Law Garden', spaceId: 'law_garden', group: 1, price: 120 },
  { index: 10, name: 'Jail', spaceId: 'jail' },
  { index: 11, name: 'Mall Road', spaceId: 'mall_road', group: 2, price: 140 },
  { index: 12, name: 'Water Supply', spaceId: 'water_supply', price: 150 },
  { index: 13, name: 'Bapu Bazaar', spaceId: 'bapu_bazaar', group: 2, price: 140 },
  { index: 14, name: 'Lake Pichola', spaceId: 'lake_pichola', group: 2, price: 160 },
  { index: 15, name: 'Rajdhani Exp', spaceId: 'rajdhani', price: 200 },
  { index: 16, name: 'Calangute Bch', spaceId: 'calangute', group: 3, price: 180 },
  { index: 17, name: 'Jugaad', spaceId: 'jugaad_2' },
  { index: 18, name: 'White Town', spaceId: 'white_town', group: 3, price: 180 },
  { index: 19, name: 'Rock Beach', spaceId: 'rock_beach', group: 3, price: 200 },
  { index: 20, name: 'Free Parking', spaceId: 'free_parking' },
  { index: 21, name: 'MG Road', spaceId: 'mg_road', group: 4, price: 220 },
  { index: 22, name: 'Kismat', spaceId: 'kismat_2' },
  { index: 23, name: 'Marina Beach', spaceId: 'marina_beach', group: 4, price: 220 },
  { index: 24, name: 'Banjara Hills', spaceId: 'banjara_hills', group: 4, price: 240 },
  { index: 25, name: 'Shatabdi Exp', spaceId: 'shatabdi', price: 200 },
  { index: 26, name: 'Park Street', spaceId: 'park_street', group: 5, price: 260 },
  { index: 27, name: 'FC Road', spaceId: 'fc_road', group: 5, price: 260 },
  { index: 28, name: 'Electricity Bd', spaceId: 'electricity_board', price: 150 },
  { index: 29, name: 'SG Highway', spaceId: 'sg_highway', group: 5, price: 280 },
  { index: 30, name: 'Go To Jail', spaceId: 'go_to_jail' },
  { index: 31, name: 'Bandra West', spaceId: 'bandra_west', group: 6, price: 300 },
  { index: 32, name: 'Connaught Pl', spaceId: 'connaught_place', group: 6, price: 300 },
  { index: 33, name: 'Jugaad', spaceId: 'jugaad_3' },
  { index: 34, name: 'Cyber Hub', spaceId: 'cyber_hub', group: 6, price: 320 },
  { index: 35, name: 'Tejas Exp', spaceId: 'tejas', price: 200 },
  { index: 36, name: 'Kismat', spaceId: 'kismat_3' },
  { index: 37, name: 'Marine Drive', spaceId: 'marine_drive', group: 7, price: 350 },
  { index: 38, name: 'Luxury Tax', spaceId: 'luxury_tax' },
  { index: 39, name: 'Altamount Rd', spaceId: 'altamount_road', group: 7, price: 400 },
];

function getSpaceInfo(index: number) { return SPACE_DATA.find(s => s.index === index); }

export default function MonopolyGame({ playerCount = 2, playerIndex = 0, playerName = 'You', playerId = '', sessionId, players, gameStatePush, diceEvent }: MonopolyGameProps) {
  const [gs, setGs] = useState<MonopolyClientState>(EMPTY_STATE);
  const svRef = useRef(-1);
  const prevPlayersRef = useRef<PlayerState[] | null>(null);
  const [stepAnim, setStepAnim] = useState<{ playerIndex: number; from: number; to: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const [showBankrupt, setShowBankrupt] = useState(false);
  const [showCard, setShowCard] = useState<{ type: string; text: string } | null>(null);
  const [selectedFanCard, setSelectedFanCard] = useState<number | null>(null);
  const [buildingMenu, setBuildingMenu] = useState<number | null>(null);
  const rollingRef = useRef(false);
  const diceRef = useRef<DiceHandle>(null);

  const playerNames = useMemo(() => players?.reduce((acc, p) => { acc[p.index] = p.name; return acc; }, {} as Record<number, string>) || {}, [players]);

  const isMyTurn = playerIndex === gs.currentPlayer;
  const canRoll = isMyTurn && gs.phase === 'waiting_for_roll' && gs.winner === null && !rollingRef.current;
  const canBuy = isMyTurn && gs.phase === 'waiting_for_action' && gs.validActions.includes('BUY_PROPERTY');
  const canDecline = isMyTurn && gs.phase === 'waiting_for_action' && gs.validActions.includes('DECLINE_PROPERTY');
  const canEndTurn = isMyTurn && gs.phase === 'turn_end' && gs.validActions.includes('END_TURN');
  const canPayGhoos = isMyTurn && gs.validActions.includes('PAY_GHOOS');
  const canUseSifarish = isMyTurn && gs.validActions.includes('USE_SIFARISH_CARD');

  // ─── Property cards for fan ──
  const myPropertyCards = useMemo(() => Object.entries(gs.properties)
    .filter(([_, p]) => p.owner === playerIndex && gs.players[playerIndex] && !gs.players[playerIndex].bankrupt)
    .map(([spaceId, p]) => {
      const space = SPACE_DATA.find(s => s.spaceId === spaceId);
      return { index: space?.index ?? -1, spaceId, name: space?.name ?? spaceId, group: (space as any)?.group, price: space?.price ?? 0, houses: p.houses, mortgaged: p.mortgaged };
    }), [gs.properties, playerIndex, gs.players]);

  const selectedProp = buildingMenu !== null ? myPropertyCards[buildingMenu] : null;

  const updateState = useCallback((newState: any) => {
    if (!newState || (newState._sv !== undefined && newState._sv <= svRef.current)) return;
    if (newState._sv !== undefined) svRef.current = newState._sv;
    if (newState.players) prevPlayersRef.current = newState.players;
    setGs({
      players: newState.players || [], properties: newState.properties || {},
      currentPlayer: newState.currentPlayer ?? 0, phase: newState.phase || 'waiting_for_roll',
      dice: newState.dice ?? null, diceTotal: newState.diceTotal ?? null,
      doublesCount: newState.doublesCount ?? 0, rolledBy: newState.rolledBy ?? null,
      lastAction: newState.lastAction ?? null, landedIndex: newState.landedIndex ?? null,
      winner: newState.winner ?? null, validActions: newState.validActions || [],
      housesRemaining: newState.housesRemaining ?? 32, hotelsRemaining: newState.hotelsRemaining ?? 12,
      eventLog: newState.eventLog || [],
    });
  }, []);

  const handleGameEvent = useCallback((ev: GameEvent) => {
    const name = playerNames[ev.playerIndex] || PLAYER_NAMES[ev.playerIndex % PLAYER_NAMES.length] || `P${ev.playerIndex}`;
    if (ev.type === 'BANKRUPT') { setShowBankrupt(true); setTimeout(() => setShowBankrupt(false), 2000); }
    if (ev.type === 'PASSED_GO') { setEventMsg(`💰 ${name} passed GO +₹${ev.amount}`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'PAID_RENT') { setEventMsg(`💸 ${name} paid ₹${ev.amount}`); setTimeout(() => setEventMsg(null), 2000); sounds.playRent(); }
    if (ev.type === 'BOUGHT_PROPERTY') sounds.playBuy();
    if (ev.type === 'DREW_CARD' && ev.cardText) { setShowCard({ type: ev.cardType || 'kismat', text: ev.cardText }); setTimeout(() => setShowCard(null), 3000); }
    if (ev.type === 'PLAYER_WON') { setShowWinner(true); sounds.playWin(); }
    if (ev.type === 'BUNGALOW_BUILT') { setEventMsg(`🏠 Built bungalow`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'VILLA_BUILT') { setEventMsg(`💒 Built villa`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'GHOOS_PAID') { setEventMsg(`💸 ${name} paid Ghoos ₹50`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'SIFARISH_USED') { setEventMsg(`🤝 ${name} used Sifarish`); setTimeout(() => setEventMsg(null), 2000); }
  }, [playerNames]);

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`/api/games/monopoly/state/${sessionId}?playerIndex=${playerIndex}&t=${Date.now()}`);
      const data = await r.json();
      updateState(data);
    } catch {}
  }, [sessionId, playerIndex, updateState]);

  useEffect(() => {
    if (!sessionId) return;
    fetchState();
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [sessionId, fetchState]);

  // gameStatePush handler
  useEffect(() => {
    if (!gameStatePush) return;
    const prev = prevPlayersRef.current;
    const next = gameStatePush.players;
    if (prev && next) {
      for (let p = 0; p < prev.length && p < next.length; p++) {
        const pt = prev[p], nt = next[p];
        if (pt && nt && pt.position !== nt.position && !pt.bankrupt) {
          const movement = ((nt.position - pt.position) + 40) % 40;
          if (movement > 0 && movement <= 20) setStepAnim({ playerIndex: p, from: pt.position, to: nt.position });
        }
      }
    }
    if (gameStatePush._events) for (const ev of gameStatePush._events as GameEvent[]) handleGameEvent(ev);
    updateState(gameStatePush);
  }, [gameStatePush, handleGameEvent, updateState]);

  // Remote dice
  useEffect(() => {
    if (!diceEvent || !diceRef.current || diceEvent.playerIndex === playerIndex) return;
    if (diceEvent.action === 'CONFIRM_DICE') {
      const dv = diceEvent.diceValue;
      if (dv && Array.isArray(dv) && dv.length === 2) diceRef.current.roll(dv[0], dv[1]);
    }
  }, [diceEvent, playerIndex]);

  // Server action
  const sendAction = useCallback(async (actionType: string, payload?: any) => {
    if (!sessionId) return null;
    try {
      const r = await fetch('/api/games/monopoly/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerIndex, action: { type: actionType, payload } }),
      });
      const data = await r.json();
      if (!r.ok || data.valid === false) return data;
      if (data.state) {
        updateState(data.state);
        if (data.events) for (const ev of data.events as GameEvent[]) handleGameEvent(ev);
        if (data.state.winner !== null) setShowWinner(true);
      }
      return data;
    } catch { return null; }
  }, [sessionId, playerIndex, handleGameEvent, updateState]);

  const handleStepAnimDone = useCallback(() => setStepAnim(null), []);

  const handleRoll = useCallback(async () => {
    if (rollingRef.current || gs.phase !== 'waiting_for_roll' || !diceRef.current) return;
    rollingRef.current = true;
    sounds.playDiceRoll();
    const rollData = await sendAction('ROLL_DICE');
    if (!rollData?.success || !rollData.rollId) { rollingRef.current = false; return; }
    const [v1, v2] = await diceRef.current.roll();
    await sendAction('CONFIRM_DICE', { rollId: rollData.rollId, values: [v1, v2] });
    rollingRef.current = false;
  }, [sendAction, gs.phase]);

  const handleBuy = useCallback(async () => { if (canBuy) { await sendAction('BUY_PROPERTY'); setSelectedFanCard(null); } }, [canBuy, sendAction]);
  const handleDecline = useCallback(async () => { if (canDecline) await sendAction('DECLINE_PROPERTY'); }, [canDecline, sendAction]);
  const handleEndTurn = useCallback(async () => { if (canEndTurn) await sendAction('END_TURN'); }, [canEndTurn, sendAction]);
  const handlePayGhoos = useCallback(async () => { if (canPayGhoos) await sendAction('PAY_GHOOS'); }, [canPayGhoos, sendAction]);
  const handleUseSifarish = useCallback(async () => { if (canUseSifarish) await sendAction('USE_SIFARISH_CARD'); }, [canUseSifarish, sendAction]);

  const handleRematch = useCallback(async () => {
    if (!sessionId) return;
    await fetch('/api/games/monopoly/rematch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
    setShowWinner(false);
    fetchState();
  }, [sessionId, fetchState]);

  const handleFanCardTap = useCallback((cardIndex: number) => {
    setSelectedFanCard(prev => prev === cardIndex ? null : cardIndex);
    if (isMyTurn) setBuildingMenu(prev => prev === cardIndex ? null : cardIndex);
  }, [isMyTurn]);

  const handleBuildBungalow = useCallback(async () => {
    if (buildingMenu === null || !myPropertyCards[buildingMenu]) return;
    await sendAction('BUILD_BUNGALOW', { propertyId: myPropertyCards[buildingMenu].spaceId });
    setBuildingMenu(null);
  }, [buildingMenu, myPropertyCards, sendAction]);

  const handleBuildVilla = useCallback(async () => {
    if (buildingMenu === null || !myPropertyCards[buildingMenu]) return;
    await sendAction('BUILD_VILLA', { propertyId: myPropertyCards[buildingMenu].spaceId });
    setBuildingMenu(null);
  }, [buildingMenu, myPropertyCards, sendAction]);

  const handleSellBungalow = useCallback(async () => {
    if (buildingMenu === null || !myPropertyCards[buildingMenu]) return;
    await sendAction('SELL_BUNGALOW', { propertyId: myPropertyCards[buildingMenu].spaceId });
    setBuildingMenu(null);
  }, [buildingMenu, myPropertyCards, sendAction]);

  const allTokens = gs.players.filter(p => !p.bankrupt).map((p, i) => ({ playerIndex: i, position: p.position }));
  const hasPlayers = gs.players.length > 0;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e', color: '#eee', position: 'relative', overflow: 'hidden' }}>
      {hasPlayers && <OpponentBar players={gs.players} currentPlayer={gs.currentPlayer} playerNames={playerNames} />}

      <AnimatePresence>
        {eventMsg && (
          <motion.div key="event" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(233,69,96,0.9)', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {eventMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, position: 'relative' }}>
        {hasPlayers && <MonopolyBoard tokens={allTokens} stepAnim={stepAnim} onStepAnimDone={handleStepAnimDone} totalPlayers={gs.players.length} />}
      </div>

      {/* Building menu popup */}
      <AnimatePresence>
        {selectedProp && buildingMenu !== null && (
          <motion.div key="build-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: 220, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#16213e', borderRadius: 8, border: '1px solid #333', padding: '8px 12px', display: 'flex', gap: 6, fontSize: 11 }}>
            {selectedProp.houses < 4 && gs.validActions.includes('BUILD_BUNGALOW') && (
              <button onClick={handleBuildBungalow} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 11 }}>🏠 Build Bungalow</button>
            )}
            {selectedProp.houses === 4 && gs.validActions.includes('BUILD_VILLA') && (
              <button onClick={handleBuildVilla} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#F44336', color: '#fff', cursor: 'pointer', fontSize: 11 }}>💒 Build Villa</button>
            )}
            {selectedProp.houses > 0 && selectedProp.houses < 5 && gs.validActions.includes('SELL_BUNGALOW') && (
              <button onClick={handleSellBungalow} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #999', background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 11 }}>Sell Bungalow</button>
            )}
            <button onClick={() => setBuildingMenu(null)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#333', color: '#aaa', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', flexShrink: 0, flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)' }}>
        {canRoll && !canPayGhoos && !canUseSifarish && (
          <button onClick={handleRoll} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer' }}>🎲 Roll</button>
        )}
        {canPayGhoos && (
          <button onClick={handlePayGhoos} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: '#FF8C00', color: '#fff', cursor: 'pointer' }}>💸 Pay Ghoos ₹50</button>
        )}
        {canUseSifarish && (
          <button onClick={handleUseSifarish} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: '#9C27B0', color: '#fff', cursor: 'pointer' }}>🤝 Use Sifarish</button>
        )}
        {canBuy && <button onClick={handleBuy} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer' }}>Buy ₹{getSpaceInfo(gs.landedIndex ?? 0)?.price || 0}</button>}
        {canDecline && <button onClick={handleDecline} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: '1px solid #999', background: 'transparent', color: '#999', cursor: 'pointer' }}>Decline</button>}
        {canEndTurn && <button onClick={handleEndTurn} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: '1px solid #e94560', background: 'transparent', color: '#e94560', cursor: 'pointer' }}>End Turn</button>}
        {!isMyTurn && gs.winner === null && gs.players.length > 0 && (
          <div style={{ fontSize: 11, color: '#888' }}>Waiting for {playerNames[gs.currentPlayer] || PLAYER_NAMES[gs.currentPlayer % PLAYER_NAMES.length] || `P${gs.currentPlayer}`}...</div>
        )}
        {gs.diceTotal !== null && <div style={{ fontSize: 11, color: '#aaa' }}>🎲 {gs.dice?.[0] ?? '?'} + {gs.dice?.[1] ?? '?'} = {gs.diceTotal}</div>}
      </div>

      <Dice ref={diceRef} />

      <div style={{ position: 'relative', zIndex: 20, overflow: 'visible', background: 'rgba(22,33,62,0.4)', flexShrink: 0 }}>
        <PropertyFan cards={myPropertyCards} selectedCardIndex={selectedFanCard} onSelectCard={handleFanCardTap} disabled={!isMyTurn} />
      </div>

      <AnimatePresence>
        {showCard && (
          <motion.div key="card" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: showCard.type === 'kismat' ? '#FF8C00' : '#4CAF50', borderRadius: 12, padding: '24px 32px', maxWidth: 300, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#fff' }}>{showCard.type === 'kismat' ? '✨ Kismat' : '💡 Jugaad'}</div>
              <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.4, fontWeight: 500 }}>{showCard.text}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBankrupt && (
          <motion.div key="bankrupt" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'fixed', inset: 0, zIndex: 900, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#ff0000', textShadow: '0 0 40px #ff0000', fontFamily: 'monospace' }}>💀 BANKRUPT!</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWinner && (
          <motion.div key="winner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
            <h2 style={{ color: '#fbbf24', margin: '0 0 8px', fontSize: 28 }}>
              {gs.winner === playerIndex ? 'You Win!' : `${playerNames[gs.winner!] || PLAYER_NAMES[gs.winner! % PLAYER_NAMES.length] || `P${gs.winner!}`} Wins!`}
            </h2>
            <button onClick={handleRematch} style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>🔄 Rematch</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
