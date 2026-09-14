import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const workerFinto = {
  setParameters: vi.fn(async () => {}),
  recognize: vi.fn(() => new Promise<never>(() => {})), // non risolve mai: simula un OCR lento
};

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => workerFinto),
}));

class OffscreenCanvasFinto {
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  getContext() {
    return {
      drawImage: () => {},
      getImageData: (_x: number, _y: number, w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    };
  }
}

describe('servizi/lettura/motoreOcr — contratto (architecture.md §4.3)', () => {
  beforeEach(() => {
    vi.stubGlobal('OffscreenCanvas', OffscreenCanvasFinto as unknown as typeof OffscreenCanvas);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('precarica() risolve senza lanciare (nessuna dipendenza di rete: worker/core/lang locali)', async () => {
    const { creaMotoreOcr } = await import('./motoreOcr');
    const motore = creaMotoreOcr();
    await expect(motore.precarica()).resolves.toBeUndefined();
  });

  it('riconosci() in timeout ritorna le parole già trovate (qui nessuna), mai un’eccezione', async () => {
    const { creaMotoreOcr } = await import('./motoreOcr');
    const motore = creaMotoreOcr();
    const bitmapFinto = { width: 100, height: 100 } as unknown as ImageBitmap;

    const promessa = motore.riconosci(bitmapFinto, { timeoutMs: 15_000 });
    await vi.advanceTimersByTimeAsync(15_000);
    await expect(promessa).resolves.toEqual([]);
  });
});
