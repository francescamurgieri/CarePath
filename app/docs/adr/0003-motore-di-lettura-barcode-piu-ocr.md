# ADR-0003 — Motore di lettura della ricetta: decodifica Code 39 + OCR, entrambi locali

**Fase 3 · ARCH** · criteri: *introduce una dipendenza esterna o un provider AI — con timeout,
soglia di bassa confidenza e comportamento di degrado dichiarati nel contratto*
**Chiude la decisione aperta D-03** (parte "provider"). La parte "piano B della demo" è in ADR-0004.

## Contesto

CLAUDE.md è esplicito: *"il sistema deve leggere immagini di ricette vere; le ricette mock sono
fixture di test automation, non un sostituto funzionale"*. ADR-0002 ha escluso la rete: la
lettura deve avvenire sul dispositivo.

Il dato che determina il successo o il fallimento del prodotto è **uno solo**: l'NRE. È il campo
su cui Anna si blocca (PRD §1), è il campo che il servizio richiede, ed è il campo in cui un
errore di una singola cifra manda a vuoto tutto il percorso senza che nessuno se ne accorga.

Guardando la fixture di intake (`intake/idea/Example files/image.png`) si osserva un fatto
decisivo: i due segmenti dell'NRE sono stampati **sotto due codici a barre**, fra asterischi
(`*010A2*`, `*4518061015*`). L'asterisco è il delimitatore di start/stop del **Code 39**. Quel
numero, sul promemoria, esiste già in una forma **progettata per essere letta da una macchina**.

Affidare l'NRE all'OCR significa chiedere a un riconoscitore di caratteri di distinguere `0`
da `O`, `1` da `I`, `5` da `S` su una foto scattata a mano da una persona di 74 anni. Affidarlo
al decodificatore di codici a barre significa leggerlo con un algoritmo che ha un checksum di
formato e che, quando non è sicuro, **non restituisce nulla** invece di restituire una cifra
sbagliata.

## Decisione

**Due motori complementari, locali, con responsabilità separate per campo.**

| Motore | Legge | Perché |
|---|---|---|
| **Decodifica Code 39** — ZXing WASM, con `BarcodeDetector` nativo usato opportunisticamente quando presente | **NRE** (segmento A da 5 e segmento B da 10), e i **riquadri** dei due codici | è il campo bloccante: va letto dal lettore che non sbaglia in silenzio |
| **OCR Tesseract.js**, lingua `ita`, asset in bundle | prestazione, classe di priorità, codice esenzione, area ASL | sono campi testuali, e un loro errore è recuperabile con una domanda ad Anna |

**Pipeline**: `preprocessa` (canvas: ridimensionamento a lato lungo ≤ 2000 px, scala di grigi,
aumento di contrasto) → `decodifica barcode` → `OCR` → **`estraiCampi`** (funzione pura:
parole + barcode → `LetturaRicetta`).

**Contratto — dichiarato, non descritto a parole** (completo in `architecture.md` §4.1–4.4):

| Voce | Valore |
|---|---|
| Timeout decodifica barcode | **3 000 ms** → degrada a "barcode non trovato", l'OCR continua |
| Timeout OCR | **15 000 ms** → restituisce le parole già riconosciute, mai un'eccezione |
| Timeout totale della lettura | **20 000 ms** duro, con `AbortController` |
| Soglia "ci vuole più del solito" | **8 000 ms** → evento di avanzamento, copy già previsto in S-03 |
| Soglia di bassa confidenza | **0.85** (sotto → `daVerificare`), **0.60** (sotto → `nonLetto`) — dettaglio e motivazione in ADR-0005 |
| Confidenza del barcode | **binaria**: formato valido = 1.0, altrimenti il campo non esiste |
| Comportamento di degrado | fallimento parziale ⇒ `CampoLetto` con stato `nonLetto`, **non** un errore. L'errore si restituisce solo se non è stato possibile produrre alcuna lettura |
| Cancellazione | `AbortSignal` propagato ai worker, che vengono terminati quando Anna lascia S-03 |
| Precaricamento | `precarica()` invocata **all'ingresso in S-02**, mentre Anna legge le istruzioni: l'attesa del modello sparisce dal percorso critico |
| Limiti di ingresso | ≤ 12 MB, `image/jpeg|png|webp`; oltre → `IMMAGINE_TROPPO_GRANDE` con recupero `rifaiFoto` |

**Regola di composizione dell'NRE**: i due segmenti si compongono solo se il primo ha esattamente
5 caratteri e il secondo esattamente 10. Un solo barcode letto ⇒ l'altro segmento resta
`nonLetto` ⇒ S-05b chiede **solo quel segmento**, con il riquadro dell'altro già evidenziato
sulla foto.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Un modello di visione cloud (VLM) come unico lettore** | qualità nettamente superiore sul layout della ricetta. Escluso da ADR-0002: falsifica il copy di S-02, introduce una dipendenza di rete in una demo live e una chiave da custodire |
| **Solo OCR, niente barcode** | è la scelta ovvia, ed è quella che rischia di produrre un NRE sbagliato di una cifra senza che nessuno se ne accorga: il modo peggiore di fallire, perché sembra un successo |
| **Solo barcode, niente OCR** | l'NRE è risolto, ma la prestazione — cioè la frase che Anna deve riconoscere in S-04 — non è codificata in nessun codice a barre. Non è derivabile: dedurla sarebbe indovinare (G-03) |
| **Modello ONNX/transformers.js in-browser** | qualità potenzialmente migliore di Tesseract, peso e tempi di integrazione fuori dal budget di 10 ore-uomo |
| **Chiedere ad Anna di inquadrare solo il codice a barre** | sposterebbe su di lei un compito di precisione: è esattamente il carico che il prodotto esiste per togliere |

## Conseguenze

- **Positive** — il campo che blocca Anna è letto dal meccanismo più affidabile disponibile, e
  quando fallisce lo fa **rumorosamente** (nessun barcode) invece che silenziosamente (cifra
  sbagliata). L'OCR lavora solo dove il suo errore è recuperabile con una domanda chiusa.
  `estraiCampi` è puro: gli scenari di `fallback_foto.feature` e `conferma_visita.feature` si
  testano senza browser e senza immagini, il che rende il BDD economico.
- **Negative** — due dipendenze invece di una, e circa 10 MB di asset OCR nel bundle: irrilevante
  in demo locale, un limite fuori demo, dichiarato in S-11. La resa dell'OCR su foto storte o
  scure resta modesta; è la ragione per cui US-03 esiste come percorso di prodotto.
  Le soglie sono calibrate su **una sola** fixture reale (ADR-0005 lo dichiara come limite).
- **Rischio residuo** — `BarcodeDetector` non è disponibile ovunque (in particolare su Safari/iOS):
  per questo ZXing WASM è il percorso principale e il nativo solo un'ottimizzazione.
- **Timebox** — 45 minuti sul tuning dell'OCR. Superati, si accetta una resa inferiore: il
  fallback guidato porta comunque Anna in fondo (ADR-0004).

## Stato

**Accettato** — 2026-09-14. Chiude D-03 (provider) insieme ad ADR-0004 (piano B).
