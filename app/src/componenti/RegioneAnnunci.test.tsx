import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RegioneAnnunci, useAnnuncio } from './RegioneAnnunci';

/**
 * T-26 — definizione di fatto: `aria-live="polite"` su un solo nodo dell'albero; chiamare
 * `useAnnuncio()` due volte in rapida sequenza aggiorna lo stesso nodo, senza crearne un
 * secondo (accessibilita.feature — "Lo schermo annuncia i cambiamenti").
 */
function ComponenteCheAnnuncia({ testo }: { testo: string }) {
  const annuncia = useAnnuncio();
  return (
    <button type="button" onClick={() => annuncia(testo)}>
      annuncia
    </button>
  );
}

describe('componenti/RegioneAnnunci — unica live region dell\'app', () => {
  it('espone una sola regione aria-live="polite"', () => {
    render(<RegioneAnnunci />);
    const regioni = document.querySelectorAll('[aria-live="polite"]');
    expect(regioni).toHaveLength(1);
    expect(regioni[0]).toHaveAttribute('aria-live', 'polite');
  });

  it('due chiamate ravvicinate a useAnnuncio() aggiornano lo stesso nodo, non ne creano un secondo', () => {
    const { rerender } = render(
      <>
        <RegioneAnnunci />
        <ComponenteCheAnnuncia testo="Ho trovato la tua visita" />
      </>,
    );

    const bottone = screen.getByRole('button', { name: 'annuncia' });
    act(() => {
      bottone.click();
    });

    let regioni = document.querySelectorAll('[aria-live="polite"]');
    expect(regioni).toHaveLength(1);
    expect(regioni[0]).toHaveTextContent('Ho trovato la tua visita');

    rerender(
      <>
        <RegioneAnnunci />
        <ComponenteCheAnnuncia testo="Sto leggendo la ricetta..." />
      </>,
    );
    const secondoBottone = screen.getByRole('button', { name: 'annuncia' });
    act(() => {
      secondoBottone.click();
    });

    regioni = document.querySelectorAll('[aria-live="polite"]');
    expect(regioni).toHaveLength(1);
    expect(regioni[0]).toHaveTextContent('Sto leggendo la ricetta...');
  });
});
