/**
 * dominio/errori.ts — T-05.
 * Punti di costruzione di `ErroreCarePath` (tipi.ts §3.7). Ogni funzione qui produce un
 * errore con un `recupero` coerente con la tabella di degrado di `architecture.md`
 * §4.1/§5.3: non esiste, in questo file, un modo di costruire un errore senza recupero
 * (il tipo lo vieta — vedi `tipi.test.ts`/§3.7).
 *
 * Numero di telefono del CUP: fittizio e riconoscibile (ADR-0007, G-02).
 */
import type { AzioneDiRecupero, CodiceErrore, ErroreCarePath, IdSchermo } from './tipi';

export const TELEFONO_CUP_FITTIZIO = '800 000 000';

function creaErrore(
  codice: CodiceErrore,
  messaggioPerLaPersona: string,
  recupero: AzioneDiRecupero,
  dettaglioTecnico?: string,
): ErroreCarePath {
  return { codice, messaggioPerLaPersona, recupero, dettaglioTecnico };
}

// --- Errori di LettoreRicetta (architecture.md §4.1) ------------------------------------

export const erroreImmagineTroppoGrande = (dettaglioTecnico?: string): ErroreCarePath =>
  creaErrore(
    'IMMAGINE_TROPPO_GRANDE',
    'Questa foto è troppo pesante. Proviamo con un’altra foto del foglio.',
    { tipo: 'rifaiFoto', etichetta: 'Fai un’altra foto' },
    dettaglioTecnico,
  );

export const erroreFormatoNonSupportato = (dettaglioTecnico?: string): ErroreCarePath =>
  creaErrore(
    'FORMATO_NON_SUPPORTATO',
    'Non riesco ad aprire questo tipo di file. Proviamo con un’altra foto.',
    { tipo: 'rifaiFoto', etichetta: 'Fai un’altra foto' },
    dettaglioTecnico,
  );

export const erroreImmagineNonLeggibile = (dettaglioTecnico?: string): ErroreCarePath =>
  creaErrore(
    'IMMAGINE_NON_LEGGIBILE',
    'Non riesco a leggere bene questa foto. La aiuto io a copiare i numeri.',
    { tipo: 'inserimentoGuidato', etichetta: 'Aiutami a leggere il codice', campo: 'nre' },
    dettaglioTecnico,
  );

export const erroreLetturaInTimeout = (dettaglioTecnico?: string): ErroreCarePath =>
  creaErrore(
    'LETTURA_IN_TIMEOUT',
    'Ci sto mettendo troppo a leggere la foto. La aiuto io a copiare i numeri.',
    { tipo: 'inserimentoGuidato', etichetta: 'Aiutami a leggere il codice', campo: 'nre' },
    dettaglioTecnico,
  );

export const erroreMotoreNonDisponibile = (dettaglioTecnico?: string): ErroreCarePath =>
  creaErrore(
    'MOTORE_NON_DISPONIBILE',
    'In questo momento non riesco a leggere le foto su questo telefono. La aiuto io a copiare i numeri.',
    { tipo: 'inserimentoGuidato', etichetta: 'Aiutami a leggere il codice', campo: 'nre' },
    dettaglioTecnico,
  );

// --- Errori di composizione/validazione NRE (US-03) --------------------------------------

export const erroreNreNonTrovato = (): ErroreCarePath =>
  creaErrore(
    'NRE_NON_TROVATO',
    'Non ho trovato il codice sulla foto. La aiuto io a copiarlo.',
    { tipo: 'inserimentoGuidato', etichetta: 'Aiutami a leggere il codice', campo: 'nre' },
  );

export const erroreNreFormatoNonValido = (): ErroreCarePath =>
  creaErrore(
    'NRE_FORMATO_NON_VALIDO',
    'Il codice che ho letto non è nel formato giusto. La aiuto io a copiarlo.',
    { tipo: 'inserimentoGuidato', etichetta: 'Aiutami a leggere il codice', campo: 'nre' },
  );

// --- Prestazioni multiple (PRD §5, bloccante e terminale) --------------------------------

export const errorePrestazioniMultiple = (): ErroreCarePath =>
  creaErrore(
    'PRESTAZIONI_MULTIPLE',
    'Questa ricetta contiene più di una visita: non posso scegliere io al posto suo. Chiami il CUP.',
    { tipo: 'contattoTelefonico', etichetta: 'Chiama il CUP', telefono: TELEFONO_CUP_FITTIZIO },
  );

// --- Errori del servizio di prenotazione (architecture.md §4.5) --------------------------

export const erroreNessunaDisponibilita = (): ErroreCarePath =>
  creaErrore(
    'NESSUNA_DISPONIBILITA',
    'Non ho trovato appuntamenti nei prossimi 30 giorni. Le mostro cosa fare.',
    { tipo: 'contattoTelefonico', etichetta: 'Chiama il CUP', telefono: TELEFONO_CUP_FITTIZIO },
  );

export const errorePrenotazioneFallita = (): ErroreCarePath =>
  creaErrore(
    'PRENOTAZIONE_FALLITA',
    'Qualcosa non ha funzionato mentre confermavo. Riproviamo.',
    { tipo: 'riprova', etichetta: 'Riprova' },
  );

/** Usato solo per test/documentazione: dimostra che ogni `IdSchermo` è un recupero valido. */
export const erroreConRitornoASchermo = (schermo: IdSchermo, etichetta: string): ErroreCarePath =>
  creaErrore(
    'PRENOTAZIONE_FALLITA',
    'Torniamo indietro e riproviamo da qui.',
    { tipo: 'tornaAlloSchermo', etichetta, schermo },
  );

/** Registro completo: un punto di costruzione per ogni `CodiceErrore` (test T-05). */
export const COSTRUTTORI_ERRORE: Record<CodiceErrore, () => ErroreCarePath> = {
  IMMAGINE_NON_LEGGIBILE: erroreImmagineNonLeggibile,
  IMMAGINE_TROPPO_GRANDE: erroreImmagineTroppoGrande,
  FORMATO_NON_SUPPORTATO: erroreFormatoNonSupportato,
  LETTURA_IN_TIMEOUT: erroreLetturaInTimeout,
  NRE_NON_TROVATO: erroreNreNonTrovato,
  NRE_FORMATO_NON_VALIDO: erroreNreFormatoNonValido,
  PRESTAZIONI_MULTIPLE: errorePrestazioniMultiple,
  NESSUNA_DISPONIBILITA: erroreNessunaDisponibilita,
  PRENOTAZIONE_FALLITA: errorePrenotazioneFallita,
  MOTORE_NON_DISPONIBILE: erroreMotoreNonDisponibile,
};
