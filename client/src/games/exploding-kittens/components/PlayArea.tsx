import { useState, useEffect } from 'react';
import { CardBack } from '../../../components/CardBack.js';

interface PlayAreaProps {
  deckSize: number;
  discardCount: number;
  turnInfo: string;
  implodingKittenFaceUp: boolean;
  nopeWindow: { expiresAt: number; chain: { playerIndex: number }[] } | null;
  lastNotification?: string | null;
  nsfw?: boolean;
}

export function PlayArea({ deckSize, discardCount, turnInfo, implodingKittenFaceUp, nopeWindow, lastNotification, nsfw }: PlayAreaProps) {
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

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8, minHeight: 0, padding: '4px 0',
      position: 'relative',
    }}>
      {/* Turn info */}
      <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        {turnInfo}
      </div>

      {/* Center area: deck + discard */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {/* Draw pile with card back art */}
        <div style={{
          position: 'relative', borderRadius: 6, overflow: 'hidden',
          border: implodingKittenFaceUp ? '2px solid #ff4444' : '2px solid transparent',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <CardBack nsfw={nsfw} size="medium" />
          {/* Deck count badge */}
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            background: implodingKittenFaceUp ? '#ff4444' : '#e94560',
            color: '#fff', borderRadius: 8, minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, padding: '0 4px',
          }}>
            {deckSize}
          </div>
          {implodingKittenFaceUp && (
            <div style={{ position: 'absolute', top: -6, right: -6, fontSize: 14, animation: 'pulse 1s infinite' }}>🌀</div>
          )}
        </div>

        <div style={{ fontSize: 18, color: '#555' }}>→</div>

        <div style={{
          width: 60, height: 84, borderRadius: 6,
          background: 'rgba(255,255,255,0.05)', border: '2px solid #333',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{ fontSize: 20, color: '#555' }}>🗑️</div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{discardCount}</div>
        </div>
      </div>

      {/* Nope window indicator with countdown */}
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

      {/* Last action notification */}
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
