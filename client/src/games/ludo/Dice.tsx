import { useRef, useCallback } from 'react';
import { DiceOverlay } from '../../components/DiceOverlay.js';
import type { DiceOverlayHandle } from '../../components/DiceOverlay.js';

interface DiceProps {
  onRollResult: (value: number) => void;
  enabled: boolean;
  playerIndex: number;
}

export function Dice({ onRollResult, enabled }: DiceProps) {
  const diceRef = useRef<DiceOverlayHandle>(null);

  const handleRoll = useCallback(async () => {
    if (!diceRef.current) return;
    const [value] = await diceRef.current.roll('d6', 1);
    onRollResult(value);
  }, [onRollResult]);

  return (
    <>
      <DiceOverlay ref={diceRef} />
      <button
        onClick={handleRoll}
        disabled={!enabled}
        style={{
          padding: '12px 24px',
          fontSize: 18,
          fontWeight: 700,
          borderRadius: 8,
          border: 'none',
          background: enabled ? '#e94560' : '#555',
          color: '#fff',
          cursor: enabled ? 'pointer' : 'default',
          opacity: enabled ? 1 : 0.5,
          transition: 'opacity 0.2s',
        }}
      >
        🎲 Roll
      </button>
    </>
  );
}
