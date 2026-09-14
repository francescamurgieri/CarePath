/**
 * stato/SessioneProvider.tsx — T-24b.
 *
 * Nessun router (ADR-0001, ADR-0006 §5): il percorso è lineare e lo stato è uno solo. Questo
 * componente monta `macchinaSessione` in un `useReducer` e isola in un `useEffect` separato
 * l'unico side effect ammesso dal contratto di T-24 — la sincronizzazione con
 * `history.pushState`, cosi' che il tasto "indietro" del telefono funzioni senza introdurre
 * un router.
 *
 * Il reducer resta puro: questo file è l'unico punto dell'app che tocca `window.history`.
 */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { StatoSessione } from '../dominio/tipi';
import { type AzioneSessione, creaStatoIniziale, macchinaSessione } from './macchinaSessione';

interface ContestoSessione {
  stato: StatoSessione;
  dispatch: Dispatch<AzioneSessione>;
}

const ContestoSessione = createContext<ContestoSessione | null>(null);

/** Chiave usata in `history.state` per riconoscere le voci di history create da questo provider. */
const CHIAVE_HISTORY = 'carepath:schermo';

interface StatoHistory {
  [CHIAVE_HISTORY]: string;
  indicePercorso: number;
}

function leggiIndicePercorso(stato: unknown): number | null {
  if (
    typeof stato === 'object' &&
    stato !== null &&
    CHIAVE_HISTORY in stato &&
    'indicePercorso' in stato &&
    typeof (stato as StatoHistory).indicePercorso === 'number'
  ) {
    return (stato as StatoHistory).indicePercorso;
  }
  return null;
}

export function SessioneProvider({ children }: { children: ReactNode }) {
  const [stato, dispatch] = useReducer(macchinaSessione, undefined, creaStatoIniziale);

  // Ricorda quanti schermi avevamo già "pushato" in history, per distinguere una navigazione
  // in avanti (push di una nuova voce) da un "torna indietro" già riflesso da un popstate del
  // browser (in quel caso non bisogna ripushare, solo restare allineati).
  const ultimaLunghezzaSincronizzata = useRef(0);
  const stiamoApplicandoPopstate = useRef(false);

  // Effetto separato (T-24: il reducer resta puro): sincronizza `history.pushState` a ogni
  // avanzamento di `percorso`. Se il cambiamento è arrivato da un evento `popstate` (tasto
  // "indietro" del telefono), non si ripete il push: si aggiorna solo il contatore.
  useEffect(() => {
    const lunghezza = stato.percorso.length;
    if (stiamoApplicandoPopstate.current) {
      stiamoApplicandoPopstate.current = false;
      ultimaLunghezzaSincronizzata.current = lunghezza;
      return;
    }
    if (lunghezza === ultimaLunghezzaSincronizzata.current) {
      return;
    }
    const voceHistory: StatoHistory = { [CHIAVE_HISTORY]: stato.schermoCorrente, indicePercorso: lunghezza };
    if (lunghezza > ultimaLunghezzaSincronizzata.current) {
      window.history.pushState(voceHistory, '', undefined);
    } else {
      // Il "torna indietro" è avvenuto dentro l'app (es. pulsante a schermo), non tramite il
      // tasto del telefono: replichiamo lo stato in history senza aggiungere voci, cosi' un
      // successivo back del telefono resta coerente con `percorso`.
      window.history.replaceState(voceHistory, '', undefined);
    }
    ultimaLunghezzaSincronizzata.current = lunghezza;
  }, [stato.percorso, stato.schermoCorrente]);

  // Il tasto "indietro" del telefono emette `popstate`: lo traduciamo in `TORNA_INDIETRO`
  // finché l'indice registrato in history non raggiunge quello corrente.
  useEffect(() => {
    function alPopstate(evento: PopStateEvent) {
      const indiceRichiesto = leggiIndicePercorso(evento.state);
      if (indiceRichiesto === null || indiceRichiesto >= ultimaLunghezzaSincronizzata.current) {
        return;
      }
      stiamoApplicandoPopstate.current = true;
      dispatch({ tipo: 'TORNA_INDIETRO' });
    }
    window.addEventListener('popstate', alPopstate);
    return () => window.removeEventListener('popstate', alPopstate);
  }, []);

  return <ContestoSessione.Provider value={{ stato, dispatch }}>{children}</ContestoSessione.Provider>;
}

/** Hook di accesso allo stato e al dispatch. Lancia se usato fuori da `SessioneProvider`. */
export function useSessione(): ContestoSessione {
  const contesto = useContext(ContestoSessione);
  if (!contesto) {
    throw new Error('useSessione deve essere usato dentro <SessioneProvider>.');
  }
  return contesto;
}

/** Scorciatoia per dispatchare senza distruttarare il contesto ad ogni chiamata. */
export function useDispatchSessione(): Dispatch<AzioneSessione> {
  return useSessione().dispatch;
}
