import { useState, useEffect } from 'react';
// @ts-ignore
import { COLORSETS } from '../dice/colorsets.js';
// @ts-ignore
import { TEXTURELIST } from '../dice/texturelist.js';
import type { DiceAppearanceConfig, PerDieConfig } from './DiceOverlay.js';

const MATERIALS = ['none', 'metal', 'wood', 'glass'];
const CATEGORY_ORDER = ['Colors', 'Damage Types', 'Nature', 'Themes', 'Custom Sets', 'Sci-Fi Sets', 'Fleet Sets', 'Fighter Sets', 'Legion Sets', 'Other'];



function getGroupedColorSets() {
  const groups: Record<string, { key: string; name: string }[]> = {};
  for (const [key, val] of Object.entries(COLORSETS)) {
    const cs = val as any;
    const cat = cs.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ key, name: cs.name || key });
  }
  return CATEGORY_ORDER.filter(c => groups[c]).map(c => ({ category: c, sets: groups[c] }));
}

const TEXTURES = Object.entries(TEXTURELIST)
  .filter(([k, v]) => (v as any).name && k !== 'none' && k !== '')
  .map(([k, v]) => ({ key: k, name: (v as any).name }));

const STORAGE_KEY = 'fpp_dice_appearance';

export function loadDiceAppearance(): DiceAppearanceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function defaultD6Config(): PerDieConfig {
  return { colorset: 'white', texture: '', material: 'none', textColor: '#000000' };
}

export function DiceAppearanceSelector() {
  const [config, setConfig] = useState<PerDieConfig>(() => {
    const saved = loadDiceAppearance();
    return saved['d6'] || defaultD6Config();
  });

  const update = (patch: Partial<PerDieConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ d6: next }));
  };

  const colorSets = getGroupedColorSets();

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <label style={{ display: 'block', marginBottom: 8, color: '#999', fontSize: 14 }}>🎲 Dice Appearance</label>

      <div style={{ background: '#0f3460', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Color Theme */}
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Color Theme</div>
          <select value={config.colorset || 'white'} onChange={e => update({ colorset: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #444', background: '#16213e', color: '#eee', fontSize: 12, outline: 'none' }}>
            {colorSets.map(g => (
              <optgroup key={g.category} label={g.category}>
                {g.sets.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Texture */}
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Texture</div>
          <select value={config.texture || ''} onChange={e => update({ texture: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #444', background: '#16213e', color: '#eee', fontSize: 12, outline: 'none' }}>
            <option value="">None</option>
            {TEXTURES.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
        </div>

        {/* Material */}
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Material</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {MATERIALS.map(m => (
              <button key={m} onClick={() => update({ material: m })}
                style={{
                  flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid #555', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600,
                  background: (config.material || 'none') === m ? '#e94560' : '#16213e',
                  color: '#fff',
                }}>
                {m === 'none' ? 'Plastic' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Text Color</div>
          <input type="color" value={config.textColor || '#000000'}
            onChange={e => update({ textColor: e.target.value })}
            style={{ width: 40, height: 30, padding: 0, border: '1px solid #555', borderRadius: 4, cursor: 'pointer', background: 'transparent' }} />
        </div>

      </div>
    </div>
  );
}
