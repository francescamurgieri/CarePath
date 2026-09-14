/**
 * servizi/lettura/motoreOcr.ts — T-16 (ADR-0003, AC-01.2, ADR-0002).
 * Tesseract.js, lingua `ita`, asset serviti dall'origine (`public/ocr/`): worker script,
 * core WASM e `ita.traineddata` sono copiati localmente al progetto — MAI da CDN (ADR-0002).
 * `cacheMethod: 'none'` evita che Tesseract usi IndexedDB per il proprio modello: coerente
 * con "nessuna persistenza" anche se qui non si tratta di dati di Anna, ma del motore stesso.
 */
import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';
import type { Confidenza, Riquadro } from '../../dominio/tipi';
import { normalizzaConfidenzaOcr } from '../../dominio/confidenza';
import { bitmapAImageData } from './preprocessa';

export interface ParolaOcr {
  testo: string;
  confidenza: Confidenza;
  riquadro: Riquadro;
}

export interface MotoreOcr {
  precarica(): Promise<void>;
  riconosci(
    bitmap: ImageBitmap,
    opzioni?: { segnale?: AbortSignal; timeoutMs?: number; whitelist?: string },
  ): Promise<ParolaOcr[]>;
}

const TIMEOUT_DEFAULT_MS = 15_000;
const PERCORSO_ASSET = '/ocr';

function riquadroNormalizzato(bbox: { x0: number; y0: number; x1: number; y1: number }, larghezza: number, altezza: number): Riquadro {
  return {
    x: bbox.x0 / larghezza,
    y: bbox.y0 / altezza,
    larghezza: (bbox.x1 - bbox.x0) / larghezza,
    altezza: (bbox.y1 - bbox.y0) / altezza,
  };
}

export function creaMotoreOcr(): MotoreOcr {
  let workerPromise: Promise<TesseractWorker> | null = null;

  function ottieniWorker(): Promise<TesseractWorker> {
    if (!workerPromise) {
      workerPromise = createWorker('ita', 1, {
        workerPath: `${PERCORSO_ASSET}/worker.min.js`,
        corePath: PERCORSO_ASSET,
        langPath: `${PERCORSO_ASSET}/lang`,
        cacheMethod: 'none',
        gzip: true,
      });
    }
    return workerPromise;
  }

  return {
    async precarica(): Promise<void> {
      await ottieniWorker();
    },

    async riconosci(bitmap, opzioni): Promise<ParolaOcr[]> {
      const timeoutMs = opzioni?.timeoutMs ?? TIMEOUT_DEFAULT_MS;
      try {
        const worker = await ottieniWorker();
        if (opzioni?.whitelist) {
          await worker.setParameters({ tessedit_char_whitelist: opzioni.whitelist });
        }

        const imageData = bitmapAImageData(bitmap);
        const esecuzione = worker.recognize(imageData as unknown as Parameters<TesseractWorker['recognize']>[0]);

        const risultato = await new Promise<Awaited<typeof esecuzione> | null>((resolve) => {
          const timer = setTimeout(() => resolve(null), timeoutMs);
          esecuzione.then((v) => {
            clearTimeout(timer);
            resolve(v);
          });
          opzioni?.segnale?.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve(null);
          });
        });

        // Timeout o abort: si restituiscono le parole già trovate — qui nessuna — mai un'eccezione.
        if (!risultato) return [];

        return risultato.data.words.map((parola) => ({
          testo: parola.text,
          confidenza: normalizzaConfidenzaOcr(parola.confidence),
          riquadro: riquadroNormalizzato(parola.bbox, bitmap.width, bitmap.height),
        }));
      } catch {
        return [];
      }
    },
  };
}
