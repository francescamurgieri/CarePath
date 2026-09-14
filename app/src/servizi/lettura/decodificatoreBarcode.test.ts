import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * T-15 — jsdom non implementa OffscreenCanvas/ImageBitmap: si stubbano con il minimo
 * indispensabile perché l'adapter (bitmapAImageData) non lanci. `zxing-wasm/reader` è
 * mockato per controllare il comportamento di timeout con timer finti, senza dipendere
 * da un vero caricamento WASM in ambiente di test.
 */
vi.mock('zxing-wasm/reader', () => ({
  readBarcodesFromImageData: vi.fn(() => new Promise<never[]>(() => {})), // non risolve mai
  setZXingModuleOverrides: vi.fn(),
}));
vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: '/finto/zxing_reader.wasm' }));

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

describe('servizi/lettura/decodificatoreBarcode — contratto (architecture.md §4.2)', () => {
  beforeEach(() => {
    vi.stubGlobal('OffscreenCanvas', OffscreenCanvasFinto as unknown as typeof OffscreenCanvas);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('disponibile() ritorna un booleano senza lanciare', async () => {
    const { creaDecodificatoreBarcode } = await import('./decodificatoreBarcode');
    const decodificatore = creaDecodificatoreBarcode();
    await expect(decodificatore.disponibile()).resolves.toBeTypeOf('boolean');
  });

  it('decodifica() su un bitmap che non produce risultati entro il timeout ritorna [] (default 3000ms)', async () => {
    const { creaDecodificatoreBarcode } = await import('./decodificatoreBarcode');
    const decodificatore = creaDecodificatoreBarcode();
    const bitmapFinto = { width: 100, height: 100 } as unknown as ImageBitmap;

    const promessa = decodificatore.decodifica(bitmapFinto);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(promessa).resolves.toEqual([]);
  });

  it('rispetta un timeout esplicito diverso dal default', async () => {
    const { creaDecodificatoreBarcode } = await import('./decodificatoreBarcode');
    const decodificatore = creaDecodificatoreBarcode();
    const bitmapFinto = { width: 100, height: 100 } as unknown as ImageBitmap;

    const promessa = decodificatore.decodifica(bitmapFinto, 500);
    await vi.advanceTimersByTimeAsync(500);
    await expect(promessa).resolves.toEqual([]);
  });
});
