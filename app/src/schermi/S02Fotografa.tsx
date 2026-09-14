import { type ChangeEvent, useEffect, useState } from 'react';
import { Accordion, AccordionBody, AccordionHeader, Alert, Button, Card, CardBody, Upload } from 'design-react-kit';
import { Schermo } from '../componenti/Schermo';
import { useDispatchSessione } from '../stato/SessioneProvider';
import { creaLettoreRicetta, type LettoreRicetta } from '../servizi/lettura/LettoreRicetta';
import type { AcquisizioneFoto } from '../dominio/tipi';

/**
 * Istanza del lettore condivisa con `S03LetturaInCorso.tsx` (stesso motore OCR): `precarica()`
 * viene invocata qui all'ingresso in questo schermo (ADR-0003), `leggi()` viene invocata là,
 * così il pre-caricamento del modello non va sprecato fra i due schermi.
 */
export const lettoreRicettaCondiviso: LettoreRicetta = creaLettoreRicetta();

type StatoLocale =
  | { fase: 'attesa' }
  | { fase: 'errore' }
  | { fase: 'selezionato'; foto: AcquisizioneFoto };

/**
 * schermi/S02Fotografa.tsx — T-31 (AC-01.1, AC-01.5, ux-spec.md §S-02, ADR-0003).
 *
 * Cattura solo l'acquisizione della foto (S-02 → S-03 nel contratto di `dominio/tipi.ts`):
 * la lettura vera e propria (OCR/barcode) avviene in `S03LetturaInCorso`, non qui.
 */
export default function S02Fotografa() {
  const dispatch = useDispatchSessione();
  const [statoLocale, setStatoLocale] = useState<StatoLocale>({ fase: 'attesa' });
  const [accordionNreAperto, setAccordionNreAperto] = useState(false);
  const [dettaglioPrivacyAperto, setDettaglioPrivacyAperto] = useState(false);

  useEffect(() => {
    // ADR-0003: l'attesa del modello OCR sparisce dal percorso critico perché viene
    // precaricato all'ingresso in questo schermo, prima che Anna scatti la foto.
    lettoreRicettaCondiviso.precarica().catch(() => {
      // Il precaricamento è solo un'ottimizzazione: un suo fallimento non blocca Anna.
      // `leggi()` in S-03 ritenterà comunque l'inizializzazione del motore.
    });
  }, []);

  async function gestisciFile(file: File, sorgente: AcquisizioneFoto['sorgente']) {
    try {
      const bitmap = await createImageBitmap(file);
      const larghezzaPx = bitmap.width;
      const altezzaPx = bitmap.height;
      bitmap.close();
      const foto: AcquisizioneFoto = {
        immagine: file,
        anteprimaUrl: URL.createObjectURL(file),
        larghezzaPx,
        altezzaPx,
        acquisitaIl: new Date(),
        sorgente,
      };
      setStatoLocale({ fase: 'selezionato', foto });
    } catch {
      setStatoLocale({ fase: 'errore' });
    }
  }

  function alCambioFile(sorgente: AcquisizioneFoto['sorgente']) {
    return (evento: ChangeEvent<HTMLInputElement>) => {
      const file = evento.target.files?.[0];
      evento.target.value = '';
      if (file) {
        void gestisciFile(file, sorgente);
      }
    };
  }

  function cambiaFoto() {
    if (statoLocale.fase === 'selezionato') {
      URL.revokeObjectURL(statoLocale.foto.anteprimaUrl);
    }
    setStatoLocale({ fase: 'attesa' });
  }

  function usaQuestaFoto() {
    if (statoLocale.fase !== 'selezionato') return;
    dispatch({ tipo: 'FOTO_ACQUISITA', foto: statoLocale.foto });
  }

  return (
    <Schermo titolo="Fotografa il foglio della ricetta">
      <p>
        <a
          href="#"
          onClick={(evento) => {
            evento.preventDefault();
            dispatch({ tipo: 'TORNA_INDIETRO' });
          }}
        >
          Torna all'inizio
        </a>
      </p>

      {/* L'avviso privacy precede il controllo di upload nel DOM (T-31: ordine di focus). */}
      <Alert color="info">
        <p className="mb-1">
          La foto viene analizzata solo per leggere i codici della visita. Non viene salvata né
          inviata ad altri servizi.
        </p>
        <Button
          color="primary"
          size="sm"
          outline
          aria-expanded={dettaglioPrivacyAperto}
          onClick={() => setDettaglioPrivacyAperto((precedente) => !precedente)}
        >
          Scopri di più
        </Button>
        {dettaglioPrivacyAperto && (
          <p className="mt-2 mb-0">
            La foto resta solo su questo telefono: viene elaborata in memoria, non viene mai
            inviata a un server e non viene salvata da nessuna parte. Quando esci da CarePath,
            sparisce.
          </p>
        )}
      </Alert>

      {statoLocale.fase === 'errore' && (
        <Alert color="danger">
          <p className="mb-2">Foto non caricata. Controlla la connessione e riprova.</p>
          <Button color="danger" outline onClick={() => setStatoLocale({ fase: 'attesa' })}>
            Riprova
          </Button>
        </Alert>
      )}

      {statoLocale.fase !== 'selezionato' && (
        <>
          <Card>
            <CardBody>
              <p className="mb-0">
                Inquadra tutto il foglio. La luce deve essere buona e il testo leggibile.
              </p>
            </CardBody>
          </Card>

          <Upload
            id="s02-scatta-foto"
            label="Scatta la foto"
            accept="image/*"
            capture="environment"
            onChange={alCambioFile('fotocamera')}
            className="mt-3 d-grid"
          />

          <Upload
            id="s02-galleria"
            label="Scegli dalla galleria"
            accept="image/*"
            onChange={alCambioFile('galleria')}
            className="mt-2 d-grid"
          />

          <Accordion className="mt-3">
            <AccordionHeader active={accordionNreAperto} onToggle={() => setAccordionNreAperto((p) => !p)}>
              Che cos'è il codice della ricetta (NRE)?
            </AccordionHeader>
            <AccordionBody active={accordionNreAperto}>
              <p>
                È un numero a 15 cifre che identifica la tua ricetta. Non devi cercarlo: CarePath
                lo legge dalla foto al posto tuo.
              </p>
            </AccordionBody>
          </Accordion>
        </>
      )}

      {statoLocale.fase === 'selezionato' && (
        <>
          <img
            src={statoLocale.foto.anteprimaUrl}
            alt="Anteprima della foto della ricetta appena scattata"
            className="img-fluid mt-3"
          />
          <Button color="primary" block className="mt-3" onClick={usaQuestaFoto}>
            Usa questa foto
          </Button>
          <p className="mt-2 text-center">
            <a
              href="#"
              onClick={(evento) => {
                evento.preventDefault();
                cambiaFoto();
              }}
            >
              Cambia foto
            </a>
          </p>
        </>
      )}
    </Schermo>
  );
}
