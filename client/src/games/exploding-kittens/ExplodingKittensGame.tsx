import { useState, useCallback, useEffect, useRef } from 'react';
import { Hand } from './components/Hand.js';
import { OpponentBar } from './components/OpponentBar.js';
import { ActionBar } from './components/ActionBar.js';
import { PlayArea } from './components/PlayArea.js';
import { GameOverOverlay } from './components/modals/GameOverOverlay.js';
import { FavorModal } from './components/modals/FavorModal.js';
import { DefuseModal } from './components/modals/DefuseModal.js';
import { ZombieReviveModal } from './components/modals/ZombieReviveModal.js';
import type { ChatMessage } from '../../components/ChatBox.js';

interface ClientCardRef {
  id: string; type: string; name: string; marked?: boolean;
}

interface ClientPlayerView {
  id: string; name: string; index: number; cardCount: number;
  alive: boolean; dead: boolean; pendingTurns: number;
  streakingKitten?: boolean; cursed: boolean; markedCardCount: number; stashCount: number;
}

interface ClientGameState {
  myHand: ClientCardRef[];
  myStash: ClientCardRef[];
  opponents: ClientPlayerView[];
  deckSize: number; discardCount: number;
  turn: { currentPlayerIndex: number; direction: number; phase: string; attackCount: number };
  actionStack: { type: string; playerIndex: number; status: string; payload?: any }[];
  nopeWindow: { expiresAt: number; chain: { playerIndex: number }[] } | null;
  settings: { playerCount: number; expansions?: string[] };
  winner: number | null;
  implodingKittenFaceUp: boolean;
  pendingCardView: { cards: { id: string; type: string }[] } | null;
}

interface EKGameProps {
  playerCount?: number; playerIndex?: number; playerName?: string; sessionId?: string;
  players?: { name: string; index: number; id?: string }[]; playerId?: string;
  gameStatePush?: any;
}

const EMPTY_STATE: ClientGameState = {
  myHand: [], myStash: [], opponents: [], deckSize: 0, discardCount: 0,
  turn: { currentPlayerIndex: 0, direction: 1, phase: 'playing', attackCount: 0 },
  actionStack: [], nopeWindow: null,
  settings: { playerCount: 2 }, winner: null, implodingKittenFaceUp: false, pendingCardView: null,
};

export default function ExplodingKittensGame({
  playerCount = 2, playerIndex = 0, sessionId, players, playerName = 'You', playerId = '',
  gameStatePush,
}: EKGameProps) {
  const [gs, setGs] = useState<ClientGameState>(EMPTY_STATE);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showFavor, setShowFavor] = useState<ClientCardRef[] | null>(null);
  const [showDefuse, setShowDefuse] = useState<{ deckSize: number; hasZombie: boolean } | null>(null);
  const [showZombieRevive, setShowZombieRevive] = useState<{ deadPlayers: { index: number; name: string }[] } | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showFuture, setShowFuture] = useState<{ cards: { id: string; type: string }[] } | null>(null);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const nopeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandSize = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      setChatMsgs(prev => [...prev, (e as CustomEvent).detail as ChatMessage]);
    };
    window.addEventListener('chat-message', handler as EventListener);
    return () => window.removeEventListener('chat-message', handler as EventListener);
  }, []);

  useEffect(() => {
    if (gameStatePush) {
      const next = gameStatePush as ClientGameState;
      setGs((prev: ClientGameState) => {
        if (next.winner !== null) {
          setShowGameOver(true);
        } else if (prev.winner !== null && next.winner === null) {
          setShowGameOver(false);
        }
        return next;
      });
      // Shuffle or card play notification
      if (lastHandSize.current > 0) {
        const handDiff = next.myHand.length - lastHandSize.current;
        if (handDiff < 0) {
          setLastNotification(`Played a card · +1 discard`);
          setTimeout(() => setLastNotification(null), 2000);
        }
      }
      lastHandSize.current = next.myHand.length;
    }
  }, [gameStatePush]);

  // Nope window auto-timeout
  useEffect(() => {
    if (nopeTimerRef.current) {
      clearTimeout(nopeTimerRef.current);
      nopeTimerRef.current = null;
    }
    if (gs.nopeWindow) {
      const remaining = Math.max(0, gs.nopeWindow.expiresAt - Date.now()) + 500;
      nopeTimerRef.current = setTimeout(() => {
        sendAction('RESOLVE_NOPE_TIMEOUT');
      }, remaining);
    }
    return () => {
      if (nopeTimerRef.current) clearTimeout(nopeTimerRef.current);
    };
  }, [gs.nopeWindow?.expiresAt, gs.nopeWindow?.chain.length]);

  const sendAction = useCallback(async (actionType: string, payload?: any) => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/games/exploding-kittens/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerIndex, action: { type: actionType, payload } }),
      });
      const data = await res.json();
      if (data.state) {
        setGs(data.state);
        if (data.state.winner !== null) setShowGameOver(true);
      }
      return data;
    } catch { return null; }
  }, [sessionId, playerIndex]);

  // Show See/Share/Alter the Future popup when server sends card view data
  useEffect(() => {
    if (gs.pendingCardView && gs.pendingCardView.cards.length > 0) {
      setShowFuture(gs.pendingCardView);
    }
  }, [gs.pendingCardView]);

  const isMyTurn = gs.turn.currentPlayerIndex === playerIndex;
  const turnPhase = gs.turn.phase;
  const hasSelection = selectedCardId !== null;
  const selectedCard = gs.myHand.find(c => c.id === selectedCardId);
  const canPlay = hasSelection && selectedCard !== undefined && selectedCard.type !== 'defuse' && selectedCard.type !== 'exploding_kitten' && selectedCard.type !== 'imploding_kitten';
  const isDead = gs.opponents.find(o => o.index === playerIndex)?.dead ?? false;

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/games/exploding-kittens/state/${sessionId}?playerIndex=${playerIndex}`);
      const data = await res.json();
      if (data) setGs((prev: ClientGameState) => {
        if (prev.winner !== null && data.winner === null) setShowGameOver(false);
        return data;
      });
    } catch {}
  }, [sessionId, playerIndex]);

  useEffect(() => {
    if (!sessionId) return;
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [sessionId, fetchState]);

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCardId(prev => prev === cardId ? null : cardId);
  }, []);

  const handleDrawCard = useCallback(async () => {
    setSelectedCardId(null);
    await sendAction('DRAW_CARD');
  }, [sendAction]);

  const handleEndTurn = useCallback(async () => {
    setSelectedCardId(null);
    await sendAction('END_TURN');
  }, [sendAction]);

  const handlePlayCard = useCallback(async () => {
    if (!selectedCardId) return;
    setSelectedCardId(null);
    const sel = gs.myHand.find(c => c.id === selectedCardId);
    const targetIndex = sel?.type === 'favor' || sel?.type === 'targeted_attack' || sel?.type === 'barking_kitten'
      ? gs.opponents.find(o => o.alive)?.index ?? (gs.turn.currentPlayerIndex + 1) % playerCount
      : undefined;
    await sendAction('PLAY_CARD', { cardId: selectedCardId, targetIndex });
  }, [selectedCardId, sendAction, gs.myHand, gs.opponents, gs.turn.currentPlayerIndex, playerCount]);

  const handleNope = useCallback(async () => {
    await sendAction('RESOLVE_NOPE');
  }, [sendAction]);

  const handleFavorChoose = useCallback(async (cardId: string) => {
    setShowFavor(null);
    await sendAction('RESOLVE_FAVOR', { cardId, victimIndex: playerIndex });
  }, [sendAction, playerIndex]);

  const handleDefuseInsert = useCallback(async (insertIndex: number) => {
    setShowDefuse(null);
    await sendAction('RESOLVE_DEFUSE', { insertIndex });
    fetchState();
  }, [sendAction, fetchState]);

  const handleZombieRevive = useCallback(async (targetIndex: number) => {
    setShowZombieRevive(null);
    await sendAction('RESOLVE_ZOMBIE_REVIVE', { targetIndex });
    fetchState();
  }, [sendAction, fetchState]);

  const handleRematch = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch('/api/games/exploding-kittens/rematch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      setShowGameOver(false);
      setSelectedCardId(null);
      fetchState();
    }
  }, [sessionId, fetchState]);

  const handleBackToLobby = useCallback(() => {
    window.location.href = '/';
  }, []);

  const allPlayers = [
    { name: playerName, index: playerIndex, score: gs.myHand.length + gs.myStash.length },
    ...gs.opponents.map(o => ({ name: o.name, index: o.index, score: o.cardCount + o.stashCount })),
  ].filter(p => p.index >= 0);

  useEffect(() => {
    const pendingFavor = gs.actionStack.find(a => a.type === 'RESOLVE_FAVOR');
    if (pendingFavor && pendingFavor.playerIndex === playerIndex) {
      const cards = gs.myHand.map(c => ({ id: c.id, type: c.type, name: c.name }));
      if (cards.length > 0) setShowFavor(cards);
    }
  }, [gs.actionStack, gs.myHand, playerIndex]);

  useEffect(() => {
    const pendingDefuse = gs.actionStack.find(a => a.type === 'RESOLVE_DEFUSE');
    if (pendingDefuse && pendingDefuse.playerIndex === playerIndex) {
      setShowDefuse({ deckSize: gs.deckSize, hasZombie: gs.myHand.some(c => c.type === 'zombie_kitten') });
    } else if (!pendingDefuse) {
      setShowDefuse(null);
    }
  }, [gs.actionStack, gs.myHand, playerIndex, gs.deckSize]);

  useEffect(() => {
    const pendingZombie = gs.actionStack.find(a => a.type === 'RESOLVE_ZOMBIE_REVIVE');
    if (pendingZombie && pendingZombie.playerIndex === playerIndex) {
      const deadPlayers = gs.opponents.filter(o => o.dead).map(o => ({ index: o.index, name: o.name }));
      if (deadPlayers.length > 0) setShowZombieRevive({ deadPlayers });
    } else if (!pendingZombie) {
      setShowZombieRevive(null);
    }
  }, [gs.actionStack, gs.opponents, playerIndex]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ padding: '6px 12px', textAlign: 'center', background: 'rgba(26,26,46,0.85)', fontSize: 12, color: '#999' }}>
        {gs.turn.phase === 'game_over'
          ? <span style={{ color: '#e94560' }}>Game Over</span>
          : (isMyTurn ? <b style={{ color: '#e94560' }}>Your turn</b> : `${gs.opponents.find(o => o.index === gs.turn.currentPlayerIndex)?.name || `Player ${gs.turn.currentPlayerIndex + 1}`}'s turn`)
        }
        {gs.settings.expansions && gs.settings.expansions.length > 0 && (
          <span style={{ marginLeft: 8, fontSize: 10, color: '#666' }}>
            [{gs.settings.expansions.join(', ')}]
          </span>
        )}
      </div>

      {/* Opponents */}
      <OpponentBar opponents={gs.opponents} currentPlayerIndex={gs.turn.currentPlayerIndex} />

      {/* Play area (center) */}
      <PlayArea
        deckSize={gs.deckSize}
        discardCount={gs.discardCount}
        turnInfo={`${gs.turn.phase}${gs.turn.attackCount > 0 ? ` · Attacks: ${gs.turn.attackCount}` : ''}`}
        implodingKittenFaceUp={gs.implodingKittenFaceUp}
        nopeWindow={gs.nopeWindow}
        lastNotification={lastNotification}
      />

      {/* Chat messages floating above action bar */}
      <div style={{
        position: 'absolute', bottom: 180, left: 0, right: 0,
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'center',
        gap: 2, pointerEvents: 'none', zIndex: 100,
      }}>
        {chatMsgs.slice(-4).map((m, i) => {
          const isMe = m.playerId === playerId;
          const msgs = chatMsgs.slice(-4);
          const isNewest = i === msgs.length - 1;
          return (
            <div key={m.id} style={{
              padding: '3px 12px', borderRadius: 6, fontSize: 11,
              background: isMe ? 'rgba(15,52,96,0.85)' : 'rgba(26,26,46,0.85)',
              color: '#ddd', maxWidth: '80%', textAlign: 'center',
              animation: isNewest ? 'chatFadeIn 0.3s ease' : 'none',
            }}>
              <span style={{ color: '#e94560', fontWeight: 600, marginRight: 4 }}>
                {isMe ? 'You' : m.playerName}:
              </span>{m.text}
            </div>
          );
        })}
      </div>

      {/* Action bar */}
      <ActionBar
        isMyTurn={isMyTurn}
        turnPhase={turnPhase}
        hasSelection={hasSelection}
        nopeWindow={gs.nopeWindow !== null}
        canPlay={canPlay}
        deadPlayer={isDead}
        onDrawCard={handleDrawCard}
        onEndTurn={handleEndTurn}
        onNope={handleNope}
        onPlaySelected={handlePlayCard}
      />

      {/* Player's hand */}
      <div style={{ background: 'rgba(22,33,62,0.4)', borderRadius: '8px 8px 0 0', margin: '0 4px' }}>
        <Hand
          cards={gs.myHand}
          selectedCardId={selectedCardId}
          onSelectCard={handleSelectCard}
          disabled={!isMyTurn || turnPhase !== 'playing'}
        />
      </div>

      {gs.myStash.length > 0 && (
        <div style={{ padding: '4px 12px', fontSize: 10, color: '#888', textAlign: 'center' }}>
          👑 Stash: {gs.myStash.length} cards
        </div>
      )}

      {showGameOver && (
        <GameOverOverlay
          winner={gs.winner}
          players={allPlayers}
          onRematch={handleRematch}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {showFavor && (
        <FavorModal cardIds={showFavor} onChooseCard={handleFavorChoose} />
      )}

      {showDefuse && (
        <DefuseModal
          deckSize={showDefuse.deckSize}
          hasZombieOption={showDefuse.hasZombie}
          onInsertAt={handleDefuseInsert}
        />
      )}

      {showZombieRevive && (
        <ZombieReviveModal
          deadPlayers={showZombieRevive.deadPlayers}
          onRevive={handleZombieRevive}
        />
      )}

      {showFuture && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 800,
        }} onClick={() => setShowFuture(null)}>
          <div style={{ background: '#16213e', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <h3 style={{ color: '#fbbf24', margin: '0 0 8px', fontSize: 14 }}>🔮 Top Cards</h3>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {showFuture.cards.map((c, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 6,
                  background: '#0f3460', fontSize: 11, color: '#ccc',
                }}>{c.type.replace(/_/g, ' ')}</div>
              ))}
            </div>
            <button onClick={() => setShowFuture(null)} style={{
              marginTop: 10, padding: '6px 20px', background: '#e94560',
              color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12,
            }}>OK</button>
          </div>
        </div>
      )}

      <style>{`@keyframes chatFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
