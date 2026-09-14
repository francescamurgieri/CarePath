import { Button, Hero, HeroBody } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { useDispatchSessione } from '../stato/SessioneProvider';

/**
 * schermi/S01Benvenuto.tsx — T-30 (AC-08.5, ux-spec.md §S-01).
 *
 * Nessuna decisione richiesta: un solo pulsante primario ("Fotografa la ricetta") e un solo
 * link secondario per il percorso demo "prima" (RD-01). Copy verbatim da ux-spec.md.
 */
export default function S01Benvenuto() {
  const dispatch = useDispatchSessione();

  return (
    <Schermo titolo="CarePath — Prenota la tua visita">
      <Hero>
        <HeroBody>
          <p className="lead">Fotografa il foglio che ti ha dato il medico. Pensiamo noi al resto.</p>
        </HeroBody>
      </Hero>

      <Button
        color="primary"
        block
        className="mt-4"
        onClick={() => dispatch({ tipo: 'NAVIGA_A', schermo: 'S-02' })}
      >
        Fotografa la ricetta
      </Button>

      <p className="mt-3 text-center">
        <a
          href="#"
          onClick={(evento) => {
            evento.preventDefault();
            dispatch({ tipo: 'NAVIGA_A', schermo: 'S-10' });
          }}
        >
          Vedi come funzionava prima
        </a>
      </p>
    </Schermo>
  );
}
