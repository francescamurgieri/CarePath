# Pipeline agentica CarePath

Documento di riferimento della pipeline: agenti, workflow, gate e deliverable prodotti.
È il punto di ingresso per chi deve **valutare** o riprendere il lavoro.

Le definizioni eseguibili degli agenti stanno in `.claude/agents/` (subagenti Claude Code).
Il contesto condiviso e vincolante per tutti è `.claude/agents/_shared-context.md`.

## Idea in una riga

**CarePath** — accessibility layer per prenotare visite mediche senza perdersi nei form.
Foto della ricetta → l'AI interpreta → percorso guidato → conferma chiara.
Persona: **Anna, 74 anni**, si blocca su NRE, branca specialistica, priorità, struttura erogatrice.
Tema: **01 — Accessibilità Digitale**.

## Flusso

```
   intake/  (idea + slide + regole, read-only)
      │
      ▼
 ┌─────────┐        ┌─────────┐
 │ 1. REQ  │───────▶│  2. UX  │
 │  Opus   │        │ Sonnet  │
 └─────────┘        └────┬────┘
   PRD.md          ux-spec.md
                   wireframes.md
                   scenarios/*.feature
                        │
                        ▼
              ╔═══════════════════╗
              ║ GATE 1  · party   ║  persona, barriera, flussi, copy
              ╚═════════╤═════════╝
                        ▼
                  ┌─────────┐      ┌─────────┐
                  │ 3. ARCH │─────▶│ 4. PLAN │
                  │  Opus   │      │ Sonnet  │
                  └─────────┘      └────┬────┘
              architecture.md        tasks.md
              adr/*.md                  │
                                        ▼
                              ╔═══════════════════╗
                              ║ GATE 2  · party   ║  piano di esecuzione
                              ╚═════════╤═════════╝
                                        ▼
                                  ┌─────────┐
                                  │ 5. BUILD│   BDD: scenario → test → codice
                                  │ Sonnet  │
                                  └────┬────┘
                                   app/** + test
                                        │
                                        ▼
                              ╔═══════════════════╗
                              ║ GATE 3  · party   ║  build coerente col requisito
                              ╚═══════════════════╝
```

## Agenti

| # | Agente | File | Modello | Ruolo | Deliverable |
|---|--------|------|---------|-------|-------------|
| 1 | REQ   | `.claude/agents/req-analyst.md`     | Opus   | Intake / Analyst | `app/docs/PRD.md` |
| 2 | UX    | `.claude/agents/ux-designer.md`     | Sonnet | Design | `app/docs/ux-spec.md`, `wireframes.md`, `scenarios/*.feature` |
| 3 | ARCH  | `.claude/agents/architect.md`       | Opus   | Tecnico | `app/docs/architecture.md`, `app/docs/adr/*.md` |
| 4 | PLAN  | `.claude/agents/planner.md`         | Sonnet | PM / Sequencer | `app/docs/tasks.md` |
| 5 | BUILD | `.claude/agents/builder.md`         | Sonnet | Coder | `app/**` (codice + test BDD) |
| — | PARTY | `.claude/agents/party-moderator.md` | Opus   | Moderatore peer review | sintesi dei conflitti ai gate |
| — | ISSUE | `.claude/agents/issue-agent.md`     | Sonnet | QA / Maintainer | test di regressione, fix, PR (trigger manuale) |

Criterio del binding: **Opus** dove l'errore è strutturale e costoso da correggere a valle
(definizione del problema, scelte architetturali) e dove c'è interazione con l'utente;
**Sonnet** dove il lavoro è già vincolato da documenti a monte.

L'**ISSUE Agent** è fuori dal flusso ordinario: è attivato manualmente su una singola issue GitHub
e non partecipa ai gate. Chiude il loop issue → test → fix → PR; non fa merge.

## Doppia modalità

Ogni agente opera in due modalità, definite nel proprio file:

- **PRODUCE** — genera il deliverable, con **auto-critica avversariale** obbligatoria prima
  della consegna: si attacca il proprio output con la checklist del proprio dominio,
  si corregge il correggibile, si annota come *decisione aperta* solo ciò che va arbitrato.
- **REVIEW** — esamina il deliverable di un altro dalla propria lente professionale.
  Solleva rilievi (`BLOCCANTE` / `IMPORTANTE` / `MINORE`), non riscrive.

## Modalità party

Peer review fra gli **stessi specialisti** della pipeline, non una giuria esterna.
Si attiva **automaticamente ai tre gate** ed è invocabile a mano su un singolo deliverable.

Matrice delle lenti — cosa chiede ciascuno specialista sul deliverable sotto esame:

| Sotto esame | REQ | UX | ARCH | PLAN | BUILD |
|---|---|---|---|---|---|
| **PRD** | — | esprimibile in un flusso usabile? | fattibile? breaking changes? | sequenziabile? | implementabile? |
| **ux-spec** | copre i criteri di accettazione? | — | i componenti esistono in Bootstrap Italia? | quante dipendenze introduce? | i copy sono testabili in BDD? |
| **architecture** | regge i requisiti? | vincola il flusso? | — | ordinabile senza cicli? | contratti TS sufficienti? |
| **tasks** | traccia tutti i requisiti? | copre tutti gli schermi? | rispetta i contratti? | — | ogni task è atomico? |
| **app/** | soddisfa i criteri? | è l'interfaccia progettata? | rispetta l'architettura? | task tutti chiusi? | — |

Il moderatore scarta le convergenze (sono correzioni, tornano all'autore) e porta
all'utente **solo i conflitti reali**. Un gate senza decisioni è un esito legittimo.

## Gate

| Gate | Dopo | Cosa si approva | Party |
|------|------|-----------------|-------|
| **1** | REQ + UX | persona e barriera, flusso, copy, scenari BDD | sì |
| **2** | ARCH + PLAN | stack, ADR, contratti, sequenza di esecuzione | sì |
| **3** | BUILD | codice **con i test già inclusi**, coerenza col requisito | sì |

Ai gate il deliverable arriva **già revisionato**: all'utente si sollevano solo decisioni
critiche. Gli esiti dei gate vanno registrati qui sotto: sono la prova documentale di
**dove l'AI ha contribuito e dove è servita revisione umana**, che il tema richiede.

## BDD

Gli scenari Gherkin in italiano sono scritti da UX (fase 2) e servono tre scopi insieme:
sono i **test** di BUILD, la **specifica** del comportamento e lo **storyboard della demo**.
BUILD procede scenario → test → codice; i test sono parte della build, non un'attività finale.

## Skill di progetto

Artefatti agentici di supporto, in `.claude/skills/`. Non sono fasi della pipeline: sono
strumenti che gli agenti e gli umani usano trasversalmente per operare sul repository.

| Skill | File | Scopo |
|-------|------|-------|
| `commit` | `.claude/skills/commit/SKILL.md` | commit con messaggi strutturati, interpretabili a posteriori da un LLM: fase, deliverable, requisiti, gate, origine (agente o umano), decisioni |
| `sync`   | `.claude/skills/sync/SKILL.md`   | pull del branch con risoluzione dei conflitti su base **semantica**, stash automatico se il worktree è dirty, escalation all'utente sulle scelte ambigue |

Le due skill si tengono per mano: `sync` legge i campi dei messaggi prodotti da `commit`
(`Perche:`, `Deliverable:`, `Requisiti:`, `Gate:`, `Origine:`, `Decisioni:`) per capire
l'intento del lavoro parallelo invece di limitarsi al diff testuale. Il campo `Origine:`
alimenta inoltre la tracciabilità di **dove ha contribuito l'AI e dove è servita revisione
umana**, richiesta dal tema.

## Riferimenti obbligatori

Tutti gli agenti ancorano le proprie scelte a **developers.italia.it** e al design system .italia
(elenco completo in `.claude/agents/_shared-context.md`). Regola pratica: non si inventano
componenti UI che Bootstrap Italia già fornisce; le deroghe si motivano per iscritto.

## Registro dei gate

<!-- Compilato durante l'esecuzione: data, gate, rilievi portati all'utente, decisione presa. -->

| Data | Gate | Conflitto sollevato | Da chi | Decisione umana |
|------|------|---------------------|--------|-----------------|
| — | — | — | — | — |
