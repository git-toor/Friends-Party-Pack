import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LudoBoard, playerColorIndex } from './LudoBoard.js';
import { Dice, type DiceHandle } from './Dice.js';
import { useLudoSounds } from './sounds.js';
import type { ChatMessage } from '../../components/ChatBox.js';

interface GameEvent {
  type: 'TOKEN_MOVED' | 'CAPTURE' | 'TOKEN_FINISHED' | 'BLOCK_FORMED';
  playerIndex: number;
  tokenIndex: number;
  from?: number;
  to?: number;
  victimPlayer?: number;
  victimToken?: number;
  position?: number;
}

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
const COLOR_NAMES = ['Red', 'Blue', 'Yellow', 'Green'];

interface LudoGameProps {
  playerCount?: number;
  playerIndex?: number;
  playerName?: string;
  playerId?: string;
  sessionId?: string;
  players?: { name: string; index: number; id?: string }[];
  gameStatePush?: any;
  nsfw?: boolean;
}

interface TokenView {
  playerIndex: number;
  tokenIndex: number;
  state: string;
  progress: number;
}

interface LudoClientState {
  players: { tokens: TokenView[]; finishedCount: number }[];
  currentPlayer: number;
  diceValue: number | null;
  phase: string;
  winner: number | null;
  isMyTurn: boolean;
  validMoves: number[];
}

const EMPTY_STATE: LudoClientState = {
  players: [],
  currentPlayer: 0,
  diceValue: null,
  phase: 'rolling',
  winner: null,
  isMyTurn: false,
  validMoves: [],
};

export default function LudoGame({ playerCount = 2, playerIndex = 0, playerName = 'You', playerId = '', sessionId, players, gameStatePush }: LudoGameProps) {
  const [gs, setGs] = useState<LudoClientState>(EMPTY_STATE);
  const [showCapture, setShowCapture] = useState<{ player: number; token: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const diceRef = useRef<DiceHandle>(null);
  const sounds = useLudoSounds();

  const playerNames = players?.reduce((acc, p) => { acc[p.index] = p.name; return acc; }, {} as Record<number, string>) || {};

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`/api/games/ludo/state/${sessionId}?playerIndex=${playerIndex}`);
      const data = await r.json();
      if (data) setGs(data);
    } catch {}
  }, [sessionId, playerIndex]);

  useEffect(() => {
    if (!sessionId) return;
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [sessionId, fetchState]);

  useEffect(() => {
    const handler = (e: Event) => {
      setChatMsgs(prev => [...prev, (e as CustomEvent).detail as ChatMessage]);
    };
    window.addEventListener('chat-message', handler as EventListener);
    return () => window.removeEventListener('chat-message', handler as EventListener);
  }, []);

  useEffect(() => {
    if (gameStatePush) {
      setGs(gameStatePush);
      if (gameStatePush.winner !== null) {
        setShowWinner(true);
        sounds.playWin();
      }
    }
  }, [gameStatePush, sounds]);

  const sendAction = useCallback(async (actionType: string, payload?: any) => {
    if (!sessionId) return;
    try {
      const r = await fetch('/api/games/ludo/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerIndex, action: { type: actionType, payload } }),
      });
      const data = await r.json();
      if (data.state) {
        setGs(data.state);
        if (data.events) {
          for (const ev of data.events as GameEvent[]) {
            if (ev.type === 'CAPTURE') {
              setShowCapture({ player: ev.victimPlayer!, token: ev.victimToken! });
              sounds.playCapture();
              setTimeout(() => setShowCapture(null), 600);
            }
          }
        }
        if (data.state.winner !== null) setShowWinner(true);
      }
      return data;
    } catch { return null; }
  }, [sessionId, playerIndex, sounds]);

  const handleRollResult = useCallback(async () => {
    if (!diceRef.current) return;
    sounds.playDiceRoll();
    // Send roll to server first
    const data = await sendAction('ROLL_DICE');
    if (data?.diceValue) {
      // Animate 3D dice with the server value
      await diceRef.current.rollWithValue(data.diceValue);
    }
  }, [sendAction, sounds]);

  const handleTokenClick = useCallback(async (tokenIndex: number) => {
    if (!gs.isMyTurn || gs.phase !== 'moving') return;
    if (!gs.validMoves.includes(tokenIndex)) return;
    sounds.playTokenMove();
    await sendAction('MOVE_TOKEN', { tokenIndex });
  }, [gs, playerIndex, sendAction, sounds]);

  const handleRematch = useCallback(async () => {
    if (!sessionId) return;
    await fetch('/api/games/ludo/rematch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    setShowWinner(false);
    fetchState();
  }, [sessionId, fetchState]);

  const allTokens: TokenView[] = gs.players.flatMap((p, i) =>
    p.tokens.map((t, j) => ({ playerIndex: i, tokenIndex: j, state: t.state, progress: t.progress }))
  );

  const isMyTurn = gs.isMyTurn;
  const needsRoll = isMyTurn && gs.phase === 'rolling' && gs.winner === null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e', color: '#eee', position: 'relative', overflow: 'auto' }}>
      {/* Top bar — players */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', overflowX: 'auto', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        {gs.players.map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            borderRadius: 6, fontSize: 12,
            background: i === gs.currentPlayer ? `${PLAYER_COLORS[playerColorIndex(i, gs.players.length)]}33` : 'transparent',
            border: i === gs.currentPlayer ? `1px solid ${PLAYER_COLORS[playerColorIndex(i, gs.players.length)]}` : '1px solid transparent',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAYER_COLORS[playerColorIndex(i, gs.players.length)] }} />
            <span style={{ fontWeight: 600 }}>{playerNames[i] || `${COLOR_NAMES[playerColorIndex(i, gs.players.length)]} Player`}</span>
            <span style={{ fontSize: 10, color: '#aaa' }}>
              {gs.players[i]?.tokens.filter(t => t.state === 'finished').length}/4
            </span>
          </div>
        ))}
      </div>

      {/* Chat messages overlay — centered above board */}
      <div style={{ position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none', maxWidth: 300, width: '90%', alignItems: 'center' }}>
        {chatMsgs.slice(-4).map((m, i) => {
          const isMe = m.playerId === playerId;
          return (
            <div key={i} style={{
              background: 'rgba(15,20,40,0.85)', borderRadius: 6, padding: '4px 14px',
              fontSize: 11, animation: 'fadeIn 0.3s ease', textAlign: 'center',
            }}>
              <span style={{ color: '#e94560', fontWeight: 600 }}>
                {isMe ? 'You' : m.playerName}
              </span>
              <span style={{ color: '#ccc', marginLeft: 4 }}>{m.text}</span>
            </div>
          );
        })}
      </div>

      {/* Board area — with dice and controls layered above */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', position: 'relative', minHeight: 0 }}>
        <div style={{ width: '100%', maxWidth: 500 }}>
          <LudoBoard
            tokens={allTokens}
            validMoves={gs.validMoves}
            currentPlayer={gs.currentPlayer}
            playerIndex={playerIndex}
            totalPlayers={gs.players.length}
            onTokenClick={handleTokenClick}
          />
        </div>
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '8px 16px', background: 'rgba(0,0,0,0.4)', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {needsRoll && (
          <button onClick={handleRollResult} style={{
            padding: '10px 22px', fontSize: 16, fontWeight: 700, borderRadius: 8,
            border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer',
          }}>
            🎲 Roll
          </button>
        )}
        {gs.diceValue !== null && (
          <motion.div
            key={gs.diceValue}
            initial={{ scale: 0.5, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            style={{
              width: 40, height: 40, borderRadius: 6, background: '#fff', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800,
            }}
          >
            {gs.diceValue}
          </motion.div>
        )}
        {gs.diceValue !== null && isMyTurn && gs.phase === 'moving' && (
          <div style={{ fontSize: 11, color: '#fbbf24' }}>
            {gs.diceValue !== 6 && gs.players[playerIndex]?.tokens.every(t => t.state === 'home' || t.state === 'finished')
              ? `No 6, wait for your turn to roll 6`
              : `Rolled ${gs.diceValue} — Tap a glowing token to move it`}
          </div>
        )}
        {!isMyTurn && gs.winner === null && (
          <div style={{ fontSize: 11, color: '#888' }}>
            Waiting for {playerNames[gs.currentPlayer] || `${COLOR_NAMES[playerColorIndex(gs.currentPlayer, gs.players.length)]} Player`}...
          </div>
        )}
      </div>

      {/* Capture effect */}
      <AnimatePresence>
        {showCapture && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 900, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 900, color: '#ff4444', textShadow: '0 0 40px #ff0000', transform: 'rotate(-10deg)' }}>
              💥 CAPTURE!
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
              {gs.winner === playerIndex ? 'You Win!' : `${playerNames[gs.winner!] || `${COLOR_NAMES[playerColorIndex(gs.winner!, gs.players.length)]} Player`} Wins!`}
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

      {/* Spacer for fixed chat bar */}
      <div style={{ height: 50, flexShrink: 0 }} />
    </div>
  );
}
