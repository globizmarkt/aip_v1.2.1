---
METAFAC_VER: 0.6.0
GEO_LOC: 01_PRODUCTION/AIP_v1.2.1/doctrine/architecture/ADR_002_MIGRACION_NL.md
SCOPE: VERTICAL
DOMAIN: ARCHITECTURE
GENEALOGÍA: movido desde 01_PRODUCTION/01.2_DOCTRINA_2026/architecture/ · INV-TAX-01 ronda 2 · 2026-06-26
PROJECT: AIP_v1.2
PHASE: ARQ-VALIDATED
STATUS: DISTILLED
TIMESTAMP: 2026-06-07
ORIGIN: ARQ-14 (Archaeological extraction)
PRODUCED_BY: Antigravity
---

# ADR-002: Migración a Jurisdicción de Países Bajos (AFM/DNB)

## 1. Contexto Comercial y Legal
El sistema AIP (Alternative Investment Platform) debe operar bajo un marco regulatorio estricto para transacciones fiduciarias institucionales. Originalmente, existía ambigüedad en la jurisdicción aplicable. 

## 2. Decisión Arquitectónica
Se establece formalmente la migración de todo el marco legal, de compliance y de validación de KYC/AML a la jurisdicción de **Países Bajos (NL)**, bajo la supervisión de la **Autoriteit Financiële Markten (AFM)** y De Nederlandsche Bank (DNB).

## 3. Consecuencias en el Código y Compliance
Esta decisión tiene impacto directo en la lógica de negocio (Policy Engine):
- **KYC/AML**: Los motores de validación y screening de entidades deben ajustarse a la normativa DNB (incluyendo la directiva AMLD5 de la UE aplicada a Holanda).
- **Esclusa de Cristal / NDA Gate**: Los documentos legales generados dinámicamente deben citar la legislación holandesa como ley aplicable para resolución de disputas.
- **Data Residency (GDPR)**: Los datos deben persistir en servidores dentro del Espacio Económico Europeo (preferiblemente NL o Frankfurt).
- **Protección**: Toda validación de `gatekeeper_extensions.jurisdiction_check` utilizará a NL como su centro canónico.

## 4. Estado
**Aprobado** (Lote 1 ARQ-VALIDATED). Esta decisión es de obligado cumplimiento para todo agente de compliance y lógica de backend.

