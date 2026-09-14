# UX Spec — CarePath

**Fase 2 della pipeline · agente UX (Designer)**
Fonte: `app/docs/PRD.md` · Caso: `.claude/agents/_case.md`
Design system di riferimento: [Bootstrap Italia / design system .italia](https://designers.italia.it/design-system/)
Accessibilità: [fondamenti by-design](https://designers.italia.it/design-system/fondamenti/accessibilita/) — WCAG 2.1 livello AA, UNI CEI EN 301549:2021

---

## 1. Flusso end-to-end

Il punto di partenza è Anna con il promemoria della ricetta in mano.
Il punto di arrivo è la conferma dell'appuntamento, leggibile e salvabile.

| # | Passo | User story coperta | Note |
|---|-------|--------------------|------|
| 1 | Anna apre CarePath sul telefono — vede la schermata di benvenuto | US-08 | Un solo pulsante principale |
| 2 | Tocca "Fotografa la ricetta" | US-01 | Raggiungibile in un tocco, senza login |
| 3 | Scatta o carica la foto del promemoria | US-01 | Mostra avviso privacy in questa schermata (AC-01.5) |
| 4 | Il sistema legge la foto e mostra un indicatore di avanzamento | — | Stato di caricamento accessibile (aria-live) |
| 5a | **(percorso nominale)** Appare la visita in parole sue — conferma con "Sì, è questa" | US-02, US-04 | Citazione originale sempre visibile (G-03) |
| 5b | **(foto non leggibile)** Appare la guida con la foto annotata e l'inserimento spezzato | US-03 | Due campi: 5 + 10 caratteri; validazione immediata |
| 6 | Il sistema chiede: "Le interessa di più fare presto o stare vicino a casa?" | US-05 | Una sola domanda a risposta chiusa |
| 7 | Appaiono 2–3 proposte di appuntamento, etichettate in linguaggio comune | US-05 | Nessun menu di branche né elenco strutture |
| 8 | Anna sceglie una proposta e tocca "Confermo l'appuntamento" | US-06, US-07 | Unico passo irreversibile; assenso esplicito |
| 9 | Appare la conferma completa: visita, quando, dove, cosa portare, costo, come disdire | US-06 | Salvabile/stampabile senza account (AC-06.2) |

**Percorso alternativo — Anna risponde "No, non è questa"** (passo 5a negativo)
→ Il sistema non procede. Offre: "Rifare la foto" oppure "Inserisci tu il codice" (percorso 5b).
Non tira a indovinare (AC-02.3).

**Percorso demo — "Come funzionava prima"** (accessibile dalla schermata di benvenuto, RD-01)
→ Replica del modulo CUP con campo NRE da 15 caratteri e messaggio d'errore opaco.
Dichiaratamente simulazione, senza loghi o marchi reali (AC-RD1.2).

**Decisione D-06 — "Più vicino a casa" senza chiedere l'indirizzo**
La ricetta contiene la ASL di riferimento. Il sistema la estrae durante l'OCR e usa l'area ASL come
proxy geografico. Per "più vicino a casa" mostra le strutture della stessa ASL ordinate per
accessibilità (distanza approssimativa dal capoluogo ASL). Anna non inserisce nessun dato di
localizzazione. Questa scelta risolve D-06 evitando sia un campo di testo (contro M1) sia la
raccolta di un dato di domicilio non necessario.

---

## 2. Schermi

### S-01 — Benvenuto

**Scopo**: orientare Anna; affidarle l'unica azione che deve fare.

**Decisione chiesta alla persona**: nessuna. C'è un pulsante principale evidente.

**Componenti Bootstrap Italia**:
- `Hero` (sfondo leggero, titolo grande) per il messaggio principale
- `Button` primario (`btn-primary`, full-width su mobile) per "Fotografa la ricetta"
- Link testuale piccolo per "Vedi come funzionava prima" (RD-01)

**Copy**:
- Titolo H1: `CarePath — Prenota la tua visita`
- Sottotitolo: `Fotografa il foglio che ti ha dato il medico. Pensiamo noi al resto.`
- Pulsante principale: `Fotografa la ricetta`
- Link secondario: `Vedi come funzionava prima` (percorso demo RD-01)

**Stati**:
| Stato | Descrizione |
|-------|-------------|
| Normale | Pulsante principale in evidenza, link secondario sotto |
| — | Nessun stato di caricamento o errore su questo schermo |

**Riduzione del carico cognitivo**: zero decisioni richieste. Il testo dice in parole sue cosa fa
l'app. Il percorso demo è disponibile ma non è l'azione principale.

---

### S-02 — Fotografa la ricetta

**Scopo**: catturare la foto del promemoria senza istruzioni tecniche.

**Decisione chiesta alla persona**: scattare o scegliere una foto dalla galleria.

**Componenti Bootstrap Italia**:
- `Upload` (componente Allegati): `<input type="file" accept="image/*" capture="environment">` per
  attivare la fotocamera sul mobile, con fallback alla galleria
- `Card` di istruzioni con immagine illustrativa del promemoria
- Avviso privacy in `Alert` informativo (non bloccante) prima dell'azione
- `Button` primario: `Scatta la foto` / `Scegli dalla galleria`

**Copy**:
- Titolo H1: `Fotografa il foglio della ricetta`
- Istruzione: `Inquadra tutto il foglio. La luce deve essere buona e il testo leggibile.`
- Avviso privacy: `La foto viene analizzata solo per leggere i codici della visita. Non viene
  salvata né inviata ad altri servizi.` (con link "Scopri di più" per dettaglio completo — AC-01.5)
- Pulsante camera: `Scatta la foto`
- Alternativa: `Scegli dalla galleria`
- Back: `Torna all'inizio`

**"Che significa?" — termine NRE**:
Anche se Anna non vede il campo NRE in questo schermo, il termine potrebbe comparire negli errori o
nel riepilogo. Un'espansione accordion "Che cos'è il codice della ricetta (NRE)?" è disponibile:
*"È un numero a 15 cifre che identifica la tua ricetta. Non devi cercarlo: CarePath lo legge dalla
foto al posto tuo."*

**Stati**:
| Stato | Descrizione |
|-------|-------------|
| Attesa | Istruzioni visibili, pulsante attivo |
| File selezionato | Anteprima della foto + pulsante "Usa questa foto" + "Cambia" |
| Caricamento | Spinner accessibile con testo `Sto leggendo la ricetta...` (aria-live="polite") |
| Errore upload | Alert di errore: `Foto non caricata. Controlla la connessione e riprova.` + pulsante Riprova |

---

### S-03 — Lettura in corso

**Scopo**: rassicurare Anna mentre il sistema elabora la foto.

**Decisione chiesta alla persona**: nessuna.

**Componenti Bootstrap Italia**:
- `Progress` circolare (Spinner) al centro
- Testo di rassicurazione sotto

**Copy**:
- Titolo H1: `Sto leggendo la ricetta...`
- Sottotesto: `Ci vuole qualche secondo.`
- (Se supera 8 secondi): `Ci vuole un po' più del solito. Stiamo ancora lavorando.`

**Accessibilità**:
- `aria-live="polite"` sulla regione di testo; lo spinner ha `role="status"` e
  `aria-label="Elaborazione in corso"`

---

### S-04 — Conferma lettura ricetta (percorso nominale)

**Scopo**: mostrare ciò che è stato letto e chiedere a Anna di confermare. Una sola domanda.

**Decisione chiesta alla persona**: "È questa la visita?" — Sì / No. È una domanda che Anna sa
rispondere: vede scritto quello che il medico le ha dato.

**Componenti Bootstrap Italia**:
- `Card` principale con la prestazione in evidenza (testo grande)
- `Accordion` (Collapse) "Vedi il testo originale della ricetta" — sempre disponibile
- Se campo a bassa confidenza: `Alert` informativo con ritaglio della foto + istruzione
- `Button` primario: `Sì, è questa`
- `Button` secondario outline: `No, non è questa`
- Link/accordion `Che significa?` per ogni termine amministrativo mostrato

**Copy — percorso nominale (VISITA ORTOPEDICA DI CONTROLLO)**:
- Titolo H1: `Ho trovato la tua visita`
- Domanda: `Stavo cercando questo?`
- Testo principale (grande, evidenziato): `Visita ortopedica di controllo`
- Testo secondario: `Così c'è scritto sulla tua ricetta:`
- Citazione originale (in `Accordion`, aperto di default): `VISITA ORTOPEDICA DI CONTROLLO — 89.01.G`
- Informazione NRE (sempre visibile): `Codice ricetta (NRE): 010A2 · 4518061015`
  con spiegazione inline: *(i due numeri sotto i codici a barre sul foglio del medico)*
- Classe di priorità: il sistema la usa internamente. Non viene chiesto ad Anna di inserirla.
  Se Anna chiede, Accordion "Che significa la lettera D sulla ricetta?":
  *"D vuol dire 'differibile': il Servizio Sanitario deve fissare la tua visita entro 30 giorni.
  Non riguarda la gravità della tua situazione: è solo il tempo massimo che il sistema ha per
  trovare un appuntamento."* (testo fisso, versionato in repository — AC-04.3, AC-04.4)
- Pulsante principale: `Sì, è questa`
- Pulsante secondario: `No, non è questa`
- Back: `Torna alla fotografia`

**Affordance "Che significa?" — tutti i termini mostrati in questo schermo**:
| Termine | Spiegazione (max 2 frasi) |
|---------|--------------------------|
| NRE (codice ricetta) | "È il numero che identifica la tua ricetta in tutto il sistema sanitario. CarePath lo ha già letto: non devi copiarlo tu." |
| Branca specialistica | "È la categoria della visita (per esempio: ortopedia, oculistica). CarePath la ricava da sola dal tipo di visita scritta sulla ricetta." |
| Classe di priorità | "È la lettera che indica entro quanto tempo il sistema deve fisssare la visita. Non riguarda la gravità: è un termine organizzativo." |
| Struttura erogatrice | "È l'ospedale o il poliambulatorio dove si fa la visita. CarePath ti propone le opzioni più adatte, così non devi cercarle tu." |
| Esenzione | "Con l'esenzione non paghi il ticket, o ne paghi una parte ridotta. CarePath usa il codice già sulla ricetta." |
| Regime (S/H) | "S = visita programmata (non urgente). H = in regime di ricovero. CarePath usa questo dato per trovare il tipo giusto di appuntamento." |

**Campo a bassa confidenza**:
Se un campo è letto con confidenza bassa, compare:
- `Alert` giallo (informativo) con il ritaglio della foto e il testo letto
- Istruzione: `Non sono sicuro di questo numero. Guardami qua sulla foto: vedi lo stesso numero?`
- Pulsante: `Sì, è giusto` / `No, è diverso` (se no: porta al percorso S-05b)

**Stati**:
| Stato | Descrizione |
|-------|-------------|
| Nominale | Card con prestazione + due pulsanti |
| Bassa confidenza | Alert con ritaglio foto + conferma campo per campo |
| Negativo ("No, non è questa") | Si passa a S-04b (recupero) |

---

### S-04b — Conferma negativa / recupero

**Scopo**: Anna ha detto "No, non è questa". Il sistema non procede. Offre due vie.

**Decisione chiesta alla persona**: "Vuole rifare la foto oppure inserire il codice con la guida?"
Anna sa rispondere: sa se la foto era sfocata o se il testo è sbagliato.

**Componenti Bootstrap Italia**:
- `Alert` neutro con spiegazione breve
- Due `Button` equivalenti (nessun primario sovraccaricato)

**Copy**:
- Titolo H1: `Ricontrolliamo insieme`
- Testo: `Potrebbe essere una foto poco nitida, oppure una ricetta diversa.`
- Opzione A: `Fai un'altra foto` (→ S-02)
- Opzione B: `Inserisci il codice con la guida` (→ S-05b)
- Back: `Torna alla conferma della visita`

---

### S-05b — Guida alla lettura (fallback US-03)

**Scopo**: quando l'OCR fallisce, mostrare ad Anna la sua foto annotata e guidarla
nell'inserimento spezzato. Non ricrea la barriera originale.

**Decisione chiesta alla persona**: copiare due numeri dalla propria foto, indicati chiaramente.
Anna sa farlo: vede il numero che deve copiare evidenziato sulla sua stessa foto.

**Componenti Bootstrap Italia**:
- Immagine della foto caricata, con overlay SVG che evidenzia le due aree (primo e secondo
  codice a barre + numeri sotto)
- Due `Input` separati con etichette esplicite: "Primo numero (5 cifre)" e "Secondo numero
  (10 cifre)"
- Validazione inline immediata per segmento (`is-valid` / `is-invalid` di Bootstrap Italia)
- `Button` "Rifare la foto" sempre visibile (non perde i dati già confermati — AC-03.4)

**Copy**:
- Titolo H1: `Aiutami a leggere il codice`
- Istruzione principale: `Copia il numero sotto il primo codice a barre, poi quello sotto il secondo.`
- Campo 1 — label: `Primo numero (le prime 5 cifre della ricetta)`
- Campo 1 — placeholder: per esempio `010A2`
- Campo 1 — errore: `Questo numero deve avere esattamente 5 caratteri. Hai scritto [N]: ne mancano [X].`
- Campo 2 — label: `Secondo numero (le ultime 10 cifre della ricetta)`
- Campo 2 — placeholder: per esempio `4518061015`
- Campo 2 — errore: `Questo numero deve avere esattamente 10 caratteri. Hai scritto [N].`
- Validazione OK per campo: checkmark verde + `Perfetto, questo va bene.`
- Pulsante principale: `Continua con questi numeri`
- Link secondario: `Fai un'altra foto`
- Back: `Torna indietro`

**Accessibilità**:
- I due campi hanno `aria-describedby` che puntano ai messaggi di errore/successo
- L'immagine annotata ha `alt` descrittivo: "La tua ricetta: la zona evidenziata mostra i due
  numeri da copiare. Il primo è sotto il codice a barre di sinistra, il secondo sotto quello
  di destra."

---

### S-06 — Preferenza

**Scopo**: chiedere una sola cosa ad Anna: cosa conta di più per lei.

**Decisione chiesta alla persona**: "Prima data disponibile" o "Più vicino a casa".
È una decisione che Anna sa prendere: conosce i propri impegni e la propria mobilità.

**Componenti Bootstrap Italia**:
- Due grandi `Card` selezionabili (pattern radio card, ciascuna ≥ 44px di target)
- `Button` primario "Mostrami le proposte" attivabile solo dopo la scelta

**Copy**:
- Titolo H1: `Cosa le interessa di più?`
- Sottotitolo: `Le mostreremo le migliori opzioni in base alla sua risposta.`
- Card A: `Fare presto` / sottotesto: `La prima data libera disponibile`
- Card B: `Stare vicino a casa` / sottotesto: `Una struttura nella sua area`
- Pulsante: `Mostrami le proposte`
- Back: `Torna alla conferma della visita`
- Nota: la ASL della ricetta viene usata come area di riferimento per "Stare vicino a casa"
  (non si chiede l'indirizzo — D-06 risolto)

**Nota su "Che significa?" — struttura erogatrice**:
Accordion disponibile: "Cos'è una struttura erogatrice?"
*"È l'ospedale o il poliambulatorio dove si può fare la visita. CarePath sceglie quelli nella
sua zona: non deve cercarne lei."*

---

### S-07 — Proposte appuntamento

**Scopo**: mostrare 2–3 opzioni concrete, etichettate in linguaggio di bisogno.

**Decisione chiesta alla persona**: scegliere una proposta fra al massimo 3.
Ogni proposta è descritta in linguaggio che Anna capisce: data, ora, luogo, distanza approssimativa.

**Componenti Bootstrap Italia**:
- Da 2 a 3 `Card` selezionabili con radio button integrato (visivamente simili a radio card)
- Ciascuna card contiene: badge etichetta (es. "Prima data"), data in formato esteso, ora, nome
  struttura, indirizzo
- `Button` primario: `Scelgo questo appuntamento`
- `Button` secondario: `Voglio vedere opzioni diverse` (riporta a S-06)

**Copy — struttura di ogni card**:
```
[ Prima data disponibile ]
Martedì 22 ottobre 2024 — ore 10:30
Poliambulatorio San Luca
Via Roma 12, Torino
```
```
[ Più vicino a casa ]
Giovedì 24 ottobre 2024 — ore 14:00
Ospedale Città della Salute
Corso Bramante 88, Torino
```
- Nessun codice, sigla o nome di nomenclatore
- Nessun campo che richieda di conoscere "branche" o "strutture" (AC-05.3)

**"Che significa?" su ogni struttura**:
Il nome della struttura è accompagnato da un'icona info e un tooltip espandibile:
*"Questo è il nome ufficiale della struttura sanitaria. Può portare il foglio della ricetta e
il documento d'identità."*

**Stati**:
| Stato | Descrizione |
|-------|-------------|
| Caricamento | Skeleton cards + `aria-live="polite"` "Sto cercando gli appuntamenti disponibili..." |
| Nominale | 2–3 card, nessuna preselezionata |
| Selezionata | Card evidenziata con bordo primario + checkmark |
| Nessuna disponibilità | Alert: `Non ho trovato appuntamenti nei prossimi 30 giorni. Le mostro cosa fare.` + link al CUP telefonico |

---

### S-08 — Riepilogo e conferma

**Scopo**: Anna vede tutto quello che ha scelto, decide se confermare. Passo unico irreversibile.

**Decisione chiesta alla persona**: confermare o tornare indietro.
È la sola decisione irreversibile (AC-07.3). Tutto il resto può essere disfatto.

**Componenti Bootstrap Italia**:
- `Summary list` (lista di definizione `<dl>`) con etichette in linguaggio comune
- `Alert` informativo con il codice di prenotazione in gruppi
- `Button` primario: `Confermo l'appuntamento`
- `Button` secondario outline: `Torna a scegliere la data`

**Ordine delle informazioni (AC-06.1)**:
1. **Che visita è**: Visita ortopedica di controllo
2. **Quando**: Martedì 22 ottobre 2024, ore 10:30
3. **Dove**: Poliambulatorio San Luca — Via Roma 12, Torino
4. **Cosa portare**: Questo foglio della ricetta e un documento d'identità
5. **Quanto paga**: Non paga il ticket — ha l'esenzione [codice esenzione]
   *(se non esentata)*: Ticket: 36,15 €
6. **Come disdire**: "Se vuole cambiare o cancellare, chiami il numero [XXX] con il
   codice qui sotto. Lo serve solo per disdire."
7. **Codice prenotazione** (in gruppi): `PRE · 2024 · 1022 · 0017`

**"Che significa?" — esenzione**:
*"Con il codice di esenzione non paga (o paga meno) il ticket. Il codice viene dalla
sua tessera o dalla ricetta: non deve fare nulla."*

**Copy — messaggio di conferma (post-tocco)**:
Dopo il tocco su "Confermo l'appuntamento":
- `Alert` verde success: `Prenotazione confermata. Trovi tutto qui sotto.`
- Il foglio non si chiude; diventa la conferma salvabile.
- Pulsante: `Salva o stampa questo foglio`
- Link: `Vedi cosa ha guadagnato con CarePath` (→ S-10, RD-02)

---

### S-09 — Prenotazione confermata (post-conferma)

**Scopo**: dare ad Anna un documento che può rileggere, mostrare al figlio o stampare.

**Decisione chiesta alla persona**: nessuna obbligatoria. Può salvare o chiudere.

**Componenti Bootstrap Italia**:
- `Alert` success in testa alla pagina
- `Summary list` con tutti i dettagli (stesso contenuto di S-08)
- `Button` primario: `Salva o stampa` (usa `window.print()` o genera PDF client-side)
- `Button` secondario: `Torna all'inizio`
- Link: `Vedi quanto è cambiato rispetto a prima` (RD-02)

**Nota di accessibilità**: la pagina di conferma non ha dati clinici oltre alla citazione testuale
della prestazione (AC-06.5, G-01).

---

### S-10 — [Demo] Il portale prima (RD-01)

**Scopo**: mostrare la barriera originale. Necessario per il contrasto prima/dopo in demo.

**Componenti Bootstrap Italia**: Form standard (`Input`, `Button`) per rispettare i componenti
reali del tipo di interfaccia riprodotta.

**Copy**:
- Banner in testa (giallo, non rimovibile): `Questa è una simulazione del portale CUP.
  Non usa loghi o dati reali. Serve solo per mostrare la differenza con CarePath.`
- Titolo H1: `Accedi con la ricetta`
- Campo 1 — label: `Numero ricetta elettronica (NRE)`
  Aiuto: `15 caratteri, lo trovi sul promemoria della ricetta`
- Campo 2 — label: `Codice fiscale`
- Pulsante: `Accedi`
- Messaggio d'errore (dopo il tocco senza dati corretti): `Codice non valido.`
  *(senza nessuna indicazione su quale campo è sbagliato né cosa fare)*
- Back: `Torna a CarePath`

---

### S-11 — [Demo] Autonomia & Limiti (RD-02)

**Scopo**: mostrare in numeri cosa è cambiato e quali limiti restano.

**Componenti Bootstrap Italia**:
- `Table` responsiva con le metriche prima/dopo
- `Accordion` per ogni limite residuo

**Copy — tabella metriche**:
| Cosa si misura | Prima (portale CUP) | Con CarePath |
|---|---|---|
| Campi di testo da compilare | ≥ 2 (NRE 15 car. + CF 16 car.) | 0 |
| Termini senza spiegazione | 5 (NRE, branca, priorità, struttura, esenzione) | 0 |
| Decisioni richieste | ≥ 4 (decine di opzioni ciascuna) | 2 (fra 2–3 opzioni) |
| Errori senza recupero guidato | ≥ 1 | 0 |
| Schermi fino alla conferma | 11 | ≤ 6 |
| Task completato da Anna da sola | No | Sì |

**Limiti residui dichiarati**:
- Il sistema di prenotazione è simulato: la conferma non è trasmessa a un CUP reale.
- "Più vicino a casa" usa la ASL come proxy, non il domicilio esatto.
- Se la foto è molto scura o la ricetta è danneggiata, il fallback guidato richiede
  comunque di copiare due numeri.
- Non gestisce più prestazioni sulla stessa ricetta.
- Non gestisce ricette rosse cartacee.
- Le metriche non sono validate con utenti reali: sono misurate sulla demo (§5 PRD).

---

## 3. Accessibilità — per schermo

Riferimento: https://designers.italia.it/design-system/fondamenti/accessibilita/

**Regole trasversali a tutti gli schermi**:
- Contrasto testo/sfondo ≥ 4.5:1 (WCAG 2.1 AA, livello testo normale)
- Contrasto titoli ≥ 3:1 (testo grande)
- Corpo del testo ≥ 18px (Bootstrap Italia: `font-size` base 16px, usare `h5` o classe
  di utility per i testi principali rivolti ad Anna)
- Aree toccabili ≥ 44 × 44 px (WCAG 2.5.5 target size)
- Nessuna informazione veicolata dal solo colore (es. gli errori hanno icona + testo,
  non solo bordo rosso)
- Ogni schermo ha un `<h1>` univoco
- Navigazione da tastiera: `Tab` raggiunge ogni controllo interattivo in ordine logico;
  i `Button` primari sono nell'ordine naturale del DOM, non con `tabindex` positivi
- I `Dialog`/modal (se usati) trappolano il focus e restituiscono il focus al trigger alla chiusura

**Ordine di focus per schermo**:

| Schermo | Sequenza di focus |
|---------|-------------------|
| S-01 Benvenuto | H1 → testo descrittivo → pulsante "Fotografa" → link "Prima" |
| S-02 Fotografa | H1 → istruzioni → avviso privacy → pulsante camera → link galleria → back |
| S-04 Conferma lettura | H1 → card prestazione → accordion "testo originale" → accordion "Che significa?" → btn Sì → btn No → back |
| S-05b Guida lettura | H1 → istruzione → immagine (alt descrittivo) → campo 1 → errore/ok campo 1 → campo 2 → errore/ok campo 2 → btn Continua → link foto → back |
| S-06 Preferenza | H1 → card A → card B → btn Mostrami → back |
| S-07 Proposte | H1 → card 1 → card 2 → (card 3) → btn Scelgo → back |
| S-08 Conferma | H1 → lista dettagli → alert codice → btn Confermo → btn Torna |

**Screen reader — note per schermo**:
- S-03 (caricamento): `role="status"` e `aria-live="polite"` sulla zona di avanzamento;
  lo spinner ha `aria-label="Elaborazione in corso"` e `aria-hidden="false"` finché attivo
- S-04 (campo a bassa confidenza): l'alert ha `role="alert"` (assertive) per essere annunciato
  immediatamente
- S-05b (campi spezzati): gli errori inline sono in `<span>` con `id` referenziati da
  `aria-describedby` sui rispettivi `<input>`; lo stato di validità è comunicato anche con
  `aria-invalid="true|false"`
- S-07 (proposte): le card radio hanno `role="radio"` e `aria-checked`; il gruppo ha
  `role="radiogroup"` con `aria-labelledby` che punta al titolo

**Testo ingrandito (zoom 200%)**:
- Layout a singola colonna su mobile: lo zoom non rompe il layout orizzontale (AC-06.3)
- I pulsanti sono block-level su mobile: non si tagliano con lo zoom
- I testi di errore e i label non vengono troncati: usare `white-space: normal`

**Contrasto — deroga motivata**:
Il tema Bootstrap Italia light soddisfa di default il livello AA. Se si usano varianti di colore
per badge/etichette (es. "Prima data disponibile"), verificare con lo strumento di contrast check
del design system prima del build. Nessun componente inventato: si usano esclusivamente le
varianti Bootstrap Italia già validate.

---

## 4. Riduzione del carico cognitivo — analisi

| Schermo | Decisioni chieste | Motivazione — perché Anna sa rispondervi |
|---------|-------------------|------------------------------------------|
| S-01 Benvenuto | 0 | — |
| S-02 Fotografa | 1 (scattare o scegliere foto) | Sa usare la fotocamera: US-01 è ancorata a questa competenza |
| S-04 Conferma | 1 (è questa la visita?) | Vede scritto quello che le ha dato il medico |
| S-04b Recupero | 1 (rifare foto o inserire manuale) | Sa se la foto era nitida oppure no |
| S-05b Guida | 1 (copiare 2 numeri dalla foto guidata) | Vede evidenziato il numero da copiare sulla sua stessa foto |
| S-06 Preferenza | 1 (presto o vicino) | Conosce i propri impegni e la propria mobilità |
| S-07 Proposte | 1 (fra 2–3 opzioni descritte) | Sceglie fra date e luoghi, non fra codici |
| S-08 Conferma | 1 (confermare) | Vede tutto il riepilogo prima di scegliere |
| **Totale percorso nominale** | **≤ 3** | Obiettivo M3: ≤ 2 decisioni fra ≤ 3 opzioni — rispettato |

**Nota**: S-04b e S-05b sono percorsi alternativi, non parte del nominale. Il nominale (S-01,
S-02, S-04, S-06, S-07, S-08) ha 3 decisioni, ognuna binaria o con max 3 opzioni. M3 è rispettato.

---

## 5. Auto-critica avversariale

### Ogni schermo chiede una decisione che Anna sa prendere?
- **S-04 (conferma visita)**: Anna sa rispondere "Sì/No" perché vede la prestazione scritta
  in parole sue E la citazione originale sempre disponibile. CONFERMATO.
- **S-06 (presto/vicino)**: Anna conosce la propria mobilità e i propri impegni. CONFERMATO.
- **S-07 (scelta proposta)**: Ogni opzione ha data, ora, nome e indirizzo in chiaro. CONFERMATO.
- **S-08 (conferma)**: È l'unico passo irreversibile; il riepilogo è completo prima del tocco.
  CONFERMATO.

### Componenti già nel design system .italia?
- `Button`, `Card`, `Alert`, `Accordion`, `Input`, `Upload`, `Progress` (spinner), `Table`,
  `Summary list` → tutti presenti in Bootstrap Italia. Nessun componente inventato.
- Le "card selezionabili" (radio card) sono documentate nel pattern "Selezione con card" del
  design system. Usato quello.

### I messaggi di errore dicono cosa è andato storto E il passo dopo?
- S-05b, campo 1: `Questo numero deve avere esattamente 5 caratteri. Hai scritto [N]: ne
  mancano [X].` → sì, dice quale campo, quanti caratteri mancano.
- S-02, errore upload: `Foto non caricata. Controlla la connessione e riprova.` → sì, c'è
  il pulsante Riprova.
- S-10 (replica CUP, intenzionalmente opaco): `Codice non valido.` senza recupero → È il
  punto della demo che mostra la barriera. Corretto lasciarla così; è dichiarata simulazione.

### Il copy semplificato tradisce il documento sorgente?
- "Visita ortopedica di controllo" → testo identico alla ricetta (VISITA ORTOPEDICA DI
  CONTROLLO), solo in minuscolo e senza il codice nomenclatore (89.01.G). Il codice originale
  è disponibile nell'accordion "testo originale". NON TRADISCE (G-03).
- La classe di priorità "D" → il sistema non la mostra ad Anna come scelta. Se chiede, la
  spiegazione dice solo il significato organizzativo (entro 30 giorni), mai clinico (G-01,
  AC-04.3). CONFERMATO.

### Il flusso funziona con testo ingrandito, contrasto alto, solo tastiera, screen reader?
- Testo ingrandito: layout a singola colonna, nessun overflow orizzontale. CONFERMATO.
- Contrasto alto: Bootstrap Italia light è AA di default; le varianti colore sono verificate
  prima del build. CONFERMATO in specifica; da verificare in build.
- Solo tastiera: ogni controllo è raggiungibile con Tab; nessun drag né gesture. CONFERMATO.
- Screen reader: `aria-live`, `role="status"`, `aria-describedby` specificati per ogni stato
  dinamico. Da verificare con VoiceOver/TalkBack in build.

### Se Anna si blocca a metà, l'interfaccia se ne accorge e interviene?
- Se la foto non è leggibile → S-04b → S-05b: il sistema offre il fallback guidato. CONFERMATO.
- Se Anna dice "No, non è questa" → S-04b con due opzioni. Non lascia Anna ferma senza azione.
  CONFERMATO.
- Se non ci sono proposte di appuntamento → Alert con numero CUP telefonico. CONFERMATO.
- Il percorso non ha timeout; Anna può fermarsi e riprendere senza perdere i dati della foto
  (stato client-side). CONFERMATO in specifica; da verificare in build.

### Gli scenari BDD coprono anche i percorsi di fallimento?
Vedi `app/docs/scenarios/`. Coperti: percorso nominale, foto non leggibile, conferma negativa,
"Che significa?", torna indietro, salva conferma, replica CUP.

---

## Riferimenti

- Design system .italia — https://designers.italia.it/design-system/
- Accessibilità by-design (WCAG 2.1 AA, UNI CEI EN 301549:2021) — https://designers.italia.it/design-system/fondamenti/accessibilita/
- Bootstrap Italia per sviluppatori — https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
- Manuale operativo di design — https://docs.italia.it/italia/designers-italia/manuale-operativo-design-docs/it/versione-corrente/
- Linee guida AgID art. 53 CAD — https://www.agid.gov.it/sites/default/files/repository_files/design-italia.pdf
- PRD: `app/docs/PRD.md` (§3 User stories, §4 Criteri di accettazione, §6 Metriche)
- Caso: `.claude/agents/_case.md`
