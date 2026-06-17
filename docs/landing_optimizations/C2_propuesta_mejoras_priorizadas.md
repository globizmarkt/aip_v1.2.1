---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.5.1/C2_propuesta_mejoras_priorizadas.md
TYPE: DRAFT — UX-AIP-02 · componente C.2
STATUS: ACTIVE
TRIGGER: revisión de landing AIP · iteración de contenido o diseño
PRODUCED_BY: Stitch [A-09] / Kimi [A-13] — despacho C ronda 04.5.1
TIMESTAMP: 2026-06-09
---

# C.2 — PROPUESTA DE MEJORAS PRIORIZADAS

**Basado en:** Auditoría C.1 (`C1_auditoria_landing_aip.md`)  
**Referencia visual:** Landing actual https://aip-v1-2-1.vercel.app  
**Doctrina:** R14 (Fricción deliberada) · R-RSI-01 (RSI sociotécnica) · CPY-01→05 (copy validado)

---

## CRITERIO DE PRIORIZACIÓN

| Peso | Factor | Descripción |
|---|---|---|
| 40% | Impacto en conversión | ¿Cuánto mejora la tasa de usuarios que inician cualificación? |
| 30% | Esfuerzo de implementación | ¿Horas de Sentinel? ¿Riesgo de breaking change? |
| 20% | Coherencia con doctrina | ¿Refuerza R14, R-RSI-01, o alguna ley sistémica? |
| 10% | Dependencias | ¿Requiere outputs de otros despachos? |

**Score = (Impacto × 0.4) − (Esfuerzo × 0.3) + (Doctrina × 0.2) − (Dependencias × 0.1)**

---

## NIVEL 1 — MEJORAS RÁPIDAS (< 2h Sentinel)

### M1.1 — Insertar bloque hero con H1 + subtítulo + CTA primario

| Atributo | Valor |
|---|---|
| **Problema** | V1 — Hero sin H1 definido |
| **Esfuerzo** | ~45 min |
| **Impacto** | 🔴 Alto — primer scroll define percepción |
| **Score** | 9.1/10 |

**Descripción técnica:**
- Añadir `<section id="hero">` como primer elemento del `<main>`, *antes* de "Market Signals"
- H1: `Mandate access requires qualification, not registration.` (CPY-01)
- Subtítulo: `Qualified mandates. Fiduciary execution. Institutional intermediation without commercial exposure.` (derivado de `ui.json` hero.subtitle)
- CTA primario: `BEGIN REGISTRATION` → scroll suave o apertura modal gatekeeper
- CTA secundario (texto): `Explore as Visitor →` — modo solo lectura, sin gatekeeper

**CSS mínimo:**
```css
#hero {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}
#hero h1 {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 800px;
  margin: 0 auto 1.5rem;
}
#hero .subtitle {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}
```

**Doctrina:** Refuerza R14 — la fricción se presenta como característica, no como error.

---

### M1.2 — Reestructurar Operations Status con jerarquía tipográfica

| Atributo | Valor |
|---|---|
| **Problema** | V3 — Datos planos sin jerarquía |
| **Esfuerzo** | ~30 min |
| **Impacto** | 🟠 Medio-Alto — percepción de operacionalidad |
| **Score** | 7.4/10 |

**Descripción técnica:**
- Separar en dos grupos visuales: **Métricas duras** (14, 3) vs **Estado de sesión** (Integrity, Clearance)
- Métricas duras: número en `font-size: 2.5rem`, label en `0.75rem` uppercase tracking-wide
- Estado de sesión: badge con color condicional (NONE = amber, ACTIVE = emerald, LOCKED = slate)
- Añadir separador visual (`border-top` o `grid-gap` mayor) entre grupos

**CSS mínimo:**
```css
.ops-metric .number {
  font-size: 2.5rem;
  font-weight: 200;
  line-height: 1;
  color: var(--text-primary);
}
.ops-metric .label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-top: 0.5rem;
}
.ops-status .badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.badge-amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.badge-emerald { background: rgba(16, 185, 129, 0.15); color: #10b981; }
```

---

### M1.3 — Añadir CTA debajo del bloque AIMON

| Atributo | Valor |
|---|---|
| **Problema** | U3 — Terminal sin escape |
| **Esfuerzo** | ~15 min |
| **Impacto** | 🟠 Medio — reduce abandono en punto de fricción |
| **Score** | 6.8/10 |

**Descripción técnica:**
- Después de la última línea del log (`AWAITING INSTITUTIONAL QUALIFICATION…`), insertar:
  - Botón primario: `REQUEST CLEARANCE` → abre gatekeeper
  - Enlace secundario: `Browse as Visitor →` → modo solo lectura
- Añadir `margin-top: 2rem` al contenedor del CTA para separarlo del log

**Nota:** Este CTA duplica el de la navegación, pero la redundancia es intencional en puntos de fricción (R14). El usuario que lee el log completo está más cualificado que el que solo scrollea.

---

### M1.4 — Meta title: "Skeleton — Vertical Base" → título institucional

| Atributo | Valor |
|---|---|
| **Problema** | V1 — Meta title genérico |
| **Esfuerzo** | ~2 min |
| **Impacto** | 🟠 Medio — SEO + bookmark + tab |
| **Score** | 6.2/10 |

**Descripción técnica:**
- Cambiar `<title>` a: `AIP Financial & Commodities — Institutional Access`
- Añadir `<meta name="description" content="Qualified mandates. Fiduciary execution. Institutional intermediation without commercial exposure.">`

---

## NIVEL 2 — MEJORAS MEDIANAS (2–8h Sentinel)

### M2.1 — Selector de perfil intermedio (CPY-02)

| Atributo | Valor |
|---|---|
| **Problema** | U1 — Flujo sin selector de perfil |
| **Esfuerzo** | ~4h |
| **Impacto** | 🔴 Alto — reduce abandono en gatekeeper |
| **Score** | 8.7/10 |
| **Dependencias** | Requiere CPY-02 ya validado por Director (✅) |

**Descripción técnica:**
- Insertar sección entre hero y Market Signals (o como modal previo al gatekeeper)
- 4 tarjetas clicables con:
  - Icono distintivo (cada perfil tiene icono semántico)
  - Label: `Qualified Investor` / `Angel / BA` / `Originator / Founder` / `Institutional Visitor`
  - Descripción: 1 línea de CPY-02
  - Micro-CTA con flecha `→`
- Al hacer click, persistir en `sessionStorage.archetype` y abrir gatekeeper con perfil pre-seleccionado
- El gatekeeper debe ajustar campos según perfil (ej. Originador muestra campo "Nombre del proyecto")

**Componente React sugerido:**
```jsx
<ArchetypeSelector
  profiles={[
    { id: 'qualified_investor', label: t('archetype.qualified_investor.label'), ... },
    { id: 'angel', label: t('archetype.angel.label'), ... },
    { id: 'originator', label: t('archetype.originator.label'), ... },
    { id: 'visitor', label: t('archetype.visitor.label'), ... },
  ]}
  onSelect={(profile) => {
    sessionStorage.setItem('archetype', profile.id);
    openGatekeeper(profile.id);
  }}
/>
```

**Doctrina:** Refuerza R-FSM-01 (máquina de estados de acceso) y R-SDUI-01 (SDUI por perfil).

---

### M2.2 — Sección FAQ colapsable (CPY-03)

| Atributo | Valor |
|---|---|
| **Problema** | Copy CPY-03 no aplicado |
| **Esfuerzo** | ~3h |
| **Impacto** | 🟠 Medio-Alto — reduce fricción cognitiva, mejora SEO |
| **Score** | 7.1/10 |
| **Dependencias** | Requiere CPY-03 validado (✅) |

**Descripción técnica:**
- Sección `<section id="faq">` después de Operations Status
- 5 items colapsables (accordion) con:
  - Pregunta en `font-weight: 500`, `font-size: 0.9375rem`
  - Respuesta en `color: var(--text-muted)`, `line-height: 1.7`
  - Icono `+` / `−` a la derecha
- Schema.org FAQPage JSON-LD para SEO
- Lazy-load: solo renderizar si el usuario scrollea hasta la sección

**Keys i18n:** `faq.q1` → `faq.a5` (ya definidas en CPY-05 especificación técnica)

---

### M2.3 — Reemplazar Market Signals por sección "What is AIP" (para visitantes no logueados)

| Atributo | Valor |
|---|---|
| **Problema** | U2 — Señales como primer contenido sin contexto |
| **Esfuerzo** | ~5h |
| **Impacto** | 🟠 Medio-Alto — alinea expectativas del visitante |
| **Score** | 7.8/10 |

**Descripción técnica:**
- Para usuarios no logueados (`IntegrityScore === 0`), mostrar sección explicativa en lugar de tickers
- Contenido: 3 pilares de AIP (basado en `about.principles` de `ui.json`)
  - `DELIBERATE FRICTION` — calibración, no captación
  - `FIDUCIARY SOVEREIGNTY` — STAK, separación de titularidad
  - `BLIND TRACEABILITY` — watermark dinámico, auditoría criptográfica
- Cada pilar: título + 2 líneas de descripción + icono abstracto
- Para usuarios logueados: mostrar tickers actuales (ya implementado)

**Lógica condicional:**
```jsx
{sessionState.integrityScore > 0 ? <MarketSignals /> : <WhatIsAIP />}
```

**Doctrina:** Refuerza R14 — el visitante entiende el filtro antes de experimentarlo.

---

### M2.4 — Bloque RSI sociotécnica (C.3)

| Atributo | Valor |
|---|---|
| **Problema** | Nuevo — comunicar automejora del sistema |
| **Esfuerzo** | ~2h |
| **Impacto** | 🟠 Medio — diferenciador competitivo |
| **Score** | 6.5/10 |
| **Dependencias** | Requiere C3 aprobado por Director |

**Descripción técnica:**
- Sección `<section id="rsi">` después de FAQ o antes del footer
- Copy de C3 (ver `C3_copy_rsi_sociotecnica_landing.md`)
- Visual: 3 pasos del bucle RSI (sensor → actuador → verificador) como diagrama minimalista
- Animación sutil: línea que conecta los 3 pasos, progresión left-to-right

---

## NIVEL 3 — MEJORAS ESTRUCTURALES (> 8h)

### M3.1 — Rediseño del gatekeeper con flujo por perfil

| Atributo | Valor |
|---|---|
| **Problema** | U1 — Gatekeeper genérico, sin adaptación por perfil |
| **Esfuerzo** | ~12h |
| **Impacto** | 🔴 Alto — conversión gatekeeper |
| **Score** | 8.2/10 |
| **Dependencias** | M2.1 (selector de perfil) + CPY-02 validado |

**Descripción técnica:**
- Gatekeeper como wizard de 3 pasos:
  1. **Perfil** (pre-seleccionado desde landing) — confirmar o cambiar
  2. **Credenciales** — OAuth o formulario manual, campos adaptados por perfil
  3. **Atestación** — checkbox GDPR + disclaimer legal (CPY-05 notices)
- Barra de progreso visual (3 steps)
- Persistencia parcial: si el usuario abandona en paso 2, al volver retoma desde ahí
- Animación de transición entre pasos (fade + slide, 200ms)

**Riesgo:** Breaking change en el componente gatekeeper existente. Requiere test de regresión en flujo OAuth.

---

### M3.2 — Sistema de notices contextuales (CPY-05)

| Atributo | Valor |
|---|---|
| **Problema** | Notices de sistema no implementados |
| **Esfuerzo** | ~10h |
| **Impacto** | 🟠 Medio-Alto — reduce tickets de soporte |
| **Score** | 6.9/10 |
| **Dependencias** | CPY-05 validado + integración con mockState |

**Descripción técnica:**
- Componente `<SystemNotice>` que aparece como toast o banner según contexto:
  - Post-login: banner verde "Access validated..." (3s, auto-dismiss)
  - Guest→member: banner ámbar "Your current profile..." (persistente hasta acción)
  - KYC pendiente: banner azul con contador de días estimados
  - Mandato cerrado: banner gris con enlace a historial
- Posición: top-right (toast) o debajo del header (banner)
- Animación: slide-in desde arriba, 300ms
- Accesibilidad: `role="alert"`, `aria-live="polite"`

---

### M3.3 — Animación de entrada progresiva (stagger) en primer scroll

| Atributo | Valor |
|---|---|
| **Problema** | Landing estática, sin progresión visual |
| **Esfuerzo** | ~8h |
| **Impacto** | 🟠 Medio — percepción de sofisticación |
| **Score** | 5.8/10 |

**Descripción técnica:**
- Intersection Observer: elementos del hero aparecen con stagger (H1 → 0ms, subtitle → 150ms, CTA → 300ms)
- Operations Status: números hacen "count-up" desde 0 al entrar en viewport
- AIMON log: líneas aparecen secuencialmente con typing effect (50ms/char)
- Sin librerías externas: CSS `@keyframes` + `IntersectionObserver` nativo

**Riesgo:** Puede percibirse como "efecto" en lugar de "funcionalidad". Mantener duraciones < 500ms.

---

## MATRIZ DE PRIORIZACIÓN FINAL

| # | Mejora | Nivel | Score | Esfuerzo | Impacto | Estado copy |
|---|--------|-------|-------|----------|---------|-------------|
| 1 | M1.1 — Hero con H1 | Rápida | **9.1** | 45 min | 🔴 Alto | ✅ CPY-01 listo |
| 2 | M2.1 — Selector de perfil | Mediana | **8.7** | 4h | 🔴 Alto | ✅ CPY-02 listo |
| 3 | M3.1 — Gatekeeper wizard | Estructural | **8.2** | 12h | 🔴 Alto | ⚠️ Requiere M2.1 |
| 4 | M2.3 — "What is AIP" condicional | Mediana | **7.8** | 5h | 🟠 Med-Alto | ✅ ui.json listo |
| 5 | M1.2 — Jerarquía Operations Status | Rápida | **7.4** | 30 min | 🟠 Med-Alto | ✅ ui.json listo |
| 6 | M2.2 — FAQ colapsable | Mediana | **7.1** | 3h | 🟠 Med-Alto | ✅ CPY-03 listo |
| 7 | M3.2 — Sistema de notices | Estructural | **6.9** | 10h | 🟠 Med-Alto | ✅ CPY-05 listo |
| 8 | M1.3 — CTA debajo AIMON | Rápida | **6.8** | 15 min | 🟠 Medio | ✅ ui.json listo |
| 9 | M2.4 — Bloque RSI | Mediana | **6.5** | 2h | 🟠 Medio | ⚠️ Pendiente C3 |
| 10 | M1.4 — Meta title | Rápida | **6.2** | 2 min | 🟠 Medio | ✅ ui.json listo |
| 11 | M3.3 — Animación stagger | Estructural | **5.8** | 8h | 🟠 Medio | N/A |

---

## RECOMENDACIÓN DE ORDEN DE EJECUCIÓN

**Sprint 1 (próxima sesión):** M1.1 + M1.2 + M1.3 + M1.4 → 4 mejoras rápidas, ~90 min total, impacto visual inmediato.

**Sprint 2 (siguiente ronda):** M2.1 + M2.3 → selector de perfil + "What is AIP". Requiere validación de que el flujo FSM soporta perfiles pre-seleccionados.

**Sprint 3 (ronda posterior):** M2.2 + M2.4 + M3.2 → FAQ + RSI + notices. Contenido pesado, requiere alimentación de ui.json en 4 idiomas.

**Sprint 4 (futuro):** M3.1 + M3.3 → gatekeeper wizard + animaciones. Alto riesgo, requiere test de regresión completo.

---

*Propuesta priorizada · 2026-06-09 · Stitch [A-09] / Kimi [A-13]*
