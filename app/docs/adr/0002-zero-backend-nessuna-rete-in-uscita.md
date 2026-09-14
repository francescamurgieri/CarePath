# ADR-0002 — Zero backend: nessuna rete in uscita, nessuna persistenza del documento sorgente

**Fase 3 · ARCH** · criteri: *determina trattamento e persistenza di dati sensibili secondo i guardrail di `_case.md`*

## Contesto

Il documento sorgente è la **fotografia di una ricetta elettronica**: contiene un identificativo
sanitario (NRE), la prestazione prescritta, un eventuale codice di esenzione e il codice fiscale
della persona. È il dato più sensibile che CarePath tocca.

Tre vincoli convergono:

- **AC-01.5** — "l'immagine caricata non lascia il dispositivo verso servizi non dichiarati:
  le destinazioni dei dati sono elencate in chiaro nella schermata di caricamento".
- **`ux-spec.md` S-02** ha già scritto il copy che Anna legge: *"La foto viene analizzata solo
  per leggere i codici della visita. Non viene salvata né inviata ad altri servizi."*
- **G-02** — nessun dato sanitario reale nei mock e nei test.

Il copy di S-02 è un impegno preso con Anna. Un'architettura che invii l'immagine a un provider
cloud lo renderebbe falso, oppure costringerebbe a riscriverlo in una forma che nessuna persona
di 74 anni leggerebbe con serenità. C'è anche un vincolo di consegna: una demo live da 3 minuti
non può dipendere da una connessione e da un servizio di terzi.

## Decisione

**CarePath è un sito statico che non apre alcuna connessione di rete dopo il caricamento della
pagina, e non persiste nulla.**

1. **Nessun backend, nemmeno un proxy.** Niente API key da custodire, niente server da far cadere
   in demo.
2. **Tutti gli asset sono serviti dall'origine**, compresi worker e modello OCR (`public/ocr/`).
   Nessun CDN, nessun font remoto, nessuna mappa, nessun analytics.
3. **Content Security Policy** dichiarata come meta tag in `index.html`:
   ```
   default-src 'self'; connect-src 'self'; img-src 'self' blob: data:;
   worker-src 'self' blob:; script-src 'self' 'wasm-unsafe-eval';
   style-src 'self' 'unsafe-inline'; font-src 'self'; form-action 'none';
   ```
4. **Nessuna persistenza**: né `localStorage`, né `sessionStorage`, né `IndexedDB`, né Cache API
   per la foto o per i dati letti. Lo stato di sessione vive in memoria e muore con il reload.
   L'`ObjectURL` dell'anteprima viene revocato all'uscita dalla sessione.
5. **L'unica materializzazione è volontaria**: `window.print()` su S-09, azionato da Anna (AC-06.2).
6. **Verifica automatica**: un test di build fallisce se il bundle contiene un URL assoluto verso
   un host esterno. AC-01.5 diventa un'asserzione, non una dichiarazione.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Proxy backend verso un provider AI di visione** (Node/serverless che custodisce la chiave) | è l'opzione di qualità di lettura più alta. Scartata su tre fronti: rende falso il copy già scritto per Anna; introduce un servizio da tenere vivo durante una demo live; costa un'ora di setup su dieci disponibili, e la spende su un pezzo che nessuno vedrà |
| **Chiamata diretta a un provider AI dal browser** | richiederebbe una chiave nel client: inaccettabile a prescindere dal budget |
| **Rete solo per gli asset (CDN), elaborazione locale** | l'immagine resterebbe locale, ma la demo tornerebbe a dipendere dalla connessione e la CSP non sarebbe più una garanzia netta. Il guadagno (qualche MB di bundle) non vale la perdita |
| **Persistere la sessione in `sessionStorage` per sopravvivere al reload** | migliorerebbe la robustezza, ma scriverebbe dati sanitari sul dispositivo. Fra due mali si è scelto quello reversibile: rifare la foto |

## Conseguenze

- **Positive** — AC-01.5, G-02 e la parte "trattamento dati" di G-04 sono soddisfatte per
  costruzione. La demo funziona con il Wi-Fi staccato: è la metà della risposta a D-03
  (vedi ADR-0004). La superficie di sicurezza si riduce al browser di Anna.
- **Negative** — la qualità della lettura è quella ottenibile in locale: inferiore a un modello
  di visione cloud. È il costo dichiarato, mitigato da ADR-0003 (il campo bloccante è letto dal
  codice a barre, non dall'OCR) e da US-03 (il fallback guidato è un percorso di prodotto).
  Un reload riporta a S-01: accettato.
- **Vincolo permanente** — introdurre in futuro un provider cloud di lettura **non è un cambio di
  implementazione ma una breaking change di prodotto**: cambia il copy di S-02, cambia AC-01.5,
  richiede un nuovo ADR che superi questo.

## Stato

**Accettato** — 2026-09-14. Supera qualunque decisione futura che reintroduca traffico in uscita
senza un ADR esplicito.
