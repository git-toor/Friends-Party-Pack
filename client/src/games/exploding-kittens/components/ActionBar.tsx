import { Button } from '../../../components/Button.js';

interface ActionBarProps {
  isMyTurn: boolean;
  turnPhase: string;
  hasSelection: boolean;
  nopeWindow: boolean;
  canPlay: boolean;
  deadPlayer: boolean;
  hasNopeCard: boolean;
  comboInfo: { type: 'pair' | 'triple' | 'five'; cardIds: string[] } | null;
  onDrawCard: () => void;
  onEndTurn: () => void;
  onNope: () => void;
  onPlaySelected: () => void;
  onPlayCombo: (comboType: 'pair' | 'triple' | 'five') => void;
}

export function ActionBar({
  isMyTurn, turnPhase, hasSelection, nopeWindow, canPlay,
  deadPlayer, hasNopeCard, comboInfo,
  onDrawCard, onEndTurn, onNope, onPlaySelected, onPlayCombo,
}: ActionBarProps) {
  if (!isMyTurn && !nopeWindow) {
    return (
      <div style={{ padding: '8px 12px', textAlign: 'center' }}>
        <span style={{ color: '#999', fontSize: 13 }}>Waiting for other players…</span>
      </div>
    );
  }

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
      {nopeWindow && hasNopeCard && (
        <Button variant="primary" size="lg" onClick={onNope} style={{ animation: 'nopePulse 0.8s infinite' }}>
          🚫 Nope!
        </Button>
      )}
      {nopeWindow && !hasNopeCard && (
        <div style={{ padding: '8px 12px', textAlign: 'center', color: '#ff8888', fontSize: 12 }}>
          Nope window active… (you have no Nope card)
        </div>
      )}
      {isMyTurn && turnPhase === 'playing' && (
        <>
          {/* Cat combos */}
          {comboInfo?.type === 'pair' && (
            <Button size="lg" onClick={() => onPlayCombo('pair')}>
              🐱 Steal Random (Pair)
            </Button>
          )}
          {comboInfo?.type === 'triple' && (
            <Button size="lg" onClick={() => onPlayCombo('triple')}>
              🐱🐱 Name Card (Triple)
            </Button>
          )}
          {comboInfo?.type === 'five' && (
            <Button size="lg" onClick={() => onPlayCombo('five')}>
              🐱🐱🐱 Search Discard (Five)
            </Button>
          )}
          {/* Single card play */}
          {hasSelection && canPlay && (
            <Button size="lg" onClick={onPlaySelected}>
              ▶ Play Card
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={onDrawCard}>
            🎴 Draw Card
          </Button>
          <Button variant="secondary" size="sm" onClick={onEndTurn}>
            End Turn
          </Button>
        </>
      )}
      {isMyTurn && turnPhase === 'drawing' && (
        <Button size="lg" onClick={onDrawCard}>
          🎴 Draw Card
        </Button>
      )}
      <style>{`@keyframes nopePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
    </div>
  );
}
