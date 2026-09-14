---
name: commit
description: Crea commit con messaggi strutturati e interpretabili a posteriori da un LLM, tracciando fase della pipeline, deliverable toccati e provenienza (agente o umano). Usala per ogni commit di questo repo invece di comporre il messaggio a mano.
---

# commit

Crea un commit il cui messaggio è **leggibile da una macchina e da un umano**, così che a
distanza di tempo un LLM possa ricostruire *cosa* è cambiato, *in quale fase* della pipeline
CarePath, *perché* e *chi* l'ha deciso.

Contesto della pipeline: `agents/PIPELINE.md`.

## Procedura

1. **Osserva prima di scrivere.** In una sola chiamata: `git status --short`,
   `git diff --stat`, `git diff` (e `git diff --cached` se c'è già roba in stage),
   `git log --oneline -10` per allinearsi allo stile esistente.
2. **Determina la fase.** Da quali file sono cambiati:
   `app/docs/PRD.md` → `req` · `ux-spec/wireframes/scenarios` → `ux` ·
   `architecture.md`, `adr/` → `arch` · `tasks.md` → `plan` · `app/**` (codice) → `build` ·
   `.claude/agents/**`, `agents/**` → `pipeline` · `presentation/**` → `presentation` ·
   altro → `chore`.
3. **Verifica l'atomicità.** Se il diff mescola fasi diverse o cambiamenti scorrelati,
   **proponi di spezzarlo in più commit** prima di procedere. Non accorpare per comodità.
4. **Stagea esplicitamente** i file pertinenti. Mai `git add -A` alla cieca: controlla che
   non entrino artefatti, file temporanei o dati sanitari di prova.
5. **Componi il messaggio** nel formato qui sotto e committa con una heredoc.
6. **Verifica l'esito** con `git status --short`. Se un hook ha modificato file, non
   riamendare in automatico: segnalalo.

## Formato del messaggio

```
<fase>(<ambito>): <cosa cambia, imperativo, minuscolo, max ~70 caratteri>

Perche: <la ragione del cambiamento, non la sua descrizione. 1-3 righe.>

Deliverable: <percorsi toccati, separati da virgola>
Requisiti: <ID coinvolti: US-xx, T-xx, ADR-xxxx | nessuno>
Gate: <gate-1 | gate-2 | gate-3 | nessuno>
Origine: <agente:nome | umano | agente:nome+revisione-umana>
Decisioni: <decisioni prese in questo commit, o: nessuna>

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

Regole sui campi:

- **`Perche:`** è il campo che rende il commit interpretabile dopo. Spiega la causa o il
  vincolo, non ripetere il titolo. "aggiornato PRD" è inutile; "il party al gate 1 ha
  rilevato che la barriera era generica" è utile.
- **`Origine:`** serve a rendere esplicito dove ha contribuito l'AI e dove è servita
  revisione umana — è un requisito del tema, non una formalità.
- **`Decisioni:`** compilalo quando il commit incorpora l'esito di un gate o di un ADR,
  citandone l'identificativo.
- Usa i campi anche quando la risposta è `nessuno`: la struttura costante è ciò che li rende
  parsabili.
- Niente accenti nei nomi dei campi (`Perche:`), per evitare problemi di encoding su Windows.

## Esempio

```
ux(scenari): riscrivi gli scenari di conferma dal punto di vista di Anna

Perche: il party al gate 1 ha rilevato che gli scenari usavano termini
amministrativi ("NRE", "branca") che la persona non riconosce, rendendoli
inutilizzabili sia come test sia come storyboard della demo.

Deliverable: app/docs/scenarios/conferma.feature, app/docs/ux-spec.md
Requisiti: US-03, US-04
Gate: gate-1
Origine: agente:ux-designer+revisione-umana
Decisioni: i termini amministrativi restano visibili ma sempre affiancati
dalla spiegazione "che significa?"

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## Limiti

- Non fare push: il commit è locale salvo richiesta esplicita.
- Non usare `--no-verify` né disattivare la firma. Se un hook fallisce, riporta l'errore
  e correggi la causa.
- Se sei sul branch di default e il cambiamento non è banale, proponi prima un branch.
