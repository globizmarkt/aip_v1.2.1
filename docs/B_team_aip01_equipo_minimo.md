---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.3.4.1/B_team_aip01_equipo_minimo.md
TYPE: ANÁLISIS — TEAM-AIP-01 equipo profesional mínimo Landing+CRM AIP
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Bulldozer (global) [A-03] — despacho B ronda 04.3.4.1
---

## TEAM-AIP-01

### 1. ROLES — DESARROLLO (hasta web operativa)

Esta fase cubre los Bloques A a D definidos en el presupuesto operativo (49–72 horas totales estimadas).

| Rol | Responsabilidad | Dedicación | Origen: Forja (Agente ID) / Contratación Humana |
| :--- | :--- | :--- | :--- |
| **Frontend / UI** | Construcción de componentes de Landing (Bloque A) y CRM Agentes (Bloque B). Integración de `src/03-interface` con markup. | **Puntual** (~30-40h código) | **FORJA:** [A-02] Bulldozer (br) — Generación de componentes JS/HTML. <br>**FORJA:** [A-13] Stitch — Definición de clases Tailwind/Glassmorphism (vía despacho 04.5.1-C). |
| **Backend / Firebase** | Ajustes de `firestore.rules`, creación de Cloud Functions puntuales (ej. notificación de nuevo agente), lógica `AIPHandler`. | **Puntual** (~5-10h) | **FORJA:** [A-04] Lead Architect / [A-06] GEM Antigravity — Parches y despliegues de reglas. |
| **Diseño UI/UX** | Definición de flujo de usuario, paleta visual, estructura de la Landing. | **Part-time** (Review) | **FORJA:** Output de 04.5.1-C. <br>**HUMANO:** Aprobación final de Javier/Roberto (alineación con marca AIP). La Forja no tiene contexto del "gusto" corporativo físico. |
| **QA / Testing** | Validación visual, pruebas cruzadas, smoke tests en producción (Bloque D). | **Puntual** (~6-10h) | **FORJA:** [A-29] GEM Inspector Visual — Auditoría de capturas. <br>**HUMANO:** Ejecución de flujos reales (login, descarga PDF) en navegadores reales y validación de "se siente bien". |
| **DevOps / Infra** | Configuración de DNS, compra de dominio, ajustes de `vercel.json`, activación de monitoring. | **Micro-puntual** (<3h) | **HUMANO:** Operaciones financieras (compra dominio) y acceso a paneles de administración raíz. La Forja genera la configuración, el humano la aplica. |
| **Coordinación / PM** | Traducción de feedback de Javier a Briefs para la Forja. Secuenciar Bloques A-D. | **Part-time** (~10-15h) | **HUMANO:** Carlos Balboa. Es el "API" entre el mundo real (Madrid) y la Forja. |

### 2. ROLES — MANTENIMIENTO (operación continua)

Régimen post-lanzamiento. La web está operativa; el foco cambia de *construir* a *estabilizar y evolucionar*.

| Rol | Responsabilidad | Dedicación | Origen: Forja / Contratación Humana |
| :--- | :--- | :--- | :--- |
| **Frontend / UI** | Fixes de bugs visuales, pequeños cambios de copy, ajustes responsive. | **Bajo** (~2-4h/mes) | **FORJA:** [A-02] Bulldozer (br) vía laparoscopia. |
| **Backend / Firebase** | Evolución de reglas de seguridad según nuevos casos de uso (ej. nuevos roles de agente). | **Bajo** (~1-2h/mes) | **FORJA:** [A-04] Lead Architect. |
| **DevOps / Infra** | Renovaciones, revisión de facturación (COST-AIP-01), escalado de planes (Hobby → Pro). | **Muy Bajo** (~1h/mes) | **HUMANO:** Revisión de costes. <br>**FORJA:** Ajustes técnicos si aplica. |
| **Gestión de Contenido** | Carga de noticias nuevas en el motor, alta manual de primeros agentes si no hay auto-registro. | **Recurrente** (Variable) | **HUMANO:** Personal administrativo AIP (Roberto u otro). <br>**FORJA:** [A-31] Qwen PDF→MD para formatear documentación. |
| **Coordinación** | Reuniones Block E (2-3h/semana definidas en presupuesto). | **Recurrente** | **HUMANO:** Carlos Balboa (fase de ajuste inicial). Reducir a 1h/quincena en estado estable. |

### 3. EQUIPO MÍNIMO RECOMENDADO

**Síntesis de personal humano requerido:**

**Fase de Desarrollo (Próximas 4 semanas):**
*   **1x Técnico/Integrador (Carlos Balboa):** Dedicación ~15-20h semanales. Función: Traductor de requisitos y aplicador de parches de la Forja que requieran acceso root o validación en entorno físico.
*   **0x Desarrolladores Frontend dedicados.**
*   **0x Diseñadores UI dedicados.**

**Fase de Mantenimiento (Post-lanzamiento):**
*   **1x Operador (Roberto / Personal AIP):** Dedicación ~3-5h semanales. Función: Gestión de contenido (noticias, PDFs) y atención de first-level support a agentes.
*   **0x DevOps dedicados.**
*   **Soporte Técnico On-Demand:** Carlos o agente externo puntual para incidencias críticas (estimado <2h/mes).

**Conclusión de equipo:** El modelo de "Factoría" desplaza la necesidad de contratación de desarrolladores o diseñadores humanos para este alcance. El recurso humano se concentra en **Interfaz Humana** (hablar con Javier) y **Operación Financiera/Identidad** (comprar dominios, pagar servicios), no en escritura de código.

### 4. GAP FORJA vs HUMANO

La barrera entre lo que hace la Forja y lo que requiere un humano no está en la *complejidad técnica*, sino en la *soberanía operativa* y el *contexto físico*.

| Función | La Forja (Agentes) lo hace | Requiere Humano Sí o Sí | Razón del Gap |
| :--- | :--- | :--- | :--- |
| **Escritura de código** | ✅ Sí ([A-02], [A-04]) | ❌ No | Capacidad verificada en producción (Brief 04-06). |
| **Diseño visual** | ✅ Sí ([A-13] Stitch) | ❌ No (para ejecución) | La Forja genera el CSS/HTML. |
| **Aprobación de marca** | ❌ No | ✅ Sí | La Forja no "ve" la oficina de Castelló ni conoce la tolerancia al riesgo visual de Javier. |
| **Compra de Dominio** | ❌ No | ✅ Sí | Requiere identidad legal, tarjeta de crédito y aceptación de TOS de registrador. |
| **Despliegue a Producción** | ⚠️ Parcial | ✅ Sí (Botón final) | La Forja prepara el código. Un humano debe ejecutar `vercel --prod` o aceptar el deploy en UI para mantener control de "quién toca producción". |
| **Prueba de usabilidad real** | ❌ No | ✅ Sí | "¿Es intuitivo para un agente de 50 años?" requiere un humano frente al navegador. |
| **Data Entry Inicial** | ❌ No | ✅ Sí | Crear el primer usuario administrador o subir documentos confidenciales que no están en disco. |
| **Coordinación con Cliente** | ❌ No | ✅ Sí | Javier y Roberto no interactúan con prompts. Carlos es el proxy humano obligatorio. |
