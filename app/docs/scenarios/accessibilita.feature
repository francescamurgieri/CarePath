# language: it

Funzionalità: Leggere e toccare senza fatica sul telefono
  Come Anna
  Voglio testo grande, contrasto forte e pulsanti ampi
  Così da usare il servizio senza occhiali e senza sbagliare a toccare

  Scenario: I pulsanti sono abbastanza grandi da toccare senza sbagliare
    Dato che Anna sta usando CarePath sul suo telefono
    Quando vede qualsiasi pulsante principale
    Allora l'area toccabile è grande almeno quanto un bottone standard (44x44 punti)
    E non deve pizzicare o trascinare per completare nessun passo

  Scenario: Il testo è leggibile senza occhiali
    Dato che Anna guarda lo schermo senza occhiali
    Quando legge il testo principale di qualsiasi schermata
    Allora le lettere sono abbastanza grandi da leggere comodamente
    E il contrasto fra testo e sfondo è forte

  Scenario: Gli errori non si capiscono solo dal colore
    Dato che Anna ha sbagliato un campo nella guida di inserimento
    Quando vede il messaggio di errore
    Allora oltre al colore rosso vede anche un'icona e un testo che spiega cosa è sbagliato
    E non deve capire dal solo colore che c'è un problema

  Scenario: Il percorso funziona anche con il tasto Tab (solo tastiera)
    Dato che qualcuno usa CarePath solo con la tastiera
    Quando preme il tasto Tab su qualsiasi schermata
    Allora raggiunge tutti i pulsanti e i campi nell'ordine giusto
    E ogni schermata ha un titolo principale che descrive dove si trova

  Scenario: Lo schermo annuncia i cambiamenti a chi usa il lettore dello schermo
    Dato che qualcuno usa un lettore di schermo (come VoiceOver o TalkBack)
    Quando il sistema finisce di leggere la foto
    Allora il lettore di schermo annuncia il risultato senza che la persona debba cercarla
    Quando appare un messaggio di errore
    Allora il lettore di schermo lo annuncia subito

  Scenario: Il riepilogo finale si legge senza scorrere in orizzontale
    Dato che Anna guarda il riepilogo della prenotazione
    Quando il suo telefono ha uno schermo di larghezza normale
    Allora tutto il testo entra nella schermata senza dover scorrere di lato
    E anche con il testo ingrandito al doppio il layout non si rompe
