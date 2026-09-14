# Tasks — CarePath

**Fase 4 della pipeline · agente PLAN**
Input: `app/docs/PRD.md`, `app/docs/ux-spec.md`, `app/docs/wireframes.md`, `app/docs/architecture.md`,
`app/docs/adr/0001…0010`, `app/docs/scenarios/*.feature`, `app/data/nomenclatore-branca.json`.
Contesto vincolante: `.claude/agents/_shared-context.md` (metodo), `.claude/agents/_case.md` (caso).

Questo documento traduce PRD + ux-spec + architecture in un ordine di costruzione per BUILD.
Non ripete le decisioni: le referenzia. Ogni task cita l'ADR o l'AC che lo vincola, così BUILD
non deve tornare ai documenti a monte per sapere *perché* un file ha quella forma.

**Convenzione BDD**: dove esiste uno scenario `.feature`, il task di test precede sempre il task
di implementazione (ID più basso = task da chiudere per primo) e l'implementazione non è "fatta"
finché il test che la precede non è verde. Dove non esiste un file `.feature` dedicato (moduli di
dominio interni), la definizione di fatto richiede comunque un test scritto prima del codice che
lo soddisfa — la differenza è che quel test è unitario e non tracciato come scenario a sé.

---

## 0. Tabella di tracciabilità — requisito → task → scenario

| Requisito (PRD) | Task che lo chiudono | Scenario `.feature` |
|---|---|---|
| **US-01** — non trascrivere codici (AC-01.1…01.5) | T-01, T-03, T-07, T-08, T-13, T-14, T-15, T-16, T-17, T-18, T-19, T-31, T-49 | `prenotazione.feature` (Anna non ha digitato nessun codice) |
| **US-02** — riconoscere la visita in parole proprie (AC-02.1…02.4) | T-04, T-09, T-13, T-14, T-27, T-28, T-33, T-34 | `conferma_visita.feature` |
| **US-03** — non essere rimandata al modulo (AC-03.1…03.4) | T-04, T-07, T-13, T-14, T-29, T-36, T-37 | `fallback_foto.feature` |
| **US-04** — capire le parole del servizio (AC-04.1…04.4) | T-11, T-27, T-33, T-34, T-38 | `conferma_visita.feature` (spiegazioni NRE/priorità) |
| **US-05** — scegliere fra poche cose (AC-05.1…05.5) | T-10, T-20, T-21, T-22, T-38, T-39, T-40 | `scelta_appuntamento.feature` |
| **US-06** — conferma rileggibile (AC-06.1…06.5) | T-22, T-41, T-42, T-43 | `conferma_finale.feature` |
| **US-07** — cambiare idea (AC-07.1…07.3) | T-05, T-23, T-24, T-33/34/35, T-36/37 | `prenotazione.feature` (torna indietro senza perdere la foto), `conferma_finale.feature` (torna indietro prima di confermare) |
| **US-08** — leggere e toccare senza fatica (AC-08.1…08.5) | T-03, T-25, T-26, T-30…T-46, T-48 | `accessibilita.feature` |
| **RD-01** — replica "prima" (AC-RD1.1, AC-RD1.2) | T-44, T-45 | `portale_prima.feature` |
| **RD-02** — Autonomia & Limiti (AC-RD2.1, AC-RD2.2) | T-12, T-46 | `portale_prima.feature` (funzionalità "Vedere quanto è cambiato") |
| **RD-03** — tracciabilità AI/umano | T-08, T-09, T-11, T-14, T-18, T-46, `agents/PIPELINE.md` (fuori da `app/`, non un task di questo piano) | — (verificabile per ispezione, non da scenario) |
| **G-01** no diagnosi/triage | T-09 (`filtroClinico`), T-10, T-11 | `conferma_visita.feature` (priorità, mai "urgente"/"grave") |
| **G-02** no dati sanitari reali | T-08, T-21, T-49 | `portale_prima.feature`, guardrail trasversali |
| **G-03** non alterare il significato | T-09, T-27, T-28, T-49 | `conferma_visita.feature` (testo originale sempre disponibile) |
| **G-04** AI spiegabile | T-08, T-11, T-14, T-18, T-46, T-49 | — (ispezione + test guardrail) |

Le singole colonne AC per schermo sono riprese nel dettaglio di ogni task in §2.

---

## 1. Sequenza di esecuzione a onde

Le onde sono barriere di dipendenza dura; dentro un'onda i task sono **parallelizzabili fra i due
sviluppatori** salvo dove indicato. Numerazione dei task = ordine di apertura consigliato, non
vincolo assoluto dentro l'onda.

| Onda | Task | Cosa diventa dimostrabile | Persone in parallelo |
|---|---|---|---|
| **0 — Scaffolding** | T-01, T-02, T-03 | `npm run dev` apre una pagina con CSP attiva e Bootstrap Italia caricato; `npm test` gira (anche a vuoto) | T-01 blocca T-02/T-03; T-02 e T-03 in parallelo dopo T-01 |
| **1 — Dominio puro** | T-04 → T-05, T-06, T-07, T-08 → T-09, T-10, T-11, T-12 | I tipi compilano; ogni modulo di dominio ha il proprio test unitario verde | dopo T-04, T-05/T-06/T-07/T-08 in parallelo; T-09 aspetta T-08; T-10/T-11/T-12 in parallelo con T-09 |
| **2 — Cuore testabile + servizi locali** | T-13 → T-14; T-15, T-16, T-17 → T-18 → T-19; T-20 → T-21 → T-22 | `estraiCampi` passa i test di lettura senza browser; il lettore reale legge la fixture di intake; il servizio di prenotazione rispetta i vincoli di priorità/ASL | due filoni indipendenti: (lettura: T-13…T-19) e (prenotazione: T-20…T-22) — un dev per filone |
| **3 — Stato + componenti trasversali** | T-23 → T-24; T-25, T-26, T-27, T-28, T-29 | Il reducer supera il test "torna indietro senza perdere la foto"; i componenti condivisi (h1, annunci, "Che significa?", citazione, ritaglio) esistono isolati | T-23/24 e T-25…T-29 in parallelo (nessuna dipendenza reciproca) |
| **4 — Percorso nominale, schermo per schermo** | T-30, T-31, T-32, T-33→T-34→T-35, T-36→T-37, T-38, T-39→T-40, T-41→T-42→T-43 | **Prima demo end-to-end possibile**: da S-01 a S-09 con dati reali di dominio | sequenziale sul filone "schermi" per via del wiring condiviso con `macchinaSessione`; ma S-04/S-04b/S-05b, S-06, S-07, S-08/S-09 possono essere scritti in parallelo da due persone e assemblati a T-47 |
| **5 — Rami isolati demo** | T-44 → T-45; T-46 | Contrasto prima/dopo mostrabile (S-10) e schermata metriche (S-11) | in parallelo fra loro e con l'onda 4 (S-10 non condivide stato — architecture.md §2) |
| **6 — Assemblaggio** | T-47 | L'app è un unico percorso navigabile dall'inizio alla fine, back del telefono incluso | — |
| **7 — Guardrail trasversali** | T-48, T-49 | Accessibilità da tastiera/screen reader verificata; nessuna violazione G-02/G-03/AC-01.5/AC-05.5 residua | in parallelo fra loro |

**La prima onda dimostrabile in senso stretto (non solo "compila") è la 4**: a T-34 chiuso, si può
già mostrare a qualcuno "fotografo la ricetta → il sistema mi dice cosa ha letto" — il cuore di
US-01/US-02. Le onde 0-3 non producono nulla di mostrabile a un non tecnico, ma sono il prezzo
d'ingresso dichiarato dall'architettura (tipi prima del codice, ADR-0006).

---

## 2. Task

### Onda 0 — Scaffolding

#### T-01 — Scaffold del progetto
- **File**: `app/package.json`, `app/tsconfig.json`, `app/vite.config.ts`, `app/index.html` (con
  meta CSP di ADR-0002), `app/src/main.tsx` (stub), `app/.gitignore`
- **Dipendenze**: nessuna
- **Requisiti serviti**: precondizione di tutti; AC-01.5 (CSP)
- **ADR**: ADR-0001 (stack), ADR-0002 (CSP)
- **Scenari BDD serviti**: nessuno direttamente (precondizione di tutti)
- **Definizione di fatto**: `npm run dev` apre una pagina bianca senza errori in console;
  `npm run build` produce un bundle statico; il meta tag CSP di ADR-0002 è presente e testabile
  leggendo il sorgente di `index.html`.

#### T-02 — Harness di test BDD
- **File**: `app/vitest.config.ts`, `app/src/test/setup.ts`, adapter Gherkin (timebox 30 min,
  ADR-0010) oppure — a timebox scaduto — `app/src/test/coperturaScenari.test.ts` che legge tutti
  i `.feature` e fallisce se uno scenario non ha un test omonimo
- **Dipendenze**: T-01
- **Requisiti serviti**: precondizione BDD di tutta la build (Gate 3)
- **ADR**: ADR-0010
- **Scenari BDD serviti**: nessuno direttamente; li rende eseguibili tutti
- **Definizione di fatto**: `npm test` gira e riporta 0 test falliti su una suite vuota; se si
  aggiunge un file `.feature` con un nuovo scenario senza test corrispondente, la suite fallisce
  (verificato con uno scenario-esca temporaneo, poi rimosso).

#### T-03 — Design system di base
- **File**: `app/src/index.css` (import token/CSS `bootstrap-italia`), regola ESLint/commento
  vincolante "nessuna chiamata a `new bootstrap.*` su nodi React" (ADR-0001 punto 3)
- **Dipendenze**: T-01
- **Requisiti serviti**: AC-08.1
- **ADR**: ADR-0001 (timebox 45 min su `design-react-kit`; a scadenza, ripiego markup vanilla con
  le stesse classi CSS — dichiarato, non silenzioso)
- **Scenari BDD serviti**: precondizione di `accessibilita.feature`
- **Definizione di fatto**: un componente Bootstrap Italia (es. `Button` di `design-react-kit`, o
  il markup vanilla di ripiego) si renderizza con le classi CSS corrette e supera un test RTL che
  verifica ruolo e nome accessibile.

---

### Onda 1 — Dominio puro

#### T-04 — `dominio/tipi.ts`
- **File**: `app/src/dominio/tipi.ts`
- **Dipendenze**: T-01
- **Requisiti serviti**: AC-02.3, AC-02.4, AC-07.3, M4 (§3 architecture)
- **ADR**: ADR-0006
- **Scenari BDD serviti**: precondizione di tutti gli scenari di lettura/conferma
- **Definizione di fatto**: il file compila in `strict`; un test di tipo (`// @ts-expect-error`)
  dimostra che leggere `.valore` su un `CampoLetto` con `stato: 'nonLetto'` non compila, e che
  costruire un `daVerificare` senza `riquadro` non compila.

#### T-05 — `dominio/errori.ts`
- **File**: `app/src/dominio/errori.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: M4, AC-03.3, AC-07.1 (recupero sempre etichettato)
- **ADR**: ADR-0006 §3
- **Scenari BDD serviti**: precondizione di `fallback_foto.feature` (errori per segmento)
- **Definizione di fatto**: `ErroreCarePath` non è costruibile senza `recupero` (test di tipo);
  un test unitario verifica che ogni `CodiceErrore` elencato in architecture.md §3.7 abbia almeno
  un punto di costruzione nel codice con `recupero` coerente con la tabella §4.1/§5.3.

#### T-06 — `dominio/confidenza.ts`
- **File**: `app/src/dominio/confidenza.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: AC-02.4, D-05
- **ADR**: ADR-0005
- **Scenari BDD serviti**: precondizione di `fallback_foto.feature` ("lettura parziale")
- **Definizione di fatto**: costanti `SOGLIA_CERTO = 0.85`, `SOGLIA_DA_VERIFICARE = 0.60` esportate
  e documentate; un test unitario verifica che nessun altro file del repository contenga questi
  due numeri come letterali (grep in test, non a mano).

#### T-07 — `dominio/nre.ts`
- **File**: `app/src/dominio/nre.ts`, `app/src/dominio/nre.test.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: AC-01.4, AC-03.2
- **ADR**: ADR-0003 (regola di composizione)
- **Scenari BDD serviti**: unità di supporto a `fallback_foto.feature`
- **Definizione di fatto**: test verde su: composizione riuscita di `010A2` + `4518061015` →
  `010A24518061015`; rifiuto se segmento A ≠ 5 caratteri o segmento B ≠ 10; nessuna composizione
  parziale accettata silenziosamente.

#### T-08 — `dominio/tabellaBranca.ts` — collega `app/data/nomenclatore-branca.json`
- **File**: `app/src/dominio/tabellaBranca.ts` (nuovo modulo, non previsto nell'albero originale
  di architecture.md §1: aggiunta puntuale, motivata sotto), `app/src/dominio/tabellaBranca.test.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: chiude il debito dichiarato in `architecture.md` §9 ("la tabella
  codice-nomenclatore → branca ha una sola riga certa") e in ADR-0003; supporta AC-05.3
  (la branca non è mai mostrata ad Anna, ma serve al servizio di prenotazione)
- **ADR**: nessuno dedicato — è l'esecuzione di un debito già arbitrato in architecture.md §9;
  non richiede un nuovo ADR perché non cambia contratti né stack, solo colma un dato mancante
- **Scenari BDD serviti**: unità di supporto a `conferma_visita.feature` (derivazione branca)
- **Note sulla collocazione**: il file JSON **resta** in `app/data/nomenclatore-branca.json`
  (fuori da `src/`) e viene importato con un percorso relativo
  (`import tabella from '../../data/nomenclatore-branca.json'`), **non copiato** dentro
  `src/fixtures/`. È una distinzione deliberata: `src/fixtures/` è riservata a dati di **test
  automation** e il suo import da codice applicativo è bloccato da lint (ADR-0004); questa
  tabella è invece un **dato di dominio di produzione** (nomenclatore tariffario ufficiale,
  citato con fonte nei suoi stessi metadati), e deve essere importabile da `prestazione.ts`.
  Confonderla con una fixture violerebbe la distinzione che ADR-0004 protegge.
- **Comportamento richiesto**: `trovaBranca(codiceNomenclatore: string): { branca: string;
  brancheAggiuntive?: string[] } | null` — match esatto sul campo `codice` delle 53 voci; se il
  codice non è fra quelli (famiglie dichiarate in `_meta.ambito_dichiarato`), ritorna `null` e
  **non tenta un match parziale o euristico** (indovinare la branca da un prefisso non elencato
  sarebbe un'inferenza non tracciabile — coerente con G-04).
- **Definizione di fatto**: test verde su `trovaBranca('89.01.G')` → `{ branca: 'Ortopedia' }`
  (copre la riga certa originaria, ora una fra 53); test verde su un codice fuori ambito (es.
  `'99.99'`) → `null`; test che verifica che il modulo non importi nulla da `src/fixtures/`.

#### T-09 — `dominio/prestazione.ts`
- **File**: `app/src/dominio/prestazione.ts`, `app/src/dominio/prestazione.test.ts`
- **Dipendenze**: T-04, T-08
- **Requisiti serviti**: AC-02.2, AC-04.3 (parzialmente, via `filtroClinico`), G-01, G-03
- **ADR**: ADR-0009 (`normalizzaPrestazione`, `filtroClinico`)
- **Scenari BDD serviti**: `conferma_visita.feature` (testo originale sempre disponibile; nessuna
  parola sostituita)
- **Definizione di fatto**: test di reversibilità verde
  (`etichettaSemplice.toUpperCase()` ⊆ `testoOriginale` a meno di spazi e codice); test verde che
  una fixture con un quesito diagnostico produce `contenutoClinicoEscluso === true` e nessuna
  `etichettaSemplice` che lo contenga; `prestazione.branca` popolato tramite `trovaBranca()` di
  T-08 (non più una singola riga hardcoded — verificato assenza del vecchio valore letterale
  `'Ortopedia'` cablato fuori dal modulo T-08).

#### T-10 — `dominio/priorita.ts`
- **File**: `app/src/dominio/priorita.ts`, `app/src/dominio/priorita.test.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: AC-04.3, AC-05.5, G-01
- **ADR**: architecture.md §5.3 (finestre per lettera), ADR-0009 (confine col dizionario)
- **Scenari BDD serviti**: `conferma_visita.feature` (spiegazione priorità);
  `scelta_appuntamento.feature` (vincolo finestra temporale)
- **Definizione di fatto**: test verde su `U/B/D/P → giorni`; test che il modulo **non** esporta
  o contiene alcuna stringa di significato clinico (solo l'intero `finestraMassimaGiorni`); il
  testo mostrato ad Anna resta in T-11, mai qui.

#### T-11 — `servizi/dizionario/termini.it.ts`
- **File**: `app/src/servizi/dizionario/termini.it.ts`, `app/src/servizi/dizionario/termini.it.test.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: AC-04.1, AC-04.2, AC-04.3, AC-04.4, M2, G-04, RD-03
- **ADR**: ADR-0009 §1
- **Scenari BDD serviti**: `conferma_visita.feature` ("Anna chiede che significa NRE", "Anna
  chiede la spiegazione della classe di priorità")
- **Definizione di fatto**: `Record<Termine, SpiegazioneTermine>` completo (il compilatore
  rifiuta un `Termine` senza voce — test di tipo); test verde che la spiegazione di
  `classePriorita` non contiene alcuna delle parole vietate (`urgente`, `grave`, `clinico`,
  `gravità`); ogni `testo` ≤ 2 frasi (test che conta i punti fermi).

#### T-12 — `servizi/metriche/registroMetriche.ts`
- **File**: `app/src/servizi/metriche/registroMetriche.ts`, test unitario
- **Dipendenze**: T-04
- **Requisiti serviti**: RD-02, M1-M6
- **ADR**: architecture.md §4.7; §8 (fallback a tabella statica se costa > 20 min)
- **Scenari BDD serviti**: precondizione di S-11 (nessuno scenario dedicato — vedi §4 rilievi)
- **Definizione di fatto**: `istantanea()` ritorna contatori coerenti dopo una sequenza simulata
  di `contaCampoCompilato/contaDecisione/contaSchermo`; se il timebox di 20 minuti scade, il task
  si chiude comunque con `MetricheSessione` popolato da **costanti statiche** pari ai valori del
  PRD §6, e questo è scritto come commento nel file, non taciuto.

---

### Onda 2 — Cuore testabile e servizi locali

#### T-13 — Test di `estraiCampi` (da `fallback_foto.feature` + `conferma_visita.feature`)
- **File**: `app/src/servizi/lettura/estraiCampi.test.ts`, fixture di parole OCR sintetiche in
  `app/src/fixtures/letture/*.json` (test-only, ADR-0004)
- **Dipendenze**: T-06, T-07, T-09, T-10
- **Requisiti serviti**: AC-02.3, AC-02.4, AC-03.1, AC-03.2, US-03
- **ADR**: ADR-0003, ADR-0005, ADR-0010 §3
- **Scenari BDD serviti**: `fallback_foto.feature` (tutti e 5 gli scenari), `conferma_visita.feature`
  (lettura sottostante ai primi 3 scenari)
- **Definizione di fatto**: il file di test esiste, importa una funzione `estraiCampi` **non
  ancora implementata** (T-14), e fallisce all'esecuzione (rosso) — è la prova che il test precede
  il codice. Include un caso per `prestazioniMultiple: true` (PRD §5), anche se nessun `.feature`
  lo nomina esplicitamente (rilievo in §4).

#### T-14 — `servizi/lettura/estraiCampi.ts`
- **File**: `app/src/servizi/lettura/estraiCampi.ts`
- **Dipendenze**: T-13
- **Requisiti serviti**: come T-13
- **ADR**: ADR-0003, ADR-0005, ADR-0006 (`puoProcedere` derivato)
- **Scenari BDD serviti**: come T-13
- **Definizione di fatto**: tutti i test di T-13 sono verdi; funzione pura, sincrona, senza I/O
  (verificato assenza di `await`/`fetch` nel file).

#### T-15 — `servizi/lettura/decodificatoreBarcode.ts`
- **File**: `app/src/servizi/lettura/decodificatoreBarcode.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: AC-01.2, AC-01.4 (lettura NRE)
- **ADR**: ADR-0003 §"Decisione" (ZXing WASM + `BarcodeDetector` opportunistico)
- **Scenari BDD serviti**: supporto a `fallback_foto.feature` a livello di integrazione (T-19)
- **Definizione di fatto**: `disponibile()` ritorna `boolean` senza lanciare; `decodifica()` su un
  bitmap senza barcode ritorna `[]` entro 3000 ms (test con timer finti).

#### T-16 — `servizi/lettura/motoreOcr.ts` + asset
- **File**: `app/src/servizi/lettura/motoreOcr.ts`, `app/public/ocr/` (worker + `ita.traineddata`)
- **Dipendenze**: T-04
- **Requisiti serviti**: AC-01.2
- **ADR**: ADR-0003, ADR-0002 (asset serviti dall'origine, mai CDN)
- **Scenari BDD serviti**: supporto a T-19
- **Definizione di fatto**: `precarica()` risolve senza rete (verificabile con Wi-Fi disattivo in
  ambiente di test/dev); `riconosci()` su timeout ritorna le parole già trovate, mai
  un'eccezione (test con timer finti).

#### T-17 — `servizi/lettura/preprocessa.ts`
- **File**: `app/src/servizi/lettura/preprocessa.ts`
- **Dipendenze**: T-04
- **Requisiti serviti**: qualità di lettura (supporto a AC-01.2, non un AC a sé)
- **ADR**: ADR-0003 (pipeline)
- **Scenari BDD serviti**: nessuno diretto
- **Definizione di fatto**: dato un `ImageBitmap` di test, la funzione produce un bitmap
  ridimensionato a lato lungo ≤ 2000 px, in scala di grigi; test snapshot dimensionale.

#### T-18 — `servizi/lettura/LettoreRicetta.ts`
- **File**: `app/src/servizi/lettura/LettoreRicetta.ts`
- **Dipendenze**: T-14, T-15, T-16, T-17
- **Requisiti serviti**: AC-01.2, timeout/degrado di architecture.md §4.1
- **ADR**: ADR-0003, ADR-0004 (nessun flag che scavalchi il lettore reale)
- **Scenari BDD serviti**: precondizione di T-19 e di S-02/S-03 (T-31/T-32)
- **Definizione di fatto**: `leggi()` rispetta i tre timeout (3s barcode, 15s OCR, 20s totale,
  test con timer finti); `AbortSignal` termina i worker (verificato con spy); nessun import di
  `src/fixtures/letture/` nel file (verificato da T-49).

#### T-19 — Test lento sulla foto reale di intake
- **File**: `app/src/servizi/lettura/lettura-reale.slow.test.ts`
- **Dipendenze**: T-18
- **Requisiti serviti**: CLAUDE.md ("il sistema deve leggere immagini reali"), RD-03
- **ADR**: ADR-0003, ADR-0010 §6
- **Scenari BDD serviti**: nessuno (per definizione, escluso dalla suite veloce)
- **Definizione di fatto**: eseguendo `npm run test:slow`, il lettore produce un NRE ricostruito
  uguale a `010A24518061015` sulla foto `intake/idea/Example files/image.png` **oppure** fallisce
  con un fallimento documentato (foto/condizioni di luce) — in entrambi i casi il test esiste e
  gira separato dalla suite di Gate 3, così il suo esito non blocca la build.

#### T-20 — Test di `ServizioPrenotazione` (da `scelta_appuntamento.feature`)
- **File**: `app/src/servizi/prenotazione/prenotazioneSimulata.test.ts`
- **Dipendenze**: T-04, T-10
- **Requisiti serviti**: AC-05.1, AC-05.3, AC-05.4, AC-05.5
- **ADR**: ADR-0007
- **Scenari BDD serviti**: `scelta_appuntamento.feature` (tutti e 5 gli scenari)
- **Definizione di fatto**: il file esiste, importa `prenotazioneSimulata` non ancora implementato
  (T-22), fallisce all'esecuzione; include un caso in cui `classePriorita` non è stata letta
  (verifica che si usi la finestra `P` senza filtrare, architecture.md §4.5).

#### T-21 — `fixtures/agende.json`
- **File**: `app/src/fixtures/agende.json`
- **Dipendenze**: nessuna (può iniziare in parallelo con T-20)
- **Requisiti serviti**: AC-05.2, G-02, AC-RD1.2 (nomi non reali)
- **ADR**: ADR-0007 §4
- **Scenari BDD serviti**: dati di supporto a `scelta_appuntamento.feature`
- **Definizione di fatto**: almeno 4-5 strutture fittizie con nomi dell'allowlist di ADR-0007
  (es. "Poliambulatorio Torino Nord", non "Ospedale Città della Salute" — rilievo R-2 già chiuso
  in architecture.md, qui solo si applica), slot espressi come offset relativi (giorni da oggi),
  mai date assolute; nessun nome, logo o indirizzo riconducibile a un ente reale (verificato da
  T-49).

#### T-22 — `servizi/prenotazione/prenotazioneSimulata.ts`
- **File**: `app/src/servizi/prenotazione/prenotazioneSimulata.ts`,
  `app/src/servizi/prenotazione/ServizioPrenotazione.ts` (interfaccia)
- **Dipendenze**: T-20, T-21
- **Requisiti serviti**: come T-20; AC-06.5 (`simulazione` obbligatoria nel tipo)
- **ADR**: ADR-0007
- **Scenari BDD serviti**: come T-20
- **Definizione di fatto**: tutti i test di T-20 sono verdi; `PrenotazioneConfermata.simulazione`
  è sempre presente e non omissibile (test di tipo); a `latenzaMs = 0` il servizio è sincrono e
  ripetibile (test senza `fake timers`).

---

### Onda 3 — Stato e componenti trasversali

#### T-23 — Test di `macchinaSessione` (da `prenotazione.feature`)
- **File**: `app/src/stato/macchinaSessione.test.ts`
- **Dipendenze**: T-04, T-05
- **Requisiti serviti**: AC-07.2, AC-07.3, AC-03.4
- **ADR**: ADR-0006 §5
- **Scenari BDD serviti**: `prenotazione.feature` ("Anna può tornare indietro senza perdere la
  foto")
- **Definizione di fatto**: il test esiste, importa `macchinaSessione` non ancora implementato,
  fallisce; copre: tornare da S-07 a S-06 non azzera `lettura` né `ricetta`; solo una nuova
  acquisizione in S-02 azzera `lettura`; `campiInseritiDallaPersona` sopravvive a una nuova foto.

#### T-24 — `stato/macchinaSessione.ts`
- **File**: `app/src/stato/macchinaSessione.ts`
- **Dipendenze**: T-23
- **Requisiti serviti**: come T-23
- **ADR**: ADR-0006 §5, ADR-0001 (sync `history.pushState`, nessun router)
- **Scenari BDD serviti**: come T-23
- **Definizione di fatto**: tutti i test di T-23 sono verdi; il reducer è puro (nessun side
  effect diretto; la sync con `history.pushState` è isolata in un effetto separato collegato da
  T-24b/`SessioneProvider`).

#### T-24b — `stato/SessioneProvider.tsx`
- **File**: `app/src/stato/SessioneProvider.tsx`
- **Dipendenze**: T-24
- **Requisiti serviti**: precondizione di tutti gli schermi
- **ADR**: ADR-0006, ADR-0001
- **Scenari BDD serviti**: precondizione trasversale
- **Definizione di fatto**: un componente di test avvolto nel provider legge `schermoCorrente`
  iniziale (`S-01`) e può dispatchare un'azione che lo cambia; il tasto "indietro" del browser
  (simulato con `history.back()` in jsdom) riporta allo schermo precedente.

#### T-25 — `componenti/Schermo.tsx`
- **File**: `app/src/componenti/Schermo.tsx`
- **Dipendenze**: T-01, T-03
- **Requisiti serviti**: AC-08.4 (titolo H1 univoco, focus management)
- **ADR**: architecture.md §6.1, §6.2; ADR-0001 (unico emettitore di `<h1>`)
- **Scenari BDD serviti**: `accessibilita.feature` ("Il percorso funziona anche con il tasto Tab")
- **Definizione di fatto**: test RTL verifica che il componente renderizzi esattamente un
  `<h1>` con `tabIndex={-1}` e che riceva il focus dopo il mount (`document.activeElement`).

#### T-26 — `componenti/RegioneAnnunci.tsx`
- **File**: `app/src/componenti/RegioneAnnunci.tsx`, hook `useAnnuncio()`
- **Dipendenze**: T-03
- **Requisiti serviti**: AC-08.4 (screen reader)
- **ADR**: architecture.md §6.3 (unica live region dell'app)
- **Scenari BDD serviti**: `accessibilita.feature` ("Lo schermo annuncia i cambiamenti")
- **Definizione di fatto**: test RTL verifica `aria-live="polite"` su un solo nodo dell'albero;
  chiamare `useAnnuncio()` due volte in rapida sequenza aggiorna lo stesso nodo (nessuna seconda
  regione creata).

#### T-27 — `componenti/CheSignifica.tsx`
- **File**: `app/src/componenti/CheSignifica.tsx`
- **Dipendenze**: T-03, T-11
- **Requisiti serviti**: AC-04.1
- **ADR**: ADR-0009 §1
- **Scenari BDD serviti**: `conferma_visita.feature` (affordance "Che significa?")
- **Definizione di fatto**: dato un `Termine`, il componente mostra un elemento visibile (non un
  tooltip a solo hover) che espande il testo di `spiega(termine)`; test RTL su tastiera (Enter/
  Space attivano l'espansione).

#### T-28 — `componenti/CitazioneOriginale.tsx`
- **File**: `app/src/componenti/CitazioneOriginale.tsx`
- **Dipendenze**: T-03
- **Requisiti serviti**: AC-02.2, G-03
- **ADR**: ADR-0009 §2
- **Scenari BDD serviti**: `conferma_visita.feature` ("Il testo originale della ricetta è sempre
  disponibile")
- **Definizione di fatto**: test RTL verifica che il testo passato come `citazioneOriginale` sia
  presente nel DOM accessibile (non solo visivamente) dopo l'espansione, raggiungibile in un
  tocco/invio da tastiera.

#### T-29 — `componenti/RitaglioFoto.tsx`
- **File**: `app/src/componenti/RitaglioFoto.tsx`
- **Dipendenze**: T-03
- **Requisiti serviti**: AC-02.4, AC-03.1
- **ADR**: architecture.md §6.5
- **Scenari BDD serviti**: `fallback_foto.feature`, `conferma_visita.feature` (campo a bassa
  confidenza)
- **Definizione di fatto**: dato un `Riquadro` e un'immagine, il componente renderizza un
  `<svg aria-hidden="true">` sovrapposto con `alt` descrittivo sull'immagine sottostante (test RTL
  su presenza e contenuto dell'`alt`).

---

### Onda 4 — Percorso nominale, schermo per schermo

#### T-30 — `schermi/S01Benvenuto.tsx`
- **File**: `app/src/schermi/S01Benvenuto.tsx`
- **Dipendenze**: T-25
- **Requisiti serviti**: AC-08.5 (un'azione principale)
- **Scenari BDD serviti**: `portale_prima.feature` ("Il percorso prima è raggiungibile in un
  tocco", link da qui)
- **Definizione di fatto**: test RTL: un solo `button`/link primario sopra la piega; il link
  "Vedi come funzionava prima" è presente e secondario (non full-width, non `btn-primary`).

#### T-31 — `schermi/S02Fotografa.tsx`
- **File**: `app/src/schermi/S02Fotografa.tsx`
- **Dipendenze**: T-25, T-18
- **Requisiti serviti**: AC-01.1, AC-01.5
- **ADR**: ADR-0003 (`precarica()` all'ingresso)
- **Scenari BDD serviti**: `prenotazione.feature` (percorso nominale, primo passo)
- **Definizione di fatto**: test RTL: al mount dello schermo, `precarica()` del lettore viene
  invocata (spy) prima di qualunque scatto; l'avviso privacy è presente nel DOM prima del
  controllo di upload (ordine di focus verificato).

#### T-32 — `schermi/S03LetturaInCorso.tsx`
- **File**: `app/src/schermi/S03LetturaInCorso.tsx`
- **Dipendenze**: T-25, T-24b
- **Requisiti serviti**: stato di attesa accessibile
- **ADR**: architecture.md §6.3 (annuncio massimo due volte)
- **Scenari BDD serviti**: `accessibilita.feature` (annunci)
- **Definizione di fatto**: test RTL: `role="status"` presente; dopo 8s simulati (timer finti)
  compare il testo "ci vuole più del solito" e la regione annunci lo riporta una sola volta.

#### T-33 — Test componente S-04 (da `conferma_visita.feature`)
- **File**: `app/src/schermi/S04ConfermaLettura.test.tsx`
- **Dipendenze**: T-24b, T-27, T-28, T-29
- **Requisiti serviti**: AC-02.1, AC-02.2, AC-02.3, AC-02.4, AC-04.3
- **Scenari BDD serviti**: tutti i 5 scenari di `conferma_visita.feature`
- **Definizione di fatto**: il file esiste, importa `S04ConfermaLettura` non ancora
  implementato, fallisce; copre esplicitamente: risposta "No, non è questa" → naviga a S-04b senza
  procedere; campo a bassa confidenza → mostra ritaglio + domanda dedicata prima di abilitare "Sì".

#### T-34 — `schermi/S04ConfermaLettura.tsx`
- **File**: `app/src/schermi/S04ConfermaLettura.tsx`
- **Dipendenze**: T-33
- **Requisiti serviti**: come T-33
- **Scenari BDD serviti**: come T-33
- **Definizione di fatto**: tutti i test di T-33 sono verdi.

#### T-35 — `schermi/S04bRecupero.tsx`
- **File**: `app/src/schermi/S04bRecupero.tsx`
- **Dipendenze**: T-34
- **Requisiti serviti**: AC-02.3
- **Scenari BDD serviti**: coperto dal test già scritto in T-33 (percorso "No, non è questa");
  nessun test aggiuntivo dedicato
- **Definizione di fatto**: le due opzioni ("Fai un'altra foto" → S-02, "Inserisci il codice con
  la guida" → S-05b) sono entrambe raggiungibili da tastiera e nessuna è preselezionata come
  primaria (verificato nel test di T-33 esteso a questo schermo).

#### T-36 — Test componente S-05b (da `fallback_foto.feature`)
- **File**: `app/src/schermi/S05bGuidaLettura.test.tsx`
- **Dipendenze**: T-29, T-24b
- **Requisiti serviti**: AC-03.1, AC-03.2, AC-03.3, AC-03.4
- **Scenari BDD serviti**: tutti e 5 gli scenari di `fallback_foto.feature`
- **Definizione di fatto**: il file esiste, importa `S05bGuidaLettura` non ancora implementato,
  fallisce; copre: validazione per segmento con messaggio che indica quanti caratteri mancano;
  "rifare la foto" da questo schermo non perde i dati già confermati (verifica su
  `campiInseritiDallaPersona`/stato).

#### T-37 — `schermi/S05bGuidaLettura.tsx`
- **File**: `app/src/schermi/S05bGuidaLettura.tsx`
- **Dipendenze**: T-36
- **Requisiti serviti**: come T-36
- **Scenari BDD serviti**: come T-36
- **Definizione di fatto**: tutti i test di T-36 sono verdi.

#### T-38 — `schermi/S06Preferenza.tsx`
- **File**: `app/src/schermi/S06Preferenza.tsx`
- **Dipendenze**: T-25, T-27
- **Requisiti serviti**: AC-05.4, D-06 (ASL come proxy, mai un campo indirizzo)
- **Scenari BDD serviti**: `scelta_appuntamento.feature` ("Anna viene richiesta solo di una
  preferenza")
- **Definizione di fatto**: test RTL: due card selezionabili, pulsante "Mostrami le proposte"
  disabilitato finché non è scelta una card; nessun campo di testo libero presente nel DOM.

#### T-39 — Test componente S-07 (da `scelta_appuntamento.feature`)
- **File**: `app/src/schermi/S07ProposteAppuntamento.test.tsx`
- **Dipendenze**: T-22, T-24b
- **Requisiti serviti**: AC-05.1, AC-05.2, AC-05.3, AC-05.5
- **Scenari BDD serviti**: i restanti scenari di `scelta_appuntamento.feature` (proposte "presto",
  "vicino a casa", nessuna disponibilità)
- **Definizione di fatto**: il file esiste, importa `S07ProposteAppuntamento` non ancora
  implementato, fallisce; copre il caso "nessuna disponibilità" → alert con numero fittizio
  `800 000 000` e nessuna azione bloccante.

#### T-40 — `schermi/S07ProposteAppuntamento.tsx`
- **File**: `app/src/schermi/S07ProposteAppuntamento.tsx`
- **Dipendenze**: T-39
- **Requisiti serviti**: come T-39
- **Scenari BDD serviti**: come T-39
- **Definizione di fatto**: tutti i test di T-39 sono verdi; mai più di 3 card nel DOM
  (verificato anche se il servizio ne restituisse di più, per difesa in profondità oltre al
  vincolo di tipo di T-22).

#### T-41 — Test componente S-08/S-09 (da `conferma_finale.feature`)
- **File**: `app/src/schermi/S08RiepilogoConferma.test.tsx`,
  `app/src/schermi/S09PrenotazioneConfermata.test.tsx`
- **Dipendenze**: T-22, T-24b
- **Requisiti serviti**: AC-06.1, AC-06.2, AC-06.3, AC-06.4, AC-06.5, AC-07.3
- **Scenari BDD serviti**: tutti e 6 gli scenari di `conferma_finale.feature`
- **Definizione di fatto**: i file esistono, importano componenti non ancora implementati,
  falliscono; copre esplicitamente l'ordine delle informazioni (che visita/quando/dove/cosa
  portare/quanto paga/come disdire), lo zoom 200% senza scorrimento orizzontale (test su
  `overflow-x`), e "torna indietro prima di confermare" senza perdere la scelta.

#### T-42 — `schermi/S08RiepilogoConferma.tsx`
- **File**: `app/src/schermi/S08RiepilogoConferma.tsx`
- **Dipendenze**: T-41
- **Requisiti serviti**: come T-41
- **Scenari BDD serviti**: come T-41
- **Definizione di fatto**: tutti i test di T-41 relativi a S-08 sono verdi; il testo di
  dichiarazione della simulazione (`PrenotazioneConfermata.simulazione.dichiarazione`, ADR-0007)
  è renderizzato in testa allo schermo, non in fondo.

#### T-43 — `schermi/S09PrenotazioneConfermata.tsx`
- **File**: `app/src/schermi/S09PrenotazioneConfermata.tsx`
- **Dipendenze**: T-42
- **Requisiti serviti**: AC-06.2 (salvabile senza account)
- **Scenari BDD serviti**: come T-41, sezione S-09
- **Definizione di fatto**: tutti i test di T-41 relativi a S-09 sono verdi; il pulsante "Salva o
  stampa" invoca `window.print()` (spy nel test, nessuna generazione PDF — sotto la linea, §3).

---

### Onda 5 — Rami isolati della demo

#### T-44 — Test componente S-10 (da `portale_prima.feature`)
- **File**: `app/src/schermi/S10PortaleReplica.test.tsx`
- **Dipendenze**: T-01, T-03
- **Requisiti serviti**: AC-RD1.1, AC-RD1.2
- **ADR**: ADR-0008
- **Scenari BDD serviti**: i primi 4 scenari di `portale_prima.feature`
- **Definizione di fatto**: il file esiste, importa `S10PortaleReplica` non ancora implementato,
  fallisce; copre: campo NRE con aiuto insufficiente, messaggio "Codice non valido." senza
  `AzioneDiRecupero` (unico caso nell'app, dichiarato in ADR-0008), banner di simulazione non
  chiudibile, link di ritorno a CarePath.
- **Nota**: S-10 **non** importa né condivide `macchinaSessione` (architecture.md §2) — il test
  verifica anche l'assenza di questa dipendenza.

#### T-45 — `schermi/S10PortaleReplica.tsx`
- **File**: `app/src/schermi/S10PortaleReplica.tsx`
- **Dipendenze**: T-44
- **Requisiti serviti**: come T-44
- **Scenari BDD serviti**: come T-44
- **Definizione di fatto**: tutti i test di T-44 sono verdi; nessuna risorsa grafica di terzi nel
  bundle (verificato anche da T-49).

#### T-46 — `schermi/S11AutonomiaLimiti.tsx`
- **File**: `app/src/schermi/S11AutonomiaLimiti.tsx`
- **Dipendenze**: T-12, T-24b
- **Requisiti serviti**: AC-RD2.1, AC-RD2.2
- **Scenari BDD serviti**: `portale_prima.feature` (funzionalità "Vedere quanto è cambiato con
  CarePath", 2 scenari)
- **Definizione di fatto**: tabella con le 6 righe del PRD §6 (M1-M6) e i limiti residui elencati
  in `ux-spec.md` §S-11, in un `<table>` responsiva; se `registroMetriche` non produce contatori
  live entro il timebox di T-12, questa schermata usa i valori statici e lo dichiara in un
  commento nel codice (coerente con architecture.md §8).

---

### Onda 6 — Assemblaggio

#### T-47 — `App.tsx` / `main.tsx`
- **File**: `app/src/App.tsx`, `app/src/main.tsx` (sostituisce lo stub di T-01)
- **Dipendenze**: T-30, T-31, T-32, T-34, T-35, T-37, T-38, T-40, T-42, T-43, T-45, T-46, T-24b
- **Requisiti serviti**: tutto il percorso nominale + i due rami demo
- **ADR**: ADR-0001 (nessun router; sync `history.pushState` dal reducer)
- **Scenari BDD serviti**: `prenotazione.feature` (end-to-end)
- **Definizione di fatto**: un test RTL end-to-end attraversa S-01 → S-02 (mock del lettore) →
  S-04 → S-06 → S-07 → S-08 → S-09 senza errori console; il tasto "indietro" del browser
  (`history.back()`) in un punto intermedio riporta allo schermo precedente con lo stato intatto.

---

### Onda 7 — Guardrail trasversali

#### T-48 — Test `accessibilita.feature`
- **File**: `app/src/test/accessibilita.test.tsx`
- **Dipendenze**: T-47
- **Requisiti serviti**: AC-08.2, AC-08.3, AC-08.4, AC-06.3
- **Scenari BDD serviti**: tutti e 6 gli scenari di `accessibilita.feature`
- **Definizione di fatto**: test verdi su: aree toccabili ≥ 44×44px (lettura di
  `getBoundingClientRect` o classi dimensionali note); nessuna informazione veicolata dal solo
  colore (verifica presenza di testo/icona accanto a badge colorati); percorso nominale
  attraversabile solo con `Tab`/`Enter` (nessun click diretto nel test); riepilogo finale senza
  `overflow-x` a 375px di larghezza simulata.

#### T-49 — Test guardrail trasversali
- **File**: `app/src/test/guardrail.test.ts`
- **Dipendenze**: T-47 (richiede il bundle/build completo)
- **Requisiti serviti**: AC-01.5, G-02, G-03, AC-05.5
- **ADR**: ADR-0002, ADR-0004, ADR-0007, ADR-0009
- **Scenari BDD serviti**: nessuno dedicato — protegge gli invarianti degli ADR (ADR-0010 §5)
- **Definizione di fatto**: test verdi su: nessun URL `http(s)://` verso host esterni nel bundle
  di build; nessun import di `src/fixtures/letture/` fuori da file `*.test.ts`; ogni nome di
  struttura in `agende.json` appartiene all'allowlist dichiarata; nessuna proposta generata da
  `prenotazioneSimulata` supera `finestraMassimaGiorni` della classe di priorità.

---

## 3. Sotto la linea — dichiarato, sacrificabile senza rompere la demo

Coerente con `architecture.md` §8: il budget dei must-have (T-01…T-49) satura le 10 ore-uomo.
Questi task **non fanno parte del piano di consegna**; sono elencati per completezza e per
evitare che vengano aggiunti "gratis" a scapito di un task sopra la linea.

| # | Task fuori piano | Perché è sotto la linea |
|---|---|---|
| ST-01 | Generazione PDF client-side della conferma | `window.print()` (T-43) soddisfa AC-06.2 da solo |
| ST-02 | Service worker / PWA installabile | nessun AC lo richiede; aggiunge superficie di cache da spiegare |
| ST-03 | Copertura BDD completa dei 7 `.feature` oltre le priorità ADR-0010 §4 | l'ordine dichiarato è `prenotazione` → `fallback_foto` → `conferma_visita`; gli altri sono coperti (T-39/41/44/48) ma senza margine per varianti aggiuntive |
| ST-04 | Controlli axe automatici | `accessibilita.feature` (T-48) copre i criteri del PRD; axe è un controllo aggiuntivo, non richiesto da un AC |
| ST-05 | i18n (multi-lingua) | fuori tema: tutto l'output è in italiano per contratto (`_shared-context.md`) |
| ST-06 | Animazioni di transizione fra schermi | nessun AC le richiede; rischio di conflitto con `prefers-reduced-motion` non gestito nel budget |
| ST-07 | Test manuale con screen reader reale (VoiceOver/TalkBack) | dichiarato come verifica "da fare in build" in `ux-spec.md` §5; i test RTL di T-48 sono l'approssimazione automatizzata dentro il budget |

Se il tempo residuo dopo T-49 lo permette, l'ordine di recupero consigliato è ST-07 → ST-03 → ST-01.

---

## 4. Auto-critica avversariale

**Ogni requisito del PRD è tracciato ad almeno un task? Ogni task serve un requisito?**
Sì per le user story US-01…08 e per RD-01/02 (tabella §0). RD-03 è tracciata parzialmente a task
(T-08, T-09, T-11, T-14, T-18, T-46, tutti producono la tracciabilità AI/umano richiesta) e
parzialmente al di fuori di `app/` (il registro dei gate in `agents/PIPELINE.md`, che non è un
deliverable di BUILD e quindi non ha un task qui) — dichiarato esplicitamente in tabella invece di
forzare un task fittizio.

**Esistono dipendenze circolari o task bloccati da lavoro non pianificato?**
Verificato a mano il grafo delle dipendenze §1-§2: è un DAG. Il punto più a rischio era
T-08→T-09→T-14, perché T-08 è un modulo non previsto nell'architettura originale; è stato
inserito come dipendenza esplicita di T-09 (non implicita) proprio per evitare che BUILD lo
scopra a metà implementazione di `prestazione.ts`.

**La prima ondata produce qualcosa di dimostrabile, o il valore arriva solo alla fine?**
No: le onde 0-3 (T-01…T-29) sono infrastruttura invisibile — è il costo dichiarato
dell'architettura a tipi (ADR-0006), non un difetto di questo piano. Il primo momento
dimostrabile a una persona non tecnica è **T-34** (onda 4): "fotografo la ricetta, il sistema mi
dice cosa ha letto". È segnalato in §1 come tale, per chi gestisce il tempo in sala macchine.

**Un task è troppo grosso per essere chiuso e verificato in un colpo solo?**
Rivisto due candidati: `estraiCampi` (T-13/T-14) e `macchinaSessione` (T-23/T-24) erano un
task solo nella prima stesura; sono stati spezzati in test-poi-codice perché sono i due moduli
con più invarianti nascosti (ADR-0005, ADR-0006) e un task unico avrebbe permesso di dichiararli
"fatti" senza che il test rosso fosse mai stato visto rosso.

**Il percorso della demo (prima/dopo) è interamente coperto dai task sopra la linea?**
Sì: S-01→S-09 (T-30…T-43), S-10 (T-44/T-45), S-11 (T-46) sono tutti sopra la linea. Il ramo di
fallback US-03 (S-04b/S-05b, T-35/T-36/T-37) è sopra la linea per costruzione: PRD lo definisce
esplicitamente come requisito e non come ripiego (US-03: *"un fallback che si limita a 'inserisci
l'NRE a mano' ricrea la barriera ed è un fallimento del requisito"*).

**Ci sono file nominati in modo incoerente con l'architettura?**
Un'aggiunta: `src/dominio/tabellaBranca.ts` (T-08) non è nell'albero originale di
`architecture.md` §1. È una estensione minima e coerente con la cartella `dominio/` esistente
(nessun nuovo livello architetturale, nessun nuovo pattern), motivata in T-08 stesso; non
richiede un ADR perché non introduce una decisione strutturale — esegue un debito già
riconosciuto e arbitrato in `architecture.md` §9. Le altre convenzioni di naming per gli schermi
(`schermi/S01Benvenuto.tsx` … `S11AutonomiaLimiti.tsx`) sono un'interpretazione di
"S-01 … S-11, uno per file" (architecture.md §1, che non fissava i nomi file): scelta di PLAN,
segnalata qui come tale in caso BUILD preferisca un'altra convenzione — non è un contratto come
i tipi del §3.

**Sto pianificando test come attività finale invece che come primo passo di ogni task?**
No: ogni punto in cui esiste uno scenario `.feature` ha un task di test con ID più basso del
task di implementazione corrispondente (T-13/14, T-20/22, T-23/24, T-33/34, T-36/37, T-39/40,
T-41/42/43, T-44/45, T-48/49 sono già "solo test" perché verificano invarianti trasversali dopo
l'assemblaggio). L'unica eccezione dichiarata sono i moduli di dominio senza scenario dedicato
(T-06, T-07, T-10, T-11, T-12, T-17, T-21), per cui la definizione di fatto richiede comunque un
test scritto come parte del task, ma non tracciato come coppia di ID separata — è una
semplificazione dichiarata, non un'omissione: spezzarli avrebbe portato il piano da 49 a oltre 60
task senza aggiungere una scadenza verificabile in più.

**Rilievo verso UX (non risolvibile da PLAN): manca uno scenario BDD per "prestazioni multiple".**
PRD §5 e architecture.md §5.3 definiscono il comportamento (bloccante e terminale, il sistema si
ferma e rimanda al CUP telefonico), ma nessun file `.feature` lo scenarizza esplicitamente.
**IMPORTANTE** — T-13 include comunque un caso di test per questo comportamento (a livello di
`estraiCampi`, dove il campo `prestazioniMultiple` vive), quindi il requisito non resta
scoperto, ma manca il livello "storyboard di demo" che gli altri comportamenti hanno. Segnalato
per un eventuale party di UX, non bloccante per l'esecuzione di questo piano.

**Rilievo verso ARCH (minore): il debito di `architecture.md` §9 su `agende.json` resta aperto.**
Il contenuto esatto di `fixtures/agende.json` era esplicitamente "lasciato a BUILD" in ADR-0007.
T-21 lo istanzia entro i vincoli già scritti (nomi fittizi, slot relativi); non è un debito
nuovo, è l'esecuzione di quello già dichiarato.

---

## Riferimenti

- Developers Italia — https://developers.italia.it/it
- Design system .italia — https://designers.italia.it/design-system/
- Accessibilità by-design (WCAG 2.1 AA, UNI CEI EN 301549:2021) — https://designers.italia.it/design-system/fondamenti/accessibilita/
- Bootstrap Italia, per sviluppatori — https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
- Manuale operativo di design — https://docs.italia.it/italia/designers-italia/manuale-operativo-design-docs/it/versione-corrente/
- Linee guida di design per i servizi digitali della PA (AgID, art. 53 CAD) — https://www.agid.gov.it/sites/default/files/repository_files/design-italia.pdf
- Deliverable a monte: `app/docs/PRD.md`, `app/docs/ux-spec.md`, `app/docs/wireframes.md`,
  `app/docs/architecture.md`, `app/docs/adr/0001…0010`, `app/docs/scenarios/*.feature`,
  `app/data/nomenclatore-branca.json`
