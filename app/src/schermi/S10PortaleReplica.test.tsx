import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  S10PortaleReplica,
  leggiUltimaIstantaneaPrimaMisurata,
  resetUltimaIstantaneaPrimaMisurataPerTest,
} from './S10PortaleReplica';

/**
 * schermi/S10PortaleReplica.test.tsx — T-44 (RD-01, AC-RD1.1, AC-RD1.2, ADR-0008).
 * Copre i primi 4 scenari di `portale_prima.feature`.
 */
describe('schermi/S10PortaleReplica — replica del portale "prima" (ADR-0008)', () => {
  beforeEach(() => {
    resetUltimaIstantaneaPrimaMisurataPerTest();
  });

  it('Il percorso "prima" è raggiungibile in un tocco — mostra banner di simulazione e link di ritorno', () => {
    const onTorna = vi.fn();
    render(<S10PortaleReplica onTornaACarePath={onTorna} />);

    expect(
      screen.getByText(
        'Questa è una simulazione del portale CUP. Non usa loghi o dati reali. Serve solo per mostrare la differenza con CarePath.',
      ),
    ).toBeInTheDocument();
    // "non chiudibile": nessun pulsante di chiusura dell'alert (nessun "Chiudi"/aria-label di dismiss)
    expect(screen.queryByRole('button', { name: /chiudi/i })).not.toBeInTheDocument();
  });

  it('La replica mostra il campo NRE senza spiegazione utile sui due codici a barre', () => {
    render(<S10PortaleReplica onTornaACarePath={vi.fn()} />);

    expect(screen.getByLabelText('Numero ricetta elettronica (NRE)')).toBeInTheDocument();
    expect(screen.getByText('15 caratteri, lo trovi sul promemoria della ricetta')).toBeInTheDocument();
    expect(screen.queryByText(/codice a barre/i)).not.toBeInTheDocument();
  });

  it('La replica mostra il messaggio di errore opaco, senza indicazione di campo né azione di recupero', async () => {
    const utente = userEvent.setup();
    render(<S10PortaleReplica onTornaACarePath={vi.fn()} />);

    await utente.type(screen.getByLabelText('Numero ricetta elettronica (NRE)'), 'qualunquecosa');
    await utente.type(screen.getByLabelText('Codice fiscale'), 'qualunquealtracosa');
    await utente.click(screen.getByRole('button', { name: 'Accedi' }));

    const testoErrore = await screen.findByText('Codice non valido.');
    const errore = testoErrore.closest('[role="alert"]');
    expect(errore).not.toBeNull();
    // nessun'altra indicazione: né nome di campo, né azione, né link di recupero dentro l'errore
    expect(errore?.querySelector('a, button')).toBeNull();
  });

  it('Dalla simulazione si torna sempre a CarePath (invoca il callback fornito da chi assembla l\'app)', async () => {
    const utente = userEvent.setup();
    const onTorna = vi.fn();
    render(<S10PortaleReplica onTornaACarePath={onTorna} />);

    await utente.click(screen.getByRole('button', { name: 'Torna a CarePath' }));
    expect(onTorna).toHaveBeenCalledOnce();
  });

  it('non importa né usa SessioneProvider/macchinaSessione (architecture.md §2)', () => {
    // Verifica statica: nessun riferimento al modulo di stato condiviso nel sorgente del file.
    const sorgente = S10PortaleReplica.toString();
    expect(sorgente).not.toMatch(/useSessione|macchinaSessione|dispatch/);
  });

  it('misura davvero il "prima" con una propria istanza di RegistroMetriche, non valori statici', async () => {
    const utente = userEvent.setup();
    expect(leggiUltimaIstantaneaPrimaMisurata()).toBeNull();

    render(<S10PortaleReplica onTornaACarePath={vi.fn()} />);
    expect(leggiUltimaIstantaneaPrimaMisurata()?.schermiAttraversati).toBe(1);

    await utente.type(screen.getByLabelText('Numero ricetta elettronica (NRE)'), 'ABC');
    await utente.type(screen.getByLabelText('Codice fiscale'), 'XYZ');
    await utente.click(screen.getByRole('button', { name: 'Accedi' }));

    const istantanea = leggiUltimaIstantaneaPrimaMisurata();
    expect(istantanea?.campiDiTestoCompilati).toBe(2);
    expect(istantanea?.decisioniRichieste).toBe(1);
    expect(istantanea?.erroriSenzaRecupero).toBe(1);
  });
});
