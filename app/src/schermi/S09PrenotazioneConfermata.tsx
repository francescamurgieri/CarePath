import { useState } from 'react';
import { Accordion, AccordionBody, AccordionHeader, Alert, Button } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { useSessione } from '../stato/SessioneProvider';

/**
 * schermi/S09PrenotazioneConfermata.tsx — T-43 (ux-spec.md §S-09, ADR-0007).
 *
 * Post-conferma: qui, a differenza di S-08, `stato.prenotazione` esiste davvero (prodotto da
 * `ServizioPrenotazione.conferma()`), quindi il riepilogo mostra il contenuto autoritativo —
 * `codice`, `cosaPortare`, `comeDisdire` — invece delle anticipazioni statiche di S-08.
 *
 * Il testo di dichiarazione della simulazione viene letto da
 * `prenotazione.simulazione.dichiarazione` (non duplicato a mano, a differenza di S-08 dove
 * non esisteva ancora un oggetto da leggere) e reso in testa, subito dopo l'alert di successo
 * (T-42/T-43, ADR-0007).
 *
 * "Salva o stampa" invoca `window.print()` — nessuna generazione PDF client-side (fuori dal
 * budget, ST-01 in tasks.md §3).
 */
export function S09PrenotazioneConfermata() {
  const { stato, dispatch } = useSessione();
  const [esenzioneAperta, setEsenzioneAperta] = useState(false);

  const { prenotazione, ricetta } = stato;

  if (!prenotazione) {
    // Stato non raggiungibile nel percorso nominale (si arriva qui solo da
    // `PRENOTAZIONE_CONFERMATA`), reso comunque comprensibile.
    return (
      <Schermo titolo="Prenotazione confermata">
        <p>Non risulta ancora nessuna prenotazione confermata.</p>
      </Schermo>
    );
  }

  const nonPagaTicket = !prenotazione.appuntamento.ticket.dovuto;

  function salvaOStampa() {
    window.print();
  }

  function vediAutonomiaELimiti() {
    dispatch({ tipo: 'NAVIGA_A', schermo: 'S-11' });
  }

  function tornaAllInizio() {
    dispatch({ tipo: 'NAVIGA_A', schermo: 'S-01' });
  }

  return (
    <Schermo titolo="Prenotazione confermata">
      <Alert color="success" role="status">
        Prenotazione confermata. Trovi tutto qui sotto.
      </Alert>

      <Alert color="warning" tag="div">
        {prenotazione.simulazione.dichiarazione}
      </Alert>

      <dl>
        <dt>Che visita è</dt>
        <dd>{prenotazione.prestazione.etichettaSemplice}</dd>

        <dt>Quando</dt>
        <dd>{formattaData(prenotazione.appuntamento.inizio)}</dd>

        <dt>Dove</dt>
        <dd>
          {prenotazione.appuntamento.struttura.denominazione} — {prenotazione.appuntamento.struttura.indirizzo},{' '}
          {prenotazione.appuntamento.struttura.comune}
        </dd>

        <dt>Cosa portare</dt>
        <dd>
          <ul>
            {prenotazione.cosaPortare.map((voce) => (
              <li key={voce}>{voce}</li>
            ))}
          </ul>
        </dd>

        <dt>Quanto paga</dt>
        <dd>
          {nonPagaTicket ? (
            ricetta?.esenzione ? (
              <>Non paga il ticket — ha l'esenzione {ricetta.esenzione.codice}</>
            ) : (
              (prenotazione.appuntamento.ticket.dovuto === false ? prenotazione.appuntamento.ticket.motivo : null)
            )
          ) : (
            `Ticket: ${formattaImporto((prenotazione.appuntamento.ticket as { importoEuro: number }).importoEuro)}`
          )}
        </dd>
        {nonPagaTicket && ricetta?.esenzione ? (
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
          {prenotazione.comeDisdire.testo} Numero: {prenotazione.comeDisdire.telefono}. Le serve solo
          per disdire.
        </dd>
      </dl>

      <Alert color="info" tag="div">
        Codice: <strong>{prenotazione.codiceRaggruppato}</strong> (serve solo per disdire)
      </Alert>

      <Button color="primary" block onClick={salvaOStampa}>
        Salva o stampa
      </Button>
      <Button color="primary" outline block onClick={vediAutonomiaELimiti}>
        Vedi quanto è cambiato rispetto a prima
      </Button>
      <Button color="secondary" outline block onClick={tornaAllInizio}>
        Torna all'inizio
      </Button>
    </Schermo>
  );
}

// Duplicato deliberatamente da S08RiepilogoConferma.tsx: stesso rilievo di divergenza copy
// verso `servizi/dizionario/termini.it.ts` documentato in quel file (isolamento di BUILD non
// permette di estrarre una costante condivisa in questo task).
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
