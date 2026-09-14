# language: it

Funzionalità: Scegliere un appuntamento fra poche opzioni comprensibili
  Come Anna
  Voglio scegliere fra due o tre proposte descritte come "prima data disponibile"
  o "più vicino a casa"
  Così da decidere su ciò che conta per me invece che su strutture e agende
  che non so distinguere

  Contesto:
    Dato che Anna ha confermato la visita letta dalla ricetta
    E il sistema ha estratto la classe di priorità dalla ricetta senza chiederla ad Anna

  Scenario: Anna viene richiesta solo di una preferenza
    Quando arriva alla schermata della preferenza
    Allora vede una sola domanda: "Cosa le interessa di più?"
    E vede solo due opzioni: "Fare presto" e "Stare vicino a casa"
    E non vede nessun menu di branche specialistiche
    E non vede nessun elenco di strutture con sigle o codici

  Scenario: Anna sceglie "Fare presto" e vede le proposte
    Dato che Anna è sulla schermata della preferenza
    Quando sceglie "Fare presto" e tocca "Mostrami le proposte"
    Allora vede al massimo tre schede appuntamento
    E ogni scheda ha scritto il giorno per esteso (per esempio "Martedì 22 ottobre 2024")
    E ogni scheda ha scritto l'ora
    E ogni scheda ha scritto il nome del posto e l'indirizzo
    E nessuna scheda ha codici, sigle o nomi di nomenclatore
    E le proposte rispettano i tempi scritti sulla ricetta

  Scenario: Anna sceglie "Stare vicino a casa" senza dover dire dove abita
    Dato che Anna è sulla schermata della preferenza
    Quando sceglie "Stare vicino a casa" e tocca "Mostrami le proposte"
    Allora vede proposte nella sua area sanitaria di riferimento
    E non le è stato chiesto di digitare il suo indirizzo
    E non le è stato chiesto di digitare il suo comune

  Scenario: Anna sceglie un appuntamento e torna indietro
    Dato che Anna è sulla schermata delle proposte
    E ha selezionato il primo appuntamento
    Quando tocca "Torna alla preferenza"
    Allora torna alla schermata precedente
    E la visita confermata è ancora quella
    E non le viene chiesta di nuovo la foto

  Scenario: Non ci sono appuntamenti disponibili nei prossimi 30 giorni
    Dato che Anna è sulla schermata delle proposte
    Quando il sistema non trova nessun appuntamento disponibile
    Allora vede un messaggio che spiega la situazione in parole chiare
    E vede il numero di telefono del CUP da chiamare
    E non vede un messaggio di errore tecnico senza spiegazione
