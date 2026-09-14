import { describe, it, expect } from 'vitest';
import * as priorita from './priorita';
import { finestraMassimaGiorni, costruisciClassePriorita, FINESTRA_PIU_LARGA_GIORNI } from './priorita';

describe('dominio/priorita — finestre organizzative U/B/D/P (AC-04.3, AC-05.5)', () => {
  it('mappa ogni lettera a un numero di giorni', () => {
    expect(finestraMassimaGiorni('U')).toBe(3);
    expect(finestraMassimaGiorni('B')).toBe(10);
    expect(finestraMassimaGiorni('D')).toBe(30);
    expect(finestraMassimaGiorni('P')).toBe(180);
  });

  it('costruisce ClassePriorita conservando la lettera come stampata', () => {
    expect(costruisciClassePriorita('D')).toEqual({ lettera: 'D', finestraMassimaGiorni: 30 });
  });

  it('la finestra più larga (usata quando la priorità non è letta) è quella di P', () => {
    expect(FINESTRA_PIU_LARGA_GIORNI).toBe(180);
  });

  it('il modulo non esporta alcuna stringa di significato clinico: solo funzioni e numeri', () => {
    for (const [nome, valore] of Object.entries(priorita)) {
      expect(['function', 'number'], `export inatteso: ${nome}`).toContain(typeof valore);
    }
  });
});
