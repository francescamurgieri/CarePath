/**
 * stato/macchinaSessione.test.ts — T-23.
 *
 * Da `scenarios/prenotazione.feature`, scenario "Anna può tornare indietro senza perdere la
 * foto" (AC-07.2, AC-07.3, AC-03.4; ADR-0006 §5). Al momento di scrivere questo file
 * `macchinaSessione` non esiste ancora: l'import fallisce, il file è rosso (T-24 lo rende
 * verde).
 *
 * Nota su `RicettaConfermata`: è un tipo opaco costruibile solo da `confermaLettura()`
 * (`src/dominio/`, ADR-0006 §2) — funzione non ancora scritta in questa onda e fuori dal
 * perimetro di questo task (che tocca solo `src/stato/**`). Per costruire una fixture di
 * test si usa qui un cast locale e dichiarato, contenuto in questo file: non aggira il
 * contratto in produzione (il reducer non costruisce mai `RicettaConfermata`, si limita a
 * conservare quella che riceve), ma è comunque uno scostamento dall'indicazione di ADR-0006
 * ("si fornisce un helper di test dedicato, non un cast") — il vero helper condiviso spetta
 * a chi implementa `confermaLettura()` (T-14 o affine) e va segnalato come decisione aperta.
 */
import { describe, it, expect } from 'vitest';
import type { AcquisizioneFoto, LetturaRicetta, PropostaAppuntamento, RicettaConfermata } from '../dominio/tipi';
import { creaStatoIniziale, macchinaSessione, type AzioneSessione } from './macchinaSessione';

function riduci(azioni: AzioneSessione[]) {
  return azioni.reduce(macchinaSessione, creaStatoIniziale());
}

const fotoDiTest: AcquisizioneFoto = {
  immagine: new Blob(['finta-immagine'], { type: 'image/jpeg' }),
  anteprimaUrl: 'blob:test-anteprima',
  larghezzaPx: 1200,
  altezzaPx: 1600,
  acquisitaIl: new Date('2026-09-14T09:00:00Z'),
  sorgente: 'fotocamera',
};

const secondaFotoDiTest: AcquisizioneFoto = {
  ...fotoDiTest,
  anteprimaUrl: 'blob:test-anteprima-2',
  acquisitaIl: new Date('2026-09-14T09:05:00Z'),
};

const letturaDiTest: LetturaRicetta = {
  idLettura: 'lettura-test-1',
  nre: {
    stato: 'certo',
    valore: { segmentoA: '12345', segmentoB: '6789012345', completo: '123456789012345' },
    citazioneOriginale: '12345 6789012345',
    confidenza: 1,
    origine: 'barcode',
    riquadro: null,
  },
  prestazione: {
    stato: 'certo',
    valore: {
      etichettaSemplice: 'Visita ortopedica di controllo',
      testoOriginale: 'VISITA ORTOPEDICA DI CONTROLLO',
      codiceNomenclatore: '89.01.G',
      branca: 'Ortopedia',
      brancheAggiuntive: [],
    },
    citazioneOriginale: 'VISITA ORTOPEDICA DI CONTROLLO',
    confidenza: 0.95,
    origine: 'ocr',
    riquadro: null,
  },
  classePriorita: { stato: 'certo', valore: { lettera: 'P', finestraMassimaGiorni: 180 }, citazioneOriginale: 'P', confidenza: 0.9, origine: 'ocr', riquadro: null },
  esenzione: { stato: 'nonLetto', confidenza: 0.2, origine: 'ocr', riquadro: null },
  areaAsl: { stato: 'nonLetto', confidenza: 0.1, origine: 'ocr', riquadro: null },
  prestazioniMultiple: false,
  contenutoClinicoEscluso: false,
  puoProcedere: true,
  motoriUsati: ['barcode-zxing', 'ocr-tesseract'],
  durataMs: 4200,
};

/**
 * Fixture di test per `RicettaConfermata`. Vedi nota di testa del file: cast locale,
 * dichiarato, in attesa del vero `confermaLettura()`.
 */
function creaRicettaConfermataDiTest(campiInseritiDallaPersona: ReadonlyArray<keyof LetturaRicetta> = []): RicettaConfermata {
  return {
    nre: letturaDiTest.nre.stato !== 'nonLetto' ? letturaDiTest.nre.valore : undefined,
    prestazione: letturaDiTest.prestazione.stato !== 'nonLetto' ? letturaDiTest.prestazione.valore : undefined,
    classePriorita: letturaDiTest.classePriorita.stato !== 'nonLetto' ? letturaDiTest.classePriorita.valore : null,
    esenzione: null,
    areaAsl: null,
    campiVerificatiDallaPersona: [],
    campiInseritiDallaPersona,
  } as unknown as RicettaConfermata;
}

const propostaDiTest: PropostaAppuntamento = {
  id: 'proposta-1',
  etichetta: 'La prima data disponibile',
  inizio: new Date('2026-09-20T10:00:00Z'),
  struttura: {
    id: 'struttura-1',
    denominazione: 'Poliambulatorio Torino Nord',
    indirizzo: 'Via delle Rose 45',
    comune: 'Torino',
    codiceAsl: 'TO3',
  },
  giorniDiAttesa: 6,
  ticket: { dovuto: false, motivo: 'esente' },
};

describe('macchinaSessione — navigazione in avanti (architecture.md §2)', () => {
  it('parte da S-01 con percorso a un solo elemento', () => {
    const stato = creaStatoIniziale();
    expect(stato.schermoCorrente).toBe('S-01');
    expect(stato.percorso).toEqual(['S-01']);
  });

  it('FOTO_ACQUISITA porta a S-03 e imposta la foto', () => {
    const stato = riduci([{ tipo: 'FOTO_ACQUISITA', foto: fotoDiTest }]);
    expect(stato.schermoCorrente).toBe('S-03');
    expect(stato.foto).toEqual(fotoDiTest);
  });

  it('LETTURA_COMPLETATA instrada su S-04 quando puoProcedere è true', () => {
    const stato = riduci([
      { tipo: 'FOTO_ACQUISITA', foto: fotoDiTest },
      { tipo: 'LETTURA_COMPLETATA', lettura: letturaDiTest },
    ]);
    expect(stato.schermoCorrente).toBe('S-04');
    expect(stato.lettura).toEqual(letturaDiTest);
  });

  it('LETTURA_COMPLETATA instrada su S-04b quando puoProcedere è false', () => {
    const letturaParziale: LetturaRicetta = { ...letturaDiTest, puoProcedere: false };
    const stato = riduci([
      { tipo: 'FOTO_ACQUISITA', foto: fotoDiTest },
      { tipo: 'LETTURA_COMPLETATA', lettura: letturaParziale },
    ]);
    expect(stato.schermoCorrente).toBe('S-04b');
  });
});

describe('macchinaSessione — "Anna può tornare indietro senza perdere la foto" (prenotazione.feature)', () => {
  function statoConVisitaConfermata() {
    return riduci([
      { tipo: 'FOTO_ACQUISITA', foto: fotoDiTest },
      { tipo: 'LETTURA_COMPLETATA', lettura: letturaDiTest },
      { tipo: 'LETTURA_CONFERMATA', ricetta: creaRicettaConfermataDiTest() },
      { tipo: 'PREFERENZA_SCELTA', preferenza: 'prima_data' },
      { tipo: 'PROPOSTE_RICEVUTE', proposte: [propostaDiTest] },
      { tipo: 'PROPOSTA_SCELTA', proposta: propostaDiTest },
    ]);
  }

  it('torna da S-08 a S-07 senza perdere lettura, ricetta o foto', () => {
    const primaDelRitorno = statoConVisitaConfermata();
    expect(primaDelRitorno.schermoCorrente).toBe('S-08');

    const dopoIlRitorno = macchinaSessione(primaDelRitorno, { tipo: 'TORNA_INDIETRO' });

    expect(dopoIlRitorno.schermoCorrente).toBe('S-07');
    expect(dopoIlRitorno.foto).toEqual(fotoDiTest);
    expect(dopoIlRitorno.lettura).toEqual(letturaDiTest);
    expect(dopoIlRitorno.ricetta).not.toBeNull();
    expect(dopoIlRitorno.ricetta?.prestazione.etichettaSemplice).toBe('Visita ortopedica di controllo');
  });

  it('tornando indietro ancora, fino alla conferma della visita, la ricetta e la foto restano', () => {
    let stato = statoConVisitaConfermata(); // S-08
    stato = macchinaSessione(stato, { tipo: 'TORNA_INDIETRO' }); // S-07
    stato = macchinaSessione(stato, { tipo: 'TORNA_INDIETRO' }); // S-06
    stato = macchinaSessione(stato, { tipo: 'TORNA_INDIETRO' }); // S-04 (conferma lettura)

    expect(stato.schermoCorrente).toBe('S-04');
    expect(stato.ricetta?.prestazione.etichettaSemplice).toBe('Visita ortopedica di controllo');
    expect(stato.foto).toEqual(fotoDiTest);
    // AC-07.2: nessun altro campo è stato azzerato da un semplice "torna indietro".
    expect(stato.preferenza).toBe('prima_data');
    expect(stato.propostaScelta).toEqual(propostaDiTest);
  });

  it('TORNA_INDIETRO non oltrepassa l’inizio del percorso', () => {
    const stato = macchinaSessione(creaStatoIniziale(), { tipo: 'TORNA_INDIETRO' });
    expect(stato.schermoCorrente).toBe('S-01');
    expect(stato.percorso).toEqual(['S-01']);
  });
});

describe('macchinaSessione — solo una nuova acquisizione in S-02 azzera `lettura` (AC-03.4)', () => {
  it('una nuova FOTO_ACQUISITA azzera `lettura` ma non tocca `ricetta`', () => {
    const ricettaConInserimentoManuale = creaRicettaConfermataDiTest(['nre']);
    let stato = riduci([
      { tipo: 'FOTO_ACQUISITA', foto: fotoDiTest },
      { tipo: 'LETTURA_COMPLETATA', lettura: letturaDiTest },
      { tipo: 'LETTURA_CONFERMATA', ricetta: ricettaConInserimentoManuale },
    ]);
    expect(stato.lettura).not.toBeNull();
    expect(stato.ricetta).not.toBeNull();

    stato = macchinaSessione(stato, { tipo: 'FOTO_ACQUISITA', foto: secondaFotoDiTest });

    expect(stato.lettura).toBeNull();
    expect(stato.foto).toEqual(secondaFotoDiTest);
    // `campiInseritiDallaPersona` sopravvive alla nuova foto perché `ricetta` non viene toccata.
    expect(stato.ricetta).not.toBeNull();
    expect(stato.ricetta?.campiInseritiDallaPersona).toEqual(['nre']);
  });

  it('nessun\'altra azione azzera `lettura`', () => {
    let stato = riduci([
      { tipo: 'FOTO_ACQUISITA', foto: fotoDiTest },
      { tipo: 'LETTURA_COMPLETATA', lettura: letturaDiTest },
      { tipo: 'LETTURA_CONFERMATA', ricetta: creaRicettaConfermataDiTest() },
      { tipo: 'PREFERENZA_SCELTA', preferenza: 'vicino_casa' },
    ]);
    stato = macchinaSessione(stato, { tipo: 'TORNA_INDIETRO' });
    expect(stato.lettura).not.toBeNull();
  });
});

describe('macchinaSessione — arco irreversibile (AC-07.3)', () => {
  it('PRENOTAZIONE_CONFERMATA porta a S-09 e registra la conferma', () => {
    const prenotazioneDiTest = {
      codice: 'PRE20241022001',
      codiceRaggruppato: 'PRE · 2024 · 1022 · 001',
      appuntamento: propostaDiTest,
      prestazione: letturaDiTest.prestazione.stato !== 'nonLetto' ? letturaDiTest.prestazione.valore : undefined!,
      cosaPortare: ['Tessera sanitaria'],
      comeDisdire: { testo: 'Chiami il numero indicato', telefono: '800 000 000' },
      simulazione: { simulata: true as const, dichiarazione: 'Prenotazione simulata a scopo dimostrativo.' },
    };
    const stato = riduci([
      { tipo: 'FOTO_ACQUISITA', foto: fotoDiTest },
      { tipo: 'LETTURA_COMPLETATA', lettura: letturaDiTest },
      { tipo: 'LETTURA_CONFERMATA', ricetta: creaRicettaConfermataDiTest() },
      { tipo: 'PREFERENZA_SCELTA', preferenza: 'prima_data' },
      { tipo: 'PROPOSTA_SCELTA', proposta: propostaDiTest },
      { tipo: 'PRENOTAZIONE_CONFERMATA', prenotazione: prenotazioneDiTest },
    ]);
    expect(stato.schermoCorrente).toBe('S-09');
    expect(stato.prenotazione).toEqual(prenotazioneDiTest);
  });
});
