/**
 * servizi/metriche/registroMetriche.ts — T-12 (architecture.md §4.7, RD-02, M1-M6).
 *
 * Regola di conteggio (già ratificata al party di Gate 2, riportata identica in
 * `PRD.md` §6 e in `architecture.md` §4.7):
 * - `contaSchermo(id)` si invoca sui passi che richiedono un'azione della persona, esclusi gli
 *   stati di sola attesa (S-03) e la schermata di solo esito (S-09). È un conteggio di
 *   SCHERMI DISTINTI attraversati (un Set, non un contatore cumulativo): tornare indietro e
 *   rivisitare uno schermo già contato non gonfia M5.
 * - `contaDecisione()` si invoca sugli schermi che chiedono una risposta fra alternative,
 *   incluse le conferme (S-04, S-06, S-07, S-08). Non su S-02.
 * - `segnalaErroreSenzaRecupero` esiste solo per far fallire il test se mai venisse invocata:
 *   il tipo `ErroreCarePath` (dominio/tipi.ts §3.7) rende impossibile costruire un errore
 *   senza `recupero`, quindi in codice applicativo questo metodo non ha un punto di chiamata
 *   legittimo — è una sonda, non una funzionalità.
 */
import type { CodiceErrore, IdSchermo, MetricheSessione } from '../../dominio/tipi';

export interface RegistroMetriche {
  contaCampoCompilato(): void;
  contaDecisione(): void;
  contaSchermo(id: IdSchermo): void;
  segnalaErroreSenzaRecupero(codice: CodiceErrore): void;
  istantanea(): MetricheSessione;
}

export function creaRegistroMetriche(): RegistroMetriche {
  let campiDiTestoCompilati = 0;
  let decisioniRichieste = 0;
  let erroriSenzaRecupero = 0;
  const schermiDistinti = new Set<IdSchermo>();

  return {
    contaCampoCompilato() {
      campiDiTestoCompilati += 1;
    },
    contaDecisione() {
      decisioniRichieste += 1;
    },
    contaSchermo(id: IdSchermo) {
      schermiDistinti.add(id);
    },
    segnalaErroreSenzaRecupero(_codice: CodiceErrore) {
      erroriSenzaRecupero += 1;
    },
    istantanea(): MetricheSessione {
      return {
        campiDiTestoCompilati,
        terminiSenzaSpiegazione: 0, // M2 — incrementato solo dai test di ispezione (architecture.md §4.7)
        decisioniRichieste,
        erroriSenzaRecupero,
        schermiAttraversati: schermiDistinti.size,
        completataSenzaAiuto: true,
      };
    },
  };
}

/** Valori statici del "prima" (PRD §6), usati da S-11 accanto ai contatori "dopo" misurati dal vivo. */
export const METRICHE_PRIMA_STATICHE = {
  campiDiTestoCompilati: 2,
  terminiSenzaSpiegazione: 5,
  decisioniRichieste: 6,
  erroriSenzaRecupero: 1,
  schermiAttraversati: 10,
  completataSenzaAiuto: false,
} as const;
