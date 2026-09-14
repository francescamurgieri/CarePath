// App.tsx — T-47 (architecture.md §1, §2). Sostituisce lo stub di T-01.
//
// Nessun router (ADR-0001, ADR-0006 §5): la sincronizzazione con `history.pushState`
// vive già in `SessioneProvider` (T-24b). Questo componente si limita a leggere
// `schermoCorrente` — l'unica sorgente di verità — e a montare lo schermo corrispondente.
//
// `<RegioneAnnunci>` è montata una sola volta qui, fuori dal contenuto che cambia
// (componenti/RegioneAnnunci.tsx, T-26): è l'unica live region dell'app.
//
// S-10 (componenti/S10PortaleReplica) è un ramo isolato (architecture.md §2): non legge/scrive
// i dati di dominio della sessione (foto, lettura, ricetta, …). Resta comunque tracciato da
// `schermoCorrente`/`percorso` perché è lì che arriva il link "Vedi come funzionava prima" di
// S-01 e da dove si torna con "Torna a CarePath" — la sua unica dipendenza dal resto dell'app
// è la callback di navigazione, iniettata qui (T-47), non uno stato condiviso.
import { RegioneAnnunci } from './componenti/RegioneAnnunci';
import { SessioneProvider, useDispatchSessione, useSessione } from './stato/SessioneProvider';
import type { IdSchermo } from './dominio/tipi';

import S01Benvenuto from './schermi/S01Benvenuto';
import S02Fotografa from './schermi/S02Fotografa';
import S03LetturaInCorso from './schermi/S03LetturaInCorso';
import { S04ConfermaLettura } from './schermi/S04ConfermaLettura';
import { S04bRecupero } from './schermi/S04bRecupero';
import { S05bGuidaLettura } from './schermi/S05bGuidaLettura';
import { S06Preferenza } from './schermi/S06Preferenza';
import { S07ProposteAppuntamento } from './schermi/S07ProposteAppuntamento';
import { S08RiepilogoConferma } from './schermi/S08RiepilogoConferma';
import { S09PrenotazioneConfermata } from './schermi/S09PrenotazioneConfermata';
import { S10PortaleReplica } from './schermi/S10PortaleReplica';
import { S11AutonomiaLimiti } from './schermi/S11AutonomiaLimiti';

/** Uno schermo per `IdSchermo`: nessuna decisione di routing qui, solo una mappa 1:1 con il
 *  grafo di architecture.md §2. S-10 è l'unico che riceve una prop (la callback di ritorno). */
function SchermoCorrente() {
  const { stato } = useSessione();
  const dispatch = useDispatchSessione();

  const schermi: Record<IdSchermo, () => JSX.Element> = {
    'S-01': () => <S01Benvenuto />,
    'S-02': () => <S02Fotografa />,
    'S-03': () => <S03LetturaInCorso />,
    'S-04': () => <S04ConfermaLettura />,
    'S-04b': () => <S04bRecupero />,
    'S-05b': () => <S05bGuidaLettura />,
    'S-06': () => <S06Preferenza />,
    'S-07': () => <S07ProposteAppuntamento />,
    'S-08': () => <S08RiepilogoConferma />,
    'S-09': () => <S09PrenotazioneConfermata />,
    'S-10': () => <S10PortaleReplica onTornaACarePath={() => dispatch({ tipo: 'NAVIGA_A', schermo: 'S-01' })} />,
    'S-11': () => <S11AutonomiaLimiti />,
  };

  return schermi[stato.schermoCorrente]();
}

export default function App() {
  return (
    <SessioneProvider>
      <RegioneAnnunci />
      <SchermoCorrente />
    </SessioneProvider>
  );
}
