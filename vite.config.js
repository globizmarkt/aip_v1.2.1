// ============================================================
// ARCHIVO  : vite.config.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-07-10
// PROPÓSITO: Config Vite — reemplaza Tailwind CDN (DO-01) + habilita
//            dynamic import de gadgets CRM (PERF-LAZY-01)
// ============================================================
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
