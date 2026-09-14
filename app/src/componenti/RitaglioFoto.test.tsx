import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RitaglioFoto } from './RitaglioFoto';
import type { Riquadro } from '../dominio/tipi';

const RIQUADRO: Riquadro = { x: 0.1, y: 0.2, larghezza: 0.3, altezza: 0.05 };
const ALT =
  'La tua ricetta: la zona evidenziata mostra il numero letto sotto il primo codice a barre.';

/**
 * T-29 — definizione di fatto: dato un `Riquadro` e un'immagine, il componente renderizza un
 * `<svg aria-hidden="true">` sovrapposto con `alt` descrittivo sull'immagine sottostante
 * (fallback_foto.feature, conferma_visita.feature — campo a bassa confidenza).
 */
describe('componenti/RitaglioFoto — evidenzia l\'area della foto', () => {
  it('mostra l\'immagine con un alt descrittivo e un overlay SVG decorativo', () => {
    const { container } = render(
      <RitaglioFoto immagineUrl="blob:foto-ricetta" riquadro={RIQUADRO} alt={ALT} />,
    );

    const immagine = screen.getByAltText(ALT);
    expect(immagine).toBeInTheDocument();
    expect(immagine.tagName).toBe('IMG');
    expect(immagine).toHaveAttribute('src', 'blob:foto-ricetta');

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('posiziona il riquadro in base alle coordinate normalizzate ricevute', () => {
    const { container } = render(
      <RitaglioFoto immagineUrl="blob:foto-ricetta" riquadro={RIQUADRO} alt={ALT} />,
    );

    const rettangolo = container.querySelector('svg rect');
    expect(rettangolo).not.toBeNull();
    expect(rettangolo).toHaveAttribute('x', String(RIQUADRO.x * 100));
    expect(rettangolo).toHaveAttribute('y', String(RIQUADRO.y * 100));
    expect(rettangolo).toHaveAttribute('width', String(RIQUADRO.larghezza * 100));
    expect(rettangolo).toHaveAttribute('height', String(RIQUADRO.altezza * 100));
  });

  it('non espone alcun testo tramite il markup SVG (la descrizione vive solo nell\'alt)', () => {
    const { container } = render(
      <RitaglioFoto immagineUrl="blob:foto-ricetta" riquadro={RIQUADRO} alt={ALT} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.textContent).toBe('');
  });
});
