# Contesto condiviso — NON è un agente

Frammento incluso per riferimento in tutti gli agenti della pipeline CarePath.
Ogni agente deve considerare vincolanti le regole qui sotto.

## Prodotto

**CarePath** — accessibility layer sopra i sistemi di prenotazione sanitaria (CUP).
Foto della ricetta → l'AI interpreta → percorso guidato → conferma chiara.
Persona: **Anna, 74 anni**, deve prenotare una visita prescritta e oggi si blocca su
NRE, branca specialistica, classe di priorità, struttura erogatrice.
Input di partenza: `intake/` (concept, slide, regole). È materiale **read-only**.

## Tema: 01 — Accessibilità Digitale

- Il focus **non** è l'audit tecnico né la conformità formale: **è la persona**.
- Persona concreta e barriera precisa: chi è, cosa sta facendo, dove si blocca.
- Servizio digitale reale o realistico.
- Usabile **dalla persona stessa**, non da uno sviluppatore.
- **Semplificare senza tradire**: il significato delle informazioni originali non cambia mai.
- Va mostrato il percorso **prima / dopo**, e dichiarato dove l'AI ha contribuito
  e dove è servita revisione umana.

Da evitare: strumenti per sviluppatori invece che per la persona; checker di conformità che
producono solo report; soluzioni che diagnosticano senza aiutare; restyling che non danno
autonomia; profili utente generici; uso dell'AI non spiegabile.

## Guardrail non negoziabili

- **No diagnosi. No triage clinico. No consigli medici.** CarePath fa solo navigazione
  del servizio e prenotazione. Se un contenuto sconfina nel clinico, si cita testualmente
  la ricetta senza interpretarla.
- Nessun dato sanitario reale nei mock o nei test.
- Non alterare il significato di ciò che c'è scritto sulla ricetta.

## Riferimenti obbligatori — developers.italia.it

Ogni scelta di design, prototipazione e sviluppo va ancorata a queste fonti, citandole
esplicitamente nel proprio deliverable:

- Developers Italia — https://developers.italia.it/it
- Design system .italia — https://designers.italia.it/design-system/
- Accessibilità (fondamenti, approccio by-design) — https://designers.italia.it/design-system/fondamenti/accessibilita/
- Bootstrap Italia (framework front-end ufficiale) — https://developers.italia.it/it/software/c743b1f1-7d2e-4fac-a676-d6d27f2c892d.html
- Bootstrap Italia, per sviluppatori — https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
- Manuale operativo di design — https://docs.italia.it/italia/designers-italia/manuale-operativo-design-docs/it/versione-corrente/
- Linee guida di design per i servizi digitali della PA (AgID) — https://www.agid.gov.it/sites/default/files/repository_files/design-italia.pdf

Regola pratica: **non inventare componenti UI**. Se il design system .italia ha già il
componente o il pattern, si usa quello. Le deroghe vanno motivate per iscritto.

## Lingua

Tutto ciò che l'utente finale legge è **in italiano**, registro semplice, frasi brevi.
I documenti interni della pipeline sono in italiano.

## Doppia modalità

Ogni agente opera in una di due modalità:

- **PRODUCE** — genera il proprio deliverable. Include sempre un giro di **auto-critica
  avversariale** prima della consegna: l'agente attacca il proprio output con la checklist
  del proprio dominio, corregge quello che può correggere da solo, e annota come
  *decisione aperta* solo ciò che richiede un arbitrato.
- **REVIEW** (modalità party) — esamina il deliverable di un altro agente dalla propria
  lente professionale. Non riscrive: solleva rilievi. Ogni rilievo va classificato
  `BLOCCANTE` / `IMPORTANTE` / `MINORE` e deve citare un punto preciso del documento.

## Deliverable

I documenti di prodotto vivono in **`app/docs/`**, gli ADR in **`app/docs/adr/`**.
Il file **`agents/PIPELINE.md`** descrive la pipeline e va tenuto aggiornato:
è il documento che rende la catena leggibile a un valutatore umano.
