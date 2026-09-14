import { useState } from 'react';
import { Button } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { RitaglioFoto } from '../componenti/RitaglioFoto';
import { useSessione } from '../stato/SessioneProvider';
import { componiNre, validaSegmentoA, validaSegmentoB, LUNGHEZZA_SEGMENTO_A, LUNGHEZZA_SEGMENTO_B } from '../dominio/nre';
import { confermaLettura } from '../dominio/confermaLettura';

/**
 * schermi/S05bGuidaLettura.tsx — T-37 (US-03; ux-spec.md §S-05b; AC-03.1…03.4).
 *
 * Fallback guidato: quando l'OCR/barcode non bastano per l'NRE, Anna copia i due segmenti
 * stampati sulla sua stessa foto (5 + 10 caratteri, mai un unico campo da 15 — AC-03.2).
 * Validazione immediata e per segmento (AC-03.3): l'errore dice quale segmento e quanti
 * caratteri mancano. "Fai un'altra foto" resta sempre raggiungibile senza perdere dati
 * già confermati (AC-03.4).
 */
export function S05bGuidaLettura() {
  const { stato, dispatch } = useSessione();
  const [segmentoA, setSegmentoA] = useState('');
  const [segmentoB, setSegmentoB] = useState('');

  const validitaA = validaSegmentoA(segmentoA);
  const validitaB = validaSegmentoB(segmentoB);
  const entrambiValidi = segmentoA.length > 0 && segmentoB.length > 0 && validitaA.valido && validitaB.valido;

  const lettura = stato.lettura;
  const riquadroNre = lettura && lettura.nre.riquadro ? lettura.nre.riquadro : null;

  function continua() {
    if (!lettura) return;
    const composizione = componiNre(segmentoA, segmentoB);
    if (composizione.esito === 'errore') return;

    const ricetta = confermaLettura(lettura, {
      nreDallaPersona: composizione.valore,
      campiInseritiDallaPersona: ['nre'],
    });

    if (!ricetta) {
      // La prestazione non è comunque leggibile: il codice da solo non basta. Si torna al
      // recupero, che offre di rifare la foto (non si indovina la visita — G-01/G-03).
      dispatch({ tipo: 'LETTURA_RIFIUTATA' });
      return;
    }
    dispatch({ tipo: 'LETTURA_CONFERMATA', ricetta });
  }

  return (
    <Schermo titolo="Aiutami a leggere il codice">
      {stato.foto && riquadroNre && (
        <RitaglioFoto
          immagineUrl={stato.foto.anteprimaUrl}
          riquadro={riquadroNre}
          alt="La tua ricetta: la zona evidenziata mostra i due numeri da copiare. Il primo è sotto il codice a barre di sinistra, il secondo sotto quello di destra."
        />
      )}

      <p>Copia il numero sotto il primo codice a barre, poi quello sotto il secondo.</p>

      <div>
        <label htmlFor="segmento-a">Primo numero (le prime {LUNGHEZZA_SEGMENTO_A} cifre della ricetta)</label>
        <input
          id="segmento-a"
          type="text"
          placeholder="per esempio 010A2"
          value={segmentoA}
          onChange={(e) => setSegmentoA(e.target.value.toUpperCase())}
          className={segmentoA.length === 0 ? '' : validitaA.valido ? 'is-valid' : 'is-invalid'}
          aria-describedby="segmento-a-feedback"
          aria-invalid={segmentoA.length > 0 && !validitaA.valido}
        />
        <span id="segmento-a-feedback">
          {segmentoA.length === 0
            ? ''
            : validitaA.valido
              ? 'Perfetto, questo va bene.'
              : `Questo numero deve avere esattamente ${LUNGHEZZA_SEGMENTO_A} caratteri. Hai scritto ${segmentoA.length}: ne mancano ${validitaA.caratteriMancanti}.`}
        </span>
      </div>

      <div>
        <label htmlFor="segmento-b">Secondo numero (le ultime {LUNGHEZZA_SEGMENTO_B} cifre della ricetta)</label>
        <input
          id="segmento-b"
          type="text"
          placeholder="per esempio 4518061015"
          value={segmentoB}
          onChange={(e) => setSegmentoB(e.target.value.toUpperCase())}
          className={segmentoB.length === 0 ? '' : validitaB.valido ? 'is-valid' : 'is-invalid'}
          aria-describedby="segmento-b-feedback"
          aria-invalid={segmentoB.length > 0 && !validitaB.valido}
        />
        <span id="segmento-b-feedback">
          {segmentoB.length === 0
            ? ''
            : validitaB.valido
              ? 'Perfetto, questo va bene.'
              : `Questo numero deve avere esattamente ${LUNGHEZZA_SEGMENTO_B} caratteri. Hai scritto ${segmentoB.length}: ne mancano ${validitaB.caratteriMancanti}.`}
        </span>
      </div>

      <Button color="primary" block disabled={!entrambiValidi} onClick={continua}>
        Continua con questi numeri
      </Button>

      <button type="button" className="btn btn-link" onClick={() => dispatch({ tipo: 'NAVIGA_A', schermo: 'S-02' })}>
        Fai un'altra foto
      </button>

      <button type="button" className="btn btn-link" onClick={() => dispatch({ tipo: 'TORNA_INDIETRO' })}>
        Torna indietro
      </button>
    </Schermo>
  );
}
