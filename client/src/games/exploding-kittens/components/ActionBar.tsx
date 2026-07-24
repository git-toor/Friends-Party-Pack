import { Button } from '../../../components/Button.js';

interface ActionBarProps {
  isMyTurn: boolean;
  nopeWindow: boolean;
  canNope: boolean;
  deadPlayer: boolean;
  hasNopeCard: boolean;
  comboInfo: { type: 'pair' | 'triple' | 'five'; cardIds: string[] } | null;
  comboMode: boolean;
  onNope: () => void;
  onPlayCombo: (comboType: 'pair' | 'triple' | 'five') => void;
  onUndoCombo: () => void;
}

export function ActionBar({
  isMyTurn, nopeWindow, canNope, deadPlayer, hasNopeCard, comboInfo, comboMode,
  onNope, onPlayCombo, onUndoCombo,
}: ActionBarProps) {
  if (deadPlayer) {
    return (
      <div style={{ padding: '8px 12px', textAlign: 'center' }}>
        <span style={{ color: '#ff4444', fontSize: 13 }}>💀 You are dead. Watching…</span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '8px 12px', display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
    }}>
      {nopeWindow && (
        <>
          {canNope && (
            <Button variant="primary" size="lg" onClick={onNope} style={{ animation: 'nopePulse 0.8s infinite' }}>
              🚫 Nope!
            </Button>
          )}
          {!canNope && hasNopeCard && (
            <div style={{ padding: '8px 12px', textAlign: 'center', color: '#888', fontSize: 12 }}>
              Waiting for Nope…
            </div>
          )}
          {!hasNopeCard && (
            <div style={{ padding: '8px 12px', textAlign: 'center', color: '#ff8888', fontSize: 12 }}>
              Nope window active… (you have no Nope card)
            </div>
          )}
        </>
      )}
      {!nopeWindow && isMyTurn && (
        <>
          {comboMode && (
            <Button variant="secondary" size="sm" onClick={onUndoCombo}>
              ↩ Undo Combo
            </Button>
          )}
          {comboInfo?.type === 'pair' && !comboMode && (
            <Button size="lg" onClick={() => onPlayCombo('pair')}>
              🐱 Steal Random (Pair)
            </Button>
          )}
          {comboInfo?.type === 'triple' && !comboMode && (
            <Button size="lg" onClick={() => onPlayCombo('triple')}>
              🐱🐱 Name Card (Triple)
            </Button>
          )}
          {comboInfo?.type === 'five' && !comboMode && (
            <Button size="lg" onClick={() => onPlayCombo('five')}>
              🐱🐱🐱 Search Discard (Five)
            </Button>
          )}
        </>
      )}
      {!isMyTurn && !nopeWindow && (
        <div style={{ padding: '8px 12px', textAlign: 'center' }}>
          <span style={{ color: '#999', fontSize: 13 }}>Waiting for other players…</span>
        </div>
      )}
      <style>{`@keyframes nopePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
    </div>
  );
}
