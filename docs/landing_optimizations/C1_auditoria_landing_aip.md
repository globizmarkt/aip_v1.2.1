---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.5.1/C1_auditoria_landing_aip.md
TYPE: DRAFT — UX-AIP-02 · componente C.1
STATUS: ACTIVE
TRIGGER: revisión de landing AIP · iteración de contenido o diseño
PRODUCED_BY: Stitch [A-09] / Kimi [A-13] — despacho C ronda 04.5.1
TIMESTAMP: 2026-06-09
---

# C.1 — AUDITORÍA LANDING AIP v1.2.1

**URL auditada:** https://aip-v1-2-1.vercel.app  
**Fecha de auditoría:** 2026-06-09  
**Método:** Revisión en vivo + comparación contra despachos de copy INV-CPY-01→06  
**Referencia de tono:** R-RSI-01 §SEC-02 (analogía rodaje) — confianza técnica sin exclamaciones

---

## 1. PROBLEMAS DE IMPACTO VISUAL (Top 3)

### 🔴 V1 — Hero sin H1 definido / Tagline ausente

**Observación:** El primer scroll muestra "Skeleton — Vertical Base" como título de página (meta) pero no hay H1 visible en el viewport. El tagline canónico `Mandate access requires qualification, not registration.` (CPY-01) **no está aplicado**. El usuario llega a una pantalla de señales de mercado sin contexto institucional previo.

**Impacto:** El visitante no entiende en los primeros 3 segundos qué es AIP ni por qué debería cualificarse. La fricción deliberada (R14) funciona solo si el usuario entiende el filtro.

**Evidencia:**
- Meta title: "Skeleton — Vertical Base" (genérico, no institucional)
- No hay bloque hero con H1 + subtítulo + CTA primario en el primer viewport
- El primer elemento visible es "Market Signals" — funcional, no posicional

**Severidad:** 🔴 P0 — bloqueante para conversión

---

### 🔴 V2 — Contraste tipográfico insuficiente en sección AIMON

**Observación:** La sección "AIMON // CONTEXTUAL ANALYSIS" usa texto en monoespaciado sobre fondo oscuro con bajo contraste. Los timestamps `[00:00:01]` y las etiquetas `SYS`, `GEO`, `MKT`, `GATE`, `MON`, `ACT` tienen poco peso visual. El bloque parece "terminal de sistema" pero sin jerarquía que guíe la lectura.

**Impacto:** El visitante institucional (target: family office, HNWI) puede interpretar esto como "técnico/experimental" en lugar de "sofisticado/controlado". La intención de transmitir vigilancia activa se pierde en la densidad visual.

**Evidencia:**
- Texto monoespaciado pequeño (~12-13px estimado)
- Sin diferenciación de color entre etiquetas de sistema y contenido
- Sin progresión visual que guíe de `SYS` → `GATE` → `ACT`

**Severidad:** 🟠 P1 — degrada percepción de marca

---

### 🟠 V3 — Sección "Operations Status" sin jerarquía de datos

**Observación:** Los 4 indicadores (ACTIVE MANDATES, JURISDICTIONS, SECURE, Integrity/Clearance/Mandates/Session) están en una cuadrícula plana. Los números (14, 3) no tienen escala tipográfica que los destaque. El estado "NONE" / "LOCKED" / "ACTIVE" no usa codificación de color consistente.

**Impacto:** Los datos que deberían generar confianza (14 mandatos, 3 jurisdicciones) pasan desapercibidos. El usuario no percibe "operational depth".

**Evidencia:**
- "14" y "3" no destacan tipográficamente del label
- "Integrity 00" y "Clearance NONE" usan el mismo peso que "ACTIVE MANDATES"
- Sin separación visual entre métricas duras (14, 3) y estados de sesión (00, NONE)

**Severidad:** 🟠 P1 — oportunidad de conversión perdida

---

## 2. PROBLEMAS DE UX (Top 3)

### 🔴 U1 — Flujo de registro no precedido por selector de perfil

**Observación:** El CTA "ACCESO INSTITUCIONAL" lleva directamente al gatekeeper (OAuth/formulario) sin el selector de perfil definido en CPY-02 (Inversor cualificado / Angel/BA / Originador / Visitante). El usuario no sabe qué está solicitando antes de llegar al formulario.

**Impacto:** Aumenta el abandono en el gatekeeper. El usuario llega sin contexto de qué tipo de acceso necesita ni qué KYC le espera.

**Evidencia:**
- CPY-02 define 4 perfiles con descripciones y micro-CTAs
- Ninguno de estos perfiles está visible en la landing actual
- El CTA único "ACCESO INSTITUCIONAL" es genérico

**Severidad:** 🔴 P0 — bloqueante para cualificación efectiva

---

### 🟠 U2 — Señales de mercado como primer contenido sin contexto

**Observación:** "Market Signals" es la primera sección visible. Muestra tickers (XAU/USD, SOFR, EUR/CHF, BRENT) con datos simulados. Pero el visitante no cualificado no tiene mandato activo, por lo que estas señales no tienen utilidad para él en este momento.

**Impacto:** El usuario percibe "dashboard" antes de entender "plataforma de mandatos". La señal de mercado debería ser un *reward* post-cualificación, no la primera impresión.

**Evidencia:**
- Los tickers ocupan el primer viewport completo
- El texto "Basel III reclassification — institutional demand" es informativo pero no contextualiza AIP
- No hay "por qué me importa esto" para un visitante no logueado

**Severidad:** 🟠 P1 — desalineación de expectativas

---

### 🟠 U3 — AIMON terminal sin CTA ni próximo paso

**Observación:** El bloque AIMON muestra un log de sistema que termina en "AWAITING INSTITUTIONAL QUALIFICATION…" pero no ofrece acción inmediata. El usuario lee 8 líneas de log y no sabe qué hacer a continuación.

**Impacto:** Terminal sin CTA = callejón sin salida. La fricción deliberada requiere que cada punto de fricción tenga un camino de salida claro.

**Evidencia:**
- Última línea del log: "AWAITING INSTITUTIONAL QUALIFICATION…"
- Sin botón, sin enlace, sin indicador de siguiente paso debajo del log
- El CTA "ACCESO INSTITUCIONAL" está arriba, desconectado del flujo de lectura

**Severidad:** 🟠 P1 — fricción sin escape

---

## 3. ESTADO DEL COPY INV-CPY (aplicado vs pendiente)

| Despacho | Ticket | Estado | Notas |
|---|---|---|---|
| **CPY-01** | Tagline H1 | ❌ **NO APLICADO** | `Mandate access requires qualification, not registration.` no visible en landing |
| **CPY-02** | Selector de perfil | ❌ **NO APLICADO** | 4 perfiles (Inversor/Angel/Originador/Visitante) no presentes |
| **CPY-03** | FAQ (5 preguntas) | ❌ **NO APLICADO** | No hay sección FAQ visible en landing |
| **CPY-04** | MARKETS fallback | ⚠️ **PARCIAL** | Los textos de estado vacío no están aplicados; la sección MARKETS existe pero con datos simulados, no fallbacks |
| **CPY-05** | SISTEMA notices | ⚠️ **PARCIAL** | El bloque AIMON usa tono similar pero no los notices exactos de CPY-05 |

### Copy que SÍ está aplicado (implícito o explícito)

| Fuente | Dónde aparece | Observación |
|---|---|---|
| `ui.json` (es) | "Market Signals" → "Señales de Mercado" | Títulos de sección traducidos |
| `ui.json` (es) | "Operations Status" → "Estado de Operaciones" | Labels de métricas |
| `ui.json` (es) | "AIMON // CONTEXTUAL ANALYSIS" | Bloque AIMON presente |
| Mock data | Tickers XAU/USD, SOFR, EUR/CHF, BRENT | Datos de mercado simulados |

### Copy PENDIENTE de aplicación (alto impacto)

1. **Tagline H1** (CPY-01): bloque hero con `Mandate access requires qualification, not registration.`
2. **Selector de perfil** (CPY-02): 4 tarjetas de perfil antes del gatekeeper
3. **FAQ** (CPY-03): sección colapsable con 5 preguntas + respuestas
4. **MARKETS fallback** (CPY-04): textos para cuando no hay mandatos activos
5. **Notices** (CPY-05): bienvenida post-login, acceso restringido, KYC pendiente, mandato cerrado

---

## 4. SÍNTESIS EJECUTIVA

| Dimensión | Estado | Acción prioritaria |
|---|---|---|
| **Impacto visual** | 🟡 Regular | Añadir hero con H1 + reestructurar Operations Status |
| **UX flujo** | 🔴 Débil | Insertar selector de perfil antes del gatekeeper |
| **Copy aplicado** | 🔴 0/5 completos | Backfill de CPY-01→05 en siguiente sprint |
| **Percepción institucional** | 🟠 Mejorable | El tono técnico está, falta el tono de confianza fiduciaria |

**Hipótesis:** La landing actual prioriza la demostración técnica (tickers, terminal AIMON) sobre la narrativa de cualificación (por qué AIP, por qué yo, qué sigue). Para un visitante institucional, esto invierte el orden de necesidades: primero necesita entender el *qué* y el *por qué*, luego el *cómo funciona*.

---

*Auditoría realizada sobre versión en producción · 2026-06-09 · Stitch [A-09] / Kimi [A-13]*
