import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';

/**
 * componenti/Schermo.tsx — T-25 (AC-08.4, ADR-0001 punto 1, architecture.md §6.1/§6.2).
 *
 * Unico componente autorizzato a emettere un `<h1>` in tutta l'applicazione: ogni schermo
 * (S-01…S-11) si renderizza dentro `<Schermo titolo=…>`. Un `<h1>` scritto altrove è un errore
 * (verificato anche da `src/test/guardrail.test.ts`, T-49).
 *
 * Focus management: al mount (e a ogni cambio di `titolo`, cioè a ogni cambio di schermo)
 * sposta il focus sull'H1 stesso (`tabIndex={-1}`), così chi naviga da tastiera o screen
 * reader riparte sempre dall'inizio del nuovo contenuto — mai dall'alto della pagina intera.
 */
export interface SchermoProps extends PropsWithChildren {
  /** Testo del titolo H1. Copy verbatim di ux-spec.md per ogni schermo. */
  titolo: ReactNode;
}

export function Schermo({ titolo, children }: SchermoProps) {
  const titoloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titoloRef.current?.focus();
  }, [titolo]);

  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: 720 }}>
      <h1 ref={titoloRef} tabIndex={-1} className="h3 mb-4">
        {titolo}
      </h1>
      {children}
    </div>
  );
}
