import { useState } from 'react';
import { Accordion, AccordionHeader, AccordionBody } from 'design-react-kit';

/**
 * componenti/CitazioneOriginale.tsx — T-28 (AC-02.2, G-03, ADR-0009 §2).
 *
 * Il testo originale della ricetta (`citazioneOriginale`, mai riformulato) deve restare
 * sempre disponibile ad Anna: questo componente lo mostra alla lettera, in un'espansione
 * raggiungibile in un tocco o con la tastiera. Non aggiunge, non toglie e non riordina
 * caratteri rispetto a quanto passato in `citazioneOriginale`: la semplificazione (etichetta,
 * "Che significa?") è additiva altrove, mai qui.
 *
 * In S-04 l'accordion è aperto di default (ux-spec.md §S-04): il chiamante lo esprime con
 * `apertoDiDefault`, così il componente resta generico e testabile in isolamento.
 */
export interface CitazioneOriginaleProps {
  citazioneOriginale: string;
  apertoDiDefault?: boolean;
}

export function CitazioneOriginale({ citazioneOriginale, apertoDiDefault = false }: CitazioneOriginaleProps) {
  const [aperto, setAperto] = useState(apertoDiDefault);

  return (
    <Accordion className="citazione-originale">
      <AccordionHeader active={aperto} onToggle={() => setAperto((precedente) => !precedente)}>
        Vedi il testo originale della ricetta
      </AccordionHeader>
      <AccordionBody active={aperto}>
        <p lang="it">{citazioneOriginale}</p>
      </AccordionBody>
    </Accordion>
  );
}
