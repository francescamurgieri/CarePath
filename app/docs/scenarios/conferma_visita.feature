# language: it

Funzionalità: Confermare che il sistema ha letto la visita giusta
  Come Anna
  Voglio che il sistema mi dica in una frase semplice quale visita ha letto
  e mi chieda conferma
  Così da essere sicura che stiamo parlando della stessa cosa prima di andare avanti

  Contesto:
    Dato che Anna ha caricato la foto della ricetta
    E il sistema ha finito di leggerla

  Scenario: Il sistema mostra la visita in parole semplici
    Quando appare il risultato della lettura
    Allora vede scritto "Visita ortopedica di controllo" in parole sue
    E vede solo una domanda: "Stavo cercando questo?"
    E vede due scelte: "Sì, è questa" e "No, non è questa"
    E non le viene chiesto di scegliere una branca specialistica
    E non le viene chiesto di inserire il codice NRE a mano

  Scenario: Il testo originale della ricetta è sempre disponibile
    Quando appare il risultato della lettura
    Allora vede un pulsante o link per vedere il testo originale della ricetta
    Quando lo apre
    Allora vede scritto esattamente "VISITA ORTOPEDICA DI CONTROLLO — 89.01.G"
    E quel testo non è stato cambiato né parafrasato

  Scenario: Anna chiede "Che significa NRE?"
    Quando appare il risultato della lettura
    Allora vede il codice della ricetta scritto come "010A2 · 4518061015"
    E vede un pulsante o link "Che significa?" accanto al termine NRE
    Quando lo tocca
    Allora vede una spiegazione di massimo due frasi in parole comuni
    E la spiegazione non contiene gergo tecnico
    E la spiegazione dice cosa deve fare lei, non com'è fatto il sistema

  Scenario: Anna risponde "No, non è questa"
    Quando tocca "No, non è questa"
    Allora il sistema non va avanti da solo
    E vede due opzioni: "Fai un'altra foto" e "Inserisci il codice con la guida"
    E nessuna delle due opzioni la riporta al modulo del CUP con il campo NRE da 15 caratteri
    E può tornare indietro senza perdere niente

  Scenario: Anna chiede la spiegazione della classe di priorità
    Dato che sulla ricetta c'è scritto "D" nel campo priorità
    Quando Anna tocca "Che significa?" accanto alla lettera D
    Allora vede scritto "D vuol dire 'differibile': il Servizio Sanitario deve fissare
      la tua visita entro 30 giorni"
    E la spiegazione non dice nulla sulla gravità della sua situazione di salute
    E non contiene parole come "urgente", "grave" o "clinico"
