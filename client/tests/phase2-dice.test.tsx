import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';

// Silence console errors from Three.js in test env
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  cleanup();
});

describe('Phase 2: Dice Engine', () => {
  it('imports DiceBox without error', async () => {
    // Dynamic import to test the module loads
    const mod = await import('../src/dice/DiceBox.js');
    expect(mod.DiceBox).toBeDefined();
    expect(typeof mod.DiceBox).toBe('function');
  });

  it('imports DiceFactory without error', async () => {
    const mod = await import('../src/dice/DiceFactory.js');
    expect(mod.DiceFactory).toBeDefined();
  });

  it('imports DiceNotation without error', async () => {
    const { DiceNotation } = await import('../src/dice/DiceNotation.js');
    expect(DiceNotation).toBeDefined();
  });

  it('DiceNotation parses basic notation', async () => {
    const { DiceNotation } = await import('../src/dice/DiceNotation.js');
    const n = new DiceNotation('5d6');
    expect(n.set).toHaveLength(1);
    expect(n.set[0].num).toBe(5);
    expect(n.set[0].type).toBe('d6');
  });

  it('DiceNotation parses multi-type notation', async () => {
    const { DiceNotation } = await import('../src/dice/DiceNotation.js');
    const n = new DiceNotation('2d6+1d20');
    expect(n.set).toHaveLength(2);
  });

  it('DiceNotation handles modifiers', async () => {
    const { DiceNotation } = await import('../src/dice/DiceNotation.js');
    const n = new DiceNotation('2d6+3');
    expect(n.constant).toBe(3);
  });

  it('loads texturelist constants', async () => {
    const { TEXTURELIST } = await import('../src/dice/texturelist.js');
    expect(TEXTURELIST.marble).toBeDefined();
    expect(TEXTURELIST.marble.source).toContain('marble.webp');
  });

  it('loads colorsets constants', async () => {
    const { COLORSETS } = await import('../src/dice/colorsets.js');
    expect(COLORSETS.white).toBeDefined();
    expect(COLORSETS.radiant).toBeDefined();
  });

  it('loads material types', async () => {
    const { MATERIALTYPES } = await import('../src/dice/materialtypes.js');
    expect(MATERIALTYPES.glass).toBeDefined();
    expect(MATERIALTYPES.metal).toBeDefined();
  });

  it('DiceOverlay renders container div', async () => {
    const { DiceOverlay } = await import('../src/components/DiceOverlay.tsx');
    const { container } = render(React.createElement(DiceOverlay));
    const overlay = container.querySelector('#dice-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay!.style.position).toBe('fixed');
    expect(overlay!.style.zIndex).toBe('999');
  });

  it('DiceOverlay accepts ref and exposes methods', async () => {
    const { DiceOverlay } = await import('../src/components/DiceOverlay.tsx');
    const ref = React.createRef<any>();
    render(React.createElement(DiceOverlay, { ref }));
    expect(ref.current).toBeTruthy();
    expect(typeof ref.current.roll).toBe('function');
    expect(typeof ref.current.keep).toBe('function');
    expect(typeof ref.current.getSettledValues).toBe('function');
    expect(typeof ref.current.resetKept).toBe('function');
    expect(typeof ref.current.clear).toBe('function');
  });

  it('imports themes', async () => {
    const { THEMES } = await import('../src/dice/const/themes.js');
    expect(THEMES['green-felt']).toBeDefined();
    expect(THEMES['green-felt'].surface).toBe('felt');
  });

  it('helper debounce function exists', async () => {
    const { debounce } = await import('../src/dice/helper.js');
    expect(typeof debounce).toBe('function');
  });
});
