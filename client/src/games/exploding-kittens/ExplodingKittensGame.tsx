import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand } from './components/Hand.js';
import { Card } from './components/Card.js';
import { CardBack } from '../../components/CardBack.js';
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
  deckSize: number; discardCount: number; discardPileCards?: { id: string; type: string; name: string }[];
  turn: { currentPlayerIndex: number; direction: number; phase: string; attackCount: number };
  actionStack: { type: string; playerIndex: number; status: string; payload?: any }[];
  nopeWindow: { expiresAt: number; chain: { playerIndex: number }[] } | null;
  settings: { playerCount: number; expansions?: string[] };
  winner: number | null;
  implodingKittenFaceUp: boolean;
  pendingCardView: { cards: { id: string; type: string }[]; viewType?: 'see' | 'alter' | 'share' } | null;
  lastStolenCard: { type: string; name: string; fromPlayerIndex: number; toPlayerIndex: number } | null;
  lastPlayedCard: { type: string; name: string; playerIndex: number } | null;
  lastDrawFromBottom?: boolean;
}

interface EKGameProps {
  playerCount?: number; playerIndex?: number; playerName?: string; sessionId?: string;
  players?: { name: string; index: number; id?: string }[]; playerId?: string;
  gameStatePush?: any;
  nsfw?: boolean;
}



const EMPTY_STATE: ClientGameState = {
  myHand: [], myStash: [], opponents: [], deckSize: 0, discardCount: 0,
  turn: { currentPlayerIndex: 0, direction: 1, phase: 'playing', attackCount: 0 },
  actionStack: [], nopeWindow: null,
  settings: { playerCount: 2 }, winner: null, implodingKittenFaceUp: false, pendingCardView: null, lastStolenCard: null, lastPlayedCard: null,
};

export default function ExplodingKittensGame({
  playerCount = 2, playerIndex = 0, sessionId, players, playerName = 'You', playerId = '',
  gameStatePush, nsfw = false,
}: EKGameProps) {
  const [gs, setGs] = useState<ClientGameState>(EMPTY_STATE);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [showFavor, setShowFavor] = useState<ClientCardRef[] | null>(null);
  const [showDefuse, setShowDefuse] = useState<{ deckSize: number; hasZombie: boolean } | null>(null);
  const [showZombieRevive, setShowZombieRevive] = useState<{ deadPlayers: { index: number; name: string }[] } | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showFuture, setShowFuture] = useState<{ cards: { id: string; type: string }[]; viewType?: 'see' | 'alter' | 'share' } | null>(null);
  const [showDiscardPicker, setShowDiscardPicker] = useState<{ cards: ClientCardRef[] } | null>(null);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [comboPileCards, setComboPileCards] = useState<{ id: string; type: string; name: string }[]>([]);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [throwAnim, setThrowAnim] = useState<{ cardId: string; fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const [flyingCard, setFlyingCard] = useState<{ type: string; name: string; fromX: number; fromY: number } | null>(null);
  const [drawCard, setDrawCard] = useState<{ fromX: number; fromY: number } | null>(null);
  const [showShuffle, setShowShuffle] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showAttackOverlay, setShowAttackOverlay] = useState(false);
  const [showNopeOverlay, setShowNopeOverlay] = useState(false);
  const nopeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nopeStartRef = useRef<number>(0);
  const lastHandSize = useRef(0);
  const [reorderedFuture, setReorderedFuture] = useState<{ id: string; type: string }[] | null>(null);

  const TARGETED_CARD_TYPES = ['favor', 'targeted_attack', 'barking_kitten', 'mark', 'curse_cat_butt'];

  const [pendingTargetCard, setPendingTargetCard] = useState<{
    cardId: string; cardType: string; cardName: string;
  } | null>(null);

  const [pendingCombo, setPendingCombo] = useState<{
    comboType: 'pair' | 'triple'; payload: any;
  } | null>(null);

  const playerNames = useMemo(() => {
    const map: Record<number, string> = {};
    if (players) for (const p of players) map[p.index] = p.name;
    return map;
  }, [players]);

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

      // Stolen card notification
      if (next.lastStolenCard && next.lastStolenCard.toPlayerIndex === playerIndex) {
        const targetName = playerNames[next.lastStolenCard!.fromPlayerIndex]
          || next.opponents.find(o => o.index === next.lastStolenCard!.fromPlayerIndex)?.name || `Player ${next.lastStolenCard.fromPlayerIndex + 1}`;
        setLastNotification(`Stole ${next.lastStolenCard.name} from ${targetName}`);
        setTimeout(() => setLastNotification(null), 3000);
      } else if (next.lastStolenCard && next.lastStolenCard.fromPlayerIndex === playerIndex) {
        const attackerName = playerNames[next.lastStolenCard!.toPlayerIndex]
          || next.opponents.find(o => o.index === next.lastStolenCard!.toPlayerIndex)?.name || `Player ${next.lastStolenCard.toPlayerIndex + 1}`;
        setLastNotification(`${attackerName} stole your ${next.lastStolenCard.name}`);
        setTimeout(() => setLastNotification(null), 3000);
      }

      // Detect attack on me — pending turns increased
      const prevMe = gs.opponents.find(o => o.index === playerIndex);
      const nextMe = next.opponents.find(o => o.index === playerIndex);
      if (prevMe && nextMe && nextMe.pendingTurns > prevMe.pendingTurns) {
        setShowAttackOverlay(true);
        setTimeout(() => setShowAttackOverlay(false), 1500);
      }

      // Detect explosion in my hand
      if (next.myHand.length > gs.myHand.length) {
        const hasNew = next.myHand.some(c => !gs.myHand.some(pc => pc.id === c.id) && c.type === 'exploding_kitten');
        if (hasNew) {
          setShowExplosion(true);
          setTimeout(() => setShowExplosion(false), 2000);
        }
      }

      // Detect draw from bottom animation
      if (next.lastDrawFromBottom && next.myHand.length > gs.myHand.length) {
        setDrawCard({ fromX: window.innerWidth / 2, fromY: window.innerHeight * 0.15 });
        setTimeout(() => setDrawCard(null), 800);
      }

      // Detect nope targeting me
      if (next.nopeWindow && !gs.nopeWindow && next.lastPlayedCard?.type === 'nope' && next.lastPlayedCard.playerIndex !== playerIndex) {
        setShowNopeOverlay(true);
        setTimeout(() => setShowNopeOverlay(false), 1500);
      }
    }
  }, [gameStatePush]);

  // Nope window auto-timeout — each player gets full duration from when they see it
  useEffect(() => {
    if (nopeTimerRef.current) {
      clearTimeout(nopeTimerRef.current);
      nopeTimerRef.current = null;
    }
    if (gs.nopeWindow) {
      // Track when we first learned about this nope window
      if (nopeStartRef.current === 0) {
        nopeStartRef.current = Date.now();
      }
      const duration = (gs.settings as any).nopeWindowDuration ?? 5000;
      const elapsed = Date.now() - nopeStartRef.current;
      const remaining = Math.max(0, duration - elapsed) + 500;
      nopeTimerRef.current = setTimeout(() => {
        sendAction('RESOLVE_NOPE_TIMEOUT');
      }, remaining);
    } else {
      nopeStartRef.current = 0;
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
      setReorderedFuture(gs.pendingCardView.cards);
    } else if (!gs.pendingCardView) {
      setShowFuture(null);
      setReorderedFuture(null);
    }
  }, [gs.pendingCardView]);

  const isMyTurn = gs.turn.currentPlayerIndex === playerIndex;
  const turnPhase = gs.turn.phase;
  const hasSelection = selectedCardIds.length > 0;
  const selectedCard = selectedCardIds.length === 1 ? gs.myHand.find(c => c.id === selectedCardIds[0]) : undefined;
  const canPlay = hasSelection && selectedCardIds.length === 1 && selectedCard !== undefined
    && selectedCard.type !== 'defuse' && selectedCard.type !== 'exploding_kitten' && selectedCard.type !== 'imploding_kitten';
  const isDead = gs.opponents.find(o => o.index === playerIndex)?.dead ?? false;

  // Cat combo detection
  const CAT_TYPES = ['tacocat', 'cattermelon', 'hairy_potato_cat', 'beard_cat', 'feral_cat'];
  const comboInfo = useMemo(() => {
    if (comboPileCards.length < 2) return null;
    const types = [...new Set(comboPileCards.map(c => c.type))];
    const hasFeral = comboPileCards.some(c => c.type === 'feral_cat');
    if (types.length === 1 || (types.length === 2 && hasFeral)) {
      return comboPileCards.length >= 3
        ? { type: 'triple' as const, cardIds: comboPileCards.map(c => c.id) }
        : { type: 'pair' as const, cardIds: comboPileCards.map(c => c.id) };
    }
    if (types.length >= 5 || (types.length >= 4 && hasFeral)) {
      return { type: 'five' as const, cardIds: comboPileCards.map(c => c.id) };
    }
    return null;
  }, [comboPileCards]);

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
    setSelectedCardIds(prev => {
      // If the card is a cat type, toggle multi-select
      const card = gs.myHand.find(c => c.id === cardId);
      if (card && CAT_TYPES.includes(card.type)) {
        if (prev.includes(cardId)) return prev.filter(id => id !== cardId);
        return [...prev, cardId];
      }
      // Single select for non-cat cards
      return prev.length === 1 && prev[0] === cardId ? [] : [cardId];
    });
  }, [gs.myHand]);

  const handleDrawCard = useCallback(async (point?: { x: number; y: number }) => {
    setSelectedCardIds([]);
    if (point) {
      setDrawCard({ fromX: point.x, fromY: point.y });
      setTimeout(() => setDrawCard(null), 500);
    }
    await sendAction('DRAW_CARD');
  }, [sendAction]);

  const handleEndTurn = useCallback(async () => {
    setSelectedCardIds([]);
    await sendAction('END_TURN');
  }, [sendAction]);

  const handlePlayCard = useCallback(async (cardId?: string) => {
    const cid = cardId ?? (selectedCardIds.length === 1 ? selectedCardIds[0] : null);
    if (!cid) return;
    setSelectedCardIds([]);
    await sendAction('PLAY_CARD', { cardId: cid });
  }, [selectedCardIds, sendAction]);

  const handleTargetedPlay = useCallback(async (targetIndex: number) => {
    if (!pendingTargetCard) return;
    const cid = pendingTargetCard.cardId;
    setPendingTargetCard(null);
    setSelectedCardIds([]);
    await sendAction('PLAY_CARD', { cardId: cid, targetIndex });
  }, [pendingTargetCard, sendAction]);

  const handlePlayCombo = useCallback(async (comboType: 'pair' | 'triple' | 'five') => {
    if (!comboInfo) return;
    const payload: any = { cardIds: comboInfo.cardIds, comboType };
    if (comboType === 'pair' || comboType === 'triple') {
      setPendingCombo({ comboType, payload });
      return;
    }
    if (comboType === 'five') {
      if (gs.discardPileCards && gs.discardPileCards.length > 0) {
        setShowDiscardPicker({ cards: gs.discardPileCards });
        return;
      }
    }
    setComboPileCards([]);
    setSelectedCardIds([]);
    await sendAction('PLAY_COMBO', payload);
  }, [comboInfo, sendAction, gs.discardPileCards]);

  const handleComboTargetedPlay = useCallback(async (targetIndex: number) => {
    if (!pendingCombo) return;
    const { comboType, payload } = pendingCombo;
    setPendingCombo(null);
    setComboPileCards([]);
    setSelectedCardIds([]);

    if (comboType === 'triple') {
      setShowFuture({ cards: [{ id: 'prompt', type: 'tap to name' }] });
      alert('Three of a Kind: Tap the card you want to name from your hand selection');
      return;
    }

    payload.targetIndex = targetIndex;
    await sendAction('PLAY_COMBO', payload);
  }, [pendingCombo, sendAction]);

  // Handle discard pile selection for Five Different Cards
  const handleDiscardPick = useCallback(async (cardId: string) => {
    setShowDiscardPicker(null);
    setComboPileCards([]);
    setSelectedCardIds([]);
    await sendAction('PLAY_COMBO', { ...comboInfo, comboType: 'five', chosenCardId: cardId });
  }, [comboInfo, sendAction]);

  const handleNope = useCallback(async () => {
    setShowNopeOverlay(true);
    setTimeout(() => setShowNopeOverlay(false), 1200);
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
      setSelectedCardIds([]);
      fetchState();
    }
  }, [sessionId, fetchState]);

  const handleBackToLobby = useCallback(() => {
    window.location.href = '/';
  }, []);

  const allPlayers = [
    { name: playerName, index: playerIndex, score: gs.myHand.length + gs.myStash.length },
    ...gs.opponents.map(o => ({ name: playerNames[o.index] || o.name, index: o.index, score: o.cardCount + o.stashCount })),
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
          : (isMyTurn
              ? <span><b style={{ color: '#e94560' }}>Your turn</b>{gs.turn.attackCount > 0 ? ` · Attack x${gs.turn.attackCount}` : ''}</span>
              : `${playerNames[gs.turn.currentPlayerIndex] || gs.opponents.find(o => o.index === gs.turn.currentPlayerIndex)?.name || `Player ${gs.turn.currentPlayerIndex + 1}`}'s turn`
          )
        }
        {gs.settings.expansions && gs.settings.expansions.length > 0 && (
          <span style={{ marginLeft: 8, fontSize: 10, color: '#666' }}>
            [{gs.settings.expansions.join(', ')}]
          </span>
        )}
      </div>

      {/* Opponents */}
      <OpponentBar opponents={gs.opponents} currentPlayerIndex={gs.turn.currentPlayerIndex} playerNames={playerNames} />

      {/* Play area (center) */}
      <div style={{ position: 'relative', zIndex: 1, overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Combo pile overlay */}
        {comboPileCards.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 10px', margin: '2px 0',
          }}>
            <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700, letterSpacing: 1 }}>
              🐱 COMBO PILE
            </div>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
              {comboPileCards.map(c => (
                <div key={c.id} style={{ position: 'relative' }}>
                  <Card card={c} size="small" nsfw={nsfw} />
                  <div style={{
                    position: 'absolute', top: -4, right: -4, width: 18, height: 18,
                    borderRadius: '50%', background: '#e94560', border: '2px solid #fff',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {comboPileCards.indexOf(c) + 1}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {comboInfo?.type === 'pair' && (
                <button onClick={() => handlePlayCombo('pair')}
                  style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: '#e94560', color: '#fff', fontSize: 11, fontWeight: 600,
                  }}>
                  Steal Random (Pair)
                </button>
              )}
              {comboInfo?.type === 'triple' && (
                <button onClick={() => handlePlayCombo('triple')}
                  style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: '#e94560', color: '#fff', fontSize: 11, fontWeight: 600,
                  }}>
                  Name Card (Triple)
                </button>
              )}
              {comboInfo?.type === 'five' && (
                <button onClick={() => handlePlayCombo('five')}
                  style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: '#e94560', color: '#fff', fontSize: 11, fontWeight: 600,
                  }}>
                  Search Discard (Five)
                </button>
              )}
              <button onClick={() => { setComboPileCards([]); setSelectedCardIds([]); }}
                style={{
                  padding: '4px 12px', borderRadius: 4, border: '1px solid #555', cursor: 'pointer',
                  background: 'transparent', color: '#aaa', fontSize: 11,
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      <PlayArea
        deckSize={gs.deckSize}
        discardCount={gs.discardCount}
        discardPileCards={gs.discardPileCards}
        lastPlayedCard={gs.lastPlayedCard}
        turnInfo={`${gs.turn.phase}${gs.turn.attackCount > 0 ? ` · Attacks: ${gs.turn.attackCount}` : ''}`}
        implodingKittenFaceUp={gs.implodingKittenFaceUp}
        nopeWindow={gs.nopeWindow}
        lastNotification={lastNotification}
        nsfw={nsfw}
        onDrawFromPile={isMyTurn ? (e?: any) => {
          const point = e ? { x: e.clientX, y: e.clientY } : undefined;
          handleDrawCard(point);
        } : undefined}
      />
      </div>

      {/* Chat messages floating in PlayArea */}
      <div style={{
        position: 'absolute', top: '8%', left: 0, right: 0,
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'center',
        gap: 2, pointerEvents: 'none', zIndex: 100, padding: '0 20px',
      }}>
        {chatMsgs.slice(-4).map((m, i) => {
          const isMe = m.playerId === playerId;
          const msgs = chatMsgs.slice(-4);
          const isNewest = i === msgs.length - 1;
          return (
            <div key={m.id} style={{
              padding: '4px 14px', borderRadius: 8, fontSize: 12,
              background: isMe ? 'rgba(15,52,96,0.9)' : 'rgba(26,26,46,0.9)',
              color: '#eee', maxWidth: '85%', textAlign: 'center',
              animation: isNewest ? 'chatFadeIn 0.3s ease' : 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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
        nopeWindow={gs.nopeWindow !== null}
        canNope={gs.nopeWindow !== null && gs.myHand.some(c => c.type === 'nope') && gs.actionStack.some(a => a.status === 'pending' && a.playerIndex !== playerIndex)}
        deadPlayer={isDead}
        hasNopeCard={gs.myHand.some(c => c.type === 'nope')}
        comboInfo={comboInfo}
        comboMode={comboPileCards.length > 0}
        onNope={handleNope}
        onPlayCombo={handlePlayCombo}
        onUndoCombo={() => { setComboPileCards([]); setSelectedCardIds([]); }}
      />

      {/* Player's hand */}
      <div style={{ position: 'relative', zIndex: 20, overflow: 'visible', background: 'rgba(22,33,62,0.4)', borderRadius: '8px 8px 0 0', margin: '0 4px' }}>
        <Hand
          cards={gs.myHand}
          selectedCardIds={[...new Set([...selectedCardIds, ...comboPileCards.map(c => c.id)])]}
          onSelectCard={handleSelectCard}
          onSwipePlay={(cardId, point) => {
            const card = gs.myHand.find(c => c.id === cardId);
            if (!card) return;
            if (card.type === 'defuse' || card.type === 'exploding_kitten' || card.type === 'imploding_kitten') return;
            if (TARGETED_CARD_TYPES.includes(card.type)) {
              setPendingTargetCard({ cardId: card.id, cardType: card.type, cardName: card.name });
              return;
            }
            // Trigger flying card animation
            const toX = window.innerWidth / 2;
            const toY = window.innerHeight * 0.38;
            setFlyingCard({ type: card.type, name: card.name, fromX: point?.x ?? window.innerWidth / 2, fromY: point?.y ?? window.innerHeight * 0.6 });
            setTimeout(() => setFlyingCard(null), 500);
            handlePlayCard(cardId);
          }}
          onSwipeCombo={(cardId, point) => {
            const card = gs.myHand.find(c => c.id === cardId);
            if (!card) return;
            setComboPileCards(prev => prev.some(c => c.id === cardId) ? prev : [...prev, { id: card.id, type: card.type, name: card.name }]);
            setFlyingCard({ type: card.type, name: card.name, fromX: point?.x ?? window.innerWidth / 2, fromY: point?.y ?? window.innerHeight * 0.6 });
            setTimeout(() => setFlyingCard(null), 500);
          }}
          disabled={false}
          comboMode={comboPileCards.length > 0}
          onComboToggle={(cardId) => {
            setComboPileCards(prev => prev.some(c => c.id === cardId) ? prev.filter(c => c.id !== cardId) : [...prev, { id: cardId, type: gs.myHand.find(c => c.id === cardId)?.type ?? '', name: gs.myHand.find(c => c.id === cardId)?.name ?? '' }]);
          }}
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

      {showDiscardPicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 900,
        }}>
          <div style={{ background: '#16213e', borderRadius: 12, padding: 20, maxWidth: 380, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ color: '#fbbf24', textAlign: 'center', margin: '0 0 12px', fontSize: 16 }}>
              🃏 Search Discard Pile
            </h3>
            <p style={{ color: '#aaa', textAlign: 'center', margin: '0 0 12px', fontSize: 12 }}>
              Select a card to take from the discard pile
            </p>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              {showDiscardPicker.cards.map((c, i) => (
                <div key={c.id || i} onClick={() => handleDiscardPick(c.id)}
                  style={{
                    padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                    background: '#0f3460', border: '1px solid #444', color: '#ccc', fontSize: 11,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e94560')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0f3460')}
                >{c.name}</div>
              ))}
            </div>
            <button onClick={() => { setShowDiscardPicker(null); setSelectedCardIds([]); }}
              style={{ display: 'block', margin: '12px auto 0', padding: '6px 20px',
                background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {pendingTargetCard && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 900,
        }}>
          <div style={{ background: '#16213e', borderRadius: 12, padding: 20, maxWidth: 320, width: '90%' }}>
            <h3 style={{ color: '#fbbf24', textAlign: 'center', margin: '0 0 8px', fontSize: 15 }}>
              Choose a target
            </h3>
            <p style={{ color: '#aaa', textAlign: 'center', margin: '0 0 12px', fontSize: 11 }}>
              Who to use {pendingTargetCard.cardType === 'favor' ? 'Favor on' : pendingTargetCard.cardType === 'targeted_attack' ? 'Attack' : pendingTargetCard.cardType === 'barking_kitten' ? 'swap with' : 'target'}?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {gs.opponents.filter(o => o.alive).map(opp => (
                <button key={opp.index} onClick={() => handleTargetedPlay(opp.index)}
                  style={{
                    padding: '10px', borderRadius: 6, border: '1px solid #444',
                    background: '#0f3460', color: '#eee', cursor: 'pointer', fontSize: 13,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e94560')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0f3460')}
                >
                  {playerNames[opp.index] || opp.name} ({opp.cardCount} {opp.cardCount === 1 ? 'card' : 'cards'})
                </button>
              ))}
            </div>
            <button onClick={() => setPendingTargetCard(null)}
              style={{ display: 'block', margin: '10px auto 0', padding: '6px 20px',
                background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {pendingCombo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 900,
        }}>
          <div style={{ background: '#16213e', borderRadius: 12, padding: 20, maxWidth: 320, width: '90%' }}>
            <h3 style={{ color: '#fbbf24', textAlign: 'center', margin: '0 0 8px', fontSize: 15 }}>
              Choose a target
            </h3>
            <p style={{ color: '#aaa', textAlign: 'center', margin: '0 0 12px', fontSize: 11 }}>
              Who to use this cat combo on?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {gs.opponents.filter(o => o.alive).map(opp => (
                <button key={opp.index} onClick={() => handleComboTargetedPlay(opp.index)}
                  style={{
                    padding: '10px', borderRadius: 6, border: '1px solid #444',
                    background: '#0f3460', color: '#eee', cursor: 'pointer', fontSize: 13,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e94560')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0f3460')}
                >
                  {playerNames[opp.index] || opp.name} ({opp.cardCount} {opp.cardCount === 1 ? 'card' : 'cards'})
                </button>
              ))}
            </div>
            <button onClick={() => setPendingCombo(null)}
              style={{ display: 'block', margin: '10px auto 0', padding: '6px 20px',
                background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showFuture && reorderedFuture && (() => {
        const isAlter = showFuture.viewType === 'alter';
        const cardCount = showFuture.cards.length;
        const centerX = window.innerWidth / 2;
        const deckY = window.innerHeight * 0.3;
        const fanSpread = Math.min(cardCount * 80, window.innerWidth * 0.65);

        const sorted = reorderedFuture.map((c, i) => {
          const center = (cardCount - 1) / 2;
          const offset = ((i - center) / Math.max(center, 1));
          return {
            ...c,
            targetX: centerX + offset * fanSpread / 2,
            targetY: deckY - 80 - Math.abs(offset) * 20,
            rotate: offset * 10,
            zIndex: cardCount - Math.abs(i - Math.floor(cardCount / 2)),
            entryDelay: showFuture.cards.findIndex(sc => sc.id === c.id) * 0.15,
          };
        });

        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 800,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <h3 style={{
              color: '#fbbf24', fontSize: 16, fontWeight: 700, margin: '0 0 2px',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 10,
            }}>
              {isAlter ? '🔄 Rearrange the Future' : '🔮 Top Cards'}
            </h3>
            <p style={{ color: '#aaa', fontSize: 11, margin: '0 0 12px', zIndex: 10 }}>
              {isAlter ? 'Drag cards left/right to reorder, then confirm' : `${cardCount} cards on top`}
            </p>
            <div style={{
              position: 'relative', width: fanSpread + 80, height: 200, zIndex: 5,
            }}>
              {sorted.map((c, i) => {
                const offset = ((i - (cardCount - 1) / 2) / Math.max((cardCount - 1) / 2, 1));
                const startX = centerX - 52 + offset * 30;
                const startY = deckY + Math.abs(offset) * 15;
                return (
                  <motion.div
                    key={c.id}
                    layout={isAlter}
                    initial={{ x: startX, y: startY, scale: 0.2, rotate: offset * 25, opacity: 0 }}
                    animate={{ x: c.targetX - 52, y: c.targetY, scale: 1, rotate: c.rotate, opacity: 1 }}
                    transition={{
                      delay: c.entryDelay,
                      type: 'spring', stiffness: 150, damping: 18, mass: 1,
                    }}
                    drag={isAlter ? 'x' : false}
                    dragConstraints={isAlter ? { left: -fanSpread, right: fanSpread } : undefined}
                    dragElastic={0.05}
                    onDragEnd={isAlter ? (_, info) => {
                      const dx = info.offset.x;
                      const slotW = fanSpread / Math.max(cardCount, 2);
                      const moves = Math.round(dx / slotW);
                      const newIdx = Math.max(0, Math.min(cardCount - 1, i + moves));
                      if (newIdx !== i) {
                        setReorderedFuture(prev => {
                          if (!prev) return prev;
                          const next = [...prev];
                          const [moved] = next.splice(i, 1);
                          next.splice(newIdx, 0, moved);
                          return next;
                        });
                      }
                    } : undefined}
                    whileHover={isAlter ? { scale: 1.1, zIndex: 20 } : undefined}
                    whileTap={isAlter ? { scale: 1.15, zIndex: 20 } : undefined}
                    style={{
                      position: 'absolute', left: 0, top: 0, zIndex: c.zIndex,
                      cursor: isAlter ? 'grab' : 'default',
                    }}
                  >
                    <Card
                      card={{ id: c.id, type: c.type, name: c.type.replace(/_/g, ' ') }}
                      size="small"
                      nsfw={nsfw}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, zIndex: 10 }}>
              {isAlter ? (
                <>
                  <button onClick={() => {
                    sendAction('RESOLVE_ALTER_FUTURE', { reorderedCards: reorderedFuture.map(c => c.id) });
                    setShowFuture(null);
                    setReorderedFuture(null);
                  }} style={{
                    padding: '8px 24px', background: '#4ade80', color: '#000',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>
                    ✓ Confirm Order
                  </button>
                  <button onClick={() => { setShowFuture(null); setReorderedFuture(null); }} style={{
                    padding: '8px 24px', background: '#555', color: '#fff',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                  }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowFuture(null); setReorderedFuture(null); }} style={{
                  padding: '8px 24px', background: '#e94560', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                  OK
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes chatFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Flying card animation: hand → discard pile */}
      <AnimatePresence>
        {flyingCard && (
          <motion.div
            key="flying"
            initial={{ x: flyingCard.fromX - 37, y: flyingCard.fromY - 56, scale: 1, rotate: 0, opacity: 1 }}
            animate={{ x: window.innerWidth / 2 - 37, y: window.innerHeight * 0.35 - 56, scale: 0.5, rotate: 360, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            onAnimationComplete={() => setFlyingCard(null)}
            style={{ position: 'fixed', left: 0, top: 0, width: 75, height: 112, zIndex: 999, pointerEvents: 'none' }}
          >
            <Card card={{ id: 'flying', type: flyingCard.type, name: flyingCard.name }} size="small" nsfw={nsfw} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draw card animation: deck → hand */}
      <AnimatePresence>
        {drawCard && (
          <motion.div
            key="drawing"
            initial={{ x: drawCard.fromX - 37, y: drawCard.fromY - 56, scale: 1, rotate: 0 }}
            animate={{ x: window.innerWidth / 2 - 37, y: window.innerHeight * 0.8 - 56, scale: 0.7, rotate: 720 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onAnimationComplete={() => setDrawCard(null)}
            style={{ position: 'fixed', left: 0, top: 0, width: 75, height: 112, zIndex: 999, pointerEvents: 'none' }}
          >
            <CardBack nsfw={nsfw} size="medium" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosion overlay */}
      <AnimatePresence>
        {showExplosion && (
          <motion.div
            key="explosion"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            onAnimationComplete={() => setShowExplosion(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 998, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(255,68,0,0.6) 0%, rgba(255,200,0,0.3) 40%, transparent 70%)',
            }}
          >
            <div style={{
              fontSize: 72, fontWeight: 900, color: '#ff4400',
              textShadow: '0 0 40px #ff8800, 0 0 80px #ff4400',
              fontFamily: 'Impact, sans-serif',
            }}>
              💥 BOOM!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attack overlay */}
      <AnimatePresence>
        {showAttackOverlay && (
          <motion.div
            key="attack"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onAnimationComplete={() => setShowAttackOverlay(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 998, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(200,0,0,0.25)',
            }}
          >
            <div style={{
              fontSize: 64, fontWeight: 900, color: '#ff0000',
              textShadow: '0 0 30px #ff4400, 0 0 60px #ff0000',
              fontFamily: 'Impact, sans-serif',
              transform: 'rotate(-10deg)',
            }}>
              ⚔️ ATTACK!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nope overlay */}
      <AnimatePresence>
        {showNopeOverlay && (
          <motion.div
            key="nope"
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onAnimationComplete={() => setShowNopeOverlay(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 998, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              fontSize: 80, fontWeight: 900, color: '#ff2222',
              textShadow: '0 0 40px #ff0000, 0 0 80px #ff4444, 4px 4px 0 #880000',
              fontFamily: 'Impact, sans-serif',
              transform: 'rotate(-5deg)',
              background: 'rgba(0,0,0,0.5)', padding: '16px 40px', borderRadius: 16,
              border: '4px solid #ff2222',
            }}>
              🚫 NOPE!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
