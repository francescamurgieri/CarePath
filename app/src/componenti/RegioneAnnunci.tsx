import { useEffect, useState } from 'react';

/**
 * componenti/RegioneAnnunci.tsx — T-26 (AC-08.4, architecture.md §6.3).
 *
 * `<RegioneAnnunci>` è l'UNICA live region dell'applicazione: va montata una sola volta,
 * in `App.tsx`, fuori dal contenuto che cambia a ogni schermo. Ogni componente che deve
 * annunciare un cambiamento a uno screen reader chiama `useAnnuncio()` — non crea una
 * propria `aria-live`. Live region multiple che si sovrappongono sono la causa più comune
 * di annunci persi: questo modulo la rende impossibile per costruzione.
 *
 * Implementazione: un singolo "ascoltatore" a livello di modulo, impostato dal mount di
 * `<RegioneAnnunci>` e usato da `useAnnuncio()` per scrivere il testo. Se `useAnnuncio()`
 * viene invocato prima che `<RegioneAnnunci>` sia montato, l'annuncio è silenziosamente
 * perso: nella app reale non accade, perché `<RegioneAnnunci>` vive in `App.tsx` (T-47).
 */
type Ascoltatore = (testo: string) => void;

let ascoltatoreCorrente: Ascoltatore | null = null;

/** Ritorna la funzione da chiamare per annunciare un testo nell'unica regione live dell'app. */
export function useAnnuncio(): (testo: string) => void {
  return (testo: string) => {
    ascoltatoreCorrente?.(testo);
  };
}

export function RegioneAnnunci() {
  const [testo, setTesto] = useState('');

  useEffect(() => {
    ascoltatoreCorrente = setTesto;
    return () => {
      if (ascoltatoreCorrente === setTesto) {
        ascoltatoreCorrente = null;
      }
    };
  }, []);

  return (
    <div aria-live="polite" aria-atomic="true" className="visually-hidden">
      {testo}
    </div>
  );
}
