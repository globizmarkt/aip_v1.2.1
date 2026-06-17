---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/AIP_legacy_logs/tactical_logs/AIP_v1.2.1/fase_06_authomatic_factory/despachos_04.3.4.1/00_DESPACHOS_04.3.4.1.md
PROJECT: AIP v1.2.1
TYPE: DESPACHO — Costes de implementación AIP en producción + equipo profesional mínimo
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Claude Code — Sentinel (v3 — reasignación de agentes por incidencia Gemini)
REGLA: 1/4 Multiárea — COSTES · EQUIPO · DOMINIO · SISTEMA
---

# DESPACHOS RONDA 04.3.4.1 (v3)
## Misión: presupuesto de costes de producción para AIP (Landing+CRM) + equipo profesional mínimo para desarrollar y mantener

> **Corrección de enfoque (v1 → v2):**
> El material CIFI-AIP / Global Business Marketplace adjunto en esta carpeta corresponde a una
> etapa de **prototipado ya superada**. El uso del codename "CIFI-AIP" queda relegado — el foco
> es exclusivamente **AIP**. El techo de **<50€/mes** era un marco de prototipo, no de producción.
>
> **Nueva misión:** investigación más profunda para (1) un presupuesto de costes de **producción**
> y (2) determinar el **equipo profesional mínimo** (roles + dedicación) para desarrollar y
> mantener en funcionamiento el concepto **Landing + CRM de AIP**.
>
> **Protocolo de entrega:**
> Director abre cada archivo listado en "Fuentes a leer" y lo pega/adjunta al agente.
> Outputs en esta carpeta: A_*.md · B_*.md · C_*.md
> Despacho D es tarea de sistema — Sentinel ejecuta directamente.

> **Reasignación de agentes (v2 → v3) — incidencia Gemini 2026-06-10:**
> Downdetector reporta caída masiva de Google Gemini el 2026-06-10 (pico >500 reportes).
> Tanto Lead Architect [A-04] como GEM Antigravity [A-06] corren sobre GEM Antigravity (IDE),
> que depende de modelos Gemini — ambos quedan **no operativos** mientras dure la incidencia.
> Reasignación aplicada para no bloquear la ronda:
> - **Despacho A** (COST-AIP-PROD-01): Lead Architect [A-04] → **Bulldozer (br) [A-02]** (Claude)
> - **Despacho B** (TEAM-AIP-01): Lead Architect [A-04] → **Bulldozer (global) [A-03]** (Claude, sesión separada)
> - **Despacho C** (DOMAIN-AIP-01): GEM Antigravity [A-06] → **Perplexity [A-14]** (research — comparativa registradores/DNS)
>
> Si la incidencia Gemini se resuelve antes de que el Director despache, puede revertirse a
> los agentes originales (Lead Architect / GEM Antigravity) sin cambios de contenido — la
> reasignación es de **agente ejecutor**, no de especificación de tarea.

---

## DESPACHO A — Presupuesto de costes de producción Landing+CRM AIP (Bulldozer br)

**Agente:** Bulldozer (br) [A-02] — reasignado desde Lead Architect [A-04] por incidencia Gemini 2026-06-10
**Área:** COSTES — presupuesto de producción (no prototipo)
**Ticket:** COST-AIP-PROD-01

### Tarea

Sustituye al enfoque de prototipo (<50€/mes, AppSheet). AIP_v1.2.1 ya está en fase de
producción: Firebase Auth + Firestore Rules desplegadas, `vercel.json` configurado,
`src/03-interface` a medida.

Investigar y proponer un presupuesto de costes de **infraestructura en producción** para el
concepto Landing + CRM de AIP, cubriendo:

1. **Firebase (plan Blaze)** — proyección de coste real bajo 3 escenarios de tráfico/uso:
   - Bajo (lanzamiento, <100 usuarios/mes)
   - Medio (crecimiento, 100-1.000 usuarios/mes, red de agentes activa)
   - Alto (escalado, >1.000 usuarios/mes, multi-región)
2. **Vercel** — Hobby vs Pro, cuándo es necesario el salto
3. **Dominio + SSL + DNS** (sin atarse a Cloudflare necesariamente — comparar opciones)
4. **Monitoring/logging/backups** — herramientas mínimas para producción seria (Firebase
   Crashlytics/Performance, Sentry, backups automatizados de Firestore)
5. **Tabla resumen mensual** por escenario (Bajo/Medio/Alto) + recomendación de cuál aplica
   a la fase actual de AIP

### Fuentes a leer

```
C:\BreederHub\01_PRODUCTION\AIP_v1.2.1\firebase.json
C:\BreederHub\01_PRODUCTION\AIP_v1.2.1\firestore.rules
C:\BreederHub\01_PRODUCTION\AIP_v1.2.1\vercel.json
C:\BreederHub\03_INBOX\AIP_legacy_logs\tactical_logs\AIP_v1.2.1\fase_06_authomatic_factory\AIP_fase_06.3\PRESUPUESTO OPERATIVO WEB AIP - JAVIER.md
```

### Especificaciones

**Estructura del informe:**

```
## COST-AIP-PROD-01

### 1. FIREBASE — PROYECCIÓN POR ESCENARIO
[Tabla: escenario → Auth → Firestore (lecturas/escrituras/storage) → Hosting → coste/mes]

### 2. VERCEL — HOBBY VS PRO
[Cuándo se necesita Pro, coste, trigger de migración]

### 3. DOMINIO + SSL + DNS
[Opciones comparadas, recomendación]

### 4. MONITORING / LOGGING / BACKUPS
[Herramientas mínimas + coste]

### 5. RESUMEN MENSUAL POR ESCENARIO
[Tabla: Bajo | Medio | Alto — total €/mes]

### 6. RECOMENDACIÓN PARA FASE ACTUAL DE AIP
[Qué escenario aplica hoy y por qué]
```

**Cabecera METAFAC pre-ensamblada (usar verbatim):**
```
---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.3.4.1/A_cost_aip_prod01_presupuesto.md
TYPE: PRESUPUESTO — COST-AIP-PROD-01 costes de producción Landing+CRM AIP
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Bulldozer (br) [A-02] — despacho A ronda 04.3.4.1
---
```

### Formato de entrega

Informe estructurado según las 6 secciones.

**Archivo destino:** `A2_cost_aip_prod01_presupuesto.md`

---

## DESPACHO B — Equipo profesional mínimo para Landing+CRM AIP (Bulldozer global)

**Agente:** Bulldozer (global) [A-03] (sesión separada) — reasignado desde Lead Architect [A-04] por incidencia Gemini 2026-06-10
**Área:** EQUIPO — dimensionamiento de equipo profesional
**Ticket:** TEAM-AIP-01

### Tarea

Determinar el **equipo profesional mínimo** necesario para **desarrollar** (lo que falta) y
**mantener en funcionamiento** (operación continua) el concepto Landing + CRM de AIP, dado el
estado real del código (`src/03-interface`, gadgets, Firebase backend ya desplegado, landing
pendiente de copy/diseño vía despacho 04.5.1-C).

Entregar:
1. **Roles necesarios** (mínimo viable, no equipo ideal de gran consultora):
   - ¿Frontend/UI (gadgets, landing)?
   - ¿Backend/Firebase (Firestore rules, Cloud Functions si aplican)?
   - ¿Diseño UI/UX (más allá de despachos puntuales)?
   - ¿QA/testing?
   - ¿DevOps/infra (Vercel, dominio, monitoring)?
   - ¿Coordinación/PM?
2. **Dedicación estimada** por rol: full-time / part-time / freelance puntual
3. **¿Qué roles ya cubre la "Forja" actual** (Sentinel + agentes externos: Kimi, Stitch,
   GEM Antigravity, Lead Architect) **vs qué roles requieren contratación humana real**?
4. Distinguir explícitamente **fase de desarrollo** (lo que falta para "web operativa")
   vs **fase de mantenimiento** (una vez operativa, régimen de mantenimiento continuo)

### Fuentes a leer

```
C:\BreederHub\03_INBOX\AIP_legacy_logs\tactical_logs\AIP_v1.2.1\fase_06_authomatic_factory\AIP_fase_06.3\PRESUPUESTO OPERATIVO WEB AIP - JAVIER.md
C:\BreederHub\03_INBOX\AIP_legacy_logs\tactical_logs\AIP_v1.2.1\fase_06_authomatic_factory\AIP_fase_06.3\🔵 FASE 0 — OPERACIÓN AIP + CAPACIDAD PERSONAL.md
C:\BreederHub\00_FACTORY_CORE\skeleton-core\neural-organs\CENSO_AGENTES.md
```

### Especificaciones

**Estructura del informe:**

```
## TEAM-AIP-01

### 1. ROLES — DESARROLLO (hasta web operativa)
[Tabla: rol → responsabilidad → dedicación → cubierto por Forja / requiere contratación]

### 2. ROLES — MANTENIMIENTO (operación continua)
[Misma tabla, régimen de mantenimiento]

### 3. EQUIPO MÍNIMO RECOMENDADO
[Síntesis: N personas/roles, dedicación total estimada]

### 4. GAP FORJA vs HUMANO
[Qué hace la Forja (agentes) hoy, qué necesita supervisión/ejecución humana sí o sí]
```

**Cabecera METAFAC pre-ensamblada (usar verbatim):**
```
---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.3.4.1/B_team_aip01_equipo_minimo.md
TYPE: ANÁLISIS — TEAM-AIP-01 equipo profesional mínimo Landing+CRM AIP
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Bulldozer (global) [A-03] — despacho B ronda 04.3.4.1
---
```

### Formato de entrega

Informe estructurado según las 4 secciones.

**Archivo destino:** `B_team_aip01_equipo_minimo.md`

---

## DESPACHO C — Estrategia de dominio para AIP en producción (Perplexity)

**Agente:** Perplexity [A-14] — reasignado desde GEM Antigravity [A-06] por incidencia Gemini 2026-06-10
**Área:** DOMINIO — estrategia de dominio/subdominios para producción
**Ticket:** DOMAIN-AIP-01

### Tarea

Determinar la estrategia de dominio para AIP en su fase de producción actual (no como ejercicio
de prototipo). Basarse en la estructura real de `AIP_v1.2.1` (`landing/` vacía pendiente de
04.5.1-C, CRM de agentes en gadgets de `aip-crm-home.js`, `vercel.json` ya configurado).

Entregar:
1. Recomendación de extensión de dominio para AIP (justificada para un actor financiero
   institucional — considerar `.com` como estándar de confianza vs alternativas)
2. Arquitectura de subdominios recomendada (landing pública / CRM de agentes / documentación
   compliance) mapeada a los módulos reales de `AIP_v1.2.1`
3. Checklist de registro y configuración (registrador, DNS, SSL, conexión con Vercel/Firebase)

### Fuentes a leer

```
C:\BreederHub\01_PRODUCTION\AIP_v1.2.1\vercel.json
C:\BreederHub\01_PRODUCTION\AIP_v1.2.1\firebase.json
C:\BreederHub\03_INBOX\AIP_legacy_logs\tactical_logs\AIP_v1.2.1\fase_06_authomatic_factory\AIP_fase_06.3\PRESUPUESTO OPERATIVO WEB AIP - JAVIER.md
```

### Especificaciones

**Estructura del informe:**

```
## DOMAIN-AIP-01

### 1. RECOMENDACIÓN DE EXTENSIÓN
[Extensión recomendada + justificación institucional]

### 2. ARQUITECTURA DE SUBDOMINIOS
[Tabla: subdominio → módulo AIP_v1.2.1 → fase de activación]

### 3. CHECKLIST DE REGISTRO Y CONFIGURACIÓN
[Pasos ordenados]
```

**Cabecera METAFAC pre-ensamblada (usar verbatim):**
```
---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.3.4.1/C_domain_aip01_estrategia.md
TYPE: INFRAESTRUCTURA — DOMAIN-AIP-01 estrategia de dominio producción
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Perplexity [A-14] — despacho C ronda 04.3.4.1
---
```

### Formato de entrega

Informe estructurado según las 3 secciones.

**Archivo destino:** `C_domain_aip01_estrategia.md`

---

## DESPACHO D — [SYS] Marcar material CIFI-AIP como relegado + actualizar PRESUPUESTO/CRONOGRAMA (Sentinel)

**Agente:** Sentinel (Claude Code — ejecución directa)
**Área:** SISTEMA — corrección de enfoque tras feedback Director
**Ticket:** SYS-COST-AIP-02

### Tarea

✅ **EJECUTADO en esta misma sesión:**
1. `PRESUPUESTO OPERATIVO WEB AIP - JAVIER.md` § 3 — eliminar el ancla "<50€/mes" como marco de
   producción; marcar el material CIFI-AIP como `ESTADO_APLICACION: IGNORADO` (prototipo
   superado) per R-ARQ-01; dejar § 3 abierta a la espera de COST-AIP-PROD-01.
2. Despacho B de v1 (`COPY-AIP-CIFI-01`, adaptación narrativa CIFI-AIP) — cancelado. El codename
   CIFI-AIP queda relegado; cualquier trabajo de copy/branding de landing sigue dependiendo
   exclusivamente de 04.5.1-C (UX-AIP-02), sin referencia a CIFI-AIP.
3. `master_tasks.md` §8 — fila 04.3.4.1-B (v1) sustituida por TEAM-AIP-01.

### Formato de entrega

N/A — ejecutado directamente.

**Archivo destino:** N/A (tarea SYS)

---

## CHECKLIST SENTINEL (post-recepción)

- [ ] **A** — validar cifras contra firebase.json/vercel.json reales → cerrar PRESUPUESTO §3 con tabla por escenarios → marcar COST-AIP-PROD-01 CERRADO
- [ ] **B** — presentar dimensionamiento de equipo al Director → si requiere contratación, abrir ticket de gestión (fuera del alcance de Sentinel) → marcar TEAM-AIP-01 CERRADO
- [ ] **C** — presentar recomendación de dominio al Director → registro es acción del Director, no automatizable → marcar DOMAIN-AIP-01 CERRADO
- [ ] **D** — ✅ ya ejecutado
- [ ] Commit sellado: "Despacho 04.3.4.1 v2 — presupuesto producción AIP + equipo mínimo Landing+CRM"

---

## RESUMEN DE DESPACHOS

| ID | Agente | Ticket | Output |
|----|--------|--------|--------|
| A | Bulldozer (br) [A-02] | COST-AIP-PROD-01 | `A_cost_aip_prod01_presupuesto.md` |
| B | Bulldozer (global) [A-03] | TEAM-AIP-01 | `B_team_aip01_equipo_minimo.md` |
| C | Perplexity [A-14] | DOMAIN-AIP-01 | `C_domain_aip01_estrategia.md` |
| D | [SYS] Sentinel | SYS-COST-AIP-02 | ✅ EJECUTADO — material CIFI-AIP relegado, PRESUPUESTO/CRONOGRAMA corregidos |

---

*Ronda 04.3.4.1 v3 · Sentinel · 2026-06-10 · VIBE-AIP-S-REBORN-05 — reasignación de agentes por incidencia Gemini*
