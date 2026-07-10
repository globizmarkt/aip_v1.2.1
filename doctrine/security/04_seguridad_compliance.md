---
METAFAC_VER: 1.0.0
GEO_LOC: 01_PRODUCTION/AIP_v1.2.1/doctrine/security/04_seguridad_compliance.md
SCOPE: VERTICAL
DOMAIN: SECURITY
GENEALOGÍA: movido desde 01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/ · INV-TAX-01 ronda 2 · 2026-06-26
PRODUCED_BY: Antigravity (Agente de Destilación Doctrinal)
AFFINITY_GROUP: AIP_v1.2 / Fase 12.5
CONTENT_CAT: DOCTRINE_CORE
STATUS: DISTILLED
EXTRACTION_TAG: DOCTRINA_ELEVADA
PROJECT: UNIVERSAL
TIMESTAMP: 2026-05-03
---

# 🛡️ SEGURIDAD Y COMPLIANCE (SFS PROTOCOLS)

> **Origen:** Fusión de `AIMON_GENESIS_AIP_BRIEF.md`, `UNIVERSAL_GATEKEEPER_LOGIC.md` y `03 Spec del Cliente`.

## 1. EL MOTOR DE INTEGRIDAD (GATEKEEPER)
Protocolo de acceso fractal mediante los 5 Checks:
- **0. Persistence:** Estado local.
- **1. Identity:** Firebase SSO.
- **2. ADN:** Configuración de la marca/vertical. Instanciación del wizard y carga de tokens visuales.
- **3. Legal:** Firma T&C UK.
- **4. Compliance:** KYC Status check.
- **5. Success:** Inyección de Workspace.

## 2. COMPLIANCE DINÁMICO E IA (AIMON)
La seguridad se apoya en una inteligencia proactiva que gestiona la fricción:
- **Error como Oportunidad:** Ante un acceso denegado (ej. `kyc_required`), AIMON transforma el error en un CTA guiado de onboarding, explicando el valor de la transparencia y la protección del cliente.
- **Lead Scoring NLP:** El formulario de acceso requiere una descripción de >12 palabras. El sistema utiliza NLP para evaluar la calidad y seriedad del prospecto antes de abrir la Órbita 3.
- **Upsell Engine:** AIMON detecta comportamientos de alto valor (>10M en un campo o >30 min de sesión) para sugerir la transición de cuenta *Seed* (Anónima) a *Startup/Enterprise* (Verificada).

## 3. MATRIZ DE ROLES (SOVEREIGN PERMISSIONS)
AIP implementa una jerarquía de acceso basada en la identidad global y la autorización local:
| Rol | Nivel Org | Scope de Datos | Subdominios | Tier Mínimo |
|---|---|---|---|---|
| `SuperAdmin` | UK — Partners | **Todo.** Mesas, agentes y estructura. | `mesa.*`, `agentes.*` | Enterprise |
| `Partner` | UK — Partners | Todo excepto infraestructura core. | `mesa.*`, `agentes.*` | Enterprise |
| `DeskManager` | UK — Directores | Solo su mesa operativa asignada. | `mesa.apfirm.com` | Startup |
| `CountryHead` | Red Agentes | Solo operaciones de su región/país. | `agentes.apfirm.com` | Startup |
| `Agent` | Red Agentes | Solo sus propios leads y operaciones. | `agentes.apfirm.com` | Startup |
| `Investor` | Cliente Final | Solo su propio portfolio y documentos. | `data.apfirm.com` | Seed → Startup |

**Regla de Aislamiento Crítica:** El `tenant_id` garantiza que un agente de una región (ej. España) no pueda visualizar operaciones de otra (ej. Dubái) mediante reglas de seguridad en el Edge.

### 3.1. ESTRUCTURA DE CLAIMS (JWT)
El acceso se gestiona en el Edge a través de Custom Claims inmutables inyectados en el token de Firebase:
- `role`: (`SuperAdmin`, `Partner`, `DeskManager`, `CountryHead`, `Agent`, `Investor`).
- `tenant_id`: Identificador de delegación para aislamiento multi-tenant en *Firestore Rules*.
- `tier`: Nivel de servicio (`Seed`, `Startup`, `Enterprise`).
- `compliance_status`: (`pending`, `verified`, `blocked`).

## 4. TRIPLE ESCLUSA DE CUMPLIMIENTO
1. **Esclusa 1 - Identidad:** Autenticación universal vía Firebase (Google SSO).
2. **Esclusa 2 - Jurisdicción:** El sistema ajusta el idioma y la normativa (RGPD/ADGM) según el origen del usuario, pero mantiene siempre la **Jurisdicción UK** como base contractual.
3. **Esclusa 3 - Perfil KYC/KYB:** El acceso a mesas sensibles (Commodities, SBLC) está bloqueado por el flag `compliance_verified`. AIMON gestiona el flujo de pre-calificación en fase *Seed*.

## 5. INFRAESTRUCTURA DE SEGURIDAD
- **Late Binding:** Vinculación de datos locales a UID real tras la detección del primer documento sensible.

## 6. SEGURIDAD DE INFRAESTRUCTURA (AIRGAP & SECRETS)
- **Airgap Admin:** La escalada de privilegios y gestión de *Custom Claims* se realiza exclusivamente vía Node.js Admin SDK en entorno seguro (Airgapped), nunca desde el frontend.
- **Zero-Leak Policy:** Los secretos (`serviceAccountKey.json`, `.env`) deben estar protegidos por `.gitignore` antes de cualquier operación en disco.
- **Sanitización de Roles:** Los scripts de administración validan roles contra una lista blanca inmutable de la firma.

---
*Fundamento Doctrinal: La seguridad no es una opción, es el producto real que vendemos.*

## 6. PROTOCOLO DE EMBARQUE PRE-KYC (QUALITATIVE ROUTING)
El sistema debe realizar una validación preliminar antes de solicitar datos sensibles:
- **Router Jurisdiccional:** Cruce de tipo de inversor (Institucional/Family Office/HNW) vs Jurisdicción vs Activo.
- **Minimización de Datos:** No se solicitan pasaportes hasta que el Router valida la elegibilidad teórica.

### 6.1. MATRIZ DE INMUTABILIDAD LEGAL
El Gatekeeper evalúa la validez de la firma fiduciaria en cada sesión:
- **First Access:** Sin firma -> `BLOCK_LEGAL` (Redirección al documento de T&C UK).
- **Outdated Version:** Firma existe pero la versión es antigua -> `BLOCK_LEGAL` (Refirma obligatoria por cambio regulatorio).
- **Compliant:** Firma válida y versión actual -> `PASS` (Acceso al Workspace).

## 8. ALGORITMO DE SCORING DE INTEGRIDAD (PRE-KYC)
El `IntegrityScore` (IS) evalúa la calidad fiduciaria antes de solicitar documentos sensibles. 
- **Threshold:** 60 puntos (Elegibilidad mínima).
- **Decay:** El score preliminar decae -10 puntos/día tras 72h de inactividad.

### 8.1. FACTORES DE PUNTUACIÓN
- **Jurisdicción (30%):** Tier 1 (UK/EU/USA) +30; Tier 2 +15; Tier 3 (Lista Gris/Negra) -50.
- **Identidad (30%):** FO/Inst Fund +30; Asset Manager +25; Professional +10.
- **Solvencia - AUM (25%):** >$100M +25; $10M-$100M +15; <$10M +0.
- **Origen de Fondos (15%):** Herencia/Activos verificables +15; Operativa +10.

### 8.2. REGLAS DE BLOQUEO
- **Hard Gate:** Si `IS < 60`, el pasaporte pasa a `CUSTODY_HOLD`. CTAs de diálogo bloqueados.
- **Blacklist Override:** Cualquier coincidencia en listas de sanción fuerza `IS = -100` y bloqueo de IP.

## 9. PROTOCOLO DEL CLOSING ENABLER (VALIDACIÓN INSTITUCIONAL)
El Closing Enabler es el analista técnico que da el "OK institucional" antes de cualquier cierre:
### 9.1. CHECK-LIST DE VALIDACIÓN SBLC (UCP600/URDG758)
1. Confirmar marco normativo (URDG 758 para garantías / ISP98-UCP600 para operaciones).
2. Verificación técnica del MT760: banco emisor en lista blanca, irrevocable, sin soft clauses.
3. Validación Bank-to-Bank: intercambio MT799/MT199 previo + confirmación escrita del banco beneficiario.
4. KYC/AML y sanciones: banco emisor limpio, beneficiarios sin hits confirmados.
5. Validación de propósito: SBLC encaja con contrato subyacente (SPA/Facility Agreement).

### 9.2. CONTRATOS DE EVENTOS DEL SISTEMA
| Evento | Payload clave | Canal |
|---|---|---|
| `AssetLocked` | assetId, previousState, reasonCode, integrityScoreAtLock | On-chain + Off-chain + Webhook |
| `IntegrityScoreDegraded` | assetId, previousScore, newScore, threshold, degradationReasons | Off-chain + Webhook riesgo |
| `VaultIoTPolicyViolation` | vaultId, deviceId, violationCode, severity | Off-chain + Alerta operativa |
| `JurisdictionRuleChanged` | ruleId, previousVisibilityState, newVisibilityState, rationale | Off-chain + opcional On-chain |

### 9.3. INVENTARIO DE SCHEMAS JSON (28+)
Schemas canónicos disponibles para implementación:
- **Core:** OfferingItem (PhysicalCommodity + FinancialEngineeringService), IntegrityScore, VaultIoTEvidence, JurisdictionRule.
- **Agents:** AgentProfile, AgentMetrics, CommissionWaterfall.
- **Commodities:** LiftingEvent, SettlementRequest.
- **Financial:** SwiftTrace, MonetizationDeal, PPPApplication, DealClosingStatus, DealNote.
- **Market:** SecondaryMarketListing, P2POffer, PayoutWallet, DividendDistribution.
- **Tokenization:** TokenizationBridge, RegulatoryReport.

