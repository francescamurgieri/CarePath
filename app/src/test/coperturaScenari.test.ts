import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * ADR-0010 — ripiego dichiarato (timebox di 30 min sull'adapter Gherkin superato: si
 * documenta qui, non si tace). I file .feature restano la sorgente di verità: questo test
 * non esegue gli step, verifica solo che ogni scenario abbia un test omonimo da qualche
 * parte nella suite (corrispondenza per titolo, non per step — limite accettato e
 * dichiarato in ADR-0010 §"Conseguenze").
 */

const SCENARIOS_DIR = path.resolve(__dirname, '../../docs/scenarios');
const SRC_DIR = path.resolve(__dirname, '..');

function estraiScenari(featureContent: string): string[] {
  return featureContent
    .split('\n')
    .map((riga) => riga.trim())
    .filter((riga) => riga.startsWith('Scenario:') || riga.startsWith('Scenario Outline:'))
    .map((riga) => riga.replace(/^Scenario( Outline)?:\s*/, '').trim());
}

function leggiTuttiITestRicorsivo(dir: string): string {
  let contenuto = '';
  for (const voce of fs.readdirSync(dir, { withFileTypes: true })) {
    const percorsoCompleto = path.join(dir, voce.name);
    if (voce.isDirectory()) {
      contenuto += leggiTuttiITestRicorsivo(percorsoCompleto);
    } else if (/\.test\.(ts|tsx)$/.test(voce.name) && voce.name !== 'coperturaScenari.test.ts') {
      contenuto += fs.readFileSync(percorsoCompleto, 'utf-8') + '\n';
    }
  }
  return contenuto;
}

const fileFeature = fs.existsSync(SCENARIOS_DIR)
  ? fs.readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith('.feature'))
  : [];

describe('Copertura .feature -> test (ADR-0010)', () => {
  it('esistono file .feature da coprire', () => {
    expect(fileFeature.length).toBeGreaterThan(0);
  });

  const testoTest = fs.existsSync(SRC_DIR) ? leggiTuttiITestRicorsivo(SRC_DIR) : '';

  for (const file of fileFeature) {
    const contenuto = fs.readFileSync(path.join(SCENARIOS_DIR, file), 'utf-8');
    const scenari = estraiScenari(contenuto);

    it(`${file}: ogni scenario ha un test omonimo nella suite`, () => {
      const mancanti = scenari.filter((s: string) => !testoTest.includes(s));
      expect(mancanti).toEqual([]);
    });
  }
});
