/**
 * dominio/nre.ts — T-07 (AC-01.4, AC-03.2, ADR-0003).
 * Composizione e validazione dell'NRE: segmentoA (5 caratteri) + segmentoB (10 caratteri) = 15.
 * Nessuna composizione parziale è accettata silenziosamente.
 */
import type { Nre, Risultato } from './tipi';
import { erroreNreFormatoNonValido } from './errori';

export const LUNGHEZZA_SEGMENTO_A = 5;
export const LUNGHEZZA_SEGMENTO_B = 10;
export const LUNGHEZZA_NRE_COMPLETO = 15;

/** Compone i due segmenti stampati sulla ricetta. Rifiuta se le lunghezze non tornano. */
export function componiNre(segmentoA: string, segmentoB: string): Risultato<Nre> {
  const a = segmentoA.trim().toUpperCase();
  const b = segmentoB.trim().toUpperCase();

  if (a.length !== LUNGHEZZA_SEGMENTO_A || b.length !== LUNGHEZZA_SEGMENTO_B) {
    return { esito: 'errore', errore: erroreNreFormatoNonValido() };
  }

  return {
    esito: 'ok',
    valore: { segmentoA: a, segmentoB: b, completo: a + b },
  };
}

/** Mostrata ad Anna "spezzata in gruppi leggibili" (AC-01.4): "010A2 · 4518061015". */
export function formattaNreLeggibile(nre: Nre): string {
  return `${nre.segmentoA} · ${nre.segmentoB}`;
}

export function validaSegmentoA(valore: string): { valido: boolean; caratteriMancanti: number } {
  const lunghezza = valore.trim().length;
  return { valido: lunghezza === LUNGHEZZA_SEGMENTO_A, caratteriMancanti: Math.max(0, LUNGHEZZA_SEGMENTO_A - lunghezza) };
}

export function validaSegmentoB(valore: string): { valido: boolean; caratteriMancanti: number } {
  const lunghezza = valore.trim().length;
  return { valido: lunghezza === LUNGHEZZA_SEGMENTO_B, caratteriMancanti: Math.max(0, LUNGHEZZA_SEGMENTO_B - lunghezza) };
}
