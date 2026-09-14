---
name: generate-presentation
description: Legge i deliverable del progetto corrente e genera una presentazione HTML in stile Accenture (palette ufficiale, logo, chevron) salvata in presentation/index.html. Non richiede argomenti; funziona con qualsiasi stato della pipeline.
---

# generate-presentation

Genera una presentazione HTML self-contained a partire dai documenti presenti nel
repository, applicando il design system Accenture (palette, logo, chevron "›").

L'output è **sempre** `presentation/index.html`. Se la cartella non esiste la crei.
Non aprire mai il browser; non avviare server. Salva il file e basta.

---

## 1 — Raccolta dei materiali

Leggi in ordine ciascun file se esiste, segnati i punti chiave:

| Priorità | File | Cosa cerchi |
|---|---|---|
| 1 | `agents/PIPELINE.md` | nome progetto, idea in una riga, agenti, flusso |
| 2 | `app/docs/PRD.md` | persona, barriera, user stories, criteri di accettazione |
| 3 | `app/docs/ux-spec.md` | flusso utente, sezioni UI, copy-chiave |
| 4 | `app/docs/wireframes.md` | struttura schermate |
| 5 | `app/docs/architecture.md` | stack, pattern architetturali |
| 6 | `app/docs/tasks.md` | milestone, ordine di esecuzione |
| 7 | `app/docs/adr/*.md` | decisioni strutturali rilevanti (max 3) |
| 8 | `app/docs/scenarios/*.feature` | scenari BDD (per la slide demo) |
| 9 | `intake/idea/*.pptx` o `*.md` | concept originale, titolo progetto |
| 10 | `CLAUDE.md` | tema, persona, guardrail (solo i campi "Tema scelto" e "Principi") |

Se un file manca, ignora quella voce senza segnalarlo all'utente.

---

## 2 — Piano diapositive

Determina quante slide servono sulla base dei materiali raccolti.
Usa queste sezioni come guida; ometti quelle senza contenuto sufficiente;
aggiungine di nuove se trovi materiale rilevante non contemplato qui.

| # | Tipo | Contenuto | Layout |
|---|---|---|---|
| 1 | Cover | Titolo progetto · Tag line · Contesto (hackathon / tema) | dark-gradient |
| 2 | Agenda | Elenco numerato delle sezioni della presentazione | dark |
| 3 | Problema & Persona | Chi è la persona, barriera precisa, percorso "prima" | light |
| 4 | Soluzione | Proposta di valore, flusso macro (foto→AI→guida→conferma) | purple |
| 5 | Demo / Percorso guidato | Screenshot o wireframe testuale, passi numerati | light |
| 6 | Architettura tecnica | Stack, componenti chiave, pipeline agentica | dark |
| 7 | Pipeline agentica | Agenti, gate, BDD — perché è rilevante per il valutatore | purple |
| 8 | Autonomia & Limiti | Cosa guadagna l'utente · Guardrail · Cosa resta fuori | light |
| 9 | Closing | Prossimi passi o call-to-action · Credits · Logo | dark-gradient |

---

## 3 — Palette e brand Accenture

### Colori ufficiali

```
--acn-purple:       #A100FF   /* viola primario */
--acn-purple-mid:   #7500C0   /* viola medio */
--acn-purple-dark:  #460073   /* viola scuro */
--acn-ink:          #0A0014   /* quasi-nero, sfondo deep */
--acn-rose:         #FF50A0   /* accento rosa */
--acn-cyan:         #05F2DB   /* accento teal/cyan */
--acn-blue:         #224BFF   /* accento blu */
--acn-lavender:     #C2A3FF   /* viola chiaro, testi su scuro */
--acn-lilac:        #E6DCFF   /* lilla, sfondi chiari */
--acn-white:        #FFFFFF
--acn-black:        #000000
```

### Sfondi per tipo di slide

| Tipo layout | Background | Colore testo principale |
|---|---|---|
| `dark-gradient` | `linear-gradient(135deg, #0A0014 0%, #460073 50%, #7500C0 100%)` | `#FFFFFF` |
| `dark` | `#0A0014` | `#FFFFFF` |
| `purple` | `#A100FF` | `#FFFFFF` |
| `light` | `#FFFFFF` | `#0A0014` |

### Logo Accenture (SVG inline, sempre nell'angolo in basso a destra)

```svg
<svg class="acn-logo" viewBox="0 0 163.2 43" xmlns="http://www.w3.org/2000/svg">
  <path d="M95.1 12 104.5 8.5 95.1 4.9 95.1 0 111.2 6.5 111.2 10.5 95.1 17Z" fill="#A100FF"/>
  <path d="M6.2 43C2.8 43 0 41.3 0 37.5L0 37.3C0 32.7 4 31.1 8.9 31.1L11.2 31.1 11.2 30.2C11.2 28.3 10.4 27.2 8.4 27.2 6.6 27.2 5.7 28.2 5.6 29.6L0.6 29.6C1 25.4 4.3 23.4 8.7 23.4 13.2 23.4 16.5 25.3 16.5 30L16.5 42.6 11.4 42.6 11.4 40.4C10.4 41.8 8.7 43 6.2 43ZM11.2 36.4 11.2 34.6 9.1 34.6C6.5 34.6 5.2 35.3 5.2 37L5.2 37.2C5.2 38.5 6 39.4 7.8 39.4 9.6 39.3 11.2 38.3 11.2 36.4ZM28.4 43C23.2 43 19.4 39.8 19.4 33.4L19.4 33.1C19.4 26.7 23.4 23.3 28.4 23.3 32.7 23.3 36.2 25.5 36.6 30.4L31.6 30.4C31.3 28.6 30.3 27.4 28.5 27.4 26.3 27.4 24.7 29.2 24.7 32.9L24.7 33.5C24.7 37.3 26.1 39 28.5 39 30.3 39 31.6 37.7 31.9 35.6L36.7 35.6C36.4 40 33.5 43 28.4 43ZM48 43C42.8 43 39 39.8 39 33.4L39 33.1C39 26.7 43 23.3 48 23.3 52.3 23.3 55.8 25.5 56.2 30.4L51.2 30.4C50.9 28.6 49.9 27.4 48.1 27.4 45.9 27.4 44.3 29.2 44.3 32.9L44.3 33.5C44.3 37.3 45.7 39 48.1 39 49.9 39 51.2 37.7 51.5 35.6L56.3 35.6C56 40 53.1 43 48 43ZM67.7 43C62.3 43 58.6 39.8 58.6 33.5L58.6 33.1C58.6 26.8 62.5 23.3 67.6 23.3 72.3 23.3 76.2 25.9 76.2 32.2L76.2 34.5 63.9 34.5C64.1 37.9 65.6 39.2 67.8 39.2 69.8 39.2 70.9 38.1 71.3 36.8L76.2 36.8C75.6 40.3 72.6 43 67.7 43ZM64 31 71 31C70.9 28.2 69.6 27 67.5 27 65.9 27.1 64.4 28 64 31ZM79.4 23.8 84.7 23.8 84.7 26.6C85.6 24.8 87.5 23.4 90.4 23.4 93.8 23.4 96.1 25.5 96.1 30L96.1 42.6 90.8 42.6 90.8 30.8C90.8 28.6 89.9 27.6 88 27.6 86.2 27.6 84.7 28.7 84.7 31.1L84.7 42.6 79.4 42.6 79.4 23.8ZM105.8 18.1 105.8 23.8 109.4 23.8 109.4 27.7 105.8 27.7 105.8 36.6C105.8 38 106.4 38.7 107.7 38.7 108.5 38.7 109 38.6 109.5 38.4L109.5 42.5C108.9 42.7 107.8 42.9 106.5 42.9 102.4 42.9 100.5 41 100.5 37.2L100.5 27.7 98.3 27.7 98.3 23.8 100.5 23.8 100.5 20.3 105.8 18.1ZM129.2 42.6 124 42.6 124 39.8C123.1 41.6 121.3 43 118.5 43 115.1 43 112.6 40.9 112.6 36.5L112.6 23.8 117.9 23.8 117.9 35.8C117.9 38 118.8 39 120.6 39 122.4 39 123.9 37.8 123.9 35.5L123.9 23.8 129.2 23.8 129.2 42.6ZM133.1 23.8 138.4 23.8 138.4 27.3C139.5 24.8 141.3 23.6 144.1 23.6L144.1 28.8C140.5 28.8 138.4 29.9 138.4 33L138.4 42.7 133.1 42.7 133.1 23.8ZM154.8 43C149.4 43 145.7 39.8 145.7 33.5L145.7 33.1C145.7 26.8 149.6 23.3 154.7 23.3 159.4 23.3 163.3 25.9 163.3 32.2L163.3 34.5 151.1 34.5C151.3 37.9 152.8 39.2 155 39.2 157 39.2 158.1 38.1 158.5 36.8L163.4 36.8C162.6 40.3 159.7 43 154.8 43ZM151 31 158.1 31C158 28.2 156.7 27 154.6 27 153 27.1 151.5 28 151 31Z" fill="currentColor"/>
</svg>
```

Su slide `dark-gradient` e `dark`: `color: #FFFFFF` sul logo.
Su slide `purple`: `color: #FFFFFF`.
Su slide `light`: `color: #0A0014`.

### Chevron Accenture "›" (decorazione laterale sulle cover e section divider)

```svg
<svg class="acn-chevron" viewBox="0 0 328.04 360" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 360 328.04 226.999 328.04 133.001 0 0 0 93.9987 212.118 180 0 266.001Z" fill="currentColor" fill-opacity="0.12"/>
</svg>
```

Posiziona il chevron in `position: absolute; right: -60px; top: 50%; transform: translateY(-50%);`
con `width: 320px; height: auto; pointer-events: none; overflow: visible;`.

---

## 4 — Struttura HTML

Produce un **singolo file HTML** self-contained con questo scheletro:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[TITOLO PROGETTO] — Presentazione</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* Tutte le regole CSS inline — vedi sezione 5 */
  </style>
</head>
<body>
  <div class="deck">
    <!-- Ogni slide è un <section class="slide [layout]"> -->
  </div>
  <nav class="slide-nav">
    <button id="prev" aria-label="Diapositiva precedente">&#8592;</button>
    <span id="counter">1 / N</span>
    <button id="next" aria-label="Diapositiva successiva">&#8594;</button>
  </nav>
  <script>
    /* Navigazione — vedi sezione 6 */
  </script>
</body>
</html>
```

---

## 5 — CSS da includere nel `<style>`

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --acn-purple:      #A100FF;
  --acn-purple-mid:  #7500C0;
  --acn-purple-dark: #460073;
  --acn-ink:         #0A0014;
  --acn-rose:        #FF50A0;
  --acn-cyan:        #05F2DB;
  --acn-blue:        #224BFF;
  --acn-lavender:    #C2A3FF;
  --acn-lilac:       #E6DCFF;
  --font: 'Inter', system-ui, sans-serif;
}

body { font-family: var(--font); background: #111; overflow: hidden; }

/* ── Deck ── */
.deck { width: 100vw; height: 100vh; position: relative; }

/* ── Slide base ── */
.slide {
  position: absolute; inset: 0;
  display: none;
  flex-direction: column;
  justify-content: center;
  padding: 6% 8%;
  overflow: hidden;
}
.slide.active { display: flex; }

/* ── Layouts ── */
.slide.dark-gradient {
  background: linear-gradient(135deg, #0A0014 0%, #460073 55%, #7500C0 100%);
  color: #fff;
}
.slide.dark {
  background: #0A0014;
  color: #fff;
}
.slide.purple {
  background: var(--acn-purple);
  color: #fff;
}
.slide.light {
  background: #fff;
  color: var(--acn-ink);
}

/* ── Tipografia ── */
.slide-eyebrow {
  font-size: clamp(0.65rem, 1vw, 0.85rem);
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 1.2rem;
}
.slide-title {
  font-size: clamp(2rem, 5vw, 3.8rem);
  font-weight: 800;
  line-height: 1.05;
  margin-bottom: 1.4rem;
  max-width: 70%;
}
.slide-subtitle {
  font-size: clamp(0.95rem, 1.8vw, 1.25rem);
  font-weight: 300;
  line-height: 1.6;
  max-width: 60%;
  opacity: 0.9;
}
.slide-body {
  font-size: clamp(0.85rem, 1.5vw, 1.1rem);
  line-height: 1.7;
  max-width: 80%;
}

/* Su slide dark/gradient i link sono in lavender; su light sono in purple */
.dark .slide-title, .dark-gradient .slide-title { color: #fff; }
.purple .slide-title { color: #fff; }
.light .slide-title { color: var(--acn-ink); }

/* ── Accent bar ── (solo la riga colorata sopra il titolo, non sotto) */
.accent-bar {
  width: 48px; height: 4px;
  background: var(--acn-rose);
  border-radius: 2px;
  margin-bottom: 1.6rem;
}
.purple .accent-bar, .dark-gradient .accent-bar { background: var(--acn-cyan); }
.dark .accent-bar { background: var(--acn-purple); }

/* ── Cards / colonne ── */
.card-row {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}
.card {
  flex: 1 1 200px;
  background: rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 1.4rem 1.6rem;
}
.light .card {
  background: var(--acn-lilac);
  color: var(--acn-ink);
}
.card-number {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--acn-rose);
  margin-bottom: 0.4rem;
}
.purple .card-number, .dark-gradient .card-number { color: var(--acn-cyan); }
.dark .card-number { color: var(--acn-lavender); }
.light .card-number { color: var(--acn-purple); }
.card-label {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}
.card-text { font-size: 0.9rem; line-height: 1.5; opacity: 0.85; }

/* ── Liste ── */
.slide-list {
  list-style: none;
  margin-top: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 75%;
}
.slide-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  font-size: clamp(0.85rem, 1.4vw, 1rem);
  line-height: 1.5;
}
.slide-list li::before {
  content: '›';
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--acn-rose);
  flex-shrink: 0;
  line-height: 1.3;
}
.dark .slide-list li::before,
.dark-gradient .slide-list li::before { color: var(--acn-cyan); }
.purple .slide-list li::before { color: var(--acn-cyan); }
.light .slide-list li::before { color: var(--acn-purple); }

/* ── Agenda numerata ── */
.agenda-list {
  list-style: none;
  margin-top: 1.8rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 3rem;
  max-width: 80%;
}
.agenda-list li {
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  display: flex;
  align-items: center;
  gap: 1rem;
}
.agenda-list .num {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--acn-rose);
  min-width: 2rem;
  text-align: right;
}
.dark .agenda-list .num,
.dark-gradient .agenda-list .num { color: var(--acn-lavender); }

/* ── Tag pill ── */
.tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  background: rgba(255,255,255,0.15);
  color: inherit;
  margin-bottom: 1rem;
}
.light .tag {
  background: var(--acn-lilac);
  color: var(--acn-purple-dark);
}

/* ── Two-col layout helper ── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
  margin-top: 2rem;
}

/* ── Logo ── */
.acn-logo {
  position: absolute;
  bottom: 2.5rem;
  right: 3rem;
  width: 110px;
  height: auto;
}
.dark .acn-logo,
.dark-gradient .acn-logo,
.purple .acn-logo { color: #fff; }
.light .acn-logo { color: var(--acn-ink); }

/* ── Chevron ── */
.acn-chevron {
  position: absolute;
  right: -80px;
  top: 50%;
  transform: translateY(-50%);
  width: 340px;
  height: auto;
  pointer-events: none;
}
.dark-gradient .acn-chevron { color: #fff; }
.purple .acn-chevron { color: #fff; }
.dark .acn-chevron { color: var(--acn-purple); }
.light .acn-chevron { display: none; }

/* ── Highlight quote ── */
.quote-block {
  border-left: 4px solid var(--acn-rose);
  padding-left: 1.5rem;
  margin: 2rem 0;
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-style: italic;
  line-height: 1.5;
  opacity: 0.9;
  max-width: 65%;
}
.dark .quote-block,
.dark-gradient .quote-block { border-color: var(--acn-cyan); }
.purple .quote-block { border-color: var(--acn-cyan); }
.light .quote-block { border-color: var(--acn-purple); }

/* ── Pipeline / flow chips ── */
.pipeline-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}
.pipe-chip {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.pipe-chip.active { background: var(--acn-rose); border-color: var(--acn-rose); }
.light .pipe-chip { background: var(--acn-lilac); border-color: var(--acn-lavender); color: var(--acn-ink); }
.pipe-arrow { font-size: 1rem; opacity: 0.5; }

/* ── Nav ── */
.slide-nav {
  position: fixed;
  bottom: 1.4rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1.2rem;
  background: rgba(10,0,20,0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 99px;
  padding: 0.45rem 1.2rem;
  z-index: 100;
}
.slide-nav button {
  background: none; border: none; cursor: pointer;
  color: #fff; font-size: 1.1rem; line-height: 1;
  padding: 0.2rem 0.5rem;
  border-radius: 50%;
  transition: background 0.15s;
}
.slide-nav button:hover { background: rgba(255,255,255,0.15); }
#counter { color: rgba(255,255,255,0.65); font-size: 0.78rem; letter-spacing: 0.05em; min-width: 4rem; text-align: center; font-family: var(--font); }

/* ── Keyboard hint ── */
.key-hint {
  position: fixed; bottom: 1.4rem; right: 2rem;
  color: rgba(255,255,255,0.25); font-size: 0.68rem; font-family: var(--font);
}

/* ── Guardrail badge ── */
.guardrail-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: 0.72rem; font-weight: 600;
  background: rgba(255,80,160,0.15);
  color: var(--acn-rose);
  border: 1px solid rgba(255,80,160,0.35);
  border-radius: 6px;
  padding: 0.25rem 0.7rem;
  margin-top: 0.5rem;
  letter-spacing: 0.06em;
}
.dark .guardrail-badge,
.dark-gradient .guardrail-badge { background: rgba(255,80,160,0.2); }
.light .guardrail-badge { background: #fff0f6; color: #b5006a; border-color: #ffb3d5; }
```

---

## 6 — Script di navigazione

```js
(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.getElementById('counter');
  let cur = 0;

  function show(n) {
    slides[cur].classList.remove('active');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('active');
    counter.textContent = (cur + 1) + ' / ' + slides.length;
  }

  document.getElementById('prev').addEventListener('click', () => show(cur - 1));
  document.getElementById('next').addEventListener('click', () => show(cur + 1));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') show(cur + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') show(cur - 1);
  });

  show(0);
})();
```

---

## 7 — Regole redazionali

- **Sintesi prima di tutto.** Ogni slide ha un titolo (max ~6 parole), un sottotitolo
  facoltativo e al massimo 4-5 elementi di contenuto (bullet, card, colonna).
  Se il materiale è denso, aprilo su più slide piuttosto che affollarne una.
- **Zero placeholder.** Se un campo non ha materiale, sopprimilo.
  Mai "Lorem ipsum", mai "[inserire testo]".
- **Lingua italiana** per tutto il testo visibile, tono professionale e diretto.
- **Non citare file interni** (`PRD.md`, `ux-spec.md` …) nelle slide: il valutatore
  vede i concetti, non la struttura del repo.
- **No `.accenture.com` o link interni** nel body delle slide.
- Il chevron compare su `dark-gradient`, `dark` e `purple`; è sempre un SVG inline
  (non un'immagine esterna).
- Il logo Accenture compare su **ogni** slide, in basso a destra.
- **Usa `overflow: hidden` sul `.slide`** per evitare che il chevron grande crei scrollbar.
- Slide di apertura e chiusura usano sempre il layout `dark-gradient`.

---

## 8 — Salvataggio e conferma

1. Crea `presentation/` se non esiste.
2. Scrivi `presentation/index.html` con il file completo.
3. Rispondi all'utente con:
   - Numero di slide generate.
   - Breve elenco delle sezioni incluse.
   - Il percorso `presentation/index.html` come link cliccabile.
   - Nota se mancava qualche documento sorgente chiave.
4. Non aprire browser, non avviare server.
