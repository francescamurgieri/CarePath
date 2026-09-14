import { describe, it, expect } from 'vitest';
import type { CampoLetto } from './tipi';

/**
 * T-04 — Test di tipo per i contratti di `tipi.ts` (ADR-0006).
 * Non verifica comportamento a runtime: verifica che certe scritture NON compilino.
 * Se un giorno `// @ts-expect-error` smettesse di essere necessario, `tsc -b` fallirebbe
 * (l'errore soppresso non si verifica più) — è il modo in cui l'invariante resta protetto.
 */
describe('CampoLetto<T> — invarianti di tipo (AC-02.3, AC-02.4)', () => {
  it('un campo nonLetto non ha .valore leggibile (AC-02.3: non si può indovinare)', () => {
    const campo: CampoLetto<string> = { stato: 'nonLetto', confidenza: 0.1, origine: 'ocr', riquadro: null };
    if (campo.stato === 'nonLetto') {
      // @ts-expect-error — un campo `nonLetto` non ha `valore`: leggerlo non deve compilare.
      const tentativo = campo.valore;
      expect(tentativo).toBeUndefined();
    }
  });

  it('un campo daVerificare richiede sempre il riquadro (AC-02.4)', () => {
    // @ts-expect-error — `daVerificare` senza `riquadro` non deve compilare.
    const campo: CampoLetto<string> = {
      stato: 'daVerificare',
      valore: 'X',
      citazioneOriginale: 'X',
      confidenza: 0.7,
      origine: 'ocr',
    };
    expect(campo).toBeTruthy();
  });

  it('un campo certo si costruisce e si legge normalmente', () => {
    const campo: CampoLetto<string> = {
      stato: 'certo',
      valore: 'ABC',
      citazioneOriginale: 'ABC',
      confidenza: 1,
      origine: 'barcode',
      riquadro: null,
    };
    expect(campo.stato === 'certo' && campo.valore).toBe('ABC');
  });
});
