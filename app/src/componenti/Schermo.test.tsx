import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Schermo } from './Schermo';

/**
 * T-25 — definizione di fatto: esattamente un `<h1>` con `tabIndex={-1}` che riceve il focus
 * dopo il mount (accessibilita.feature — "Il percorso funziona anche con il tasto Tab").
 */
describe('componenti/Schermo — unico emettitore di <h1>, focus management', () => {
  it('renderizza esattamente un h1 con tabIndex=-1 e lo mette a fuoco dopo il mount', () => {
    render(
      <Schermo titolo="Ho trovato la tua visita">
        <p>Contenuto dello schermo</p>
      </Schermo>,
    );

    const titoli = screen.getAllByRole('heading', { level: 1 });
    expect(titoli).toHaveLength(1);

    const h1 = titoli[0];
    expect(h1).toHaveTextContent('Ho trovato la tua visita');
    expect(h1).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement).toBe(h1);
  });

  it('sposta di nuovo il focus sull\'h1 quando il titolo cambia (nuovo schermo)', () => {
    const { rerender } = render(<Schermo titolo="Sto leggendo la ricetta...">contenuto</Schermo>);
    const primoH1 = screen.getByRole('heading', { level: 1 });
    expect(document.activeElement).toBe(primoH1);

    // Un altro elemento prende il focus (simula l'interazione della persona)
    const bottone = document.createElement('button');
    document.body.appendChild(bottone);
    bottone.focus();
    expect(document.activeElement).toBe(bottone);

    rerender(<Schermo titolo="Ho trovato la tua visita">contenuto</Schermo>);
    const nuovoH1 = screen.getByRole('heading', { level: 1 });
    expect(document.activeElement).toBe(nuovoH1);

    bottone.remove();
  });
});
