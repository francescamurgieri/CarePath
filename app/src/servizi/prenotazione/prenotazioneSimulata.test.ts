/**
 * servizi/prenotazione/prenotazioneSimulata.test.ts — T-20.
 * Da `docs/scenarios/scelta_appuntamento.feature` (tutti e 5 gli scenari). ADR-0007,
 * architecture.md §4.5. Al momento in cui questo file è stato scritto, `prenotazioneSimulata`
 * e `ServizioPrenotazione` non esistono ancora: il test è rosso finché T-22 non li implementa.
 *
 * I due scenari "Anna viene richiesta solo di una preferenza" e "Anna sceglie un
 * appuntamento e torna indietro" descrivono comportamento di navigazione/UI (S-06, S-07):
 * qui sono tradotti nell'invariante di servizio più vicino che li rende veri (AC-05.3,
 * ripetibilità/determinismo), non riscritti come test end-to-end — quelli spettano al
 * livello schermata (fuori dal filone "prenotazione").
 */
import { describe, expect, it } from 'vitest';
import type {
  AreaAsl,
  ClassePriorita,
  Esenzione,
  Nre,
  Prestazione,
  RichiestaPrenotazione,
  RichiestaProposte,
  RicettaConfermata,
} from '../../dominio/tipi';
import { creaServizioPrenotazioneSimulata } from './prenotazioneSimulata';

// ---------------------------------------------------------------------------------------
// Fixture di test: `RicettaConfermata` è un tipo opaco (marchio non esportato, tipi.ts §3.4)
// costruibile solo da `confermaLettura()` in produzione. Qui, isolati in questo file di
// test, si costruisce un valore equivalente con un cast esplicito: è la via prevista per
// testare un servizio a valle senza dipendere dal costruttore del dominio (fuori dal
// filone "prenotazione" di questo task).
// ---------------------------------------------------------------------------------------

const NRE_FITTIZIO: Nre = { segmentoA: '01022', segmentoB: '4518061015', completo: '010224518061015' };

const PRESTAZIONE_FITTIZIA: Prestazione = {
  etichettaSemplice: 'Visita ortopedica di controllo',
  testoOriginale: 'VISITA ORTOPEDICA DI CONTROLLO',
  codiceNomenclatore: '89.01.G',
  branca: 'Ortopedia',
  brancheAggiuntive: [],
};

function creaRicettaConfermataFittizia(sovrascritture: {
  classePriorita?: ClassePriorita | null;
  areaAsl?: AreaAsl | null;
  esenzione?: Esenzione | null;
} = {}): RicettaConfermata {
  return {
    nre: NRE_FITTIZIO,
    prestazione: PRESTAZIONE_FITTIZIA,
    classePriorita: sovrascritture.classePriorita ?? null,
    esenzione: sovrascritture.esenzione ?? null,
    areaAsl: sovrascritture.areaAsl ?? null,
    campiVerificatiDallaPersona: [],
    campiInseritiDallaPersona: [],
  } as unknown as RicettaConfermata;
}

const OGGI = new Date('2024-10-14T00:00:00.000Z');

function creaRichiestaProposte(sovrascritture: Partial<RichiestaProposte> = {}): RichiestaProposte {
  return {
    ricetta: creaRicettaConfermataFittizia(),
    preferenza: 'prima_data',
    riferimentoTemporale: OGGI,
    massimoProposte: 3,
    ...sovrascritture,
  };
}

describe('servizi/prenotazione/prenotazioneSimulata — scelta_appuntamento.feature', () => {
  it('Anna viene richiesta solo di una preferenza', async () => {
    // Invariante di servizio dietro la schermata (AC-05.3): l'unico input che varia il
    // risultato è la preferenza; nessun campo di branca o di struttura è richiesto in
    // ingresso, e nessuna branca/nomenclatore compare mai in uscita.
    const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0 });
    const richiesta = creaRichiestaProposte({ preferenza: 'prima_data' });

    const risultato = await servizio.cercaProposte(richiesta);

    expect(risultato.esito).toBe('ok');
    if (risultato.esito !== 'ok') return;
    for (const proposta of risultato.valore) {
      expect(['La prima data disponibile', 'Più vicino a casa']).toContain(proposta.etichetta);
      expect(Object.keys(proposta.struttura)).not.toContain('branca');
      expect(Object.keys(proposta.struttura)).not.toContain('codiceNomenclatore');
    }
  });

  it('Anna sceglie "Fare presto" e vede le proposte', async () => {
    const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0 });
    const richiesta = creaRichiestaProposte({
      preferenza: 'prima_data',
      massimoProposte: 3,
      ricetta: creaRicettaConfermataFittizia({ classePriorita: { lettera: 'D', finestraMassimaGiorni: 30 } }),
    });

    const risultato = await servizio.cercaProposte(richiesta);

    expect(risultato.esito).toBe('ok');
    if (risultato.esito !== 'ok') return;
    expect(risultato.valore.length).toBeLessThanOrEqual(3);
    expect(risultato.valore.length).toBeGreaterThan(0);

    for (const proposta of risultato.valore) {
      expect(proposta.inizio).toBeInstanceOf(Date);
      expect(proposta.struttura.denominazione.length).toBeGreaterThan(0);
      expect(proposta.struttura.indirizzo.length).toBeGreaterThan(0);
      // Nessun codice o sigla di nomenclatore nei dati mostrabili della scheda.
      expect(proposta.struttura.denominazione).not.toMatch(/\d/);
      // Rispetta i tempi scritti sulla ricetta (AC-05.5): finestra D = 30 giorni.
      expect(proposta.giorniDiAttesa).toBeLessThanOrEqual(30);
    }

    // Ordinate per prima data disponibile.
    const giorni = risultato.valore.map((p) => p.giorniDiAttesa);
    expect(giorni).toEqual([...giorni].sort((a, b) => a - b));
  });

  it('Anna sceglie "Stare vicino a casa" senza dover dire dove abita', async () => {
    const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0 });
    const areaAslDiAnna: AreaAsl = { codice: 'ASL-TO3', denominazione: 'ASL Città di Torino' };
    const richiesta = creaRichiestaProposte({
      preferenza: 'vicino_casa',
      ricetta: creaRicettaConfermataFittizia({ areaAsl: areaAslDiAnna }),
    });

    // Il tipo stesso lo garantisce: `RichiestaProposte` non ha un campo indirizzo/comune da
    // compilare. Qui si verifica anche a runtime che il filtro avvenga sull'area sanitaria
    // già nota dalla ricetta, non su un dato inserito da Anna.
    const risultato = await servizio.cercaProposte(richiesta);

    expect(risultato.esito).toBe('ok');
    if (risultato.esito !== 'ok') return;
    expect(risultato.valore.length).toBeGreaterThan(0);
    for (const proposta of risultato.valore) {
      expect(proposta.struttura.codiceAsl).toBe('ASL-TO3');
    }
  });

  it('Anna sceglie un appuntamento e torna indietro', async () => {
    // A livello di servizio l'invariante corrispondente è la ripetibilità: rifare la
    // stessa richiesta (come accade tornando da S-07 a S-06 e di nuovo avanti, senza una
    // nuova foto né una nuova lettura) restituisce lo stesso risultato deterministico.
    const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0 });
    const richiesta = creaRichiestaProposte({ preferenza: 'prima_data' });

    const primaVolta = await servizio.cercaProposte(richiesta);
    const secondaVolta = await servizio.cercaProposte(richiesta);

    expect(primaVolta).toEqual(secondaVolta);
  });

  it('Non ci sono appuntamenti disponibili nei prossimi 30 giorni', async () => {
    const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0 });
    const areaAslSenzaStrutture: AreaAsl = { codice: 'ASL-INESISTENTE', denominazione: 'Area non coperta' };
    const richiesta = creaRichiestaProposte({
      preferenza: 'vicino_casa',
      ricetta: creaRicettaConfermataFittizia({ areaAsl: areaAslSenzaStrutture }),
    });

    const risultato = await servizio.cercaProposte(richiesta);

    expect(risultato.esito).toBe('errore');
    if (risultato.esito !== 'errore') return;
    expect(risultato.errore.codice).toBe('NESSUNA_DISPONIBILITA');
    // "vede il numero di telefono del CUP da chiamare" + "non un errore tecnico senza spiegazione"
    expect(risultato.errore.recupero).toEqual({
      tipo: 'contattoTelefonico',
      etichetta: 'Chiama il CUP',
      telefono: '800 000 000',
    });
    expect(risultato.errore.messaggioPerLaPersona).not.toMatch(/undefined|null|NaN|Error/i);
  });

  describe('invarianti aggiuntivi del contratto (architecture.md §4.5, ADR-0007)', () => {
    it('AC-05.1 — non restituisce mai più proposte di massimoProposte', async () => {
      const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0 });
      const richiesta = creaRichiestaProposte({ massimoProposte: 2 });

      const risultato = await servizio.cercaProposte(richiesta);

      expect(risultato.esito).toBe('ok');
      if (risultato.esito !== 'ok') return;
      expect(risultato.valore.length).toBeLessThanOrEqual(2);
    });

    it('AC-05.5 — con classePriorita non letta usa la finestra più larga (P) e non filtra', async () => {
      const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0 });
      const richiesta = creaRichiestaProposte({
        massimoProposte: 3,
        ricetta: creaRicettaConfermataFittizia({ classePriorita: null }),
      });

      const risultato = await servizio.cercaProposte(richiesta);

      expect(risultato.esito).toBe('ok');
      if (risultato.esito !== 'ok') return;
      // Anche lo slot più lontano nella fixture (20 giorni) resta ammissibile: nessun filtro.
      expect(risultato.valore.length).toBeGreaterThan(0);
    });

    it('AC-06.5/ADR-0007 — conferma() restituisce sempre `simulazione` valorizzata', async () => {
      const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0, latenzaConfermaMs: 0 });
      const proposteResult = await servizio.cercaProposte(creaRichiestaProposte());
      expect(proposteResult.esito).toBe('ok');
      if (proposteResult.esito !== 'ok') return;

      const richiestaPrenotazione: RichiestaPrenotazione = {
        ricetta: creaRicettaConfermataFittizia(),
        proposta: proposteResult.valore[0],
        assensoEsplicito: true,
      };

      const risultato = await servizio.conferma(richiestaPrenotazione);

      expect(risultato.esito).toBe('ok');
      if (risultato.esito !== 'ok') return;
      expect(risultato.valore.simulazione).toEqual({
        simulata: true,
        dichiarazione: expect.stringContaining('simulata'),
      });
      expect(risultato.valore.codiceRaggruppato).toMatch(/^PRE · \d{4} · \d{4} · \d{4}$/);
    });

    it('a latenzaMs = 0 il servizio è sincrono e ripetibile (nessun timer finto necessario)', async () => {
      const servizio = creaServizioPrenotazioneSimulata({ latenzaCercaMs: 0, latenzaConfermaMs: 0 });
      const richiesta = creaRichiestaProposte();

      const [primo, secondo] = await Promise.all([
        servizio.cercaProposte(richiesta),
        servizio.cercaProposte(richiesta),
      ]);

      expect(primo).toEqual(secondo);
    });
  });
});
