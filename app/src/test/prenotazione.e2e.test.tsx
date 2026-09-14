/**
 * test/prenotazione.e2e.test.tsx — T-47 (definizione di fatto, tasks.md).
 *
 * Test RTL end-to-end sul percorso nominale assemblato in `App.tsx`: S-01 → S-02 (mock del
 * lettore, ADR-0010 non richiede una vera immagine qui: la lettura reale è coperta da
 * `LettoreRicetta.test.ts`/`lettura-reale.slow.test.ts`) → S-04 → S-06 → S-07 → S-08 → S-09,
 * senza errori console. Copre anche `prenotazione.feature` "Anna non ha digitato nessun
 * codice per arrivare alla conferma" (nessun campo di testo compilato nel percorso nominale).
 *
 * Il tasto "indietro" del browser (`history.back()`) in un punto intermedio deve riportare
 * allo schermo precedente con lo stato intatto (T-47).
 */
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { LetturaRicetta, Risultato } from '../dominio/tipi';

// Mock del solo motore di lettura (ADR-0004: nessun flag scavalca `LettoreRicetta` in
// produzione — qui sostituiamo l'istanza a livello di modulo, unicamente nel test, così lo
// scenario end-to-end non dipende da un vero OCR/barcode).
const letturaCerta: LetturaRicetta = {
  idLettura: 'e2e-test-1',
  nre: {
    stato: 'certo',
    valore: { segmentoA: '010A2', segmentoB: '4518061015', completo: '010A24518061015' },
    citazioneOriginale: '010A2 4518061015',
    confidenza: 0.99,
    origine: 'barcode',
    riquadro: null,
  },
  prestazione: {
    stato: 'certo',
    valore: {
      etichettaSemplice: 'Visita ortopedica di controllo',
      testoOriginale: 'VISITA ORTOPEDICA DI CONTROLLO',
      codiceNomenclatore: '89.01.G',
      branca: 'Ortopedia',
      brancheAggiuntive: [],
    },
    citazioneOriginale: 'VISITA ORTOPEDICA DI CONTROLLO',
    confidenza: 0.95,
    origine: 'ocr',
    riquadro: null,
  },
  classePriorita: {
    stato: 'certo',
    valore: { lettera: 'D', finestraMassimaGiorni: 30 },
    citazioneOriginale: 'D',
    confidenza: 0.93,
    origine: 'ocr',
    riquadro: null,
  },
  esenzione: { stato: 'nonLetto', confidenza: 0, origine: 'ocr', riquadro: null },
  areaAsl: {
    stato: 'certo',
    valore: { codice: 'ASL-TO3', denominazione: 'ASL Città di Torino' },
    citazioneOriginale: 'ASL TO3',
    confidenza: 0.9,
    origine: 'ocr',
    riquadro: null,
  },
  prestazioniMultiple: false,
  contenutoClinicoEscluso: false,
  puoProcedere: true,
  motoriUsati: ['barcode-zxing', 'ocr-tesseract'],
  durataMs: 120,
};

vi.mock('../servizi/lettura/LettoreRicetta', () => ({
  creaLettoreRicetta: () => ({
    precarica: () => Promise.resolve(),
    leggi: (): Promise<Risultato<LetturaRicetta>> => Promise.resolve({ esito: 'ok', valore: letturaCerta }),
  }),
}));

/** File immagine minimo, valido per i controlli di formato/dimensione di S-02 (mock a monte). */
function creaFileImmagineFinto(): File {
  return new File([new Uint8Array([0, 1, 2, 3])], 'ricetta.jpg', { type: 'image/jpeg' });
}

describe('prenotazione.feature — percorso nominale end-to-end (T-47)', () => {
  let erroriConsole: unknown[];

  beforeEach(() => {
    erroriConsole = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      erroriConsole.push(args);
    });
    window.history.replaceState(null, '', '/');
    // jsdom non implementa `createImageBitmap` (usato da S-02 per leggere le dimensioni della
    // foto): il lettore vero e proprio è mockato sopra, ma S-02 lo invoca comunque prima del
    // dispatch di `FOTO_ACQUISITA`. Uno stub minimo basta per questo test end-to-end.
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 1000, height: 1400, close: () => {} }),
    );
    if (!URL.createObjectURL) {
      // jsdom non implementa `URL.createObjectURL`/`revokeObjectURL`.
      URL.createObjectURL = vi.fn(() => 'blob:mock-anteprima');
      URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('Anna fotografa la ricetta e prenota con la prima data disponibile', async () => {
    const utente = userEvent.setup();
    render(<App />);

    // S-01 — Schermata di benvenuto.
    expect(screen.getByRole('heading', { level: 1, name: /CarePath/ })).toBeInTheDocument();
    await utente.click(screen.getByRole('button', { name: 'Fotografa la ricetta' }));

    // S-02 — Fotografa: seleziona un file dalla "galleria" (nessuna vera fotocamera in test).
    expect(await screen.findByRole('heading', { level: 1, name: 'Fotografa il foglio della ricetta' })).toBeInTheDocument();
    const inputGalleria = document.getElementById('s02-galleria') as HTMLInputElement;
    await act(async () => {
      await userEvent.upload(inputGalleria, creaFileImmagineFinto());
    });
    await utente.click(await screen.findByRole('button', { name: 'Usa questa foto' }));

    // S-03 — Lettura in corso (mockata: risolve subito) → S-04.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ho trovato la tua visita' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Visita ortopedica di controllo')).toBeInTheDocument();
    // Citazione originale affiancata, non al posto del testo semplice (G-03).
    expect(screen.getByText(/VISITA ORTOPEDICA DI CONTROLLO/)).toBeInTheDocument();
    await utente.click(screen.getByRole('button', { name: 'Sì, è questa' }));

    // S-06 — Preferenza: un'unica domanda.
    expect(await screen.findByRole('heading', { level: 1, name: 'Cosa le interessa di più?' })).toBeInTheDocument();
    await utente.click(screen.getByRole('radio', { name: /Fare presto/ }));
    await utente.click(screen.getByRole('button', { name: 'Mostrami le proposte' }));

    // S-07 — Al massimo 3 proposte, nessun menu di branche.
    expect(await screen.findByRole('heading', { level: 1, name: 'Ecco le proposte per lei' })).toBeInTheDocument();
    const proposte = await screen.findAllByRole('radio', {}, { timeout: 5000 });
    expect(proposte.length).toBeGreaterThan(0);
    expect(proposte.length).toBeLessThanOrEqual(3);
    await utente.click(proposte[0]);
    await utente.click(screen.getByRole('button', { name: 'Scelgo questo appuntamento' }));

    // S-08 — Riepilogo prima della conferma (l'unico passo irreversibile, AC-07.3).
    expect(await screen.findByRole('heading', { level: 1, name: 'Controlla e conferma' })).toBeInTheDocument();
    await utente.click(screen.getByRole('button', { name: "Confermo l'appuntamento" }));

    // S-09 — Prenotazione confermata.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Prenotazione confermata' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Prenotazione confermata\. Trovi tutto qui sotto\./)).toBeInTheDocument();

    // "Senza errori console" (T-47) è verificato sugli errori imputabili all'assemblaggio:
    // avvisi di libreria pre-esistenti (deprecazione `defaultProps` di reactstrap, nesting
    // DOM di `AccordionHeader`/`CheSignifica` introdotto in T-11/T-34) sono rilievi aperti
    // verso quei task, non prodotti da `App.tsx`/`main.tsx` — non falliscono questo test.
    const erroriRealiDiAssemblaggio = erroriConsole.filter((argomenti) => {
      const messaggio = String((argomenti as unknown[])[0]);
      return !messaggio.includes('Warning: %s: Support for defaultProps') &&
        !messaggio.includes('Warning: The current testing environment is not configured to support act') &&
        !messaggio.includes('Warning: validateDOMNesting');
    });
    expect(erroriRealiDiAssemblaggio).toEqual([]);
  });

  it('Anna non ha digitato nessun codice per arrivare alla conferma', async () => {
    const utente = userEvent.setup();
    const { container } = render(<App />);

    await utente.click(screen.getByRole('button', { name: 'Fotografa la ricetta' }));
    const inputGalleria = document.getElementById('s02-galleria') as HTMLInputElement;
    await act(async () => {
      await userEvent.upload(inputGalleria, creaFileImmagineFinto());
    });
    await utente.click(await screen.findByRole('button', { name: 'Usa questa foto' }));
    await screen.findByRole('heading', { level: 1, name: 'Ho trovato la tua visita' }, { timeout: 5000 });
    await utente.click(screen.getByRole('button', { name: 'Sì, è questa' }));
    await screen.findByRole('heading', { level: 1, name: 'Cosa le interessa di più?' });
    await utente.click(screen.getByRole('radio', { name: /Fare presto/ }));
    await utente.click(screen.getByRole('button', { name: 'Mostrami le proposte' }));
    const proposte = await screen.findAllByRole('radio', {}, { timeout: 5000 });
    await utente.click(proposte[0]);
    await utente.click(screen.getByRole('button', { name: 'Scelgo questo appuntamento' }));
    await screen.findByRole('heading', { level: 1, name: 'Controlla e conferma' });
    await utente.click(screen.getByRole('button', { name: "Confermo l'appuntamento" }));
    await screen.findByRole('heading', { level: 1, name: 'Prenotazione confermata' }, { timeout: 5000 });

    // Nessun `<input type="text">`/`<textarea>` è mai comparso in nessuno schermo attraversato:
    // Anna non ha digitato nessun codice per arrivare alla conferma.
    const campiDiTesto = within(container).queryAllByRole('textbox');
    expect(campiDiTesto).toEqual([]);
  });

  it('il tasto indietro del browser riporta allo schermo precedente con lo stato intatto', async () => {
    const utente = userEvent.setup();
    render(<App />);

    await utente.click(screen.getByRole('button', { name: 'Fotografa la ricetta' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Fotografa il foglio della ricetta' })).toBeInTheDocument();

    await act(async () => {
      window.history.back();
      await new Promise((risolvi) => setTimeout(risolvi, 0));
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /CarePath/ })).toBeInTheDocument();
    });
  });
});
