import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { creaLettoreRicetta } from './LettoreRicetta';
import type { DecodificatoreBarcode } from './decodificatoreBarcode';
import type { MotoreOcr } from './motoreOcr';
import type { AcquisizioneFoto } from '../../dominio/tipi';

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
      putImageData: () => {},
    };
  }
  transferToImageBitmap() {
    return { width: this.width, height: this.height } as unknown as ImageBitmap;
  }
}

function fotoFinta(overrides: Partial<AcquisizioneFoto> = {}): AcquisizioneFoto {
  return {
    immagine: new Blob(['x'], { type: 'image/jpeg' }),
    anteprimaUrl: 'blob:finto',
    larghezzaPx: 1000,
    altezzaPx: 1400,
    acquisitaIl: new Date('2024-10-01T10:00:00Z'),
    sorgente: 'fotocamera',
    ...overrides,
  };
}

describe('servizi/lettura/LettoreRicetta — orchestratore (architecture.md §4.1)', () => {
  beforeEach(() => {
    vi.stubGlobal('OffscreenCanvas', OffscreenCanvasFinto as unknown as typeof OffscreenCanvas);
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 1000, height: 1400 }) as unknown as ImageBitmap));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('esegue la pipeline e produce una LetturaRicetta ok quando i servizi rispondono', async () => {
    const decodificatore: DecodificatoreBarcode = {
      disponibile: vi.fn(async () => true),
      decodifica: vi.fn(async () => [{ formato: 'CODE_39' as const, testo: '010A2', riquadro: { x: 0, y: 0, larghezza: 0.1, altezza: 0.1 } }]),
    };
    const motoreOcr: MotoreOcr = {
      precarica: vi.fn(async () => {}),
      riconosci: vi.fn(async () => []),
    };
    const lettore = creaLettoreRicetta(decodificatore, motoreOcr);

    const risultato = await lettore.leggi(fotoFinta());
    expect(risultato.esito).toBe('ok');
    if (risultato.esito === 'ok') {
      expect(risultato.valore.idLettura).toContain('lettura-');
      expect(typeof risultato.valore.durataMs).toBe('number');
    }
  });

  it('precarica() invoca il precaricamento del motore OCR (ADR-0003: sposta l’attesa in S-02)', async () => {
    const motoreOcr: MotoreOcr = { precarica: vi.fn(async () => {}), riconosci: vi.fn(async () => []) };
    const decodificatore: DecodificatoreBarcode = { disponibile: vi.fn(async () => true), decodifica: vi.fn(async () => []) };
    const lettore = creaLettoreRicetta(decodificatore, motoreOcr);
    await lettore.precarica();
    expect(motoreOcr.precarica).toHaveBeenCalledOnce();
  });

  it('propaga il segnale di cancellazione al motore OCR', async () => {
    const motoreOcr: MotoreOcr = { precarica: vi.fn(async () => {}), riconosci: vi.fn(async () => []) };
    const decodificatore: DecodificatoreBarcode = { disponibile: vi.fn(async () => true), decodifica: vi.fn(async () => []) };
    const lettore = creaLettoreRicetta(decodificatore, motoreOcr);
    const controller = new AbortController();

    await lettore.leggi(fotoFinta(), { segnale: controller.signal });
    expect(motoreOcr.riconosci).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ segnale: controller.signal }));
  });

  it('IMMAGINE_TROPPO_GRANDE oltre i 12MB, senza invocare la pipeline', async () => {
    const decodificatore: DecodificatoreBarcode = { disponibile: vi.fn(async () => true), decodifica: vi.fn(async () => []) };
    const motoreOcr: MotoreOcr = { precarica: vi.fn(async () => {}), riconosci: vi.fn(async () => []) };
    const lettore = creaLettoreRicetta(decodificatore, motoreOcr);

    const fotoGrande = fotoFinta({ immagine: { size: 13 * 1024 * 1024, type: 'image/jpeg' } as unknown as Blob });
    const risultato = await lettore.leggi(fotoGrande);
    expect(risultato.esito).toBe('errore');
    if (risultato.esito === 'errore') {
      expect(risultato.errore.codice).toBe('IMMAGINE_TROPPO_GRANDE');
      expect(risultato.errore.recupero.tipo).toBe('rifaiFoto');
    }
    expect(decodificatore.decodifica).not.toHaveBeenCalled();
  });

  it('FORMATO_NON_SUPPORTATO per un tipo di file non ammesso', async () => {
    const decodificatore: DecodificatoreBarcode = { disponibile: vi.fn(async () => true), decodifica: vi.fn(async () => []) };
    const motoreOcr: MotoreOcr = { precarica: vi.fn(async () => {}), riconosci: vi.fn(async () => []) };
    const lettore = creaLettoreRicetta(decodificatore, motoreOcr);

    const fotoStrana = fotoFinta({ immagine: new Blob(['x'], { type: 'application/pdf' }) });
    const risultato = await lettore.leggi(fotoStrana);
    expect(risultato.esito).toBe('errore');
    if (risultato.esito === 'errore') expect(risultato.errore.codice).toBe('FORMATO_NON_SUPPORTATO');
  });

  it('LETTURA_IN_TIMEOUT dopo 20s se la pipeline non risponde (timer finti)', async () => {
    vi.useFakeTimers();
    const decodificatore: DecodificatoreBarcode = {
      disponibile: vi.fn(async () => true),
      decodifica: vi.fn(() => new Promise<never>(() => {})),
    };
    const motoreOcr: MotoreOcr = { precarica: vi.fn(async () => {}), riconosci: vi.fn(async () => []) };
    const lettore = creaLettoreRicetta(decodificatore, motoreOcr);

    const promessa = lettore.leggi(fotoFinta());
    await vi.advanceTimersByTimeAsync(20_000);
    const risultato = await promessa;
    expect(risultato.esito).toBe('errore');
    if (risultato.esito === 'errore') {
      expect(risultato.errore.codice).toBe('LETTURA_IN_TIMEOUT');
      expect(risultato.errore.recupero.tipo).toBe('inserimentoGuidato');
    }
  });

  it('non importa nulla da src/fixtures/letture/ (ADR-0004)', () => {
    const contenuto = fs.readFileSync(path.resolve(__dirname, 'LettoreRicetta.ts'), 'utf-8');
    const righeImport = contenuto.split('\n').filter((riga) => /^\s*import /.test(riga));
    expect(righeImport.some((riga) => /fixtures\/letture/.test(riga))).toBe(false);
  });
});
