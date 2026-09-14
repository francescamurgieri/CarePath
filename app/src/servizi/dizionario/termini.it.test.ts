import { describe, it, expect } from 'vitest';
import { spiega, spiegaLetteraPriorita, type Termine } from './termini.it';

const TUTTI_I_TERMINI: Termine[] = ['nre', 'branca', 'classePriorita', 'strutturaErogatrice', 'esenzione', 'regime'];

function contaFrasi(testo: string): number {
  return (testo.match(/\./g) ?? []).length;
}

describe('servizi/dizionario/termini.it — spiega() (AC-04.1, AC-04.2, AC-04.4, M2)', () => {
  it.each(TUTTI_I_TERMINI)('%s ha una spiegazione revisionata da un umano, di al massimo 2 frasi', (termine) => {
    const spiegazione = spiega(termine);
    expect(spiegazione.revisionataDa).toBe('umano');
    expect(spiegazione.titolo.length).toBeGreaterThan(0);
    expect(contaFrasi(spiegazione.testo)).toBeLessThanOrEqual(2);
    expect(spiegazione.testo.length).toBeGreaterThan(0);
  });

  it('nessun Termine resta senza spiegazione (il compilatore rifiuta un Record incompleto)', () => {
    for (const termine of TUTTI_I_TERMINI) {
      expect(() => spiega(termine)).not.toThrow();
    }
  });

  it('Anna chiede "Che significa NRE?" — spiegazione senza gergo tecnico, dice cosa fare a lei', () => {
    const spiegazione = spiega('nre');
    expect(spiegazione.testo).toMatch(/non devi copiarlo tu/i);
  });
});

describe('servizi/dizionario/termini.it — spiegaLetteraPriorita (AC-04.3, G-01)', () => {
  it('Anna chiede la spiegazione della classe di priorità "D"', () => {
    const testo = spiegaLetteraPriorita({ lettera: 'D', finestraMassimaGiorni: 30 });
    expect(testo).toContain('D vuol dire "differibile"');
    expect(testo).toContain('entro 30 giorni');
  });

  it('la spiegazione non contiene parole come "urgente", "grave" o "clinico" (guardrail G-01)', () => {
    const testo = spiegaLetteraPriorita({ lettera: 'D', finestraMassimaGiorni: 30 });
    expect(testo.toLowerCase()).not.toMatch(/urgente/);
    expect(testo.toLowerCase()).not.toMatch(/\bgrave\b/);
    expect(testo.toLowerCase()).not.toMatch(/clinico/);
  });

  it('la spiegazione non dice nulla sulla gravità della situazione di salute della persona', () => {
    const testo = spiegaLetteraPriorita({ lettera: 'D', finestraMassimaGiorni: 30 });
    expect(testo).toMatch(/non riguarda la gravità della tua situazione/i);
  });
});
