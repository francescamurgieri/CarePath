import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, CardBody, CardText, CardTitle, Spinner } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { CheSignifica } from '../componenti/CheSignifica';
import { useAnnuncio } from '../componenti/RegioneAnnunci';
import { useDispatchSessione, useSessione } from '../stato/SessioneProvider';
import { creaServizioPrenotazioneSimulata } from '../servizi/prenotazione/prenotazioneSimulata';
import type { ServizioPrenotazione } from '../servizi/prenotazione/ServizioPrenotazione';
import type { ErroreCarePath, PropostaAppuntamento } from '../dominio/tipi';

/**
 * schermi/S07ProposteAppuntamento.tsx — T-40 (AC-05.1, AC-05.2, AC-05.3, AC-05.5,
 * ux-spec.md §S-07, wireframes.md §S-07).
 *
 * Mostra al massimo 3 proposte (AC-05.1, difesa in profondità con `.slice(0, 3)` oltre al
 * vincolo di tipo `2 | 3` già imposto a `ServizioPrenotazione.cercaProposte`), etichettate nel
 * linguaggio del bisogno di Anna (AC-05.2) e mai con codici, sigle o nomi di nomenclatore
 * (AC-05.3). Le proposte arrivano restando su questo schermo (`PROPOSTE_RICEVUTE`,
 * macchinaSessione.ts): il caricamento è quindi locale a questo componente, non un altro
 * schermo.
 *
 * Il servizio è iniettabile via prop (default: `creaServizioPrenotazioneSimulata()`, ADR-0007):
 * non esiste un contesto/DI condiviso per i servizi in questa onda, e introdurne uno qui
 * uscirebbe dall'isolamento del task (solo `S06Preferenza.tsx`/`S07ProposteAppuntamento.tsx`).
 */
const TITOLO = 'Ecco le proposte per lei';
const MASSIMO_PROPOSTE_RICHIESTE = 3;

const servizioDiDefault = creaServizioPrenotazioneSimulata();

const FORMATTATORE_GIORNO = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const FORMATTATORE_ORA = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' });

function formattaGiornoOra(inizio: Date): string {
  const giorno = FORMATTATORE_GIORNO.format(inizio);
  const giornoConMaiuscola = giorno.charAt(0).toUpperCase() + giorno.slice(1);
  return `${giornoConMaiuscola} — ore ${FORMATTATORE_ORA.format(inizio)}`;
}

export interface S07ProposteAppuntamentoProps {
  /** Iniettabile per i test; in app usa sempre la stessa istanza simulata (ADR-0007). */
  servizioPrenotazione?: ServizioPrenotazione;
}

export function S07ProposteAppuntamento({ servizioPrenotazione }: S07ProposteAppuntamentoProps = {}) {
  const { stato } = useSessione();
  const dispatch = useDispatchSessione();
  const annuncia = useAnnuncio();
  const servizio = servizioPrenotazione ?? servizioDiDefault;

  const [caricamento, setCaricamento] = useState(true);
  const [erroreRicerca, setErroreRicerca] = useState<ErroreCarePath | null>(null);
  const [propostaSceltaId, setPropostaSceltaId] = useState<string | null>(null);

  const { ricetta, preferenza, proposte } = stato;

  useEffect(() => {
    if (!ricetta || !preferenza) return;
    let annullato = false;

    setCaricamento(true);
    setErroreRicerca(null);
    annuncia('Sto cercando gli appuntamenti disponibili...');

    servizio
      .cercaProposte({
        ricetta,
        preferenza,
        riferimentoTemporale: new Date(),
        massimoProposte: MASSIMO_PROPOSTE_RICHIESTE,
      })
      .then((risultato) => {
        if (annullato) return;
        if (risultato.esito === 'ok') {
          dispatch({ tipo: 'PROPOSTE_RICEVUTE', proposte: risultato.valore });
          annuncia(`Trovate ${risultato.valore.length} proposte di appuntamento.`);
        } else {
          setErroreRicerca(risultato.errore);
          annuncia(risultato.errore.messaggioPerLaPersona);
        }
        setCaricamento(false);
      });

    return () => {
      annullato = true;
    };
    // Si rilancia solo se cambiano ricetta o preferenza: `servizio`/`dispatch`/`annuncia` sono
    // stabili per l'intera vita del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ricetta, preferenza]);

  // AC-05.1, difesa in profondità: mai più di 3 card anche se il servizio ne restituisse di più.
  const proposteDaMostrare: readonly PropostaAppuntamento[] = proposte.slice(0, 3);

  function confermaScelta() {
    const proposta = proposteDaMostrare.find((candidata) => candidata.id === propostaSceltaId);
    if (!proposta) return;
    dispatch({ tipo: 'PROPOSTA_SCELTA', proposta });
  }

  return (
    <Schermo titolo={TITOLO}>
      {caricamento && (
        <div role="status" aria-live="polite" className="d-flex align-items-center gap-2 mb-4">
          <Spinner active label="Elaborazione in corso" aria-hidden={false} />
          <span>Sto cercando gli appuntamenti disponibili...</span>
        </div>
      )}

      {!caricamento && erroreRicerca && (
        <Alert color="warning" role="alert">
          <p className="mb-2">{erroreRicerca.messaggioPerLaPersona}</p>
          {erroreRicerca.recupero.tipo === 'contattoTelefonico' && (
            <p className="mb-0">
              CUP: <strong>{erroreRicerca.recupero.telefono}</strong> (numero gratuito)
            </p>
          )}
        </Alert>
      )}

      {!caricamento && !erroreRicerca && proposteDaMostrare.length > 0 && (
        <>
          <div role="radiogroup" aria-label={TITOLO} className="d-flex flex-column gap-3 mb-4">
            {proposteDaMostrare.map((proposta) => {
              const selezionata = propostaSceltaId === proposta.id;
              return (
                <Card
                  key={proposta.id}
                  tag="button"
                  role="radio"
                  aria-checked={selezionata}
                  border
                  className={`text-start w-100${selezionata ? ' border-primary' : ''}`}
                  onClick={() => setPropostaSceltaId(proposta.id)}
                >
                  <CardBody>
                    <Badge color="primary" className="mb-2">
                      {proposta.etichetta}
                    </Badge>
                    <CardTitle tag="h2" className="h5">
                      {formattaGiornoOra(proposta.inizio)}
                    </CardTitle>
                    <CardText className="mb-1">{proposta.struttura.denominazione}</CardText>
                    <CardText className="mb-0">
                      {proposta.struttura.indirizzo}, {proposta.struttura.comune}
                    </CardText>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          <div className="mb-4">
            <CheSignifica termine="strutturaErogatrice" />
          </div>

          <Button color="primary" block disabled={propostaSceltaId === null} onClick={confermaScelta}>
            Scelgo questo appuntamento
          </Button>
        </>
      )}

      <p className="mt-3">
        <Button color="link" onClick={() => dispatch({ tipo: 'TORNA_INDIETRO' })}>
          Voglio vedere opzioni diverse
        </Button>
      </p>
    </Schermo>
  );
}
