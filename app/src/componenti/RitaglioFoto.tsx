import type { Riquadro } from '../dominio/tipi';

/**
 * componenti/RitaglioFoto.tsx — T-29 (AC-02.4, AC-03.1, architecture.md §6.5).
 *
 * Evidenzia l'area della foto di Anna corrispondente a un campo a bassa confidenza (S-04) o
 * a un'area annotata in S-05b. L'evidenziazione è puramente decorativa: un `<svg
 * aria-hidden="true">` sovrapposto all'immagine, con le coordinate del `Riquadro` (0..1,
 * normalizzate) convertite in percentuali via `viewBox`. La descrizione per lo screen reader
 * sta interamente nell'`alt` dell'immagine sottostante — mai nell'svg, che non deve essere
 * letto due volte lo stesso contenuto.
 *
 * Nessuna posizione hardcoded: il riquadro arriva sempre da `LetturaRicetta` (barcode/OCR),
 * mai scritto a mano per una fixture specifica.
 */
export interface RitaglioFotoProps {
  /** URL dell'immagine caricata da Anna (object URL di `AcquisizioneFoto.anteprimaUrl`). */
  immagineUrl: string;
  /** Area da evidenziare, coordinate normalizzate 0..1. */
  riquadro: Riquadro;
  /** Descrizione per lo screen reader di cosa mostra l'immagine e cosa evidenzia il riquadro. */
  alt: string;
  className?: string;
}

export function RitaglioFoto({ immagineUrl, riquadro, alt, className }: RitaglioFotoProps) {
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      <img src={immagineUrl} alt={alt} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <rect
          x={riquadro.x * 100}
          y={riquadro.y * 100}
          width={riquadro.larghezza * 100}
          height={riquadro.altezza * 100}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
