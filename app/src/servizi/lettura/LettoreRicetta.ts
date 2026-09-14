/**
 * servizi/lettura/LettoreRicetta.ts — T-18 (architecture.md §4.1, ADR-0003, ADR-0004).
 * Orchestratore: preprocessa → barcode → OCR → estraiCampi. Timeout a tre livelli,
 * `AbortSignal` propagato, degrado a `LetturaRicetta` con campi `nonLetto` — mai
 * un'eccezione verso la UI. Nessun flag scavalca questo lettore (ADR-0004): non importa
 * nulla da `src/fixtures/letture/`.
 */
import type { AcquisizioneFoto, LetturaRicetta, Risultato } from '../../dominio/tipi';
import { erroreFormatoNonSupportato, erroreImmagineTroppoGrande, erroreLetturaInTimeout, erroreMotoreNonDisponibile } from '../../dominio/errori';
import { creaDecodificatoreBarcode, type DecodificatoreBarcode } from './decodificatoreBarcode';
import { creaMotoreOcr, type MotoreOcr } from './motoreOcr';
import { preprocessa } from './preprocessa';
import { estraiCampi } from './estraiCampi';

export interface AvanzamentoLettura {
  fase: 'preprocessing' | 'barcode' | 'ocr' | 'estrazione' | 'piuLungoDelSolito';
  percentuale: number;
}

export interface OpzioniLettura {
  segnale?: AbortSignal;
  timeoutMs?: number;
  onProgresso?: (avanzamento: AvanzamentoLettura) => void;
}

export interface LettoreRicetta {
  precarica(): Promise<void>;
  leggi(foto: AcquisizioneFoto, opzioni?: OpzioniLettura): Promise<Risultato<LetturaRicetta>>;
}

const TIMEOUT_TOTALE_MS = 20_000;
const TIMEOUT_BARCODE_MS = 3_000;
const TIMEOUT_OCR_MS = 15_000;
const SOGLIA_PIU_LUNGO_MS = 8_000;

const FORMATI_SUPPORTATI = ['image/jpeg', 'image/png', 'image/webp'];
const DIMENSIONE_MASSIMA_BYTES = 12 * 1024 * 1024;

export function creaLettoreRicetta(
  decodificatore: DecodificatoreBarcode = creaDecodificatoreBarcode(),
  motoreOcr: MotoreOcr = creaMotoreOcr(),
): LettoreRicetta {
  return {
    async precarica(): Promise<void> {
      // Invocata all'ingresso in S-02 (ADR-0003): l'attesa del modello sparisce dal percorso critico.
      await motoreOcr.precarica();
    },

    async leggi(foto: AcquisizioneFoto, opzioni?: OpzioniLettura): Promise<Risultato<LetturaRicetta>> {
      if (foto.immagine.size > DIMENSIONE_MASSIMA_BYTES) {
        return { esito: 'errore', errore: erroreImmagineTroppoGrande(`dimensione ${foto.immagine.size} byte`) };
      }
      if (!FORMATI_SUPPORTATI.includes(foto.immagine.type)) {
        return { esito: 'errore', errore: erroreFormatoNonSupportato(`tipo ${foto.immagine.type}`) };
      }

      const inizio = Date.now();
      const timerPiuLungo = setTimeout(() => {
        opzioni?.onProgresso?.({ fase: 'piuLungoDelSolito', percentuale: 40 });
      }, SOGLIA_PIU_LUNGO_MS);

      try {
        const risultato = await Promise.race([
          eseguiPipeline(foto, decodificatore, motoreOcr, opzioni),
          nuovoTimeout<Risultato<LetturaRicetta>>(TIMEOUT_TOTALE_MS, {
            esito: 'errore',
            errore: erroreLetturaInTimeout(`timeout totale ${TIMEOUT_TOTALE_MS}ms`),
          }),
        ]);
        if (risultato.esito === 'ok') {
          risultato.valore.durataMs = Date.now() - inizio;
        }
        return risultato;
      } catch (e) {
        return { esito: 'errore', errore: erroreMotoreNonDisponibile(String(e)) };
      } finally {
        clearTimeout(timerPiuLungo);
      }
    },
  };
}

function nuovoTimeout<T>(ms: number, valore: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valore), ms));
}

async function eseguiPipeline(
  foto: AcquisizioneFoto,
  decodificatore: DecodificatoreBarcode,
  motoreOcr: MotoreOcr,
  opzioni?: OpzioniLettura,
): Promise<Risultato<LetturaRicetta>> {
  opzioni?.onProgresso?.({ fase: 'preprocessing', percentuale: 5 });

  const bitmapOriginale = await createImageBitmap(foto.immagine);
  const bitmap = await preprocessa(bitmapOriginale);

  opzioni?.onProgresso?.({ fase: 'barcode', percentuale: 20 });
  const barcodes = await decodificatore.decodifica(bitmap, TIMEOUT_BARCODE_MS);

  opzioni?.onProgresso?.({ fase: 'ocr', percentuale: 40 });
  const parole = await motoreOcr.riconosci(bitmap, { segnale: opzioni?.segnale, timeoutMs: TIMEOUT_OCR_MS });

  opzioni?.onProgresso?.({ fase: 'estrazione', percentuale: 90 });
  const lettura = estraiCampi(parole, barcodes, { larghezzaPx: bitmap.width, altezzaPx: bitmap.height });
  lettura.idLettura = `lettura-${foto.acquisitaIl.getTime()}`;

  return { esito: 'ok', valore: lettura };
}
