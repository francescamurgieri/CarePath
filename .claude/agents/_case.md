# Il caso concreto — NON è un agente

Frammento incluso per riferimento in tutti gli agenti della pipeline.
Questo file descrive **il caso d'uso su cui la pipeline sta lavorando adesso**: cambia
a ogni nuovo prodotto. Il metodo della pipeline sta invece in `_shared-context.md` e
non cambia.

Ogni volta che un agente legge nel proprio ruolo "la persona", "il documento sorgente",
"il servizio target", "i guardrail di dominio" o "il budget di consegna", deve
istanziarli leggendo questo file. Mai assumerli.

## Prodotto

**CarePath** — accessibility layer sopra i sistemi di prenotazione sanitaria (CUP).
Foto della ricetta → l'AI interpreta → percorso guidato → conferma chiara.

- **La persona**: **Anna, 74 anni**, deve prenotare una visita prescritta.
- **La barriera**: oggi si blocca su NRE, branca specialistica, classe di priorità,
  struttura erogatrice.
- **Il servizio target**: il portale CUP (reale o realisticamente simulato).
- **Il documento sorgente**: la ricetta elettronica, fotografata su carta.
- **Input di partenza**: `intake/` (concept, slide, regole). È materiale **read-only**.

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

## Guardrail di dominio — non negoziabili

- **No diagnosi. No triage clinico. No consigli medici.** CarePath fa solo navigazione
  del servizio e prenotazione. Se un contenuto sconfina nel clinico, si cita testualmente
  il documento sorgente senza interpretarlo.
- Nessun dato sanitario reale nei mock o nei test.
- Non alterare il significato di ciò che c'è scritto sulla ricetta.

## Budget di consegna

**5 ore di sviluppo, 2 persone**, demo live da 3 minuti.
Ogni piano e ogni architettura devono stare in questo budget: ciò che non ci sta va
marcato esplicitamente sotto la linea del must-have.

## Stack indicato dal concept

Il concept indica **React + Bootstrap Italia**. È un'**ipotesi di partenza**, non un
vincolo: ogni scostamento è legittimo purché arbitrato con un ADR.
