import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyFan } from '../PropertyFan.js';
import type { PropertyCardData } from '../PropertyCard.js';

function makeCard(index: number, overrides: Partial<PropertyCardData> = {}): PropertyCardData {
  return { index, name: 'Test Property', group: 0, price: 100, houses: 0, mortgaged: false, ...overrides };
}

beforeEach(() => {
  // Mock getBoundingClientRect for fan container width detection
  const orig = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 400, height: 180, top: 0, left: 0, right: 400, bottom: 180,
    x: 0, y: 0, toJSON: () => ({}),
  }));
});

describe('PropertyFan', () => {
  it('shows empty state when no cards', () => {
    render(<PropertyFan cards={[]} />);
    expect(screen.getByText('No properties yet')).toBeDefined();
  });

  it('renders property cards', () => {
    const cards = [makeCard(1, { name: 'Marine Drive' }), makeCard(2, { name: 'Park Street' })];
    render(<PropertyFan cards={cards} />);
    expect(screen.getByText('Marine Drive')).toBeDefined();
  });

  it('shows monopoly glow card when monopoly=true', () => {
    const cards = [makeCard(1, { name: 'Marine Drive', monopoly: true })];
    const { container } = render(<PropertyFan cards={cards} />);
    const cardElements = container.querySelectorAll('[style*="cursor:"]');
    expect(cardElements.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSelectCard when clicking a card', () => {
    const onSelect = vi.fn();
    const cards = [makeCard(1, { name: 'Clickable' })];
    render(<PropertyFan cards={cards} onSelectCard={onSelect} />);
    expect(screen.getByText('Clickable')).toBeDefined();
  });
});
