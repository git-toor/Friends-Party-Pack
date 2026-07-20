import React, { useState, useCallback, useEffect } from 'react';
import type { DieType, DiceComboEntry } from './DiceOverlay.js';

interface Props {
  diceMode: 'ANIMATED' | 'MANUAL';
  rerollsRemaining: number;
  pendingRoll: { ability: string; dc: number } | null;
  sessionId: string;
  visible: boolean;
  animationActive: boolean;
  animationResult: number[] | null;
  onRollClick: (combo: DiceComboEntry[]) => void;
  onSubmitRoll: (value: number, dieType: string, dieCount: number) => void;
  onClose: () => void;
  onRerollClick?: (lastCombo: DiceComboEntry[]) => void;
  abilityModifiers?: Record<string, number>;
  equippedWeapon?: { name: string; damage: string; damageType: string; properties: string[]; versatile?: string };
  inCombat?: boolean;
}

const DIE_OPTIONS: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const ROW1: DieType[] = ['d4', 'd6', 'd8'];
const ROW2: DieType[] = ['d10', 'd12', 'd20'];

const DIE_FACES: Record<DieType, number> = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };

function formatCombo(combo: Record<DieType, number>): string {
  return (Object.entries(combo) as [DieType, number][])
    .filter(([_, c]) => c > 0)
    .map(([t, c]) => `${c}${t.toUpperCase()}`)
    .join(' + ') || 'Tap dice to select';
}

function rollDice(dieType: DieType, count: number): number {
  const max = DIE_FACES[dieType];
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * max) + 1;
  return total;
}

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function DieButton({ dieType, count, onAdd, onRemove, disabled }: {
  dieType: DieType;
  count: number;
  onAdd: (d: DieType) => void;
  onRemove: (d: DieType) => void;
  disabled?: boolean;
}) {
  const active = count > 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      width: '100%',
      opacity: disabled ? 0.4 : 1,
      border: active ? '1px solid #7c7ce0' : '1px solid #374151',
      borderRadius: 6, overflow: 'hidden',
    }}>
      <button
        onClick={() => !disabled && onAdd(dieType)}
        title={`Add ${dieType.toUpperCase()}`}
        style={{
          flex: 1, padding: '8px 4px', fontSize: 12,
          background: active ? '#2d2d7e' : 'transparent',
          color: active ? '#c4b5fd' : '#9ca3af',
          border: 'none', cursor: disabled ? 'default' : 'pointer',
          fontWeight: active ? 'bold' : 'normal',
          textAlign: 'center',
        }}>
        {dieType.toUpperCase()}
        {active && (
          <span style={{ marginLeft: 4, color: '#fbbf24', fontSize: 11 }}>{count}</span>
        )}
      </button>
      {active && !disabled && (
        <button
          onClick={() => onRemove(dieType)}
          title={`Remove ${dieType.toUpperCase()}`}
          style={{
            padding: '8px 10px', fontSize: 14, lineHeight: '10px',
            background: '#2d2d7e', color: '#ef4444',
            border: 'none', borderLeft: '1px solid #7c7ce0',
            cursor: 'pointer', fontWeight: 'bold',
          }}>
          −
        </button>
      )}
    </div>
  );
}

export function DiceRollPanel({
  diceMode, rerollsRemaining, pendingRoll, visible,
  animationActive, animationResult,
  onRollClick, onSubmitRoll, onClose, onRerollClick,
  abilityModifiers, equippedWeapon, inCombat,
}: Props) {
  const [combo, setCombo] = useState<Record<DieType, number>>(
    () => Object.fromEntries(DIE_OPTIONS.map(d => [d, 0])) as Record<DieType, number>
  );
  const [manualValue, setManualValue] = useState('');
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [lastRolledCombo, setLastRolledCombo] = useState<DiceComboEntry[]>([]);

  const [modifier, setModifier] = useState(() => {
    if (pendingRoll?.ability && abilityModifiers?.[pendingRoll.ability] !== undefined) {
      return abilityModifiers[pendingRoll.ability] as number;
    }
    return 0;
  });

  const [attackMode, setAttackMode] = useState<'none' | 'attack' | 'damage'>('none');
  const [attackStrMod, setAttackStrMod] = useState(0);
  const [isCrit, setIsCrit] = useState(false);

  const hasPendingAnimationResult = animationResult !== null && animationResult.length > 0;

  const increment = useCallback((dieType: DieType) => {
    setCombo(prev => ({ ...prev, [dieType]: prev[dieType] + 1 }));
    setRollResult(null);
  }, []);

  const decrement = useCallback((dieType: DieType) => {
    setCombo(prev => ({ ...prev, [dieType]: Math.max(0, prev[dieType] - 1) }));
    setRollResult(null);
  }, []);

  const clearCombo = useCallback(() => {
    setCombo(Object.fromEntries(DIE_OPTIONS.map(d => [d, 0])) as Record<DieType, number>);
    setRollResult(null);
    setAttackMode('none');
    setIsCrit(false);
  }, []);

  const comboEntries = (Object.entries(combo) as [DieType, number][]).filter(([_, c]) => c > 0);
  const hasDiceSelected = comboEntries.length > 0;

  const [lastRawRoll, setLastRawRoll] = useState(0);
  const [hasRolled, setHasRolled] = useState(false);
  const isFreeRoll = !pendingRoll; // no DM request — roll freely
  // Detect crit on attack roll
  useEffect(() => {
    if (attackMode !== 'attack') return;
    if (animationResult && animationResult.length > 0 && animationResult[0] === 20) {
      setIsCrit(true);
    }
  }, [animationResult, attackMode]);
  useEffect(() => {
    if (attackMode !== 'attack') return;
    if (lastRawRoll === 20 && hasRolled) setIsCrit(true);
  }, [lastRawRoll, attackMode, hasRolled]);
  // Auto-select 1d20 when DM requests a skill check
  useEffect(() => {
    if (pendingRoll) {
      setCombo(prev => {
        const next = { ...prev } as Record<DieType, number>;
        for (const d of DIE_OPTIONS) next[d] = 0;
        next['d20'] = 1;
        return next;
      });
      setHasRolled(false);
      setRollResult(null);
    } else {
      setHasRolled(false);
    }
  }, [pendingRoll ? pendingRoll.ability + pendingRoll.dc : null]);

  const handleUseValue = useCallback(() => {
    const value = computeResult();
    if (value !== null) {
      const primary = comboEntries[0] || ['d20', 1] as [string, number];
      onSubmitRoll(value, primary[0], primary[1]);
      setRollResult(null);
    }
  }, [comboEntries, onSubmitRoll]);

  const computeResult = useCallback((): number | null => {
    if (attackMode === 'damage' && isCrit) {
      const maxRaw = comboEntries.reduce((sum, [t, c]) => {
        const size = parseInt(t.replace('d', ''), 10);
        return sum + (c * size);
      }, 0);
      return maxRaw + modifier;
    }
    if (rollResult !== null) return rollResult;
    if (hasPendingAnimationResult) return animationResult!.reduce((a, b) => a + b, 0) + modifier;
    return null;
  }, [rollResult, hasPendingAnimationResult, animationResult, modifier, comboEntries, attackMode, isCrit]);

  const displayValue = computeResult();

  const handleManualSubmit = useCallback(() => {
    const val = parseInt(manualValue, 10);
    if (!isNaN(val) && val > 0) {
      const primary = comboEntries[0] || ['d20', 1] as [string, number];
      onSubmitRoll(val, primary[0], primary[1]);
      setManualValue('');
      setRollResult(null);
    }
  }, [manualValue, comboEntries, onSubmitRoll]);

  const handleClose = useCallback(() => {
    setRollResult(null);
    setManualValue('');
    setAttackMode('none');
    setIsCrit(false);
    onClose();
  }, [onClose]);

  const displayAbility = pendingRoll ? pendingRoll.ability.toUpperCase() : '';

  // Build breakdown string
  const breakdown = (() => {
    if (attackMode === 'damage' && isCrit) {
      const comboStr = comboEntries.map(([t, c]) => `${c}${t.toUpperCase()}(max)`).join('+');
      const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
      return `CRIT! ${comboStr} ${modStr} = ${displayValue}`;
    }
    if (rollResult === null && !hasPendingAnimationResult) return '';
    const raw = hasPendingAnimationResult
      ? (animationResult ?? []).reduce((a, b) => a + b, 0)
      : lastRawRoll;
    const comboStr = comboEntries.map(([t, c]) => `${c}${t.toUpperCase()}`).join('+');
    const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    const total = raw + modifier;
    return `${comboStr} ${modStr}${pendingRoll ? ` (${displayAbility})` : ''} = ${total}`;
  })();

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 16, width: 320,
      background: '#1a1a2e', border: '1px solid #2a2a4e',
      borderRadius: 12, zIndex: 100, overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', background: '#111',
        borderBottom: '1px solid #2a2a4e',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 14, fontWeight: 'bold', color: '#c4b5fd' }}>
          🎲 Dice Roll {pendingRoll ? `(${displayAbility} DC${pendingRoll.dc})` : ''}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#888' }}>
            Rerolls: <span style={{ color: rerollsRemaining > 0 ? '#22c55e' : '#ef4444' }}>{rerollsRemaining}</span>
          </span>
          <button onClick={handleClose} style={{
            background: 'transparent', border: 'none', color: '#666',
            cursor: 'pointer', fontSize: 16, padding: '0 4px',
          }}>✕</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Pending Check Info */}
        {pendingRoll && (
          <div style={{
            padding: '8px 10px', background: '#1a1a3e', borderRadius: 6,
            border: '1px solid #7c7ce0', textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#fbbf24' }}>
              {displayAbility} CHECK
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              Difficulty Class: <strong style={{ color: '#c4b5fd' }}>DC {pendingRoll.dc}</strong>
            </div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
              ⓘ Roll 1d20 + ability modifier. D20 auto-selected.
            </div>
          </div>
        )}

        {/* Idle message */}
        {!pendingRoll && (
          <div style={{
            padding: '8px 10px', background: '#111', borderRadius: 6,
            border: '1px solid #333', textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              Nothing requested by DM — free roll
            </div>
          </div>
        )}

        {/* Combo display */}
        <div style={{
          padding: '8px 10px', background: '#0a0a14', borderRadius: 6,
          textAlign: 'center', fontSize: 13, color: '#c4b5fd',
          fontWeight: 'bold', border: '1px solid #2a2a4e',
          minHeight: 18,
        }}>
          {formatCombo(combo)}
        </div>

        {/* Die type buttons — 2 rows, uniform width */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {ROW1.map(d => (
              <DieButton key={d} dieType={d} count={combo[d]} onAdd={increment} onRemove={decrement} disabled={!!pendingRoll} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ROW2.map(d => (
              <DieButton key={d} dieType={d} count={combo[d]} onAdd={increment} onRemove={decrement} disabled={!!pendingRoll} />
            ))}
          </div>
        </div>

        {hasDiceSelected && (
          <button onClick={clearCombo} style={{
            padding: '4px 12px', fontSize: 11, background: 'transparent',
            border: '1px solid #555', color: '#888', borderRadius: 4,
            cursor: 'pointer', alignSelf: 'flex-end',
          }}>
            Clear all
          </button>
        )}

        {/* Modifier input */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>Modifier:</span>
          <input
            type="number"
            value={modifier}
            onChange={e => setModifier(parseInt(e.target.value) || 0)}
            style={{
              width: 60, padding: '5px 8px', fontSize: 13,
              background: '#111', color: '#fff', border: '1px solid #444',
              borderRadius: 4, textAlign: 'center', outline: 'none',
            }}
          />
          {pendingRoll && abilityModifiers?.[pendingRoll.ability] !== undefined && (() => {
            const modVal = abilityModifiers![pendingRoll!.ability] ?? 0;
            return (
              <span style={{ fontSize: 11, color: '#888' }}>
                (auto: {modVal >= 0 ? '+' : ''}{modVal})
              </span>
            );
          })()}
        </div>

        {/* Attack button — only show during combat */}
        {!pendingRoll && inCombat && equippedWeapon && attackMode === 'none' && (
          <button onClick={() => {
            setCombo(prev => {
              const next = { ...prev } as Record<DieType, number>;
              for (const d of DIE_OPTIONS) next[d] = 0;
              next['d20'] = 1;
              return next;
            });
            const strMod = abilityModifiers?.strength ?? 0;
            const dexMod = abilityModifiers?.dexterity ?? 0;
            const isFinesse = equippedWeapon.properties.includes('FINESSE');
            const atkMod = isFinesse ? Math.max(strMod, dexMod) : strMod;
            setModifier(atkMod);
            setAttackStrMod(atkMod);
            setAttackMode('attack');
            setIsCrit(false);
            setHasRolled(false);
            setRollResult(null);
          }} style={{
            padding: '10px', fontSize: 14, fontWeight: 'bold',
            background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 8,
            cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}>
            <img src={`/assets/icons/weapon/${equippedWeapon.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')}.png`}
              alt="" style={{ width: 24, height: 24, borderRadius: 2, objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span>⚔️ Attack with {equippedWeapon.name}</span>
          </button>
        )}

        {/* Attack → Damage chaining */}
        {attackMode === 'attack' && displayValue !== null && !animationActive && (
          <button onClick={() => {
            const damageDie = equippedWeapon?.damage ?? '1d4';
            const match = damageDie.match(/(\d+)d(\d+)/);
            if (match) {
              const count = parseInt(match[1]!);
              const dieSize = `d${match[2]!}` as DieType;
              setCombo(prev => {
                const next = { ...prev } as Record<DieType, number>;
                for (const d of DIE_OPTIONS) next[d] = 0;
                if (DIE_OPTIONS.includes(dieSize)) next[dieSize] = count;
                return next;
              });
              setModifier(attackStrMod);
              setAttackMode('damage');
              if (isCrit) {
                const maxRaw = count * parseInt(match[2]!, 10);
                setRollResult(maxRaw + attackStrMod);
                setLastRawRoll(maxRaw);
                setHasRolled(true);
              } else {
                setHasRolled(false);
                setRollResult(null);
              }
            }
          }} style={{
            padding: '8px', fontSize: 13, fontWeight: 'bold',
            background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
            cursor: 'pointer', width: '100%', marginTop: 4,
          }}>
            {isCrit ? '🎯 CRIT! Roll Damage (max)' : `💥 Roll Damage (${equippedWeapon?.damage ?? '1d4'}${attackStrMod >= 0 ? '+' : ''}${attackStrMod || ''})`}
          </button>
        )}

        {/* Roll / Reroll button */}
        {!animationActive && (
          <button onClick={() => {
            if (!hasDiceSelected) return;
            const entries: DiceComboEntry[] = comboEntries.map(([t, c]) => ({ dieType: t, count: c }));
            setLastRolledCombo(entries);
            if (isFreeRoll || !hasRolled) {
              setHasRolled(true);
              if (diceMode === 'ANIMATED') {
                setRollResult(null);
                onRollClick(entries);
              } else {
                const raw = comboEntries.reduce((sum, [t, c]) => sum + rollDice(t, c), 0);
                setLastRawRoll(raw);
                setRollResult(raw + modifier);
              }
              // For free rolls, reset hasRolled so next click rolls again
              if (isFreeRoll) setTimeout(() => setHasRolled(false), 100);
            } else {
              if (rerollsRemaining > 0 && onRerollClick) {
                onRerollClick(entries);
                if (diceMode === 'ANIMATED') {
                  setRollResult(null);
                } else {
                  const raw = comboEntries.reduce((sum, [t, c]) => sum + rollDice(t, c), 0);
                  setLastRawRoll(raw);
                  setRollResult(raw + modifier);
                }
              }
            }
          }} disabled={
            !hasDiceSelected || 
            (hasRolled && !isFreeRoll && rerollsRemaining === 0 && onRerollClick !== undefined)
          } style={{
            padding: '10px', fontSize: 14, fontWeight: 'bold',
            background: !hasDiceSelected || (hasRolled && !isFreeRoll && rerollsRemaining === 0 && onRerollClick !== undefined) ? '#333' : (pendingRoll ? '#7c3aed' : (attackMode !== 'none' ? '#b91c1c' : '#4f46e5')),
            color: '#fff', border: 'none', borderRadius: 8,
            cursor: hasDiceSelected && !(hasRolled && !isFreeRoll && rerollsRemaining === 0 && onRerollClick !== undefined) ? 'pointer' : 'default',
            opacity: hasDiceSelected && !(hasRolled && !isFreeRoll && rerollsRemaining === 0 && onRerollClick !== undefined) ? 1 : 0.5,
          }}>
            {isFreeRoll
              ? '🎲 Roll'
              : hasRolled
                ? `🔄 Reroll${rerollsRemaining > 0 ? ` (${rerollsRemaining})` : ' (none left)'}`
                : attackMode === 'attack' ? `⚔️ Attack (d20${attackStrMod >= 0 ? '+' : ''}${attackStrMod})`
                : attackMode === 'damage' ? `💥 Damage (${equippedWeapon?.damage ?? '1d4'}${attackStrMod >= 0 ? '+' : ''}${attackStrMod})`
                : `Roll ${displayAbility} (DC${pendingRoll?.dc ?? '?'})`}
          </button>
        )}

        {animationActive && (
          <div style={{ textAlign: 'center', padding: 8, fontSize: 13, color: '#888' }}>
            Rolling dice…
          </div>
        )}

        {/* Manual mode input */}
        {!animationActive && diceMode === 'MANUAL' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={manualValue}
              onChange={e => setManualValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              placeholder="Enter roll value…"
              type="number" min="1"
              style={{
                flex: 1, padding: '8px 12px', background: '#111', color: '#fff',
                border: '1px solid #333', borderRadius: 6, fontSize: 14, outline: 'none',
              }}
            />
            <button onClick={handleManualSubmit} style={{
              padding: '8px 16px', background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}>
              Submit
            </button>
          </div>
        )}

        {/* Result + Use Value */}
        {displayValue !== null && !animationActive && (
          <div style={{
            padding: 10, background: '#111', borderRadius: 6, textAlign: 'center',
            border: '1px solid #2a2a4e',
          }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fbbf24' }}>
              {displayValue}
            </div>
            {breakdown && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 4, fontFamily: 'monospace' }}>
                {breakdown}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {pendingRoll ? (
                <button onClick={handleUseValue} style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 'bold',
                  background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6,
                  cursor: 'pointer',
                }}>
                  Use Value
                </button>
              ) : (
                <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>
                  Nothing requested by DM
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
