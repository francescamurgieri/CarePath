import { useState } from 'react';
import { Button, Card, CardBody, CardText, CardTitle } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { CheSignifica } from '../componenti/CheSignifica';
import { useDispatchSessione } from '../stato/SessioneProvider';
import type { Preferenza } from '../dominio/tipi';

/**
 * schermi/S06Preferenza.tsx — T-38 (AC-05.4, D-06, ux-spec.md §S-06, wireframes.md §S-06).
 *
 * Chiede ad Anna un'unica cosa: cosa conta di più per lei fra "fare presto" e "stare vicino
 * a casa". Nessun campo di testo libero, nessun indirizzo: la ASL di riferimento viene già
 * dalla ricetta confermata (D-06) e non è mostrata qui.
 *
 * Pattern "radio card": due `Card` cliccabili con `role="radio"` dentro un `role="radiogroup"`
 * (stesso pattern accessibile richiesto per S-07 in ux-spec.md §3). `Schermo` non espone un
 * `id` sull'H1 (T-25, fuori dall'isolamento di questo task): il gruppo usa `aria-label` con lo
 * stesso testo del titolo invece di `aria-labelledby`, per restare autonomo da modifiche a
 * componenti condivisi.
 */
const TITOLO = 'Cosa le interessa di più?';

interface OpzionePreferenza {
  valore: Preferenza;
  titolo: string;
  sottotesto: string;
}

const OPZIONI: OpzionePreferenza[] = [
  { valore: 'prima_data', titolo: 'Fare presto', sottotesto: 'La prima data libera disponibile' },
  { valore: 'vicino_casa', titolo: 'Stare vicino a casa', sottotesto: 'Una struttura nella sua area' },
];

export function S06Preferenza() {
  const dispatch = useDispatchSessione();
  const [scelta, setScelta] = useState<Preferenza | null>(null);

  function confermaScelta() {
    if (!scelta) return;
    dispatch({ tipo: 'PREFERENZA_SCELTA', preferenza: scelta });
  }

  return (
    <Schermo titolo={TITOLO}>
      <p>Le mostreremo le migliori opzioni in base alla sua risposta.</p>

      <div role="radiogroup" aria-label={TITOLO} className="d-flex flex-column gap-3 mb-4">
        {OPZIONI.map((opzione) => {
          const selezionata = scelta === opzione.valore;
          return (
            <Card
              key={opzione.valore}
              tag="button"
              role="radio"
              aria-checked={selezionata}
              border
              className={`text-start w-100${selezionata ? ' border-primary' : ''}`}
              onClick={() => setScelta(opzione.valore)}
            >
              <CardBody>
                <CardTitle tag="h2" className="h5">
                  {opzione.titolo}
                </CardTitle>
                <CardText>{opzione.sottotesto}</CardText>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="mb-4">
        <CheSignifica termine="strutturaErogatrice" />
      </div>

      <Button color="primary" block disabled={scelta === null} onClick={confermaScelta}>
        Mostrami le proposte
      </Button>

      <p className="mt-3">
        <Button color="link" onClick={() => dispatch({ tipo: 'TORNA_INDIETRO' })}>
          Torna alla conferma della visita
        </Button>
      </p>
    </Schermo>
  );
}
