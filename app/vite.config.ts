import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ADR-0002: nessun backend, build statico. ADR-0001: nessun router, nessuna config extra.
export default defineConfig({
  plugins: [react()],
  build: {
    // Bundle statico: nessuna dipendenza da un server per servire l'app (ADR-0002).
    outDir: 'dist',
  },
});
