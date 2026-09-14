import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// ADR-0010: Vitest + Testing Library; i .feature restano la sorgente di verità (letti da
// src/test/coperturaScenari.test.ts, il ripiego dichiarato al timebox di 30 min).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    // design-react-kit distribuisce ESM con import relativi senza estensione: Vitest deve
    // trasformarlo con la pipeline di Vite invece di esternalizzarlo (risoluzione Node pura
    // rifiuta gli import senza estensione).
    server: {
      deps: {
        inline: ['design-react-kit'],
      },
    },
  },
});
