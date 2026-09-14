import { describe, it, expect } from 'vitest';
import { componiNre, formattaNreLeggibile, validaSegmentoA, validaSegmentoB } from './nre';

describe('dominio/nre — composizione e validazione (AC-01.4, AC-03.2)', () => {
  it('compone correttamente 010A2 + 4518061015 in 010A24518061015', () => {
    const risultato = componiNre('010A2', '4518061015');
    expect(risultato.esito).toBe('ok');
    if (risultato.esito === 'ok') {
      expect(risultato.valore.completo).toBe('010A24518061015');
      expect(risultato.valore.completo.length).toBe(15);
    }
  });

  it('rifiuta se il segmento A non ha 5 caratteri', () => {
    const risultato = componiNre('010A', '4518061015');
    expect(risultato.esito).toBe('errore');
    if (risultato.esito === 'errore') {
      expect(risultato.errore.recupero).toBeTruthy();
    }
  });

  it('rifiuta se il segmento B non ha 10 caratteri', () => {
    const risultato = componiNre('010A2', '451806101');
    expect(risultato.esito).toBe('errore');
  });

  it('non accetta nessuna composizione parziale silenziosa', () => {
    const risultato = componiNre('', '');
    expect(risultato.esito).toBe('errore');
  });

  it('formatta l’NRE a gruppi leggibili', () => {
    const risultato = componiNre('010A2', '4518061015');
    if (risultato.esito === 'ok') {
      expect(formattaNreLeggibile(risultato.valore)).toBe('010A2 · 4518061015');
    }
  });

  it('valida il segmento A e riporta quanti caratteri mancano', () => {
    expect(validaSegmentoA('010A2')).toEqual({ valido: true, caratteriMancanti: 0 });
    expect(validaSegmentoA('010')).toEqual({ valido: false, caratteriMancanti: 2 });
  });

  it('valida il segmento B e riporta quanti caratteri mancano (scenario: 8 invece di 10)', () => {
    expect(validaSegmentoB('45180610')).toEqual({ valido: false, caratteriMancanti: 2 });
    expect(validaSegmentoB('4518061015')).toEqual({ valido: true, caratteriMancanti: 0 });
  });
});
