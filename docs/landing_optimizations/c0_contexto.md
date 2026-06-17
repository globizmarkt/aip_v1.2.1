**Entregables:**

- [C1_auditoria_landing_aip.md](sandbox:///mnt/agents/output/C1_auditoria_landing_aip.md)
- [C2_propuesta_mejoras_priorizadas.md](sandbox:///mnt/agents/output/C2_propuesta_mejoras_priorizadas.md)
- [C3_copy_rsi_sociotecnica_landing.md](sandbox:///mnt/agents/output/C3_copy_rsi_sociotecnica_landing.md)

---

### C.1 — Auditoría Landing AIP: hallazgos clave

| Dimensión | Hallazgo | Severidad |
|---|---|---|
| **Impacto visual** | No hay H1 / tagline en primer scroll. Meta title: "Skeleton — Vertical Base" | 🔴 P0 |
| **Impacto visual** | AIMON terminal sin jerarquía tipográfica, bajo contraste | 🟠 P1 |
| **Impacto visual** | Operations Status plano, números sin escala | 🟠 P1 |
| **UX** | CTA "ACCESO INSTITUCIONAL" va directo al gatekeeper, sin selector de perfil | 🔴 P0 |
| **UX** | Market Signals es el primer contenido — sin contexto para visitante no logueado | 🟠 P1 |
| **UX** | Bloque AIMON termina en "AWAITING..." sin CTA de escape | 🟠 P1 |
| **Copy aplicado** | **0/5** despachos CPY-01→05 completamente aplicados. Solo títulos de sección de `ui.json` | 🔴 |

**Hipótesis central:** La landing prioriza la demostración técnica (tickers, terminal) sobre la narrativa de cualificación. Para un visitante institucional, esto invierte el orden de necesidades: primero necesita entender el *qué* y el *por qué*, luego el *cómo funciona*.

---

### C.2 — Propuesta de mejoras: top 5 por score

| # | Mejora | Nivel | Score | Esfuerzo |
|---|---|---|---|---|
| 1 | Hero con H1 (`Mandate access requires qualification, not registration.`) | Rápida (<2h) | **9.1** | 45 min |
| 2 | Selector de perfil (4 tarjetas antes del gatekeeper) | Mediana (2-8h) | **8.7** | 4h |
| 3 | Gatekeeper wizard (3 pasos: perfil → credenciales → atestación) | Estructural (>8h) | **8.2** | 12h |
| 4 | "What is AIP" condicional (para visitantes no logueados) | Mediana | **7.8** | 5h |
| 5 | Jerarquía tipográfica en Operations Status | Rápida | **7.4** | 30 min |

**Recomendación de ejecución:** Sprint 1 = M1.1 + M1.2 + M1.3 + M1.4 (~90 min total, impacto visual inmediato). Sprint 2 = M2.1 + M2.3 (selector + "What is AIP").

---

### C.3 — Copy RSI sociotécnica: 3 variantes

| Variante | Título | Longitud | Tono | Recomendación |
|---|---|---|---|---|
| **A** (default) | "Every mandate sharpens the system" | Media (~180 palabras) | Institucional, seco | **Usar por defecto** |
| **B** | "A system that learns from its own rigor" | Larga (~220 palabras) | Narrativo, explicativo | Si el Director quiere explicar el concepto |
| **C** | "Each operation teaches the next" | Corta (~140 palabras) | Directo, telegráfico | Si el espacio visual es limitado |

Todas las variantes incluyen traducciones completas en **es/fr/pt**, keys propuestas para `ui.json`, y especificación visual (3 pasos horizontales, línea conectora, iconos abstractos). Sin término "RSI", sin jerga de IA, sin promesas de retorno.
