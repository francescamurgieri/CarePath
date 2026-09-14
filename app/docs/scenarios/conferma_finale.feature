# language: it

Funzionalità: Ricevere una conferma che si può rileggere e mostrare
  Come Anna
  Voglio una conferma finale che dica in chiaro cosa, dove, quando, cosa portare,
  quanto pago e come disdire
  Così da non avere paura di aver sbagliato e da poterla far vedere a mio figlio

  Contesto:
    Dato che Anna ha scelto un appuntamento
    E sta guardando il riepilogo prima di confermare

  Scenario: Il riepilogo contiene tutte le informazioni nell'ordine giusto
    Allora vede nell'ordine:
      | Che visita è                      |
      | Quando (giorno e ora)             |
      | Dove (nome e indirizzo completo)  |
      | Cosa portare                      |
      | Quanto paga (o spiegazione esenzione) |
      | Come disdire                      |
    E il codice di prenotazione è scritto a gruppi separati
    E accanto al codice c'è scritto "lo serve solo se vuole disdire"
    E non vede nessuna informazione medica oltre al nome della visita

  Scenario: Anna legge il riepilogo con il testo ingrandito al 200%
    Dato che Anna ha ingrandito il testo al 200% nelle impostazioni del telefono
    Quando guarda il riepilogo
    Allora il testo non si sovrappone
    E non c'è nessuna barra di scorrimento orizzontale
    E il pulsante di conferma è ancora visibile e toccabile

  Scenario: Anna tocca "Confermo l'appuntamento"
    Quando tocca "Confermo l'appuntamento"
    Allora vede scritto "Prenotazione confermata"
    E il riepilogo rimane visibile sotto il messaggio di conferma
    E vede un pulsante per salvare o stampare la pagina

  Scenario: Anna salva la conferma senza avere un account
    Dato che la prenotazione è stata confermata
    Quando tocca "Salva o stampa"
    Allora può salvare o stampare il foglio di conferma
    E per farlo non deve registrarsi né fare il login

  Scenario: Anna vuole tornare indietro prima di confermare
    Dato che Anna sta guardando il riepilogo
    Quando tocca "Torna a scegliere la data"
    Allora torna alla schermata degli appuntamenti
    E nessun dato è andato perso
    E la prenotazione non è stata fatta
    Perché la prenotazione viene fatta solo dopo che tocca "Confermo l'appuntamento"

  Scenario: Il codice esenzione viene spiegato senza che Anna lo cerchi
    Dato che la ricetta contiene un codice di esenzione
    Quando Anna guarda la sezione "Quanto paga"
    Allora vede scritto "Non paga il ticket — ha l'esenzione"
    E vede un link "Che significa esenzione?"
    Quando lo tocca
    Allora vede una spiegazione in due frasi in parole comuni
