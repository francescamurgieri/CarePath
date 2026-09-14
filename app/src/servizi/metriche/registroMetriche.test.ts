import { describe, it, expect } from 'vitest';
import { creaRegistroMetriche } from './registroMetriche';

describe('servizi/metriche/registroMetriche — istantanea coerente (RD-02, architecture.md §4.7)', () => {
  it('conta campi, decisioni e schermi distinti dopo una sequenza simulata', () => {
    const registro = creaRegistroMetriche();

    registro.contaSchermo('S-01');
    registro.contaSchermo('S-02');
    registro.contaDecisione(); // S-04
    registro.contaSchermo('S-04');
    registro.contaDecisione(); // S-06
    registro.contaSchermo('S-06');
    registro.contaDecisione(); // S-07
    registro.contaSchermo('S-07');
    registro.contaDecisione(); // S-08
    registro.contaSchermo('S-08');

    const istantanea = registro.istantanea();
    expect(istantanea.schermiAttraversati).toBe(6);
    expect(istantanea.decisioniRichieste).toBe(4);
    expect(istantanea.campiDiTestoCompilati).toBe(0);
    expect(istantanea.erroriSenzaRecupero).toBe(0);
  });

  it('rivisitare uno schermo già contato (torna indietro) non gonfia M5', () => {
    const registro = creaRegistroMetriche();
    registro.contaSchermo('S-06');
    registro.contaSchermo('S-07');
    registro.contaSchermo('S-06'); // torna indietro e poi di nuovo avanti
    registro.contaSchermo('S-07');

    expect(registro.istantanea().schermiAttraversati).toBe(2);
  });

  it('segnalaErroreSenzaRecupero esiste solo per far fallire un test se mai invocata', () => {
    const registro = creaRegistroMetriche();
    registro.segnalaErroreSenzaRecupero('PRENOTAZIONE_FALLITA');
    expect(registro.istantanea().erroriSenzaRecupero).toBe(1);
  });
});
