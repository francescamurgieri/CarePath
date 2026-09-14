/**
 * Contratti dei tipi — architecture.md §3 (ADR-0006).
 *
 * Questo file NON si modifica in BUILD senza tornare a `architecture.md` e aprire un ADR:
 * è il contratto fra dominio, servizi e schermi. `src/dominio/` e `src/servizi/` non
 * importano React (ADR-0006 §6): è ciò che rende questi tipi e le funzioni pure che li usano
 * attaccabili da un test BDD senza browser.
 */

// ---------------------------------------------------------------------------------------
// 3.1 — Il tipo fondamentale: un campo letto dall'AI
// ---------------------------------------------------------------------------------------

/** Confidenza normalizzata 0..1. Tesseract restituisce 0..100: si normalizza all'ingresso. */
export type Confidenza = number;

export type OrigineDato = 'barcode' | 'ocr' | 'inseritoDallaPersona';

/** Coordinate normalizzate 0..1 sull'immagine caricata da Anna. Servono al ritaglio (AC-02.4). */
export interface Riquadro {
  x: number;
  y: number;
  larghezza: number;
  altezza: number;
}

/**
 * Unione discriminata: NON è un valore con un flag accanto.
 * - 'certo'        → si può usare
 * - 'daVerificare' → si può usare SOLO dopo una risposta di Anna; il riquadro è obbligatorio
 *                    perché lo schermo deve mostrarle il ritaglio della sua foto
 * - 'nonLetto'     → il campo `valore` non esiste: il compilatore impedisce di leggerlo
 */
export type CampoLetto<T> =
  | {
      stato: 'certo';
      valore: T;
      citazioneOriginale: string;
      confidenza: Confidenza;
      origine: OrigineDato;
      riquadro: Riquadro | null;
    }
  | {
      stato: 'daVerificare';
      valore: T;
      citazioneOriginale: string;
      confidenza: Confidenza;
      origine: OrigineDato;
      riquadro: Riquadro;
    }
  | {
      stato: 'nonLetto';
      confidenza: Confidenza;
      origine: OrigineDato;
      riquadro: Riquadro | null;
    };

// ---------------------------------------------------------------------------------------
// 3.2 — Passaggio 1: acquisizione (S-02 → S-03)
// ---------------------------------------------------------------------------------------

export interface AcquisizioneFoto {
  /** Il file scelto/scattato. Vive solo in memoria: mai scritto su storage (ADR-0002). */
  immagine: Blob;
  /** ObjectURL per l'anteprima e per i ritagli. Va revocato all'uscita dalla sessione. */
  anteprimaUrl: string;
  larghezzaPx: number;
  altezzaPx: number;
  acquisitaIl: Date;
  sorgente: 'fotocamera' | 'galleria';
}

// ---------------------------------------------------------------------------------------
// 3.3 — Passaggio 2: lettura (S-03 → S-04 | S-05b)
// ---------------------------------------------------------------------------------------

export interface Nre {
  segmentoA: string; // esattamente 5 caratteri  — sotto il primo codice a barre
  segmentoB: string; // esattamente 10 caratteri — sotto il secondo
  completo: string; // segmentoA + segmentoB, esattamente 15
}

export interface Prestazione {
  /** Solo case-folding + rimozione del codice di catalogo. Nessuna parola sostituita (G-03). */
  etichettaSemplice: string; // "Visita ortopedica di controllo"
  testoOriginale: string; // "VISITA ORTOPEDICA DI CONTROLLO"
  codiceNomenclatore: string | null; // "89.01.G"
  /** Derivata da tabella statica. Usata dal servizio, MAI mostrata ad Anna come scelta (AC-05.3). */
  branca: string | null;
  /** Branche accessorie quando il nomenclatore ne elenca più di una per lo stesso codice
   *  (es. "89.01.A" → Diagnostica per immagini + Medicina nucleare). Stesso trattamento di
   *  `branca`: solo al servizio, mai ad Anna. `[]` se non applicabile — mai `undefined` per un
   *  campo che il servizio deve poter iterare senza controllo di presenza. */
  brancheAggiuntive: readonly string[];
}

export type LetteraPriorita = 'U' | 'B' | 'D' | 'P';

export interface ClassePriorita {
  lettera: LetteraPriorita; // come stampata, mai riscritta (AC-04.3)
  finestraMassimaGiorni: number; // vincolo ORGANIZZATIVO passato al servizio, non un giudizio
}

export interface Esenzione {
  codice: string;
}

export interface AreaAsl {
  codice: string;
  denominazione: string;
}

export type MotoreDiLettura = 'barcode-zxing' | 'barcode-nativo' | 'ocr-tesseract';

export interface LetturaRicetta {
  idLettura: string;
  nre: CampoLetto<Nre>;
  prestazione: CampoLetto<Prestazione>;
  classePriorita: CampoLetto<ClassePriorita>;
  esenzione: CampoLetto<Esenzione>;
  areaAsl: CampoLetto<AreaAsl>;

  /** true se il documento contiene più di una prestazione: il sistema si ferma (PRD §5). */
  prestazioniMultiple: boolean;
  /** true se il filtro clinico ha scartato sezioni del documento (ADR-0009, G-01). */
  contenutoClinicoEscluso: boolean;

  /** Derivato, non impostato a mano: vedi regola in architecture.md §5.3. */
  puoProcedere: boolean;

  /** Tracciabilità dell'uso dell'AI (G-04, RD-03): quali motori hanno prodotto cosa. */
  motoriUsati: MotoreDiLettura[];
  durataMs: number;

  /** Prestazioni citate alla lettera quando `prestazioniMultiple` è true (PRD §5). */
  prestazioniMultipleTestoOriginale?: readonly string[];
}

// ---------------------------------------------------------------------------------------
// 3.4 — Passaggio 3: conferma della persona (S-04 → S-06)
// ---------------------------------------------------------------------------------------

declare const marchioConferma: unique symbol;

/**
 * Tipo opaco. L'UNICO costruttore è `confermaLettura()` (src/dominio/confermaLettura.ts).
 * Il servizio di prenotazione accetta questo tipo e non `LetturaRicetta`:
 * è impossibile, per costruzione, prenotare su una lettura che Anna non ha confermato.
 */
export interface RicettaConfermata {
  readonly [marchioConferma]: true;
  nre: Nre;
  prestazione: Prestazione;
  classePriorita: ClassePriorita | null;
  esenzione: Esenzione | null;
  areaAsl: AreaAsl | null;
  /** Elenco dei campi che erano 'daVerificare' e che Anna ha confermato con una domanda chiusa. */
  campiVerificatiDallaPersona: ReadonlyArray<keyof LetturaRicetta>;
  /** Quali campi provengono dall'inserimento manuale guidato (S-05b). Serve a RD-02/M1. */
  campiInseritiDallaPersona: ReadonlyArray<keyof LetturaRicetta>;
}

// ---------------------------------------------------------------------------------------
// 3.5 — Passaggio 4: preferenza e proposte (S-06 → S-07)
// ---------------------------------------------------------------------------------------

export type Preferenza = 'prima_data' | 'vicino_casa';

export interface RichiestaProposte {
  ricetta: RicettaConfermata;
  preferenza: Preferenza;
  /** Oggi, iniettato: i test non dipendono dalla data reale. */
  riferimentoTemporale: Date;
  massimoProposte: 2 | 3; // AC-05.1: il tipo vieta di superare 3
}

export interface Struttura {
  id: string;
  denominazione: string; // fittizia e riconoscibile come tale (ADR-0007, G-02)
  indirizzo: string;
  comune: string;
  codiceAsl: string;
}

export interface PropostaAppuntamento {
  id: string;
  /** Etichetta nel linguaggio del bisogno, non del sistema (AC-05.2). */
  etichetta: 'La prima data disponibile' | 'Più vicino a casa';
  inizio: Date;
  struttura: Struttura;
  /** Giorni da oggi: usato per verificare AC-05.5 contro finestraMassimaGiorni. */
  giorniDiAttesa: number;
  ticket: { dovuto: false; motivo: string } | { dovuto: true; importoEuro: number };
}

// ---------------------------------------------------------------------------------------
// 3.6 — Passaggio 5: prenotazione (S-08 → S-09)
// ---------------------------------------------------------------------------------------

export interface RichiestaPrenotazione {
  ricetta: RicettaConfermata;
  proposta: PropostaAppuntamento;
  assensoEsplicito: true; // il tipo vieta di chiamare senza il tocco su "Confermo" (AC-07.3)
}

export interface PrenotazioneConfermata {
  codice: string; // mostrato a gruppi (AC-06.4)
  codiceRaggruppato: string; // "PRE · 2024 · 1022 · 0017"
  appuntamento: PropostaAppuntamento;
  prestazione: Prestazione;
  cosaPortare: ReadonlyArray<string>;
  comeDisdire: { testo: string; telefono: string };
  /** Non opzionale e non `boolean`: il componente di conferma non può renderla senza
   *  dichiarare la simulazione ad Anna (ADR-0007). */
  simulazione: { simulata: true; dichiarazione: string };
}

// ---------------------------------------------------------------------------------------
// 3.7 — Errori: il recupero è obbligatorio nel tipo
// ---------------------------------------------------------------------------------------

export type AzioneDiRecupero =
  | { tipo: 'rifaiFoto'; etichetta: string }
  | { tipo: 'inserimentoGuidato'; etichetta: string; campo: 'nre' }
  | { tipo: 'riprova'; etichetta: string }
  | { tipo: 'tornaAlloSchermo'; etichetta: string; schermo: IdSchermo }
  | { tipo: 'contattoTelefonico'; etichetta: string; telefono: string };

export type CodiceErrore =
  | 'IMMAGINE_NON_LEGGIBILE'
  | 'IMMAGINE_TROPPO_GRANDE'
  | 'FORMATO_NON_SUPPORTATO'
  | 'LETTURA_IN_TIMEOUT'
  | 'NRE_NON_TROVATO'
  | 'NRE_FORMATO_NON_VALIDO'
  | 'PRESTAZIONI_MULTIPLE'
  | 'NESSUNA_DISPONIBILITA'
  | 'PRENOTAZIONE_FALLITA'
  | 'MOTORE_NON_DISPONIBILE';

export interface ErroreCarePath {
  codice: CodiceErrore;
  /** Italiano, massimo 2 frasi, dice a Anna cosa fare adesso. Mai gergo, mai codici. */
  messaggioPerLaPersona: string;
  /** Obbligatorio: un errore senza via d'uscita non è rappresentabile. Rende M4 = 0
   *  una proprietà di tipo e non un obiettivo. */
  recupero: AzioneDiRecupero;
  dettaglioTecnico?: string; // solo console, mai a schermo
}

/** Nessun servizio lancia eccezioni verso la UI: restituisce Risultato. */
export type Risultato<T, E = ErroreCarePath> = { esito: 'ok'; valore: T } | { esito: 'errore'; errore: E };

// ---------------------------------------------------------------------------------------
// 3.8 — Stato della sessione
// ---------------------------------------------------------------------------------------

export type IdSchermo =
  | 'S-01'
  | 'S-02'
  | 'S-03'
  | 'S-04'
  | 'S-04b'
  | 'S-05b'
  | 'S-06'
  | 'S-07'
  | 'S-08'
  | 'S-09'
  | 'S-10'
  | 'S-11';

export interface StatoSessione {
  schermoCorrente: IdSchermo;
  /** Storia per il "torna indietro" etichettato a parole (AC-07.1). */
  percorso: ReadonlyArray<IdSchermo>;
  foto: AcquisizioneFoto | null;
  lettura: LetturaRicetta | null;
  ricetta: RicettaConfermata | null;
  preferenza: Preferenza | null;
  proposte: ReadonlyArray<PropostaAppuntamento>;
  propostaScelta: PropostaAppuntamento | null;
  prenotazione: PrenotazioneConfermata | null;
  erroreCorrente: ErroreCarePath | null;
  metriche: MetricheSessione;
}

/** RD-02: contatori misurati, non stimati. */
export interface MetricheSessione {
  campiDiTestoCompilati: number; // M1
  terminiSenzaSpiegazione: number; // M2 — incrementato solo dai test di ispezione
  decisioniRichieste: number; // M3
  erroriSenzaRecupero: number; // M4 — deve restare 0 per costruzione (§3.7)
  schermiAttraversati: number; // M5
  completataSenzaAiuto: boolean; // M6
}
