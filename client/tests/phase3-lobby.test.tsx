import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import React from 'react';

// Mock react-router-dom for all tests that use it
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  BrowserRouter: ({ children }: any) => children,
  Routes: ({ children }: any) => children,
  Route: () => null,
}));

// Silence console errors from Three.js in test env
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  cleanup();
});

describe('Phase 3: Lobby UI', () => {
  it('Button component renders', async () => {
    const { Button } = await import('../src/components/Button.js');
    const { container } = render(React.createElement(Button, { children: 'Click Me' }));
    expect(container.querySelector('button')).toBeTruthy();
    expect(container.textContent).toContain('Click Me');
  });

  it('Button accepts variant and size props', async () => {
    const { Button } = await import('../src/components/Button.js');
    const { container } = render(React.createElement(Button, { variant: 'danger', size: 'lg', children: 'Delete' }));
    const btn = container.querySelector('button');
    expect(btn).toBeTruthy();
  });

  it('API client has expected methods', async () => {
    const { api } = await import('../src/api/client.js');
    expect(typeof api.createLobby).toBe('function');
    expect(typeof api.joinLobby).toBe('function');
    expect(typeof api.setReady).toBe('function');
    expect(typeof api.startGame).toBe('function');
    expect(typeof api.getLobbyState).toBe('function');
  });

  it('WS connection manager has expected methods', async () => {
    const { WsConnection } = await import('../src/api/ws.js');
    const ws = new WsConnection();
    expect(typeof ws.connect).toBe('function');
    expect(typeof ws.disconnect).toBe('function');
    expect(typeof ws.send).toBe('function');
    expect(typeof ws.on).toBe('function');
    expect(ws.connected).toBe(false);
  });

  it('HomePage renders game list', async () => {
    const HomePage = (await import('../src/pages/HomePage.js')).default;
    const { container } = render(React.createElement(HomePage));
    expect(container.textContent).toContain('Friends Party Pack');
    expect(container.textContent).toContain('Yahtzee');
  });
});
