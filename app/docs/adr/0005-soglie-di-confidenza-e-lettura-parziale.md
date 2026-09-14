# ADR-0005 — Soglie di confidenza e comportamento sulla lettura parziale

**Fase 3 · ARCH (con UX)** · criteri: *soglia di bassa confidenza e comportamento di degrado
dichiarati nel contratto, non a parole*
**Chiude la decisione aperta D-05.**

## Contesto

D-05 pone il dilemma con precisione: *"proseguire marcando il campo come da verificare (AC-02.4)
accelera, ma introduce il rischio di prenotare sulla base di un dato letto male"*.

Il rischio non è simmetrico fra i campi. Un NRE sbagliato di una cifra manda a vuoto l'intera
prenotazione **senza che nessuno se ne accorga**: Anna riceve una conferma che sembra valida e
scopre il problema allo sportello. Una prestazione letta male, invece, Anna la riconosce
immediatamente perché ha il foglio in mano — ed è esattamente il lavoro che S-04 le chiede.

Serve inoltre una posizione di prodotto, non solo una soglia numerica: che **forma** prende
l'incertezza quando arriva davanti a una persona di 74 anni.

## Decisione

### 1. Regola di prodotto invariante

> **L'incertezza si mostra ad Anna come una domanda semplice. Non si nasconde e non si indovina.**

La forma della domanda è **una sola** in tutta l'applicazione: ritaglio della *sua* foto +
valore letto + due pulsanti (`Sì, è giusto` / `No, è diverso`). Mai un campo di testo libero,
mai una lista di alternative, mai una percentuale di confidenza mostrata a schermo (un numero
che nessuno sa interpretare non è trasparenza).

### 2. Soglie

Costanti esportate da `src/dominio/confidenza.ts`, non numeri sparsi nel codice.

| Origine | Confidenza | Stato del campo | Cosa succede |
|---|---|---|---|
| barcode | decodifica + delimitatori Code 39 validi | `certo` (1.0) | nessuna domanda |
| barcode | decodifica fallita | — | il campo passa all'OCR; se anche l'OCR fallisce → `nonLetto` |
| ocr | **≥ 0.85** | `certo` | il valore, con la citazione originale accanto (G-03) |
| ocr | **0.60 ≤ c < 0.85** | `daVerificare` | domanda chiusa con ritaglio (AC-02.4) |
| ocr | **< 0.60** | `nonLetto` | il campo non esiste come letto; si applica la tabella di degrado |

La confidenza di Tesseract (0–100) è normalizzata a 0–1 all'ingresso. Per un campo composto da
più parole si usa la **confidenza minima** fra le parole che lo compongono, non la media: la
media nasconde la parola sbagliata dentro le altre.

### 3. La confidenza del barcode è binaria

Non esiste un Code 39 "letto a metà": o i delimitatori e la lunghezza tornano, e il valore è
certo, oppure il barcode non esiste. Questa è la proprietà per cui l'NRE è affidato al barcode
(ADR-0003): il suo modo di fallire è visibile.

### 4. Degrado per campo quando lo stato è `nonLetto`

`puoProcedere` è **derivato**, mai impostato a mano:
`nre ≠ nonLetto && prestazione ≠ nonLetto && !prestazioniMultiple`.

| Campo | Bloccante | Comportamento |
|---|---|---|
| **NRE** | sì | → S-05b, inserimento guidato a **due segmenti** sulla foto annotata (AC-03.2). Se un solo segmento manca, si chiede solo quello |
| **Prestazione** | sì | → S-04b. Il sistema dichiara di non aver capito quale visita è. **Non la deduce** dal codice a barre né dalla branca: sarebbe indovinare |
| **Classe di priorità** | no | il servizio usa la finestra più larga (`P`) e **non filtra** le proposte; il limite è dichiarato in S-11 |
| **Esenzione** | no | S-08 scrive "Non ho trovato un codice di esenzione sulla ricetta: porti la tessera sanitaria", mai un importo dedotto |
| **Area ASL** | no | se Anna sceglie "Stare vicino a casa", si chiede l'area con **una domanda chiusa su 3 opzioni**, mai un campo indirizzo (M1 resta 0) |
| **Prestazioni multiple** | sì, terminale | il sistema si ferma, cita le prestazioni trovate e rimanda al CUP telefonico (PRD §5) |

### 5. Come la soglia diventa un tipo

`CampoLetto<T>` è un'unione discriminata in cui il ramo `nonLetto` **non ha il campo `valore`**
e il ramo `daVerificare` **ha il `riquadro` obbligatorio** (`architecture.md` §3.1). Un campo non
letto non è leggibile per errore: il compilatore rifiuta. Un campo da verificare non può essere
mostrato senza il ritaglio che AC-02.4 richiede. E `RicettaConfermata` — l'unico tipo accettato
dal servizio di prenotazione — si costruisce solo dopo che ogni `daVerificare` ha ricevuto una
risposta da Anna.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Soglia unica su tutti i campi, per esempio 0.80** | tratta allo stesso modo un errore che Anna vede subito (prestazione) e uno che scoprirà allo sportello (NRE). L'asimmetria del danno è il fatto dominante |
| **Nessuna soglia: chiedere conferma su tutti i campi** | sicuro e inutilizzabile: trasformerebbe il percorso in un questionario, contro M3 (≤ 2 decisioni) e contro il senso del prodotto |
| **Nessuna soglia: procedere sempre col valore più probabile** | è "indovinare". Viola AC-02.3 e produce il fallimento peggiore, quello silenzioso |
| **Mostrare ad Anna la percentuale di confidenza** | sembra trasparenza, è scarico di responsabilità: "87%" non è un'informazione su cui una persona possa decidere |
| **Soglie apprese dai dati** | non ci sono dati, e non ci sono 5 ore per raccoglierli |

## Conseguenze

- **Positive** — D-05 è chiusa con un comportamento verificabile campo per campo. AC-02.3 e
  AC-02.4 diventano proprietà del sistema di tipi. Il percorso nominale resta a una sola domanda
  (AC-02.1) perché le domande di verifica compaiono **solo** quando la confidenza lo impone.
- **Negative** — le soglie 0.85 / 0.60 sono calibrate su **una sola** fixture reale
  (`intake/idea/Example files/image.png`) e su nessun campione statistico: è un limite dichiarato,
  da riportare fra i limiti residui di S-11. Su ricette di altre regioni potrebbero essere
  tarate male, con due effetti opposti: troppe domande di verifica, oppure un campo sbagliato
  accettato come certo.
- **Vincolo su BUILD** — le soglie si cambiano solo in `confidenza.ts`; un numero di confidenza
  scritto altrove nel codice è un difetto.

## Stato

**Accettato** — 2026-09-14. Concordato con la lente UX (forma della domanda). Chiude D-05.
