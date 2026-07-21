import { useState } from 'react';
// @ts-ignore
import { COLORSETS } from '../dice/colorsets.js';
// @ts-ignore
import { TEXTURELIST } from '../dice/texturelist.js';
import type { PerDieConfig } from './DiceOverlay.js';
import { DicePreview } from './DicePreview.js';

const DICE_KEYS = ['dice_0', 'dice_1', 'dice_2', 'dice_3', 'dice_4'];
const MATERIALS = ['none', 'metal', 'wood', 'glass'];
const CATEGORY_ORDER = ['Colors', 'Damage Types', 'Nature', 'Themes', 'Custom Sets', 'Sci-Fi Sets', 'Fleet Sets', 'Fighter Sets', 'Legion Sets', 'Other'];
const STORAGE_KEY = 'fpp_dice_appearance';

const TEXTURES = Object.entries(TEXTURELIST)
  .filter(([k, v]) => (v as any).name && k !== 'none' && k !== '')
  .map(([k, v]) => ({ key: k, name: (v as any).name }));

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

const DEFAULT_PRESETS: PerDieConfig[] = [
  { colorset: 'dragons_17', texture: 'metal', material: 'metal', textColor: '#ffffff' },
  { colorset: 'glitterparty_3', texture: 'metal', material: 'metal', textColor: '#ffffff' },
  { colorset: 'dragons_16', texture: 'metal', material: 'metal', textColor: '#ffffff' },
  { colorset: 'dragons_5', texture: 'metal', material: 'metal', textColor: '#ffffff' },
  { colorset: 'dragons_1', texture: 'metal', material: 'metal', textColor: '#ffffff' },
];

function defaultConfigForDie(idx: number): PerDieConfig {
  return DEFAULT_PRESETS[idx] || DEFAULT_PRESETS[0];
}

export function loadDiceAppearance(): Record<string, PerDieConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveAll(cfgs: Record<string, PerDieConfig>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfgs));
}

export function DiceAppearanceSelector() {
  const [configs, setConfigs] = useState<Record<string, PerDieConfig>>(() => {
    const saved = loadDiceAppearance();
    const out: Record<string, PerDieConfig> = {};
    for (const k of DICE_KEYS) {
      const idx = parseInt(k.split('_')[1]);
      out[k] = saved[k] || defaultConfigForDie(idx);
    }
    return out;
  });
  const [open, setOpen] = useState<string>('dice_0');
  const colorSets = getGroupedColorSets();

  const update = (key: string, patch: Partial<PerDieConfig>) => {
    const next = { ...configs, [key]: { ...configs[key], ...patch } };
    setConfigs(next);
    saveAll(next);
  };

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <label style={{ display: 'block', marginBottom: 8, color: '#999', fontSize: 14 }}>🎲 Dice Appearance</label>

      {/* Die tabs — Dice1 through Dice5 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {DICE_KEYS.map((k, i) => (
          <button key={k} onClick={() => setOpen(k)}
            style={{
              padding: '4px 12px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', background: open === k ? '#e94560' : '#0f3460', color: '#fff',
            }}>
            Dice{i + 1}
          </button>
        ))}
      </div>

      {DICE_KEYS.map((key, idx) => {
        if (open !== key) return null;
        const cfg = configs[key];

        return (
          <div key={key} style={{ background: '#0f3460', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Preview + current config summary */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <DicePreview dieType="d6" config={cfg} size={80} />
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
                <div>Dice {idx + 1}</div>
                <div>Color: <span style={{ color: '#fff' }}>{(COLORSETS as any)[cfg.colorset || 'white']?.name || cfg.colorset}</span></div>
                <div>Texture: <span style={{ color: '#fff' }}>{cfg.texture ? (TEXTURELIST as any)[cfg.texture]?.name || cfg.texture : 'None'}</span></div>
                <div>Material: <span style={{ color: '#fff' }}>{cfg.material === 'none' ? 'Plastic' : (cfg.material || 'none')}</span></div>
                <div>Text: <span style={{ color: cfg.textColor || '#000' }}>{cfg.textColor || '#000000'}</span></div>
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Color Theme</div>
              <select value={cfg.colorset || 'white'} onChange={e => update(key, { colorset: e.target.value })}
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
              <select value={cfg.texture || ''} onChange={e => update(key, { texture: e.target.value })}
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
                  <button key={m} onClick={() => update(key, { material: m })}
                    style={{
                      flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid #555', cursor: 'pointer',
                      fontSize: 11, fontWeight: 600,
                      background: (cfg.material || 'none') === m ? '#e94560' : '#16213e',
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
              <input type="color" value={cfg.textColor || '#000000'}
                onChange={e => update(key, { textColor: e.target.value })}
                style={{ width: 40, height: 30, padding: 0, border: '1px solid #555', borderRadius: 4, cursor: 'pointer', background: 'transparent' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
