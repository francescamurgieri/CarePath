import { useState } from 'react';
import { Accordion, AccordionHeader, AccordionBody } from 'design-react-kit';
import { spiega, type Termine } from '../servizi/dizionario/termini.it';

/**
 * componenti/CheSignifica.tsx — T-27 (AC-04.1, ADR-0009 §1).
 *
 * Affordance "Che significa?" per un termine amministrativo mostrato ad Anna. Il testo è
 * SEMPRE quello del dizionario statico (`spiega(termine)`): questo componente non genera,
 * non riformula e non riceve testo libero — solo `Termine`, la chiave del dizionario.
 *
 * È un elemento visibile ed espandibile su richiesta (click o tastiera), MAI un tooltip a
 * solo hover: chi non può usare il mouse deve poterlo raggiungere allo stesso modo di chi
 * lo usa. Implementato con `Accordion`/`AccordionHeader`/`AccordionBody` di design-react-kit
 * (architecture.md §6.4): l'header è un vero `<button>` con `aria-expanded`, quindi Invio e
 * Spazio lo attivano nativamente, senza bisogno di gestori di tastiera aggiuntivi.
 */
export interface CheSignificaProps {
  termine: Termine;
}

export function CheSignifica({ termine }: CheSignificaProps) {
  const [aperto, setAperto] = useState(false);
  const spiegazione = spiega(termine);

  return (
    <Accordion className="che-significa">
      <AccordionHeader active={aperto} onToggle={() => setAperto((precedente) => !precedente)}>
        {`Che significa? — ${spiegazione.titolo}`}
      </AccordionHeader>
      <AccordionBody active={aperto}>
        <p>{spiegazione.testo}</p>
      </AccordionBody>
    </Accordion>
  );
}
