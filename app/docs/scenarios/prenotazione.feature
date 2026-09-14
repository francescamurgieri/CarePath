# language: it

Funzionalità: Prenotare una visita fotografando la ricetta
  Come Anna
  Voglio fotografare il foglio che mi ha dato il medico
  Così da prenotare la visita da sola, senza dover capire codici che non conosco

  Contesto:
    Dato che Anna ha in mano il promemoria della ricetta per una visita ortopedica
    E Anna ha aperto CarePath sul suo telefono
    E Anna non ha SPID

  Scenario: Anna fotografa la ricetta e prenota con la prima data disponibile
    Dato che Anna è sulla schermata di benvenuto
    Quando tocca "Fotografa la ricetta"
    Allora vede le istruzioni per fotografare il foglio
    E vede scritto dove vanno a finire i dati della sua foto
    Quando scatta la foto del promemoria
    Allora vede scritto "Sto leggendo la ricetta..." mentre aspetta
    Quando la lettura è finita
    Allora vede scritto "Visita ortopedica di controllo" in parole semplici
    E vede il testo originale della ricetta affiancato, non al suo posto
    E può toccare "Che significa NRE?" senza uscire dalla pagina
    Quando tocca "Sì, è questa"
    Allora le viene chiesto solo una cosa: "Cosa le interessa di più?"
    Quando sceglie "Fare presto"
    Allora vede al massimo tre proposte di appuntamento
    E ogni proposta ha scritto il giorno, l'ora, il nome del posto e l'indirizzo
    E non vede nessun menu di branche specialistiche
    Quando sceglie la prima proposta e tocca "Scelgo questo appuntamento"
    Allora vede il riepilogo completo in quest'ordine:
      | Che visita è         |
      | Quando               |
      | Dove                 |
      | Cosa portare         |
      | Quanto paga          |
      | Come disdire         |
    Quando tocca "Confermo l'appuntamento"
    Allora vede scritto "Prenotazione confermata"
    E può salvare o stampare la pagina senza avere un account

  Scenario: Anna non ha digitato nessun codice per arrivare alla conferma
    Dato che Anna ha completato la prenotazione con il percorso nominale
    Allora il numero di campi di testo che ha compilato è zero
    E ogni termine amministrativo che ha visto aveva un pulsante "Che significa?"
    E ha preso al massimo due decisioni durante tutto il percorso

  Scenario: Anna può tornare indietro senza perdere la foto
    Dato che Anna ha già confermato la visita sul terzo schermo
    E ha scelto "Fare presto" sulla schermata della preferenza
    Quando tocca "Torna a scegliere la data"
    Allora torna alla scelta fra le proposte
    E la foto non viene richiesta di nuovo
    E la visita è ancora quella confermata prima
    Quando torna indietro ancora fino alla conferma della visita
    Allora vede ancora "Visita ortopedica di controllo"
    E la foto non viene richiesta di nuovo
