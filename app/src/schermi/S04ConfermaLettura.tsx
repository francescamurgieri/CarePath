import { useMemo, useState } from 'react';
import { Button, Card, CardBody } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { CheSignifica } from '../componenti/CheSignifica';
import { CitazioneOriginale } from '../componenti/CitazioneOriginale';
import { RitaglioFoto } from '../componenti/RitaglioFoto';
import { useSessione } from '../stato/SessioneProvider';
import { confermaLettura } from '../dominio/confermaLettura';
import { formattaNreLeggibile } from '../dominio/nre';
import { spiegaLetteraPriorita } from '../servizi/dizionario/termini.it';
import type { LetturaRicetta } from '../dominio/tipi';

/**
 * schermi/S04ConfermaLettura.tsx — T-34 (US-02, US-04; ux-spec.md §S-04).
 *
 * "Ho trovato la tua visita": mostra la prestazione in parole semplici, la citazione
 * originale sempre affiancata (G-03), l'NRE già letto (mai da inserire), e — quando un
 * campo è stato letto con confidenza intermedia — la domanda di verifica su ritaglio della
 * foto (AC-02.4) prima di abilitare "Sì, è questa".
 */

/** Campo su cui, in questo schermo, può comparire la domanda di verifica (ordine di priorità). */
function trovaCampoDaVerificare(lettura: LetturaRicetta): 'nre' | 'prestazione' | null {
  if (lettura.nre.stato === 'daVerificare') return 'nre';
  if (lettura.prestazione.stato === 'daVerificare') return 'prestazione';
  return null;
}

export function S04ConfermaLettura() {
  const { stato, dispatch } = useSessione();
  const lettura = stato.lettura;
  const [campoVerificato, setCampoVerificato] = useState(false);

  const campoDaVerificare = useMemo(() => (lettura ? trovaCampoDaVerificare(lettura) : null), [lettura]);

  if (!lettura || lettura.prestazione.stato === 'nonLetto') {
    // Non dovrebbe accadere (la macchina a stati instrada qui solo se puoProcedere), ma uno
    // stato difensivo è preferibile a un crash della UI.
    return (
      <Schermo titolo="Ho trovato la tua visita">
        <p>Non ho un risultato di lettura da mostrare.</p>
      </Schermo>
    );
  }

  const prestazione = lettura.prestazione.valore;
  const citazionePrestazione = lettura.prestazione.stato === 'certo' || lettura.prestazione.stato === 'daVerificare'
    ? lettura.prestazione.citazioneOriginale
    : prestazione.testoOriginale;
  const citazioneCompleta = prestazione.codiceNomenclatore
    ? `${citazionePrestazione} — ${prestazione.codiceNomenclatore}`
    : citazionePrestazione;

  const puoConfermare = campoDaVerificare === null || campoVerificato;

  function confermaEProcedi() {
    if (!lettura) return;
    const campiVerificatiDallaPersona = campoDaVerificare ? ([campoDaVerificare] as const) : [];
    const ricetta = confermaLettura(lettura, { campiVerificatiDallaPersona });
    if (!ricetta) {
      dispatch({ tipo: 'LETTURA_RIFIUTATA' });
      return;
    }
    dispatch({ tipo: 'LETTURA_CONFERMATA', ricetta });
  }

  function rispondiVerifica(rispostaAffermativa: boolean) {
    if (!rispostaAffermativa) {
      // "No, è diverso" sul campo incerto: non si indovina (AC-02.3). Se il campo incerto è
      // l'NRE, la guida di S-05b è il recupero corretto; altrimenti si passa da S-04b.
      dispatch({ tipo: campoDaVerificare === 'nre' ? 'LETTURA_RIFIUTATA' : 'LETTURA_RIFIUTATA' });
      return;
    }
    setCampoVerificato(true);
  }

  return (
    <Schermo titolo="Ho trovato la tua visita">
      <Card>
        <CardBody>
          <p>Stavo cercando questo?</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{prestazione.etichettaSemplice}</p>
          <p>
            Codice ricetta (NRE): {lettura.nre.stato !== 'nonLetto' ? formattaNreLeggibile(lettura.nre.valore) : '—'}{' '}
            <CheSignifica termine="nre" />
          </p>
        </CardBody>
      </Card>

      <p>Così c'è scritto sulla tua ricetta:</p>
      <CitazioneOriginale citazioneOriginale={citazioneCompleta} apertoDiDefault />

      <CheSignifica termine="branca" />
      {lettura.classePriorita.stato !== 'nonLetto' && (
        <details>
          <summary>Che significa la lettera {lettura.classePriorita.valore.lettera} sulla ricetta?</summary>
          <p>{spiegaLetteraPriorita(lettura.classePriorita.valore)}</p>
        </details>
      )}

      {campoDaVerificare && !campoVerificato && stato.foto && (
        <div role="alert" className="alert alert-warning">
          <p>Non sono sicuro di questo numero. Guarda qui sulla foto: vedi lo stesso numero?</p>
          {(() => {
            const campo = campoDaVerificare === 'nre' ? lettura.nre : lettura.prestazione;
            return campo.stato === 'daVerificare' ? (
              <RitaglioFoto
                immagineUrl={stato.foto!.anteprimaUrl}
                riquadro={campo.riquadro}
                alt="La tua ricetta: l'area evidenziata mostra il numero da verificare."
              />
            ) : null;
          })()}
          <Button color="primary" onClick={() => rispondiVerifica(true)}>
            Sì, è giusto
          </Button>{' '}
          <Button color="secondary" outline onClick={() => rispondiVerifica(false)}>
            No, è diverso
          </Button>
        </div>
      )}

      <div>
        <Button color="primary" block disabled={!puoConfermare} onClick={confermaEProcedi}>
          Sì, è questa
        </Button>
        <Button color="secondary" outline block onClick={() => dispatch({ tipo: 'LETTURA_RIFIUTATA' })}>
          No, non è questa
        </Button>
      </div>

      <button type="button" className="btn btn-link" onClick={() => dispatch({ tipo: 'TORNA_INDIETRO' })}>
        Torna alla fotografia
      </button>
    </Schermo>
  );
}
