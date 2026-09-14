# language: it

Funzionalità: Procedere anche quando la foto della ricetta non è leggibile
  Come Anna
  Voglio che, se la foto non va bene, il sistema mi mostri sulla mia stessa foto
  dove guardare e cosa copiare
  Così da riuscire ad andare avanti da sola senza tornare al modulo che mi bloccava

  Contesto:
    Dato che Anna ha aperto CarePath sul suo telefono
    E ha caricato una foto della ricetta

  Scenario: La foto è troppo scura e il sistema non riesce a leggere il codice
    Dato che la foto caricata è troppo scura per leggere i codici
    Quando il sistema finisce di provare a leggere la foto
    Allora Anna vede la sua stessa foto con due zone evidenziate
    E vede scritto "Copia il numero sotto il primo codice a barre, poi quello sotto il secondo"
    E vede due campi separati: uno per le prime 5 cifre e uno per le ultime 10
    E non vede un unico campo da 15 caratteri

  Scenario: Anna copia correttamente i due segmenti del codice
    Dato che Anna vede la guida con la foto annotata
    Quando digita le prime 5 cifre nel primo campo
    Allora vede subito "Perfetto, questo va bene" accanto al campo
    Quando digita le 10 cifre nel secondo campo
    Allora vede subito "Perfetto, questo va bene" accanto al secondo campo
    E il pulsante "Continua con questi numeri" diventa attivo

  Scenario: Anna sbaglia il numero di cifre in un campo
    Dato che Anna vede la guida con la foto annotata
    Quando digita solo 8 cifre nel secondo campo (invece di 10)
    Allora vede scritto "Questo numero deve avere esattamente 10 caratteri. Ne hai scritti 8: ne mancano 2."
    E il messaggio dice esattamente quale campo è sbagliato e quante cifre mancano
    E non vede scritto solo "Codice non valido"
    E il pulsante "Continua" non è attivo finché il campo non è corretto

  Scenario: Anna decide di rifare la foto invece di copiare i numeri
    Dato che Anna vede la guida con la foto annotata
    Quando tocca "Fai un'altra foto"
    Allora torna alla schermata della fotocamera
    E i dati che aveva già confermato in precedenza sono ancora lì

  Scenario: La lettura è parziale — un campo è incerto
    Dato che la foto è leggibile ma un numero è poco nitido
    Quando il sistema mostra il risultato della lettura
    Allora vede un avviso giallo con il ritaglio della parte incerta della foto
    E vede scritto "Non sono sicuro di questo numero. Guarda qui sulla foto: vedi lo stesso numero?"
    E può rispondere "Sì, è giusto" oppure "No, è diverso"
    Quando risponde "No, è diverso"
    Allora passa alla guida di inserimento per quel campo specifico
    Senza dover ricominciare da capo
