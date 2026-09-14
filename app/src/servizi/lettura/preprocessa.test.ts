import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { preprocessa, LATO_LUNGO_MASSIMO_PX } from './preprocessa';

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
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4).fill(200),
      }),
      putImageData: () => {},
    };
  }
  transferToImageBitmap() {
    return { width: this.width, height: this.height } as unknown as ImageBitmap;
  }
}

describe('servizi/lettura/preprocessa — ridimensionamento e scala di grigi (T-17)', () => {
  beforeEach(() => {
    vi.stubGlobal('OffscreenCanvas', OffscreenCanvasFinto as unknown as typeof OffscreenCanvas);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ridimensiona a lato lungo <= 2000px un’immagine più grande', async () => {
    const bitmapGrande = { width: 4000, height: 3000 } as unknown as ImageBitmap;
    const risultato = await preprocessa(bitmapGrande);
    expect(Math.max(risultato.width, risultato.height)).toBeLessThanOrEqual(LATO_LUNGO_MASSIMO_PX);
    expect(risultato.width / risultato.height).toBeCloseTo(4000 / 3000, 2);
  });

  it('non ingrandisce un’immagine già piccola', async () => {
    const bitmapPiccola = { width: 400, height: 300 } as unknown as ImageBitmap;
    const risultato = await preprocessa(bitmapPiccola);
    expect(risultato.width).toBe(400);
    expect(risultato.height).toBe(300);
  });
});
