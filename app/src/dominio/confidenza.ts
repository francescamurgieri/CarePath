/**
 * dominio/confidenza.ts — T-06 (ADR-0005, chiude D-05).
 * Soglie di confidenza per i campi letti dall'OCR. Vivono SOLO qui: un numero di confidenza
 * scritto altrove nel codice è un difetto (verificato da confidenza.test.ts via grep).
 *
 * Calibrate su una sola fixture reale (intake/idea/Example files/image.png): è un limite
 * dichiarato in ADR-0005, riportato fra i limiti residui di S-11.
 */

/** ocr >= SOGLIA_CERTO → CampoLetto in stato 'certo'. */
export const SOGLIA_CERTO = 0.85;

/** SOGLIA_DA_VERIFICARE <= ocr < SOGLIA_CERTO → 'daVerificare'; sotto → 'nonLetto'. */
export const SOGLIA_DA_VERIFICARE = 0.6;

export type StatoConfidenza = 'certo' | 'daVerificare' | 'nonLetto';

/** Normalizza la confidenza di Tesseract (0..100) a 0..1. Idempotente su valori già 0..1. */
export function normalizzaConfidenzaOcr(confidenzaTesseract: number): number {
  return confidenzaTesseract > 1 ? confidenzaTesseract / 100 : confidenzaTesseract;
}

/**
 * Classifica una confidenza OCR normalizzata (0..1) secondo le soglie di ADR-0005.
 * Per un campo composto da più parole si passa la confidenza MINIMA fra le parole che lo
 * compongono, non la media (architecture.md §5.1: "la media nasconde la parola sbagliata").
 */
export function classificaConfidenzaOcr(confidenzaNormalizzata: number): StatoConfidenza {
  if (confidenzaNormalizzata >= SOGLIA_CERTO) return 'certo';
  if (confidenzaNormalizzata >= SOGLIA_DA_VERIFICARE) return 'daVerificare';
  return 'nonLetto';
}

/** La confidenza del barcode è binaria (ADR-0005 §3): non esiste un Code 39 "letto a metà". */
export function classificaConfidenzaBarcode(decodificaValida: boolean): StatoConfidenza {
  return decodificaValida ? 'certo' : 'nonLetto';
}
