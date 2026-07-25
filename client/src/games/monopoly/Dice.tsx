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
  roll: (value1?: number, value2?: number) => Promise<[number, number]>;
  clear: () => void;
}

interface DiceProps {
  onRollComplete?: () => void;
}

export const Dice = forwardRef<DiceHandle, DiceProps>(({ onRollComplete }, ref) => {
  const diceRef = useRef<DiceOverlayHandle>(null);

  useEffect(() => {
    const saved = loadDiceAppearance();
    const cfg = saved['dice_0'] || saved['dice_1'] || DEFAULT_CONFIG;
    const config: Record<string, PerDieConfig> = {};
    for (let i = 0; i < 5; i++) config[`dice_${i}`] = cfg;
    const t = setInterval(async () => {
      if (diceRef.current?.configure) {
        await diceRef.current.configure(config);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  useImperativeHandle(ref, () => ({
    roll: async (value1?: number, value2?: number) => {
      if (!diceRef.current) return [0, 0];
      try {
        const suffix = value1 !== undefined && value2 !== undefined ? `@${value1},${value2}` : '';
        const results = await diceRef.current.roll('d6', 2, suffix);
        return [results[0] ?? 0, results[1] ?? 0] as [number, number];
      } catch {
        return [0, 0];
      }
    },
    clear: () => {
      if (diceRef.current?.clear) diceRef.current.clear();
    },
  }));

  return <DiceOverlay ref={diceRef} onRollComplete={onRollComplete} />;
});

Dice.displayName = 'Dice';
