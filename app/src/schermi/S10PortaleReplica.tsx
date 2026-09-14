import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Alert, Button, Form, FormGroup, Input } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { creaRegistroMetriche } from '../servizi/metriche/registroMetriche';
import type { MetricheSessione } from '../dominio/tipi';

/**
 * schermi/S10PortaleReplica.tsx — T-45 (RD-01, AC-RD1.1, AC-RD1.2, ADR-0008,
 * ux-spec.md §S-10, wireframes.md §S-10).
 *
 * Ramo isolato (architecture.md §2): NON importa `SessioneProvider`/`useSessione` e non
 * scrive nello stato di sessione condiviso — è una replica a sé, non una schermata del
 * percorso nominale. Per questo usa una propria istanza di `creaRegistroMetriche()` invece
 * di leggere/scrivere `StatoSessione.metriche`.
 *
 * Fedeltà comportamentale alta, identitaria nulla (ADR-0008): stessi campi, stessa etichetta
 * di aiuto insufficiente, stesso messaggio d'errore opaco ("Codice non valido.", l'unico
 * dell'app privo di `AzioneDiRecupero` — vive fuori dal tipo `ErroreCarePath` di proposito).
 * Nessun logo, nessun nome di ente reale, nessuno screenshot di terzi.
 *
 * Misurazione reale del "prima" (chiude il rilievo IMPORTANTE del party di Gate 2 su
 * AC-RD2.1: S-11 non deve mostrare un numero promesso a priori se qualcuno ha davvero
 * interagito con questa replica). La propria istanza di `RegistroMetriche` conta, mentre
 * la persona interagisce con il modulo:
 * - `contaSchermo('S-10')` una volta al mount;
 * - `contaCampoCompilato()` la prima volta che ciascun campo di testo smette di essere vuoto;
 * - `contaDecisione()` quando si tocca "Accedi" (l'unica decisione richiesta da questo modulo);
 * - `segnalaErroreSenzaRecupero('NRE_FORMATO_NON_VALIDO')` quando compare il messaggio opaco —
 *   qui è un uso legittimo (non una sonda di test): è l'unico punto dell'app in cui un errore
 *   senza via d'uscita è per contratto ammesso (ADR-0008), proprio perché misura il baseline
 *   "prima" e non il comportamento di CarePath.
 *
 * L'istantanea viene esposta in sola lettura tramite `leggiUltimaIstantaneaPrimaMisurata()`:
 * non è stato condiviso (nessun context, nessuno storage persistente — architecture.md §7.1
 * vieta `localStorage`/`sessionStorage` anche qui), solo una variabile di modulo che S-11 può
 * consultare come arricchimento facoltativo del baseline statico di `PRD.md` §6. Se nessuno ha
 * ancora visitato S-10 in questa sessione del browser, resta `null` e chi legge ricade sui
 * valori statici dichiarati.
 */
let ultimaIstantaneaPrimaMisurata: MetricheSessione | null = null;

export function leggiUltimaIstantaneaPrimaMisurata(): MetricheSessione | null {
  return ultimaIstantaneaPrimaMisurata;
}

/** Solo per i test: riporta il modulo allo stato "nessuna visita ancora registrata". */
export function resetUltimaIstantaneaPrimaMisurataPerTest(): void {
  ultimaIstantaneaPrimaMisurata = null;
}

export interface S10PortaleReplicaProps {
  /** S-10 non ha accesso a `dispatch` (nessuno stato condiviso): la navigazione di ritorno
   *  la fornisce chi assembla l'app (T-47), non questo componente. */
  onTornaACarePath: () => void;
}

const LUNGHEZZA_NRE = 15;
const TITOLO_PAGINA = 'Portale di prenotazione — simulazione';

export function S10PortaleReplica({ onTornaACarePath }: S10PortaleReplicaProps) {
  const registro = useRef(creaRegistroMetriche());
  const campoNreGiaContato = useRef(false);
  const campoCfGiaContato = useRef(false);

  const [nre, setNre] = useState('');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [erroreVisibile, setErroreVisibile] = useState(false);

  function aggiornaIstantanea() {
    ultimaIstantaneaPrimaMisurata = registro.current.istantanea();
  }

  useEffect(() => {
    // Identità della replica (ADR-0008): titolo di pagina distinto dall'H1 on-screen, senza
    // alcun riferimento geografico o a un ente reale.
    const titoloPrecedente = document.title;
    document.title = TITOLO_PAGINA;
    return () => {
      document.title = titoloPrecedente;
    };
  }, []);

  useEffect(() => {
    registro.current.contaSchermo('S-10');
    aggiornaIstantanea();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- una sola volta al mount, l'istanza di registro è stabile (useRef)
  }, []);

  function alCambioNre(valore: string) {
    if (!campoNreGiaContato.current && valore.length > 0) {
      registro.current.contaCampoCompilato();
      campoNreGiaContato.current = true;
      aggiornaIstantanea();
    }
    setNre(valore.slice(0, LUNGHEZZA_NRE));
  }

  function alCambioCodiceFiscale(valore: string) {
    if (!campoCfGiaContato.current && valore.length > 0) {
      registro.current.contaCampoCompilato();
      campoCfGiaContato.current = true;
      aggiornaIstantanea();
    }
    setCodiceFiscale(valore);
  }

  function alSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    registro.current.contaDecisione(); // "Accedi" è l'unica decisione richiesta da questo modulo
    // La simulazione non verifica mai davvero le credenziali: il portale "prima" mostra
    // sempre questo esito, opaco per costruzione (ADR-0008) — è la barriera che Anna incontra.
    registro.current.segnalaErroreSenzaRecupero('NRE_FORMATO_NON_VALIDO');
    setErroreVisibile(true);
    aggiornaIstantanea();
  }

  return (
    <Schermo titolo="Accedi con la ricetta">
      <Alert color="warning" isOpen className="mb-4">
        <p className="mb-2">
          Questa è una simulazione del portale CUP. Non usa loghi o dati reali. Serve solo per mostrare la
          differenza con CarePath.
        </p>
        <button type="button" className="btn btn-link p-0" onClick={onTornaACarePath}>
          Torna a CarePath
        </button>
      </Alert>

      <Form onSubmit={alSubmit} noValidate>
        <FormGroup>
          <Input
            id="s10-nre"
            label="Numero ricetta elettronica (NRE)"
            infoText="15 caratteri, lo trovi sul promemoria della ricetta"
            value={nre}
            maxLength={LUNGHEZZA_NRE}
            onChange={(evento) => alCambioNre(evento.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Input
            id="s10-codice-fiscale"
            label="Codice fiscale"
            value={codiceFiscale}
            onChange={(evento) => alCambioCodiceFiscale(evento.target.value)}
          />
        </FormGroup>
        <Button color="primary" type="submit" block>
          Accedi
        </Button>
      </Form>

      {erroreVisibile && (
        <Alert color="danger" className="mt-4">
          Codice non valido.
        </Alert>
      )}
    </Schermo>
  );
}
