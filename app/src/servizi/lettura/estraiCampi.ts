/**
 * servizi/lettura/estraiCampi.ts — T-14 (ADR-0003, ADR-0005, ADR-0006 `puoProcedere` derivato).
 * Funzione pura: parole OCR + barcode → LetturaRicetta. Nessun I/O, nessun `await`: è il
 * "cuore testabile" che rende il BDD di lettura economico (architecture.md §4.4).
 */
import type {
  AreaAsl,
  CampoLetto,
  ClassePriorita,
  Esenzione,
  LetteraPriorita,
  LetturaRicetta,
  MotoreDiLettura,
  Nre,
  OrigineDato,
  Prestazione,
  Riquadro,
} from '../../dominio/tipi';
import { classificaConfidenzaOcr } from '../../dominio/confidenza';
import { componiNre, LUNGHEZZA_SEGMENTO_A, LUNGHEZZA_SEGMENTO_B } from '../../dominio/nre';
import { normalizzaPrestazione, rigaClinica } from '../../dominio/prestazione';
import { costruisciClassePriorita } from '../../dominio/priorita';
import type { BarcodeLetto } from './decodificatoreBarcode';
import type { ParolaOcr } from './motoreOcr';

interface RigaOcr {
  testo: string;
  confidenzaMinima: number;
  riquadro: Riquadro;
}

const SOGLIA_Y_STESSA_RIGA = 0.02; // euristico: proporzione dell'altezza immagine

function unisciRiquadri(riquadri: Riquadro[]): Riquadro {
  const xMin = Math.min(...riquadri.map((r) => r.x));
  const yMin = Math.min(...riquadri.map((r) => r.y));
  const xMax = Math.max(...riquadri.map((r) => r.x + r.larghezza));
  const yMax = Math.max(...riquadri.map((r) => r.y + r.altezza));
  return { x: xMin, y: yMin, larghezza: xMax - xMin, altezza: yMax - yMin };
}

/** Ricostruisce righe di testo a partire da parole OCR ordinate, raggruppando per prossimità in y. */
function ricostruisciRighe(parole: ParolaOcr[]): RigaOcr[] {
  if (parole.length === 0) return [];
  const gruppi: ParolaOcr[][] = [[parole[0]]];

  for (let i = 1; i < parole.length; i++) {
    const precedente = parole[i - 1];
    const corrente = parole[i];
    const stessaRiga = Math.abs(corrente.riquadro.y - precedente.riquadro.y) <= SOGLIA_Y_STESSA_RIGA;
    if (stessaRiga) {
      gruppi[gruppi.length - 1].push(corrente);
    } else {
      gruppi.push([corrente]);
    }
  }

  return gruppi.map((gruppo) => ({
    testo: gruppo.map((p) => p.testo).join(' '),
    confidenzaMinima: Math.min(...gruppo.map((p) => p.confidenza)),
    riquadro: unisciRiquadri(gruppo.map((p) => p.riquadro)),
  }));
}

interface SegmentoLetto {
  testo: string;
  confidenza: number;
  riquadro: Riquadro;
  origine: OrigineDato;
}

/** Un segmento dell'NRE: prima il barcode (confidenza binaria), poi un tentativo OCR (ADR-0005). */
function leggiSegmento(barcodes: BarcodeLetto[], righe: RigaOcr[], lunghezzaAttesa: number): SegmentoLetto | null {
  const daBarcode = barcodes.find((b) => b.formato === 'CODE_39' && b.testo.length === lunghezzaAttesa);
  if (daBarcode) {
    return { testo: daBarcode.testo, confidenza: 1, riquadro: daBarcode.riquadro, origine: 'barcode' };
  }

  // Cerca nei singoli token di ogni riga, non nell'intera riga: i due segmenti NRE
  // possono stare sulla stessa riga OCR (es. "*1300A* *4008186299*"). Gli asterischi
  // sono delimitatori Code 39 presenti anche nel testo stampato: vanno rimossi prima
  // di testare il pattern.
  const pattern = new RegExp(`^[A-Z0-9]{${lunghezzaAttesa}}$`);
  for (const riga of righe) {
    const tokens = riga.testo.trim().toUpperCase().split(/\s+/);
    for (const tok of tokens) {
      const pulito = tok.replace(/\*/g, '');
      if (pattern.test(pulito)) {
        return { testo: pulito, confidenza: riga.confidenzaMinima, riquadro: riga.riquadro, origine: 'ocr' };
      }
    }
  }
  return null;
}

function costruisciCampoNre(barcodes: BarcodeLetto[], righeUtili: RigaOcr[]): CampoLetto<Nre> {
  const segA = leggiSegmento(barcodes, righeUtili, LUNGHEZZA_SEGMENTO_A);
  const segB = leggiSegmento(barcodes, righeUtili, LUNGHEZZA_SEGMENTO_B);

  if (!segA && !segB) {
    return { stato: 'nonLetto', confidenza: 0, origine: 'barcode', riquadro: null };
  }
  if (!segA || !segB) {
    const disponibile = (segA ?? segB) as SegmentoLetto;
    return { stato: 'nonLetto', confidenza: disponibile.confidenza, origine: disponibile.origine, riquadro: disponibile.riquadro };
  }

  const composizione = componiNre(segA.testo, segB.testo);
  const riquadroCombinato = unisciRiquadri([segA.riquadro, segB.riquadro]);
  const origineCombinata: OrigineDato = segA.origine === 'ocr' || segB.origine === 'ocr' ? 'ocr' : 'barcode';
  const confidenzaCombinata = Math.min(segA.confidenza, segB.confidenza);

  if (composizione.esito === 'errore') {
    return { stato: 'nonLetto', confidenza: confidenzaCombinata, origine: origineCombinata, riquadro: riquadroCombinato };
  }

  const statoA = segA.origine === 'barcode' ? 'certo' : classificaConfidenzaOcr(segA.confidenza);
  const statoB = segB.origine === 'barcode' ? 'certo' : classificaConfidenzaOcr(segB.confidenza);
  const citazione = `*${segA.testo}* *${segB.testo}*`;

  if (statoA === 'nonLetto' || statoB === 'nonLetto') {
    return { stato: 'nonLetto', confidenza: confidenzaCombinata, origine: origineCombinata, riquadro: riquadroCombinato };
  }
  if (statoA === 'daVerificare' || statoB === 'daVerificare') {
    return {
      stato: 'daVerificare',
      valore: composizione.valore,
      citazioneOriginale: citazione,
      confidenza: confidenzaCombinata,
      origine: origineCombinata,
      riquadro: riquadroCombinato,
    };
  }
  return {
    stato: 'certo',
    valore: composizione.valore,
    citazioneOriginale: citazione,
    confidenza: 1,
    origine: origineCombinata,
    riquadro: riquadroCombinato,
  };
}

function costruisciCampoPrestazione(righeVisita: RigaOcr[]): CampoLetto<Prestazione> {
  if (righeVisita.length === 0) {
    return { stato: 'nonLetto', confidenza: 0, origine: 'ocr', riquadro: null };
  }
  const riga = righeVisita[0];
  const valore = normalizzaPrestazione(riga.testo);
  const stato = classificaConfidenzaOcr(riga.confidenzaMinima);

  if (stato === 'nonLetto') {
    return { stato: 'nonLetto', confidenza: riga.confidenzaMinima, origine: 'ocr', riquadro: riga.riquadro };
  }
  return {
    stato,
    valore,
    citazioneOriginale: riga.testo,
    confidenza: riga.confidenzaMinima,
    origine: 'ocr',
    riquadro: riga.riquadro,
  };
}

const PATTERN_PRIORITA = /PRIORIT[ÀA']?[^\n]*?\b([UBDP])\b\s*$/i;

function costruisciCampoPriorita(righe: RigaOcr[]): CampoLetto<ClassePriorita> {
  for (const riga of righe) {
    const match = riga.testo.match(PATTERN_PRIORITA);
    if (!match) continue;
    const lettera = match[1].toUpperCase() as LetteraPriorita;
    const valore = costruisciClassePriorita(lettera);
    const stato = classificaConfidenzaOcr(riga.confidenzaMinima);
    if (stato === 'nonLetto') {
      return { stato: 'nonLetto', confidenza: riga.confidenzaMinima, origine: 'ocr', riquadro: riga.riquadro };
    }
    return { stato, valore, citazioneOriginale: lettera, confidenza: riga.confidenzaMinima, origine: 'ocr', riquadro: riga.riquadro };
  }
  return { stato: 'nonLetto', confidenza: 0, origine: 'ocr', riquadro: null };
}

const PATTERN_ESENZIONE = /ESEN\w*\W+([A-Z0-9]{2,8})/i;

function costruisciCampoEsenzione(righe: RigaOcr[]): CampoLetto<Esenzione> {
  for (const riga of righe) {
    const match = riga.testo.match(PATTERN_ESENZIONE);
    if (!match) continue;
    const codice = match[1].toUpperCase();
    const stato = classificaConfidenzaOcr(riga.confidenzaMinima);
    if (stato === 'nonLetto') {
      return { stato: 'nonLetto', confidenza: riga.confidenzaMinima, origine: 'ocr', riquadro: riga.riquadro };
    }
    return {
      stato,
      valore: { codice },
      citazioneOriginale: riga.testo,
      confidenza: riga.confidenzaMinima,
      origine: 'ocr',
      riquadro: riga.riquadro,
    };
  }
  return { stato: 'nonLetto', confidenza: 0, origine: 'ocr', riquadro: null };
}

const PATTERN_ASL = /\bASL\W+([A-Z0-9]{2,6})/i;

function costruisciCampoAsl(righe: RigaOcr[]): CampoLetto<AreaAsl> {
  for (const riga of righe) {
    const match = riga.testo.match(PATTERN_ASL);
    if (!match) continue;
    const codice = match[1].toUpperCase();
    const stato = classificaConfidenzaOcr(riga.confidenzaMinima);
    if (stato === 'nonLetto') {
      return { stato: 'nonLetto', confidenza: riga.confidenzaMinima, origine: 'ocr', riquadro: riga.riquadro };
    }
    return {
      stato,
      valore: { codice, denominazione: `Area ASL ${codice}` },
      citazioneOriginale: riga.testo,
      confidenza: riga.confidenzaMinima,
      origine: 'ocr',
      riquadro: riga.riquadro,
    };
  }
  return { stato: 'nonLetto', confidenza: 0, origine: 'ocr', riquadro: null };
}

export function estraiCampi(
  parole: ParolaOcr[],
  barcodes: BarcodeLetto[],
  _dimensioni: { larghezzaPx: number; altezzaPx: number },
): LetturaRicetta {
  const motoriUsati: MotoreDiLettura[] = [];
  if (barcodes.some((b) => b.formato === 'CODE_39')) motoriUsati.push('barcode-zxing');
  if (parole.length > 0) motoriUsati.push('ocr-tesseract');

  const righe = ricostruisciRighe(parole);
  const indiceClinico = righe.findIndex((riga) => rigaClinica(riga.testo));
  const contenutoClinicoEscluso = indiceClinico !== -1;
  const righeUtili = contenutoClinicoEscluso ? righe.slice(0, indiceClinico) : righe;

  // Rileva righe di prescrizione: visita, analisi, esame, ecografia, TAC, risonanza,
  // oppure qualsiasi riga che inizi con un codice nomenclatore (es. "91.28.1 ...").
  // Il filtro precedente era ristretto a /visita/i e perdeva tutte le altre categorie.
  const PATTERN_RIGA_PRESCRIZIONE =
    /visita|analisi|esame|ecografia|radiografia|tac|risonanza|elettrocard|biopsia|citogenet|prestazion|\b\d{2,3}\.\d+/i;
  const righePrestazione = righeUtili.filter((riga) => PATTERN_RIGA_PRESCRIZIONE.test(riga.testo));
  const prestazioniMultiple = righePrestazione.length > 1;

  const nre = costruisciCampoNre(barcodes, righeUtili);
  const prestazione = costruisciCampoPrestazione(righePrestazione);
  const classePriorita = costruisciCampoPriorita(righeUtili);
  const esenzione = costruisciCampoEsenzione(righeUtili);
  const areaAsl = costruisciCampoAsl(righeUtili);

  const puoProcedere = nre.stato !== 'nonLetto' && prestazione.stato !== 'nonLetto' && !prestazioniMultiple;

  return {
    idLettura: '',
    nre,
    prestazione,
    classePriorita,
    esenzione,
    areaAsl,
    prestazioniMultiple,
    contenutoClinicoEscluso,
    puoProcedere,
    motoriUsati,
    durataMs: 0,
    ...(prestazioniMultiple
      ? { prestazioniMultipleTestoOriginale: righePrestazione.map((riga) => normalizzaPrestazione(riga.testo).testoOriginale) }
      : {}),
  };
}
