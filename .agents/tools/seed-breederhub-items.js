// ============================================================
// ARCHIVO  : seed-breederhub-items.js
// VERSIÓN  : 1.1.0
// FECHA    : 2026-06-28
// PROPÓSITO: Poblar Firestore /breederhub_items con los 20 tickets
//            abiertos del polígono (P0/P1/P2/P3) para el Decision
//            Inbox del CRM Breederhub. Solo inserta si el ítem no
//            existe aún (idempotente por campo `ref_id`).
// USO      : node .agents/tools/seed-breederhub-items.js
// RUNTIME  : Node.js con firebase-admin (serviceAccountKey.json en raíz)
// ============================================================

// ÍNDICE
// [SEC-01] Bootstrap Firebase Admin
// [SEC-02] Dataset — 19 ítems del polígono (P0 → P3)
// [SEC-03] runSeed — inserción idempotente
// [SEC-04] Entry point

'use strict';

// ─────────────────────────────────────────────────────
// [SEC-01] Bootstrap Firebase Admin
// ─────────────────────────────────────────────────────
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs   = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERROR: serviceAccountKey.json no encontrado en raíz del proyecto AIP.');
    process.exit(1);
}

initializeApp({ credential: cert(require(serviceAccountPath)) });
const db = getFirestore();

// ─────────────────────────────────────────────────────
// [SEC-02] Dataset — 20 ítems del polígono
// Estructura canónica: breederhub_items schema v1.0.0
// (CRM-BHUB-02_despacho_bulldozer.md §BLOQUE B)
// v1.1.0 — eliminados CRM-BHUB-02 (completado) e INV-DIGESTION-01 (validado)
//         — añadidos GOB-CONCURRENCIA-01, DEUDA-NODO-MATRIZ-FIRESTORE-01,
//           DEUDA-METRICAS-AUTO-01 (sesión 2026-06-28)
// ─────────────────────────────────────────────────────

/** @typedef {'DECISION'|'DESPACHO'|'INVESTIGACION'|'TICKET'|'HITO'|'NODO'|'DOCTRINA'} ItemTipo */
/** @typedef {'AIP'|'DEMIURGO'|'GLOBIZMARKT'|'CPII'|'TRANSVERSAL'} ItemVertical */
/** @typedef {'P0'|'P1'|'P2'|'P3'} Prioridad */
/** @typedef {'Alert'|'Suggest'|'Act'} Autonomia */

/** @type {Array<{ref_id: string, tipo: ItemTipo, vertical: ItemVertical, titulo: string, descripcion: string, accion_propuesta: string|null, referencia_disco: string|null, prioridad: Prioridad, autonomia: Autonomia, creado_por: string, agente_asignado: string|null}>} */
const ITEMS = [

    // ── P0 — Bloqueantes críticos ─────────────────────────────
    {
        ref_id:           'GOB-ROADMAP-INVERSOR-01',
        tipo:             'DECISION',
        vertical:         'GLOBIZMARKT',
        titulo:           'Roadmap inversor Famalicão — constitución societaria Jul-15',
        descripcion:      'El inversor de Famalicão requiere un roadmap formal para avanzar a la constitución de la sociedad vehículo, con deadline 15-Jul-2026 (~19 días desde 2026-06-26). Sin sesión dedicada iniciada aún.',
        accion_propuesta: 'Abrir sesión dedicada GOB-ROADMAP-INVERSOR-01. Redactar roadmap: vehículo societario, plazos, aportaciones, hitos.',
        referencia_disco: '03_INBOX/AIP_legacy_logs/.../Globizmarkt_v1.0 [...]/fase_00_transversal/01_master_tasks.md',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'ADM-DUAL-FSM-01',
        tipo:             'TICKET',
        vertical:         'AIP',
        titulo:           'Dos FSMs activas sin SSoT — bloquea todo refactor AIP',
        descripcion:      'userFSM (auth flow) y app-fsm (navegación) operan en paralelo sin fuente única de verdad. Es la raíz de todos los refactors pendientes en AIP v1.2.1.',
        accion_propuesta: 'Definir SSoT: ¿userFSM absorbe app-fsm, o coordinador de orden superior? Decisión Director antes de Forja 9+.',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/fase_00_transversal/00_master_tasks.md',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'DO-01',
        tipo:             'TICKET',
        vertical:         'AIP',
        titulo:           'Tailwind CDN 3MB en producción — bloquea deploy real',
        descripcion:      'AIP carga Tailwind CSS vía CDN (3MB no compilado) en producción. Sin build toolchain. Resuelto en conjunto con CCD-P30 (Vite).',
        accion_propuesta: 'Decidir CCD-P30 (Vite) y ejecutar Forja 9+ que incluye: Vite, Tailwind purge, build pipeline.',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/fase_00_transversal/00_master_tasks.md',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'SEC-FUNC-03',
        tipo:             'TICKET',
        vertical:         'AIP',
        titulo:           'PII sin cifrar en Firestore kyc_submissions — GDPR bloqueante',
        descripcion:      'Datos de identificación personal (nombre, DNI, dirección) se almacenan en claro en Firestore. Viola GDPR. Bloquea cualquier uso real con usuarios externos.',
        accion_propuesta: 'Cifrar campos PII en Firestore antes de Forja 9+ o definir plan de migración.',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/fase_00_transversal/00_master_tasks.md',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'CCD-P30',
        tipo:             'DECISION',
        vertical:         'AIP',
        titulo:           'Decisión: adoptar Vite como build toolchain para Forja 9+',
        descripcion:      'CCD Pregunta 30 abierta. Vite resuelve DO-01 (Tailwind CDN) + P8-TL-02 (sin build toolchain) + PERF-LAZY-01 (carga diferida) + P10-OPS-02 (bundling). Decisión fundacional para el roadmap técnico.',
        accion_propuesta: 'Director: Aprobar Vite → desbloquea roadmap completo de Forja 9+.',
        referencia_disco: '03_INBOX/AIP_legacy_logs/.../fase_08_orbita4/02_notas_fase_08.4.md §CCD-P30',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'PUSH-GITHUB-AIP',
        tipo:             'HITO',
        vertical:         'AIP',
        titulo:           'Push pendiente: commits AIP locales sin deploy a GitHub',
        descripcion:      'Commits e350b9e/a216895/a1550db/4545e89/71046cb/190b4ed están en local main pero sin push a origin. Sin Vercel deploy activo hasta que lleguen.',
        accion_propuesta: 'Director ejecuta: cd C:\\BreederHub\\01_PRODUCTION\\AIP_v1.2.1 && git push origin main',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },

    // ── P1 — Alta prioridad, no bloqueante inmediato ──────────
    {
        ref_id:           'GOB-14b',
        tipo:             'TICKET',
        vertical:         'DEMIURGO',
        titulo:           'Mojibake en bloque GOB-14b — texto ilegible en despacho activo',
        descripcion:      'El bloque GOB-14b en los logs del Cerebro contiene texto con encoding corrupto (mojibake). Afecta legibilidad de un ítem de gobernanza activo.',
        accion_propuesta: 'Sentinel: localizar y corregir el encoding del bloque GOB-14b en el despacho Demiurgo correspondiente.',
        referencia_disco: '.demiurgo/tactical-logs/00_transversal/01_master_tasks.md',
        prioridad:        'P1',
        autonomia:        'Act',
        creado_por:       'SENTINEL',
        agente_asignado:  'Sentinel',
    },
    {
        ref_id:           'KYC-INDIVIDUAL-LAPAROSCOPIA-01',
        tipo:             'DESPACHO',
        vertical:         'AIP',
        titulo:           '3 cambios urgentes en KYC Individual: pre-fill + MiFID + evento Submitted',
        descripcion:      'Investigación KYC-INDIVIDUAL-LAPAROSCOPIA-01 identificó 3 cambios urgentes: (1) pre-fill inter-componente de datos ya capturados, (2) clasificador MiFID automático, (3) evento KYC:Individual:Submitted faltante.',
        accion_propuesta: 'Emitir despacho laparoscopia a Bulldozer o Lead Architect para implementar los 3 cambios en el componente kyc-individual.',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/fase_00_transversal/00_master_tasks.md',
        prioridad:        'P1',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'INV-RSI-SENSOR-01',
        tipo:             'INVESTIGACION',
        vertical:         'TRANSVERSAL',
        titulo:           'RSI Sensor: cómo el RMU detecta saltos de calidad sin Director',
        descripcion:      'Despacho 3-etapas emitido. Investigación sobre cómo el Rizoma Multinivel Universal puede detectar automáticamente mejoras de calidad sin requerir validación manual del Director en cada ciclo.',
        accion_propuesta: 'Continuar ejecución del despacho 3 etapas INV-RSI-SENSOR-01 en sesión Demiurgo.',
        referencia_disco: '.demiurgo/tactical-logs/00_transversal/01_master_tasks.md',
        prioridad:        'P1',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'Lead Architect [A-04]',
    },
    {
        ref_id:           'CCD-P29',
        tipo:             'DECISION',
        vertical:         'AIP',
        titulo:           'Decisión: ¿updateMandate en dispatcher ahora o diferir a Forja 9+?',
        descripcion:      'CCD Pregunta 29 (resuelta: Decision Inbox = CRM Breederhub) pero la implementación de updateMandate en el dispatcher sigue pendiente. ¿Se implementa en la próxima sesión AIP o espera a Forja 9+?',
        accion_propuesta: 'Director: Resolver si updateMandate va en próxima sesión AIP o en Forja 9+.',
        referencia_disco: '03_INBOX/AIP_legacy_logs/.../fase_08_orbita4/02_notas_fase_08.4.md',
        prioridad:        'P1',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'GLOBIZ-F02-02',
        tipo:             'INVESTIGACION',
        vertical:         'GLOBIZMARKT',
        titulo:           'Definición KAIROS en Globizmarkt — colisión R-CROSS-02 con AIMON de AIP',
        descripcion:      'CCD Pregunta 20 abierta: KAIROS en Globizmarkt fase_02 y AIMON en AIP son conceptos que colisionan (R-CROSS-02). Sin definición resuelta, el vocabulario del polígono es ambiguo.',
        accion_propuesta: 'Director resuelve CCD-P20: ¿son el mismo concepto adaptado o dos conceptos distintos?',
        referencia_disco: '03_INBOX/GLOBIZMARKT_legacy_logs/.../fase_00_transversal/01_master_tasks.md',
        prioridad:        'P1',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'DEUDA-ISADMIN-IGNITION',
        tipo:             'TICKET',
        vertical:         'AIP',
        titulo:           'isAdmin usa roles incorrectos vs. clearance canónico en ignition §16',
        descripcion:      'El check isAdmin en ignition §16 comprueba role === ADMIN || role === DIRECTOR, pero el sistema canónico usa clearance levels [superadmin, partner, desk_manager]. Los roles ADMIN/DIRECTOR no existen en producción.',
        accion_propuesta: 'Laparoscopia en ignition-v13.js §16: reemplazar check de rol por check de clearance_level >= 2 o roles canónicos.',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/ignition-v13.js §16',
        prioridad:        'P1',
        autonomia:        'Act',
        creado_por:       'SENTINEL',
        agente_asignado:  'Sentinel',
    },

    // ── P2 — Deuda estratégica, sin deadline inmediato ────────
    {
        ref_id:           'INV-TAX-01',
        tipo:             'INVESTIGACION',
        vertical:         'TRANSVERSAL',
        titulo:           'Taxonomía SCOPE×DOMAIN — bloquea reubicación de doctrina',
        descripcion:      'INV-TAX-01: definición de la matriz SCOPE×DOMAIN para clasificar toda la doctrina del polígono. Sin ella, la reubicación de archivos doctrinales en R-GEO-01 queda incompleta.',
        accion_propuesta: 'Lead Architect: completar propuesta SCOPE×DOMAIN. Sentinel espera output para propagar.',
        referencia_disco: '01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/',
        prioridad:        'P2',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'Lead Architect [A-04]',
    },
    {
        ref_id:           'HUE-KAIROS-AIMON-SCAN-01',
        tipo:             'INVESTIGACION',
        vertical:         'TRANSVERSAL',
        titulo:           'Barrido KAIROS/AIMON — 556 archivos, señal de parada R-ARQ-02',
        descripcion:      'HUE detectado: 556 archivos legacy con referencias a KAIROS/AIMON en AIP v1.1. R-ARQ-02 (10/25) disparó señal de parada por volumen. Candidato a destilación profunda.',
        accion_propuesta: 'Programar campaña KAIROS/AIMON con VAULT cuando se resuelva GLOBIZ-F02-02 (definición limpia).',
        referencia_disco: '02_LABORATORY/research/AIP_v1.1/',
        prioridad:        'P2',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'VAULT',
    },
    {
        ref_id:           'N-60-QWEN-QUEUE',
        tipo:             'DESPACHO',
        vertical:         'TRANSVERSAL',
        titulo:           'Cola Qwen [N-60]: ~52 archivos no-MD pendientes de conversión',
        descripcion:      'Barrido 2026-06-26 detectó ~52 PDFs/ODTs/DOCXs/XLSXs en el polígono (excl. archive) que necesitan conversión a MD via Qwen Doc-to-MD. Lotes A-F organizados por vertical.',
        accion_propuesta: 'Director: iniciar conversión por lotes A → B → E → F con Qwen Doc-to-MD. Cola en [N-60].',
        referencia_disco: '03_INBOX/00_arqueologia_pendiente/QWEN_CONVERSION_QUEUE.md',
        prioridad:        'P2',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'Qwen Doc-to-MD',
    },

    // ── P1 — Nuevos detectados en barrido 2026-06-26 ─────────
    {
        ref_id:           'HUE-16-AUTOCONCIENCIA-BIFURCADA',
        tipo:             'TICKET',
        vertical:         'DEMIURGO',
        titulo:           'AUTOCONCIENCIA_FACTORIA bifurcada — memoria viva en dos lugares',
        descripcion:      '00_FACTORY_CORE/doctrine/memory/ tiene 64KB (real, Sentinel escribe aquí). 01.2_DOCTRINA_2026/memory/ tiene 485 bytes (baliza vacía). R-GEO-01 dice que el canónico es 01.2_DOCTRINA pero el contenido real está en 00_FACTORY_CORE. Cualquier escritura nueva en el lugar equivocado amplifica la bifurcación.',
        accion_propuesta: 'Director decide epicentro (R-EPICENTRO-01): ¿00_FACTORY_CORE o 01.2_DOCTRINA_2026? Sentinel ejecuta fusión + baliza en origen.',
        referencia_disco: '00_FACTORY_CORE/doctrine/memory/AUTOCONCIENCIA_FACTORIA.md',
        prioridad:        'P1',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'OP-01-DEPOSITO-LEGACY-MASIVO',
        tipo:             'DESPACHO',
        vertical:         'TRANSVERSAL',
        titulo:           'DEPÓSITO-LEGACY-MASIVO-01: 7 lotes a 04_ARCHIVE (READY)',
        descripcion:      'Operación aprobada pendiente de ejecución. 7 lotes: compliance×3 (congeladas abr 2026), translate, flujo_orquestacion, undo_arqueologo (en refactor/), breederhub-legacy, cpii_crm_legacy, aip_legacy_archive. 7 balizas [D-*-LEG-01]. R19: preservar no eliminar.',
        accion_propuesta: 'Sentinel: ejecutar git mv + balizas en sesión dedicada de limpieza de disco.',
        referencia_disco: '02_LABORATORY/research/legacy_prompts_analysis/refactor/',
        prioridad:        'P1',
        autonomia:        'Act',
        creado_por:       'SENTINEL',
        agente_asignado:  'Sentinel',
    },
    {
        ref_id:           'HUE-18-AIP-FASES-01-07',
        tipo:             'INVESTIGACION',
        vertical:         'AIP',
        titulo:           'AIP fases 01-07: 277 archivos sin destilar (19.5MB)',
        descripcion:      'Las 7 fases legacy de AIP v1.2.1 (fase_01_second_reborn → fase_07_procedimientos) nunca han pasado por VAULT ni destilación R-ARQ-02. fase_05 sola son 72 archivos, 11MB. Mayor reserva de conocimiento no destilado del polígono.',
        accion_propuesta: 'Orden R-ARQ-02 10/25: empezar por fase_07 (más reciente, 42 archivos, 772KB). Agente: VAULT o Almacén en sesión dedicada.',
        referencia_disco: '03_INBOX/AIP_legacy_logs/tactical_logs/AIP_v1.2.1/fase_07_procedimientos/',
        prioridad:        'P1',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'VAULT',
    },

    // ── Nuevos 2026-06-28 ─────────────────────────────────────
    {
        ref_id:           'GOB-CONCURRENCIA-01',
        tipo:             'TICKET',
        vertical:         'TRANSVERSAL',
        titulo:           'Dos sesiones Claude Code sin lock — conflictos de commits',
        descripcion:      'Patrón detectado 2 veces (Caso 1: colisión IDs [N-46]; Caso 2: sesión AITOR absorbió forja [N-65] en commits no relacionados). Capa A resuelta: allocator atómico assign-node-id.ps1. Capa B pendiente: SESSION_LOCK.md + Vector 3 (detección sesión activa). Causa raíz: repo compartido sin mecanismo de checkout de trabajo.',
        accion_propuesta: 'Implementar SESSION_LOCK.md + hook en PRE_IGNICION. Migrar a Firestore session registry cuando CRM esté vivo.',
        referencia_disco: '00_FACTORY_CORE/tools/assign-node-id.ps1',
        prioridad:        'P1',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'Sentinel',
    },
    {
        ref_id:           'DEUDA-NODO-MATRIZ-FIRESTORE-01',
        tipo:             'TICKET',
        vertical:         'TRANSVERSAL',
        titulo:           '[N-65] emite en markdown — migrar a Firestore poligono_salud',
        descripcion:      'El NODO-MATRIZ [N-65] computa y emite el estado del polígono en SEC-05 (markdown). Contrato Firestore ya definido (colección poligono_salud, doc snapshot_actual). Migración pendiente hasta que crm-breederhub.js tenga datos vivos.',
        accion_propuesta: 'Cuando CRM tenga datos reales: crear script emit-salud.js que lea [N-62]+[N-65] y escriba a Firestore poligono_salud.',
        referencia_disco: '00_FACTORY_CORE/breederhub_v2.0/00_arquitectura_poligono/03_NODO_MATRIZ_SALUD_POLIGONO.md §4',
        prioridad:        'P2',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'DEUDA-METRICAS-AUTO-01',
        tipo:             'TICKET',
        vertical:         'TRANSVERSAL',
        titulo:           'Autonomia y Claridad de [N-65] aun no son mecanicas (N/D)',
        descripcion:      'Primer computo [N-65] (2026-06-28): Respiracion calculada automaticamente via [N-62]; Autonomia requiere escala L0-L3 de protocolos (barrido manual pendiente); Claridad requiere grep automatico de 6 verificaciones A-F (CCD/RIZOMA/GLOSARIO/balizas). Ambas marcan N/D hasta que se construyan los scripts.',
        accion_propuesta: 'Forjar check-claridad.ps1 (6 greps: CCD abiertos, HUEs sin agente, balizas muertas, RIZOMA desincronizado, terminos inconsistentes, duplicacion SSOT). Escala L0-L3 para Autonomia: mapear protocolos existentes.',
        referencia_disco: '00_FACTORY_CORE/breederhub_v2.0/00_arquitectura_poligono/03_NODO_MATRIZ_SALUD_POLIGONO.md §3',
        prioridad:        'P2',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },

    // ── P3 — Deuda futura, sin urgencia activa ────────────────
    {
        ref_id:           'DEUDA-MALLA-L3-FUENTES-01',
        tipo:             'DOCTRINA',
        vertical:         'TRANSVERSAL',
        titulo:           'Deuda futura: fuentes de notebooks L3 sin copia en disco',
        descripcion:      'R-MALLA-EXTERNA-01 identifica que para que el monocentrismo cubra el conocimiento (no solo prompts), las fuentes de cada notebook L3 (NotebookLM) deberían tener copia en disco (boveda_*/fuentes/). Director: "no es el momento" — deuda futura.',
        accion_propuesta: 'Cuando el monocentrismo esté completo, crear boveda_*/fuentes/ con copia de cada fuente L3.',
        referencia_disco: '01_PRODUCTION/01.2_DOCTRINA_2026/doctrine/R-MALLA-EXTERNA-01.md',
        prioridad:        'P3',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'PROTOCOLO-LUNES-X10',
        tipo:             'HITO',
        vertical:         'TRANSVERSAL',
        titulo:           'x10: Protocolo de cadencia lunes (30 min) — orquestador asíncrono',
        descripcion:      'El Director pasa de co-piloto presente a orquestador asíncrono: lunes abre CRM → inbox muestra N ítems → aprueba/rechaza/delega en 30 min → agentes ejecutan durante la semana sin Director presente → próximo lunes revisa resultados. Requiere: (1) crm-breederhub.js operativo, (2) seed de ítems poblado, (3) cadencia formalizada.',
        accion_propuesta: 'Activar cuando crm-breederhub.js y seed estén en producción. Este ítem es el hito de arranque del ciclo x10.',
        referencia_disco: '03_INBOX/BREEDERHUB_legacy_logs/.../Breeder_fase_01.3_crm/',
        prioridad:        'P3',
        autonomia:        'Act',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
];

// ─────────────────────────────────────────────────────
// [SEC-03] runSeed — inserción idempotente
// ─────────────────────────────────────────────────────
async function runSeed() {
    const col = db.collection('breederhub_items');
    let inserted = 0;
    let skipped  = 0;

    console.log(`\n[INIT] seed-breederhub-items v1.0.0 — ${ITEMS.length} ítems a procesar\n`);

    for (const item of ITEMS) {
        // Idempotencia: buscar por ref_id
        const existing = await col.where('ref_id', '==', item.ref_id).limit(1).get();

        if (!existing.empty) {
            console.log(`  ⏭  SKIP   [${item.prioridad}] ${item.ref_id}`);
            skipped++;
            continue;
        }

        const doc = {
            ...item,
            estado:              'PENDIENTE',
            fecha_creacion:      FieldValue.serverTimestamp(),
            fecha_actualizacion: FieldValue.serverTimestamp(),
            fecha_resolucion:    null,
        };

        await col.add(doc);
        console.log(`  ✅ INSERT [${item.prioridad}] ${item.ref_id} — ${item.titulo.slice(0, 55)}…`);
        inserted++;
    }

    console.log(`\n[DONE] Insertados: ${inserted} | Omitidos (ya existían): ${skipped}\n`);
    console.log('  → Abrir AIP CRM → footer Órbita 3 → "Dashboard Breederhub" para ver el inbox.\n');

    process.exit(0);
}

// ─────────────────────────────────────────────────────
// [SEC-04] Entry point
// ─────────────────────────────────────────────────────
runSeed().catch(err => {
    console.error('❌ [FATAL] Error en seed:', err);
    process.exit(1);
});
