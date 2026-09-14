# ADR-0001 — Stack front-end: React + TypeScript + Vite, Bootstrap Italia via design-react-kit

**Fase 3 · ARCH** · criteri: *fissa framework front-end e design system*

## Contesto

`_case.md` indica **React + Bootstrap Italia** come ipotesi di partenza, non come vincolo.
AC-08.1 impone che l'interfaccia sia costruita con i componenti di Bootstrap Italia e che
ogni deroga sia motivata per iscritto. `ux-spec.md` §5 ha già verificato che tutti i
componenti richiesti (`Button`, `Card`, `Alert`, `Accordion`, `Input`, `Upload`, `Progress`,
`Table`, `Summary list`, `Hero`) esistono nel design system: non c'è nulla da inventare.

Il vincolo dominante è il budget: **10 ore-uomo**. Lo stack deve costare quasi zero in setup
e restituire subito il valore che serve a questa fase — i **contratti dei tipi** (§3 di
`architecture.md`) sono il deliverable che tiene insieme la pipeline, e senza un linguaggio
tipizzato non esistono.

Bootstrap Italia 2.x porta con sé un proprio JavaScript che manipola direttamente il DOM.
Montato su nodi controllati da React produce desincronizzazione dello stato e perdita di
focus: un problema di accessibilità, non solo di correttezza.

## Decisione

1. **React 18 + TypeScript in `strict` + Vite.**
2. **`design-react-kit`** (binding React ufficiale del design system .italia) come libreria di
   componenti; del pacchetto **`bootstrap-italia`** si importano **solo CSS e token**.
3. **Il JavaScript vanilla di Bootstrap Italia non viene mai inizializzato** su nodi React.
   Dove `design-react-kit` non copre un componente, si scrive markup con le classi del design
   system e stato React (per esempio Accordion come `<details>` controllato), motivando la
   deroga in linea nel file: è la "deroga scritta" richiesta da AC-08.1.
4. **Nessun router.** Il percorso è lineare e lo stato è uno solo (ADR-0006); la macchina a
   stati sincronizza `history.pushState` perché il tasto "indietro" del telefono funzioni.
5. **Timebox di 45 minuti** sull'integrazione di `design-react-kit`. Superato, si ripiega su
   markup Bootstrap Italia vanilla con le stesse classi CSS: aspetto e accessibilità restano,
   cambia solo l'ergonomia di scrittura.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **HTML + JS vanilla con Bootstrap Italia puro** | è la strada più veloce al primo schermo, ma il deliverable di questa fase sono i contratti dei tipi: senza TypeScript BUILD li può ignorare senza che nulla fallisca. Scartata per la ragione opposta alla velocità |
| **Next.js** | SSR e routing non servono (nessun backend, nessuna SEO, nessun dato remoto) e l'idratazione introduce una finestra in cui il DOM annunciato non è ancora interattivo: peggiora l'accessibilità che è il tema |
| **Svelte / Vue** | equivalenti sul piano tecnico, ma `design-react-kit` è il binding ufficiale del design system .italia: sceglierne un altro significherebbe riscrivere i componenti a mano, contro la regola "non si inventano componenti" |
| **Solo `bootstrap-italia` senza `design-react-kit`** | resta il ripiego dichiarato al punto 5; non è la prima scelta perché costringe a reimplementare a mano gli stati ARIA che il kit già gestisce |
| **Material UI / Bootstrap generico** | violerebbe AC-08.1 e le Linee guida AgID |

## Conseguenze

- **Positive** — i contratti del §3 sono verificati dal compilatore, non dalla buona volontà;
  Vite dà `dev` istantaneo e un build statico che si apre anche da file system (utile alla
  demo); i componenti accessibili arrivano già validati dal design system.
- **Negative** — `design-react-kit` porta peer dependency e un rischio di integrazione reale;
  è la ragione del timebox. Rinunciare al router significa che un link profondo a uno schermo
  non esiste: accettabile, il percorso è pensato per essere attraversato dall'inizio.
- **Vincolo su BUILD** — nessun `<h1>` fuori dal componente `<Schermo>`; nessuna chiamata a
  `new bootstrap.Accordion(...)` o equivalenti.

## Stato

**Accettato** — 2026-09-14. Da confermare al Gate 2.
