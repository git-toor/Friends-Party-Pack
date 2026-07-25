import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyCard, type PropertyCardData } from '../PropertyCard.js';

function makeCard(overrides: Partial<PropertyCardData> = {}): PropertyCardData {
  return { index: 1, name: 'Chandni Chowk', group: 0, price: 60, houses: 0, mortgaged: false, ...overrides };
}

describe('PropertyCard', () => {
  it('renders property name', () => {
    render(<PropertyCard card={makeCard()} />);
    expect(screen.getByText('Chandni Chowk')).toBeDefined();
  });

  it('renders price', () => {
    render(<PropertyCard card={makeCard({ price: 60 })} />);
    expect(screen.getByText('₹60')).toBeDefined();
  });

  it('shows bungalow indicators for houses', () => {
    const { container } = render(<PropertyCard card={makeCard({ houses: 2 })} />);
    const greenSquares = container.querySelectorAll('div[style*="rgb(76, 175, 80)"]');
    expect(greenSquares.length).toBe(2);
  });

  it('shows villa indicator for 5 houses', () => {
    const { container } = render(<PropertyCard card={makeCard({ houses: 5 })} />);
    const redSquares = container.querySelectorAll('div[style*="rgb(244, 67, 54)"]');
    expect(redSquares.length).toBe(1);
  });

  it('shows MORTGAGED label when mortgaged', () => {
    render(<PropertyCard card={makeCard({ mortgaged: true })} />);
    expect(screen.getByText('MORTGAGED')).toBeDefined();
  });

  it('applies grayscale and 0.5 opacity when mortgaged', () => {
    const { container } = render(<PropertyCard card={makeCard({ mortgaged: true })} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.opacity).toBe('0.5');
    expect(outer.style.filter).toContain('grayscale');
  });

  it('applies selected border when selected', () => {
    const { container } = render(<PropertyCard card={makeCard()} selected />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.border).toContain('2px');
    expect(outer.style.border).toContain('rgb(233, 69, 96)');
  });

  it('applies monopoly glow when monopoly=true', () => {
    const { container } = render(<PropertyCard card={makeCard({ monopoly: true })} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.border).toContain('2px');
    expect(outer.style.boxShadow).toContain('#8B4513');
  });

  it('renders small size correctly', () => {
    const { container } = render(<PropertyCard card={makeCard()} size="small" />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.width).toBe('75px');
  });

  it('renders medium size correctly', () => {
    const { container } = render(<PropertyCard card={makeCard()} size="medium" />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.width).toBe('105px');
  });
});
