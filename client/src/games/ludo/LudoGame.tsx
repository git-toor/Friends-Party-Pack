import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LudoBoard, playerColorIndex } from './LudoBoard.js';
import { Dice, type DiceHandle } from './Dice.js';
import { useLudoSounds } from './sounds.js';
import { PLAYER_COLORS, COLOR_NAMES } from './constants.js';
import type { ChatMessage } from '../../components/ChatBox.js';

interface GameEvent {
  type: 'TOKEN_MOVED' | 'CAPTURE' | 'TOKEN_FINISHED' | 'BLOCK_FORMED' | 'TURN_ENDED';
  playerIndex: number;
  tokenIndex: number;
  from?: number;
  to?: number;
  victimPlayer?: number;
  victimToken?: number;
  position?: number;
}

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
  diceRolledBy: number | null;
  phase: string;
  winner: number | null;
  validMoves: number[];
}

const EMPTY_STATE: LudoClientState = {
  players: [],
  currentPlayer: 0,
  diceValue: null,
  diceRolledBy: null,
  phase: 'waiting_for_roll',
  winner: null,
  validMoves: [],
};

export default function LudoGame({ playerCount = 2, playerIndex = 0, playerName = 'You', playerId = '', sessionId, players, gameStatePush }: LudoGameProps) {
  const [gs, setGs] = useState<LudoClientState>(EMPTY_STATE);
  const svRef = useRef(-1);
  const [stepAnim, setStepAnim] = useState<{ tokenIndex: number; from: number; to: number; playerIndex: number } | null>(null);
  const [showCapture, setShowCapture] = useState<{ player: number; token: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const rollingRef = useRef(false);
  const diceRef = useRef<DiceHandle>(null);
  const sounds = useLudoSounds();

  const playerNames = players?.reduce((acc, p) => { acc[p.index] = p.name; return acc; }, {} as Record<number, string>) || {};

  // ─── Calculate isMyTurn locally ──
  const isMyTurn = playerIndex === gs.currentPlayer;
  const canRoll = isMyTurn && gs.phase === 'waiting_for_roll' && gs.winner === null && !rollingRef.current && gs.diceRolledBy === null;
  const myDice = gs.diceRolledBy === playerIndex;
  const showDiceValue = gs.diceValue !== null && myDice;
  const canMoveToken = isMyTurn && gs.phase === 'waiting_for_move' && gs.validMoves.length > 0;
  const canEndTurn = isMyTurn && gs.winner === null && !rollingRef.current && (
    (gs.phase === 'waiting_for_move' && gs.validMoves.length === 0) ||
    (gs.phase === 'waiting_for_roll' && gs.diceRolledBy === playerIndex)
  );

  // ─── Authoritative state update: every API response is applied directly ──
  const updateState = useCallback((newState: any) => {
    if (!newState) return;
    if (newState._sv !== undefined && newState._sv <= svRef.current) return;
    if (newState._sv !== undefined) svRef.current = newState._sv;
    setGs({
      players: newState.players || [],
      currentPlayer: newState.currentPlayer ?? 0,
      diceValue: newState.diceValue ?? null,
      diceRolledBy: newState.diceRolledBy ?? null,
      phase: newState.phase || 'waiting_for_roll',
      winner: newState.winner ?? null,
      validMoves: newState.validMoves || [],
    });
  }, []);

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`/api/games/ludo/state/${sessionId}?playerIndex=${playerIndex}&t=${Date.now()}`);
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

  useEffect(() => {
    const handler = (e: Event) => {
      setChatMsgs(prev => [...prev, (e as CustomEvent).detail as ChatMessage]);
    };
    window.addEventListener('chat-message', handler as EventListener);
    return () => window.removeEventListener('chat-message', handler as EventListener);
  }, []);

  useEffect(() => {
    if (gameStatePush) {
      updateState(gameStatePush);
      if (gameStatePush.winner !== null) {
        setShowWinner(true);
        sounds.playWin();
      }
    }
  }, [gameStatePush, sounds, updateState]);

  // ─── Server action — only state update, no client logic ──────
  const sendAction = useCallback(async (actionType: string, payload?: any) => {
    if (!sessionId) return;
    try {
      const r = await fetch('/api/games/ludo/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerIndex, action: { type: actionType, payload } }),
      });
      const data = await r.json();
      if (!r.ok || data.valid === false) {
        return data;
      }
      if (data.state) {
        updateState(data.state);
        if (data.events) {
          for (const ev of data.events as GameEvent[]) {
            if (ev.type === 'CAPTURE') {
              setShowCapture({ player: ev.victimPlayer!, token: ev.victimToken! });
              sounds.playCapture();
              setTimeout(() => setShowCapture(null), 600);
            }
            if (ev.type === 'TOKEN_MOVED' && ev.playerIndex !== playerIndex) {
              setStepAnim({ tokenIndex: ev.tokenIndex, from: ev.from ?? 0, to: ev.to ?? 0, playerIndex: ev.playerIndex });
            }
          }
        }
        if (data.state.winner !== null) setShowWinner(true);
      }
      return data;
    } catch { return null; }
  }, [sessionId, playerIndex, sounds, updateState]);

  const handleRollResult = useCallback(async () => {
    if (rollingRef.current) return;
    if (gs.phase !== 'waiting_for_roll') return;
    if (!diceRef.current) return;
    rollingRef.current = true;
    sounds.playDiceRoll();

    // Step 1: create roll slot — server waits for dice result
    const rollData = await sendAction('ROLL_DICE');
    if (!rollData?.success || !rollData.rollId) {
      rollingRef.current = false;
      return;
    }

    // Step 2: free 3D physics — no forced value, reads actual result
    const [value] = await diceRef.current.roll();

    // Step 3: confirm the dice value with server
    await sendAction('CONFIRM_DICE', { rollId: rollData.rollId, value });

    rollingRef.current = false;
  }, [sendAction, sounds, gs.phase]);

  const handleTokenClick = useCallback(async (tokenIndex: number) => {
    if (!isMyTurn) return;
    if (gs.phase !== 'waiting_for_move') return;
    if (!gs.validMoves.includes(tokenIndex)) return;
    if (diceRef.current) diceRef.current.clear();
    sounds.playTokenMove();
    await sendAction('MOVE_TOKEN', { tokenIndex });
  }, [isMyTurn, gs.phase, gs.validMoves, sendAction, sounds]);

  const handleEndTurn = useCallback(async () => {
    if (!canEndTurn) return;
    if (diceRef.current) diceRef.current.clear();
    await sendAction('END_TURN');
  }, [canEndTurn, sendAction]);

  const handleBoardClick = useCallback(() => {
    // Only dismiss the 3D dice visual — never modify game state
    if (diceRef.current) diceRef.current.clear();
  }, []);

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

  const hasPlayers = gs.players.length > 0;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e', color: '#eee', position: 'relative', overflow: 'auto' }}>
      {/* Top bar — players (always renders when players exist) */}
      {hasPlayers && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', overflowX: 'auto', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
          {gs.players.map((_, i) => {
            const isActive = i === gs.currentPlayer;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                borderRadius: 6, fontSize: 12,
                background: isActive ? `${PLAYER_COLORS[playerColorIndex(i, gs.players.length)]}33` : 'transparent',
                border: isActive ? `1px solid ${PLAYER_COLORS[playerColorIndex(i, gs.players.length)]}` : '1px solid transparent',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAYER_COLORS[playerColorIndex(i, gs.players.length)] }} />
                <span style={{ fontWeight: 600 }}>{playerNames[i] || `${COLOR_NAMES[playerColorIndex(i, gs.players.length)]} Player`}</span>
                <span style={{ fontSize: 10, color: '#aaa' }}>
                  {gs.players[i]?.tokens.filter(t => t.state === 'finished').length}/4
                </span>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Board area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', position: 'relative', minHeight: 0 }} onClick={handleBoardClick}>
        {hasPlayers && (
          <div style={{ width: '100%', maxWidth: 500 }}>
            <LudoBoard
              tokens={allTokens}
              validMoves={gs.validMoves}
              currentPlayer={gs.currentPlayer}
              playerIndex={playerIndex}
              totalPlayers={gs.players.length}
              diceValue={gs.diceValue}
              isMyTurn={isMyTurn}
              onMoveToken={handleTokenClick}
              stepAnim={stepAnim}
              onStepAnimDone={() => setStepAnim(null)}
            />
          </div>
        )}
      </div>

      {/* Dice overlay */}
      <Dice ref={diceRef} />

      {/* Controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '8px 16px', background: 'rgba(0,0,0,0.4)', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {canRoll && (
          <button onClick={handleRollResult} style={{
            padding: '10px 22px', fontSize: 16, fontWeight: 700, borderRadius: 8,
            border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer',
          }}>
            🎲 Roll
          </button>
        )}
        {showDiceValue && (
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
        {showDiceValue && gs.phase === 'waiting_for_move' && gs.validMoves.length > 0 && (
          <div style={{ fontSize: 11, color: '#fbbf24' }}>
            {gs.diceValue !== 6 && gs.players[playerIndex]?.tokens.every(t => t.state === 'home' || t.state === 'finished')
              ? `No 6, end your turn`
              : `Rolled ${gs.diceValue} — Tap glowing token to move`}
          </div>
        )}
        {showDiceValue && gs.phase === 'waiting_for_move' && gs.validMoves.length === 0 && (
          <div style={{ fontSize: 11, color: '#fbbf24' }}>
            Rolled {gs.diceValue} — no moves, end your turn
          </div>
        )}
        {canEndTurn && (
          <button onClick={handleEndTurn} style={{
            padding: '10px 22px', fontSize: 14, fontWeight: 600, borderRadius: 8,
            border: '1px solid #e94560', background: 'transparent', color: '#e94560', cursor: 'pointer',
          }}>
            End Turn
          </button>
        )}
        {gs.diceValue !== null && myDice && !canRoll && gs.phase !== 'waiting_for_move' && gs.phase !== 'rolling_dice' && (
          <div style={{ fontSize: 10, color: '#aaa' }}>
            Tap the board to dismiss dice
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
