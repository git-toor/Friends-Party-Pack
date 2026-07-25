import { vi } from 'vitest';

// Mock WebGL renderer since we don't have a GPU in tests
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;

// Mock ResizeObserver for components that use it (PropertyFan)
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
