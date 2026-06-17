---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.5.1/C3_copy_rsi_sociotecnica_landing.md
TYPE: DRAFT — UX-AIP-02 · componente C.3
STATUS: ACTIVE
TRIGGER: revisión de landing AIP · iteración de contenido o diseño
PRODUCED_BY: Kimi [A-13] — despacho C ronda 04.5.1
TIMESTAMP: 2026-06-09
---

# C.3 — COPY: SISTEMA DE MEJORA CONTINUA (RSI Sociotécnica)

**Doctrina base:** R-RSI-01 §SEC-02 (analogía rodaje) · R-RSI-01 §SEC-03 (bucle sensor-actuador-verificador)  
**Restricción:** Sin término técnico "RSI". Sin jerga de IA. Sin promesas de retorno.  
**Tono:** Confianza técnica + accesibilidad para inversor no técnico. Fricción deliberada (R14): no vende, calibra.  
**Referencia visual:** Sección en landing, después de FAQ o antes del footer. 3 pasos visuales.

---

## VARIANTE A — "El protocolo se refina con cada mandato"

### Título de sección
`Every mandate sharpens the system`

### Subtítulo
`AIP does not operate on static rules. Each structured operation, each verification, each fiduciary decision feeds back into the protocol — refining how the next mandate is qualified, matched, and settled.`

### Cuerpo (3 pilares)

**1. Observation**
`Every interaction generates data. Not for surveillance — for calibration. The system observes execution patterns, regulatory shifts, and counterparty behavior to detect what changes before the market does.`

**2. Refinement**
`Insights are not stored. They are applied. When a verification protocol proves insufficient, it is tightened. When a matching criterion produces friction, it is re-examined. The system evolves by operation, not by decree.`

**3. Validation**
`No change enters the protocol without human verification. The Director — not an algorithm — validates that a refinement improves the system. This is not automation. This is deliberate, recursive calibration.`

### Micro-CTA
`The protocol you encounter today is not the protocol you will encounter next quarter. That is the point.`

---

## VARIANTE B — "La máquina de aprender"

### Título de sección
`A system that learns from its own rigor`

### Subtítulo
`Most platforms optimize for speed. AIP optimizes for correctness — and correctness, accumulated over time, becomes a competitive structure. The system improves not by adding features, but by removing the wrong assumptions.`

### Cuerpo (3 pilares)

**1. What the system sees**
`Each mandate leaves a trace: how it was qualified, how it was matched, how it closed. These traces are not analytics for dashboards. They are inputs for recalibration. The system sees what worked, what failed, and what was never tested.`

**2. What the system changes**
`A verification step that delays without adding value is removed. A due diligence criterion that catches fraud is reinforced. The protocol is not a document — it is a living structure that tightens where it matters.`

**3. Who decides**
`The system proposes. Humans validate. No protocol change is deployed without fiduciary review. The loop is recursive, but the final node is always a person. This is why the system improves rather than drifts.`

### Micro-CTA
`The next mandate you submit will be processed by a stricter, more precise protocol than the last. That is not a bug. That is the product.`

---

## VARIANTE C — "Cada operación enseña"

### Título de sección
`Each operation teaches the next`

### Subtítulo (más corto, más directo)
`AIP is not a static platform. It is a fiduciary protocol that refines itself with every mandate it processes. The rules that govern your qualification today were shaped by the operations that came before you.`

### Cuerpo (3 pilares, formato más condensado)

**1. Learn**
`From every verification, every match, every settlement — the system extracts what matters. Not trends. Not dashboards. Structural lessons about what makes a mandate viable.`

**2. Adapt**
`The protocol changes. Slowly, deliberately, and only where the data demands it. A verification step is tightened. A matching criterion is reweighted. The system does not chase the market — it learns from it.`

**3. Verify**
`No algorithm decides alone. Every proposed change is reviewed by the fiduciary layer. The system improves because it is watched, not because it is autonomous.`

### Micro-CTA
`You are not using a platform. You are entering a protocol that has learned from every participant before you.`

---

## COMPARATIVA DE VARIANTES

| Dimensión | A — "El protocolo se refina" | B — "La máquina de aprender" | C — "Cada operación enseña" |
|---|---|---|---|
| **Longitud** | Media (~180 palabras) | Larga (~220 palabras) | Corta (~140 palabras) |
| **Tono** | Institucional, seco | Narrativo, explicativo | Directo, telegráfico |
| **Jerga** | Ninguna | "optimize", "competitive structure" | Ninguna |
| **Referencia a humanos** | "human verification" | "humans validate" | "fiduciary layer" |
| **Alineación R-RSI-01** | §SEC-03 (bucle) | §SEC-02 (rodaje) | §SEC-01 (distinción) |
| **Riesgo de malinterpretación** | Bajo | Medio ("machine" puede sonar a IA) | Bajo |
| **Recomendación** | **Default** — equilibrio perfecto | Si el Director quiere explicar el concepto | Si el espacio visual es limitado |

---

## ESPECIFICACIÓN TÉCNICA PARA IMPLEMENTACIÓN

### Keys propuestas para ui.json (4 idiomas)

```json
"rsi": {
  "title": "Every mandate sharpens the system",
  "subtitle": "AIP does not operate on static rules. Each structured operation, each verification, each fiduciary decision feeds back into the protocol — refining how the next mandate is qualified, matched, and settled.",
  "step1_title": "Observation",
  "step1_body": "Every interaction generates data. Not for surveillance — for calibration. The system observes execution patterns, regulatory shifts, and counterparty behavior to detect what changes before the market does.",
  "step2_title": "Refinement",
  "step2_body": "Insights are not stored. They are applied. When a verification protocol proves insufficient, it is tightened. When a matching criterion produces friction, it is re-examined. The system evolves by operation, not by decree.",
  "step3_title": "Validation",
  "step3_body": "No change enters the protocol without human verification. The Director — not an algorithm — validates that a refinement improves the system. This is not automation. This is deliberate, recursive calibration.",
  "micro_cta": "The protocol you encounter today is not the protocol you will encounter next quarter. That is the point."
}
```

### Variantes alternativas (keys con sufijo)

```json
"rsi_variant_a": { /* Variante A — default */ },
"rsi_variant_b": { /* Variante B — máquina */ },
"rsi_variant_c": { /* Variante C — enseña */ }
```

### Notas de implementación visual

- **3 pasos:** layout horizontal en desktop, vertical en mobile
- **Conexión visual:** línea fina (1px, `var(--border-subtle)`) que conecta los 3 pasos, con punto activo en el paso correspondiente al scroll
- **Sin animación de entrada obligatoria:** la densidad del copy es suficiente sin efectos
- **Iconografía:** 3 iconos abstractos (ojo/observar, engranaje/refinar, sello/validar) — no representativos, no literales
- **Color:** fondo ligeramente diferenciado del resto de la landing (`bg-slate-900` si el resto es `bg-slate-950`, o inverso)

---

## TRADUCCIONES (es / fr / pt)

### ES — Variante A (default)

```json
"rsi": {
  "title": "Cada mandato afila el protocolo",
  "subtitle": "AIP no opera con reglas estáticas. Cada operación estructurada, cada verificación, cada decisión fiduciaria retroalimenta el protocolo — refinando cómo se cualifica, empareja y liquida el siguiente mandato.",
  "step1_title": "Observación",
  "step1_body": "Cada interacción genera datos. No para vigilancia — para calibración. El sistema observa patrones de ejecución, cambios regulatorios y comportamiento de contrapartes para detectar qué cambia antes que el mercado.",
  "step2_title": "Refinamiento",
  "step2_body": "Los insights no se almacenan. Se aplican. Cuando un protocolo de verificación resulta insuficiente, se endurece. Cuando un criterio de emparejamiento genera fricción, se reexamina. El sistema evoluciona por operación, no por decreto.",
  "step3_title": "Validación",
  "step3_body": "Ningún cambio entra al protocolo sin verificación humana. El Director — no un algoritmo — valida que un refinamiento mejora el sistema. Esto no es automatización. Es calibración deliberada y recursiva.",
  "micro_cta": "El protocolo que encuentra hoy no es el protocolo que encontrará el próximo trimestre. Ese es el punto."
}
```

### FR — Variante A (default)

```json
"rsi": {
  "title": "Chaque mandat affûte le protocole",
  "subtitle": "AIP n'opère pas selon des règles statiques. Chaque opération structurée, chaque vérification, chaque décision fiduciaire alimente le protocole — affinant la qualification, le jumelage et la liquidation du mandat suivant.",
  "step1_title": "Observation",
  "step1_body": "Chaque interaction génère des données. Non pour la surveillance — pour la calibration. Le système observe les schémas d'exécution, les évolutions réglementaires et le comportement des contreparties pour détecter ce qui change avant le marché.",
  "step2_title": "Affinement",
  "step2_body": "Les insights ne sont pas stockés. Ils sont appliqués. Quand un protocole de vérification s'avère insuffisant, il est resserré. Quand un critère de jumelage produit de la friction, il est réexaminé. Le système évolue par opération, non par décret.",
  "step3_title": "Validation",
  "step3_body": "Aucun changement n'entre dans le protocole sans vérification humaine. Le Directeur — pas un algorithme — valide qu'un affinement améliore le système. Ce n'est pas de l'automatisation. C'est une calibration délibérée et récursive.",
  "micro_cta": "Le protocole que vous rencontrez aujourd'hui n'est pas celui que vous rencontrerez le trimestre prochain. C'est le point."
}
```

### PT — Variante A (default)

```json
"rsi": {
  "title": "Cada mandato afia o protocolo",
  "subtitle": "AIP não opera com regras estáticas. Cada operação estruturada, cada verificação, cada decisão fiduciária retroalimenta o protocolo — refinando como o próximo mandato é qualificado, emparelhado e liquidado.",
  "step1_title": "Observação",
  "step1_body": "Cada interação gera dados. Não para vigilância — para calibração. O sistema observa padrões de execução, mudanças regulatórias e comportamento de contrapartes para detectar o que muda antes do mercado.",
  "step2_title": "Refinamento",
  "step2_body": "Os insights não são armazenados. São aplicados. Quando um protocolo de verificação se revela insuficiente, é endurecido. Quando um critério de emparelhamento gera fricção, é reexaminado. O sistema evolui por operação, não por decreto.",
  "step3_title": "Validação",
  "step3_body": "Nenhuma mudança entra no protocolo sem verificação humana. O Diretor — não um algoritmo — valida que um refinamento melhora o sistema. Isto não é automação. É calibração deliberada e recursiva.",
  "micro_cta": "O protocolo que encontra hoje não é o protocolo que encontrará no próximo trimestre. Esse é o ponto."
}
```

---

*Copy RSI sociotécnica · 3 variantes · 4 idiomas · 2026-06-09 · Kimi [A-13]*
