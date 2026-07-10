---
METAFAC_VER: 1.1.0
GEO_LOC: 01_PRODUCTION/AIP_v1.2.1/doctrine/architecture/05_procesos_hidratacion.md
SCOPE: VERTICAL
DOMAIN: ARCHITECTURE
GENEALOGÍA: movido desde 01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/ · INV-TAX-01 ronda 2 · 2026-06-26
PRODUCED_BY: Antigravity (Escritura Categórica — Fase 18.2)
AFFINITY_GROUP: AIP_v1.2.1 / Fase 18
CONTENT_CAT: DOCTRINE_CORE
STATUS: ACTIVE
EXTRACTION_TAG: DOCTRINA_ELEVADA
PROJECT: UNIVERSAL
TIMESTAMP: 2026-05-10
[AMENDED: Rutas de inyección actualizadas a Órbitas soberanas. src/core/ y src/layouts/ PURGADOS. Sovereign Bootload registrado.]
---

# 💧 PROCESOS DE HIDRATACIÓN (CORE DYNAMICS)

> **Origen:** Fusión de `MASTER_INGESTION_FLOW.md`, `INGESTA_PDF_TO_MD.md` y `CHECKLIST_GENESIS.md`.

## 1. PROTOCOLO DE GÉNESIS (VERTICAL CREATION — Fase 18)
Para materializar una nueva vertical o módulo, se sigue el checklist secuencial bajo la arquitectura **AIP-Hybrid-Sovereign**:
1.  **Andamiaje:** Creación del scaffold soberano bajo las 3 Órbitas (`src/01-core/`, `src/02-infra/`, `src/03-interface/`).
2.  **Inyección (Rutas Canónicas Fase 18):** Copia de blueprints según el Mapa de Inyección Soberano:
    - `storage-adapter-blueprint.js` → `src/02-infra/storage/StorageAdapter.js` (ajustar `verticalPrefix`).
    - `ui-binder-blueprint.js` → `src/03-interface/shared/UIBinder.js` (ajustar `throttleMs`).
    - `passport-engine-blueprint.js` → `src/01-core/passport/PassportEngine.js` (ajustar `_DEFAULT_THRESHOLD`).
    - `main-blueprint.js` → `src/main.js` (Bootloader Soberano — registrar `verticalName` y escenas).
    > ⚠️ **PURGADO:** Rutas legacy `src/core/` y `src/layouts/` **no existen** en `AIP_v1.2.1`. No usar como destinos de inyección.
    > ⚠️ **PURGADO:** `app-shell-blueprint.js`, `store-blueprint.js`, `scene-manager-blueprint.js`, `firebase-connector-blueprint.js` son artefactos **OBSOLETOS** no materializados. Los 4 blueprints canónicos activos están en `src/blueprints/`.
3.  **Semilla (Sovereign Bootload):** Creación/adaptación de `src/main.js` con la Cascada Fiduciaria: GoldenGate.render() → UIBinder.init() → gateEnforcer.init() → PassportEngine.getIdentity() → i18nEngine.setLocale() → gateEnforcer.enforce().
4.  **i18n:** Creación de `src/locales/en.json` y `src/locales/es.json` como mínimo. Fallback canónico: em dash (`—`).
5.  **Trazabilidad:** Registro en el Master Index y tactical logs.
6.  **Blueprints de Gemación:** ✅ Materializados en `src/blueprints/` (G-34 CERRADO — Paso 4 ejecutado 2026-05-10).

### 1.1. DECISIONES TÉCNICAS SOBERANAS
- **O(1) Claims:** Evaluación de privilegios en tiempo constante mediante booleanos planos.
- **Event Bus Canónico:** Uso exclusivo de `document.dispatchEvent` con prefijo `skeleton:` para comunicación entre órbitas. Prevalece sobre nombres genéricos legacy para evitar colisiones.
  - *Mapeo Histórico:* `AUTH_LOGIN` -> `skeleton:auth:login`, `LEGAL_SIGNED` -> `skeleton:legal:signed`, `SCENE_CHANGE` -> `skeleton:scene:change`, `WORKSPACE_READY` -> `skeleton:workspace:ready`.
- **Inmutabilidad de Estado:** Uso de `structuredClone()` en cada inicialización para garantizar la pureza del `INITIAL_STATE`.
- **Seguridad Volátil:** Uso de `sessionStorage` para datos sensibles en el PassportEngine, prohibiendo `localStorage` para evitar persistencia inter-sesión.
- **Protocolo I18N (La Mochila):** El estado del idioma debe persistir en transiciones entre dominios/subdominios mediante el parámetro `?locale=XX` en la URL, asegurando la escalabilidad políglota soberana.

## 2. REGLAS DE AUDIT (REFITTING ROADMAP)
Todo activo hidratado debe pasar por el filtro de las "3 Violaciones Críticas":
- **R0 (Neutralidad):** Ninguna referencia a verticales previas.
- **R3 (Estética):** Cero hexadecimales inline. Uso obligatorio de CSS Tokens.
- **R4 (Lenguaje):** Cero texto hardcodeado. Todo debe ir vía `data-i18n`.

### 2.1. REGLAS DE ORO DEL HIDRATADOR (ANTI-DEGRADACIÓN)
Para mantener el "Grado Institucional" heredado de v1.1:
1. **Delegación CSS:** El Javascript se reduce exclusivamente al toggle de clases de estado (ej: `collapsed`, `active`). Las métricas y transformaciones residen en el CSS.
2. **Pureza del DOM:** El 100% de los elementos visibles deben contener el atributo `data-i18n` o placeholders de carga (`—`).
3. **Audit Trail Constante:** Cada interacción fiduciaria debe emitir un evento `skeleton:audit` capturable por el sistema de logs inmutables.

### 2.2. ESTÁNDAR SENTINEL
El rol de **Sentinel** (Auditor de Pureza) es obligatorio antes de cada cierre de fase. Valida que la "deuda de rapidez" no haya degradado la arquitectura Trinity v2.0.

## 3. FLUJO DE INGESTA INDUSTRIAL (BATCH DISTILLATION)
Este proceso es el pulmón de la memoria del proyecto. Se ejecuta en ciclos denominados **Batches**.

1.  **Extracción (Triaje)**: Identificación de activos PDF/DOCX o Synaptic Dumps (`synaptic_vault`).
2.  **Sonda de Valor ([BALIZA-PROTOCOLOS-01])**: Aplicación de la Regla 10/25 para separar el valor doctrinal del ruido técnico.
3.  **Destilación**: Conversión de los "Átomos de Conocimiento" en entradas estructuradas para los clústeres.
4.  **Indexación (Hidratación)**: Inyección de las entradas en los archivos `01-08` del `00_inbox\indexación industrial\`.
5.  **Registro**: Cada batch se firma en el `09_registro_alimentacion_inbox.md` para garantizar la trazabilidad.

---
*Fundamento Doctrinal: El proceso es el producto. La consistencia garantiza la soberanía.*

## 4. MECANISMO DE LATE BINDING (VINCULACIÓN TARDÍA)
Permite la interacción sin fricción inicial:
- **Fase Seed (Modo Local):** Uso de `localStorage` para exploración y wizards sin login.
- **Fase Crystal (Modo Cloud):** Al detectar datos sensibles o subir documentos, se fuerza el `Identity Check` y se vincula el estado local al `UID` real en Firestore.

## 5. LÓGICA DETERMINISTA DEL GATEKEEPER (5 CAMÁRAS)
Secuencia obligatoria de validación:
1.  **Persistence:** Carga de estado local.
2.  **Identity:** Autenticación SSO/JWT.
3.  **ADN:** Configuración de la marca/vertical.
4.  **Legal:** Firma inmutable de términos (Versioning Check).
5.  **Compliance:** Verificación de KYC/Status y acceso al Workspace.

## 6. ALGORITMO DE SCORING DE INTEGRIDAD (INTEGRITY HUB)
Cada activo recibe una calificación (0-100) basada en 5 pilares:
1.  **Validación Documental (35%):** SGS, POP, BOL validados.
2.  **Rating del Custodio/Emisor (15%):** Calificación S&P/Moody's/Fitch.
3.  **Verificación SWIFT (10%):** MT760, MT799, MT199 confirmados.
4.  **Estado KYC/AML (25%):** Estatus del emisor y origen de fondos.
5.  **Vigencia de Inspección (15%):** Frecuencia de auditoría física.

Si el score baja de **60**, el activo se bloquea automáticamente (**LOCKED**) para evitar riesgos fiduciarios.

## 7. JERARQUÍA DE DOCUMENTACIÓN (SSOT)
Todo activo generado debe seguir la estructura de 4 niveles para garantizar la trazabilidad:
1. **Nivel Semanal:** Resumen ejecutivo de evolución (`SPRINT_WEEK_SUMMARY`).
2. **Nivel Diario:** Fuente Única de Verdad (`SPRINT_YYYY_MM_DD`).
3. **Nivel de Fase (Tareas):** Objetivos atómicos y backlog.
4. **Nivel de Fase (Logs):** Diario de operaciones y transcripciones brutas.

## 8. PROTOCOLO DE SANEAMIENTO Y CUARENTENA
Al cierre de cada fase o jornada se ejecuta la purga de ruido:
- **Destilación:** Extracción de hitos a niveles superiores (Diario/Semanal).
- **Aislamiento:** Traslado de logs brutos a `_archive/quarantine`.
- **Inmunidad:** Los activos con muletillas descriptivas (`_research_`, `_audit_`) están exentos de aislamiento automático.

## 9. REGLA DE COLISIÓN DE SCHEMAS (CANONICAL)
Protocolo obligatorio para evitar duplicación semántica en el ecosistema de datos:
- **Campo nuevo que duplica semántica de uno existente** → REUTILIZAR el existente.
- **Ante duda** → el schema más antiguo gana.
- **Ejemplo:** ❌ Nuevo `kyc_verified` → ✅ Reutilizar `AgentProfile.kycStatus.agentStatus`.
- **Ejemplo:** ❌ Nuevo `integrity_level` → ✅ Reutilizar `IntegrityScore.totalScore`.

### 9.1. PATRONES REUTILIZABLES DE SCHEMAS
| Patrón | Campos canónicos |
|---|---|
| **Firma** | `algo` (ed25519/secp256k1), `publicKey`, `signatureHex` |
| **Auditoría** | `entityType`, `entityId`, `timestamp`, `evidenceHash` |
| **Tenant** | `tenant_id`, `region_code` |
| **Scoring** | `totalScore` (0-100), `breakdown`, `alertFlags` |

### 9.2. ESTADOS ESTANDARIZADOS (CROSS-MODULE)
| Dominio | Flujo de estados |
|---|---|
| **Assets** | DRAFT → PENDING_REVIEW → BANCABLE → LOCKED |
| **KYC** | UNVERIFIED → PENDING → VERIFIED → BLOCKED |
| **Visibilidad** | PERMITTED → UNDER_REVIEW → RESTRICTED |

