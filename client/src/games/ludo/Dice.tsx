import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DiceOverlay } from '../../components/DiceOverlay.js';
import type { DiceOverlayHandle, PerDieConfig } from '../../components/DiceOverlay.js';
import { loadDiceAppearance } from '../../components/DiceAppearance.js';

const DEFAULT_CONFIG: PerDieConfig = {
  colorset: 'glitterparty_3',
  texture: 'metal',
  material: 'metal',
  textColor: '#ffffff',
};

interface DiceProps {
  onRollResult: (value: number) => void;
  enabled: boolean;
  playerIndex: number;
}

export interface LudoDiceHandle {
  roll: () => Promise<number>;
}

export const Dice = forwardRef<LudoDiceHandle, DiceProps>(({ onRollResult, enabled }, ref) => {
  const diceRef = useRef<DiceOverlayHandle>(null);

  // Load dice appearance from localStorage and configure
  useEffect(() => {
    const saved = loadDiceAppearance();
    // Use dice_0 config if saved, otherwise use defaults
    const config: Record<string, PerDieConfig> = {};
    config['dice_0'] = saved['dice_0'] || saved['dice_1'] || DEFAULT_CONFIG;
    // Configure the DiceOverlay once it's ready
    const t = setInterval(async () => {
      if (diceRef.current?.configure) {
        await diceRef.current.configure(config);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  useImperativeHandle(ref, () => ({
    roll: async () => {
      if (!diceRef.current) return 0;
      const [value] = await diceRef.current.roll('d6', 1);
      return value;
    },
  }));

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
});

Dice.displayName = 'Dice';
