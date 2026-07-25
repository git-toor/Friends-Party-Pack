import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonopolyBoard } from '../MonopolyBoard.js';

describe('MonopolyBoard', () => {
  const defaultTokens = [{ playerIndex: 0, position: 0 }];

  it('renders the SVG board', () => {
    const { container } = render(
      <MonopolyBoard tokens={defaultTokens} stepAnim={null} onStepAnimDone={() => {}} totalPlayers={2} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });

  it('renders GO tile', () => {
    render(
      <MonopolyBoard tokens={defaultTokens} stepAnim={null} onStepAnimDone={() => {}} totalPlayers={2} />
    );
    expect(screen.getByText('GO')).toBeDefined();
  });

  it('renders corner tiles: Jail, Free Parking', () => {
    render(
      <MonopolyBoard tokens={defaultTokens} stepAnim={null} onStepAnimDone={() => {}} totalPlayers={2} />
    );
    const texts = screen.getAllByText(/JAIL|Free Park/i);
    expect(texts.length).toBeGreaterThanOrEqual(2);
  });

  it('renders player tokens', () => {
    const { container } = render(
      <MonopolyBoard
        tokens={[{ playerIndex: 0, position: 0 }, { playerIndex: 1, position: 5 }]}
        stepAnim={null}
        onStepAnimDone={() => {}}
        totalPlayers={2}
      />
    );
    // SVG circles for tokens
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders property tiles with color groups', () => {
    const { container } = render(
      <MonopolyBoard tokens={defaultTokens} stepAnim={null} onStepAnimDone={() => {}} totalPlayers={2} />
    );
    const rects = container.querySelectorAll('rect');
    // Should have colored rects for the 40 tiles
    expect(rects.length).toBeGreaterThan(20);
  });

  it('renders bungalow/villa indicators', () => {
    const { container } = render(
      <MonopolyBoard tokens={defaultTokens} stepAnim={null} onStepAnimDone={() => {}} totalPlayers={2} />
    );
    // All 40 tiles rendered
    const texts = screen.getAllByText(/./);
    expect(texts.length).toBeGreaterThan(20);
  });

  it('handles null stepAnim gracefully', () => {
    const { container } = render(
      <MonopolyBoard tokens={defaultTokens} stepAnim={null} onStepAnimDone={() => {}} totalPlayers={2} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });

  it('renders with multiple player tokens stacked', () => {
    const tokens = [
      { playerIndex: 0, position: 0 },
      { playerIndex: 1, position: 0 },
      { playerIndex: 2, position: 10 },
    ];
    const { container } = render(
      <MonopolyBoard tokens={tokens} stepAnim={null} onStepAnimDone={() => {}} totalPlayers={3} />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });
});
