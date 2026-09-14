# ADR-0008 — Fedeltà della replica del servizio target: comportamentale alta, identitaria nulla

**Fase 3 · ARCH** · criteri: *decide come si integra il servizio target, reale o simulato*
**Chiude la decisione aperta D-04.**

## Contesto

D-04 chiede dove stia la linea: *"il contrasto prima/dopo è tanto più forte quanto più la replica
è fedele; loghi e nomi di enti reali sono esclusi (AC-RD1.2). Dove sta la linea?"*

La domanda nasconde un'ambiguità su cosa significhi "fedele". Ci sono due fedeltà diverse, e
confonderle è ciò che rende la decisione difficile:

- **fedeltà identitaria** — sembrare *quel* portale: logo, nome dell'ente, colori istituzionali,
  dominio, screenshot;
- **fedeltà comportamentale** — comportarsi come quel portale: chiedere le stesse cose, con le
  stesse etichette amministrative, con la stessa quantità di aiuto, e fallire allo stesso modo.

La barriera di Anna, come il PRD la descrive in §1, non è estetica. Anna non si blocca perché il
portale è brutto: si blocca perché le viene chiesto un numero di 15 caratteri che **sul suo
foglio non esiste con quel nome**, e perché l'errore che riceve non dice nulla. Tutto questo è
fedeltà comportamentale. Nulla di questo richiede un logo.

## Decisione

**Fedeltà comportamentale alta. Fedeltà identitaria nulla.** Regola operativa verificabile.

### Si replica (ed è il punto della demo)

| Elemento | Perché |
|---|---|
| La **struttura del modulo**: due campi obbligatori, NRE prima del codice fiscale | è la sequenza che produce il blocco |
| Le **etichette amministrative testuali**: *"Numero ricetta elettronica (NRE)"*, *"Codice fiscale"* | sono il linguaggio del servizio, ed è il linguaggio a bloccare |
| Il **testo di aiuto insufficiente**: *"15 caratteri, lo trovi sul promemoria della ricetta"* | è vero, ed è inutile: sul promemoria di Anna quel numero non è stampato così. È la barriera, alla lettera |
| Il **vincolo di validazione**: campo da 15 caratteri, unico | AC-RD1.1 |
| Il **messaggio d'errore opaco**: *"Codice non valido."*, senza indicare quale campo né cosa fare, senza alcuna azione successiva | è il momento in cui Anna chiude la pagina (PRD §2, passo 4). È l'unico messaggio opaco ammesso in tutta l'applicazione |
| La **densità visiva di default**: corpo a 16 px, campi stretti, testo di aiuto piccolo | il contrasto con CarePath (≥ 18 px, un'azione per schermo) è **misurabile**, non estetico |

### Non si replica (mai)

Loghi, stemmi, marchi · nomi di enti, aziende sanitarie, regioni o portali reali · domini e URL
reali · palette e caratteri istituzionali riconoscibili · screenshot o porzioni di interfacce
esistenti · qualunque dato reale.

### Identità della replica

- Titolo della pagina e intestazione: **"Portale di prenotazione — simulazione"**, senza
  riferimenti geografici.
- **Banner giallo non chiudibile in testa**, già previsto in `ux-spec.md` S-10: *"Questa è una
  simulazione del portale CUP. Non usa loghi o dati reali. Serve solo per mostrare la differenza
  con CarePath."* (AC-RD1.2).
- Numero di telefono, se presente, fittizio e riconoscibile (`800 000 000`).

### Vincoli tecnici

- S-10 usa **Bootstrap Italia** come tutto il resto. Non è una contraddizione: Bootstrap Italia
  è il design system della PA, e il punto della demo è proprio che **la barriera non è nel
  design system — è nel contenuto e nel carico cognitivo**. Con lo stesso kit di componenti si
  ottengono due esperienze opposte: è l'argomento più forte che la demo possa fare.
- S-10 è un **ramo isolato**: non condivide stato con la sessione (`architecture.md` §2), non
  legge la lettura della ricetta, non scrive metriche. Il suo unico effetto è mostrare l'errore.
- Il confronto di S-11 usa i valori "prima" del PRD §6, misurati su questa replica: la replica
  deve quindi restare **coerente con quei numeri** (≥ 2 campi di testo, ≥ 1 errore senza
  recupero, 5 termini senza spiegazione).

### Criterio di verifica, per non riaprire la discussione

> Una persona che guarda S-10 deve poter dire *"capisco perché Anna si è bloccata"* e
> **non** deve poter dire *"questo è il portale della Regione X"*.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Replica ad alta fedeltà identitaria con marchi oscurati** | il riconoscimento resterebbe, e con esso l'attribuzione implicita a un ente reale. Viola AC-RD1.2 e non aggiunge nulla alla dimostrazione della barriera |
| **Screenshot reale del portale con banner di avviso** | uso di materiale di terzi e attribuzione implicita; inoltre uno screenshot non è interattivo, quindi non può mostrare l'errore opaco che è il cuore di RD-01 |
| **Replica volutamente peggiorata** (interfaccia sgradevole, colori stridenti) | sarebbe un uomo di paglia: la barriera reale non è la bruttezza, e costruirla così indebolirebbe l'argomento invece di rafforzarlo |
| **Solo descrizione testuale del percorso "prima"** | AC-RD1.1 richiede uno schermo raggiungibile in un tocco; e una descrizione non fa provare l'errore a chi guarda |
| **Replicare tutti gli 11 passi del PRD §2** | fuori budget e inutile: i passi 1–4 contengono il blocco. AC-RD1.1 chiede esattamente quelli |

## Conseguenze

- **Positive** — D-04 è chiusa con un criterio applicabile da chiunque, non con un giudizio
  caso per caso. La demo guadagna l'argomento migliore: stesso design system, esito opposto.
  Nessun rischio di attribuzione a un ente reale.
- **Negative** — chi si aspetta una replica riconoscibile potrebbe trovare S-10 "generica".
  Si compensa con la precisione del contenuto: le etichette e il messaggio d'errore sono
  quelli veri, ed è lì che sta il riconoscimento.
- **Vincolo su BUILD** — nessuna risorsa grafica di terzi in `app/`; il messaggio
  *"Codice non valido."* è l'unico errore dell'applicazione privo di `AzioneDiRecupero`, e vive
  fuori dal tipo `ErroreCarePath` proprio perché S-10 è un ramo isolato.

## Stato

**Accettato** — 2026-09-14. Chiude D-04, che il PRD assegnava a un arbitrato umano al Gate 1:
la regola qui proposta va **ratificata** al Gate 2, non solo presa in carico.
