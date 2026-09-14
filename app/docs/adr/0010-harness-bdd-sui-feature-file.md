# ADR-0010 — Harness BDD: i file `.feature` restano la sorgente di verità dei test

**Fase 3 · ARCH** · criteri: *introduce una dipendenza esterna* · *scelta strutturale: determina
come il Gate 3 viene verificato*

## Contesto

Nella pipeline di questo progetto gli scenari Gherkin non sono documentazione: `agents/PIPELINE.md`
li definisce come **test, specifica e storyboard della demo** insieme. BUILD procede
scenario → test → codice, e al Gate 3 il codice arriva **con i test già inclusi**.

Sette file `.feature` in italiano (`# language: it`) sono già scritti in `app/docs/scenarios/`.
Se l'harness di test non li legge, diventano documentazione che invecchia: la proprietà che
rende leggibile l'intera pipeline a un valutatore andrebbe persa al primo scarto fra scenario
e test.

Il vincolo è il budget: il tempo per l'infrastruttura di test è **30 minuti**, non di più.
Un setup Cucumber completo con Playwright non ci sta, e spenderebbe su plumbing ore che servono
agli schermi.

## Decisione

**Vitest + Testing Library, con i `.feature` come sorgente di verità — e un ripiego a costo zero
se l'integrazione Gherkin non sta nel timebox.**

### 1. Primo tentativo — timebox 30 minuti

Adapter Gherkin per Vitest (`jest-cucumber` o equivalente) che **legge i `.feature` reali** da
`app/docs/scenarios/` e mappa gli step. Il parser Gherkin ufficiale supporta le keyword italiane
(`Funzionalità`, `Dato che`, `Quando`, `Allora`), quindi i file non vanno tradotti.

### 2. Ripiego dichiarato — se il timebox scade

Test Vitest ordinari i cui `describe`/`it` portano **il testo esatto** di `Funzionalità` e
`Scenario`, più **un test di copertura** che:

- legge tutti i `.feature` con il parser Gherkin,
- estrae i titoli degli scenari,
- **fallisce** se uno scenario non ha un test omonimo.

Costa una decina di righe e conserva la proprietà che conta: uno scenario non può essere
aggiunto o modificato senza che la suite lo noti. Il file `.feature` resta la sorgente di verità
anche senza step definition.

### 3. Dove si attacca ciascun tipo di scenario

| Scenari | Livello | Perché lì |
|---|---|---|
| `fallback_foto`, `conferma_visita` (lettura, soglie, campi incerti) | **unità su `estraiCampi`**, funzione pura, con fixture di parole OCR | nessun browser, nessuna immagine, millisecondi: è ciò che rende il BDD economico nel budget |
| `scelta_appuntamento` (proposte, vincoli di priorità, ASL) | **unità sul servizio di prenotazione** a latenza 0 e `riferimentoTemporale` iniettato | deterministico e ripetibile |
| `prenotazione`, `conferma_finale` (percorso end-to-end, ordine delle informazioni) | **componente**, React Testing Library su jsdom | attacca il DOM reale, come farebbe una persona |
| `accessibilita` (focus, Tab, annunci, contrasto) | **componente** + asserzioni su ruoli e nomi accessibili | Testing Library interroga per ruolo: un test che passa è un DOM navigabile |
| `portale_prima` (replica CUP, errore opaco) | **componente** su S-10 | è un ramo isolato, si testa da solo |

Regola che sostiene tutto questo: **`src/dominio/` e `src/servizi/` non importano React**
(ADR-0006). È il confine che permette a un test BDD di attaccare la logica dall'esterno.

### 4. Priorità dentro il budget

Copertura completa dei sette file è **sotto la linea** (`architecture.md` §8). Ordine di
copertura obbligatorio: `prenotazione` (il percorso nominale), `fallback_foto` (il ramo che la
demo potrebbe dover mostrare — ADR-0004), `conferma_visita` (i guardrail G-01/G-03).

### 5. Test che proteggono gli invarianti, non solo gli scenari

Oltre agli scenari, la suite contiene controlli che difendono le decisioni di questi ADR:

- nessun URL verso host esterni nel bundle (ADR-0002 / AC-01.5);
- nessun import di `src/fixtures/letture/` da codice applicativo (ADR-0004);
- reversibilità di `normalizzaPrestazione` (ADR-0009 / G-03);
- nomi di struttura nella allowlist fittizia (ADR-0007 / G-02);
- nessuna proposta oltre la finestra della classe di priorità (AC-05.5).

### 6. Un test lento e separato

`lettura-reale.slow.test.ts` esegue il lettore sull'immagine di intake
(`intake/idea/Example files/image.png`) e verifica che l'NRE ricostruito sia
`010A24518061015`. È **escluso dalla suite veloce**: il suo esito dipende dalla qualità
dell'immagine, non dal codice, e non deve poter bloccare la build. Esiste perché il requisito
"il sistema legge immagini reali" abbia una verifica, non solo una dichiarazione.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **`@cucumber/cucumber` + Playwright** | l'harness BDD canonico e il più espressivo. Fuori budget: il solo setup del browser headless consuma il tempo di due schermi |
| **Test scritti a mano, `.feature` come sola documentazione** | la strada più rapida, e quella che fa marcire gli scenari. Contraddice il principio BDD di `agents/PIPELINE.md`, che è parte del deliverable valutato |
| **Tradurre i `.feature` in inglese per compatibilità** | i `.feature` in italiano sono anche lo storyboard della demo e vanno letti da persone italiane: tradurli per comodità dell'harness è ottimizzare la cosa sbagliata |
| **Solo test end-to-end** | lenti, fragili e incapaci di attaccare le soglie di confidenza campo per campo |

## Conseguenze

- **Positive** — gli scenari restano vivi in entrambi i rami della decisione. La maggior parte
  del comportamento critico si testa senza browser, quindi la suite resta veloce e il Gate 3
  verificabile. Gli invarianti degli ADR hanno un test che li protegge dalla deriva.
- **Negative** — nel ramo di ripiego la corrispondenza scenario ↔ test è per titolo, non per
  step: un test può portare il nome giusto e verificare la cosa sbagliata. È il limite accettato
  per stare in 30 minuti, e va dichiarato al Gate 3.
- **Vincolo su BUILD** — nessuno scenario `.feature` viene modificato da BUILD per far passare
  un test: uno scenario che non si può soddisfare è un rilievo da portare al party, non una
  riga da cambiare.

## Stato

**Accettato** — 2026-09-14.
