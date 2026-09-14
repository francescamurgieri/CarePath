import { Button } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { useDispatchSessione } from '../stato/SessioneProvider';

/**
 * schermi/S04bRecupero.tsx — T-35 (US-02 AC-02.3, ux-spec.md §S-04b).
 *
 * Raggiunto quando la lettura non ha prodotto tutti i dati necessari (OCR incompleto) oppure
 * quando Anna ha detto "No, non è questa". Il sistema non procede e non indovina: offre due
 * vie equivalenti, nessuna preselezionata come primaria.
 */
export function S04bRecupero() {
  const dispatch = useDispatchSessione();

  return (
    <Schermo titolo="Non sono riuscito a leggere la ricetta">
      <p>Non ho trovato tutti i dati che mi servono. Possiamo riprovare con una foto migliore, oppure posso guidarla a inserire il codice a mano.</p>

      <Button color="primary" block onClick={() => dispatch({ tipo: 'NAVIGA_A', schermo: 'S-02' })}>
        Fai un'altra foto
      </Button>

      <Button color="primary" outline block onClick={() => dispatch({ tipo: 'NAVIGA_A', schermo: 'S-05b' })}>
        Inserisci il codice con la guida
      </Button>

      <button type="button" className="btn btn-link" onClick={() => dispatch({ tipo: 'TORNA_INDIETRO' })}>
        Torna alla conferma della visita
      </button>
    </Schermo>
  );
}
