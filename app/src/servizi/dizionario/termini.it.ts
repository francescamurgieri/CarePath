/**
 * servizi/dizionario/termini.it.ts — T-11 (ADR-0009 §1, AC-04.1/04.2/04.3/04.4, M2, G-04, RD-03).
 *
 * Unica fonte di testo esplicativo dell'applicazione. Ogni stringa qui è scritta e
 * revisionata da una persona (`revisionataDa: 'umano'`): nessuna chiamata, nessuna
 * generazione a runtime. I testi sono quelli già redatti in `ux-spec.md` §S-04: questo file
 * li versiona, non li riscrive.
 *
 * `Record<Termine, SpiegazioneTermine>` è completo per costruzione: aggiungere un `Termine`
 * senza spiegarlo non compila (AC-04.1/M2 resi strutturali).
 */
import type { ClassePriorita, LetteraPriorita } from '../../dominio/tipi';

export type Termine = 'nre' | 'branca' | 'classePriorita' | 'strutturaErogatrice' | 'esenzione' | 'regime';

export interface SpiegazioneTermine {
  termine: Termine;
  titolo: string;
  /** Massimo 2 frasi (verificato in termini.it.test.ts contando i punti fermi). */
  testo: string;
  revisionataDa: 'umano';
}

const DIZIONARIO: Record<Termine, SpiegazioneTermine> = {
  nre: {
    termine: 'nre',
    titolo: 'Numero della ricetta (NRE)',
    testo:
      'È il numero che identifica la tua ricetta in tutto il sistema sanitario. CarePath lo ha già letto: non devi copiarlo tu.',
    revisionataDa: 'umano',
  },
  branca: {
    termine: 'branca',
    titolo: 'Branca specialistica',
    testo:
      'È la categoria della visita (per esempio: ortopedia, oculistica). CarePath la ricava da sola dal tipo di visita scritta sulla ricetta.',
    revisionataDa: 'umano',
  },
  classePriorita: {
    termine: 'classePriorita',
    titolo: 'Classe di priorità',
    testo:
      'È la lettera che indica entro quanto tempo il sistema deve fissare la visita. Non riguarda la gravità: è un termine organizzativo.',
    revisionataDa: 'umano',
  },
  strutturaErogatrice: {
    termine: 'strutturaErogatrice',
    titolo: 'Struttura erogatrice',
    testo:
      "È l'ospedale o il poliambulatorio dove si fa la visita. CarePath ti propone le opzioni più adatte, così non devi cercarle tu.",
    revisionataDa: 'umano',
  },
  esenzione: {
    termine: 'esenzione',
    titolo: 'Esenzione',
    testo:
      "Con l'esenzione non paghi il ticket, o ne paghi una parte ridotta. CarePath usa il codice già sulla ricetta.",
    revisionataDa: 'umano',
  },
  regime: {
    termine: 'regime',
    titolo: 'Regime (S/H)',
    testo:
      'S = visita programmata (non urgente); H = in regime di ricovero. CarePath usa questo dato per trovare il tipo giusto di appuntamento.',
    revisionataDa: 'umano',
  },
};

/** Sincrona e totale: ogni Termine ha una voce. */
export function spiega(termine: Termine): SpiegazioneTermine {
  return DIZIONARIO[termine];
}

/**
 * Nome organizzativo di ogni lettera di priorità — testo fisso, revisionato da un umano,
 * mai generato dall'AI (architecture.md §7.2, G-04). Vive qui e non in `dominio/priorita.ts`
 * perché quel modulo non contiene alcuna stringa rivolta ad Anna (T-10).
 */
const NOME_LETTERA_PRIORITA: Readonly<Record<LetteraPriorita, string>> = {
  U: 'urgente',
  B: 'breve',
  D: 'differibile',
  P: 'programmata',
};

/**
 * Template versionato (architecture.md §7.2): la lettera e i giorni vengono dalla ricetta,
 * il testo che li racchiude è fisso. Usato in S-04 per spiegare la lettera letta (es. "D").
 * AC-04.3: riporta la lettera come stampata e il solo significato organizzativo.
 */
export function spiegaLetteraPriorita(classe: ClassePriorita): string {
  const nome = NOME_LETTERA_PRIORITA[classe.lettera];
  return (
    `${classe.lettera} vuol dire "${nome}": il Servizio Sanitario deve fissare la tua visita ` +
    `entro ${classe.finestraMassimaGiorni} giorni. Non riguarda la gravità della tua situazione: ` +
    `è solo il tempo massimo che il sistema ha per trovare un appuntamento.`
  );
}
