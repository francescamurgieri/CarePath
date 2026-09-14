# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Cos'è questo repo

Progetto per l'**Hagenthon** (hackathon Agentic Coding, Accenture Application Engineering).
Non è un normale repo applicativo: **l'oggetto della valutazione è la pipeline agentica** con cui il
software viene generato, non solo il software stesso. Il codice in `app/` è l'output della pipeline;
l'infrastruttura in `agents/` è il deliverable principale.

Vincoli di contesto: team da 2 persone, **5 ore di sviluppo**, demo live da 3 minuti.
Tutto l'output rivolto all'utente finale è **in italiano**.

## Struttura obbligatoria (valutazione automatica)

L'alberatura è imposta da `intake/hackaton-rules/repo-rules.txt` e **non va modificata**:

```
repo-root
├── agents/        PIPELINE.md: descrizione di agenti, workflow, gate e deliverable
├── .claude/agents/ definizioni eseguibili dei subagenti (fuori dall'alberatura valutata)
├── app/           deliverable software: codice, test e docs/ (PRD, ux-spec, architecture, adr, tasks)
├── presentation/  presentazione in HTML conforme alle guidelines Accenture
└── intake/        materiale sorgente (idea + regole) — read-only, è l'input della pipeline
```

## Tema scelto

Tema selezionato: **01 — Accessibilità Digitale** (`intake/hackaton-rules/hagenthon-temi-sfida-2.html`).
L'idea CarePath in `intake/idea/` è nativamente allineata: è un *accessibility layer* che affianca una
persona con una difficoltà precisa mentre usa un servizio digitale reale (il CUP), fino a farle
completare il task. Il focus del tema **non è l'audit tecnico né la conformità formale: è la persona**.

Vincoli del tema da rispettare in ogni fase:

- Partire da una **persona concreta** e da una **difficoltà precisa**: chi è, cosa sta cercando di fare,
  dove si blocca oggi. Nel concept: **Anna, 74 anni**, si blocca su NRE / branca / struttura erogatrice.
- Servizio o contenuto digitale **reale o realistico** (portale CUP, ricetta elettronica, modulo).
- La soluzione deve poter essere usata **dalla persona stessa**, non da uno sviluppatore.
- **Semplificare senza tradire**: il significato delle informazioni originali non deve cambiare.
- Mostrare in demo il percorso **prima / dopo**.
- Indicare **dove l'AI ha contribuito e dove è servita revisione umana**.
- Guardrail già nel concept, da mantenere: **no diagnosi, no triage clinico** — solo navigazione
  e prenotazione.

Da evitare esplicitamente: strumenti per sviluppatori invece che per la persona; checker di conformità
che producono solo report tecnici; soluzioni che si fermano alla diagnosi senza aiutare a superare il
problema; restyling grafici che non fanno guadagnare autonomia; profili utente generici
("un utente disabile" non è un profilo); uso dell'AI non spiegabile dal team.

Deliverable richiesti dal tema, da produrre lungo la pipeline:
1. **Persona & Barriera** — chi aiutate, quale barriera, in quale momento esatto del percorso si ferma.
2. **Percorso Assistito** — demo del percorso completo, dal blocco al task portato a termine.
3. **Autonomia & Limiti** — quanta autonomia guadagna la persona, cosa è stato semplificato senza
   alterarne il senso, quali limiti restano.

## Pipeline agentica

**`agents/PIPELINE.md` è il documento di riferimento**: agenti, workflow, gate, deliverable,
matrice delle lenti di review e registro dei gate. Leggilo prima di intervenire sulla pipeline
e tienilo aggiornato — è ciò che rende la catena leggibile a un valutatore umano.

Gli agenti sono **subagenti Claude Code** in `.claude/agents/`, con contesto condiviso e
vincolante diviso in due file: `_shared-context.md` (il **metodo**: doppia modalità,
classificazione dei rilievi, riferimenti italia, lingua — invariante) e `_case.md`
(il **caso**: persona, barriera, servizio target, guardrail di dominio, budget).

Gli agenti descrivono **mestieri, non prodotti**: dicono "la persona", "il documento
sorgente", "il servizio target", e li istanziano leggendo `_case.md`. Chi modifica un
agente non ci scrive dentro il caso d'uso.

| # | Agente | Modello | Deliverable |
|---|--------|---------|-------------|
| 1 | `req-analyst`     | Opus   | `app/docs/PRD.md` |
| 2 | `ux-designer`     | Sonnet | `app/docs/ux-spec.md`, `wireframes.md`, `scenarios/*.feature` |
| 3 | `architect`       | Opus   | `app/docs/architecture.md`, `app/docs/adr/*.md` |
| 4 | `planner`         | Sonnet | `app/docs/tasks.md` |
| 5 | `builder`         | Sonnet | `app/**` (codice + test BDD) |
| — | `party-moderator` | Opus   | sintesi dei conflitti ai gate |
| — | `issue-agent`     | Sonnet | loop issue → test → fix → PR (manutenzione, trigger manuale) |

Opus dove l'errore è strutturale e costoso a valle o c'è interazione umana; Sonnet dove il
lavoro è già vincolato dai documenti a monte.

### Principi

- **Doppia modalità** — ogni agente sa sia **PRODURRE** il proprio deliverable (con auto-critica
  avversariale obbligatoria prima della consegna) sia **REVIEW**are quello altrui dalla propria
  lente professionale, sollevando rilievi `BLOCCANTE` / `IMPORTANTE` / `MINORE`.
- **Modalità party** — peer review fra gli stessi specialisti della pipeline, non una giuria
  esterna. Obiettivo: **qualità del prodotto**, non punteggio dell'hackathon. Il moderatore
  scarta le convergenze e porta all'utente **solo i conflitti reali**.
- **Tre gate**, ciascuno con party automatico: (1) dopo REQ+UX, (2) dopo PLAN, (3) dopo BUILD.
  Al gate il deliverable arriva già revisionato: all'utente si sollevano **solo decisioni
  critiche**. Gli esiti vanno nel registro in fondo a `agents/PIPELINE.md`: sono la prova
  di dove è servita revisione umana.
- **BDD** — gli scenari Gherkin in italiano li scrive UX (fase 2) e servono da test, specifica
  e storyboard della demo. BUILD procede scenario → test → codice: **i test sono parte della
  build**, già presenti al Gate 3.
- **Decision record** — le scelte strutturali o rischiose (vision provider, fallback, booking,
  framework, dati) le arbitra l'ARCH agent con un ADR in `app/docs/adr/`, mai implicitamente
  nel codice.
- **Lettura immagini reale** — il sistema deve leggere immagini di ricette vere. Le ricette
  mock sono **fixture di test automation**, non un sostituto funzionale.

### Skill di progetto

- **`commit`** — usala per ogni commit invece di comporre il messaggio a mano: produce
  messaggi strutturati (fase, deliverable, requisiti, gate, origine, decisioni) che restano
  interpretabili da un LLM a distanza di tempo.
- **`sync`** — usala al posto di `git pull`: stash automatico se il worktree e' dirty,
  risoluzione dei conflitti sul significato del lavoro parallelo e non sulle sole righe,
  escalation all'utente quando la scelta cambia un requisito o tocca una decisione gia'
  arbitrata a un gate.

Esiste la skill `review-agentic-pipelines` per la review avversariale del design della pipeline
(aderenza, performance, economicità): usala per auto-valutarsi prima della demo.

## Riferimenti obbligatori — developers.italia.it

Ogni agente ancora le proprie scelte al design system pubblico italiano e le cita nel deliverable:

- Developers Italia — https://developers.italia.it/it
- Design system .italia — https://designers.italia.it/design-system/
- Accessibilità (by-design) — https://designers.italia.it/design-system/fondamenti/accessibilita/
- Bootstrap Italia — https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
- Manuale operativo di design — https://docs.italia.it/italia/designers-italia/manuale-operativo-design-docs/it/versione-corrente/
- Linee guida di design AgID (art. 53 CAD) — https://www.agid.gov.it/sites/default/files/repository_files/design-italia.pdf

Regola pratica: **non si inventano componenti UI** che Bootstrap Italia già fornisce; le
deroghe si motivano per iscritto.

## Note operative

- `intake/` è **input immutabile**: non riscrivere l'idea o le regole, referenziale.
- La presentazione in `presentation/` deve seguire la palette Accenture usata nel file dei temi:
  purple `#A100FF`, purple-light `#BE82FF`, purple-dark `#460073`, ink `#0A0014`, rose `#FF50A0`,
  sfondo `#050008`, font Inter.
- Il `.pptx` dell'idea si legge con `python-pptx`; su Windows serve `PYTHONIOENCODING=utf-8`
  per non far esplodere l'output sui caratteri accentati.
- La demo deve mostrare il contrasto **prima / dopo** sul percorso dell'utente, e dichiarare
  dove l'AI ha contribuito e dove è servita revisione umana.
