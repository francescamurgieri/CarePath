import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessioneProvider, useSessione } from '../stato/SessioneProvider';
import { S11AutonomiaLimiti } from './S11AutonomiaLimiti';
import { resetUltimaIstantaneaPrimaMisurataPerTest } from './S10PortaleReplica';

/** Sonda di test: espone `schermoCorrente` per verificare il dispatch senza router (ADR-0001). */
function SondaSchermoCorrente() {
  const { stato } = useSessione();
  return <p data-testid="sonda-schermo-corrente">{stato.schermoCorrente}</p>;
}

/**
 * schermi/S11AutonomiaLimiti.test.tsx — T-46 (RD-02, AC-RD2.1, AC-RD2.2).
 * Copre i 2 scenari di `portale_prima.feature` — funzionalità "Vedere quanto è cambiato con CarePath".
 */
function renderS11() {
  return render(
    <SessioneProvider>
      <S11AutonomiaLimiti />
    </SessioneProvider>,
  );
}

describe('schermi/S11AutonomiaLimiti — tabella e limiti (architecture.md §4.7)', () => {
  beforeEach(() => {
    resetUltimaIstantaneaPrimaMisurataPerTest();
  });

  it('I contatori prima/dopo sono visibili dopo la conferma — tabella con tutte le righe richieste', () => {
    renderS11();

    const tabella = screen.getByRole('table');
    for (const etichetta of [
      /Campi di testo da compilare/i,
      /Termini senza spiegazione/i,
      /Decisioni richieste/i,
      /Errori senza recupero guidato/i,
      /Schermi fino alla conferma/i,
      /Task completato da Anna da sola/i,
    ]) {
      expect(screen.getByRole('rowheader', { name: etichetta })).toBeInTheDocument();
    }
    expect(tabella).toHaveTextContent('Prima (portale CUP)');
    expect(tabella).toHaveTextContent('Con CarePath');
  });

  it('applica i target aggiornati del party di Gate 2: M3 ≤ 4, M5 ≤ 8 (non più ≤ 2 / ≤ 6)', () => {
    renderS11();

    expect(screen.getByText(/≤ 4 \(fra 2–3 opzioni\)/)).toBeInTheDocument();
    expect(screen.getByText('≤ 8')).toBeInTheDocument();
  });

  it('I limiti residui sono dichiarati apertamente in una sezione "Limiti che restano"', async () => {
    const utente = userEvent.setup();
    renderS11();

    expect(screen.getByRole('heading', { name: 'Limiti che restano' })).toBeInTheDocument();

    await utente.click(screen.getByRole('button', { name: /sistema di prenotazione è simulato/i }));
    expect(screen.getByText(/la conferma non è trasmessa a un CUP reale/i)).toBeInTheDocument();

    await utente.click(screen.getByRole('button', { name: /metriche non validate con utenti reali/i }));
    expect(screen.getByText(/misurate sulla demo/i)).toBeInTheDocument();
  });

  it('naviga a S-09 e S-01 tramite i link di ritorno, senza router (ADR-0001)', async () => {
    const utente = userEvent.setup();
    render(
      <SessioneProvider>
        <S11AutonomiaLimiti />
        <SondaSchermoCorrente />
      </SessioneProvider>,
    );

    await utente.click(screen.getByRole('button', { name: 'Torna alla conferma' }));
    expect(screen.getByTestId('sonda-schermo-corrente')).toHaveTextContent('S-09');

    await utente.click(screen.getByRole('button', { name: "Torna all'inizio" }));
    expect(screen.getByTestId('sonda-schermo-corrente')).toHaveTextContent('S-01');
  });

  it('richiede SessioneProvider (schermata del percorso nominale, non isolata come S-10)', () => {
    const consoleErrorOriginale = console.error;
    console.error = () => {};
    try {
      expect(() => render(<S11AutonomiaLimiti />)).toThrow(/useSessione deve essere usato dentro/);
    } finally {
      console.error = consoleErrorOriginale;
    }
  });
});
