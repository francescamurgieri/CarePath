import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  SOGLIA_CERTO,
  SOGLIA_DA_VERIFICARE,
  classificaConfidenzaOcr,
  classificaConfidenzaBarcode,
  normalizzaConfidenzaOcr,
} from './confidenza';

describe('dominio/confidenza — soglie ADR-0005', () => {
  it('espone le costanti attese', () => {
    expect(SOGLIA_CERTO).toBe(0.85);
    expect(SOGLIA_DA_VERIFICARE).toBe(0.6);
  });

  it('classifica certo/daVerificare/nonLetto secondo le soglie', () => {
    expect(classificaConfidenzaOcr(0.9)).toBe('certo');
    expect(classificaConfidenzaOcr(0.85)).toBe('certo');
    expect(classificaConfidenzaOcr(0.7)).toBe('daVerificare');
    expect(classificaConfidenzaOcr(0.6)).toBe('daVerificare');
    expect(classificaConfidenzaOcr(0.59)).toBe('nonLetto');
  });

  it('normalizza la confidenza 0..100 di Tesseract a 0..1', () => {
    expect(normalizzaConfidenzaOcr(87)).toBeCloseTo(0.87);
    expect(normalizzaConfidenzaOcr(0.87)).toBeCloseTo(0.87);
  });

  it('la confidenza del barcode è binaria (ADR-0005 §3)', () => {
    expect(classificaConfidenzaBarcode(true)).toBe('certo');
    expect(classificaConfidenzaBarcode(false)).toBe('nonLetto');
  });

  it('nessun altro file del repository contiene 0.85/0.6 come soglie di confidenza letterali', () => {
    const srcDir = path.resolve(__dirname, '..');
    const offenderPattern = /(SOGLIA|soglia)/; // i soli file che parlano di soglie
    const violazioni: string[] = [];

    function visita(dir: string) {
      for (const voce of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, voce.name);
        if (voce.isDirectory()) {
          visita(p);
        } else if (/\.(ts|tsx)$/.test(voce.name) && !p.endsWith('confidenza.ts') && !p.endsWith('confidenza.test.ts')) {
          const contenuto = fs.readFileSync(p, 'utf-8');
          if (offenderPattern.test(contenuto) && (/\b0\.85\b/.test(contenuto) || /\b0\.6\b/.test(contenuto))) {
            violazioni.push(p);
          }
        }
      }
    }
    visita(srcDir);
    expect(violazioni).toEqual([]);
  });
});
