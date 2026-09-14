import { useEffect, useRef, useState } from 'react';
import { Spinner } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { useAnnuncio } from '../componenti/RegioneAnnunci';
import { useDispatchSessione, useSessione } from '../stato/SessioneProvider';
import { lettoreRicettaCondiviso } from './S02Fotografa';
import { erroreLetturaInTimeout } from '../dominio/errori';

/**
 * schermi/S03LetturaInCorso.tsx — T-32 (architecture.md §6.3, ux-spec.md §S-03).
 *
 * Nessuna decisione richiesta ad Anna: lo schermo avvia `leggi()` al mount e si limita a
 * rassicurarla. L'annuncio nella regione live unica dell'app avviene al massimo due volte
 * (inizio, poi "più lungo del solito" — mai una percentuale che cambia, architecture.md §6.3).
 */
export default function S03LetturaInCorso() {
  const { stato } = useSessione();
  const dispatch = useDispatchSessione();
  const annuncia = useAnnuncio();
  const [piuLungoDelSolito, setPiuLungoDelSolito] = useState(false);
  const haAnnunciatoInizio = useRef(false);
  const haAnnunciatoPiuLungo = useRef(false);

  useEffect(() => {
    if (!haAnnunciatoInizio.current) {
      haAnnunciatoInizio.current = true;
      annuncia('Sto leggendo la ricetta...');
    }

    if (!stato.foto) {
      // Stato incoerente (si arriva a S-03 senza una foto acquisita): non c'è nulla da
      // leggere. Non dovrebbe accadere attraverso la navigazione normale (macchinaSessione
      // naviga qui solo da FOTO_ACQUISITA), ma un errore esplicito è più sicuro di un crash.
      dispatch({
        tipo: 'ERRORE_SEGNALATO',
        errore: erroreLetturaInTimeout('S-03 raggiunta senza una foto acquisita'),
      });
      return;
    }

    const controllore = new AbortController();

    lettoreRicettaCondiviso
      .leggi(stato.foto, {
        segnale: controllore.signal,
        onProgresso: (avanzamento) => {
          if (avanzamento.fase === 'piuLungoDelSolito' && !haAnnunciatoPiuLungo.current) {
            haAnnunciatoPiuLungo.current = true;
            setPiuLungoDelSolito(true);
            annuncia("Ci vuole un po' più del solito. Stiamo ancora lavorando.");
          }
        },
      })
      .then((risultato) => {
        if (risultato.esito === 'ok') {
          dispatch({ tipo: 'LETTURA_COMPLETATA', lettura: risultato.valore });
        } else {
          dispatch({ tipo: 'ERRORE_SEGNALATO', errore: risultato.errore });
        }
      });

    return () => controllore.abort();
    // Il lettore/onProgresso sono stabili (istanza di modulo) e `dispatch`/`annuncia` non
    // cambiano identità: l'effetto deve girare solo al mount di questo schermo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Schermo titolo="Sto leggendo la ricetta...">
      <div role="status" aria-live="polite" className="text-center mt-5">
        <Spinner active label="Elaborazione in corso" />
        <p className="mt-3">
          {piuLungoDelSolito
            ? "Ci vuole un po' più del solito. Stiamo ancora lavorando."
            : 'Ci vuole qualche secondo.'}
        </p>
      </div>
    </Schermo>
  );
}
