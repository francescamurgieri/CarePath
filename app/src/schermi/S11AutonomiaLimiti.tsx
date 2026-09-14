import { useState } from 'react';
import { Accordion, AccordionBody, AccordionHeader, Table } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { useDispatchSessione, useSessione } from '../stato/SessioneProvider';
import { METRICHE_PRIMA_STATICHE } from '../servizi/metriche/registroMetriche';
import { leggiUltimaIstantaneaPrimaMisurata } from './S10PortaleReplica';

/**
 * schermi/S11AutonomiaLimiti.tsx — T-46 (RD-02, AC-RD2.1, AC-RD2.2, architecture.md §4.7,
 * ux-spec.md §S-11, wireframes.md §S-11).
 *
 * Copy verbatim da `ux-spec.md` §S-11. Regola di conteggio — identica in `PRD.md` §6 e
 * `architecture.md` §4.7 — riportata anche nella nota sotto la tabella, come richiesto: un
 * valutatore che legge solo questa schermata deve poter verificare da solo il conteggio.
 * Target aggiornati dal party di Gate 2: M3 ≤ 4 decisioni, M5 ≤ 8 schermi (non più ≤ 2 / ≤ 6:
 * quei target erano contraddetti dal flusso nominale a 5 conferme e sono stati corretti alla
 * fonte, non solo qui).
 *
 * Colonna "Prima": usa il baseline misurato di `PRD.md` §6 (`METRICHE_PRIMA_STATICHE`); se in
 * questa sessione del browser qualcuno ha davvero visitato S-10 (ramo isolato, non condiviso —
 * architecture.md §2), sostituisce i numeri con l'istantanea realmente misurata da
 * `S10PortaleReplica`, mantenendo il testo esplicativo di `ux-spec.md` invariato.
 *
 * Colonna "Con CarePath": legge `StatoSessione.metriche` (condiviso, S-09 → S-11 nel grafo di
 * architecture.md §2). Se `registroMetriche` non è ancora collegato a `macchinaSessione` (le
 * azioni non incrementano ancora i contatori — dipende da un'onda diversa da questa, T-30…T-43),
 * `schermiAttraversati` resta 0: in quel caso, come previsto da `tasks.md` T-46, questa
 * schermata mostra i valori statici del target dichiarato in `ux-spec.md`, dichiarandolo qui.
 */

interface RigaMetrica {
  etichetta: string;
  prima: string;
  dopo: string;
}

const TESTO_NOTA_CONTEGGIO =
  'Contiamo solo gli schermi che chiedono un’azione (escluse le attese) e solo le decisioni ' +
  'fra alternative (esclusa la scelta di come scattare la foto). Stessa regola su entrambe le ' +
  'colonne — architecture.md §4.7.';

const LIMITI_RESIDUI: ReadonlyArray<{ titolo: string; testo: string }> = [
  {
    titolo: 'Il sistema di prenotazione è simulato',
    testo: 'Il sistema di prenotazione è simulato: la conferma non è trasmessa a un CUP reale.',
  },
  {
    titolo: '"Più vicino a casa" usa la ASL come proxy',
    testo: '"Più vicino a casa" usa la ASL come proxy, non il domicilio esatto.',
  },
  {
    titolo: 'Foto molto scure o ricette danneggiate',
    testo:
      'Se la foto è molto scura o la ricetta è danneggiata, il fallback guidato richiede comunque di copiare due numeri.',
  },
  {
    titolo: 'Più prestazioni sulla stessa ricetta',
    testo: 'Non gestisce più prestazioni sulla stessa ricetta.',
  },
  {
    titolo: 'Ricette rosse cartacee',
    testo: 'Non gestisce ricette rosse cartacee.',
  },
  {
    titolo: 'Metriche non validate con utenti reali',
    testo: 'Le metriche non sono validate con utenti reali: sono misurate sulla demo (§5 PRD).',
  },
];

export function S11AutonomiaLimiti() {
  const { stato } = useSessione();
  const dispatch = useDispatchSessione();
  const [accordionApertoIndice, setAccordionApertoIndice] = useState<number | null>(null);

  const dopo = stato.metriche;
  // T-46: nessun contatore live ancora collegato (dipendenza fuori da questa onda) ⇒ valori
  // statici del target, dichiarato qui invece che promesso in silenzio.
  const contatoriDopoNonAncoraCollegati = dopo.schermiAttraversati === 0 && dopo.decisioniRichieste === 0;

  const primaMisurata = leggiUltimaIstantaneaPrimaMisurata();

  const righe: RigaMetrica[] = [
    {
      etichetta: 'Campi di testo da compilare',
      prima: primaMisurata
        ? `${primaMisurata.campiDiTestoCompilati} (NRE 15 car. + CF 16 car.)`
        : `≥ ${METRICHE_PRIMA_STATICHE.campiDiTestoCompilati} (NRE 15 car. + CF 16 car.)`,
      dopo: contatoriDopoNonAncoraCollegati ? '0' : String(dopo.campiDiTestoCompilati),
    },
    {
      etichetta: 'Termini senza spiegazione',
      prima: `${METRICHE_PRIMA_STATICHE.terminiSenzaSpiegazione} (NRE, branca, priorità, struttura, esenzione)`,
      dopo: '0',
    },
    {
      etichetta: 'Decisioni richieste',
      prima: primaMisurata
        ? `${primaMisurata.decisioniRichieste} (decine di opzioni ciascuna)`
        : `~${METRICHE_PRIMA_STATICHE.decisioniRichieste} (decine di opzioni ciascuna)`,
      dopo: contatoriDopoNonAncoraCollegati ? '≤ 4 (fra 2–3 opzioni)' : String(dopo.decisioniRichieste),
    },
    {
      etichetta: 'Errori senza recupero guidato',
      prima: primaMisurata ? String(primaMisurata.erroriSenzaRecupero) : `≥ ${METRICHE_PRIMA_STATICHE.erroriSenzaRecupero}`,
      dopo: '0',
    },
    {
      etichetta: 'Schermi fino alla conferma',
      prima: primaMisurata ? String(primaMisurata.schermiAttraversati) : String(METRICHE_PRIMA_STATICHE.schermiAttraversati),
      dopo: contatoriDopoNonAncoraCollegati ? '≤ 8' : String(dopo.schermiAttraversati),
    },
    {
      etichetta: 'Task completato da Anna da sola',
      prima: METRICHE_PRIMA_STATICHE.completataSenzaAiuto ? 'Sì' : 'No',
      dopo: contatoriDopoNonAncoraCollegati ? 'Sì' : dopo.completataSenzaAiuto ? 'Sì' : 'No',
    },
  ];

  return (
    <Schermo titolo="Cosa è cambiato con CarePath">
      <button
        type="button"
        className="btn btn-link p-0 mb-3"
        onClick={() => dispatch({ tipo: 'NAVIGA_A', schermo: 'S-09' })}
      >
        Torna alla conferma
      </button>

      <Table bordered responsive>
        <thead>
          <tr>
            <th scope="col">Cosa si misura</th>
            <th scope="col">Prima (portale CUP)</th>
            <th scope="col">Con CarePath</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((riga) => (
            <tr key={riga.etichetta}>
              <th scope="row">{riga.etichetta}</th>
              <td>{riga.prima}</td>
              <td>{riga.dopo}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <p className="small">{TESTO_NOTA_CONTEGGIO}</p>

      <h2 className="h4 mt-4">Limiti che restano</h2>
      <Accordion>
        {LIMITI_RESIDUI.map((limite, indice) => (
          <div key={limite.titolo}>
            <AccordionHeader
              active={accordionApertoIndice === indice}
              onToggle={() => setAccordionApertoIndice((precedente) => (precedente === indice ? null : indice))}
            >
              {limite.titolo}
            </AccordionHeader>
            <AccordionBody active={accordionApertoIndice === indice}>
              <p>{limite.testo}</p>
            </AccordionBody>
          </div>
        ))}
      </Accordion>

      <button
        type="button"
        className="btn btn-link p-0 mt-4"
        onClick={() => dispatch({ tipo: 'NAVIGA_A', schermo: 'S-01' })}
      >
        Torna all'inizio
      </button>
    </Schermo>
  );
}
