import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheSignifica } from './CheSignifica';
import { spiega } from '../servizi/dizionario/termini.it';

/**
 * T-27 — definizione di fatto: dato un `Termine`, mostra un elemento visibile (non un tooltip
 * a solo hover) che espande il testo di `spiega(termine)`; tastiera (Enter/Space) attiva
 * l'espansione (conferma_visita.feature — affordance "Che significa?").
 */
describe('componenti/CheSignifica — affordance "Che significa?"', () => {
  it('mostra un controllo visibile e attivabile, il cui testo viene da spiega(termine)', async () => {
    const utente = userEvent.setup();
    render(<CheSignifica termine="nre" />);

    const spiegazione = spiega('nre');
    const controllo = screen.getByRole('button', { name: /che significa/i });
    expect(controllo).toBeVisible();
    expect(controllo).toHaveAttribute('aria-expanded', 'false');

    await utente.click(controllo);
    expect(controllo).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(spiegazione.testo)).toBeInTheDocument();
  });

  it('si attiva anche da tastiera (Invio) senza bisogno del mouse', async () => {
    const utente = userEvent.setup();
    render(<CheSignifica termine="branca" />);

    const controllo = screen.getByRole('button', { name: /che significa/i });
    await utente.tab();
    expect(controllo).toHaveFocus();

    await utente.keyboard('{Enter}');
    expect(controllo).toHaveAttribute('aria-expanded', 'true');

    await utente.keyboard(' ');
    expect(controllo).toHaveAttribute('aria-expanded', 'false');
  });

  it('mostra la spiegazione di ogni termine del dizionario, mai testo libero', () => {
    render(<CheSignifica termine="classePriorita" />);
    const spiegazione = spiega('classePriorita');
    expect(screen.getByText(spiegazione.testo)).toBeInTheDocument();
  });
});
