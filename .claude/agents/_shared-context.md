# Contesto condiviso — NON è un agente

Frammento incluso per riferimento in tutti gli agenti della pipeline.
Questo file descrive **il metodo della pipeline**: è invariante e non dipende dal caso
d'uso. Il caso concreto su cui si sta lavorando (persona, dominio, servizio target,
guardrail, budget) sta in `_case.md`.

Ogni agente deve considerare vincolanti entrambi i file.

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

## Livello di astrazione dei ruoli

Un agente descrive un **mestiere**, non un prodotto. Nel definire o modificare un
agente, il caso d'uso non va mai scritto dentro il ruolo: si referenzia `_case.md`.
Un ruolo che sa già la risposta non progetta, trascrive.

## Deliverable

I documenti di prodotto vivono in **`app/docs/`**, gli ADR in **`app/docs/adr/`**.
Il file **`agents/PIPELINE.md`** descrive la pipeline e va tenuto aggiornato:
è il documento che rende la catena leggibile a un valutatore umano.
