import { describe, it, expect } from 'vitest';
import type { CodiceErrore, ErroreCarePath } from './tipi';
import { COSTRUTTORI_ERRORE } from './errori';

const TUTTI_I_CODICI: CodiceErrore[] = [
  'IMMAGINE_NON_LEGGIBILE',
  'IMMAGINE_TROPPO_GRANDE',
  'FORMATO_NON_SUPPORTATO',
  'LETTURA_IN_TIMEOUT',
  'NRE_NON_TROVATO',
  'NRE_FORMATO_NON_VALIDO',
  'PRESTAZIONI_MULTIPLE',
  'NESSUNA_DISPONIBILITA',
  'PRENOTAZIONE_FALLITA',
  'MOTORE_NON_DISPONIBILE',
];

describe('dominio/errori — ogni CodiceErrore ha un punto di costruzione con recupero (M4)', () => {
  it.each(TUTTI_I_CODICI)('%s produce un ErroreCarePath con recupero e messaggio per la persona', (codice) => {
    const costruttore = COSTRUTTORI_ERRORE[codice];
    expect(costruttore).toBeTypeOf('function');
    const errore: ErroreCarePath = costruttore();
    expect(errore.codice).toBe(codice);
    expect(errore.recupero).toBeTruthy();
    expect(errore.messaggioPerLaPersona.length).toBeGreaterThan(0);
    expect(errore.messaggioPerLaPersona).not.toMatch(/codice non valido/i);
  });

  it('nessun CodiceErrore della tabella §3.7 resta senza costruttore', () => {
    expect(Object.keys(COSTRUTTORI_ERRORE).sort()).toEqual([...TUTTI_I_CODICI].sort());
  });

  it('gli errori del lettore (§4.1) degradano verso rifaiFoto o inserimentoGuidato, mai verso un vicolo cieco', () => {
    const codiciLettore: CodiceErrore[] = [
      'IMMAGINE_TROPPO_GRANDE',
      'FORMATO_NON_SUPPORTATO',
      'LETTURA_IN_TIMEOUT',
      'MOTORE_NON_DISPONIBILE',
      'IMMAGINE_NON_LEGGIBILE',
    ];
    for (const codice of codiciLettore) {
      const errore = COSTRUTTORI_ERRORE[codice]();
      expect(['rifaiFoto', 'inserimentoGuidato']).toContain(errore.recupero.tipo);
    }
  });

  it('NESSUNA_DISPONIBILITA e PRESTAZIONI_MULTIPLE rimandano al CUP telefonico', () => {
    expect(COSTRUTTORI_ERRORE.NESSUNA_DISPONIBILITA().recupero.tipo).toBe('contattoTelefonico');
    expect(COSTRUTTORI_ERRORE.PRESTAZIONI_MULTIPLE().recupero.tipo).toBe('contattoTelefonico');
  });

  it('PRENOTAZIONE_FALLITA offre di riprovare', () => {
    expect(COSTRUTTORI_ERRORE.PRENOTAZIONE_FALLITA().recupero.tipo).toBe('riprova');
  });
});
