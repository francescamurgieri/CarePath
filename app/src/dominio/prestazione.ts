/**
 * dominio/prestazione.ts — T-09 (ADR-0009, G-01, G-03).
 * Due trasformazioni deterministiche, mai un'interpretazione:
 * - `normalizzaPrestazione`: case-folding + distacco del codice di catalogo. Nessuna parola
 *   sostituita, aggiunta o tolta (G-03) — verificato dal test di reversibilità.
 * - `filtroClinico`: esclude dalla pipeline le sezioni cliniche del documento (quesito
 *   diagnostico, note del prescrittore...). Il testo escluso non viene mai riformulato né
 *   usato per inferire alcunché (G-01).
 */
import type { Prestazione } from './tipi';
import { trovaBranca } from './tabellaBranca';

/** Codice di catalogo in coda al testo, es. "— 89.01.G". Distaccato, mai interpretato. */
const PATTERN_CODICE_IN_CODA = /[—-]\s*(\d{2}\.\d{2}(?:\.[A-Za-z0-9]+)?)\s*$/;

/** Marcatori di sezione clinica: conservativi per costruzione (ADR-0009: "in caso di dubbio esclude"). */
const MARCATORI_CLINICI: RegExp[] = [
  /quesito\s+diagnostic[oi]/i,
  /sospetto\s+diagnostic[oi]/i,
  /note?\s+del\s+prescrittore/i,
  /anamnesi/i,
  /diagnosi/i,
];

/** Vero se la riga appartiene a una sezione clinica del documento (usato anche da estraiCampi). */
export function rigaClinica(riga: string): boolean {
  return MARCATORI_CLINICI.some((marcatore) => marcatore.test(riga));
}

function casefoldFraseSingola(testo: string): string {
  const minuscolo = testo.toLowerCase();
  return minuscolo.length === 0 ? minuscolo : minuscolo.charAt(0).toUpperCase() + minuscolo.slice(1);
}

/**
 * Solo case-folding tipografico e distacco del codice di catalogo. Test di reversibilità:
 * `etichettaSemplice.toUpperCase()` deve essere contenuta in `testoOriginale` a meno di spazi.
 */
export function normalizzaPrestazione(testoGrezzo: string): Prestazione {
  const testoTrim = testoGrezzo.trim().replace(/\s+/g, ' ');
  const match = testoTrim.match(PATTERN_CODICE_IN_CODA);
  const codiceNomenclatore = match ? match[1].toUpperCase() : null;
  const testoOriginale = (match ? testoTrim.slice(0, match.index) : testoTrim).trim();
  const etichettaSemplice = casefoldFraseSingola(testoOriginale);
  const risultatoBranca = codiceNomenclatore ? trovaBranca(codiceNomenclatore) : null;

  return {
    etichettaSemplice,
    testoOriginale,
    codiceNomenclatore,
    branca: risultatoBranca?.branca ?? null,
    brancheAggiuntive: risultatoBranca?.brancheAggiuntive ?? [],
  };
}

export interface RisultatoFiltroClinico {
  /** Il testo che può proseguire nella pipeline di semplificazione. */
  testoUtile: string;
  /** true se una o più righe sono state escluse perché appartenenti a una sezione clinica. */
  contenutoClinicoEscluso: boolean;
}

/**
 * Segmenta il testo OCR completo ed esclude, dalla riga del primo marcatore clinico in poi,
 * tutto ciò che segue: quel testo non viene riformulato, non entra nell'estrazione dei campi,
 * e se mai dovesse servire mostrarlo si cita alla lettera (G-01). Conservativo per design.
 */
export function filtroClinico(testoOcrCompleto: string): RisultatoFiltroClinico {
  const righe = testoOcrCompleto.split(/\r?\n/);
  const righeUtili: string[] = [];
  let dentroSezioneClinica = false;

  for (const riga of righe) {
    if (!dentroSezioneClinica && rigaClinica(riga)) {
      dentroSezioneClinica = true;
    }
    if (!dentroSezioneClinica) {
      righeUtili.push(riga);
    }
  }

  return { testoUtile: righeUtili.join('\n'), contenutoClinicoEscluso: dentroSezioneClinica };
}

export interface RisultatoEstrazionePrestazione {
  prestazione: Prestazione | null;
  contenutoClinicoEscluso: boolean;
}

/**
 * Combina filtro clinico + normalizzazione: individua la riga della prestazione (la sola
 * famiglia coperta dal nomenclatore, "VISITA...", architecture.md §9) nel testo già filtrato
 * e la normalizza. Non deduce nulla dal codice a barre né dalla branca: se non trova una riga
 * di visita, ritorna `prestazione: null` (il chiamante tratta il campo come `nonLetto`).
 */
export function estraiPrestazione(testoOcrCompleto: string): RisultatoEstrazionePrestazione {
  const { testoUtile, contenutoClinicoEscluso } = filtroClinico(testoOcrCompleto);
  const rigaPrestazione = testoUtile
    .split(/\r?\n/)
    .map((riga) => riga.trim())
    .find((riga) => riga.length > 0 && /visita/i.test(riga));

  if (!rigaPrestazione) {
    return { prestazione: null, contenutoClinicoEscluso };
  }

  return { prestazione: normalizzaPrestazione(rigaPrestazione), contenutoClinicoEscluso };
}
