# ADR-0006 — Contratti dei tipi e modello di stato: gli invarianti del prodotto sono tipi

**Fase 3 · ARCH** · criteri: *scelta strutturale — definisce il contratto che BUILD non può
cambiare senza tornare all'architettura*

## Contesto

Il PRD contiene invarianti che, se violati, non rompono nulla di visibile e producono comunque
una schermata plausibile. Sono i più pericolosi:

- **AC-02.3** — se Anna dice "No, non è questa", il sistema non procede e **non tira a indovinare**.
- **AC-02.4** — un campo a bassa confidenza è mostrato accanto al ritaglio della foto.
- **AC-07.3** — nessun passo è irreversibile prima della conferma finale.
- **M4** — nessun errore senza recupero guidato.
- **G-03** — ogni informazione mostrata ha accanto la citazione originale.

In una fase di BUILD da 10 ore-uomo, condotta da un agente su specifiche lunghe, un invariante
affidato alla disciplina è un invariante perduto. L'unico modo per farlo sopravvivere è renderlo
**non rappresentabile**: se lo stato sbagliato non ha un tipo, non si può scrivere.

C'è poi un vincolo funzionale: AC-07.2 e AC-03.4 richiedono che tornando indietro i dati
restino, e che rifare la foto non cancelli ciò che Anna ha già inserito a mano.

## Decisione

**Un solo oggetto di stato, una macchina a stati esplicita, e invarianti codificati nei tipi.**
Definizione completa in `architecture.md` §3.

### 1. `CampoLetto<T>` come unione discriminata

```ts
type CampoLetto<T> =
  | { stato: 'certo';        valore: T; citazioneOriginale: string; …; riquadro: Riquadro | null }
  | { stato: 'daVerificare'; valore: T; citazioneOriginale: string; …; riquadro: Riquadro }
  | { stato: 'nonLetto';                                            …; riquadro: Riquadro | null };
```

- `nonLetto` **non ha `valore`**: leggere un campo non letto non compila → AC-02.3.
- `daVerificare` **ha `riquadro` obbligatorio**: mostrarlo senza ritaglio non compila → AC-02.4.
- `citazioneOriginale` è non-nullable su ogni campo usabile → G-03.

### 2. `RicettaConfermata` come tipo opaco

Marchiato con un `unique symbol`, costruibile **solo** da `confermaLettura()`. Il servizio di
prenotazione accetta `RicettaConfermata` e **non** `LetturaRicetta`: prenotare su una lettura
che Anna non ha confermato è impossibile per costruzione, non per convenzione.

### 3. `ErroreCarePath` con recupero obbligatorio

`recupero: AzioneDiRecupero` non è opzionale. Un errore senza via d'uscita non è
rappresentabile: **M4 = 0 diventa una proprietà di tipo**, non un obiettivo da verificare a mano.
Nessun servizio lancia eccezioni verso la UI: tutti restituiscono `Risultato<T, ErroreCarePath>`.

### 4. `assensoEsplicito: true` su `RichiestaPrenotazione`

Il tipo letterale obbliga il chiamante a dichiarare l'assenso. Non impedisce fisicamente un
abuso, ma rende l'unico passo irreversibile (AC-07.3) **visibile nel punto di chiamata**, dove
una review lo trova.

### 5. Stato: un `useReducer`, non uno store

`StatoSessione` è un oggetto solo, gestito da `macchinaSessione.ts`. Regole:

- **i campi si azzerano solo in avanti**: tornare indietro cambia `schermoCorrente` e nient'altro
  (AC-07.2, scenario *"Anna può tornare indietro senza perdere la foto"*);
- solo una **nuova acquisizione** in S-02 azzera `lettura`, e `campiInseritiDallaPersona`
  sopravvive (AC-03.4);
- il reducer sincronizza `history.pushState`, così il tasto "indietro" del telefono funziona
  senza introdurre un router (ADR-0001);
- il reducer è **puro**: gli scenari di navigazione si testano senza renderizzare nulla.

### 6. Dominio senza React

`src/dominio/` e `src/servizi/` non importano React. È ciò che rende `estraiCampi` e il
servizio di prenotazione attaccabili da un test BDD dall'esterno, senza browser.

## Alternative valutate

| Alternativa | Perché scartata |
|---|---|
| **Tipi piatti con flag** (`valore: T \| null; affidabile: boolean`) | è la forma naturale, e permette di leggere `valore` dimenticando il flag: esattamente il bug che AC-02.3 vieta. Un `null` che compila è un invariante perso |
| **Zod / validazione a runtime** | utile ai confini di rete — che qui non esistono (ADR-0002). Costo senza beneficio nel budget |
| **Redux / Zustand** | store globale per uno stato di sessione lineare: dipendenza e boilerplate senza guadagno |
| **React Router con stato nelle route** | il back del browser arriverebbe gratis, ma lo stato andrebbe comunque tenuto altrove per AC-07.2; `history.pushState` dal reducer costa una decina di righe |
| **Persistere lo stato per sopravvivere al reload** | scriverebbe dati sanitari sul dispositivo: escluso da ADR-0002 |

## Conseguenze

- **Positive** — cinque criteri di accettazione e una metrica passano da "da verificare" a
  "verificato dal compilatore". BUILD non deve ricordarsene: non può sbagliare senza che il
  build fallisca. Il dominio puro rende i test BDD economici, il che conta nel budget.
- **Negative** — le unioni discriminate richiedono `switch` sullo `stato` nei componenti: più
  verboso di un `if (campo.valore)`. È il costo, ed è voluto. Il tipo opaco `RicettaConfermata`
  obbliga a passare da `confermaLettura()` anche nei test: si fornisce un helper di test
  dedicato, non un cast.
- **Vincolo su BUILD** — nessun `as` per aggirare `RicettaConfermata`; nessun `ErroreCarePath`
  costruito con un `recupero` fittizio pur di far compilare.

## Stato

**Accettato** — 2026-09-14. È il contratto verso BUILD: modificarlo richiede un nuovo ADR.
