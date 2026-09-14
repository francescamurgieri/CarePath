# Wireframe — CarePath

**Fase 2 della pipeline · agente UX (Designer)**
Formato: ASCII testuale, dimensione di riferimento 375 px (iPhone SE / telefono medio).
Componenti: Bootstrap Italia v2. Riferimento: https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
Accessibilità: https://designers.italia.it/design-system/fondamenti/accessibilita/

Legenda:
```
[ ... ]  Pulsante (Button)
< ... >  Link testuale
[====]   Barra di avanzamento (Progress) o Spinner
[v]      Checkbox / Radio selezionato
[ ]      Checkbox / Radio non selezionato
--- ---  Separatore
▓▓▓▓▓   Area immagine / foto
[i]      Affordance "Che significa?" (espandibile, Accordion)
! !      Alert (informativo / errore / successo)
```

---

## S-01 — Benvenuto

**Componenti**: `Hero` (sfondo neutro), `Button` primario full-width, link testuale secondario.

```
┌──────────────────────────────────┐
│  CarePath                        │
│  ─────────────────────────────── │
│                                  │
│  ╔══════════════════════════════╗ │
│  ║  Prenota la tua visita       ║ │  ← <h1>
│  ║                              ║ │
│  ║  Fotografa il foglio che ti  ║ │
│  ║  ha dato il medico.          ║ │
│  ║  Pensiamo noi al resto.      ║ │
│  ╚══════════════════════════════╝ │
│                                  │
│  [  Fotografa la ricetta  ]      │  ← Button primario, full-width, 48px h
│                                  │
│  < Vedi come funzionava prima >  │  ← Link testuale (→ S-10)
│                                  │
└──────────────────────────────────┘
```

Regole:
- Un solo `<h1>`.
- Un solo pulsante principale (AC-08.5).
- Il link secondario è sotto il pulsante, non accanto, per non confondere su touch.
- Bootstrap Italia `Hero` gestisce il contrasto del testo sul background.

---

## S-02 — Fotografa la ricetta

**Componenti**: `Upload` (Allegati), `Card` istruzioni, `Alert` informativo (privacy), `Button`.

```
┌──────────────────────────────────┐
│  ← Torna all'inizio              │  ← Back link (AC-07.1)
│  ─────────────────────────────── │
│  Fotografa il foglio              │  ← <h1>
│  della ricetta                   │
│                                  │
│  ! INFO                          │
│  ! La foto viene analizzata      │  ← Alert informativo (Bootstrap Italia)
│  ! solo per leggere i codici.    │
│  ! Non viene salvata né          │
│  ! inviata ad altri servizi.     │
│  ! < Scopri di più >             │  ← Link dettaglio privacy (AC-01.5)
│                                  │
│  ┌──────────────────────────┐    │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │    │
│  │  ▓  [Immagine esempio  ▓  │    │  ← Illustrazione promemoria ricetta
│  │  ▓   foglio medico]    ▓  │    │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │    │
│  │  Inquadra tutto il       │    │
│  │  foglio. Luce buona,     │    │
│  │  testo leggibile.        │    │
│  └──────────────────────────┘    │
│                                  │
│  [    Scatta la foto     ]       │  ← Button primario (camera) 48px h
│                                  │
│  < Scegli dalla galleria >       │  ← Link fallback galleria
│                                  │
│  ▿ Che cos'è il codice NRE?      │  ← Accordion chiuso (Bootstrap Italia)
│                                  │
└──────────────────────────────────┘
```

Stato — file selezionato:
```
│  ┌──────────────────────────┐    │
│  │  ▓▓▓ [anteprima foto] ▓▓ │    │
│  └──────────────────────────┘    │
│  [    Usa questa foto    ]       │
│  < Cambia foto >                 │
```

Stato — caricamento:
```
│         [====  ====]             │  ← Spinner Bootstrap Italia
│    Sto leggendo la ricetta...    │  ← aria-live="polite"
```

---

## S-03 — Lettura in corso

**Componenti**: `Progress` circolare (Spinner).

```
┌──────────────────────────────────┐
│                                  │
│  Sto leggendo la ricetta...       │  ← <h1>, role="status"
│                                  │
│            ┌───┐                 │
│            │ ◌ │  ←── Spinner    │  ← aria-label="Elaborazione in corso"
│            └───┘                 │
│                                  │
│     Ci vuole qualche secondo.    │
│                                  │
└──────────────────────────────────┘
```

---

## S-04 — Conferma lettura ricetta (percorso nominale)

**Componenti**: `Card`, `Accordion` (testo originale + "Che significa?"), `Button` primario e
secondario outline, `Alert` giallo per bassa confidenza.

```
┌──────────────────────────────────┐
│  ← Torna alla fotografia         │
│  ─────────────────────────────── │
│  Ho trovato la tua visita         │  ← <h1>
│                                  │
│  ┌──────────────────────────┐    │
│  │  Stavo cercando questo?  │    │
│  │                          │    │
│  │  Visita ortopedica       │    │  ← Testo grande (≥24px)
│  │  di controllo            │    │
│  │                          │    │
│  │  Codice ricetta (NRE):   │    │
│  │  010A2 · 4518061015  [i] │    │  ← NRE in gruppi + "Che significa?"
│  └──────────────────────────┘    │
│                                  │
│  ▿ Vedi il testo originale       │  ← Accordion (aperto di default)
│  │ VISITA ORTOPEDICA DI          │
│  │ CONTROLLO — 89.01.G           │  ← Citazione alla lettera (G-03)
│  ▵                               │
│                                  │
│  ▿ Che significa...?             │  ← Accordion "Che significa?" (chiuso)
│                                  │
│  [     Sì, è questa     ]        │  ← Button primario 48px h
│  [   No, non è questa   ]        │  ← Button secondario outline 48px h
│                                  │
└──────────────────────────────────┘
```

Stato — bassa confidenza su un campo:
```
│  ! ATTENZIONE                    │
│  ! Non sono sicuro di questo     │  ← Alert (informativo)
│  ! numero. Guarda qui sulla      │
│  ! foto: vedi lo stesso numero?  │
│  │                               │
│  │  ▓▓▓[ritaglio foto]▓▓▓       │  ← Crop dell'area con il numero
│  │  Numero letto: 010A3          │
│  │                               │
│  │  [v] Sì, è giusto             │
│  │  [ ] No, è diverso            │
│                                  │
```

---

## S-04b — Conferma negativa / recupero

**Componenti**: `Alert` neutro, due `Button` equivalenti (nessun primario dominante).

```
┌──────────────────────────────────┐
│  ← Torna alla conferma           │
│  ─────────────────────────────── │
│  Ricontrolliamo insieme           │  ← <h1>
│                                  │
│  Potrebbe essere una foto poco   │
│  nitida, oppure una ricetta      │
│  diversa. Cosa vuole fare?       │
│                                  │
│  [    Fai un'altra foto    ]     │  ← Button (→ S-02)
│                                  │
│  [ Inserisci il codice con ]     │
│  [       la guida          ]     │  ← Button (→ S-05b)
│                                  │
└──────────────────────────────────┘
```

---

## S-05b — Guida alla lettura (fallback)

**Componenti**: Immagine annotata con overlay, due `Input` (etichettati), validazione inline
Bootstrap Italia (`is-valid` / `is-invalid`), `Button`.

```
┌──────────────────────────────────┐
│  ← Torna indietro                │
│  ─────────────────────────────── │
│  Aiutami a leggere il codice      │  ← <h1>
│                                  │
│  ┌──────────────────────────┐    │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │    │
│  │  ▓  [FOTO RICETTA]     ▓  │    │  ← Foto di Anna
│  │  ▓  ┌──────┐  ┌──────┐ ▓  │    │
│  │  ▓  │ COD1 │  │ COD2 │ ▓  │    │  ← Overlay SVG: aree evidenziate
│  │  ▓  └──────┘  └──────┘ ▓  │    │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │    │
│  └──────────────────────────┘    │
│                                  │
│  Copia il numero sotto il primo  │
│  codice a barre, poi quello      │
│  sotto il secondo.               │
│                                  │
│  Primo numero (5 cifre)          │  ← Label associata (for/id)
│  ┌────────────────────────┐      │
│  │  0 1 0 A 2             │  ✓  │  ← Input + is-valid + icona check
│  └────────────────────────┘      │
│  Perfetto, questo va bene.       │  ← Feedback positivo (aria-describedby)
│                                  │
│  Secondo numero (10 cifre)       │
│  ┌────────────────────────┐      │
│  │                        │      │  ← Input vuoto
│  └────────────────────────┘      │
│  (esempio: 4518061015)           │
│                                  │
│  [ Continua con questi numeri ]  │  ← Button primario (disabilitato fino
│                                  │    a validazione OK su entrambi i campi)
│  < Fai un'altra foto >           │  ← Link secondario (→ S-02, AC-03.4)
│                                  │
└──────────────────────────────────┘
```

Stato — errore campo:
```
│  Secondo numero (10 cifre)       │
│  ┌────────────────────────┐      │
│  │  45180610              │  ✗  │  ← is-invalid + icona errore
│  └────────────────────────┘      │
│  Questo numero deve avere        │
│  esattamente 10 caratteri.       │
│  Ne hai scritti 8: ne mancano 2. │  ← Messaggio specifico (AC-03.3)
```

---

## S-06 — Preferenza

**Componenti**: Titolo + sottotitolo, due `Card` selezionabili (radio card), `Button` primario.

```
┌──────────────────────────────────┐
│  ← Torna alla conferma visita    │
│  ─────────────────────────────── │
│  Cosa le interessa di più?        │  ← <h1>
│                                  │
│  Le mostreremo le migliori       │
│  opzioni in base alla sua        │
│  risposta.                       │
│                                  │
│  ┌──────────────────────────┐    │
│  │  [ ] Fare presto         │    │  ← Card A (radio button integrato)
│  │                          │    │
│  │  La prima data libera    │    │
│  │  disponibile             │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │  [ ] Stare vicino        │    │  ← Card B
│  │      a casa              │    │
│  │                          │    │
│  │  Una struttura nella     │    │
│  │  sua area                │    │
│  └──────────────────────────┘    │
│                                  │
│  ▿ Cos'è una struttura           │  ← Accordion "Che significa?"
│    erogatrice?                   │
│                                  │
│  [   Mostrami le proposte  ]     │  ← Button primario (attivo dopo scelta)
│                                  │
└──────────────────────────────────┘
```

Stato — card selezionata:
```
│  ┌══════════════════════════╗    │
│  ║  [v] Fare presto         ║    │  ← Bordo primario, radio checked
│  ║                          ║    │
│  ║  La prima data libera    ║    │
│  ║  disponibile             ║    │
│  ╚══════════════════════════╝    │
│                                  │
│  [   Mostrami le proposte  ]     │  ← Button primario abilitato
```

---

## S-07 — Proposte appuntamento

**Componenti**: `Card` selezionabili (2–3), badge testuale, `Button` primario e secondario.

```
┌──────────────────────────────────┐
│  ← Torna alla preferenza        │
│  ─────────────────────────────── │
│  Ecco le proposte per lei         │  ← <h1>
│                                  │
│  ┌──────────────────────────┐    │
│  │  [Prima data disponibile]│    │  ← Badge testuale (non solo colore)
│  │  [ ] Martedì 22 ottobre  │    │
│  │      ore 10:30           │    │
│  │  Poliambulatorio         │    │
│  │  San Luca                │    │
│  │  Via Roma 12, Torino     │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │  [Più vicino a casa]     │    │  ← Badge testuale
│  │  [ ] Giovedì 24 ottobre  │    │
│  │      ore 14:00           │    │
│  │  Poliambulatorio         │    │
│  │  Torino Nord             │    │
│  │  Via delle Rose 45,      │    │
│  │  Torino                  │    │
│  └──────────────────────────┘    │
│                                  │
│  [ Scelgo questo appuntamento ]  │  ← Button primario (attivo dopo scelta)
│                                  │
│  < Voglio vedere opzioni diverse>│  ← Link (→ S-06)
│                                  │
└──────────────────────────────────┘
```

Stato — nessuna disponibilità:
```
│  ! Nessun appuntamento trovato   │  ← Alert informativo
│  ! nei prossimi 30 giorni.       │
│  ! Per prenotare può chiamare:   │
│  ! CUP: 800 000 000              │
│  ! (numero gratuito)             │
```

---

## S-08 — Riepilogo e conferma

**Componenti**: `Summary list` (lista `<dl>`), `Alert` con codice prenotazione, `Button`
primario e secondario outline.

```
┌──────────────────────────────────┐
│  ← Torna a scegliere la data    │
│  ─────────────────────────────── │
│  Controlla e conferma             │  ← <h1>
│                                  │
│  Che visita è                    │  ← <dt>
│  Visita ortopedica di controllo  │  ← <dd>
│                                  │
│  Quando                          │
│  Martedì 22 ottobre 2024         │
│  ore 10:30                       │
│                                  │
│  Dove                            │
│  Poliambulatorio San Luca        │
│  Via Roma 12, Torino             │
│                                  │
│  Cosa portare                    │
│  Questo foglio della ricetta     │
│  e un documento d'identità       │
│                                  │
│  Quanto paga                     │
│  Non paga il ticket — ha         │
│  l'esenzione [codice esenzione]  │
│  [i] Che significa esenzione?    │
│                                  │
│  Come disdire                    │
│  Chiami il numero [XXX].         │
│  Le serve solo il codice qui:    │
│                                  │
│  ┌──────────────────────────┐    │
│  │ Codice: PRE·2024·1022·17 │    │  ← Alert info, codice in gruppi
│  │ (serve solo per disdire) │    │
│  └──────────────────────────┘    │
│                                  │
│  [ Confermo l'appuntamento ]     │  ← Button primario 48px h
│  [ Torna a scegliere la data]    │  ← Button secondario outline
│                                  │
└──────────────────────────────────┘
```

---

## S-09 — Prenotazione confermata

**Componenti**: `Alert` success, `Summary list` (replica S-08), `Button` salva/stampa, link.

```
┌──────────────────────────────────┐
│  ✓ Prenotazione confermata!       │  ← Alert success (Bootstrap Italia)
│                                  │
│  Prenotazione confermata          │  ← <h1>
│                                  │
│  [riepilogo identico a S-08]     │
│                                  │
│  [    Salva o stampa    ]        │  ← Button primario (window.print / PDF)
│                                  │
│  < Vedi quanto è cambiato        │
│    rispetto a prima >            │  ← Link → S-11 (RD-02)
│                                  │
│  < Torna all'inizio >            │
│                                  │
└──────────────────────────────────┘
```

---

## S-10 — [Demo] Il portale prima (RD-01)

**Componenti**: `Alert` giallo (banner simulazione), Form con `Input`, `Button`, `Alert` errore.

```
┌──────────────────────────────────┐
│  ! QUESTA È UNA SIMULAZIONE      │  ← Alert giallo, non chiudibile
│  ! del portale CUP. Nessun logo  │
│  ! o ente reale. Solo per demo.  │
│  ! < Torna a CarePath >          │
│                                  │
│  Accedi con la ricetta            │  ← <h1>
│                                  │
│  Numero ricetta elettronica      │  ← <label>
│  (NRE)                           │
│  Aiuto: 15 caratteri, lo trovi   │
│  sul promemoria della ricetta    │
│  ┌────────────────────────┐      │
│  │                        │      │  ← Input da 15 caratteri
│  └────────────────────────┘      │
│                                  │
│  Codice fiscale                  │  ← <label>
│  ┌────────────────────────┐      │
│  │                        │      │
│  └────────────────────────┘      │
│                                  │
│  [          Accedi          ]    │  ← Button primario
│                                  │
│  ! Codice non valido.            │  ← Alert errore (dopo tentativo)
│  ! (nessuna indicazione su       │
│  !  quale campo né cosa fare)    │
│                                  │
└──────────────────────────────────┘
```

Note: il messaggio "Codice non valido." è intenzionalmente opaco — è la barriera che CarePath
rimuove. È dichiarato nell'Alert giallo di simulazione.

---

## S-11 — [Demo] Autonomia & Limiti (RD-02)

**Componenti**: `Table` responsiva, `Accordion` per i limiti.

```
┌──────────────────────────────────┐
│  ← Torna alla conferma           │
│  ─────────────────────────────── │
│  Cosa è cambiato con CarePath     │  ← <h1>
│                                  │
│  ┌────────────────┬──────┬──────┐ │
│  │ Cosa si misura │Prima │Dopo  │ │  ← Table responsiva Bootstrap Italia
│  ├────────────────┼──────┼──────┤ │
│  │ Campi da       │ ≥ 2  │  0   │ │
│  │ compilare      │      │      │ │
│  ├────────────────┼──────┼──────┤ │
│  │ Termini senza  │  5   │  0   │ │
│  │ spiegazione    │      │      │ │
│  ├────────────────┼──────┼──────┤ │
│  │ Decisioni      │ ≥ 4  │ ≤ 2  │ │
│  │ richieste      │      │      │ │
│  ├────────────────┼──────┼──────┤ │
│  │ Errori senza   │ ≥ 1  │  0   │ │
│  │ recupero       │      │      │ │
│  ├────────────────┼──────┼──────┤ │
│  │ Schermi fino   │  11  │ ≤ 6  │ │
│  │ alla conferma  │      │      │ │
│  ├────────────────┼──────┼──────┤ │
│  │ Task completato│  No  │  Sì  │ │
│  │ da sola        │      │      │ │
│  └────────────────┴──────┴──────┘ │
│                                  │
│  Limiti che restano              │  ← Sottotitolo <h2>
│                                  │
│  ▿ Il sistema di prenotazione    │  ← Accordion
│    è simulato                    │
│  ▿ "Vicino a casa" usa l'area    │
│    ASL, non il domicilio esatto  │
│  ▿ Foto molto scure o ricette    │
│    danneggiate richiedono        │
│    ancora la copia manuale       │
│  ▿ Non gestisce più              │
│    prestazioni sulla stessa      │
│    ricetta                       │
│  ▿ Metriche misurate sulla demo, │
│    non validate con utenti reali │
│                                  │
│  < Torna all'inizio >            │
│                                  │
└──────────────────────────────────┘
```

---

## Note di implementazione — Bootstrap Italia

| Componente usato | Riferimento nel design system |
|------------------|-------------------------------|
| `Button` primario/outline | Componente Button — varianti `btn-primary`, `btn-outline-primary` |
| `Card` selezionabile (radio card) | Pattern Selezione con Card |
| `Alert` (info, success, errore) | Componente Alert — varianti `alert-info`, `alert-success`, `alert-danger` |
| `Accordion` (Collapse) | Componente Accordion |
| `Input` con validazione inline | Componente Input — classi `is-valid`, `is-invalid` |
| `Upload` (Allegati) | Componente Upload / Allegati |
| `Progress` / Spinner | Componente Progress / Spinner |
| `Table` responsiva | Componente Table — classe `table-responsive` |
| `Summary list` (`<dl>`) | Pattern lista di definizione (Manuale operativo di design) |
| `Hero` | Componente Hero |

**Nessun componente è inventato.** Ogni elemento del wireframe corrisponde a un componente
o pattern già presente in Bootstrap Italia. Le "card selezionabili" usano il pattern radio card
documentato nel design system .italia.

Riferimento sviluppatori: https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
