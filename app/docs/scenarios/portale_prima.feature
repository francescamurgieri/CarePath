# language: it

Funzionalità: Vedere come funzionava il portale prima di CarePath
  Come osservatore della demo
  Voglio poter vedere la replica del portale CUP originale
  Così da capire concretamente perché Anna si bloccava

  Contesto:
    Dato che siamo nella schermata di benvenuto di CarePath

  Scenario: Il percorso "prima" è raggiungibile in un tocco
    Quando tocca "Vedi come funzionava prima"
    Allora vede una schermata con un avviso giallo che dice che è una simulazione
    E l'avviso spiega che non ci sono loghi o dati reali
    E vede un link per tornare a CarePath

  Scenario: La replica mostra il campo NRE senza spiegazione utile
    Dato che siamo sulla schermata della simulazione CUP
    Quando guarda il modulo
    Allora vede un campo chiamato "Numero ricetta elettronica (NRE)"
    E vede solo il testo di aiuto "15 caratteri, lo trovi sul promemoria della ricetta"
    E non c'è nessuna indicazione su come comporre i 15 caratteri dai due codici a barre

  Scenario: La replica mostra il messaggio di errore opaco
    Dato che siamo sulla schermata della simulazione CUP
    Quando compila i campi con un codice sbagliato e tocca "Accedi"
    Allora vede scritto solo "Codice non valido."
    E non vede scritto quale campo è sbagliato
    E non vede scritto cosa deve fare per correggere l'errore
    E non vede un pulsante o un link che la aiuti a procedere

  Scenario: Dalla simulazione si torna sempre a CarePath
    Dato che siamo sulla schermata della simulazione CUP
    Quando tocca "Torna a CarePath"
    Allora torna alla schermata di benvenuto di CarePath

Funzionalità: Vedere quanto è cambiato con CarePath
  Come Anna
  Voglio vedere in numeri cosa è cambiato rispetto a prima
  Così da capire quanta autonomia ho guadagnato

  Scenario: I contatori prima/dopo sono visibili dopo la conferma
    Dato che Anna ha completato la prenotazione con CarePath
    Quando tocca "Vedi quanto è cambiato rispetto a prima"
    Allora vede una tabella con i numeri prima e dopo
    E la tabella ha almeno le righe:
      | Campi da compilare    |
      | Termini senza aiuto   |
      | Decisioni richieste   |
      | Errori senza recupero |
      | Passi fino alla fine  |
      | Task completato       |

  Scenario: I limiti residui sono dichiarati apertamente
    Dato che Anna è sulla schermata "Cosa è cambiato con CarePath"
    Allora vede una sezione chiamata "Limiti che restano"
    E vede scritto che il sistema di prenotazione è una simulazione
    E vede scritto che le metriche non sono state testate con utenti reali
    E vede scritto cosa non riesce ancora a fare CarePath
