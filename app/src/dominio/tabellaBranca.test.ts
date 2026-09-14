import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { trovaBranca } from './tabellaBranca';

describe('dominio/tabellaBranca — trovaBranca (architecture.md §9, chiude il debito nomenclatore)', () => {
  it('trova la riga certa originaria: 89.01.G -> Ortopedia', () => {
    expect(trovaBranca('89.01.G')).toEqual({ branca: 'Ortopedia', brancheAggiuntive: [] });
  });

  it('un codice fuori dalle famiglie dichiarate ritorna null, senza euristica', () => {
    expect(trovaBranca('99.99')).toBeNull();
  });

  it('restituisce brancheAggiuntive quando il nomenclatore ne elenca più di una', () => {
    expect(trovaBranca('89.01.A')).toEqual({
      branca: 'Diagnostica per immagini',
      brancheAggiuntive: ['Medicina nucleare'],
    });
  });

  it('non importa nulla da src/fixtures/ (è un dato di dominio, non una fixture di test)', () => {
    const contenuto = fs.readFileSync(path.resolve(__dirname, 'tabellaBranca.ts'), 'utf-8');
    const righeImport = contenuto.split('\n').filter((riga) => /^\s*import /.test(riga));
    expect(righeImport.some((riga) => /fixtures/.test(riga))).toBe(false);
  });
});
