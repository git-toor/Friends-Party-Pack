import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DiceOverlay } from '../../components/DiceOverlay.js';
import type { DiceOverlayHandle, PerDieConfig } from '../../components/DiceOverlay.js';
import { loadDiceAppearance } from '../../components/DiceAppearance.js';

const DEFAULT_CONFIG: PerDieConfig = {
  colorset: 'glitterparty_3',
  texture: 'metal',
  material: 'metal',
  textColor: '#ffffff',
};

export interface DiceHandle {
  roll: (value?: number) => Promise<void>;
  clear: () => void;
}

interface DiceProps {
  onRollComplete?: () => void;
}

export const Dice = forwardRef<DiceHandle, DiceProps>(({ onRollComplete }, ref) => {
  const diceRef = useRef<DiceOverlayHandle>(null);

  useEffect(() => {
    const saved = loadDiceAppearance();
    const config: Record<string, PerDieConfig> = {};
    config['dice_0'] = saved['dice_0'] || saved['dice_1'] || DEFAULT_CONFIG;
    const t = setInterval(async () => {
      if (diceRef.current?.configure) {
        await diceRef.current.configure(config);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  useImperativeHandle(ref, () => ({
    roll: async (value?: number) => {
      if (!diceRef.current) return;
      const suffix = value !== undefined ? `@${value}` : '';
      try {
        await diceRef.current.roll('d6', 1, suffix);
      } catch {
        // roll failed silently
      }
    },
    clear: () => {
      if (diceRef.current?.clear) diceRef.current.clear();
    },
  }));

  return <DiceOverlay ref={diceRef} onRollComplete={onRollComplete} />;
});

Dice.displayName = 'Dice';
