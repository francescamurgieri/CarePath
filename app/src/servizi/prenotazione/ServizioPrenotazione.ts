/**
 * servizi/prenotazione/ServizioPrenotazione.ts — T-22 (architecture.md §4.5, ADR-0007).
 *
 * Contratto verso S-07/S-08. L'unica implementazione oggi è `prenotazioneSimulata.ts`
 * (ADR-0007): un'integrazione futura con un CUP reale sostituisce l'implementazione,
 * non questa interfaccia, e non tocca la UI.
 */
import type {
  PrenotazioneConfermata,
  PropostaAppuntamento,
  RichiestaPrenotazione,
  RichiestaProposte,
  Risultato,
} from '../../dominio/tipi';

export interface ServizioPrenotazione {
  /**
   * Restituisce al massimo `richiesta.massimoProposte` proposte (AC-05.1), filtrate
   * secondo la preferenza e la finestra temporale della classe di priorità (AC-05.5).
   * Non lancia mai: un esito senza proposte è `errore: NESSUNA_DISPONIBILITA`.
   */
  cercaProposte(richiesta: RichiestaProposte): Promise<Risultato<PropostaAppuntamento[]>>;

  /**
   * Conferma una proposta già scelta da Anna. `assensoEsplicito: true` nel tipo di
   * `RichiestaPrenotazione` rende impossibile invocarla senza il tocco su "Confermo" (AC-07.3).
   * L'esito porta sempre `simulazione` valorizzato (ADR-0007, AC-06.5): non esiste una
   * `PrenotazioneConfermata` senza la dichiarazione di simulazione.
   */
  conferma(richiesta: RichiestaPrenotazione): Promise<Risultato<PrenotazioneConfermata>>;
}
