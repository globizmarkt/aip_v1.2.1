---
METAFAC_VER: 3.0.0
GEO_LOC: 01_PRODUCTION/AIP_v1.2.1/doctrine/architecture/03_geometria_trinity.md
SCOPE: VERTICAL
DOMAIN: ARCHITECTURE
GENEALOGÍA: movido desde 01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/ · INV-TAX-01 ronda 2 · 2026-06-26
PRODUCED_BY: DeepSeek (Bibliotecario) / Sancionado por Director + Lead Architect
AFFINITY_GROUP: AIP_v1.2.1 / Fase 18
CONTENT_CAT: DOCTRINE_CORE
STATUS: CANÓNICO
EXTRACTION_TAG: DOCTRINA_ELEVADA
PROJECT: UNIVERSAL
TIMESTAMP: 2026-05-10
SUPERSEDES: v1.1.0 (Enmienda Fase 18.2 — Antigravity)
COG_BASIS: COG-62, COG-63
---

# NODO 03 — GEOMETRÍA TRINITY (ARQUITECTURA AIP-HYBRID-SOVEREIGN)
*Versión: 3.0 (post-COG-62/63)*
*Última actualización: 2026-05-10*
**Estado: CANÓNICO**

---

## 1. PROPÓSITO DOCTRINAL

Definir la geometría estructural de la planta a dos escalas:

- **Macro-escala (Bóvedas 3+1):** Organización física del repositorio C:\BreederHub.
- **Micro-escala (Mente/Músculo/Sentidos):** Organización del código fuente en `01_PRODUCTION/AIP_v1.2.1/src/`.

La arquitectura se rige por el modelo **AIP-Hybrid-Sovereign**, que garantiza aislamiento estricto (R0/R5/R25), desacoplamiento absoluto (R28) y capacidad de gemación de verticales sin modificar el chasis base.

---

## 2. MACRO-ARQUITECTURA — MODELO DE BÓVEDAS 3+1 (COG-62)

La raíz `C:\BreederHub` contiene tres bóvedas activas más un eje ortogonal de gemación dentro del monolito.

| Bóveda | Ruta canónica | Propósito | Agentes con acceso |
|---|---|---|---|
| **Silo de Gobierno** | `00_FACTORY_CORE/` | Doctrinas, memoria institucional, agentes, trazabilidad, inbox de destilación | Director, Lead Architect, Bibliotecario, Sentinel, Polygon Copilot |
| **Índice Semántico** | `00_FACTORY_CORE/skeleton-core/` | Fuente de verdad taxonómica. Mapas, nodos (00-10), decisiones cognitivas | Director, Bibliotecario, Lead Architect, Perplexity |
| **Monolito de Producción** | `01_PRODUCTION/AIP_v1.2.1/` | Código ejecutable, frontend, lógica de negocio, infraestructura prototípica | Antigravity, Bulldozer, Kimi, Stitch, Qwen, Claude Code |
| **Eje de Gemación** (ortogonal) | `src/verticals/` (dentro del monolito) | Plantillas y verticales gemadas (`_base/`, `aip/`, `commodities/`, etc.) | Antigravity, Bulldozer (escritura); todos los agentes (lectura vía imports) |

**Reglas de flujo entre bóvedas (R0 extendido al sistema de archivos):**
- `00_FACTORY_CORE/` → `indexación industrial/`: Doctrina destilada.
- `indexación industrial/` → `01_PRODUCTION/`: Especificaciones, nodos, doctrinas.
- `01_PRODUCTION/` → `00_FACTORY_CORE/inbox/`: Código legacy para destilación arqueológica.
- `src/verticals/` es el único punto donde el código del monolito puede ser extendido sin modificar el chasis.

---

## 3. MICRO-ARQUITECTURA — MENTE / MÚSCULO / SENTIDOS (COG-63)

El directorio `src/` dentro del monolito se organiza bajo el modelo **Mente/Músculo/Sentidos**, más un eje ortogonal de verticales.

### 3.1 Taxonomía canónica de carpetas

| Carpeta | Denominación | Propósito | Doctrinas asociadas | Prohibiciones |
|---|---|---|---|---|
| `src/01-core/` | **Mente** | Motores fiduciarios. Zero-DOM. Emiten eventos `Skeleton:`. No conocen la UI. | R15, R17, R20, R25, R29 | Prohibido `getElementById`, acceso a `localStorage`, imports desde `03-interface/`. |
| `src/02-infra/` | **Músculo** | Conectores estériles. Persistencia, Firebase, StorageAdapter. Aplican `APP_PREFIX`. | R5, R17, R18 | Prohibida lógica de negocio. Prohibido emitir eventos directamente. |
| `src/03-interface/` | **Sentidos** | UI desacoplada. UIBinder, gateEnforcer, GoldenGate. Aplican Velo Técnico (`.skeleton-blur`). | R7, R8, R20, R28 | Prohibido acceso directo a `01-core/` o `02-infra/`. Solo vía eventos `Skeleton:`. |
| `src/verticals/` | **Eje Ortogonal** | Verticales gemables. Contiene `_base/` (plantilla) y verticales específicas (`aip/`, `commodities/`, etc.). | R18, R22, COG-62 | Prohibido modificar el chasis base desde una vertical. Solo especialización. |

### 3.2 Subdivisión Feature-based por Órbita (COG-63)

Cada capa (Mente/Músculo/Sentidos) se subdivide internamente por features u órbitas, no por tipo técnico.

**`src/01-core/` (Mente) — Features fiduciarias:**

| Feature | Ruta | Propósito |
|---|---|---|
| Integrity | `01-core/integrity/` | Motor de IntegrityScore (mock 45 actual, hard gate 60) |
| Passport | `01-core/passport/` | Gestión de sesión volátil (UID, clearance, token) |
| i18n | `01-core/i18n/` | Motor de traducciones, hidratación, eventos `Skeleton:Hydrate` |
| Archetype | `01-core/archetype/` | Detector determinista de perfiles de usuario (R29) |

**`src/02-infra/` (Músculo) — Conectores por dominio:**

| Conector | Ruta | Propósito |
|---|---|---|
| Storage | `02-infra/storage/` | StorageAdapter con `APP_PREFIX` (R5) |
| Firebase | `02-infra/firebase/` | FirebaseConnector (pendiente de activación Fase 16.2+ Zero-Firebase) |
| Config | `02-infra/config/` | Configuración unificada (constantes, rutas, flags) |

**`src/03-interface/` (Sentidos) — Órbitas:**

| Órbita | Ruta | Propósito |
|---|---|---|
| Órbita 2 (Market) | `03-interface/orbit-2-market/` | Feed de noticias, commodities, mercado |
| Órbita 3 (Gatekeeper) | `03-interface/orbit-3-gatekeeper/` | Aduana fiduciaria, gateEnforcer, GoldenGate |
| Shared | `03-interface/shared/` | UIBinder, componentes UI transversales |
| Orchestrator | `03-interface/orchestrator/` | SceneManager (puente de escenas entre órbitas) |

**`src/verticals/` (Eje Ortogonal) — Gemación:**

| Vertical | Ruta | Propósito |
|---|---|---|
| Base | `verticals/_base/` | Plantilla para gemar nuevas verticales (blueprints + estructura mínima) |
| AIP | `verticals/aip/` | Vertical canónica actual (landing + CRM) |
| (Futuras) | `verticals/commodities/`, `verticals/real-estate/`, etc. | Verticales gemadas desde `_base/` |

---

## 4. ESTRUCTURA CANÓNICA DE ARCHIVOS (LEGALIZADA)

La siguiente tabla reemplaza todas las referencias obsoletas a `src/core/`, `src/layouts/`, `src/logic/` y `app-shell.js`.

| Nivel | Archivo/Carpeta canónica | Propósito | Estado |
|---|---|---|---|
| **Raíz HTML** | `index.html` | Chasis Trinity (Órbitas 2 y 3) | ✓ Existente |
| | `crm-landing.html` | Dashboard CRM (Órbita 1 en entorno separado) | ✓ Existente |
| | `asset-explorer.html` | Explorador de assets por vertical | ✓ Existente |
| **Orquestador** | `src/main.js` | Bootloader sovereign. Secuencia: StorageAdapter → i18n → SceneManager → UIBinder | ✓ Existente |
| **Mente** | `src/01-core/` | Ver §3.2 | ✓ Existente |
| **Músculo** | `src/02-infra/` | Ver §3.2 | ✓ Existente |
| **Sentidos** | `src/03-interface/` | Ver §3.2 | ✓ Existente |
| **Eje de gemación** | `src/verticals/` | Ver §3.2 | ⚠️ Pendiente de creación de `_base/` |
| **Blueprints** | `src/blueprints/` | Moldes para gemación (storage-adapter, ui-binder, passport-engine, main) | ✓ Existente (Fase 18.3) |
| **Legacy (eliminado)** | `src/logic/` | Migrada al Modelo 3+1 (Fase 18.4). Archivada en `04_ARCHIVE/aip_legacy_archive/logic_deprecated_fase18/`. | ✓ Eliminada |
| **Deprecado formal** | `src/core/`, `src/layouts/`, `app-shell.js` | Referencias obsoletas. No existen en disco. | ✗ NO EXISTE |

---

## 5. FLUJO DE DATOS CANÓNICO (R20 / R28)

```
DOM (data-action)
        ↓
03-interface/shared/UIBinder.js  →  purifica payload (R0)
        ↓
document.dispatchEvent('Skeleton:UIAction')
        ↓
01-core/ (Mente)  →  valida, aplica reglas de negocio
        ↓
document.dispatchEvent('Skeleton:StateChanged')
        ↓
03-interface/orbit-3-gatekeeper/gateEnforcer.js  →  aplica Velo Técnico (.skeleton-blur)
        ↓
03-interface/orchestrator/SceneManager.js  →  orquesta visibilidad de órbitas
        ↓
DOM (clases CSS mutadas)
```

**Prohibiciones:**
- `01-core/` no puede importar desde `03-interface/` (violaría R25).
- `03-interface/` no puede importar desde `02-infra/` (violaría R28).
- `src/verticals/` no puede modificar `01-core/`, `02-infra/` o `03-interface/` base.

---

## 6. ARTEFACTOS DEPRECADOS (CONFIRMADOS POR COG-63)

| Artefacto | Ruta obsoleta | Razón | Reemplazo canónico |
|---|---|---|---|
| `app-shell.js` | `src/layouts/` | Función absorbida por `main.js` | `src/main.js` |
| `store.js` legacy | `src/logic/` | Reemplazado por StorageAdapter + R5 | `src/02-infra/storage/StorageAdapter.js` |
| `ui-binder.js` legacy | `src/logic/` | Duplicado funcional | `src/03-interface/shared/UIBinder.js` |
| `scene-manager.js` legacy | `src/logic/` | Migrado a orchestrator | `src/03-interface/orchestrator/SceneManager.js` |
| `i18n.js` legacy | `src/logic/` | Duplicado funcional | `src/01-core/i18n/i18n-engine.js` |
| Carpeta `core/` | `src/core/` | Taxonomía obsoleta | `src/01-core/` |
| Carpeta `layouts/` | `src/layouts/` | Inexistente en disco | — |

---

## 7. VALIDACIÓN CONTRA DOCTRINAS VIGENTES

| Doctrina | Cumplimiento en Nodo 03 (post-reescritura) |
|---|---|
| **R0** (Zero-Trust) | UIBinder purifica payloads. Ningún flujo directo DOM → Core. |
| **R2** (Light DOM) | Sin `attachShadow()`. Todo en Light DOM. |
| **R3** (Zero-Hex) | `gateEnforcer` aplica clases CSS, nunca estilos inline. |
| **R4** (i18n) | `01-core/i18n/` como fuente única, `data-i18n` en DOM. |
| **R5** (Zero-Leak) | `02-infra/storage/` aplica `APP_PREFIX` en todas las claves. |
| **R7** (Inhibición) | `gateEnforcer` gestiona `.skeleton-blur` desde una sola fuente. |
| **R8** (Layout Binario) | `03-interface/orbit-2-market/` + `orbit-3-gatekeeper/`. |
| **R15** (Hard Gate) | `01-core/integrity/` + `gateEnforcer` aplica bloqueo si score < 60. |
| **R17** (Gestación Local) | StorageAdapter con `sessionStorage` y TTL para pasaporte. |
| **R18** (ES Modules) | `import/export` en todos los módulos. |
| **R19** (Vanilla) | Sin React, Vue, ni librerías externas. |
| **R20** (Event-Driven) | `document.dispatchEvent` como único bus. |
| **R21** (Namespace) | `window.Skeleton` canónico final. |
| **R25** (Zero-DOM Core) | `01-core/` no contiene selectores HTML. |
| **R28** (Desacoplamiento) | `03-interface/` no importa desde `02-infra/`. |
| **R29** (Determinismo) | `01-core/archetype/` determinista (2+ señales). |

---

## 8. REGISTRO DE CAMBIOS

| Fecha | Cambio | Autor | COG asociado |
|---|---|---|---|
| 2026-05-10 | Reescritura completa del Nodo 03 para reflejar modelo 3+1 | DeepSeek (Bibliotecario) | COG-62, COG-63 |
| 2026-05-10 | Deprecación formal de `src/core/`, `src/layouts/`, `app-shell.js` | DeepSeek | COG-63 |
| 2026-05-10 | Añadida estructura `src/verticals/` como eje ortogonal | DeepSeek | COG-62 |
| 2026-05-10 | Añadida subdivisión feature-based por órbita | DeepSeek | COG-63 |
| 2026-05-10 | Rutas actualizadas: `.infrastructure/` → `00_FACTORY_CORE/`, AIP_v1.2.1 movido a `01_PRODUCTION/` | Claude Code | R31 |

---

*Fundamento Doctrinal: La estructura debe ser invisible para el usuario pero infranqueable para el caos.*

