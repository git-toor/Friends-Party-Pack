import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardBack } from '../../../components/CardBack.js';
import { Card } from './Card.js';

interface PlayAreaProps {
  deckSize: number;
  discardCount: number;
  discardPileCards?: { id: string; type: string; name: string }[];
  lastPlayedCard?: { type: string; name: string; playerIndex: number } | null;
  turnInfo: string;
  implodingKittenFaceUp: boolean;
  nopeWindow: { expiresAt: number; chain: { playerIndex: number }[] } | null;
  lastNotification?: string | null;
  nsfw?: boolean;
  onDrawFromPile?: () => void;
}

const DISCARD_SPREAD_COUNT = 5;
const discardLayouts = new Map<string, { rotate: number; x: number; y: number }>();

function getDiscardLayout(cardId: string) {
  if (!discardLayouts.has(cardId)) {
    discardLayouts.set(cardId, {
      rotate: (Math.random() - 0.5) * 16,
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 6,
    });
  }
  return discardLayouts.get(cardId)!;
}

export function PlayArea({ deckSize, discardCount, discardPileCards, lastPlayedCard, turnInfo, implodingKittenFaceUp, nopeWindow, lastNotification, nsfw, onDrawFromPile }: PlayAreaProps) {
  const [nopeRemaining, setNopeRemaining] = useState<number>(0);
  const nopeLength = 3000;

  useEffect(() => {
    if (!nopeWindow) { setNopeRemaining(0); return; }
    const update = () => setNopeRemaining(Math.max(0, nopeWindow.expiresAt - Date.now()));
    update();
    const id = setInterval(update, 50);
    return () => clearInterval(id);
  }, [nopeWindow?.expiresAt, nopeWindow?.chain.length]);

  const nopePct = nopeRemaining / nopeLength;

  const visibleDiscard = useMemo(() => {
    if (!discardPileCards || discardPileCards.length === 0) return [];
    return discardPileCards.slice(-DISCARD_SPREAD_COUNT);
  }, [discardPileCards]);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8, minHeight: 0, padding: '4px 0',
      position: 'relative',
    }}>
      <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        {turnInfo}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{
          position: 'relative', borderRadius: 6,
          border: implodingKittenFaceUp ? '2px solid #ff4444' : '2px solid transparent',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          cursor: onDrawFromPile ? 'pointer' : 'default',
        }} onClick={onDrawFromPile}>
          <CardBack nsfw={nsfw} size="medium" />
          <div style={{
            position: 'absolute', bottom: -12, right: -12,
            background: implodingKittenFaceUp ? '#ff4444' : '#e94560',
            color: '#fff', borderRadius: 8, minWidth: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, padding: '0 5px', zIndex: 5,
          }}>
            {deckSize}
          </div>
          {implodingKittenFaceUp && (
            <div style={{ position: 'absolute', top: -6, right: -6, fontSize: 14, animation: 'pulse 1s infinite' }}>🌀</div>
          )}
        </div>

        <div style={{ fontSize: 18, color: '#555' }}>→</div>

        {lastPlayedCard && (
          <>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card
              card={{ id: 'played', type: lastPlayedCard.type, name: lastPlayedCard.name }}
              size="small"
              nsfw={nsfw}
            />
          </motion.div>
          <div style={{ fontSize: 18, color: '#555' }}>→</div>
          </>
        )}

        <div style={{ position: 'relative', width: 105, height: 158 }}>
          {visibleDiscard.length === 0 ? (
            <div style={{
              width: 105, height: 158, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)', borderRadius: 6, border: '2px solid #333',
            }}>
              <div style={{ fontSize: 24, color: '#555' }}>🗑️</div>
            </div>
          ) : (
            <AnimatePresence>
              {visibleDiscard.map((c, i) => {
                const layout = getDiscardLayout(c.id);
                const isLatest = i === visibleDiscard.length - 1;
                const spreadFactor = 4;
                return (
                  <motion.div
                    key={c.id}
                    initial={isLatest ? { scale: 0.3, opacity: 0, rotate: layout.rotate + 20 } : false}
                    animate={{ scale: 1, opacity: 1, rotate: layout.rotate, x: layout.x * spreadFactor, y: layout.y * spreadFactor }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
                    style={{ position: 'absolute', left: 0, top: 0, zIndex: i }}
                  >
                    <Card card={c} size="medium" nsfw={nsfw} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div style={{
            position: 'absolute', bottom: -8, right: -8,
            background: '#333', color: '#fff', borderRadius: 8,
            minWidth: 18, height: 18, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 700, padding: '0 4px',
            zIndex: 10,
          }}>{discardCount}</div>
        </div>
      </div>

      {nopeWindow && (
        <div style={{
          width: '80%', maxWidth: 280,
          padding: '6px 16px', borderRadius: 6, background: 'rgba(255,68,68,0.12)',
          border: '1px solid #ff4444', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#ff8888', marginBottom: 4 }}>
            🚫 Nope window! ({nopeWindow.chain.length} Nopes played)
          </div>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <div style={{
              width: `${nopePct * 100}%`, height: '100%',
              background: nopePct > 0.3 ? '#ff4444' : '#ff8800',
              borderRadius: 2, transition: 'width 0.05s linear',
            }} />
          </div>
        </div>
      )}

      {lastNotification && (
        <div style={{
          padding: '4px 14px', borderRadius: 6,
          background: 'rgba(255,255,255,0.06)', fontSize: 11, color: '#aaa',
          animation: 'fadeInOut 2s ease',
        }}>
          {lastNotification}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.2)} }
        @keyframes fadeInOut { 0%{opacity:0;transform:translateY(4px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
      `}</style>
    </div>
  );
}
