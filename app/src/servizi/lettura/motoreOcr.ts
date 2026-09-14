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

        // Convertiamo in Blob prima di passare al worker Tesseract: ImageData serializzata via
        // postMessage perde la propria identità di costruttore nel contesto worker e finisce sul
        // path SetImageFile("/input") invece di SetImage — provocando "truncated file".
        // Un Blob è trasferibile senza perdita e Tesseract lo gestisce nativamente.
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Impossibile ottenere contesto 2D per la conversione in Blob.');
        ctx.drawImage(bitmap, 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const esecuzione = worker.recognize(blob);

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
