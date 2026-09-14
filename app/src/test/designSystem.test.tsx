import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from 'design-react-kit';

/**
 * T-03 — Design system di base (AC-08.1).
 * Verifica che un componente Bootstrap Italia via design-react-kit si renderizzi con le
 * classi CSS corrette e superi un test RTL su ruolo e nome accessibile. Nessun componente
 * inventato: `Button` è il componente ufficiale del design system .italia.
 *
 * Regola vincolante (ADR-0001 punto 3, architecture.md §6.4): il JavaScript vanilla di
 * `bootstrap-italia` non viene MAI inizializzato su nodi React (niente `new bootstrap.*`).
 * Non è imposta da un linter dedicato in questo timebox: è verificata qui e in
 * `src/test/guardrail.test.ts` (T-49), che ispeziona il sorgente per l'assenza del pattern.
 */
describe('Design system di base — Button (Bootstrap Italia via design-react-kit)', () => {
  it('si renderizza con ruolo e nome accessibile, e la classe btn-primary', () => {
    render(<Button color="primary">Fotografa la ricetta</Button>);
    const bottone = screen.getByRole('button', { name: 'Fotografa la ricetta' });
    expect(bottone).toBeInTheDocument();
    expect(bottone.className).toMatch(/btn/);
    expect(bottone.className).toMatch(/btn-primary/);
  });
});
