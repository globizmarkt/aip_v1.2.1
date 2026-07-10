---
METAFAC_VER: 1.0.0
GEO_LOC: 01_PRODUCTION/AIP_v1.2.1/doctrine/architecture/AIP_Trinity_Doctrine.md
SCOPE: VERTICAL
DOMAIN: ARCHITECTURE
GENEALOGÍA: movido desde 01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/ · INV-TAX-01 piloto §5 · 2026-06-26
PRODUCED_BY: Antigravity
SOURCE_AGENT: GEM-Antigravity (Core Architect)
PATTERN_TYPE: DOCTRINE
AFFINITY_GROUP: DOCTRINA
CONTENT_CAT: DOCTRINA ESTRUCTURAL — Trinity Layout Polígono v1.0
STATUS: VIGENTE — PENDIENTE DE ACTUALIZACIÓN A v2.0
EXTRACTION_TAG: DOCTRINA_ELEVADA
PROJECT: AIP
TIMESTAMP: 2026-05-01
FASE: 12.3 — Ignición de Planta
---

# 🏗️ DOCTRINA UNIFICADA: TRINITY LAYOUT (POLÍGONO v1.0)

**Estado:** VIGENTE (Fase 12.3 Ignición)  
**Autor:** Antigravity (Core Architect)  
**Referencia:** 03_RESEARCH/legacy_trinity_doctrine  
**Ámbito:** AIP / CPII / Prototipos Industriales

---

## 1. ESENCIA ARQUITECTÓNICA (LA TRINIDAD)
El sistema se fundamenta en una estructura de tres columnas inmutables que separan las responsabilidades de la experiencia de usuario:

1.  **COLUMNA IZQUIERDA: CONTEXTO (Nav)**
    *   **Función:** Selector de Órbitas y jerarquía de navegación.
    *   **Elementos:** Instrumentos, Trade Finance, Advisory, Compliance Hub.
    *   **Lógica:** Define el alcance de los datos que se verán en el Canvas.

2.  **CANVAS CENTRAL: ACCIÓN (Canvas)**
    *   **Función:** Espacio de trabajo dinámico y agnóstico.
    *   **Elementos:** Inyección de Widgets (`.wd-*`).
    *   **Lógica:** No contiene lógica de negocio fija; el ADN del proyecto (`manifest.json`) dicta qué widgets se activan.

3.  **COLUMNA DERECHA: GOBERNANZA (Inspector)**
    *   **Función:** Supervisión, IA y Control.
    *   **Elementos:** Oráculo AIMON, Gatekeeper Status, Panel de Sistema.
    *   **Lógica:** Persistente y no colapsable. Asegura que la IA y las reglas de cumplimiento estén siempre visibles.

---

## 2. REGLAS DE CUMPLIMIENTO (SKELETON DOCTRINE)
Para asegurar la soberanía y escalabilidad, todo desarrollo debe seguir estas reglas:

*   **R0 (Agnosticismo Radical):** El chasis es ciego a la vertical. El diseño debe funcionar igual para Oro, Petróleo o Inmuebles.
*   **R2 (Light DOM):** Prohibido el uso de `Shadow DOM`. Se requiere acceso total a los selectores para auditoría y tematización global.
*   **R4 (Internacionalización i18n):** Prohibido el texto hardcodeado. Uso obligatorio de atributos `data-i18n`.
*   **Protocolo Tierra Firme:** Si el estatus de KYC no es verificado, los componentes no se ocultan; simplemente **no se inyectan en el DOM**.

---

## 3. JERARQUÍA VISUAL E INSTITUCIONAL
*   **Estética "Magic Circle":** Proyectar herencia y prestigio financiero.
*   **Paleta Primaria:** Deep Ocean (`#0a1628`) y UK Gold (`#c9a84c`).
*   **Tipografía:** Cormorant Garamond (BR-38).
*   **Efectos:** Uso de `.skeleton-blur` para elementos no autorizados en lugar de estados "deshabilitados" genéricos.

---

## 4. ÍNDICE DE REFERENCIA (LEGACY ASSETS)
Los siguientes activos en `03_RESEARCH/legacy_trinity_doctrine` sirven como base técnica para la implementación:

### A. Doctrina y Auditoría (Core)
- `MetaFactory_legacy_session_memory_LEARNINGS.md`: Playbook de aprendizajes estructurales.
- `MetaFactory_legacy_session_memory_audits_BR-09.md`: Auditoría de la UI de 3 niveles.
- `MetaFactory_lab_assets_AIP_01_arquitectura_AIP-traspaso.md`: Inventario oficial de pantallas v1.0.

### B. Prototipos y Código
- `MetaFactory_lab_assets_AIP_01_arquitectura_trinity_demo.html`: Referencia visual del layout.
- `Polygon_Planta-2026_quarantine_AIP_v0.1_src_layouts_app-shell.js`: Controlador maestro.
- `MetaFactory_inbox_CPII-CRM-MLS_01_arquitectura_stitch_cpii_crm_mls_tramo_01_cpii_crm_skin_01_layout_trinity_code.html`: Skin funcional.

### C. Especificaciones de Agentes
- `Polygon_Planta-2026_quarantine_AIP_v0.1_docs_AGENT_FILE_SPEC.md`: Reglas para la orquestación multi-agente.

---
*Documento generado bajo el mandato del Director para la consolidación de la Doctrina Polígono.*
