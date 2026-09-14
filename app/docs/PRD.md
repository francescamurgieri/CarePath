# PRD — CarePath

**Fase 1 della pipeline · agente REQ (Intake / Analyst)**
Tema: **01 — Accessibilità Digitale** (`intake/hackaton-rules/hagenthon-temi-sfida-2.html`)
Fonti di intake: `intake/idea/CarePath_Hackathon_Concept.pptx`, `intake/idea/Example files/image.png`
Contesto vincolante: `.claude/agents/_shared-context.md` (metodo), `.claude/agents/_case.md` (caso)

CarePath è un **accessibility layer** sopra il percorso di prenotazione sanitaria: non un nuovo CUP,
non un restyling del CUP. Traduce ciò che è scritto sulla ricetta nel linguaggio del bisogno della
persona e la accompagna fino alla prenotazione confermata.

---

## 1. Persona & Barriera

### Anna, 74 anni

Vive da sola in un appartamento al secondo piano senza ascensore, in una città media. Ha uno
smartphone che le ha configurato il figlio: lo usa per telefonare, per WhatsApp con i nipoti e per
fotografare. Non ha un computer. Ha la tessera sanitaria nel portafoglio; **non ha SPID**.
Ha un'esenzione per patologia. Legge senza occhiali solo i caratteri grandi.

Non è "un'anziana che non sa usare il digitale": sa fare una foto, sa mandarla, sa seguire
istruzioni scritte in parole sue. Il carico cognitivo non è suo, è **imposto dal servizio**, che
ragiona per campi amministrativi mentre lei ragiona per bisogno.

### Cosa sta cercando di fare

Il medico di base le ha stampato il **promemoria della ricetta elettronica** per una visita
specialistica. Anna vuole **prenotare la visita da sola, dal telefono**, senza chiamare il CUP
(linea occupata, attese lunghe) e senza chiedere al figlio (che lavora, e che lei non vuole
disturbare per la terza volta in un mese).

### Dove si ferma oggi — schermo e campo esatti

Portale CUP regionale, percorso **"Prenota senza SPID — accedi con la ricetta"**.
Primo schermo dopo la home. Due campi obbligatori:

| Campo del modulo | Testo di aiuto del portale |
|---|---|
| **Numero ricetta elettronica (NRE)** | *"15 caratteri, lo trovi sul promemoria della ricetta"* |
| Codice fiscale / numero tessera sanitaria | — |

**Anna si ferma sul campo "Numero ricetta elettronica (NRE)".**

Il motivo è verificabile guardando il documento che ha in mano
(`intake/idea/Example files/image.png`): sul promemoria **non esiste nessuna
etichetta "NRE"**. Ci sono due codici a barre affiancati, con sotto due numeri stampati fra
asterischi — nella fixture di intake `*010A2*` e `*4518061015*` (ricetta per VISITA ORTOPEDICA
DI CONTROLLO, Regione Piemonte) — e un terzo codice a barre con il codice fiscale. Il numero
da 15 caratteri che il portale chiede **non è stampato da nessuna parte come tale**: va ottenuto
leggendo i due numeri sotto i codici a barre e **unendoli** (5 caratteri + 10 caratteri = 15).
Nessuno glielo dice. In alcuni promemoria regionali il numero completo è stampato per esteso,
in quello che Anna ha in mano no.

Anna prova: digita `1234567890`, il portale risponde **"Codice non valido"**. Riprova aggiungendo
`0900A` davanti ma sbaglia uno zero. Stesso errore, stesso messaggio, nessun indizio su *cosa* sia
sbagliato. Al terzo tentativo chiude la pagina e prende il telefono per chiamare il figlio.

**Il momento esatto del blocco è questo: campo NRE, primo schermo, terzo errore, prima di aver
scelto qualsiasi cosa sulla visita.** Il percorso finisce prima di cominciare.

### Le tre frizioni successive

Anche superato l'NRE — per esempio perché qualcuno glielo detta — Anna incontra altri tre punti di
arresto, tutti dello stesso tipo: **il servizio nomina cose che sulla ricetta hanno un altro nome,
o non hanno nome affatto.**

| Termine chiesto dal CUP | Cosa c'è sulla ricetta | Perché blocca |
|---|---|---|
| **Branca specialistica** (menu a tendina, decine di voci) | non è stampata | Anna deve dedurre "Oculistica" dal testo della prestazione. È un'inferenza amministrativa, non un'informazione che possiede |
| **Classe di priorità** | una lettera secca nel campo `PRIORITÀ PRESCRIZIONE (U,B,D,P)`, senza legenda | vede `D` e non sa cosa sia. Teme che scegliendo l'opzione sbagliata la prenotazione salti |
| **Struttura erogatrice** | non è stampata | elenco di sigle e indirizzi (`P.O.`, `Poliambulatorio`, `Presidio`). Non sa quale sia vicino a casa né quale intendesse il medico |

A valle di tutto: **la paura di confermare qualcosa di sbagliato**, che è il vero motivo per cui
Anna abbandona anche quando tecnicamente potrebbe andare avanti.

---

## 2. Percorso attuale (prima)

Percorso di riferimento: portale CUP regionale, accesso con ricetta elettronica e tessera
sanitaria (modalità documentata sui portali regionali, es. PrenotaSalute Regione Lombardia,
citato nel concept di intake). La replica di questo percorso è un deliverable della demo (RD-01).

| # | Passo | Frizione |
|---|---|---|
| 1 | Home del portale, sceglie fra "Accedi con SPID/CIE" e "Accedi con la ricetta" | non ha SPID; deve capire da sola che esiste una seconda via e che è quella per lei |
| 2 | Schermo di accesso: campo **NRE (15 caratteri)** | **blocco principale.** Il numero non è etichettato sulla ricetta e va composto da due codici a barre |
| 3 | Campo codice fiscale / tessera sanitaria | trascrizione di 16 caratteri alfanumerici, senza conferma progressiva |
| 4 | Errore `Codice non valido` | il messaggio non dice quale dei due campi è sbagliato né perché. Nessun recupero guidato |
| 5 | Selezione **branca specialistica** da menu | deve tradurre la prestazione prescritta in una categoria amministrativa |
| 6 | Selezione **prestazione** da elenco di voci di catalogo | le voci di nomenclatore non coincidono con la frase stampata sulla ricetta |
| 7 | **Classe di priorità** e **regime** (S / H) | codici a lettera singola senza spiegazione |
| 8 | Selezione **ambito territoriale / struttura erogatrice** | decine di strutture con nomi istituzionali; nessun criterio "vicino a casa" |
| 9 | Griglia **agende e slot**: date e orari su calendario denso | troppe opzioni equivalenti, nessuna delle quali Anna è in grado di valutare |
| 10 | Riepilogo e conferma | testo denso, costo/esenzione poco leggibile, "cosa portare" assente o in fondo |
| 11 | Conferma | nessuna rassicurazione che si possa disdire; paura di aver sbagliato |

**Nota per M5 (§6):** il conteggio "passi" della metrica esclude il passo 11 (schermata di solo
esito, nessuna azione richiesta) — la stessa regola applicata al percorso "dopo", per un
confronto onesto. Base per M5: **10** passi che richiedono un'azione, non 11.

**Esito attuale: il task non viene completato in autonomia.** Anna chiama il figlio o il call
center. Il servizio digitale ha spostato efficienza sul sistema e complessità sulla paziente.

---

## 3. User stories

Formato: `Come Anna, voglio … così da …`. Ogni storia è un bisogno della persona.
`[MUST]` = dentro il budget di consegna (5 ore, 2 persone). `[OUT]` → §5.

### US-01 — Non trascrivere codici `[MUST]`
**Come Anna, voglio fotografare la mia ricetta con il telefono, così da non dover cercare e
copiare a mano dei codici che non so riconoscere.**
È la storia che rimuove il blocco esatto del §1.

### US-02 — Riconoscere la mia visita in parole mie `[MUST]`
**Come Anna, voglio che il sistema mi dica in una frase semplice quale visita ha letto sulla mia
ricetta e mi chieda conferma, così da essere sicura che stiamo parlando della stessa cosa prima
di andare avanti.**

### US-03 — Non essere rimandata al modulo quando la foto non basta `[MUST]`
**Come Anna, voglio che, se la foto non è leggibile, il sistema mi mostri sulla mia stessa foto
dove guardare e cosa copiare, così da riuscire comunque ad andare avanti da sola invece di
tornare al modulo che mi aveva bloccata.**
Un fallback che si limita a "inserisci l'NRE a mano" **ricrea la barriera** ed è un fallimento
del requisito, non una via d'uscita.

### US-04 — Capire le parole del servizio quando compaiono `[MUST]`
**Come Anna, voglio poter chiedere "che significa?" su ogni parola amministrativa che incontro
(NRE, branca, classe di priorità, struttura erogatrice), così da non dover interrompere e cercare
altrove.**

### US-05 — Scegliere fra poche cose che so valutare `[MUST]`
**Come Anna, voglio scegliere fra due o tre proposte descritte come "prima data disponibile" o
"più vicino a casa", così da decidere su ciò che conta per me invece che su strutture e agende
che non so distinguere.**

### US-06 — Una conferma che posso rileggere e mostrare `[MUST]`
**Come Anna, voglio una conferma finale che dica in chiaro cosa, dove, quando, cosa portare,
quanto pago e come disdire, così da non avere paura di aver sbagliato e da poterla far vedere a
mio figlio.**

### US-07 — Poter cambiare idea senza ricominciare `[MUST]`
**Come Anna, voglio poter tornare indietro e correggere un passo, così da non perdere tutto
quando sbaglio e da non temere di restare incastrata.**

### US-08 — Leggere e toccare senza fatica `[MUST]`
**Come Anna, voglio testo grande, contrasto forte e pulsanti ampi sul mio telefono, così da usare
il servizio senza occhiali e senza sbagliare a toccare.**

### Requisiti di dimostrazione (non user story)

Richiesti dal tema ma non riconducibili a un bisogno di Anna: si tracciano separatamente perché
PLAN li deve pianificare comunque.

- **RD-01 `[MUST]`** — replica realistica del percorso CUP "prima" (almeno gli schermi 1–4 del §2,
  incluso il messaggio d'errore opaco), necessaria per mostrare il contrasto prima/dopo in demo.
- **RD-02 `[MUST]`** — schermata "Autonomia & Limiti" che espone i contatori del §6 misurati sulla
  sessione appena conclusa, e i limiti dichiarati.
- **RD-03 `[MUST]`** — tracciamento, nella documentazione e nel registro gate di
  `agents/PIPELINE.md`, di **dove l'AI ha contribuito e dove è servita revisione umana**.

---

## 4. Criteri di accettazione

Verificabili dall'esterno, senza leggere il codice. Sono il contratto per BUILD e la base di
tracciamento per PLAN. Gli scenari Gherkin li scrive UX (fase 2) a partire da qui.

### US-01 — Non trascrivere codici
- **AC-01.1** Dallo schermo iniziale l'azione "Fotografa la ricetta" è raggiungibile con **un solo
  tocco**, senza registrazione, senza login, senza SPID.
- **AC-01.2** Il sistema accetta una **fotografia reale** di un promemoria su carta (file immagine
  da fotocamera, non un JSON precompilato) e ne estrae almeno: **NRE**, **prestazione prescritta**,
  **classe di priorità** se presente, **codice esenzione** se presente.
- **AC-01.3** Nel percorso nominale Anna **non digita nessun codice**: numero di campi di testo che
  deve compilare per arrivare alla proposta di appuntamento = **0**.
- **AC-01.4** L'NRE ricostruito è di **15 caratteri** e viene mostrato ad Anna **spezzato in gruppi
  leggibili**, con l'indicazione di dove si trova sulla sua ricetta.
- **AC-01.5** L'immagine caricata non lascia il dispositivo verso servizi non dichiarati: le
  destinazioni dei dati sono elencate in chiaro nella schermata di caricamento.

### US-02 — Riconoscere la mia visita in parole mie
- **AC-02.1** Dopo la lettura compare **una sola domanda**, in una frase, con la prestazione
  espressa in linguaggio comune (es. *"È una visita oculistica, giusto?"*) e due risposte:
  **"Sì, è questa" / "No, non è questa"**.
- **AC-02.2** Accanto alla riformulazione è sempre disponibile **il testo originale della ricetta,
  citato alla lettera**, raggiungibile in un tocco. La riformulazione non sostituisce mai la
  citazione: l'affianca. *(guardrail G-03)*
- **AC-02.3** Se Anna risponde **"No, non è questa"** il sistema **non procede** e le offre una via
  di recupero (rifare la foto oppure la lettura guidata di US-03). Non tira a indovinare.
- **AC-02.4** Quando la confidenza di lettura su un campo è bassa, il campo è **marcato come da
  verificare** e mostrato accanto al ritaglio della foto da cui è stato letto.

### US-03 — Non essere rimandata al modulo
- **AC-03.1** Quando la lettura automatica fallisce, il sistema mostra **la foto di Anna** con
  **evidenziata l'area** da leggere, e un'istruzione in una frase (es. *"Copia il numero sotto il
  primo codice a barre, poi quello sotto il secondo"*).
- **AC-03.2** L'inserimento guidato è **spezzato nei due segmenti stampati sulla ricetta** (5 + 10
  caratteri), non in un unico campo da 15.
- **AC-03.3** La validazione è **immediata e per segmento**: l'errore dice **quale** segmento non
  torna e **quanti caratteri** ci si aspetta. Il testo *"Codice non valido"*, da solo, è un
  fallimento del criterio.
- **AC-03.4** Da questo schermo è sempre possibile **rifare la foto** senza perdere i dati già
  confermati.

### US-04 — Capire le parole del servizio
- **AC-04.1** Ogni termine amministrativo mostrato ad Anna (**NRE, branca specialistica, classe di
  priorità, struttura erogatrice, esenzione, regime**) ha un'affordance **"Che significa?"**
  visibile, non nascosta in un tooltip a passaggio del mouse.
- **AC-04.2** La spiegazione è **massimo 2 frasi**, in italiano comune, e dice **cosa deve fare
  Anna**, non com'è fatto il sistema.
- **AC-04.3** La spiegazione della **classe di priorità** riporta **la lettera come stampata sulla
  ricetta** e il solo significato **organizzativo** (entro quanto tempo il servizio deve fissare
  l'appuntamento). Non contiene giudizi su gravità, urgenza clinica o condizione di salute.
  *(guardrail G-01)*
- **AC-04.4** Nessuna spiegazione è generata al volo in modo non verificabile: i testi sono
  **fissi, versionati nel repository e leggibili da un revisore umano**. *(guardrail G-04, RD-03)*

### US-05 — Scegliere fra poche cose
- **AC-05.1** Ad Anna vengono proposte **da 2 a 3 alternative**, mai di più, in una schermata sola.
- **AC-05.2** Ogni alternativa è etichettata nel linguaggio del bisogno (**"La prima data
  disponibile"**, **"Più vicino a casa"**) e riporta sotto, in chiaro: **giorno, ora, luogo,
  indirizzo**.
- **AC-05.3** Anna **non vede mai** un menu di branche specialistiche né un elenco di strutture
  erogatrici: quelle informazioni sono derivate dalla ricetta o dalla preferenza espressa.
- **AC-05.4** La preferenza è espressa con **una domanda sola** a risposta chiusa
  (es. *"Le interessa di più fare presto o stare vicino a casa?"*).
- **AC-05.5** Le proposte **rispettano i vincoli scritti sulla ricetta** (prestazione e classe di
  priorità): nessuna proposta viola la finestra temporale della classe indicata.

### US-06 — Conferma rileggibile
- **AC-06.1** La schermata di conferma contiene, **in quest'ordine e con etichette in linguaggio
  comune**: *che visita è* · *quando* · *dove (nome e indirizzo)* · *cosa portare* · *quanto paga
  (o "non paga, ha l'esenzione …")* · *come disdire*.
- **AC-06.2** La conferma è **salvabile e mostrabile offline** (almeno: pagina stampabile o
  immagine/PDF scaricabile), senza richiedere un account.
- **AC-06.3** Il testo della conferma è leggibile **senza scorrere orizzontalmente** a 375 px di
  larghezza e resta leggibile con **zoom del browser al 200%**.
- **AC-06.4** Il codice di prenotazione è mostrato **a gruppi** e accompagnato da *"lo serve solo
  se vuole disdire"*.
- **AC-06.5** La conferma **non contiene alcuna informazione clinica** oltre alla citazione
  testuale della prestazione prescritta. *(guardrail G-01, G-03)*

### US-07 — Cambiare idea
- **AC-07.1** Ogni schermo del percorso ha un ritorno al passo precedente **etichettato a parole**
  (es. *"Torna alla scelta della data"*), non una sola freccia.
- **AC-07.2** Tornando indietro, **i dati letti dalla ricetta restano**: Anna non rifà la foto.
- **AC-07.3** Nessun passo del percorso è irreversibile **prima** della schermata di conferma
  finale, e la conferma finale chiede un assenso esplicito.

### US-08 — Leggere e toccare senza fatica
- **AC-08.1** Interfaccia costruita con i componenti di **Bootstrap Italia**; ogni deroga è
  motivata per iscritto nel deliverable UX o in un ADR.
- **AC-08.2** Contrasto conforme a **WCAG 2.1 livello AA**; corpo del testo ≥ 18 px; nessuna
  informazione veicolata **dal solo colore**.
- **AC-08.3** Aree toccabili ≥ **44 × 44 px**; nessun gesto fine (trascinamento, pizzico) richiesto
  per completare il percorso.
- **AC-08.4** Il percorso è completabile **da solo tastiera** e ogni schermo ha un **titolo di
  livello 1** univoco; i campi hanno etichetta programmaticamente associata.
- **AC-08.5** **Un'azione principale per schermo**, evidente senza scorrere.

### RD-01 — Percorso "prima"
- **AC-RD1.1** Esiste uno schermo che riproduce il modulo CUP di accesso con **campo NRE da 15
  caratteri**, campo codice fiscale e messaggio d'errore **"Codice non valido"** privo di
  indicazioni, raggiungibile in demo in un tocco dalla schermata iniziale.
- **AC-RD1.2** La replica è **dichiaratamente una simulazione**: non usa loghi, marchi o nomi di
  enti reali, e lo dichiara in pagina. *(guardrail G-02)*

### RD-02 — Autonomia & Limiti
- **AC-RD2.1** A fine percorso è raggiungibile una schermata che mostra i contatori del §6 **per la
  sessione appena conclusa**, con i valori "prima" (misurati sulla replica RD-01) accanto ai
  valori "dopo".
- **AC-RD2.2** La stessa schermata elenca in chiaro i **limiti residui** dichiarati in §5.

---

## 5. Ambito escluso

### Guardrail di dominio (`_case.md`) — non negoziabili

| ID | Guardrail | Come si manifesta nei requisiti |
|---|---|---|
| **G-01** | **No diagnosi, no triage clinico, no consigli medici.** | CarePath non interpreta *perché* la visita è stata prescritta, non valuta sintomi, non suggerisce prestazioni alternative, non commenta l'urgenza. Se un contenuto sconfina nel clinico (es. quesito diagnostico sulla ricetta) viene **citato alla lettera** e mai riformulato — AC-02.2, AC-04.3, AC-06.5 |
| **G-02** | **Nessun dato sanitario reale** in mock, fixture e test. | Solo facsimili con dati oscurati o fixture sintetiche. La replica CUP non imita enti reali — AC-RD1.2 |
| **G-03** | **Non alterare il significato di ciò che è scritto sulla ricetta.** | Ogni semplificazione è **additiva**: affianca la citazione originale, non la sostituisce — AC-02.2 |
| **G-04** | **Uso dell'AI spiegabile.** | L'AI legge l'immagine; i testi mostrati ad Anna sono fissi e revisionati da umani — AC-04.4, RD-03 |

### Fuori ambito, con motivazione

| Escluso | Perché |
|---|---|
| **Integrazione con un CUP reale / API regionali** | fuori dal budget di 5 ore e dipendente da accreditamenti. Il booking è **simulato**, e la demo lo dichiara. Una versione produttiva richiederebbe inoltre: (a) una chiamata API a un registro ASL reale (qui l'area ASL è letta dalla ricetta, nessuna rete); (b) se il catalogo del CUP target usa nomi/ID di prestazione diversi dal nomenclatore nazionale, un livello di matching semantico fra testo estratto e catalogo — potenzialmente un LLM, con revisione umana per non violare G-01/G-03. Nessuno dei due è implementato: sono limiti dichiarati, non debito nascosto |
| **SPID / CIE** | è una barriera reale per Anna, ma risolverla non è nelle nostre mani: richiede un'identità digitale che lei non ha. CarePath lavora sul percorso **senza SPID**, che è quello effettivamente percorribile |
| **Input vocale** (should-have del concept) | la barriera di Anna **non è digitare**: è non sapere *cosa* digitare. La voce aggiunge superficie tecnica senza togliere il blocco. Sotto la linea del must-have |
| **Promemoria al caregiver via SMS/email** (should-have del concept) | notificare il figlio **sposta** l'autonomia invece di darla ad Anna, e richiede integrazioni esterne. Escluso per coerenza col tema, non solo per budget. La conferma resta **mostrabile** da Anna a chi vuole (AC-06.2) |
| **TTS / lettura vocale dell'interfaccia** | valore reale ma non sul blocco principale; dipende da compatibilità browser. Sotto la linea |
| **Account, storico prenotazioni, disdetta in-app** | la disdetta è **spiegata** (AC-06.1), non eseguita: eseguirla richiede il sistema reale |
| **Gestione di più prestazioni sulla stessa ricetta** | il percorso demo copre **una prestazione**. Se la ricetta ne contiene più di una, il sistema lo dichiara e si ferma anziché scegliere al posto di Anna |
| **Ricette rosse cartacee (non dematerializzate)** | formato diverso, fuori dal percorso dimostrato |
| **Analytics sui blocchi utente** (nice-later del concept) | strumento per il team, non per Anna |
| **Test con utenti reali** (i "5 utenti" della call to action del concept) | non eseguibile in 5 ore. Le metriche del §6 sono **strumentali e misurate sulla sessione**, non validate su campo: è un limite dichiarato in RD-02 |

---

## 6. Metriche di autonomia

"Prima" = percorso sulla replica RD-01 (§2). "Dopo" = percorso CarePath. Sono contatori
**osservabili durante la demo**, non stime.

| # | Metrica | Prima (RD-01) | Obiettivo dopo | Come si misura |
|---|---|---|---|---|
| **M1** | **Campi di testo che Anna compila a mano** nel percorso nominale | ≥ 2 (NRE 15 caratteri + codice fiscale 16) | **0** | conteggio dei campi di input attraversati fino alla conferma |
| **M2** | **Termini amministrativi che deve conoscere senza spiegazione** | 5 (NRE, branca, prestazione a catalogo, priorità, struttura erogatrice) | **0** — ogni termine mostrato ha "Che significa?" | ispezione degli schermi: termine senza affordance = difetto |
| **M3** | **Decisioni richieste**, e ampiezza di ciascuna | **~6** (branca, prestazione, struttura, slot — scelte fra decine di opzioni; §2, stessa regola di conteggio) | **≤ 4 decisioni**, ciascuna fra **≤ 3 opzioni** | conta gli schermi con **alternative fra cui scegliere**, incluse le conferme (S-04, S-06, S-07, S-08 = 4 nel percorso senza intoppi). **Non** conta S-02 (scattare/scegliere dalla galleria): è un metodo per fornire la foto, non una decisione sulla visita. Se scatta il fallback US-03, S-04b aggiunge una scelta in più: dichiarato come limite, non nascosto (architecture.md §4.7) |
| **M4** | **Errori bloccanti prima di procedere** | ≥ 1 (`Codice non valido`, senza recupero) | **0 errori senza recupero guidato** | ogni stato d'errore deve offrire un'azione successiva che porta avanti (AC-03.1/03.3) |
| **M5** | **Passi fino alla conferma** | **10** (§2, esclusa la schermata di solo esito — stessa regola applicata al "dopo") | **≤ 8** | conta i passi che **richiedono un'azione della persona**, esclusi gli stati di sola attesa e la schermata di solo esito. Percorso senza intoppi: 6. Con il fallback US-03 (foto da rileggere): 7-8 — il target include questo ramo, non solo il percorso ideale (architecture.md §4.7) |
| **M6** | **Task completato senza aiuto esterno** | **no** (chiama il figlio o il call center) | **sì** | percorso completato dall'inizio alla conferma senza uscire dall'app e senza input che Anna non sa produrre |
| **M7** | **Fedeltà del significato** | — | **100%** dei campi mostrati riconducibili alla citazione originale | per ogni informazione a schermo esiste il testo originale della ricetta consultabile (AC-02.2) |

**M6 è la metrica che conta.** Le altre spiegano *perché* passa da no a sì. Nessuna di queste
metriche è validata con utenti reali dentro il budget: è un limite dichiarato (§5, AC-RD2.2).

---

## 7. Decisioni aperte

Non chiudibili dall'auto-critica: richiedono un arbitrato umano o un ADR.

| # | Decisione | Nodo | Chi arbitra |
|---|---|---|---|
| ~~**D-01**~~ | ~~**Spiegare la classe di priorità è navigazione o sconfina nel clinico?**~~ | **CHIUSO (umano, Gate 1).** La classe di priorità è **estratta dalla foto e passata automaticamente** al sistema di prenotazione; Anna non deve inserirla né comprenderla per completare il percorso. Se lo chiede, AC-04.3 resta disponibile on-request, con il solo significato organizzativo. Non è un campo che Anna tocca: la frizione è rimossa a monte, non spiegata a valle. | ✅ chiuso |
| ~~**D-02**~~ | ~~**Fixture mancante.**~~ | **CHIUSO (umano, prima di Gate 1).** La fixture è ora `intake/idea/Example files/image.png`: ricetta elettronica Regione Piemonte per **VISITA ORTOPEDICA DI CONTROLLO** (89.01.G), NRE `010A2` + `4518061015` = `010A24518061015` (15 caratteri). Copre AC-01.2; i dati anagrafici visibili (MARIO ROSSI) sono sufficientemente generici da non costituire un dato sanitario sensibile (G-02). | ✅ chiuso |
| **D-03** | **Provider di lettura immagine** e comportamento **offline in demo** | CLAUDE.md impone lettura di immagini reali: le fixture non sostituiscono la funzione. Ma una demo live da 3 minuti non può dipendere da una chiamata di rete incerta. Serve un piano B dichiarato che non simuli l'AI di nascosto (G-04) | **ARCH, ADR** |
| **D-04** | **Quanto realistica può essere la replica CUP "prima"** senza imitare un portale pubblico reale | il contrasto prima/dopo è tanto più forte quanto più la replica è fedele; loghi e nomi di enti reali sono esclusi (AC-RD1.2). Dove sta la linea | **umano, Gate 1** |
| **D-05** | **Cosa fa il sistema quando la lettura è parziale** ma sufficiente a procedere | proseguire marcando il campo come da verificare (AC-02.4) accelera, ma introduce il rischio di prenotare sulla base di un dato letto male. Soglia di confidenza e comportamento sopra/sotto soglia | **ARCH + UX** |
| **D-06** | **"Più vicino a casa" richiede di sapere dove abita Anna** | chiederle l'indirizzo introduce un campo di testo (contro M1) e un dato personale. Alternative: chiedere solo il **comune** da una lista breve, o derivarlo dalla ASL sulla ricetta. Nessuna è gratis | **UX**, prima di Gate 1 |

---

## Note di auto-critica (tracciate, non risolte nel documento)

- **Tagliata** la storia "promemoria al caregiver" presente come *should-have* nel concept di
  intake: se implementata **non aumenta l'autonomia di Anna**, la delega. Motivazione registrata
  in §5.
- **Tagliato** l'input vocale: agisce sulla digitazione, che non è la barriera.
- Verificato che nessuna user story descrive un prodotto per sviluppatori: RD-01/02/03 sono
  esplicitamente marcati come **requisiti di dimostrazione**, non come bisogni di Anna, proprio
  per non camuffarli da user story.
- Verificato che ogni criterio di accettazione sia osservabile da fuori: quelli originariamente
  formulati come "il sistema usa X" sono stati riscritti come "ad Anna appare X".

---

## Riferimenti

- Developers Italia — https://developers.italia.it/it
- Design system .italia — https://designers.italia.it/design-system/
- Accessibilità by-design (percepibile, utilizzabile, comprensibile, robusto; WCAG 2.1 AA,
  UNI CEI EN 301549:2021) — https://designers.italia.it/design-system/fondamenti/accessibilita/
- Bootstrap Italia, per sviluppatori — https://designers.italia.it/design-system/come-iniziare/per-sviluppatori/
- Manuale operativo di design — https://docs.italia.it/italia/designers-italia/manuale-operativo-design-docs/it/versione-corrente/
- Linee guida di design per i servizi digitali della PA (AgID, art. 53 CAD) — https://www.agid.gov.it/sites/default/files/repository_files/design-italia.pdf
- Intake: `intake/idea/CarePath_Hackathon_Concept.pptx`, `intake/idea/Example files/image.png`
  (ricetta specialistica Regione Piemonte, VISITA ORTOPEDICA DI CONTROLLO, NRE 010A2+4518061015),
  `intake/hackaton-rules/hagenthon-temi-sfida-2.html`
