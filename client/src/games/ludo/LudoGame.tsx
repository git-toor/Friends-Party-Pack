import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LudoBoard } from './LudoBoard.js';
import { Dice } from './Dice.js';
import { useLudoSounds } from './sounds.js';
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

export default function LudoGame({ playerCount = 2, playerIndex = 0, playerName = 'You', sessionId, players, gameStatePush }: LudoGameProps) {
  const [gs, setGs] = useState<LudoClientState>(EMPTY_STATE);
  const [rollPending, setRollPending] = useState(false);
  const [animatingTokens, setAnimatingTokens] = useState<Set<string>>(new Set());
  const [showCapture, setShowCapture] = useState<{ player: number; token: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
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
    if (gameStatePush) {
      setGs(gameStatePush);
      // Check for winner
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

  const handleRollResult = useCallback(async (value: number) => {
    setRollPending(false);
    sounds.playDiceRoll();
    await sendAction('ROLL_DICE');
  }, [sendAction, sounds]);

  const handleTokenClick = useCallback(async (tokenIndex: number) => {
    if (!gs.isMyTurn || gs.phase !== 'moving') return;
    if (!gs.validMoves.includes(tokenIndex)) return;
    setAnimatingTokens(prev => new Set(prev).add(`${playerIndex}-${tokenIndex}`));
    sounds.playTokenMove();
    await sendAction('MOVE_TOKEN', { tokenIndex });
    setAnimatingTokens(prev => {
      const next = new Set(prev);
      next.delete(`${playerIndex}-${tokenIndex}`);
      return next;
    });
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

  // Collect all tokens for the board
  const allTokens: TokenView[] = gs.players.flatMap((p, i) =>
    p.tokens.map((t, j) => ({ playerIndex: i, tokenIndex: j, state: t.state, progress: t.progress }))
  );

  const isMyTurn = gs.isMyTurn;
  const needsRoll = isMyTurn && gs.phase === 'rolling' && gs.winner === null;
  const needsMove = isMyTurn && gs.phase === 'moving';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e', color: '#eee', position: 'relative' }}>
      {/* Top bar — players */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', overflowX: 'auto', background: 'rgba(0,0,0,0.3)' }}>
        {gs.players.map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            borderRadius: 6, fontSize: 12,
            background: i === gs.currentPlayer ? `${PLAYER_COLORS[i]}33` : 'transparent',
            border: i === gs.currentPlayer ? `1px solid ${PLAYER_COLORS[i]}` : '1px solid transparent',
            opacity: gs.players[i]?.tokens.some(t => t.state !== 'finished') ? 1 : 0.4,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAYER_COLORS[i] }} />
            <span style={{ fontWeight: 600 }}>{playerNames[i] || `${COLOR_NAMES[i]} Player`}</span>
            <span style={{ fontSize: 10, color: '#aaa' }}>
              {gs.players[i]?.tokens.filter(t => t.state === 'finished').length}/4
            </span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
        <LudoBoard
          tokens={allTokens}
          validMoves={gs.validMoves}
          currentPlayer={gs.currentPlayer}
          diceValue={gs.diceValue}
          phase={gs.phase}
          playerIndex={playerIndex}
          onTokenClick={handleTokenClick}
        />
      </div>

      {/* Dice and controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: '12px 16px', background: 'rgba(0,0,0,0.3)',
      }}>
        {gs.diceValue !== null && (
          <div style={{
            width: 48, height: 48, borderRadius: 8, background: '#fff', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800,
          }}>
            {gs.diceValue}
          </div>
        )}
        {needsRoll && (
          <Dice onRollResult={handleRollResult} enabled={!rollPending} playerIndex={playerIndex} />
        )}
        {needsMove && (
          <div style={{ fontSize: 12, color: '#fbbf24' }}>Tap a glowing token to move</div>
        )}
        {!isMyTurn && gs.winner === null && (
          <div style={{ fontSize: 12, color: '#888' }}>
            Waiting for {playerNames[gs.currentPlayer] || `${COLOR_NAMES[gs.currentPlayer]} Player`}...
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
            <div style={{
              fontSize: 60, fontWeight: 900, color: '#ff4444',
              textShadow: '0 0 40px #ff0000',
              transform: 'rotate(-10deg)',
            }}>
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
              {gs.winner === playerIndex ? 'You Win!' : `${playerNames[gs.winner!] || `${COLOR_NAMES[gs.winner!]} Player`} Wins!`}
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
