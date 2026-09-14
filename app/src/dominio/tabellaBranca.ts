/**
 * dominio/tabellaBranca.ts — T-08.
 * Collega il codice di nomenclatore alla branca specialistica, usando
 * `app/data/nomenclatore-branca.json` (58 voci, famiglie 89.01.x/89.02/89.07/89.13/89.26.x/89.7x
 * — architecture.md §9). Dato di dominio di produzione, non una fixture di test: per questo
 * vive fuori da `src/fixtures/` e resta importabile da `prestazione.ts` (nota di T-08 in
 * tasks.md, che protegge la distinzione di ADR-0004).
 *
 * Nessun match parziale o euristico: un codice fuori dalle famiglie dichiarate restituisce
 * `null` per costruzione (non per omissione — coerente con G-04, "indovinare non è tracciabile").
 */
import tabella from '../../data/nomenclatore-branca.json';

interface VoceNomenclatore {
  codice: string;
  descrizione: string;
  branca: string;
  brancheAggiuntive?: string[];
}

export interface RisultatoBranca {
  branca: string;
  brancheAggiuntive: readonly string[];
}

const INDICE: ReadonlyMap<string, VoceNomenclatore> = new Map(
  (tabella.voci as VoceNomenclatore[]).map((voce) => [voce.codice, voce]),
);

/**
 * Match esatto sul campo `codice`. Nessuna euristica su prefissi: un codice non elencato
 * ritorna `null`, il servizio degrada usando solo la prestazione (architecture.md §9).
 */
export function trovaBranca(codiceNomenclatore: string): RisultatoBranca | null {
  const voce = INDICE.get(codiceNomenclatore.trim());
  if (!voce) return null;
  return { branca: voce.branca, brancheAggiuntive: voce.brancheAggiuntive ?? [] };
}
