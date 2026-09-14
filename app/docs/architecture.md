# Architettura — CarePath

**Fase 3 della pipeline · agente ARCH (Tecnico)**
Input: `app/docs/PRD.md`, `app/docs/ux-spec.md`, `app/docs/wireframes.md`, `app/docs/scenarios/*.feature`
Contesto vincolante: `.claude/agents/_shared-context.md` (metodo), `.claude/agents/_case.md` (caso)
Decision record: `app/docs/adr/`

Questo documento è il **contratto verso BUILD**. Ciò che è scritto qui non si cambia scrivendo
codice: si cambia tornando qui e aprendo un ADR.

---

## 0. La forma dell'architettura in una frase

CarePath è una **applicazione statica che gira interamente sul telefono di Anna**: legge la
ricetta con due motori locali (decodifica dei codici a barre + OCR), non apre **nessuna
connessione di rete** dopo il caricamento della pagina, e simula la sola capacità che ha
dichiarato di non avere — la prenotazione sul CUP reale.

Tre conseguenze che attraversano tutto il resto:

1. **La foto della ricetta non lascia il dispositivo.** Non è una promessa di copy (S-02):
   è applicata da una Content Security Policy che vieta il traffico in uscita (ADR-0002).
2. **La demo live non dipende dalla rete.** La decisione aperta D-03 si chiude togliendo la
   rete dal percorso critico, non aggiungendo un piano B che finge (ADR-0003, ADR-0004).
3. **L'incertezza dell'AI è un tipo di dato, non un caso limite.** Un campo letto male non
   può essere usato per errore: il compilatore lo impedisce (§3, ADR-0005, ADR-0006).

---

## 1. Stack

| Livello | Scelta | ADR | Perché in una riga |
|---|---|---|---|
| Front-end | **React 18 + TypeScript + Vite** | [ADR-0001](adr/0001-stack-front-end-react-typescript-vite.md) | il concept lo ipotizza, i tipi sono il deliverable di questa fase, Vite sta nel budget |
| Design system | **Bootstrap Italia 2.x** + **design-react-kit** (binding React ufficiale) | [ADR-0001](adr/0001-stack-front-end-react-typescript-vite.md) | AC-08.1; nessun componente inventato |
| Runtime | **nessun backend**, sito statico, zero rete in uscita | [ADR-0002](adr/0002-zero-backend-nessuna-rete-in-uscita.md) | AC-01.5, G-02, demo offline |
| Lettura NRE | **decodifica Code 39** dei due codici a barre (ZXing WASM, `BarcodeDetector` se disponibile) | [ADR-0003](adr/0003-motore-di-lettura-barcode-piu-ocr.md) | il campo bloccante è leggibile da una macchina per costruzione |
| Lettura testo | **OCR Tesseract.js**, lingua `ita`, asset in bundle | [ADR-0003](adr/0003-motore-di-lettura-barcode-piu-ocr.md) | prestazione, priorità, esenzione, ASL |
| Piano B demo | **il fallback guidato US-03**, non una finta lettura | [ADR-0004](adr/0004-piano-b-demo-senza-simulazione-occulta-dell-ai.md) | G-04: l'AI non si simula di nascosto |
| Prenotazione | **servizio simulato** dietro interfaccia, fixture versionate | [ADR-0007](adr/0007-servizio-di-prenotazione-simulato.md) | PRD §5; dichiarato ad Anna, non solo nei documenti |
| Testi esplicativi | **dizionario statico versionato**, nessuna generazione a runtime | [ADR-0009](adr/0009-dizionario-statico-dei-termini-e-filtro-clinico.md) | AC-04.4, G-01, G-04 |
| Test | **Vitest + Testing Library**, `.feature` come sorgente di verità | [ADR-0010](adr/0010-harness-bdd-sui-feature-file.md) | i test sono parte della build (Gate 3) |
| Distribuzione | build statico servito da `vite preview` o file system | [ADR-0002](adr/0002-zero-backend-nessuna-rete-in-uscita.md) | la demo non ha un server da far cadere |

### Scostamenti dall'ipotesi di `_case.md`

Il concept indica **React + Bootstrap Italia**: confermato. Gli scostamenti sono due, entrambi
per addizione e arbitrati:

- **Nessun backend**, nemmeno un proxy per un provider AI (ADR-0002). Il concept non lo
  escludeva; l'analisi di AC-01.5 lo rende necessario.
- **Due motori di lettura invece di uno** (ADR-0003). Il concept dice "l'AI interpreta": resta
  vero, ma il campo che blocca Anna (l'NRE) è affidato al lettore che non sbaglia — il codice
  a barre — e l'OCR lavora sul testo, dove il suo errore è recuperabile con una domanda.

### Alberatura di `app/`

```
app/
├── docs/                         # deliverable di pipeline (già presenti)
├── index.html
├── package.json · tsconfig.json · vite.config.ts · vitest.config.ts
├── public/
│   └── ocr/                      # tesseract worker + traineddata ita (in bundle, mai CDN)
└── src/
    ├── main.tsx · App.tsx
    ├── dominio/                  # tipi e regole pure — nessun import da React
    │   ├── tipi.ts               # §3 — i contratti dei tipi
    │   ├── nre.ts                # composizione e validazione dei 15 caratteri
    │   ├── prestazione.ts        # normalizzazione deterministica + filtro clinico
    │   ├── priorita.ts           # U/B/D/P → finestra temporale (organizzativa)
    │   ├── confidenza.ts         # soglie — ADR-0005
    │   └── errori.ts             # ErroreCarePath, recupero obbligatorio
    ├── servizi/                  # §4 — i contratti dei servizi
    │   ├── lettura/
    │   │   ├── LettoreRicetta.ts         # interfaccia + orchestratore
    │   │   ├── decodificatoreBarcode.ts  # ZXing / BarcodeDetector
    │   │   ├── motoreOcr.ts              # Tesseract.js
    │   │   ├── preprocessa.ts            # canvas: grigi, contrasto, ridimensiona
    │   │   └── estraiCampi.ts            # puro: parole+barcode → LetturaRicetta
    │   ├── prenotazione/
    │   │   ├── ServizioPrenotazione.ts   # interfaccia
    │   │   └── prenotazioneSimulata.ts   # implementazione + latenza dichiarata
    │   ├── dizionario/termini.it.ts      # testi fissi, revisionati — AC-04.4
    │   └── metriche/registroMetriche.ts  # RD-02
    ├── stato/
    │   ├── macchinaSessione.ts   # reducer: unica sorgente di verità
    │   └── SessioneProvider.tsx
    ├── schermi/                  # S-01 … S-11, uno per file
    ├── componenti/
    │   ├── Schermo.tsx           # h1 + focus management — vincolo a11y (§6)
    │   ├── RegioneAnnunci.tsx    # unica aria-live dell'app
    │   ├── CheSignifica.tsx      # affordance AC-04.1
    │   ├── CitazioneOriginale.tsx# G-03
    │   └── RitaglioFoto.tsx      # AC-02.4 / AC-03.1
    └── fixtures/                 # SOLO test automation — ADR-0007, ADR-0004
        ├── agende.json
        └── letture/*.json
```

---

## 2. Il flusso come catena di stati

Ogni freccia è un confine. A ogni confine corrisponde un tipo del §3: BUILD non deve
inventare la forma del dato che passa.

```
                      AcquisizioneFoto
   S-01 ──▶ S-02 ─────────────────────▶ S-03
                                          │
                                 LetturaRicetta          ← può essere parziale
                                          │
                        ┌─────────────────┴─────────────────┐
             puoProcedere = true                 puoProcedere = false
                        │                                   │
                        ▼                                   ▼
                      S-04 ────"No"────▶ S-04b ──────────▶ S-05b
                        │                                   │
                 RicettaConfermata  ◀────────────────────────┘
                        │                      (NreInseritoDallaPersona)
                        ▼
                      S-06  ──── Preferenza ────▶  S-07
                                                     │
                                          PropostaAppuntamento
                                                     │
                                                     ▼
                                                   S-08
                                                     │
                                           RichiestaPrenotazione
                                                     │
                                                     ▼
                                                   S-09  ──▶ S-11
                                        PrenotazioneConfermata

   S-10 (replica CUP, ADR-0008) è un ramo isolato: non condivide stato con la sessione.
```

**Invariante del grafo**: l'unico arco che produce un effetto irreversibile è
`S-08 → S-09` (AC-07.3). Tutti gli altri sono percorribili all'indietro senza perdita
(AC-07.2, AC-03.4), perché lo stato è un solo oggetto in memoria e il "torna indietro"
cambia soltanto il campo `schermoCorrente`.

---

## 3. Contratti dei tipi

`src/dominio/tipi.ts`. Sono il contratto che BUILD non può cambiare senza tornare qui
([ADR-0006](adr/0006-contratti-dei-tipi-e-modello-di-stato.md)).

### 3.1 Il tipo fondamentale: un campo letto dall'AI

```ts
/** Confidenza normalizzata 0..1. Tesseract restituisce 0..100: si normalizza all'ingresso. */
export type Confidenza = number;

export type OrigineDato = 'barcode' | 'ocr' | 'inseritoDallaPersona';

/** Coordinate normalizzate 0..1 sull'immagine caricata da Anna. Servono al ritaglio (AC-02.4). */
export interface Riquadro { x: number; y: number; larghezza: number; altezza: number }

/**
 * Unione discriminata: NON è un valore con un flag accanto.
 * - 'certo'        → si può usare
 * - 'daVerificare' → si può usare SOLO dopo una risposta di Anna; il riquadro è obbligatorio
 *                    perché lo schermo deve mostrarle il ritaglio della sua foto
 * - 'nonLetto'     → il campo `valore` non esiste: il compilatore impedisce di leggerlo
 */
export type CampoLetto<T> =
  | { stato: 'certo';        valore: T;   citazioneOriginale: string; confidenza: Confidenza; origine: OrigineDato; riquadro: Riquadro | null }
  | { stato: 'daVerificare'; valore: T;   citazioneOriginale: string; confidenza: Confidenza; origine: OrigineDato; riquadro: Riquadro }
  | { stato: 'nonLetto';                                              confidenza: Confidenza; origine: OrigineDato; riquadro: Riquadro | null };
```

> **Perché così.** `nonLetto` senza `valore` è ciò che rende AC-02.3 ("non tira a indovinare")
> una proprietà del programma e non una buona intenzione: non esiste un modo di scrivere
> `campo.valore` su un campo non letto che compili. `daVerificare` con `riquadro` obbligatorio
> rende AC-02.4 impossibile da dimenticare.

### 3.2 Passaggio 1 — acquisizione (S-02 → S-03)

```ts
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
```

### 3.3 Passaggio 2 — lettura (S-03 → S-04 | S-05b)

```ts
export interface Nre {
  segmentoA: string;  // esattamente 5 caratteri  — sotto il primo codice a barre
  segmentoB: string;  // esattamente 10 caratteri — sotto il secondo
  completo: string;   // segmentoA + segmentoB, esattamente 15
}

export interface Prestazione {
  /** Solo case-folding + rimozione del codice di catalogo. Nessuna parola sostituita (G-03). */
  etichettaSemplice: string;      // "Visita ortopedica di controllo"
  testoOriginale: string;         // "VISITA ORTOPEDICA DI CONTROLLO"
  codiceNomenclatore: string | null; // "89.01.G"
  /** Derivata da tabella statica. Usata dal servizio, MAI mostrata ad Anna come scelta (AC-05.3). */
  branca: string | null;
}

export type LetteraPriorita = 'U' | 'B' | 'D' | 'P';
export interface ClassePriorita {
  lettera: LetteraPriorita;       // come stampata, mai riscritta (AC-04.3)
  finestraMassimaGiorni: number;  // vincolo ORGANIZZATIVO passato al servizio, non un giudizio
}

export interface Esenzione { codice: string }
export interface AreaAsl { codice: string; denominazione: string }

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

  /** Derivato, non impostato a mano: vedi regola in §5.3. */
  puoProcedere: boolean;

  /** Tracciabilità dell'uso dell'AI (G-04, RD-03): quali motori hanno prodotto cosa. */
  motoriUsati: MotoreDiLettura[];
  durataMs: number;
}
```

### 3.4 Passaggio 3 — conferma della persona (S-04 → S-06)

```ts
declare const marchioConferma: unique symbol;

/**
 * Tipo opaco. L'UNICO costruttore è `confermaLettura()`.
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
```

### 3.5 Passaggio 4 — preferenza e proposte (S-06 → S-07)

```ts
export type Preferenza = 'prima_data' | 'vicino_casa';

export interface RichiestaProposte {
  ricetta: RicettaConfermata;
  preferenza: Preferenza;
  /** Oggi, iniettato: i test non dipendono dalla data reale. */
  riferimentoTemporale: Date;
  massimoProposte: 2 | 3;   // AC-05.1: il tipo vieta di superare 3
}

export interface Struttura {
  id: string;
  denominazione: string;   // fittizia e riconoscibile come tale (ADR-0007, G-02)
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
```

### 3.6 Passaggio 5 — prenotazione (S-08 → S-09)

```ts
export interface RichiestaPrenotazione {
  ricetta: RicettaConfermata;
  proposta: PropostaAppuntamento;
  assensoEsplicito: true;   // il tipo vieta di chiamare senza il tocco su "Confermo" (AC-07.3)
}

export interface PrenotazioneConfermata {
  codice: string;                 // mostrato a gruppi (AC-06.4)
  codiceRaggruppato: string;      // "PRE · 2024 · 1022 · 0017"
  appuntamento: PropostaAppuntamento;
  prestazione: Prestazione;
  cosaPortare: ReadonlyArray<string>;
  comeDisdire: { testo: string; telefono: string };
  /** Non opzionale e non `boolean`: il componente di conferma non può renderla senza
   *  dichiarare la simulazione ad Anna (ADR-0007). */
  simulazione: { simulata: true; dichiarazione: string };
}
```

### 3.7 Errori — il recupero è obbligatorio nel tipo

```ts
export type AzioneDiRecupero =
  | { tipo: 'rifaiFoto';            etichetta: string }
  | { tipo: 'inserimentoGuidato';   etichetta: string; campo: 'nre' }
  | { tipo: 'riprova';              etichetta: string }
  | { tipo: 'tornaAlloSchermo';     etichetta: string; schermo: IdSchermo }
  | { tipo: 'contattoTelefonico';   etichetta: string; telefono: string };

export type CodiceErrore =
  | 'IMMAGINE_NON_LEGGIBILE' | 'IMMAGINE_TROPPO_GRANDE' | 'FORMATO_NON_SUPPORTATO'
  | 'LETTURA_IN_TIMEOUT'     | 'NRE_NON_TROVATO'        | 'NRE_FORMATO_NON_VALIDO'
  | 'PRESTAZIONI_MULTIPLE'   | 'NESSUNA_DISPONIBILITA'  | 'PRENOTAZIONE_FALLITA'
  | 'MOTORE_NON_DISPONIBILE';

export interface ErroreCarePath {
  codice: CodiceErrore;
  /** Italiano, massimo 2 frasi, dice a Anna cosa fare adesso. Mai gergo, mai codici. */
  messaggioPerLaPersona: string;
  /** Obbligatorio: un errore senza via d'uscita non è rappresentabile. Rende M4 = 0
   *  una proprietà di tipo e non un obiettivo. */
  recupero: AzioneDiRecupero;
  dettaglioTecnico?: string;   // solo console, mai a schermo
}

/** Nessun servizio lancia eccezioni verso la UI: restituisce Risultato. */
export type Risultato<T, E = ErroreCarePath> =
  | { esito: 'ok'; valore: T }
  | { esito: 'errore'; errore: E };
```

### 3.8 Stato della sessione

```ts
export type IdSchermo =
  | 'S-01' | 'S-02' | 'S-03' | 'S-04' | 'S-04b' | 'S-05b'
  | 'S-06' | 'S-07' | 'S-08' | 'S-09' | 'S-10' | 'S-11';

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
  campiDiTestoCompilati: number;      // M1
  terminiSenzaSpiegazione: number;    // M2 — incrementato solo dai test di ispezione
  decisioniRichieste: number;         // M3
  erroriSenzaRecupero: number;        // M4 — deve restare 0 per costruzione (§3.7)
  schermiAttraversati: number;        // M5
  completataSenzaAiuto: boolean;      // M6
}
```

**Regola di aggiornamento**: i campi di `StatoSessione` si azzerano solo in avanti. Tornare
indietro da `S-07` a `S-06` **non** azzera `lettura` né `ricetta` (AC-07.2, scenario
"Anna può tornare indietro senza perdere la foto"). Solo `S-02` ri-acquisita azzera
`lettura`, e `campiInseritiDallaPersona` sopravvive alla nuova foto (AC-03.4).

---

## 4. Contratti dei servizi

Ogni servizio dichiara **firma, input, output, errori e timeout**. Nessuno lancia eccezioni
verso la UI: tutti restituiscono `Risultato`.

### 4.1 `LettoreRicetta` — l'unico punto in cui l'AI legge

```ts
export interface AvanzamentoLettura {
  fase: 'preprocessing' | 'barcode' | 'ocr' | 'estrazione' | 'piuLungoDelSolito';
  percentuale: number; // 0..100, indicativo
}

export interface OpzioniLettura {
  segnale?: AbortSignal;
  /** default 20_000. Superato → LETTURA_IN_TIMEOUT con recupero 'inserimentoGuidato'. */
  timeoutMs?: number;
  onProgresso?: (a: AvanzamentoLettura) => void;
}

export interface LettoreRicetta {
  /** Carica worker e modello. Invocata all'INGRESSO in S-02, non dopo lo scatto (§7). */
  precarica(): Promise<void>;
  leggi(foto: AcquisizioneFoto, opzioni?: OpzioniLettura): Promise<Risultato<LetturaRicetta>>;
}
```

| Voce | Valore |
|---|---|
| **Timeout totale** | 20 000 ms (duro, con `AbortController`) |
| **Timeout decodifica barcode** | 3 000 ms → il ramo barcode degrada a "non trovato", l'OCR continua |
| **Timeout OCR** | 15 000 ms → degrada a `nonLetto` su tutti i campi testuali |
| **Soglia "ci vuole più del solito"** | 8 000 ms → `onProgresso({fase:'piuLungoDelSolito'})`, copy di S-03 |
| **Cancellazione** | `segnale.abort()` quando Anna lascia S-03; i worker vengono terminati |
| **Errori restituiti** | `IMMAGINE_TROPPO_GRANDE` (> 12 MB) · `FORMATO_NON_SUPPORTATO` · `LETTURA_IN_TIMEOUT` · `MOTORE_NON_DISPONIBILE` — **tutti con `recupero: {tipo:'inserimentoGuidato'}` o `{tipo:'rifaiFoto'}`** |
| **Degrado** | il fallimento parziale **non** è un errore: produce una `LetturaRicetta` con campi `nonLetto`. L'errore si restituisce solo quando non è stato possibile produrre alcuna lettura |
| **Idempotenza** | pura rispetto al blob di ingresso; nessuno stato condiviso fra invocazioni |

### 4.2 `DecodificatoreBarcode`

```ts
export interface BarcodeLetto { formato: 'CODE_39' | 'CODE_128'; testo: string; riquadro: Riquadro }

export interface DecodificatoreBarcode {
  disponibile(): Promise<boolean>;
  decodifica(bitmap: ImageBitmap, timeoutMs?: number): Promise<BarcodeLetto[]>;  // default 3000
}
```
- **Confidenza**: binaria. Un Code 39 decodificato con delimitatori `*…*` validi vale `1.0`;
  altrimenti il barcode non esiste. Non esistono barcode "letti a metà" (ADR-0005).
- **Non lancia**: un fallimento restituisce `[]`.

### 4.3 `MotoreOcr`

```ts
export interface ParolaOcr { testo: string; confidenza: Confidenza; riquadro: Riquadro }

export interface MotoreOcr {
  precarica(): Promise<void>;
  riconosci(bitmap: ImageBitmap, opzioni?: { segnale?: AbortSignal; timeoutMs?: number; whitelist?: string }): Promise<ParolaOcr[]>;
}
```
- Lingua `ita`, asset da `public/ocr/` (mai CDN: la CSP lo vieta, ADR-0002).
- Timeout default 15 000 ms; su timeout restituisce le parole già riconosciute, mai un'eccezione.

### 4.4 `estraiCampi` — funzione pura, il cuore testabile

```ts
export function estraiCampi(
  parole: ParolaOcr[],
  barcodes: BarcodeLetto[],
  dimensioni: { larghezzaPx: number; altezzaPx: number }
): LetturaRicetta;
```
Sincrona, deterministica, senza I/O. È il punto in cui si applicano le soglie (ADR-0005), il
filtro clinico (ADR-0009) e la composizione dell'NRE. **Tutti gli scenari di lettura di
`fallback_foto.feature` e `conferma_visita.feature` sono testabili qui senza browser**, con
fixture di parole OCR: è ciò che rende il BDD economico nel budget di 5 ore.

### 4.5 `ServizioPrenotazione`

```ts
export interface ServizioPrenotazione {
  cercaProposte(r: RichiestaProposte): Promise<Risultato<PropostaAppuntamento[]>>;
  conferma(r: RichiestaPrenotazione): Promise<Risultato<PrenotazioneConfermata>>;
}
```

| Voce | `cercaProposte` | `conferma` |
|---|---|---|
| **Latenza simulata** | 400–900 ms | 600–1 200 ms |
| **Timeout** | 5 000 ms | 8 000 ms |
| **Errori** | `NESSUNA_DISPONIBILITA` → `recupero: contattoTelefonico` (copy di S-07) | `PRENOTAZIONE_FALLITA` → `recupero: riprova` |
| **Invariante AC-05.5** | nessuna proposta con `giorniDiAttesa > ricetta.classePriorita.finestraMassimaGiorni`; se la classe non è stata letta si usa la finestra più larga (`P`, 180 gg) e non si filtra | — |
| **Invariante AC-05.1** | `risultato.length ≤ r.massimoProposte` | — |
| **Determinismo nei test** | latenza e `riferimentoTemporale` iniettati: a `latenzaMs = 0` il servizio è sincrono e ripetibile | idem |

Implementazione: `prenotazioneSimulata.ts` su `fixtures/agende.json` (ADR-0007).

### 4.6 `DizionarioTermini`

```ts
export type Termine = 'nre' | 'branca' | 'classePriorita' | 'strutturaErogatrice' | 'esenzione' | 'regime';
export interface SpiegazioneTermine { termine: Termine; titolo: string; testo: string; /* ≤ 2 frasi */ revisionataDa: 'umano' }

/** Sincrona e totale: ogni Termine ha una voce. Nessuna chiamata, nessuna generazione. */
export function spiega(t: Termine): SpiegazioneTermine;
```
`Record<Termine, SpiegazioneTermine>` completo: il compilatore rifiuta un termine senza
spiegazione. È AC-04.1/M2 reso strutturale (ADR-0009).

### 4.7 `RegistroMetriche`

```ts
export interface RegistroMetriche {
  contaCampoCompilato(): void;
  contaDecisione(): void;
  contaSchermo(id: IdSchermo): void;
  segnalaErroreSenzaRecupero(codice: CodiceErrore): void; // esiste solo per farlo fallire nei test
  istantanea(): MetricheSessione;
}
```

---

## 5. Gestione dell'incertezza dell'AI

> **Regola di prodotto invariante — vale sopra ogni altra considerazione di questa sezione:
> l'incertezza si mostra ad Anna come domanda semplice. Non si nasconde e non si indovina.**

### 5.1 Soglie (chiude D-05 — [ADR-0005](adr/0005-soglie-di-confidenza-e-lettura-parziale.md))

| Origine | Confidenza | Stato del campo | Cosa vede Anna |
|---|---|---|---|
| barcode | decodifica + formato validi | `certo` (1.0) | il numero a gruppi, nessuna domanda |
| barcode | decodifica fallita | il campo passa all'OCR | — |
| ocr | ≥ 0.85 | `certo` | il valore, con citazione originale accanto |
| ocr | 0.60 ≤ c < 0.85 | `daVerificare` | ritaglio della **sua** foto + domanda chiusa "vedi lo stesso numero?" |
| ocr | < 0.60 | `nonLetto` | il campo non compare come letto; si applica §5.3 |

Le soglie vivono in `src/dominio/confidenza.ts` come costanti esportate e documentate, non
come numeri sparsi nel codice. Sono calibrate sulla fixture di intake e dichiarate come
tarate su un solo documento: è un limite, ed è scritto in ADR-0005.

### 5.2 Come si manifesta una domanda

Una sola forma, riusata ovunque: **ritaglio della foto + valore letto + due pulsanti**
(`Sì, è giusto` / `No, è diverso`). Mai un campo di testo libero, mai una lista. Il "No"
porta all'inserimento guidato **del solo campo in questione** — non ricomincia il percorso
(scenario *"La lettura è parziale — un campo è incerto"*).

### 5.3 Cosa succede quando un campo non è stato letto

`puoProcedere` è derivato, non impostato:

```ts
puoProcedere =
     nre.stato !== 'nonLetto'
  && prestazione.stato !== 'nonLetto'
  && !prestazioniMultiple;
```

| Campo `nonLetto` | Comportamento |
|---|---|
| **NRE** | bloccante → S-05b, inserimento guidato a due segmenti sulla foto annotata (US-03). Il riquadro dell'overlay viene dai barcode individuati anche quando **non** decodificati; se non c'è nemmeno la posizione, si mostra la foto intera con l'istruzione testuale |
| **Prestazione** | bloccante → S-04b: il sistema dice che non ha capito quale visita è e offre di rifare la foto. **Non prova a dedurla dal codice a barre né dalla branca**: sarebbe indovinare |
| **Classe di priorità** | non bloccante → il servizio usa la finestra più larga (`P`) e **non filtra** le proposte. Il limite è dichiarato in S-11 |
| **Esenzione** | non bloccante → S-08 mostra "Non ho trovato un codice di esenzione sulla ricetta: al momento della visita porti la tessera sanitaria" invece di un importo inventato |
| **Area ASL** | non bloccante → se Anna sceglie "Stare vicino a casa" senza ASL letta, si mostra **una domanda chiusa su 3 aree** invece di un campo indirizzo (M1 resta 0) e lo si dichiara |
| **Prestazioni multiple** | bloccante e terminale → il sistema si ferma, cita le prestazioni trovate e rimanda al CUP telefonico (PRD §5). Non sceglie al posto di Anna |

### 5.4 Ciò che l'architettura vieta

- Compilare un campo con un valore "plausibile" perché il precedente era simile.
- Riprovare l'OCR in silenzio con parametri diversi e presentare il secondo risultato come
  se fosse il primo: ogni ritentativo è visibile ad Anna come attesa e ha un budget dentro
  i 20 s complessivi.
- Usare un campo `daVerificare` in `cercaProposte`: il tipo `RicettaConfermata` non è
  costruibile finché Anna non ha risposto alla domanda.

---

## 6. Accessibilità come vincolo architetturale

Non è una checklist di fine lavoro: sono vincoli che lo stack impone e che BUILD non può
aggirare senza rompere qualcosa di visibile.

### 6.1 Rendering

- **SPA client-side** senza SSR: nessuna idratazione, quindi nessuna finestra in cui il DOM
  annunciato dallo screen reader differisce da quello interattivo.
- **Nessuna route senza `<h1>`**: ogni schermo si renderizza dentro `<Schermo titolo=…>`,
  che è l'unico componente autorizzato a emettere `<h1>`. Un `<h1>` scritto altrove è un
  errore di lint (AC-08.4, scenario *"Il percorso funziona anche con il tasto Tab"*).
- **Zoom 200 %**: nessuna altezza fissa e nessuna unità `vh` sui contenitori di testo;
  layout a colonna singola fino a 768 px. Corpo testo ≥ 18 px via override dei token
  Bootstrap Italia, non con `!important` sparsi (AC-06.3, AC-08.2).

### 6.2 Focus management

- Al cambio di `schermoCorrente`, `<Schermo>` sposta il focus sull'`<h1>` (`tabIndex={-1}`)
  in un `useEffect` post-commit. È l'unico posto dell'app che chiama `.focus()` su un titolo.
- Il "torna indietro" restituisce il focus al **controllo che aveva portato avanti**, non
  all'inizio della pagina.
- Il caricamento di S-07 usa **skeleton in-place**: le card non vengono smontate e rimontate,
  per non far perdere il focus a chi naviga da tastiera.

### 6.3 Annunci ARIA

- **Una sola regione live** nell'app (`<RegioneAnnunci>` in `App.tsx`, `aria-live="polite"`),
  pilotata da `useAnnuncio()`. Live region multiple che si sovrappongono sono la causa più
  comune di annunci persi: l'architettura le rende impossibili.
- Gli alert di errore usano `role="alert"` (assertive) e sono montati **dopo** il testo che
  spiegano, così l'ordine di lettura coincide con l'ordine visivo (scenario *"Lo schermo
  annuncia i cambiamenti"*).
- L'avanzamento di S-03 annuncia due volte al massimo: inizio e "ci vuole più del solito".
  Non si annuncia una percentuale che cambia: sarebbe rumore.

### 6.4 Il vincolo che Bootstrap Italia impone a React

Bootstrap Italia 2.x porta un proprio JavaScript che manipola il DOM (Accordion, Alert,
Dropdown). Su nodi controllati da React questo produce desincronizzazione e perdita di focus.

**Regola architetturale, non suggerimento**: i componenti interattivi si usano **solo** via
`design-react-kit`; il JavaScript vanilla di Bootstrap Italia **non viene mai inizializzato**
su nodi React. Del pacchetto `bootstrap-italia` si importano esclusivamente CSS e token.
Dove `design-react-kit` non offre il componente, si scrive markup con le classi del design
system e stato React (per esempio l'Accordion come `<details>`), motivandolo in linea:
è la "deroga scritta" che AC-08.1 richiede.

### 6.5 Overlay di S-05b

L'evidenziazione sulla foto è un `<svg aria-hidden="true">` sovrapposto all'immagine; la
descrizione sta nell'`alt` dell'immagine, come specificato in ux-spec §S-05b. Le coordinate
provengono dai `riquadro` dei barcode individuati: nessuna posizione hardcoded sulla fixture.

---

## 7. Confini di sicurezza e trattamento dei dati

### 7.1 Dove passa il documento sorgente

```
  fotocamera/galleria ──▶ Blob in memoria ──▶ ImageBitmap ──▶ Worker OCR / WASM barcode
                                │                                        │
                          ObjectURL (anteprima, ritagli)          testo + riquadri
                                │                                        │
                                └──────────── revocato all'uscita ───────┘
```

**Il Blob non esce da questo grafo.** Non viene inviato, non viene scritto, non viene
serializzato.

| Vincolo | Come è applicato (non "come è promesso") |
|---|---|
| L'immagine non lascia il dispositivo | CSP `connect-src 'self'` + nessun `fetch`/`XMLHttpRequest` verso host esterni; asset OCR serviti dall'origine, mai da CDN |
| L'immagine non viene persistita | nessun uso di `localStorage`/`sessionStorage`/`IndexedDB`/`Cache` per foto o lettura; il solo stato è in memoria e muore al reload |
| I dati letti non vengono persistiti | idem. Un reload riporta a S-01: è un costo accettato, ed è la scelta conservativa sul dato sanitario |
| L'unica materializzazione è volontaria | `window.print()` su S-09, azionato da Anna (AC-06.2) |
| Nessuna telemetria | nessun analytics, nessun font remoto, nessuna mappa: è anche ciò che rende la demo offline |

**Content Security Policy** (meta tag in `index.html`, verificabile da chiunque apra il sorgente):

```
default-src 'self';
connect-src 'self';
img-src 'self' blob: data:;
worker-src 'self' blob:;
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
font-src 'self';
form-action 'none';
```

Un test di build verifica che il bundle non contenga URL `http(s)://` verso host esterni:
AC-01.5 diventa una asserzione automatica, non una dichiarazione nel copy.

### 7.2 Dove sono applicati i guardrail di `_case.md`

| Guardrail | Punto di applicazione nel codice | Come si verifica dall'esterno |
|---|---|---|
| **G-01** no diagnosi / triage / consigli | `prestazione.ts`: `filtroClinico()` esclude dal flusso di semplificazione le sezioni cliniche del documento (quesito diagnostico, note del prescrittore). Il testo escluso **non viene riformulato né mostrato come informazione**; se serve, si cita alla lettera | test: una fixture con un quesito diagnostico non deve produrre alcuna `etichettaSemplice` che lo contenga; `contenutoClinicoEscluso === true` |
| **G-01** sulla priorità | `priorita.ts` mappa `U/B/D/P → giorni`. La tabella contiene **solo** il termine organizzativo; il dizionario (ADR-0009) è l'unica fonte del testo mostrato | test: la spiegazione della priorità non contiene "urgente", "grave", "clinico" (scenario esistente in `conferma_visita.feature`) |
| **G-02** nessun dato sanitario reale | `fixtures/` contiene solo strutture, agende e letture sintetiche con nomi palesemente fittizi. L'immagine di intake resta in `intake/` (read-only) e viene referenziata dai test, mai copiata in `app/` | test: nessun file immagine in `app/src/fixtures/`; nomi di struttura presenti in una allowlist fittizia |
| **G-03** non alterare il significato | `CampoLetto.citazioneOriginale` è **non-nullable** su ogni campo usato; `normalizzaPrestazione()` applica solo case-folding e distacco del codice di catalogo, con test di reversibilità | test: `etichettaSemplice.toUpperCase()` è contenuta in `testoOriginale` a meno di spazi e del codice |
| **G-04** AI spiegabile | `motoriUsati` e `origine` tracciano quale motore ha prodotto quale campo; nessun testo mostrato ad Anna è generato a runtime | ispezione: ogni stringa mostrata proviene da `termini.it.ts`, da `citazioneOriginale` o da un template versionato |

### 7.3 Superficie di attacco residua

Non c'è server, non c'è autenticazione, non ci sono dati persistiti: la superficie è il
solo browser di Anna. Il rischio tecnico residuo è il **parsing di un'immagine ostile** nei
worker WASM: mitigato limitando la dimensione a 12 MB e i formati a `image/jpeg|png|webp`,
e isolando la decodifica in Web Worker.

---

## 8. Budget di consegna

10 ore-uomo (5 h × 2). Ripartizione proposta, e soprattutto **cosa sta sotto la linea**.

| Blocco | Stima | Linea |
|---|---|---|
| Scaffolding Vite + design-react-kit + CSP + harness test | 1,0 h | must |
| Tipi di dominio, macchina a stati, dizionario, errori | 1,0 h | must |
| Schermi S-01/02/03/04/06/07/08/09 con componenti BI | 3,0 h | must |
| Barcode Code 39 + preprocessing | 1,0 h | must |
| OCR Tesseract + `estraiCampi` + soglie | 1,5 h | must |
| S-05b guida con overlay dai riquadri barcode | 0,7 h | must |
| Prenotazione simulata + fixture agende | 0,5 h | must |
| S-10 replica CUP | 0,4 h | must |
| S-11 metriche (lette dal registro) | 0,4 h | must |
| Test BDD sugli scenari critici | 0,5 h | must |
| **Totale must** | **10,0 h** | — |

Il totale satura il budget: qualunque aggiunta va compensata. **Sotto la linea, dichiarato:**

- generazione PDF client-side (basta `window.print()`), - service worker/PWA,
- copertura BDD completa di tutti gli scenari (priorità: `prenotazione`, `fallback_foto`,
  `conferma_visita`), - controlli axe automatici, - i18n, - animazioni,
- S-11 con contatori live se il registro costa più di 20 minuti: in tal caso la tabella è
  statica **e lo dichiara**.

**Timebox espliciti** (superati i quali si applica il ripiego già scritto nell'ADR):
`design-react-kit` 45 min → markup BI vanilla (ADR-0001); harness Gherkin 30 min → test
Vitest con nomi omonimi agli scenari (ADR-0010); tuning OCR 45 min → si accetta una resa
inferiore, il fallback US-03 è già un percorso di prodotto (ADR-0004).

---

## 9. Auto-critica avversariale

**Ogni decisione rischiosa ha un ADR, o ne ho lasciata qualcuna implicita nel codice?**
Dieci ADR coprono: stack e design system (0001), backend e rete (0002), provider di lettura
(0003), piano B della demo (0004), soglie di confidenza (0005), tipi e stato (0006), booking
simulato (0007), fedeltà della replica CUP (0008), testi e filtro clinico (0009), harness BDD
(0010). Restano implicite e le dichiaro qui: la scelta di **non usare react-router** (il
percorso è lineare e lo stato è uno solo; il tasto "indietro" del telefono è sincronizzato con
`history.pushState` dalla macchina a stati) e la scelta di **non persistere nulla** — la
seconda è però motivata dentro ADR-0002.

**I contratti bastano a BUILD per scrivere i servizi senza inventare campi?**
Sì per lettura, prenotazione, dizionario, metriche, errori e stato. **No** per due cose, ed è
un debito che dichiaro invece di nasconderlo: (a) la **tabella codice nomenclatore → branca**
ha una sola riga certa (`89.01.G` → Ortopedia) presa dalla fixture; per gli altri codici il
campo resta `null` e il servizio usa la prestazione; (b) il contenuto esatto di
`fixtures/agende.json` è lasciato a BUILD entro i vincoli di ADR-0007 (nomi fittizi, finestre
di priorità rispettate).

**Cosa si rompe se un servizio esterno è lento, fallisce o risponde male?**
Non esistono servizi esterni: è il senso di ADR-0002. I "servizi" lenti sono locali — worker
OCR e WASM — e sono gestiti nel contratto §4.1 con timeout a tre livelli, `AbortSignal`,
degrado a campo `nonLetto` e non a eccezione. Il caso peggiore osservabile è: 20 secondi di
attesa annunciata, poi la guida di S-05b. Il caso peggiore **non osservabile** — il worker che
non si carica affatto — produce `MOTORE_NON_DISPONIBILE` con recupero `inserimentoGuidato`,
quindi Anna arriva comunque in fondo.

**L'architettura introduce un passaggio percepito come attesa o errore opaco?**
L'attesa reale è il caricamento del modello OCR (~10 MB). L'architettura la sposta **dentro
S-02**, mentre Anna legge le istruzioni e inquadra il foglio: `precarica()` è chiamata
all'ingresso dello schermo, non dopo lo scatto. L'errore opaco è vietato dal tipo: §3.7 non
permette di costruire un `ErroreCarePath` senza `recupero`. L'unico messaggio opaco di tutta
l'applicazione è `Codice non valido.` di S-10 — ed è il punto della demo (ADR-0008).

**Sto introducendo dipendenze che non stanno nel budget?**
Dipendenze di runtime: `react`, `react-dom`, `bootstrap-italia`, `design-react-kit`,
`tesseract.js`, un decoder ZXing WASM. Sei. Le due rischiose sono `design-react-kit`
(integrazione) e `tesseract.js` (peso e tuning): entrambe hanno un timebox e un ripiego
scritto (§8). Il rischio residuo maggiore resta il **peso dei dati OCR** sul primo
caricamento: in demo locale è irrilevante, e lo dichiaro come limite fuori demo.

**Qualche componente può produrre output che viola un guardrail?**
Sì, e sono due, entrambi recintati: (a) `normalizzaPrestazione()` — se riscrivesse parole
violerebbe G-03; per questo è deterministica e ha un test di reversibilità; (b) l'OCR, che
potrebbe far entrare nel flusso il testo di un quesito diagnostico — per questo esiste
`filtroClinico()` e il flag `contenutoClinicoEscluso`. Il terzo rischio, più sottile, è la
**conferma di una prenotazione simulata che sembra vera**: recintato mettendo
`simulazione` come campo obbligatorio non-booleano di `PrenotazioneConfermata` (§3.6).

**I confini sono tracciati in modo che un test BDD possa attaccarli da fuori?**
`estraiCampi` e il servizio di prenotazione sono puri o iniettabili, quindi gli scenari di
lettura e di scelta si testano senza browser. Gli scenari di navigazione e accessibilità si
testano su React Testing Library contro il DOM reale. L'unico confine difficile da attaccare
dall'esterno è il **motore OCR** su una foto reale: quel test esiste come test lento
(`*.slow.test.ts`) sull'immagine di intake ed è escluso dalla suite veloce, perché il suo
esito dipende dalla qualità dell'immagine e non dal codice.

---

## 10. Rilievi verso gli altri deliverable

Sollevati dalla lente tecnica; portati all'utente in assenza di party al Gate 2 (decisione umana diretta).

| # | Gravità | Rilievo | Esito |
|---|---|---|---|
| R-1 | **BLOCCANTE** | `ux-spec.md` §S-08/S-09 e `conferma_finale.feature` descrivono una conferma di prenotazione **indistinguibile da una reale**. Una persona che porta quel foglio a un poliambulatorio non ha un appuntamento. L'architettura lo impedisce nel tipo (§3.6 `simulazione`) | **ACCETTATO così com'è** — decisione umana: il guardrail a livello di tipo (`simulazione` non-booleano, obbligatorio) è sufficiente per la demo; nessuna modifica di copy richiesta ora |
| R-2 | **IMPORTANTE** | `ux-spec.md` §S-07 e `wireframes.md` usano **"Ospedale Città della Salute"** (nome e indirizzo — Corso Bramante 88 — di una struttura reale di Torino): contrasta con AC-RD1.2 e G-02 | **RISOLTO** — sostituito con "Poliambulatorio Torino Nord", Via delle Rose 45, in entrambi i file |
| R-3 | **IMPORTANTE** | `ux-spec.md` §1 risolve D-06 assumendo che la ASL sia estratta dall'OCR. È il campo **meno affidabile** del documento | **ACCETTATO per la demo** — decisione umana: i dati restano estratti dalla ricetta (nessuna chiamata esterna). In una versione produttiva si prevede una chiamata API a un registro ASL reale; dichiarato come limite futuro, non implementato ora |
| R-4 | **IMPORTANTE** | Il copy di S-02 *"Non viene salvata né inviata ad altri servizi"* diventa **vincolante**: un futuro provider cloud sarebbe una breaking change di prodotto | **ACCETTATO** — decisione umana: confermato, stessa logica di R-3. Qualunque chiamata di rete futura (ASL, matching CUP reale) richiede di rivedere questo copy, non di aggirarlo |
| R-5 | MINORE | `ux-spec.md` riga 171: refuso `fisssare` | **RISOLTO** — corretto in `fissare` |
| R-6 | MINORE | Il numero CUP di S-07 ("nessuna disponibilità") deve essere palesemente fittizio (`800 000 000`) per G-02/AC-RD1.2 | **RISOLTO** — `wireframes.md` aggiornato |

**Nota fuori tabella (emersa in discussione, non un rilievo architect):** è stato chiesto se il collegamento
codice-nomenclatore → branca richieda un LLM. Risposta: no per la demo — è una tabella statica pubblica
(nomenclatore ministeriale), non un'inferenza; oggi ha una sola riga certa (debito dichiarato sopra).
Un **matching semantico verso un catalogo CUP reale** (nomi/ID di prestazione diversi dal nomenclatore
nazionale) potrebbe servire in una futura integrazione reale, ma quello scenario è già fuori ambito nel
PRD (§5, booking simulato) — dichiarato lì come limite, non implementato.

---

## 11. Decisioni aperte in ingresso — esito

| # | Decisione | Esito |
|---|---|---|
| **D-03** | Provider di lettura immagine + piano B per la demo live | **CHIUSA** — [ADR-0003](adr/0003-motore-di-lettura-barcode-piu-ocr.md) (barcode Code 39 + OCR Tesseract, entrambi locali) e [ADR-0004](adr/0004-piano-b-demo-senza-simulazione-occulta-dell-ai.md) (il piano B è il percorso US-03; la fixture-mode è vietata nel build di demo) |
| **D-04** | Fedeltà della replica CUP | **CHIUSA** — [ADR-0008](adr/0008-fedelta-della-replica-del-servizio-target.md): fedeltà **comportamentale** alta, fedeltà **identitaria** nulla. Regola operativa verificabile |
| **D-05** | Comportamento su lettura parziale e soglia di confidenza | **CHIUSA** — [ADR-0005](adr/0005-soglie-di-confidenza-e-lettura-parziale.md) e §5 |
| D-06 | "Vicino a casa" senza chiedere l'indirizzo | chiusa da UX; l'architettura ne definisce il **degrado** quando la ASL non è leggibile (§5.3, rilievo R-3) |

---

## Riferimenti

- Developers Italia — https://developers.italia.it/it
- Design system .italia — https://designers.italia.it/design-system/
- Accessibilità by-design (WCAG 2.1 AA, UNI CEI EN 301549:2021) — https://designers.italia.it/design-system/fondamenti/accessibilita/
- Bootstrap Italia, per sviluppatori — https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
- Bootstrap Italia su Developers Italia — https://developers.italia.it/it/software/c743b1f1-7d2e-4fac-a676-d6d27f2c892d.html
- Manuale operativo di design — https://docs.italia.it/italia/designers-italia/manuale-operativo-design-docs/it/versione-corrente/
- Linee guida di design per i servizi digitali della PA (AgID, art. 53 CAD) — https://www.agid.gov.it/sites/default/files/repository_files/design-italia.pdf
- Deliverable a monte: `app/docs/PRD.md`, `app/docs/ux-spec.md`, `app/docs/wireframes.md`, `app/docs/scenarios/`
