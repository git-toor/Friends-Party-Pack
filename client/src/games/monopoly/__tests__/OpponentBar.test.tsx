import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpponentBar } from '../OpponentBar.js';

const mockPlayers = [
  { money: 1500, position: 0, inJail: false, bankrupt: false },
  { money: 1300, position: 5, inJail: true, bankrupt: false },
  { money: 0, position: 10, inJail: false, bankrupt: true },
];

const mockNames: Record<number, string> = { 0: 'Alice', 1: 'Bob' };

describe('OpponentBar', () => {
  it('shows player names', () => {
    render(<OpponentBar players={mockPlayers} currentPlayer={0} playerNames={mockNames} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
  });

  it('shows money amounts', () => {
    render(<OpponentBar players={mockPlayers} currentPlayer={0} playerNames={mockNames} />);
    expect(screen.getByText('₹1500')).toBeDefined();
    expect(screen.getByText('₹1300')).toBeDefined();
  });

  it('skips bankrupt players', () => {
    render(<OpponentBar players={mockPlayers} currentPlayer={0} playerNames={mockNames} />);
    // Fallback name for P2 since they're skipped
    expect(screen.queryByText('Yellow')).toBeNull(); // bankrupt
  });

  it('highlights current player with active styling', () => {
    const { container } = render(<OpponentBar players={mockPlayers} currentPlayer={0} playerNames={mockNames} />);
    const playerDivs = container.querySelectorAll('[style*="border:"]');
    const activeDivs = Array.from(playerDivs).filter(d => (d as HTMLElement).style.border.includes('rgb(229, 57, 53)'));
    expect(activeDivs.length).toBeGreaterThanOrEqual(1);
  });

  it('shows jail indicator for jailed players', () => {
    const { container } = render(<OpponentBar players={mockPlayers} currentPlayer={0} playerNames={mockNames} />);
    const jailIndicators = container.querySelectorAll('[style*="font-size: 8"]');
    expect(jailIndicators.length).toBe(1); // Bob is in jail
  });

  it('shows property count when provided', () => {
    render(<OpponentBar players={mockPlayers} currentPlayer={0} playerNames={mockNames} propertyCount={{ 0: 3, 1: 1 }} />);
    expect(screen.getByText('3🏠')).toBeDefined();
    expect(screen.getByText('1🏠')).toBeDefined();
  });

  it('falls back to PLAYER_NAMES when playerNames not provided', () => {
    render(<OpponentBar players={mockPlayers} currentPlayer={0} playerNames={{}} />);
    expect(screen.getByText('Red')).toBeDefined(); // PLAYER_NAMES[0]
    expect(screen.getByText('Green')).toBeDefined(); // PLAYER_NAMES[1]
  });
});
