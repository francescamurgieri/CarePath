# ADR-0007 — Integrazione del servizio target: prenotazione simulata dietro interfaccia, dichiarata ad Anna

**Fase 3 · ARCH** · criteri: *decide come si integra il servizio target, reale o simulato* ·
*sostituisce una capacità reale con un mock*

## Contesto

Il servizio target di `_case.md` è **il portale CUP (reale o realisticamente simulato)**.
Il PRD §5 ha già escluso l'integrazione con un CUP reale: fuori dal budget di 5 ore e dipendente
da accreditamenti regionali. La prenotazione è **simulata**, e la demo deve dichiararlo.

Qui va applicata la regola invariante di CLAUDE.md: *i mock sono fixture di test automation,
mai un sostituto funzionale di una capacità promessa*. La domanda da porsi è quindi: **la
prenotazione su un CUP reale è una capacità promessa?**

No — ed è una differenza sostanziale rispetto alla lettura dell'immagine. La lettura è promessa
(il prodotto esiste per quello) e infatti non è mockabile (ADR-0004). La trasmissione al CUP è
esplicitamente fuori ambito nel PRD, è dichiarata fra i limiti residui di S-11 e non compare in
nessuna user story di Anna: Anna vuole **arrivare a un appuntamento comprensibile**, e il
percorso che porta lì è tutto dentro CarePath.

Resta però un problema di verità che nessun documento a monte ha risolto: la schermata S-09
descritta in `ux-spec.md` produce una conferma **indistinguibile da una reale**, salvabile e
stampabile. Una persona che porti quel foglio a un poliambulatorio non ha un appuntamento.

## Decisione

**Il servizio di prenotazione esiste come interfaccia; l'unica implementazione è simulata; la
simulazione è dichiarata dentro il tipo, e quindi obbligatoriamente a schermo.**

### 1. Interfaccia e contratto

```ts
interface ServizioPrenotazione {
  cercaProposte(r: RichiestaProposte): Promise<Risultato<PropostaAppuntamento[]>>;
  conferma(r: RichiestaPrenotazione): Promise<Risultato<PrenotazioneConfermata>>;
}
```

| Voce | `cercaProposte` | `conferma` |
|---|---|---|
| Latenza simulata | 400–900 ms | 600–1 200 ms |
| Timeout | 5 000 ms | 8 000 ms |
| Errori | `NESSUNA_DISPONIBILITA` → recupero `contattoTelefonico` (copy S-07) | `PRENOTAZIONE_FALLITA` → recupero `riprova` |
| Determinismo nei test | latenza e `riferimentoTemporale` iniettati; a `latenzaMs = 0` è sincrono e ripetibile | idem |

La latenza non è decorativa: esiste perché gli stati di caricamento di S-07 e S-08 siano
percorsi reali e testati, non rami morti che si scoprono rotti il giorno della demo.

### 2. La simulazione è nel tipo

```ts
interface PrenotazioneConfermata {
  …
  simulazione: { simulata: true; dichiarazione: string };   // obbligatorio, non booleano
}
```

Non è un flag che si può dimenticare di leggere: è un campo obbligatorio che porta con sé il
testo da mostrare. Il componente di conferma non può renderizzare una prenotazione senza avere
in mano la dichiarazione. La dichiarazione compare **in testa** a S-08/S-09, non in fondo, e
resta nella versione stampata (AC-06.2). → vedi rilievo **R-1** in `architecture.md` §10: il
copy va concordato con UX.

### 3. Invarianti applicati dall'implementazione

- **AC-05.1** — `risultato.length ≤ r.massimoProposte` (il tipo ammette solo `2 | 3`).
- **AC-05.5** — nessuna proposta con `giorniDiAttesa` oltre la `finestraMassimaGiorni` della
  classe di priorità letta. Se la classe non è stata letta, si usa la finestra più larga (`P`,
  180 giorni) e **non si filtra**: non si inventa un vincolo che la ricetta non dice.
- **AC-05.3** — l'input è la prestazione (e la branca derivata); nessun elenco di strutture o
  di branche viene mai esposto alla UI.
- **D-06** — con preferenza `vicino_casa` si filtra per `codiceAsl`; se l'ASL non è stata letta
  si applica il degrado di ADR-0005 (domanda chiusa su 3 aree).

### 4. Fixture

`src/fixtures/agende.json`: strutture e slot **sintetici**. Vincoli non negoziabili (G-02,
AC-RD1.2):

- nomi di struttura **palesemente fittizi**, che non corrispondono ad alcun ente reale
  (esempi ammessi: *Poliambulatorio Le Ginestre*, *Presidio Sanitario Valle Chiara*);
- nessun logo, nessun marchio, nessun dominio, nessuna partita IVA;
- numero di telefono fittizio riconoscibile (`800 000 000`);
- nessun dato anagrafico oltre a quelli già presenti nella fixture di intake;
- gli slot sono generati **relativi a `riferimentoTemporale`**, mai date assolute: la demo non
  deve mostrare appuntamenti nel passato fra un mese.

→ vedi rilievo **R-2** e **R-6** in `architecture.md` §10: i nomi usati in `ux-spec.md` §S-07
vanno allineati a questo vincolo.

### 5. Cosa non si fa

Non esiste alcun percorso in cui CarePath **dica o lasci intendere** di aver trasmesso una
prenotazione a un ente reale. Il confine fra "percorso reale" (leggere, capire, scegliere) e
"capacità simulata" (trasmettere) è dichiarato a schermo, non solo nei documenti.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Integrazione con un CUP regionale reale** | richiede accreditamento e credenziali: impossibile in 10 ore-uomo, e già escluso dal PRD §5 |
| **Backend finto ma "vero"** (server locale con API REST) | aggiungerebbe realismo architetturale e un processo da tenere vivo in demo. Contraddice ADR-0002 senza aggiungere nulla per Anna |
| **Slot generati casualmente a ogni caricamento** | la demo diventa irripetibile e i test non deterministici |
| **Non dichiarare la simulazione nella UI, solo nella documentazione** | è quello che i documenti a monte facevano implicitamente. Produce una conferma che può essere creduta vera: inaccettabile |
| **Chiamare la conferma "prenotazione di prova" ovunque** | onesto ma svilisce l'esperienza che si vuole dimostrare. La dichiarazione in testa a S-08/S-09 dice la stessa cosa senza svuotare il percorso |

## Conseguenze

- **Positive** — il confine col servizio target è una interfaccia sola: un'integrazione reale
  futura sostituisce un file senza toccare la UI. Il rischio etico è recintato nel tipo.
  I test sono deterministici a latenza zero.
- **Negative** — la dichiarazione di simulazione occupa spazio prezioso in testa alla schermata
  più importante del prodotto. È il prezzo della verità, e va progettato con UX perché non
  competa con il messaggio di conferma (R-1).
- **Dipendenza aperta** — il contenuto esatto di `agende.json` è lasciato a BUILD entro questi
  vincoli; è un debito dichiarato in `architecture.md` §9.

## Stato

**Accettato** — 2026-09-14. Il punto 2 (dichiarazione a schermo) va portato al Gate 2 come
rilievo BLOCCANTE verso `ux-spec.md`.
