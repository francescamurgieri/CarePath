import { describe, it, expect } from 'vitest';
import { normalizzaPrestazione, filtroClinico, estraiPrestazione } from './prestazione';

describe('dominio/prestazione — normalizzaPrestazione (G-03, reversibilità)', () => {
  it('normalizza "VISITA ORTOPEDICA DI CONTROLLO — 89.01.G" senza sostituire parole', () => {
    const p = normalizzaPrestazione('VISITA ORTOPEDICA DI CONTROLLO — 89.01.G');
    expect(p.etichettaSemplice).toBe('Visita ortopedica di controllo');
    expect(p.testoOriginale).toBe('VISITA ORTOPEDICA DI CONTROLLO');
    expect(p.codiceNomenclatore).toBe('89.01.G');
    expect(p.branca).toBe('Ortopedia');
    expect(p.brancheAggiuntive).toEqual([]);
  });

  it('test di reversibilità: etichettaSemplice.toUpperCase() è contenuta nel testoOriginale', () => {
    const p = normalizzaPrestazione('VISITA ORTOPEDICA DI CONTROLLO — 89.01.G');
    const senzaSpazi = (s: string) => s.replace(/\s+/g, '');
    expect(senzaSpazi(p.testoOriginale)).toContain(senzaSpazi(p.etichettaSemplice.toUpperCase()));
  });

  it('senza codice a fine stringa, branca resta null e nessun match euristico', () => {
    const p = normalizzaPrestazione('VISITA ORTOPEDICA DI CONTROLLO');
    expect(p.codiceNomenclatore).toBeNull();
    expect(p.branca).toBeNull();
  });
});

describe('dominio/prestazione — filtroClinico (G-01)', () => {
  it('esclude dal flusso il quesito diagnostico e tutto ciò che segue', () => {
    const testo = [
      'VISITA ORTOPEDICA DI CONTROLLO — 89.01.G',
      'QUESITO DIAGNOSTICO: sospetta lesione del menisco',
      'note cliniche riservate',
    ].join('\n');

    const { testoUtile, contenutoClinicoEscluso } = filtroClinico(testo);
    expect(contenutoClinicoEscluso).toBe(true);
    expect(testoUtile).not.toMatch(/menisco/i);
    expect(testoUtile).toMatch(/VISITA ORTOPEDICA DI CONTROLLO/);
  });

  it('una fixture con un quesito diagnostico non produce alcuna etichettaSemplice che lo contenga', () => {
    const testo = [
      'VISITA ORTOPEDICA DI CONTROLLO — 89.01.G',
      'QUESITO DIAGNOSTICO: sospetta lesione del menisco',
    ].join('\n');

    const { prestazione, contenutoClinicoEscluso } = estraiPrestazione(testo);
    expect(contenutoClinicoEscluso).toBe(true);
    expect(prestazione).not.toBeNull();
    expect(prestazione?.etichettaSemplice.toLowerCase()).not.toMatch(/menisco/);
  });

  it('senza marcatori clinici non esclude nulla', () => {
    const { contenutoClinicoEscluso, testoUtile } = filtroClinico('VISITA ORTOPEDICA DI CONTROLLO — 89.01.G');
    expect(contenutoClinicoEscluso).toBe(false);
    expect(testoUtile).toMatch(/VISITA ORTOPEDICA DI CONTROLLO/);
  });
});
