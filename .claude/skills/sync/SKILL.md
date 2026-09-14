---
name: sync
description: Sincronizza (pull) il branch corrente gestendo i conflitti in base al significato semantico del lavoro parallelo, non alle sole righe di testo. Fa stash automatico se il worktree è dirty e solleva all'utente le scelte ambigue. Usala al posto di git pull.
---

# sync

Allinea il branch corrente al remoto risolvendo i conflitti **ragionando su cosa i due lati
stavano cercando di ottenere**, non su quali righe si sovrappongono. In caso di dubbio
reale, la scelta va all'utente.

Contesto della pipeline: `agents/PIPELINE.md`.

## Procedura

### 1. Fotografa lo stato

In una sola chiamata: `git status --short`, `git branch --show-current`,
`git log --oneline -5`, `git stash list`.

### 2. Metti al sicuro il lavoro in corso

Se il worktree è **dirty**:

- `git stash push -u -m "sync-auto: <branch> <timestamp>"` — includi i file non tracciati.
- Annota l'identificativo dello stash e **dichiaralo all'utente**.
- Lo stash va ripristinato alla fine, sempre: anche se il pull fallisce, anche se
  l'utente interrompe. Se non riesci a ripristinarlo, dillo in modo esplicito indicando
  il nome dello stash — un lavoro lasciato in stash senza avviso è il fallimento peggiore
  di questa skill.

Se il worktree è pulito, salta questo passo e dichiaralo.

### 3. Capisci cosa sta arrivando, prima di integrarlo

- `git fetch`
- Se non c'è nulla da integrare, dillo in una riga, ripristina l'eventuale stash e fermati.
- `git log --oneline HEAD..@{u}` — i commit in arrivo
- `git log --oneline @{u}..HEAD` — i commit locali
- `git diff --stat HEAD...@{u}` — dove i due lati si toccano

Leggi i **messaggi di commit** dei due lati: questo repo usa la skill `commit`, quindi i
campi `Perche:`, `Deliverable:`, `Requisiti:`, `Gate:`, `Origine:` e `Decisioni:` ti dicono
l'intento del lavoro parallelo. Usali: sono la fonte primaria per capire la semantica,
molto più del diff.

### 4. Integra

Default: **`git pull --rebase`** — tiene lineare la storia e mantiene interpretabile
l'ordine delle fasi della pipeline. Usa un merge solo se l'utente lo chiede o se il branch
è condiviso e già pubblicato in una forma su cui altri hanno basato lavoro.

### 5. Conflitti: risolvi per significato

Per ogni file in conflitto, ricostruisci **cosa voleva ottenere ciascun lato** prima di
guardare le righe. Casi tipici in questo repo:

- **Stesso deliverable, fasi diverse** (es. uno tocca `ux-spec.md` per il copy, l'altro per
  l'accessibilità): quasi sempre **entrambi i contributi vanno tenuti**, integrati, non
  scelti. Un `--ours`/`--theirs` qui distrugge lavoro.
- **Documenti a monte vs codice a valle** (`architecture.md` contro `app/**`): il documento
  è la fonte di verità. Se il codice diverge, il conflitto sta segnalando che qualcuno ha
  aggirato un contratto — **sollevalo all'utente**, non sanarlo in silenzio.
- **Scenari BDD e criteri di accettazione** (`scenarios/*.feature`, `PRD.md`): mai fondere
  due versioni di un criterio in una terza che nessuno ha approvato. Se il significato
  cambia, è una decisione di prodotto: **chiedi**.
- **ADR**: due ADR con lo stesso numero sono un conflitto di *numerazione*, non di
  contenuto — rinumera e tieni entrambi.
- **`tasks.md`**: gli ID dei task sono riferimenti incrociati. Se rinumeri, aggiorna anche
  i riferimenti negli altri documenti, altrimenti rompi la tracciabilità.
- **File generati o di lock**: rigenerali, non fonderli a mano.

### 6. Quando sollevare all'utente

Fermati e chiedi, presentando le due posizioni e il costo di ciascuna, quando:

- i due lati hanno **intenzioni incompatibili** sullo stesso comportamento del prodotto;
- la risoluzione cambierebbe il **significato** di un requisito, di un criterio di
  accettazione o di un copy rivolto ad Anna;
- la risoluzione toccherebbe una decisione già arbitrata a un **gate** o in un **ADR**;
- un lato ha commit marcati `Origine: umano` che la tua risoluzione sovrascriverebbe;
- semplicemente **non capisci** perché un lato ha fatto quella modifica.

Nel dubbio, chiedi. Non risolvere per plausibilità: un conflitto risolto male è più caro
di una domanda in più.

### 7. Ripristina e verifica

- `git stash pop` se avevi fatto stash. Se il pop entra in conflitto a sua volta, gestiscilo
  con gli stessi criteri semantici e **non droppare mai lo stash** finché non è applicato.
- `git status --short` e `git log --oneline -5` per confermare l'esito.
- Riporta in chiaro: cosa è entrato, cosa è stato risolto e come, cosa è rimasto aperto.

## Limiti

- Non fare push automatico.
- Non usare `git reset --hard`, `git checkout --` o `git stash drop` per uscire da una
  situazione ingarbugliata: sono operazioni che distruggono lavoro. Fermati e chiedi.
- Non risolvere un conflitto prendendo un lato intero solo perché è più semplice.
