/**
 * servizi/lettura/preprocessa.ts — T-17 (ADR-0003: pipeline preprocessa → barcode → OCR).
 * Ridimensiona a lato lungo <= 2000px e converte in scala di grigi, per dare a barcode/OCR
 * un'immagine più leggera e a contrasto più leggibile di una foto scattata a mano.
 */

export const LATO_LUNGO_MASSIMO_PX = 2000;

/** Adapter condiviso: converte un ImageBitmap in ImageData via canvas offscreen. */
export function bitmapAImageData(bitmap: ImageBitmap): ImageData {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const contesto = canvas.getContext('2d');
  if (!contesto) {
    throw new Error('Impossibile ottenere un contesto 2D per il preprocessing.');
  }
  contesto.drawImage(bitmap, 0, 0);
  return contesto.getImageData(0, 0, bitmap.width, bitmap.height);
}

export async function preprocessa(bitmap: ImageBitmap): Promise<ImageBitmap> {
  const scala = Math.min(1, LATO_LUNGO_MASSIMO_PX / Math.max(bitmap.width, bitmap.height));
  const larghezza = Math.max(1, Math.round(bitmap.width * scala));
  const altezza = Math.max(1, Math.round(bitmap.height * scala));

  const canvas = new OffscreenCanvas(larghezza, altezza);
  const contesto = canvas.getContext('2d');
  if (!contesto) {
    throw new Error('Impossibile ottenere un contesto 2D per il preprocessing.');
  }
  contesto.drawImage(bitmap, 0, 0, larghezza, altezza);

  const imageData = contesto.getImageData(0, 0, larghezza, altezza);
  const dati = imageData.data;
  for (let i = 0; i < dati.length; i += 4) {
    const grigio = 0.299 * dati[i] + 0.587 * dati[i + 1] + 0.114 * dati[i + 2];
    dati[i] = grigio;
    dati[i + 1] = grigio;
    dati[i + 2] = grigio;
  }
  contesto.putImageData(imageData, 0, 0);

  return canvas.transferToImageBitmap();
}
