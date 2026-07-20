import { vi } from 'vitest';

// Mock WebGL renderer since we don't have a GPU in tests
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;
