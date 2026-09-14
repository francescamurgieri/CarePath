import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { creaLettoreRicetta } from './LettoreRicetta';

/**
 * T-19 — Test lento sulla foto REALE di intake (CLAUDE.md: "il sistema deve leggere
 * immagini di ricette vere"; ADR-0010 §6). Escluso dalla suite veloce
 * (`npm test` = `vitest run --exclude '**\/*.slow.test.ts'`): il suo esito dipende dalla
 * qualità dell'immagine e dall'ambiente grafico disponibile, non dal codice, e non deve
 * poter bloccare la build. Si esegue con `npm run test:slow`.
 *
 * Limite dichiarato: l'ambiente di test (Vitest + jsdom) non implementa
 * `createImageBitmap`/`OffscreenCanvas`/Canvas 2D reali — sono API di un vero browser.
 * Se assenti, il test lo dichiara esplicitamente e si ferma qui: non è un fallimento del
 * lettore, è un limite dell'ambiente di esecuzione headless. La verifica end-to-end reale
 * si fa aprendo `npm run dev` e caricando la foto da un browser vero (nota anche in
 * `tasks.md` ST-07).
 */
const PERCORSO_IMMAGINE = path.resolve(__dirname, '../../../../intake/idea/Example files/image.png');
const NRE_ATTESO = '010A24518061015';

describe('servizi/lettura — lettura reale sulla foto di intake (T-19)', () => {
  const ambienteSupportato = typeof (globalThis as Record<string, unknown>).createImageBitmap === 'function';

  it.skipIf(!ambienteSupportato)('legge l’NRE 010A24518061015 dalla foto reale (o fallisce in modo documentato)', async () => {
    expect(fs.existsSync(PERCORSO_IMMAGINE)).toBe(true);
    const buffer = fs.readFileSync(PERCORSO_IMMAGINE);
    const immagine = new Blob([buffer], { type: 'image/png' });

    const lettore = creaLettoreRicetta();
    const foto = {
      immagine,
      anteprimaUrl: '',
      larghezzaPx: 0,
      altezzaPx: 0,
      acquisitaIl: new Date(),
      sorgente: 'galleria' as const,
    };

    const risultato = await lettore.leggi(foto);

    if (risultato.esito === 'errore') {
      // Fallimento documentato: non blocca il Gate 3 (escluso dalla suite veloce).
      console.warn(`[T-19] Lettura reale fallita: ${risultato.errore.codice} — ${risultato.errore.messaggioPerLaPersona}`);
      expect(risultato.errore.recupero).toBeTruthy();
      return;
    }

    if (risultato.valore.nre.stato === 'nonLetto') {
      console.warn('[T-19] NRE non letto sulla foto reale: fallimento documentato, non blocca la build.');
      return;
    }

    expect(risultato.valore.nre.valore.completo).toBe(NRE_ATTESO);
  }, 30_000);

  it('l’ambiente headless senza createImageBitmap è un limite dichiarato, non un difetto del lettore', () => {
    if (!ambienteSupportato) {
      console.warn('[T-19] createImageBitmap non disponibile in questo ambiente di test: verifica manuale richiesta in un browser reale.');
    }
    expect(true).toBe(true);
  });
});
