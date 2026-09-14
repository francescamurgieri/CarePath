/**
 * stato/macchinaSessione.ts — T-24.
 *
 * Reducer puro: unica sorgente di verità dello stato di sessione (architecture.md §2, §3.8;
 * ADR-0006 §5). Nessun side effect diretto qui — niente `history.pushState`, niente I/O:
 * quella sincronizzazione vive in `SessioneProvider.tsx` (T-24b), collegata da un effetto
 * separato che osserva `schermoCorrente`.
 *
 * Regola che governa ogni ramo di questo reducer (ADR-0006 §5, "i campi si azzerano solo in
 * avanti"): ogni azione scrive SOLO i campi che produce. Nessun'azione azzera `ricetta`,
 * `lettura`, `proposte`, `propostaScelta` o `prenotazione` come effetto collaterale di
 * un'altra azione — l'unica eccezione dichiarata è `FOTO_ACQUISITA`, che invalida `lettura`
 * perché una nuova foto rende la lettura precedente non più riferita all'immagine corrente
 * (AC-03.4). Questo è anche il motivo per cui `campiInseritiDallaPersona` (dentro `ricetta`)
 * sopravvive a una nuova foto senza bisogno di un caso speciale: `FOTO_ACQUISITA` non tocca
 * `ricetta`.
 *
 * `percorso` è lo stack di navigazione: `percorso[percorso.length - 1] === schermoCorrente`
 * sempre. Andare avanti spinge un nuovo schermo in cima; "torna indietro" fa pop. Questo
 * rende AC-07.1 ("torna indietro etichettato a parole") verificabile leggendo lo stack, e
 * AC-07.2 una proprietà strutturale: il pop non tocca nessun altro campo dello stato.
 */
import type {
  AcquisizioneFoto,
  ErroreCarePath,
  IdSchermo,
  LetturaRicetta,
  Preferenza,
  PrenotazioneConfermata,
  PropostaAppuntamento,
  RicettaConfermata,
  StatoSessione,
} from '../dominio/tipi';

/**
 * Azioni della macchina a stati. Ogni voce corrisponde a un arco del grafo in
 * architecture.md §2. La navigazione "in avanti" implicita in alcune azioni (es.
 * `LETTURA_COMPLETATA` che instrada su S-04 o S-04b in base a `puoProcedere`) è qui perché è
 * un instradamento derivato dal dato, non una scelta della persona: architecture.md §5.3.
 */
export type AzioneSessione =
  | { tipo: 'FOTO_ACQUISITA'; foto: AcquisizioneFoto }
  | { tipo: 'LETTURA_COMPLETATA'; lettura: LetturaRicetta }
  | { tipo: 'LETTURA_RIFIUTATA' }
  | { tipo: 'LETTURA_CONFERMATA'; ricetta: RicettaConfermata }
  | { tipo: 'PREFERENZA_SCELTA'; preferenza: Preferenza }
  | { tipo: 'PROPOSTE_RICEVUTE'; proposte: ReadonlyArray<PropostaAppuntamento> }
  | { tipo: 'PROPOSTA_SCELTA'; proposta: PropostaAppuntamento }
  | { tipo: 'PRENOTAZIONE_CONFERMATA'; prenotazione: PrenotazioneConfermata }
  | { tipo: 'ERRORE_SEGNALATO'; errore: ErroreCarePath }
  | { tipo: 'ERRORE_RISOLTO' }
  | { tipo: 'NAVIGA_A'; schermo: IdSchermo }
  | { tipo: 'TORNA_INDIETRO' };

/** Stato a S-01, prima di qualunque interazione. */
export function creaStatoIniziale(): StatoSessione {
  return {
    schermoCorrente: 'S-01',
    percorso: ['S-01'],
    foto: null,
    lettura: null,
    ricetta: null,
    preferenza: null,
    proposte: [],
    propostaScelta: null,
    prenotazione: null,
    erroreCorrente: null,
    metriche: {
      campiDiTestoCompilati: 0,
      terminiSenzaSpiegazione: 0,
      decisioniRichieste: 0,
      erroriSenzaRecupero: 0,
      schermiAttraversati: 0,
      completataSenzaAiuto: true,
    },
  };
}

/** Spinge un nuovo schermo in cima allo stack di navigazione. */
function naviga(stato: StatoSessione, schermo: IdSchermo): Pick<StatoSessione, 'schermoCorrente' | 'percorso'> {
  return { schermoCorrente: schermo, percorso: [...stato.percorso, schermo] };
}

export function macchinaSessione(stato: StatoSessione, azione: AzioneSessione): StatoSessione {
  switch (azione.tipo) {
    case 'FOTO_ACQUISITA':
      // Unica azione che azzera `lettura`: una nuova foto invalida la lettura precedente
      // (AC-03.4). `ricetta` non viene toccata: se esisteva già, e con essa
      // `campiInseritiDallaPersona`, sopravvive per costruzione.
      return {
        ...stato,
        foto: azione.foto,
        lettura: null,
        ...naviga(stato, 'S-03'),
      };

    case 'LETTURA_COMPLETATA':
      return {
        ...stato,
        lettura: azione.lettura,
        ...naviga(stato, azione.lettura.puoProcedere ? 'S-04' : 'S-04b'),
      };

    case 'LETTURA_RIFIUTATA':
      return { ...stato, ...naviga(stato, 'S-04b') };

    case 'LETTURA_CONFERMATA':
      // Vale sia dal percorso S-04 ("Sì, è questa") sia da S-05b (inserimento guidato):
      // in entrambi i casi `ricetta` arriva già costruita da `confermaLettura()` (ADR-0006).
      return { ...stato, ricetta: azione.ricetta, ...naviga(stato, 'S-06') };

    case 'PREFERENZA_SCELTA':
      return { ...stato, preferenza: azione.preferenza, ...naviga(stato, 'S-07') };

    case 'PROPOSTE_RICEVUTE':
      // Resta su S-07: le proposte arrivano mentre la persona è già su quello schermo.
      return { ...stato, proposte: azione.proposte };

    case 'PROPOSTA_SCELTA':
      return { ...stato, propostaScelta: azione.proposta, ...naviga(stato, 'S-08') };

    case 'PRENOTAZIONE_CONFERMATA':
      // L'unico arco irreversibile del grafo (AC-07.3): la UI lo permette solo con
      // `assensoEsplicito: true` nel tipo (§3.6), non qui — il reducer si limita a registrare
      // l'esito.
      return { ...stato, prenotazione: azione.prenotazione, ...naviga(stato, 'S-09') };

    case 'ERRORE_SEGNALATO':
      return { ...stato, erroreCorrente: azione.errore };

    case 'ERRORE_RISOLTO':
      return { ...stato, erroreCorrente: null };

    case 'NAVIGA_A':
      return { ...stato, ...naviga(stato, azione.schermo) };

    case 'TORNA_INDIETRO': {
      if (stato.percorso.length <= 1) {
        return stato;
      }
      const percorso = stato.percorso.slice(0, -1);
      // Solo `schermoCorrente` e `percorso` cambiano: nessun altro campo viene toccato
      // (AC-07.2 — scenario "Anna può tornare indietro senza perdere la foto").
      return { ...stato, percorso, schermoCorrente: percorso[percorso.length - 1] };
    }

    default: {
      const azioneEsaustiva: never = azione;
      return azioneEsaustiva;
    }
  }
}
