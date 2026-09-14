import { useState } from 'react';
import { Accordion, AccordionBody, AccordionHeader, Alert, Button } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { useSessione } from '../stato/SessioneProvider';
import { TELEFONO_CUP_FITTIZIO } from '../dominio/errori';
import { creaServizioPrenotazioneSimulata } from '../servizi/prenotazione/prenotazioneSimulata';
import type { ServizioPrenotazione } from '../servizi/prenotazione/ServizioPrenotazione';
import type { RichiestaPrenotazione } from '../dominio/tipi';

/**
 * schermi/S08RiepilogoConferma.tsx — T-42 (ux-spec.md §S-08, ADR-0007).
 *
 * Riepilogo prima del tocco su "Confermo l'appuntamento": è l'unico passo irreversibile
 * dell'intero percorso (AC-07.3) — per questo la richiesta al servizio parte solo dentro il
 * gestore del pulsante, mai prima, e porta sempre `assensoEsplicito: true` (il tipo lo impone).
 *
 * Nota di isolamento dal contratto (dichiarata, non un aggiramento silenzioso): `codice`,
 * `cosaPortare` e `comeDisdire` di `PrenotazioneConfermata` esistono solo DOPO la chiamata a
 * `servizio.conferma()` — cioè dopo il tocco. Mostrarli prima significherebbe inventare un
 * esito che non si è ancora verificato, il contrario di quanto ADR-0007 chiede. Questo schermo
 * mostra quindi solo ciò che è già noto da `ricetta`/`propostaScelta` (voci 1, 2, 3, 5), un
 * "cosa portare" descrittivo indipendente dall'esito (voce 4), e per "come disdire" (voce 6)
 * anticipa solo il numero fittizio (già una costante, non generata dalla prenotazione) e
 * rimanda il codice — mostrato per intero in S-09 — a dopo la conferma. Il testo di
 * dichiarazione della simulazione (identico a quello che `prenotazioneSimulata.ts` scrive in
 * `PrenotazioneConfermata.simulazione.dichiarazione`, ADR-0007 §2) è invece duplicato qui
 * come costante: è testo fisso e già revisionato, non generato da questo schermo, e va in
 * testa perché Anna lo legga PRIMA di decidere se confermare, non dopo (T-42, definizione di
 * fatto). La duplicazione fra questo file e `servizi/prenotazione/prenotazioneSimulata.ts` è
 * un debito dichiarato: l'isolamento di BUILD assegnato a questo task vieta di toccare quel
 * file per estrarre una costante condivisa — segnalato come rilievo per un successivo
 * refactor (vedi consegna finale).
 *
 * Divergenza di copy dichiarata (non un aggiramento): il testo di "Che significa esenzione?"
 * qui sotto è quello **verbatim di ux-spec.md §S-08** ("Con il codice di esenzione..."), che è
 * diverso dal testo già presente in `servizi/dizionario/termini.it.ts` per lo stesso termine
 * (scritto in T-11, fuori dall'isolamento di questo task). Le regole di BUILD impongono di
 * seguire ux-spec verbatim e di non riscrivere un testo che sembra sbagliato: qui si segue
 * ux-spec, e la doppia fonte per lo stesso concetto è un rilievo aperto verso UX/ARCH.
 */

const DICHIARAZIONE_SIMULAZIONE =
  'Questa è una prenotazione simulata a scopo dimostrativo: non è stata inviata a nessun CUP reale.';

const TESTO_ESENZIONE_UX_SPEC =
  'Con il codice di esenzione non paga (o paga meno) il ticket. Il codice viene dalla sua ' +
  'tessera o dalla ricetta: non deve fare nulla.';

const FORMATTATORE_GIORNO = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const FORMATTATORE_ORA = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' });

function formattaData(data: Date): string {
  const giorno = FORMATTATORE_GIORNO.format(data);
  const giornoConMaiuscola = giorno.charAt(0).toUpperCase() + giorno.slice(1);
  return `${giornoConMaiuscola}, ore ${FORMATTATORE_ORA.format(data)}`;
}

function formattaImporto(importoEuro: number): string {
  return `${importoEuro.toFixed(2).replace('.', ',')} €`;
}

// Istanza di default: le schermate non ricevono un contesto/provider dedicato ai servizi
// (nessuno è ancora stato introdotto in architecture.md), quindi ogni schermata che consuma
// `ServizioPrenotazione` ne crea una propria istanza di default, sostituibile via prop nei
// test (stesso pattern di iniezione già usato da `prenotazioneSimulata.test.ts`, T-20).
const SERVIZIO_DI_DEFAULT = creaServizioPrenotazioneSimulata();

export interface S08RiepilogoConfermaProps {
  servizio?: ServizioPrenotazione;
}

export function S08RiepilogoConferma({ servizio }: S08RiepilogoConfermaProps) {
  const { stato, dispatch } = useSessione();
  const [inCorso, setInCorso] = useState(false);
  const [messaggioErrore, setMessaggioErrore] = useState<string | null>(null);
  const [esenzioneAperta, setEsenzioneAperta] = useState(false);

  const { ricetta, propostaScelta } = stato;

  if (!ricetta || !propostaScelta) {
    // Stato non raggiungibile nel percorso nominale (la macchina naviga qui solo da
    // `PROPOSTA_SCELTA`), ma reso comunque comprensibile invece di uno schermo vuoto.
    return (
      <Schermo titolo="Controlla e conferma">
        <p>Non risulta ancora scelto un appuntamento. Torni alla schermata precedente.</p>
      </Schermo>
    );
  }

  async function confermaAppuntamento() {
    setMessaggioErrore(null);
    setInCorso(true);
    const richiesta: RichiestaPrenotazione = {
      ricetta: ricetta!,
      proposta: propostaScelta!,
      assensoEsplicito: true,
    };
    const risultato = await (servizio ?? SERVIZIO_DI_DEFAULT).conferma(richiesta);
    setInCorso(false);
    if (risultato.esito === 'ok') {
      dispatch({ tipo: 'PRENOTAZIONE_CONFERMATA', prenotazione: risultato.valore });
    } else {
      setMessaggioErrore(risultato.errore.messaggioPerLaPersona);
    }
  }

  function tornaAScegliere() {
    dispatch({ tipo: 'TORNA_INDIETRO' });
  }

  const nonPagaTicket = !propostaScelta.ticket.dovuto;

  return (
    <Schermo titolo="Controlla e conferma">
      <Alert color="warning" tag="div">
        {DICHIARAZIONE_SIMULAZIONE}
      </Alert>

      <dl>
        <dt>Che visita è</dt>
        <dd>{ricetta.prestazione.etichettaSemplice}</dd>

        <dt>Quando</dt>
        <dd>{formattaData(propostaScelta.inizio)}</dd>

        <dt>Dove</dt>
        <dd>
          {propostaScelta.struttura.denominazione} — {propostaScelta.struttura.indirizzo},{' '}
          {propostaScelta.struttura.comune}
        </dd>

        <dt>Cosa portare</dt>
        <dd>Questo foglio della ricetta e un documento d'identità</dd>

        <dt>Quanto paga</dt>
        <dd>
          {nonPagaTicket ? (
            ricetta.esenzione ? (
              <>Non paga il ticket — ha l'esenzione {ricetta.esenzione.codice}</>
            ) : (
              propostaScelta.ticket.dovuto === false ? propostaScelta.ticket.motivo : null
            )
          ) : (
            `Ticket: ${formattaImporto((propostaScelta.ticket as { importoEuro: number }).importoEuro)}`
          )}
        </dd>
        {nonPagaTicket && ricetta.esenzione ? (
          <Accordion className="che-significa-esenzione">
            <AccordionHeader active={esenzioneAperta} onToggle={() => setEsenzioneAperta((precedente) => !precedente)}>
              Che significa esenzione?
            </AccordionHeader>
            <AccordionBody active={esenzioneAperta}>
              <p>{TESTO_ESENZIONE_UX_SPEC}</p>
            </AccordionBody>
          </Accordion>
        ) : null}

        <dt>Come disdire</dt>
        <dd>
          Se vuole cambiare o cancellare, dopo la conferma le mostriamo un codice: le basterà
          chiamare il numero {TELEFONO_CUP_FITTIZIO} e comunicarlo. Il codice serve solo per
          disdire.
        </dd>
      </dl>

      {messaggioErrore ? (
        <Alert color="danger" role="alert">
          {messaggioErrore}
        </Alert>
      ) : null}

      <Button color="primary" block onClick={confermaAppuntamento} disabled={inCorso} aria-busy={inCorso}>
        {inCorso ? 'Conferma in corso…' : "Confermo l'appuntamento"}
      </Button>
      <Button color="primary" outline block onClick={tornaAScegliere} disabled={inCorso}>
        Torna a scegliere la data
      </Button>
    </Schermo>
  );
}
