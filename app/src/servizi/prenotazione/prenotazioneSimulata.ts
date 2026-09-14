/**
 * servizi/prenotazione/prenotazioneSimulata.ts — T-22 (architecture.md §4.5, ADR-0007).
 *
 * Unica implementazione di `ServizioPrenotazione`. Legge `fixtures/agende.json` (strutture
 * e slot sintetici, ADR-0007 §4) e applica gli invarianti AC-05.1/AC-05.5/AC-06.5. La latenza
 * è simulata ma non decorativa (400–900 ms / 600–1 200 ms): è ciò che rende reali gli stati
 * di caricamento di S-07/S-08. È iniettabile per i test: a `latenzaMs = 0` il servizio è
 * sincrono e ripetibile (nessun `Math.random` nel calcolo del risultato).
 *
 * Nota dichiarata: il contratto (architecture.md §4.5) elenca un timeout di 5 000/8 000 ms.
 * Con questa implementazione la latenza è sempre un parametro controllato (di default
 * 400–1 200 ms, sempre sotto soglia): il ramo di timeout non è quindi raggiungibile in uso
 * normale e non è stato cablato con un `Promise.race` — sarebbe complessità non coperta da
 * alcuno scenario di `scelta_appuntamento.feature`. Se in futuro la latenza diventa
 * configurabile oltre soglia (es. per un test di stress), va aggiunto qui.
 */
import { erroreNessunaDisponibilita, TELEFONO_CUP_FITTIZIO } from '../../dominio/errori';
import { FINESTRA_PIU_LARGA_GIORNI } from '../../dominio/priorita';
import type {
  PrenotazioneConfermata,
  PropostaAppuntamento,
  RichiestaPrenotazione,
  RichiestaProposte,
  Risultato,
  Struttura,
} from '../../dominio/tipi';
import type { ServizioPrenotazione } from './ServizioPrenotazione';
import agendeGrezze from '../../fixtures/agende.json';

interface SlotFixture {
  id: string;
  strutturaId: string;
  /** Giorni da `riferimentoTemporale`: mai una data assoluta (ADR-0007 §4). */
  offsetGiorni: number;
  /** "HH:MM" */
  ora: string;
  ticket: { dovuto: true; importoEuro: number } | { dovuto: false; motivo: string };
}

interface AgendeFixture {
  strutture: Struttura[];
  slot: SlotFixture[];
}

// La fixture è dati statici versionati (ADR-0007 §4): il cast è locale a questo modulo,
// non un aggiramento dei tipi di dominio.
const AGENDE = agendeGrezze as unknown as AgendeFixture;

export interface OpzioniServizioPrenotazioneSimulato {
  /** Default: valore casuale 400–900 ms. A 0 il servizio è sincrono. */
  latenzaCercaMs?: number;
  /** Default: valore casuale 600–1 200 ms. A 0 il servizio è sincrono. */
  latenzaConfermaMs?: number;
}

function latenzaCasuale(minimo: number, massimo: number): number {
  return Math.floor(minimo + Math.random() * (massimo - minimo));
}

function attendi(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((risolvi) => setTimeout(risolvi, ms));
}

function calcolaInizio(riferimento: Date, offsetGiorni: number, ora: string): Date {
  const [ore, minuti] = ora.split(':').map(Number);
  const inizio = new Date(riferimento);
  inizio.setDate(inizio.getDate() + offsetGiorni);
  inizio.setHours(ore, minuti, 0, 0);
  return inizio;
}

/**
 * Deterministico rispetto a (id proposta, data): nessun `Math.random`, così `conferma()`
 * resta ripetibile nei test a `latenzaMs = 0` (definizione di fatto T-22).
 */
function generaCodice(propostaId: string, inizio: Date): string {
  const seme = `${propostaId}-${inizio.toISOString()}`;
  let hash = 0;
  for (let indice = 0; indice < seme.length; indice += 1) {
    hash = (hash * 31 + seme.charCodeAt(indice)) % 100000000;
  }
  return `PRE${String(hash).padStart(8, '0')}`;
}

function raggruppaCodice(codice: string, inizio: Date): string {
  const cifre = codice.slice(3);
  return `PRE · ${inizio.getFullYear()} · ${cifre.slice(0, 4)} · ${cifre.slice(4, 8)}`;
}

export function creaServizioPrenotazioneSimulata(
  opzioni: OpzioniServizioPrenotazioneSimulato = {},
): ServizioPrenotazione {
  const latenzaCerca = opzioni.latenzaCercaMs ?? latenzaCasuale(400, 900);
  const latenzaConferma = opzioni.latenzaConfermaMs ?? latenzaCasuale(600, 1200);
  const strutturePerId = new Map(AGENDE.strutture.map((struttura) => [struttura.id, struttura]));

  return {
    async cercaProposte(richiesta: RichiestaProposte): Promise<Risultato<PropostaAppuntamento[]>> {
      await attendi(latenzaCerca);

      // AC-05.5: se la classe di priorità non è stata letta si usa la finestra più larga
      // e non si filtra (architecture.md §5.3) — non è un caso limite, è l'invariante.
      const finestraMassimaGiorni =
        richiesta.ricetta.classePriorita?.finestraMassimaGiorni ?? FINESTRA_PIU_LARGA_GIORNI;

      // D-06: con "vicino_casa" si filtra per ASL; se l'ASL non è stata letta il degrado
      // (domanda chiusa su 3 aree) avviene a monte, in UI — qui non si filtra (architecture.md §5.3).
      const codiceAslRichiesto =
        richiesta.preferenza === 'vicino_casa' ? (richiesta.ricetta.areaAsl?.codice ?? null) : null;

      const candidati = AGENDE.slot
        .filter((slot) => slot.offsetGiorni <= finestraMassimaGiorni)
        .map((slot) => ({ slot, struttura: strutturePerId.get(slot.strutturaId) }))
        .filter((voce): voce is { slot: SlotFixture; struttura: Struttura } => voce.struttura !== undefined)
        .filter((voce) => (codiceAslRichiesto === null ? true : voce.struttura.codiceAsl === codiceAslRichiesto))
        .sort((a, b) => a.slot.offsetGiorni - b.slot.offsetGiorni);

      if (candidati.length === 0) {
        return { esito: 'errore', errore: erroreNessunaDisponibilita() };
      }

      // AC-05.2: l'etichetta è nel linguaggio del bisogno espresso da Anna, non del sistema.
      const etichetta: PropostaAppuntamento['etichetta'] =
        richiesta.preferenza === 'prima_data' ? 'La prima data disponibile' : 'Più vicino a casa';

      const proposte: PropostaAppuntamento[] = candidati
        .slice(0, richiesta.massimoProposte) // AC-05.1
        .map(({ slot, struttura }) => ({
          id: slot.id,
          etichetta,
          inizio: calcolaInizio(richiesta.riferimentoTemporale, slot.offsetGiorni, slot.ora),
          struttura,
          giorniDiAttesa: slot.offsetGiorni,
          ticket: slot.ticket,
        }));

      return { esito: 'ok', valore: proposte };
    },

    async conferma(richiesta: RichiestaPrenotazione): Promise<Risultato<PrenotazioneConfermata>> {
      await attendi(latenzaConferma);

      const codice = generaCodice(richiesta.proposta.id, richiesta.proposta.inizio);

      return {
        esito: 'ok',
        valore: {
          codice,
          codiceRaggruppato: raggruppaCodice(codice, richiesta.proposta.inizio),
          appuntamento: richiesta.proposta,
          prestazione: richiesta.ricetta.prestazione,
          cosaPortare: ['Tessera sanitaria', 'La ricetta, anche una foto va bene'],
          comeDisdire: {
            testo: 'Per disdire, chiami questo numero almeno un giorno prima dell’appuntamento.',
            telefono: TELEFONO_CUP_FITTIZIO,
          },
          // ADR-0007 §2: campo obbligatorio, non booleano. Non è rappresentabile una
          // `PrenotazioneConfermata` senza questa dichiarazione (AC-06.5).
          simulazione: {
            simulata: true,
            dichiarazione:
              'Questa è una prenotazione simulata a scopo dimostrativo: non è stata inviata a nessun CUP reale.',
          },
        },
      };
    },
  };
}
