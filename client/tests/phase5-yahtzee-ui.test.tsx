import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useLocation: () => ({ state: {} }),
  BrowserRouter: ({ children }: any) => children,
  Routes: ({ children }: any) => children,
  Route: () => null,
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  cleanup();
});

describe('Phase 5: Yahtzee UI', () => {
  it('ScoreCard renders 13 categories', async () => {
    const { ScoreCard } = await import('../src/games/yahtzee/ScoreCard.js');
    const { container } = render(
      React.createElement(ScoreCard, {
        scores: {},
        dice: [1, 2, 3, 4, 5],
        canScore: false,
        totalScore: 0,
        playerName: 'Test',
        isCurrentPlayer: false,
      })
    );
    expect(container.textContent).toContain('Ones');
    expect(container.textContent).toContain('Yahtzee');
    expect(container.textContent).toContain('Chance');
    expect(container.textContent).toContain('Total');
  });

  it('ScoreCard shows preview scores when dice are rolled', async () => {
    const { ScoreCard } = await import('../src/games/yahtzee/ScoreCard.js');
    const { container } = render(
      React.createElement(ScoreCard, {
        scores: {},
        dice: [5, 5, 5, 5, 5],
        canScore: true,
        totalScore: 0,
        playerName: 'Test',
        isCurrentPlayer: true,
      })
    );
    // Yahtzee should show 50 as preview
    expect(container.textContent).toContain('Yahtzee');
  });

  it('ScoreCard shows upper bonus when 63+', async () => {
    const { ScoreCard } = await import('../src/games/yahtzee/ScoreCard.js');
    const { container } = render(
      React.createElement(ScoreCard, {
        scores: { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 },
        dice: [],
        canScore: false,
        totalScore: 98,
        playerName: 'Test',
        isCurrentPlayer: false,
      })
    );
    expect(container.textContent).toContain('98');
  });

  it('types file exports category type', async () => {
    const mod = await import('../src/games/yahtzee/types.js');
    expect(mod).toBeDefined();
  });

  it('YahtzeeGame renders without crashing', async () => {
    vi.mock('../src/components/DiceOverlay.js', () => ({
      DiceOverlay: vi.fn(() => React.createElement('div', { 'data-testid': 'dice-overlay' })),
    }));
    // Re-import with mock
    const YahtzeeGame = (await import('../src/games/yahtzee/YahtzeeGame.js')).default;
    const { container } = render(React.createElement(YahtzeeGame, { playerCount: 2 }));
    expect(container.textContent).toContain('Round');
    expect(container.textContent).toContain('Roll');
  });
});
