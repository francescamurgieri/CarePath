/**
 * stato/SessioneProvider.test.tsx — parte di T-24b.
 *
 * Definizione di fatto: un componente di test avvolto nel provider legge `schermoCorrente`
 * iniziale (S-01) e può dispatchare un'azione che lo cambia; il tasto "indietro" del browser
 * (simulato con `history.back()` in jsdom) riporta allo schermo precedente.
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { SessioneProvider, useSessione } from './SessioneProvider';

function ComponenteDiProva() {
  const { stato, dispatch } = useSessione();
  return (
    <div>
      <p data-testid="schermo-corrente">{stato.schermoCorrente}</p>
      <button
        onClick={() =>
          dispatch({
            tipo: 'FOTO_ACQUISITA',
            foto: {
              immagine: new Blob(['x'], { type: 'image/jpeg' }),
              anteprimaUrl: 'blob:test',
              larghezzaPx: 100,
              altezzaPx: 100,
              acquisitaIl: new Date(),
              sorgente: 'fotocamera',
            },
          })
        }
      >
        Fotografa
      </button>
    </div>
  );
}

describe('SessioneProvider', () => {
  beforeEach(() => {
    // Riporta la history di jsdom a un punto pulito prima di ogni test.
    window.history.replaceState(null, '', '/');
  });

  it('espone lo schermo iniziale S-01', () => {
    render(
      <SessioneProvider>
        <ComponenteDiProva />
      </SessioneProvider>,
    );
    expect(screen.getByTestId('schermo-corrente')).toHaveTextContent('S-01');
  });

  it('un dispatch cambia schermoCorrente', async () => {
    const utente = userEvent.setup();
    render(
      <SessioneProvider>
        <ComponenteDiProva />
      </SessioneProvider>,
    );
    await utente.click(screen.getByRole('button', { name: 'Fotografa' }));
    expect(screen.getByTestId('schermo-corrente')).toHaveTextContent('S-03');
  });

  it('history.back() del browser riporta allo schermo precedente', async () => {
    const utente = userEvent.setup();
    render(
      <SessioneProvider>
        <ComponenteDiProva />
      </SessioneProvider>,
    );
    await utente.click(screen.getByRole('button', { name: 'Fotografa' }));
    expect(screen.getByTestId('schermo-corrente')).toHaveTextContent('S-03');

    await act(async () => {
      window.history.back();
    });

    await waitFor(() => {
      expect(screen.getByTestId('schermo-corrente')).toHaveTextContent('S-01');
    });
  });
});
