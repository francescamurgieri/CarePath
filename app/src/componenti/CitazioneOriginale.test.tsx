import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CitazioneOriginale } from './CitazioneOriginale';

const CITAZIONE = 'VISITA ORTOPEDICA DI CONTROLLO — 89.01.G';

/**
 * T-28 — definizione di fatto: il testo passato come `citazioneOriginale` è presente nel DOM
 * accessibile (non solo visivamente) dopo l'espansione, raggiungibile in un tocco/invio da
 * tastiera (conferma_visita.feature — "Il testo originale della ricetta è sempre disponibile").
 */
describe('componenti/CitazioneOriginale — testo originale sempre disponibile (G-03)', () => {
  it('espande il testo originale esatto al click, senza alterarlo', async () => {
    const utente = userEvent.setup();
    render(<CitazioneOriginale citazioneOriginale={CITAZIONE} />);

    const controllo = screen.getByRole('button', { name: 'Vedi il testo originale della ricetta' });
    expect(controllo).toHaveAttribute('aria-expanded', 'false');

    await utente.click(controllo);
    expect(controllo).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(CITAZIONE)).toBeInTheDocument();
  });

  it('è raggiungibile e attivabile da tastiera (Invio)', async () => {
    const utente = userEvent.setup();
    render(<CitazioneOriginale citazioneOriginale={CITAZIONE} />);

    await utente.tab();
    const controllo = screen.getByRole('button', { name: 'Vedi il testo originale della ricetta' });
    expect(controllo).toHaveFocus();

    await utente.keyboard('{Enter}');
    expect(controllo).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(CITAZIONE)).toBeInTheDocument();
  });

  it('con apertoDiDefault=true (uso in S-04) è già espansa al mount', () => {
    render(<CitazioneOriginale citazioneOriginale={CITAZIONE} apertoDiDefault />);
    const controllo = screen.getByRole('button', { name: 'Vedi il testo originale della ricetta' });
    expect(controllo).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(CITAZIONE)).toBeInTheDocument();
  });
});
