# ADR-0009 — Dizionario statico dei termini e filtro clinico: dove l'AI non arriva

**Fase 3 · ARCH** · criteri: *scelta strutturale e rischiosa — determina dove è applicato il
guardrail di dominio G-01 e come si tratta il contenuto del documento sorgente*

## Contesto

CarePath mostra ad Anna due categorie di testo che non provengono direttamente dalla sua ricetta:

1. le **spiegazioni** dei termini amministrativi ("Che significa?" — AC-04.1/04.2/04.3);
2. la **riformulazione in parole comuni** della prestazione ("Visita ortopedica di controllo").

Entrambe sono il punto in cui il prodotto rischia di tradire i propri guardrail.

- **AC-04.4** è categorico: *"nessuna spiegazione è generata al volo in modo non verificabile:
  i testi sono fissi, versionati nel repository e leggibili da un revisore umano"*.
- **G-01** vieta diagnosi, triage e consigli medici. Il promemoria della ricetta contiene però
  sezioni genuinamente cliniche — in particolare il **quesito diagnostico** e le note del
  prescrittore. L'OCR, che legge tutto il foglio, le porta dentro il sistema senza saperlo.
- **G-03** vieta di alterare il significato di ciò che è scritto sulla ricetta.

Il rischio concreto: l'OCR legge una nota clinica, `estraiCampi` la scambia per parte della
prestazione, e CarePath mostra ad Anna un testo clinico riformulato in "parole semplici".
Sarebbe una violazione di G-01 e G-03 insieme, prodotta senza che nessuno l'abbia decisa.

## Decisione

**Tre meccanismi distinti, ciascuno con un confine netto su ciò che può produrre.**

### 1. Dizionario statico — l'unica fonte di testo esplicativo

```ts
type Termine = 'nre' | 'branca' | 'classePriorita' | 'strutturaErogatrice' | 'esenzione' | 'regime';
export function spiega(t: Termine): SpiegazioneTermine;   // sincrona, totale
```

- I testi vivono in `src/servizi/dizionario/termini.it.ts` come `Record<Termine, …>` **completo**:
  aggiungere un termine senza spiegarlo non compila. È AC-04.1 e M2 = 0 resi strutturali.
- Nessuna chiamata, nessuna generazione a runtime, nessun modello coinvolto: sono stringhe
  scritte da una persona e revisionate da una persona (AC-04.4, G-04, RD-03).
- I testi sono quelli già redatti in `ux-spec.md` §S-04: ARCH non li riscrive, li versiona.
- **Regola su `classePriorita`** (AC-04.3): la spiegazione riporta la lettera **come stampata**
  e il solo significato **organizzativo** (entro quanto il servizio deve fissare l'appuntamento).
  Un test verifica che non contenga "urgente", "grave", "clinico", "gravità" — è già uno
  scenario di `conferma_visita.feature`.

### 2. `normalizzaPrestazione()` — trasformazione deterministica, non interpretazione

```ts
function normalizzaPrestazione(testoOriginale: string): Prestazione;
```

Fa **solo** due cose: case-folding tipografico (`VISITA ORTOPEDICA DI CONTROLLO` →
`Visita ortopedica di controllo`) e distacco del codice di catalogo in coda (`— 89.01.G`) in un
campo proprio. **Nessuna parola viene sostituita, aggiunta o tolta.**

Test di reversibilità: `etichettaSemplice.toUpperCase()` deve essere contenuta in
`testoOriginale` a meno di spazi e del codice. Se un giorno qualcuno introducesse un dizionario
di sinonimi "per rendere più semplice", il test fallisce. È G-03 reso verificabile.

La citazione originale resta comunque sempre accessibile in un tocco (AC-02.2): la
semplificazione è **additiva**, mai sostitutiva.

### 3. `filtroClinico()` — ciò che non entra nel flusso

Prima dell'estrazione dei campi, il testo OCR viene segmentato e le sezioni cliniche del
documento vengono **escluse dalla pipeline di semplificazione**: quesito diagnostico, note del
prescrittore, sospetto diagnostico, e in generale ogni blocco successivo alle intestazioni
riconosciute come cliniche.

- Il testo escluso **non viene riformulato, non viene usato per inferire alcunché, non viene
  mostrato come informazione**. Se dovesse servire mostrarlo, si cita alla lettera — mai si
  interpreta (G-01, `_case.md`).
- `LetturaRicetta.contenutoClinicoEscluso: boolean` registra che l'esclusione è avvenuta: è
  tracciabilità, non censura silenziosa.
- Il filtro è **deliberatamente conservativo**: in caso di dubbio esclude. Un campo in meno
  produce una domanda ad Anna (ADR-0005); un contenuto clinico in più produce una violazione
  di guardrail.

### 4. Dove l'AI contribuisce e dove no — la riga che RD-03 chiede

| Prodotto da | Cosa |
|---|---|
| **AI (barcode + OCR)** | i **valori letti** dal documento e le loro coordinate. Nient'altro |
| **Codice deterministico** | composizione dell'NRE, normalizzazione tipografica, mappatura priorità→giorni, filtro clinico |
| **Persone (revisione umana)** | **ogni frase che Anna legge**: dizionario, copy degli schermi, messaggi d'errore |

Nessun testo mostrato ad Anna è generato da un modello a runtime. È la forma più verificabile
di G-04, e la si può dimostrare aprendo un file.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Generare le spiegazioni con un LLM al volo** | più fluide e adattive al contesto. Viola AC-04.4 alla lettera, è non verificabile da un revisore, e su un dominio sanitario può produrre una frase che sconfina nel clinico senza che nessuno la veda prima di Anna |
| **LLM in fase di build, testi congelati nel repository** | tecnicamente compatibile con AC-04.4 e tentante. Scartata per costo e perché i testi esistono già, scritti e revisionati in `ux-spec.md`: generarli sarebbe un passo in più per un risultato peggiore |
| **Dizionario di sinonimi per semplificare la prestazione** | "visita ortopedica" → "visita alle ossa" è comprensibile e **tradisce**: cambia ciò che il medico ha prescritto. Vietato da G-03 |
| **Nessun filtro clinico, ci si affida al layout della ricetta** | funziona sulla fixture di intake e si rompe alla prima ricetta di formato diverso. Un guardrail che dipende dalla fortuna non è un guardrail |
| **Mostrare l'intero testo OCR "per trasparenza"** | esporrebbe contenuto clinico non richiesto e contraddirebbe AC-06.5 |

## Conseguenze

- **Positive** — G-01, G-03 e G-04 hanno un punto di applicazione preciso nel codice e un test
  che li attacca dall'esterno. La frase "dove ha contribuito l'AI e dove è servita revisione
  umana", richiesta dal tema (RD-03), ha una risposta dimostrabile invece che raccontata.
- **Negative** — il dizionario copre sei termini: un termine amministrativo non previsto non
  avrebbe spiegazione, e M2 = 0 vale solo sui termini che il prodotto mostra davvero (è
  coerente con AC-04.1, che parla dei termini mostrati ad Anna). Il filtro clinico conservativo
  produrrà qualche esclusione di troppo, cioè qualche domanda in più: è il verso giusto
  dell'errore.
- **Vincolo su BUILD** — nessuna stringa rivolta ad Anna costruita per concatenazione di
  frammenti OCR; ogni testo viene dal dizionario, da `citazioneOriginale`, o da un template
  versionato.

## Stato

**Accettato** — 2026-09-14.
