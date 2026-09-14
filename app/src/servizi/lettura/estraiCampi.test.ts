import { describe, it, expect } from 'vitest';
import { estraiCampi } from './estraiCampi';
import type { ParolaOcr } from './motoreOcr';
import type { BarcodeLetto } from './decodificatoreBarcode';
import nominale from '../../fixtures/letture/nominale.json';

const DIMENSIONI = { larghezzaPx: 1000, altezzaPx: 1400 };

function parola(testo: string, confidenza: number, y: number, x = 0.1): ParolaOcr {
  return { testo, confidenza, riquadro: { x, y, larghezza: 0.1 * testo.length, altezza: 0.02 } };
}

function barcode(testo: string, x: number): BarcodeLetto {
  return { formato: 'CODE_39', testo, riquadro: { x, y: 0.05, larghezza: 0.2, altezza: 0.03 } };
}

describe('servizi/lettura/estraiCampi — percorso nominale (conferma_visita.feature)', () => {
  const lettura = estraiCampi(
    nominale.parole as ParolaOcr[],
    nominale.barcodes as BarcodeLetto[],
    nominale.dimensioni,
  );

  it('Il sistema mostra la visita in parole semplici', () => {
    expect(lettura.prestazione.stato).toBe('certo');
    if (lettura.prestazione.stato !== 'nonLetto') {
      expect(lettura.prestazione.valore.etichettaSemplice).toBe('Visita ortopedica di controllo');
    }
    expect(lettura.puoProcedere).toBe(true);
  });

  it('Il testo originale della ricetta è sempre disponibile', () => {
    if (lettura.prestazione.stato !== 'nonLetto') {
      expect(lettura.prestazione.citazioneOriginale).toMatch(/VISITA ORTOPEDICA DI CONTROLLO — 89\.01\.G/);
    }
  });

  it('Anna chiede "Che significa NRE?" — il codice ricostruito è di 15 caratteri, a gruppi (AC-01.4)', () => {
    expect(lettura.nre.stato).toBe('certo');
    if (lettura.nre.stato !== 'nonLetto') {
      expect(lettura.nre.valore.completo).toBe('010A24518061015');
      expect(lettura.nre.valore.segmentoA).toBe('010A2');
      expect(lettura.nre.valore.segmentoB).toBe('4518061015');
    }
  });

  it('la classe di priorità "D" è letta senza che Anna debba inserirla (D-01 chiuso)', () => {
    expect(lettura.classePriorita.stato).toBe('certo');
    if (lettura.classePriorita.stato !== 'nonLetto') {
      expect(lettura.classePriorita.valore.lettera).toBe('D');
      expect(lettura.classePriorita.valore.finestraMassimaGiorni).toBe(30);
    }
  });

  it('area ASL ed esenzione sono lette dalla ricetta (D-06, nessun campo indirizzo)', () => {
    expect(lettura.areaAsl.stato).toBe('certo');
    expect(lettura.esenzione.stato).toBe('certo');
  });

  it('traccia quali motori hanno prodotto la lettura (G-04, RD-03)', () => {
    expect(lettura.motoriUsati).toContain('barcode-zxing');
    expect(lettura.motoriUsati).toContain('ocr-tesseract');
  });
});

describe('servizi/lettura/estraiCampi — fallback_foto.feature', () => {
  it('La foto è troppo scura e il sistema non riesce a leggere il codice', () => {
    const lettura = estraiCampi([], [], DIMENSIONI);
    expect(lettura.nre.stato).toBe('nonLetto');
    expect(lettura.puoProcedere).toBe(false);
  });

  it('La lettura è parziale — un campo è incerto', () => {
    // Il barcode del primo segmento è letto; il secondo manca e viene tentato via OCR con
    // una confidenza intermedia (ADR-0005: 0.60 <= c < 0.85 -> daVerificare).
    const barcodes = [barcode('010A2', 0.1)];
    const parole = [parola('4518061015', 0.7, 0.05, 0.4), parola('VISITA', 0.9, 0.2), parola('DI', 0.9, 0.2, 0.2), parola('CONTROLLO', 0.9, 0.2, 0.3)];
    const lettura = estraiCampi(parole, barcodes, DIMENSIONI);

    expect(lettura.nre.stato).toBe('daVerificare');
    if (lettura.nre.stato === 'daVerificare') {
      expect(lettura.nre.riquadro).toBeTruthy();
      expect(lettura.nre.valore.completo).toBe('010A24518061015');
    }
  });

  it('un campo sotto la confidenza minima resta nonLetto (ADR-0005)', () => {
    const barcodes = [barcode('010A2', 0.1)];
    const parole = [parola('4518061015', 0.4, 0.05, 0.4)];
    const lettura = estraiCampi(parole, barcodes, DIMENSIONI);
    expect(lettura.nre.stato).toBe('nonLetto');
  });
});

describe('servizi/lettura/estraiCampi — prestazione non letta (US-03, S-04b)', () => {
  it('senza alcuna riga "visita" riconoscibile, la prestazione è nonLetto e il sistema non la deduce', () => {
    const parole = [parola('TESTO ILLEGGIBILE', 0.9, 0.2)];
    const lettura = estraiCampi(parole, [barcode('010A2', 0.1), barcode('4518061015', 0.4)], DIMENSIONI);
    expect(lettura.prestazione.stato).toBe('nonLetto');
    expect(lettura.puoProcedere).toBe(false);
  });
});

describe('servizi/lettura/estraiCampi — La ricetta contiene più di una prestazione', () => {
  it('La ricetta contiene più di una prestazione', () => {
    const parole = [
      parola('VISITA ORTOPEDICA DI CONTROLLO', 0.9, 0.2),
      parola('VISITA OCULISTICA', 0.9, 0.3),
    ];
    const lettura = estraiCampi(parole, [barcode('010A2', 0.1), barcode('4518061015', 0.4)], DIMENSIONI);

    expect(lettura.prestazioniMultiple).toBe(true);
    expect(lettura.puoProcedere).toBe(false);
    expect(lettura.prestazioniMultipleTestoOriginale).toEqual([
      'VISITA ORTOPEDICA DI CONTROLLO',
      'VISITA OCULISTICA',
    ]);
  });
});

describe('servizi/lettura/estraiCampi — filtro clinico (G-01, ADR-0009)', () => {
  it('un quesito diagnostico viene escluso dalla pipeline e non entra nella prestazione mostrata', () => {
    const parole = [
      parola('VISITA ORTOPEDICA DI CONTROLLO', 0.9, 0.2),
      parola('QUESITO DIAGNOSTICO SOSPETTA LESIONE MENISCO', 0.9, 0.3),
    ];
    const lettura = estraiCampi(parole, [barcode('010A2', 0.1), barcode('4518061015', 0.4)], DIMENSIONI);

    expect(lettura.contenutoClinicoEscluso).toBe(true);
    if (lettura.prestazione.stato !== 'nonLetto') {
      expect(lettura.prestazione.valore.etichettaSemplice.toLowerCase()).not.toMatch(/menisco/);
    }
  });
});
