interface PlayAreaProps {
  deckSize: number;
  discardCount: number;
  turnInfo: string;
  implodingKittenFaceUp: boolean;
  nopeWindow: { expiresAt: number; chain: { playerIndex: number }[] } | null;
}

export function PlayArea({ deckSize, discardCount, turnInfo, implodingKittenFaceUp, nopeWindow }: PlayAreaProps) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, minHeight: 0, padding: '8px 0',
    }}>
      {/* Turn info */}
      <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
        {turnInfo}
      </div>

      {/* Center area: deck + discard */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {/* Draw pile */}
        <div style={{
          width: 60, height: 84, borderRadius: 6,
          background: 'linear-gradient(135deg, #1a1a3e, #2a2a5e)',
          border: implodingKittenFaceUp ? '2px solid #ff4444' : '2px solid #444488',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 20, color: '#666' }}>🎴</div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{deckSize}</div>
          {implodingKittenFaceUp && (
            <div style={{
              position: 'absolute', top: -6, right: -6, fontSize: 14,
              animation: 'pulse 1s infinite',
            }}>🌀</div>
          )}
        </div>

        {/* VS / Turn indicator */}
        <div style={{ fontSize: 18, color: '#555' }}>→</div>

        {/* Discard pile */}
        <div style={{
          width: 60, height: 84, borderRadius: 6,
          background: 'rgba(255,255,255,0.05)', border: '2px solid #333',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 20, color: '#555' }}>🗑️</div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{discardCount}</div>
        </div>
      </div>

      {/* Nope window indicator */}
      {nopeWindow && (
        <div style={{
          padding: '4px 16px', borderRadius: 6, background: 'rgba(255,68,68,0.15)',
          border: '1px solid #ff4444', fontSize: 11, color: '#ff8888',
        }}>
          🚫 Nope window open! ({nopeWindow.chain.length} Nopes played)
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.2)} }`}</style>
    </div>
  );
}
