/**
 * servizi/lettura/decodificatoreBarcode.ts — T-15 (ADR-0003, AC-01.2, AC-01.4).
 *
 * Decisione di pacchetto (non fissata da ADR-0003, che dice solo "ZXing WASM"): usiamo
 * `zxing-wasm` (sottopercorso `zxing-wasm/reader`, solo lettura). È mantenuto attivamente,
 * espone un binding TypeScript diretto (`readBarcodesFromImageData`) e il suo `.wasm` viene
 * importato con `?url` così Vite lo serve dall'origine — mai da CDN (ADR-0002). Alternativa
 * scartata: `@zxing/browser` (wrapper meno diretto, pensato per `<video>`/stream, non per un
 * singolo `ImageBitmap` già in memoria).
 *
 * Adapter: il contratto di architecture.md §4.2 vuole `decodifica(bitmap: ImageBitmap, …)`,
 * ma `zxing-wasm` legge `ImageData`. L'adapter (`bitmapAImageData`) converte con un canvas
 * offscreen: è l'unico punto che tocca il DOM/canvas in questo file.
 */
import { readBarcodesFromImageData, setZXingModuleOverrides } from 'zxing-wasm/reader';
// Vite risolve l'asset e lo serve dall'origine (mai da CDN — ADR-0002).
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import type { Riquadro } from '../../dominio/tipi';

export interface BarcodeLetto {
  formato: 'CODE_39' | 'CODE_128';
  testo: string;
  riquadro: Riquadro;
}

export interface DecodificatoreBarcode {
  disponibile(): Promise<boolean>;
  decodifica(bitmap: ImageBitmap, timeoutMs?: number): Promise<BarcodeLetto[]>;
}

const TIMEOUT_DEFAULT_MS = 3000;

let overridesConfigurati = false;
function configuraOverridesUnaVolta(): void {
  if (overridesConfigurati) return;
  setZXingModuleOverrides({ locateFile: () => zxingWasmUrl });
  overridesConfigurati = true;
}

function bitmapAImageData(bitmap: ImageBitmap): ImageData {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const contesto = canvas.getContext('2d');
  if (!contesto) {
    throw new Error('Impossibile ottenere un contesto 2D per la decodifica barcode.');
  }
  contesto.drawImage(bitmap, 0, 0);
  return contesto.getImageData(0, 0, bitmap.width, bitmap.height);
}

function posizioneARiquadro(
  posizione: { topLeft: { x: number; y: number }; topRight: { x: number; y: number }; bottomLeft: { x: number; y: number }; bottomRight: { x: number; y: number } },
  larghezzaImg: number,
  altezzaImg: number,
): Riquadro {
  const punti = [posizione.topLeft, posizione.topRight, posizione.bottomLeft, posizione.bottomRight];
  const xs = punti.map((p) => p.x);
  const ys = punti.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  return {
    x: xMin / larghezzaImg,
    y: yMin / altezzaImg,
    larghezza: (xMax - xMin) / larghezzaImg,
    altezza: (yMax - yMin) / altezzaImg,
  };
}

function formatoZxingAFormato(formato: string): 'CODE_39' | 'CODE_128' | null {
  if (formato === 'Code39') return 'CODE_39';
  if (formato === 'Code128') return 'CODE_128';
  return null;
}

export function creaDecodificatoreBarcode(): DecodificatoreBarcode {
  return {
    async disponibile(): Promise<boolean> {
      try {
        configuraOverridesUnaVolta();
        // Un tentativo di lettura su un'immagine 1x1 verifica che il modulo WASM carichi.
        const vuota = new ImageData(1, 1);
        await readBarcodesFromImageData(vuota, { formats: ['Code39'], maxNumberOfSymbols: 1 });
        return true;
      } catch {
        return false;
      }
    },

    async decodifica(bitmap: ImageBitmap, timeoutMs: number = TIMEOUT_DEFAULT_MS): Promise<BarcodeLetto[]> {
      configuraOverridesUnaVolta();
      const imageData = bitmapAImageData(bitmap);

      const letturaConTimeout = (async (): Promise<BarcodeLetto[]> => {
        const risultati = await readBarcodesFromImageData(imageData, {
          formats: ['Code39', 'Code128'],
          tryHarder: true,
        });
        return risultati
          .map((r) => {
            const formato = formatoZxingAFormato(r.format);
            if (!formato || !r.isValid) return null;
            const letto: BarcodeLetto = {
              formato,
              testo: r.text,
              riquadro: posizioneARiquadro(r.position, bitmap.width, bitmap.height),
            };
            return letto;
          })
          .filter((v): v is BarcodeLetto => v !== null);
      })();

      const timeout = new Promise<BarcodeLetto[]>((resolve) => {
        setTimeout(() => resolve([]), timeoutMs);
      });

      try {
        return await Promise.race([letturaConTimeout, timeout]);
      } catch {
        // Non lancia mai: un fallimento di decodifica ritorna [] (architecture.md §4.2).
        return [];
      }
    },
  };
}
