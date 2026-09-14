/**
 * dominio/confermaLettura.ts — costruttore unico di `RicettaConfermata` (ADR-0006, §3.4).
 * È l'UNICO punto del codice applicativo che scrive `marchioConferma`: nessun altro file
 * deve costruire un `RicettaConfermata` con un cast (`as RicettaConfermata`).
 *
 * Ritorna `null` se un campo bloccante (NRE o prestazione) non è disponibile, o se la
 * ricetta contiene più prestazioni: in questi casi non esiste una `RicettaConfermata` da
 * costruire, e il chiamante (S-04/S-04b/S-05b) deve restare sul percorso di recupero.
 */
import type { LetturaRicetta, Nre, RicettaConfermata } from './tipi';
import { marchioConferma } from './tipi';

export interface OpzioniConfermaLettura {
  /** Campi che erano 'daVerificare' e che Anna ha confermato con la domanda chiusa "Sì, è giusto". */
  campiVerificatiDallaPersona?: ReadonlyArray<keyof LetturaRicetta>;
  /** Campi arrivati dall'inserimento guidato di S-05b, non dalla lettura automatica. */
  campiInseritiDallaPersona?: ReadonlyArray<keyof LetturaRicetta>;
  /** Override esplicito dell'NRE (es. composto a mano in S-05b), quando `lettura.nre` è 'nonLetto'. */
  nreDallaPersona?: Nre;
}

export function confermaLettura(lettura: LetturaRicetta, opzioni: OpzioniConfermaLettura = {}): RicettaConfermata | null {
  const nre = opzioni.nreDallaPersona ?? (lettura.nre.stato !== 'nonLetto' ? lettura.nre.valore : null);
  const prestazione = lettura.prestazione.stato !== 'nonLetto' ? lettura.prestazione.valore : null;

  if (!nre || !prestazione || lettura.prestazioniMultiple) {
    return null;
  }

  return {
    [marchioConferma]: true,
    nre,
    prestazione,
    classePriorita: lettura.classePriorita.stato !== 'nonLetto' ? lettura.classePriorita.valore : null,
    esenzione: lettura.esenzione.stato !== 'nonLetto' ? lettura.esenzione.valore : null,
    areaAsl: lettura.areaAsl.stato !== 'nonLetto' ? lettura.areaAsl.valore : null,
    campiVerificatiDallaPersona: opzioni.campiVerificatiDallaPersona ?? [],
    campiInseritiDallaPersona: opzioni.campiInseritiDallaPersona ?? [],
  };
}
