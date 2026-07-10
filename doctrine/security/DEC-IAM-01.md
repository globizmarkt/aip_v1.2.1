<!-- ============================================================
ARCHIVO  : DEC-IAM-01.md
VERSIÓN  : 1.0.0
FECHA    : 2026-06-08
PROPÓSITO: Decisión arquitectónica — modelo de Identidad y Roles (IAM) de AIP
============================================================ -->

<!--
ÍNDICE
[SEC-01] Cabecera METAFAC
[SEC-02] La decisión
[SEC-03] Modelo de clearances
[SEC-04] Flujo de autenticación
[SEC-05] Invariantes
[SEC-06] Anti-patrones detectados
-->

---
METAFAC_VER: 0.6.0
GEO_LOC: 01_PRODUCTION/AIP_v1.2.1/doctrine/security/DEC-IAM-01.md
SCOPE: VERTICAL
DOMAIN: SECURITY
GENEALOGÍA: movido desde 01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/ · INV-TAX-01 ronda 2 · 2026-06-26
TYPE: DECISIÓN ARQUITECTÓNICA — IAM skeleton-core AIP
STATUS: VALIDADO — Director (sesión VIBE-AIP-S-REBORN-05, 2026-06-10)
TRIGGER: Antes de modificar el store de identidad/clearances o cualquier guarda de rol
TIMESTAMP: 2026-06-08
PRODUCED_BY: GEM Antigravity [A-06] — despacho D ronda 04.3.4
---

# DEC-IAM-01 — Arquitectura de Identidad y Roles AIP

<!-- [SEC-02] La decisión -->
## LA DECISIÓN

El modelo IAM de AIP delega la autoridad de identidad exclusivamente al Store reactivo
central, prohibiendo la consulta directa a Firebase Auth en la capa de componentes. La
jerarquía se define mediante un sistema de *Clearances* evaluados estáticamente desde el
estado global, asegurando el aislamiento fiduciario (Zero-Trust).

<!-- [SEC-03] Modelo de clearances -->
## MODELO DE CLEARANCES

| Clearance | Descripción | Qué puede ver/hacer |
| --- | --- | --- |
| **GUEST** | Usuario no autenticado / Anónimo | Ver landing pública, iniciar proceso de registro/login. Bloqueo total a polígonos fiduciarios. |
| **MEMBER** | Autenticado básico (Sin KYC) | Acceso a dashboard inicial, resolución de Peaje Legal (`aip-legal-attestation`), flujos preparatorios. |
| **ACCREDITED** | Fiduciario verificado (KYC Retail) | Acceso a oportunidades de inversión estándar, visualización de posiciones, firma de mandatos básicos. |
| **PLATINUM** | Fiduciario Profesional / Institucional | Acceso a Dealflow VIP, operaciones de alto volumen, Data Rooms exclusivas. |
| **SUPERADMIN** | Operador de la Planta / Director | Acceso irrestricto, lectura del registro de auditoría (Triple-Write logs), omisión de peajes legales. |

<!-- [SEC-04] Flujo de autenticación -->
## FLUJO DE AUTENTICACIÓN

```
[ Proveedor de Identidad: Firebase Auth ]
  ↓ (Notifica cambio de estado / Emite JWT)
[ Auth Service (01-core) ]
  ↓ (Decodifica, valida y traduce a nivel de Clearance)
[ Store Global: window.Skeleton.store ]
  ↓ (Asienta window.Skeleton.store.getState().user.clearance y emite evento de mutación)
[ Componentes Web / Órbitas 2 y 3 ]
  ↓ (Se hidratan reactivamente según su mandato fiduciario)
[ DOM Ciego Renderizado ]
```

<!-- [SEC-05] Invariantes -->
## INVARIANTES (nunca violar)

1. **Aislamiento de la Interfaz** — Ningún componente UI (Órbitas 1, 2 o 3) tiene
   permitido importar o invocar directamente las librerías o métodos de Firebase Auth.
   Todo dato de identidad debe consumirse pasivamente del estado.
2. **Única Fuente de Verdad (SSOT)** — El nivel de autorización actual se lee estricta y
   únicamente de la propiedad `window.Skeleton.store.getState().user.clearance`. No se
   admite la lectura fragmentada de tokens en memoria local.
3. **Validación de Superposición** — La condición de `SUPERADMIN` se verifica a través de
   la presencia del clearance en el store consolidado del cliente, y nunca descifrando el
   JWT crudo a nivel de vista.
4. **Respuesta Default a Estado Desconocido** — Si el store carece de un valor de
   clearance explícito o el payload es anómalo, el sistema debe caer inmediatamente al
   estado `GUEST` (Fail-Closed por diseño Zero-Trust).

<!-- [SEC-06] Anti-patrones detectados -->
## ANTI-PATRONES DETECTADOS

Durante las auditorías de la Fase 06 (Authomatic Factory), se identificaron y purgaron
los siguientes vectores de riesgo:

- **Fallo Abierto en Capa de Autorización** — Se detectó un patrón donde la falta de
  asignación de rol concedía acceso temporal mientras se resolvía la promesa de
  identidad. Mitigado mediante el ticket **SEC-REVERT-01**, que restauró la política
  Zero-Trust (Fail-Closed absoluto).
- **Invasión de Capas** — Componentes como `aip-legal-attestation.js` o formularios
  previos intentaban resolver lógicas de bloqueo ad-hoc basándose en variables no
  estandarizadas, en lugar de suscribirse a `state?.system?.isLocked` o al clearance del
  usuario.
- **Micro-Verificaciones de Rol** — Código disperso evaluando condiciones arbitrarias en
  lugar de consultar la topología estricta de clearances de la Bóveda
  (GUEST → MEMBER → ACCREDITED → PLATINUM → SUPERADMIN).

---

*DEC-IAM-01 · Ronda 04.3.4 · GEM Antigravity [A-06] · validado y publicado por Sentinel · 2026-06-10*

