import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MonopolyBoard } from './MonopolyBoard.js';
import { Dice, type DiceHandle } from './Dice.js';
import { OpponentBar } from './OpponentBar.js';
import { PropertyFan } from './PropertyFan.js';
import type { PropertyCardData } from './PropertyCard.js';
import { sounds } from './sounds.js';
import { PLAYER_NAMES } from './constants.js';

interface GameEvent {
  type: 'PLAYER_MOVED' | 'PASSED_GO' | 'BOUGHT_PROPERTY' | 'PAID_RENT' | 'PAID_TAX' | 'WENT_TO_JAIL' | 'BANKRUPT' | 'PLAYER_WON' | 'ROLLED_DOUBLES' | 'THREE_DOUBLES' | 'TURN_ENDED';
  playerIndex: number;
  amount?: number;
  toPlayer?: number;
  propertyIndex?: number;
  from?: number;
  to?: number;
}

interface PlayerState {
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  jailFreeCards: number;
  bankrupt: boolean;
}

interface PropertyState {
  owner: number | null;
  houses: number;
  mortgaged: boolean;
}

interface MonopolyClientState {
  players: PlayerState[];
  properties: PropertyState[];
  currentPlayer: number;
  phase: string;
  dice: [number, number] | null;
  diceTotal: number | null;
  doublesCount: number;
  rolledBy: number | null;
  lastAction: string | null;
  landedIndex: number | null;
  winner: number | null;
  validActions: string[];
}

interface MonopolyGameProps {
  playerCount?: number;
  playerIndex?: number;
  playerName?: string;
  playerId?: string;
  sessionId?: string;
  players?: { name: string; index: number; id?: string }[];
  gameStatePush?: any;
  diceEvent?: any;
  nsfw?: boolean;
}

const EMPTY_STATE: MonopolyClientState = {
  players: [],
  properties: [],
  currentPlayer: 0,
  phase: 'waiting_for_roll',
  dice: null,
  diceTotal: null,
  doublesCount: 0,
  rolledBy: null,
  lastAction: null,
  landedIndex: null,
  winner: null,
  validActions: [],
};

export default function MonopolyGame({ playerCount = 2, playerIndex = 0, playerName = 'You', playerId = '', sessionId, players, gameStatePush, diceEvent }: MonopolyGameProps) {
  const [gs, setGs] = useState<MonopolyClientState>(EMPTY_STATE);
  const svRef = useRef(-1);
  const prevPlayersRef = useRef<PlayerState[] | null>(null);
  const [stepAnim, setStepAnim] = useState<{ playerIndex: number; from: number; to: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const [showBankrupt, setShowBankrupt] = useState(false);
  const rollingRef = useRef(false);
  const diceRef = useRef<DiceHandle>(null);
  const [selectedFanCard, setSelectedFanCard] = useState<number | null>(null);

  const playerNames = players?.reduce((acc, p) => { acc[p.index] = p.name; return acc; }, {} as Record<number, string>) || {};

  const isMyTurn = playerIndex === gs.currentPlayer;
  const canRoll = isMyTurn && gs.phase === 'waiting_for_roll' && gs.winner === null && !rollingRef.current;
  const canBuy = isMyTurn && gs.phase === 'waiting_for_action' && gs.validActions.includes('BUY_PROPERTY');
  const canDecline = isMyTurn && gs.phase === 'waiting_for_action' && gs.validActions.includes('DECLINE_PROPERTY');
  const canEndTurn = isMyTurn && gs.phase === 'turn_end' && gs.validActions.includes('END_TURN');

  // ─── State update ──
  const updateState = useCallback((newState: any) => {
    if (!newState) return;
    if (newState._sv !== undefined && newState._sv <= svRef.current) return;
    if (newState._sv !== undefined) svRef.current = newState._sv;
    if (newState.players) prevPlayersRef.current = newState.players;
    setGs({
      players: newState.players || [],
      properties: newState.properties || [],
      currentPlayer: newState.currentPlayer ?? 0,
      phase: newState.phase || 'waiting_for_roll',
      dice: newState.dice ?? null,
      diceTotal: newState.diceTotal ?? null,
      doublesCount: newState.doublesCount ?? 0,
      rolledBy: newState.rolledBy ?? null,
      lastAction: newState.lastAction ?? null,
      landedIndex: newState.landedIndex ?? null,
      winner: newState.winner ?? null,
      validActions: newState.validActions || [],
    });
  }, []);

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

  // ─── gameStatePush handler ──
  useEffect(() => {
    if (!gameStatePush) return;

    const prev = prevPlayersRef.current;
    const next = gameStatePush.players;
    if (prev && next) {
      for (let p = 0; p < prev.length && p < next.length; p++) {
        const pt = prev[p];
        const nt = next[p];
        if (pt && nt && pt.position !== nt.position && !pt.bankrupt) {
          const movement = ((nt.position - pt.position) + 40) % 40;
          if (movement > 0 && movement <= 20) {
            setStepAnim({ playerIndex: p, from: pt.position, to: nt.position });
          }
        }
      }
    }

    if (gameStatePush._events) {
      for (const ev of gameStatePush._events as GameEvent[]) {
        if (ev.type === 'BANKRUPT') {
          setShowBankrupt(true);
          setTimeout(() => setShowBankrupt(false), 2000);
        }
        if (ev.type === 'PASSED_GO') {
          const name = playerNames[ev.playerIndex] || PLAYER_NAMES[ev.playerIndex % PLAYER_NAMES.length] || `P${ev.playerIndex}`;
          setEventMsg(`💰 ${name} passed GO +₹${ev.amount}`);
          setTimeout(() => setEventMsg(null), 2000);
        }
        if (ev.type === 'PAID_RENT') {
          const name = playerNames[ev.playerIndex] || PLAYER_NAMES[ev.playerIndex % PLAYER_NAMES.length] || `P${ev.playerIndex}`;
          const ownerName = ev.toPlayer !== undefined ? (playerNames[ev.toPlayer] || PLAYER_NAMES[ev.toPlayer % PLAYER_NAMES.length] || `P${ev.toPlayer}`) : '';
          setEventMsg(`💸 ${name} paid ₹${ev.amount} to ${ownerName}`);
          setTimeout(() => setEventMsg(null), 2000);
        }
        if (ev.type === 'BOUGHT_PROPERTY') {
          sounds.playBuy();
        }
        if (ev.type === 'PLAYER_WON') {
          const name = playerNames[ev.playerIndex] || PLAYER_NAMES[ev.playerIndex % PLAYER_NAMES.length] || `P${ev.playerIndex}`;
          setEventMsg(`🏆 ${name} wins!`);
          setShowWinner(true);
          sounds.playWin();
        }
      }
    }

    updateState(gameStatePush);
  }, [gameStatePush, playerNames, updateState]);

  // ─── Remote dice animation ──
  useEffect(() => {
    if (!diceEvent || !diceRef.current) return;
    if (diceEvent.playerIndex === playerIndex) return;
    if (diceEvent.action === 'CONFIRM_DICE') {
      const dv = diceEvent.diceValue;
      if (dv && Array.isArray(dv) && dv.length === 2) {
        diceRef.current.roll(dv[0], dv[1]);
      }
    }
  }, [diceEvent, playerIndex]);

  // ─── Server action ──
  const sendAction = useCallback(async (actionType: string, payload?: any) => {
    if (!sessionId) return null;
    try {
      const r = await fetch('/api/games/monopoly/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerIndex, action: { type: actionType, payload } }),
      });
      const data = await r.json();
      if (!r.ok || data.valid === false) return data;
      if (data.state) {
        updateState(data.state);
        if (data.events) {
          for (const ev of data.events as GameEvent[]) {
            if (ev.type === 'BOUGHT_PROPERTY') sounds.playBuy();
            if (ev.type === 'PAID_RENT') sounds.playRent();
            if (ev.type === 'BANKRUPT') {
              setShowBankrupt(true);
              setTimeout(() => setShowBankrupt(false), 2000);
              sounds.playBankrupt();
            }
            if (ev.type === 'PLAYER_WON') {
              setShowWinner(true);
              sounds.playWin();
            }
            if (ev.type === 'PASSED_GO') {
              const name = playerNames[ev.playerIndex] || PLAYER_NAMES[ev.playerIndex % PLAYER_NAMES.length] || `P${ev.playerIndex}`;
              setEventMsg(`💰 ${name} passed GO +₹${ev.amount}`);
              setTimeout(() => setEventMsg(null), 2000);
            }
            if (ev.type === 'PLAYER_MOVED' && ev.from !== undefined && ev.to !== undefined) {
              const movement = ((ev.to - ev.from) + 40) % 40;
              if (movement > 0 && movement <= 20) {
                setStepAnim({ playerIndex: ev.playerIndex, from: ev.from, to: ev.to });
              }
            }
          }
        }
        if (data.state.winner !== null) setShowWinner(true);
      }
      return data;
    } catch { return null; }
  }, [sessionId, playerIndex, playerNames, updateState]);

  const handleStepAnimDone = useCallback(() => setStepAnim(null), []);

  // ─── Action handlers ──
  const handleRoll = useCallback(async () => {
    if (rollingRef.current) return;
    if (gs.phase !== 'waiting_for_roll') return;
    if (!diceRef.current) return;
    rollingRef.current = true;
    sounds.playDiceRoll();

    const rollData = await sendAction('ROLL_DICE');
    if (!rollData?.success || !rollData.rollId) {
      rollingRef.current = false;
      return;
    }

    const [v1, v2] = await diceRef.current.roll();
    await sendAction('CONFIRM_DICE', { rollId: rollData.rollId, values: [v1, v2] });

    rollingRef.current = false;
  }, [sendAction, gs.phase]);

  const handleBuy = useCallback(async () => {
    if (!canBuy) return;
    await sendAction('BUY_PROPERTY');
    setSelectedFanCard(null);
  }, [canBuy, sendAction]);

  const handleDecline = useCallback(async () => {
    if (!canDecline) return;
    await sendAction('DECLINE_PROPERTY');
  }, [canDecline, sendAction]);

  const handleEndTurn = useCallback(async () => {
    if (!canEndTurn) return;
    await sendAction('END_TURN');
  }, [canEndTurn, sendAction]);

  const handleRematch = useCallback(async () => {
    if (!sessionId) return;
    await fetch('/api/games/monopoly/rematch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    setShowWinner(false);
    fetchState();
  }, [sessionId, fetchState]);

  // ─── Compute tokens for the board ──
  const allTokens = gs.players
    .filter(p => !p.bankrupt)
    .map((p, i) => ({ playerIndex: i, position: p.position }));

  // ─── Compute owned property cards for the fan ──
  const myPropertyCards: PropertyCardData[] = gs.properties
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => p.owner === playerIndex && gs.players[playerIndex] && !gs.players[playerIndex].bankrupt)
    .map(p => {
      const space = getSpaceInfo(p.index);
      return {
        index: p.index,
        name: space?.name || `Space ${p.index}`,
        group: space?.group,
        price: space?.price || 0,
        houses: p.houses,
        mortgaged: p.mortgaged,
      };
    });

  const hasPlayers = gs.players.length > 0;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#1a1a2e', color: '#eee', position: 'relative', overflow: 'hidden',
    }}>
      {/* Opponent bar */}
      {hasPlayers && (
        <OpponentBar
          players={gs.players}
          currentPlayer={gs.currentPlayer}
          playerNames={playerNames}
        />
      )}

      {/* Event message */}
      <AnimatePresence>
        {eventMsg && (
          <motion.div
            key="event"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)',
              zIndex: 100, background: 'rgba(233,69,96,0.9)', borderRadius: 8,
              padding: '6px 16px', fontSize: 12, fontWeight: 600,
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}
          >
            {eventMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, position: 'relative' }}>
        {hasPlayers && (
          <MonopolyBoard
            tokens={allTokens}
            stepAnim={stepAnim}
            onStepAnimDone={handleStepAnimDone}
            totalPlayers={gs.players.length}
          />
        )}
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '6px 12px', flexShrink: 0, flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {canRoll && (
          <button onClick={handleRoll} style={{
            padding: '8px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8,
            border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer',
          }}>
            🎲 Roll
          </button>
        )}
        {canBuy && (
          <button onClick={handleBuy} style={{
            padding: '8px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8,
            border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer',
          }}>
            Buy ₹{getSpaceInfo(gs.landedIndex ?? 0)?.price || 0}
          </button>
        )}
        {canDecline && (
          <button onClick={handleDecline} style={{
            padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8,
            border: '1px solid #999', background: 'transparent', color: '#999', cursor: 'pointer',
          }}>
            Decline
          </button>
        )}
        {canEndTurn && (
          <button onClick={handleEndTurn} style={{
            padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8,
            border: '1px solid #e94560', background: 'transparent', color: '#e94560', cursor: 'pointer',
          }}>
            End Turn
          </button>
        )}
        {!isMyTurn && gs.winner === null && gs.players.length > 0 && (
          <div style={{ fontSize: 11, color: '#888' }}>
            Waiting for {playerNames[gs.currentPlayer] || PLAYER_NAMES[gs.currentPlayer % PLAYER_NAMES.length] || `P${gs.currentPlayer}`}...
          </div>
        )}
        {gs.diceTotal !== null && (
          <div style={{ fontSize: 11, color: '#aaa' }}>
            🎲 {gs.dice?.[0] ?? '?'} + {gs.dice?.[1] ?? '?'} = {gs.diceTotal}
          </div>
        )}
      </div>

      {/* Dice overlay */}
      <Dice ref={diceRef} />

      {/* Property fan */}
      <div style={{
        position: 'relative', zIndex: 20, overflow: 'visible',
        background: 'rgba(22,33,62,0.4)', flexShrink: 0,
      }}>
        <PropertyFan
          cards={myPropertyCards}
          selectedCardIndex={selectedFanCard}
          onSelectCard={setSelectedFanCard}
          disabled={!isMyTurn}
        />
      </div>

      {/* Bankrupt overlay */}
      <AnimatePresence>
        {showBankrupt && (
          <motion.div
            key="bankrupt"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 900, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 900, color: '#ff0000', textShadow: '0 0 40px #ff0000', fontFamily: 'monospace' }}>
              💀 BANKRUPT!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner overlay */}
      <AnimatePresence>
        {showWinner && (
          <motion.div
            key="winner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
            <h2 style={{ color: '#fbbf24', margin: '0 0 8px', fontSize: 28 }}>
              {gs.winner === playerIndex ? 'You Win!' : `${playerNames[gs.winner!] || PLAYER_NAMES[gs.winner! % PLAYER_NAMES.length] || `P${gs.winner!}`} Wins!`}
            </h2>
            <button onClick={handleRematch} style={{
              padding: '12px 32px', borderRadius: 8, border: 'none',
              background: '#e94560', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}>
              🔄 Rematch
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Space info lookup (same data as server BOARD)
const SPACE_DATA: { index: number; name: string; group?: number; price?: number }[] = [
  { index: 0, name: 'GO' },
  { index: 1, name: 'Chandni Chowk', group: 0, price: 60 },
  { index: 2, name: 'Jugaad' },
  { index: 3, name: 'Hazratganj', group: 0, price: 60 },
  { index: 4, name: 'Income Tax' },
  { index: 5, name: 'Vande Bharat Exp', price: 200 },
  { index: 6, name: 'Ghat Road', group: 1, price: 100 },
  { index: 7, name: 'Kismat' },
  { index: 8, name: 'MI Road', group: 1, price: 100 },
  { index: 9, name: 'Law Garden', group: 1, price: 120 },
  { index: 10, name: 'Jail' },
  { index: 11, name: 'Mall Road', group: 2, price: 140 },
  { index: 12, name: 'Water Supply', price: 150 },
  { index: 13, name: 'Bapu Bazaar', group: 2, price: 140 },
  { index: 14, name: 'Lake Pichola', group: 2, price: 160 },
  { index: 15, name: 'Rajdhani Exp', price: 200 },
  { index: 16, name: 'Calangute Bch', group: 3, price: 180 },
  { index: 17, name: 'Jugaad' },
  { index: 18, name: 'White Town', group: 3, price: 180 },
  { index: 19, name: 'Rock Beach', group: 3, price: 200 },
  { index: 20, name: 'Free Parking' },
  { index: 21, name: 'MG Road', group: 4, price: 220 },
  { index: 22, name: 'Kismat' },
  { index: 23, name: 'Marina Beach', group: 4, price: 220 },
  { index: 24, name: 'Banjara Hills', group: 4, price: 240 },
  { index: 25, name: 'Shatabdi Exp', price: 200 },
  { index: 26, name: 'Park Street', group: 5, price: 260 },
  { index: 27, name: 'FC Road', group: 5, price: 260 },
  { index: 28, name: 'Electricity Bd', price: 150 },
  { index: 29, name: 'SG Highway', group: 5, price: 280 },
  { index: 30, name: 'Go To Jail' },
  { index: 31, name: 'Bandra West', group: 6, price: 300 },
  { index: 32, name: 'Connaught Pl', group: 6, price: 300 },
  { index: 33, name: 'Jugaad' },
  { index: 34, name: 'Cyber Hub', group: 6, price: 320 },
  { index: 35, name: 'Tejas Exp', price: 200 },
  { index: 36, name: 'Kismat' },
  { index: 37, name: 'Marine Drive', group: 7, price: 350 },
  { index: 38, name: 'Luxury Tax' },
  { index: 39, name: 'Altamount Rd', group: 7, price: 400 },
];

function getSpaceInfo(index: number): { name: string; group?: number; price?: number } | undefined {
  return SPACE_DATA.find(s => s.index === index);
}
