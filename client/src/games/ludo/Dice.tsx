import { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
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
  rollWithValue: (value: number) => Promise<void>;
  clear: () => void;
}

export const Dice = forwardRef<DiceHandle, {}>((_props, ref) => {
  const diceRef = useRef<DiceOverlayHandle>(null);
  const [showDice, setShowDice] = useState(false);
  const rollingRef = useRef(false);

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
    rollWithValue: async (value: number) => {
      if (!diceRef.current || rollingRef.current) return;
      rollingRef.current = true;
      await diceRef.current.roll('d6', 1, `@${value}`);
      setShowDice(true);
      rollingRef.current = false;
    },
    clear: () => {
      setShowDice(false);
      if (diceRef.current?.clear) diceRef.current.clear();
    },
  }));

  const handleOverlayClick = useCallback(() => {
    if (rollingRef.current) return;
    setShowDice(false);
    if (diceRef.current?.clear) diceRef.current.clear();
  }, []);

  return (
    <>
      <DiceOverlay ref={diceRef} />
      {showDice && (
        <div onClick={handleOverlayClick} style={{
          position: 'fixed', inset: 0, zIndex: 1001, cursor: 'pointer',
          background: 'rgba(0,0,0,0.1)',
        }} />
      )}
    </>
  );
});

Dice.displayName = 'Dice';
