---
METAFAC_VER: 0.6.0
TYPE: doctrine · FARO · epicentro de blueprints de dominio AIP
GEO_LOC: 01_PRODUCTION/AIP_v1.2.1/doctrine/architecture/DOMAIN_BLUEPRINT_SYNTHESIS.md
SCOPE: VERTICAL
DOMAIN: ARCHITECTURE
GENEALOGÍA: movido desde 01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/ · INV-TAX-01 ronda 2 · 2026-06-26
TRIGGER: invocar cuando cualquier agente necesite entender el dominio de AIP antes de construir
ESTADO: ACTIVO · sintetizado de BP01..BP05 post-batería 11 lentes REBORN-08
PROCEDENCIA: síntesis Sentinel — VIBE-AIP-S-REBORN-08 — 2026-06-21
GENEALOGÍA: BP01 (2026-05-03) + BP02 (2026-05-24) + BP03 (2026-05-24) + BP04 + BP05
FECHA: 2026-06-21
---

# DOMAIN BLUEPRINT SYNTHESIS — AIP v1.2.1
> **Epicentro canónico** de todos los blueprints de dominio AIP.
> Un agente nuevo puede entender el sistema completo leyendo solo este archivo.
> Blueprints fuente en: `03_INBOX/AIP_legacy_logs/tactical_logs/AIP_v1.2.1/fase_02_gadgets_ini/`

---

# ÍNDICE
# [SEC-01] Identidad del proyecto
# [SEC-02] Modelo de clearance y acceso
# [SEC-03] Entidades del dominio
# [SEC-04] IntegrityScore — fórmula oficial
# [SEC-05] Mandato — schema mínimo obligatorio Firestore
# [SEC-06] Modelo de negocio y comisiones
# [SEC-07] Stack técnico y arquitectura
# [SEC-08] Brecha implementación vs. blueprint (estado 2026-06-21)
# [SEC-09] Balizas a blueprints fuente

---

## [SEC-01] Identidad del proyecto

**AIP (Atlantis International Projects)** es una plataforma de intermediación fiduciaria institucional. Conecta inversores qualificados con mandatos estructurados bajo STAK holandés (supervisado AFM/DNB, Países Bajos).

**No es:**
- Un accelerator, crowdfunding, ni broker retail
- Una plataforma de promesas de retorno
- Un mercado abierto

**Es:**
- Un canal de matching fiduciario con trazabilidad total
- Un filtro de acceso secuencial (KYC → IntegrityScore → clearance → mandatos)
- Una infraestructura de brokerage con sello de compliance

**Dominio de negocio:** Mandatos propios de AIP + mandatos de terceros verificados (R-SUPPLY-01). Comisión por intermediación en cierre.

---

## [SEC-02] Modelo de clearance y acceso

| IntegrityScore | Clearance | Capacidades |
|---|---|---|
| < 60 | Bloqueado | Solo landing. Golden Gate activo. |
| 60–74 | **BRONZE** | KYC Tier 2, visualización de mandatos, matching pasivo |
| 75–79 | **SILVER** | KYC Tier 3, mandatos cualificados, matching activo |
| 80–89 | **GOLD** | Ejecución de deals, productos estructurados (OTC, STAK) |
| 90–100 | **PLATINUM** | Deals institucionales exclusivos, override suave AML con confirmación humana |

**Regla absoluta (R14/R15):** IntegrityScore < 60 bloquea toda acción transaccional. No hay excepciones.

**Flujo de acceso:**
```
Landing (anónimo) → OAuth/VIP → KYC L1 → IntegrityScore ≥ 60 → BRONZE
  → KYC L2 → L3 → L4 → IntegrityScore ≥ 75 → SILVER → GOLD → PLATINUM
```

---

## [SEC-03] Entidades del dominio

### User
```
uid              : Firebase Auth UID (inmutable)
displayName      : string
clearanceLevel   : 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | null
integrityScore   : number (0-100) — asignado por admin humano en fase actual
kyc_status       : 'pending' | 'KYC_SUBMITTED' | 'KYC_APPROVED' | 'KYC_REJECTED'
kyb_status       : (idem para entidades)
kyc_l4_status    : (nivel avanzado)
rol              : 'inv' | 'agent' | 'admin' | 'founder'
tier             : 'inst' | 'retail'
```

### Mandate (entidad central del sistema)
Ver [SEC-05] para schema Firestore completo.

### Project (AnonProjectState)
Estados del ciclo fiduciario de una intención de inversión:
```
0 — Gestation   : borrador anónimo (sessionStorage)
1 — Embryonic   : usuario registrado (KYC L1, localStorage)
2 — Maturation  : KYC L2, bajo análisis compliance
3 — Qualified   : KYC L3+, IntegrityScore ≥75, visible en matching
4 — Executed    : deal cerrado, audit trail sellado
```

### ComplianceLedger
Log inmutable de eventos KYC/AML. Cada entrada: `{event, timestamp, actor, hash}`.
Requerido por AFM/DNB para trazabilidad.

---

## [SEC-04] IntegrityScore — fórmula oficial (BP01 §1.3)

```
IntegrityScore = KYC_WEIGHT * kyc_score
              + HISTORY_WEIGHT * history_score
              + VERIFICATION_WEIGHT * verification_score
              + BEHAVIOR_WEIGHT * behavior_score
```

| Componente | Peso | Factores |
|---|---|---|
| **KYC Tier** | 40 pts | L1 email+teléfono: +10 · L2 identidad: +15 · L3 patrimonio: +15 |
| **Historial operativo** | 25 pts | +1/mes desde registro (max 12) · +2/proyecto exitoso (max 10) · +3 sin rechazo AML 6m |
| **Verificaciones externas** | 20 pts | Email verificado: +5 · Documento oficial escaneado: +10 · Wallet vinculada: +5 |
| **Comportamiento fiduciario** | 15 pts | KYC completado <7 días: +5 · Consistencia IP/geo: +5 · Sin patrones de riesgo: +5 |

**Umbrales prácticos:**
- Para llegar a 60 (BRONZE): L1+L2 (25) + historial 6m (6) + email (5) + comportamiento base (5) = 41 → **requiere más tiempo o verificaciones adicionales** (fricción deliberada R14)
- Para 75 (SILVER): requiere L3 completo + historial establecido

**Estado actual (2026-06-21):** el IntegrityScore es asignado MANUALMENTE por el admin (CEO de AIP). No hay Cloud Function de cálculo. La automatización es deuda de Forja 9+.

---

## [SEC-05] Mandato — schema mínimo obligatorio Firestore

### Campos obligatorios (mínimo para crear un mandato en Firestore)

```js
{
  // IDENTIDAD
  mandateId:         "MND-YYYY-MM-DD-XXXX",   // UUID v4 human-readable
  createdAt:         Timestamp,
  updatedAt:         Timestamp,
  version:           1,

  // TIPO
  type:              'Advisory' | 'Asset' | 'Trade',
  // Advisory = M&A, estructuración
  // Asset    = commodities, capital privado (STAK)
  // Trade    = ejecución de órdenes, liquidez

  purpose:           string,                   // max 200 chars

  // SUBYACENTE
  asset: {
    class:           'Metals' | 'Energy' | 'Agriculture' | 'Structured' | 'M&A_Target',
    description:     string,
    currency:        'USD' | 'EUR' | 'CHF' | 'GBP',
    estimatedValue:  number,                   // en USD equivalente
  },

  // ESTADO
  fiduciaryState:    'Gestation' | 'Embryonic' | 'Maturation' | 'Qualified' | 'Executed' | 'Archived',

  // VISIBILIDAD
  locked:            boolean,                  // true = solo visible con clearance suficiente

  // ORIGINADOR
  originatorId:      string,                   // AIP entity ID
}
```

### Campos suplemento (consenso pendiente — ver nota Director)

```js
{
  // PARTES EXTERNAS (cuando el mandato tiene contraparte activa)
  counterparties: [{
    entityId:    string,
    role:        'Buyer' | 'Seller' | 'LiquidityProvider' | 'Custodian',
    status:      'Pending' | 'Accepted' | 'Rejected',
  }],

  // COMPLIANCE
  compliance: {
    kycStatus:   'Pending' | 'Tier1_Verified' | 'Tier2_Verified' | 'Tier3_Verified',
    amlStatus:   'Pending' | 'Cleared' | 'Flagged',
    integrityScoreAtCreation: number,
  },

  // CUANTITATIVO (para commodities)
  asset_quantity:  number,
  asset_unit:      'tonnes' | 'oz' | 'barrels' | 'MW',

  // REFERENCIA A DOCUMENTOS (VDR)
  documents:       string[],                   // IDs en agent_documents/

  // TICKER (display en landing)
  ticker_label:    string,                     // ej. "COPPER · QUALIFIED"

  // GENEALOGÍA
  parentMandateId: string,                     // para splits o derivaciones
}
```

> **NOTA DIRECTOR:** los campos de suplemento requieren consenso por área (Metals, Energy, M&A, Structured). Propuesta: definir en despacho dedicado con el Director un schema por `type` de mandato. Este schema mínimo permite ya cargar mandatos reales en Firestore hoy.

---

## [SEC-06] Modelo de negocio y comisiones

**Triple función (R-SUPPLY-01):**
1. AIP emite sus propios mandatos (brokerage propio)
2. Agentes proponen sus mandatos (plataforma de agentes)
3. Terceros verificados cargan mandatos (marketplace)

**Modelo de comisiones (BP01 §1.4):**

| Rol | % base | Condición |
|---|---|---|
| Originador (First Touch) | 40% | Primer contacto documentado en el sistema |
| Ejecutor (Last Touch) | 40% | Quien cierra el deal (firma + liquidación) |
| Casa (AIP) | 20% | Compliance + infraestructura + matching |

Si Originador = Ejecutor (mismo agente): 80% agente + 20% AIP.

**Regla de atribución (R-MT-01):** el primer agente que asocia un `legalEntityId` a un proyecto tiene derecho de tanteo por 90 días.

---

## [SEC-07] Stack técnico y arquitectura

```
FRONTEND
  index.html         ← entry point (Tailwind CDN — migrar a Vite en Forja 9+)
  src/
    main.js          ← AIPHandler v18.7 (FROZEN — legacy v1.2.1)
    ignition-v13.js  ← Walking Skeleton v1.3 (bridges + ComponentRegistry)
    01-core/
      app-fsm.js     ← FSM v1.3 (estados: ORBIT_1_GUEST → ORBIT_3_LEGAL_ATTESTATION → ORBIT_3_CRM_ACTIVE)
      app-store.js   ← micro-store Zero-Trust (claim único, batch notify)
      passportValidator.js ← valida payload → emite AccessGranted
    03-interface/
      app-router.js  ← router v1.3 (FSM_VIEW_MAP → Web Components)
      base/
        reactive-element.js ← base de todos los gadgets v1.3
    gadgets/         ← Web Components Light DOM (landing)
    verticals/aip/   ← AIPHandler + CRM (legacy v1.2.1)

BACKEND
  functions/index.js ← dispatcher executeUserAction (onCall, Node 20, minInstances:1)
    ACTIONS: submitKycIndividual | submitKyb | submitKycL4 | patchAccountProfile

FIRESTORE SCHEMA
  users/{uid}                         ← perfil + kyc_status + clearanceLevel + integrityScore
  mandates/{mandateId}                ← mandatos (actualmente en mockState.js)
  kyc_submissions/{uid}               ← KYC individual (keyed by uid — FS-01 deuda)
  kyc_kyb_submissions/{uid}           ← KYC entidades
  kyc_l4_submissions/{uid}            ← KYC nivel 4
  audit_log/{uid}/events/{eventId}    ← inmutable, append-only
  rate_limits/{uid}                   ← cooldown por action (SYS-RATE-01)
  agent_documents/{uid}/docs/{docId}  ← VDR de documentos del agente

AUTH
  Firebase Auth: Google OAuth (P0-OAUTH-01 — pendiente activar en Console)
  VIP key: bypass para acceso privilegiado (aip-gatekeeper.js)
```

---

## [SEC-08] Brecha implementación vs. blueprint (estado 2026-06-21)

| Componente | Blueprint | Implementado | Gap |
|---|---|---|---|
| Clearance model | ✅ BP01 §1.1 | Parcial (mockState M. ARRIETA BRONZE L-1) | No conectado a Firebase Auth real |
| IntegrityScore | ✅ BP01 §1.3 fórmula | ❌ Solo mockState | Asignación manual admin (hoy) · función automática (Forja 9+) |
| Mandate schema | ✅ BP03 §1.2 | Parcial (mockState, sin Firestore real) | Cargar mandatos reales en Firestore |
| KYC pipeline | ✅ BP01 §1.2 | ✅ Cloud Function dispatcher | Keyed by uid (FS-01 deuda historia) |
| Commission model | ✅ BP01 §1.4 | ❌ No implementado | Requiere campo `originatorId` + `referral_code` en KYC |
| Orbit-3 UI | ✅ BP02 tokens | ✅ Parcial (Walking Skeleton) | FSM_VIEW_MAP incompleto (solo ORBIT_3_LEGAL_ATTESTATION) |
| OAuth login | ✅ implícito | ❌ No activado en Firebase Console | Director: 10 min de configuración |
| firestore.rules | ✅ implementado | ❌ No deployadas | Director: `firebase deploy --only firestore:rules` |

---

## [SEC-09] Balizas a blueprints fuente

Los blueprints completos (con toda la lógica de UI/UX, event storming y specs detalladas) viven en:

| # | Archivo | Contenido |
|---|---|---|
| BP01 | `03_INBOX/AIP_legacy_logs/tactical_logs/AIP_v1.2.1/fase_02_gadgets_ini/2026-05-03_DOMAIN_BLUEPRINT_01.md` | Clearance matrix, IntegrityScore, AnonProjectState, comisiones, compliance ledger |
| BP02 | `...fase_02_gadgets_ini/2026-05-24_DOMAIN_BLUEPRINT_02_ORBITA_3.md` | Tokens CSS Orbit-3, topología de panel, paleta fiduciaria |
| BP03 | `...fase_02_gadgets_ini/2026-05-24_DOMAIN_BLUEPRINT_03_CRM_MANDATE.md` | Mandate TypeScript interface, event storming, órbitas CRM |
| BP04 | `...fase_04_aip_v1.3/DOMAIN_BLUEPRINT_04_CRM_SHELL.md` | Shell CRM v1.3 |
| BP05 | `04_ARCHIVE/boveda_antigravity_v0.3.5_skeleton_2026-06-14/DOMAIN_BLUEPRINT_05_L2_NODE_CONTRACT.md` | L2 node contract |

> Estos blueprints NO tienen cabecera METAFAC — son legado pre-R-RIZOMA-LEY-01. Son válidos en contenido pero invisibles para el sistema de indexación. Candidatos a arqueología con Almacén (INV-FORJA9-01).

