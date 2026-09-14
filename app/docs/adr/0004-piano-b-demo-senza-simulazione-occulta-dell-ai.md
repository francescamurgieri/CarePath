# ADR-0004 — Piano B per la demo live: il fallback è un percorso di prodotto, non una finta lettura

**Fase 3 · ARCH** · criteri: *sostituisce una capacità reale con un mock — i mock sono fixture di
test automation, mai un sostituto funzionale di una capacità promessa*
**Chiude la decisione aperta D-03** (parte "comportamento offline in demo"), insieme ad ADR-0003.

## Contesto

D-03 pone il problema nella sua forma più onesta: CLAUDE.md impone la lettura di immagini reali,
ma una demo live da 3 minuti non può permettersi un fallimento in diretta. La tentazione classica
è una "modalità demo" che, se la lettura non riesce, restituisce un risultato precompilato con
la stessa schermata di successo. Sarebbe una violazione diretta di **G-04** (uso dell'AI
spiegabile) e, di fatto, una bugia detta al valutatore.

Va notato che ADR-0002 ha già tolto metà del problema: senza rete, non c'è chiamata incerta da
fare. Resta il rischio residuo — l'OCR che non riconosce la prestazione sulla foto scattata
dal vivo, sotto la luce di una sala.

Il punto di svolta è che il prodotto **ha già** una via d'uscita progettata: US-03 dice che
quando la foto non basta, Anna vede la propria foto annotata e copia due numeri, e che un
fallback che la rimanda al modulo "è un fallimento del requisito, non una via d'uscita".
Quella via d'uscita non è un ripiego da demo: è un requisito must-have con i suoi criteri di
accettazione e i suoi scenari BDD.

## Decisione

**Il piano B della demo è il percorso US-03 (S-04b → S-05b). Non esiste altro piano B.**

1. **Nessuna modalità che simuli una lettura riuscita.** Non esiste, in nessun build, un
   percorso in cui il sistema mostra un risultato di lettura che l'AI non ha prodotto.
2. **Le fixture di lettura (`src/fixtures/letture/*.json`) sono fixture di test automation.**
   Sono importabili **solo** dai file di test e la loro importazione da codice applicativo è
   bloccata da una regola di lint, non da una convenzione. Non esiste un flag di runtime, una
   query string o una variabile d'ambiente che le attivi nel build di demo.
3. **Se durante la demo la lettura fallisce, si mostra il fallimento** e si continua sul
   percorso guidato. È un esito previsto, testato e — nel contesto di questo tema — **degno di
   essere mostrato**: è la dimostrazione che il prodotto non lascia Anna ferma. La narrazione
   della demo prevede esplicitamente questo ramo come secondo tempo.
4. **Riduzione del rischio alla radice**, non con un trucco:
   - l'NRE arriva dal codice a barre, molto più robusto dell'OCR (ADR-0003);
   - `precarica()` al passo S-02 elimina l'attesa del modello dal percorso critico;
   - nessuna dipendenza di rete (ADR-0002): il Wi-Fi della sala non è un fattore;
   - la foto può essere **caricata dalla galleria** oltre che scattata: in demo si usa una
     fotografia reale del promemoria acquisita in condizioni note. Resta una **immagine reale
     letta davvero**, non un JSON precompilato.
5. **Tracciabilità a schermo** (G-04, RD-03): S-11 dichiara quali campi sono stati letti dall'AI
   e quali sono stati inseriti da Anna nel percorso guidato, leggendo
   `campiInseritiDallaPersona` dal tipo `RicettaConfermata`. Quello che è successo davvero è
   visibile, non raccontato.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Modalità demo con risultato precompilato in caso di fallimento** | viola G-04 e inganna chi guarda. È esattamente la cosa che il tema elenca fra ciò da evitare ("uso dell'AI non spiegabile dal team") |
| **Lettura precalcolata mostrata con un banner "risultato di esempio"** | onesta, ma inutile: se il banner c'è, la demo non sta dimostrando la lettura; se non si nota, siamo tornati al caso precedente. Il fallback US-03 comunica la stessa cosa dicendo la verità |
| **Video registrato della lettura riuscita** | sposta il problema fuori dal prodotto e rende la demo non interattiva |
| **Provider cloud con retry** | escluso da ADR-0002; e un retry su rete incerta in 3 minuti è il peggiore dei mondi |
| **Ritentare l'OCR in silenzio con parametri diversi** | `architecture.md` §5.4 lo vieta: un ritentativo invisibile che presenta il secondo risultato come il primo è una forma attenuata della stessa bugia |

## Conseguenze

- **Positive** — D-03 si chiude senza compromessi su G-04. Il rischio di demo è gestito
  riducendo la probabilità di fallimento (barcode, precaricamento, zero rete) invece di
  mascherarne l'effetto. Il ramo di fallimento è coperto da scenari BDD già scritti
  (`fallback_foto.feature`), quindi è codice testato e non improvvisazione.
- **Negative** — resta una probabilità reale che in demo si veda il percorso guidato invece di
  quello nominale. Chi presenta deve saperlo prima e avere la frase pronta: *"questo è il caso
  in cui l'AI non ce la fa, ed è il motivo per cui Anna arriva in fondo lo stesso"*.
- **Vincolo su BUILD** — nessun import di `src/fixtures/letture/` fuori da `*.test.ts`;
  nessun flag di runtime che scavalchi il `LettoreRicetta` reale.

## Stato

**Accettato** — 2026-09-14. Chiude D-03 insieme ad ADR-0003.
