/**
 * dominio/priorita.ts — T-10 (AC-04.3, AC-05.5, G-01).
 * SOLO la mappa lettera -> finestra temporale ORGANIZZATIVA (giorni). Questo modulo non
 * esporta e non contiene alcuna stringa di significato clinico: il testo mostrato ad Anna
 * resta nel dizionario (servizi/dizionario/termini.it.ts, T-11), mai qui — così la
 * spiegazione ha un solo punto di revisione umana.
 */
import type { ClassePriorita, LetteraPriorita } from './tipi';

const FINESTRA_GIORNI: Readonly<Record<LetteraPriorita, number>> = {
  U: 3,
  B: 10,
  D: 30,
  P: 180,
};

export function finestraMassimaGiorni(lettera: LetteraPriorita): number {
  return FINESTRA_GIORNI[lettera];
}

export function costruisciClassePriorita(lettera: LetteraPriorita): ClassePriorita {
  return { lettera, finestraMassimaGiorni: finestraMassimaGiorni(lettera) };
}

/** Usata quando la classe di priorità non è stata letta (architecture.md §5.3): nessun filtro. */
export const FINESTRA_PIU_LARGA_GIORNI = FINESTRA_GIORNI.P;
