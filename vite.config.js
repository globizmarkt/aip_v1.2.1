// ============================================================
// ARCHIVO  : vite.config.js
// VERSIÓN  : 1.1.0 (2026-07-10 — añade resolve.alias, CMD-027 ronda 2)
// FECHA    : 2026-07-10
// PROPÓSITO: Config Vite — reemplaza Tailwind CDN (DO-01) + habilita
//            dynamic import de gadgets CRM (PERF-LAZY-01). resolve.alias
//            replica el <script type="importmap"> de index.html — Vite/
//            Rollup no lee import maps del HTML en build, solo en el
//            navegador, así que el bare-specifier (ej. "infra/storage/...")
//            que el navegador resolvía vía import map hay que resolverlo
//            aquí explícitamente para que `npm run build` no falle.
// ============================================================
import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      'core': resolve(__dirname, './src/01-core'),
      'infra': resolve(__dirname, './src/02-infra'),
      'ui': resolve(__dirname, './src/03-interface'),
      'shared': resolve(__dirname, './src/03-interface/shared'),
      'vertical': resolve(__dirname, './')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
