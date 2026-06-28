// ============================================================
// ARCHIVO  : sync-breederhub.js
// VERSION  : 1.1.0
// FECHA    : 2026-06-28
// PROPOSITO: Sincronizar Firestore breederhub_items con el estado
//            real del polígono (disk sources). Operacion UPSERT:
//            - NOT EXISTS -> insert con estado=PENDIENTE
//            - EXISTS + PENDIENTE/EN_REVISION -> actualiza metadata
//              (titulo, descripcion, prioridad, accion_propuesta,
//               referencia_disco) sin tocar el estado CRM
//            - EXISTS + COMPLETADO/RECHAZADO/DELEGADO -> skip
//              (preserva decisiones tomadas en el CRM)
//
// USO      : node .agents/tools/sync-breederhub.js
//            Integrado en protocolo R01 (cierre de sesion Sentinel)
//            Puede correr tambien como R02 (sync ligero mid-session)
//
// RUNTIME  : Node.js con firebase-admin (serviceAccountKey.json en raiz)
// FUENTE   : D-CRM-CONSUMIDOR-01 -- "nuestro trabajo es para alimentar
//            un CRM del Propio Poligono"
// NODO     : [N-65] NODO-MATRIZ (emisor via sync)
// ============================================================

// INDICE
// [SEC-01] Bootstrap Firebase Admin
// [SEC-02] Dataset -- items canonicos del poligono (SSOT Sentinel)
// [SEC-03] syncItem -- upsert por ref_id
// [SEC-04] runSync -- loop principal
// [SEC-05] Entry point

'use strict';

// [SEC-01] Bootstrap Firebase Admin
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs   = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('ERROR: serviceAccountKey.json no encontrado en raiz del proyecto AIP.');
    process.exit(1);
}

initializeApp({ credential: cert(require(serviceAccountPath)) });
const db = getFirestore();

// [SEC-02] Dataset -- items canonicos del poligono
// Sentinel mantiene esta lista actualizada. Es la SSOT de referencia_disco.
// Al ejecutar sync-breederhub.js en R01, el estado real del CRM
// (PENDIENTE/COMPLETADO/etc.) se preserva -- solo se actualizan los metadatos.
//
// IMPORTANTE: no incluir items ya cerrados (COMPLETADO/RECHAZADO) -- el CRM
// los gestiona. Esta lista es la fuente de items ACTIVOS.

const ITEMS = [

    // P0 -- Bloqueantes criticos
    {
        ref_id:           'GOB-ROADMAP-INVERSOR-01',
        tipo:             'DECISION',
        vertical:         'GLOBIZMARKT',
        titulo:           'Roadmap inversor Famalicao -- constitucion societaria Jul-15',
        descripcion:      'El inversor de Famalicao requiere un roadmap formal para avanzar a la constitucion de la sociedad vehiculo, con deadline 15-Jul-2026. Sin sesion dedicada iniciada aun.',
        accion_propuesta: 'Abrir sesion dedicada GOB-ROADMAP-INVERSOR-01. Redactar roadmap: vehiculo societario, plazos, aportaciones, hitos.',
        referencia_disco: '03_INBOX/AIP_legacy_logs/.../Globizmarkt_v1.0/fase_00_transversal/01_master_tasks.md',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
    {
        ref_id:           'ADM-DUAL-FSM-01',
        tipo:             'TICKET',
        vertical:         'AIP',
        titulo:           'Dos FSMs activas sin SSoT -- bloquea todo refactor AIP',
        descripcion:      'userFSM (auth flow) y app-fsm (navegacion) operan en paralelo sin fuente unica de verdad. Es la raiz de todos los refactors pendientes en AIP v1.2.1.',
        accion_propuesta: 'Definir SSoT: userFSM absorbe app-fsm o coordinador superior? Decision Director antes de Forja 9+.',
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
        titulo:           'Tailwind CDN 3MB en produccion -- bloquea deploy real',
        descripcion:      'AIP carga Tailwind CSS via CDN (3MB no compilado) en produccion. Sin build toolchain. Resuelto en conjunto con CCD-P30 (Vite).',
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
        titulo:           'PII sin cifrar en Firestore kyc_submissions -- GDPR bloqueante',
        descripcion:      'Datos de identificacion personal (nombre, DNI, direccion) se almacenan en claro en Firestore. Viola GDPR. Bloquea cualquier uso real con usuarios externos.',
        accion_propuesta: 'Cifrar campos PII en Firestore antes de Forja 9+ o definir plan de migracion.',
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
        titulo:           'Decision: adoptar Vite como build toolchain para Forja 9+',
        descripcion:      'CCD Pregunta 30 abierta. Vite resuelve DO-01 (Tailwind CDN) + P8-TL-02 + PERF-LAZY-01 + P10-OPS-02. Decision fundacional para el roadmap tecnico.',
        accion_propuesta: 'Director: Aprobar Vite -- desbloquea roadmap completo de Forja 9+.',
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
        descripcion:      'Commits locales en main sin push a origin. Sin Vercel deploy activo hasta que lleguen.',
        accion_propuesta: 'Director ejecuta: cd C:\\BreederHub\\01_PRODUCTION\\AIP_v1.2.1 && git push origin main',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },

    // CMD_TERMINAL -- Terminal Bridge [N-66] (obligado cumplimiento)
    {
        ref_id:           'CMD-001-SEED-FIRESTORE',
        tipo:             'CMD_TERMINAL',
        vertical:         'AIP',
        titulo:           'CMD-001 · Seed Firestore -- bootstrap CRM Breederhub',
        descripcion:      'Puebla Firestore breederhub_items con 20 items activos del poligono. Sin esto el gadget crm-breederhub.js muestra pantalla vacia.',
        accion_propuesta: 'node .agents/tools/seed-breederhub-items.js (desde C:\\BreederHub\\01_PRODUCTION\\AIP_v1.2.1)',
        referencia_disco: '.claude/TERMINAL_BRIDGE.md §CMD-001',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  'Director',
    },
    {
        ref_id:           'CMD-002-PUSH-GITHUB',
        tipo:             'CMD_TERMINAL',
        vertical:         'AIP',
        titulo:           'CMD-002 · Push GitHub -- desbloquear deploy Vercel',
        descripcion:      'Commits locales AIP en main sin push. Vercel no despliega hasta que lleguen. Independiente de CMD-001.',
        accion_propuesta: 'git status && git push origin main (desde C:\\BreederHub\\01_PRODUCTION\\AIP_v1.2.1)',
        referencia_disco: '.claude/TERMINAL_BRIDGE.md §CMD-002',
        prioridad:        'P0',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  'Director',
    },
    {
        ref_id:           'CMD-003-SYNC-CRM',
        tipo:             'CMD_TERMINAL',
        vertical:         'TRANSVERSAL',
        titulo:           'CMD-003 · Sync CRM -- validar bucle R01 (depende CMD-001)',
        descripcion:      'Primera ejecucion de sync-breederhub.js. Valida que el bucle R01->Firestore funciona. Requiere CMD-001 completado.',
        accion_propuesta: 'node .agents/tools/sync-breederhub.js R02 (desde C:\\BreederHub\\01_PRODUCTION\\AIP_v1.2.1)',
        referencia_disco: '.claude/TERMINAL_BRIDGE.md §CMD-003',
        prioridad:        'P1',
        autonomia:        'Alert',
        creado_por:       'SENTINEL',
        agente_asignado:  'Director',
    },

    // P1 -- Alta prioridad
    {
        ref_id:           'GOB-CONCURRENCIA-01',
        tipo:             'TICKET',
        vertical:         'TRANSVERSAL',
        titulo:           'Dos sesiones Claude Code sin lock -- conflictos de commits',
        descripcion:      'Patron detectado 2 veces. Capa A resuelta: allocator atomico assign-node-id.ps1. Capa B pendiente: SESSION_LOCK.md + Vector 3 (deteccion sesion activa). Misma lucha que CRM Firestore.',
        accion_propuesta: 'Implementar SESSION_LOCK.md + hook en PRE_IGNICION. Migrar a Firestore session registry cuando CRM este vivo.',
        referencia_disco: '00_FACTORY_CORE/tools/assign-node-id.ps1',
        prioridad:        'P1',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'Sentinel',
    },
    {
        ref_id:           'GOB-14b',
        tipo:             'TICKET',
        vertical:         'DEMIURGO',
        titulo:           'Mojibake en bloque GOB-14b -- texto ilegible en despacho activo',
        descripcion:      'El bloque GOB-14b en los logs del Cerebro contiene texto con encoding corrupto (mojibake). Afecta legibilidad de un item de gobernanza activo.',
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
        descripcion:      'Investigacion identifico 3 cambios urgentes: pre-fill inter-componente, clasificador MiFID automatico, evento KYC:Individual:Submitted faltante.',
        accion_propuesta: 'Emitir despacho laparoscopia a Bulldozer o Lead Architect para implementar los 3 cambios.',
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
        titulo:           'RSI Sensor: como el RMU detecta saltos de calidad sin Director',
        descripcion:      'Despacho 3-etapas emitido. Investigacion sobre como el RMU puede detectar automaticamente mejoras de calidad sin validacion manual del Director en cada ciclo.',
        accion_propuesta: 'Continuar ejecucion del despacho 3 etapas INV-RSI-SENSOR-01 en sesion Demiurgo.',
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
        titulo:           'Decision: updateMandate en dispatcher ahora o diferir a Forja 9+?',
        descripcion:      'CCD P29 parcialmente resuelta. La implementacion de updateMandate en el dispatcher sigue pendiente.',
        accion_propuesta: 'Director: Resolver si updateMandate va en proxima sesion AIP o en Forja 9+.',
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
        titulo:           'Definicion KAIROS en Globizmarkt -- colision R-CROSS-02 con AIMON de AIP',
        descripcion:      'CCD P20 abierta: KAIROS en Globizmarkt fase_02 y AIMON en AIP colisionan. Sin definicion resuelta el vocabulario del poligono es ambiguo.',
        accion_propuesta: 'Director resuelve CCD-P20: son el mismo concepto o dos conceptos distintos?',
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
        titulo:           'isAdmin usa roles incorrectos vs. clearance canonico en ignition §16',
        descripcion:      'El check isAdmin en ignition §16 comprueba role === ADMIN || role === DIRECTOR, pero el sistema canonico usa clearance levels [superadmin, partner, desk_manager]. Los roles ADMIN/DIRECTOR no existen en produccion.',
        accion_propuesta: 'Laparoscopia en ignition-v13.js §16: reemplazar check de rol por check de clearance_level canonico.',
        referencia_disco: '01_PRODUCTION/AIP_v1.2.1/ignition-v13.js §16',
        prioridad:        'P1',
        autonomia:        'Act',
        creado_por:       'SENTINEL',
        agente_asignado:  'Sentinel',
    },
    {
        ref_id:           'HUE-16-AUTOCONCIENCIA-BIFURCADA',
        tipo:             'TICKET',
        vertical:         'DEMIURGO',
        titulo:           'AUTOCONCIENCIA_FACTORIA bifurcada -- memoria viva en dos lugares',
        descripcion:      '00_FACTORY_CORE/doctrine/memory/ tiene 64KB (real, Sentinel escribe aqui). 01.2_DOCTRINA_2026/memory/ tiene 485 bytes (baliza vacia). R-GEO-01 dice canonico es 01.2_DOCTRINA pero el contenido real esta en 00_FACTORY_CORE.',
        accion_propuesta: 'Director decide epicentro (R-EPICENTRO-01): 00_FACTORY_CORE o 01.2_DOCTRINA_2026? Sentinel ejecuta fusion + baliza.',
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
        titulo:           'DEPOSITO-LEGACY-MASIVO-01: 7 lotes a 04_ARCHIVE (READY)',
        descripcion:      'Operacion aprobada pendiente de ejecucion. 7 lotes de legacy hacia 04_ARCHIVE. R19: preservar no eliminar.',
        accion_propuesta: 'Sentinel: ejecutar git mv + balizas en sesion dedicada de limpieza de disco.',
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
        descripcion:      'Las 7 fases legacy de AIP v1.2.1 nunca han pasado por VAULT ni destilacion R-ARQ-02. fase_05 sola son 72 archivos, 11MB. Mayor reserva de conocimiento no destilado del poligono.',
        accion_propuesta: 'Orden R-ARQ-02 10/25: empezar por fase_07 (42 archivos, 772KB). Agente: VAULT o Almacen en sesion dedicada.',
        referencia_disco: '03_INBOX/AIP_legacy_logs/tactical_logs/AIP_v1.2.1/fase_07_procedimientos/',
        prioridad:        'P1',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'VAULT',
    },

    // P2 -- Deuda estrategica
    {
        ref_id:           'INV-TAX-01',
        tipo:             'INVESTIGACION',
        vertical:         'TRANSVERSAL',
        titulo:           'Taxonomia SCOPE×DOMAIN -- bloquea reubicacion de doctrina',
        descripcion:      'INV-TAX-01: definicion de la matriz SCOPE×DOMAIN para clasificar toda la doctrina del poligono.',
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
        titulo:           'Barrido KAIROS/AIMON -- 556 archivos, senal de parada R-ARQ-02',
        descripcion:      '556 archivos legacy con referencias a KAIROS/AIMON en AIP v1.1. R-ARQ-02 (10/25) disparo senal de parada por volumen.',
        accion_propuesta: 'Programar campana KAIROS/AIMON con VAULT cuando se resuelva GLOBIZ-F02-02.',
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
        titulo:           'Cola Qwen [N-60]: ~52 archivos no-MD pendientes de conversion',
        descripcion:      'Barrido 2026-06-26 detecto ~52 PDFs/ODTs/DOCXs/XLSXs en el poligono que necesitan conversion a MD via Qwen Doc-to-MD. Lotes A-F organizados por vertical.',
        accion_propuesta: 'Director: iniciar conversion por lotes A -- B -- E -- F con Qwen Doc-to-MD. Cola en [N-60].',
        referencia_disco: '03_INBOX/00_arqueologia_pendiente/QWEN_CONVERSION_QUEUE.md',
        prioridad:        'P2',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  'Qwen Doc-to-MD',
    },
    {
        ref_id:           'DEUDA-NODO-MATRIZ-FIRESTORE-01',
        tipo:             'TICKET',
        vertical:         'TRANSVERSAL',
        titulo:           '[N-65] emite en markdown -- migrar a Firestore poligono_salud',
        descripcion:      'El NODO-MATRIZ [N-65] computa y emite el estado del poligono en SEC-05 (markdown). Contrato Firestore ya definido. Migracion pendiente hasta que crm-breederhub.js tenga datos vivos.',
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
        descripcion:      'Primer computo [N-65]: Respiracion calculada via [N-62]; Autonomia requiere escala L0-L3 (barrido manual pendiente); Claridad requiere grep automatico de 6 verificaciones A-F.',
        accion_propuesta: 'Forjar check-claridad.ps1 (6 greps). Escala L0-L3 para Autonomia: mapear protocolos existentes.',
        referencia_disco: '00_FACTORY_CORE/breederhub_v2.0/00_arquitectura_poligono/03_NODO_MATRIZ_SALUD_POLIGONO.md §3',
        prioridad:        'P2',
        autonomia:        'Suggest',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },

    // P3 -- Deuda futura
    {
        ref_id:           'DEUDA-MALLA-L3-FUENTES-01',
        tipo:             'DOCTRINA',
        vertical:         'TRANSVERSAL',
        titulo:           'Deuda futura: fuentes de notebooks L3 sin copia en disco',
        descripcion:      'R-MALLA-EXTERNA-01: fuentes de notebooks L3 (NotebookLM) sin copia en disco (boveda_*/fuentes/). Director: "no es el momento."',
        accion_propuesta: 'Cuando el monocentrismo este completo, crear boveda_*/fuentes/ con copia de cada fuente L3.',
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
        titulo:           'x10: Protocolo de cadencia lunes (30 min) -- orquestador asincrono',
        descripcion:      'El Director pasa de co-piloto presente a orquestador asincrono: lunes abre CRM -- inbox muestra N items -- aprueba/rechaza/delega en 30 min -- agentes ejecutan durante la semana sin Director. Requiere CRM vivo.',
        accion_propuesta: 'Activar cuando crm-breederhub.js y seed esten en produccion. Este item es el hito de arranque del ciclo x10.',
        referencia_disco: '03_INBOX/BREEDERHUB_legacy_logs/.../Breeder_fase_01.3_crm/',
        prioridad:        'P3',
        autonomia:        'Act',
        creado_por:       'SENTINEL',
        agente_asignado:  null,
    },
];

// [SEC-03] syncItem -- upsert por ref_id
async function syncItem(col, item) {
    const snap = await col.where('ref_id', '==', item.ref_id).limit(1).get();

    if (snap.empty) {
        // INSERT -- item nuevo
        const doc = {
            ...item,
            estado:              'PENDIENTE',
            fecha_creacion:      FieldValue.serverTimestamp(),
            fecha_actualizacion: FieldValue.serverTimestamp(),
            fecha_resolucion:    null,
        };
        await col.add(doc);
        return 'INSERT';
    }

    const existing = snap.docs[0];
    const data = existing.data();

    // SKIP si ya tiene estado terminal (decision tomada en el CRM)
    const estadosTerminales = ['COMPLETADO', 'RECHAZADO', 'DELEGADO'];
    if (estadosTerminales.includes(data.estado)) {
        return 'SKIP_TERMINAL';
    }

    // UPDATE metadata (sin tocar estado ni fechas de resolucion)
    const updates = {
        titulo:           item.titulo,
        descripcion:      item.descripcion,
        prioridad:        item.prioridad,
        accion_propuesta: item.accion_propuesta,
        referencia_disco: item.referencia_disco,
        agente_asignado:  item.agente_asignado,
        fecha_actualizacion: FieldValue.serverTimestamp(),
    };
    await existing.ref.update(updates);
    return 'UPDATE';
}

// [SEC-04] runSync -- loop principal
async function runSync() {
    const col = db.collection('breederhub_items');
    const counts = { INSERT: 0, UPDATE: 0, SKIP_TERMINAL: 0, ERROR: 0 };

    const mode = process.argv[2] || 'R01';
    console.log(`\n[INIT] sync-breederhub v1.0.0 -- modo ${mode} -- ${ITEMS.length} items a procesar\n`);

    for (const item of ITEMS) {
        try {
            const result = await syncItem(col, item);
            const icon = result === 'INSERT' ? '  NEW' : result === 'UPDATE' ? '  UPD' : ' SKIP';
            console.log(`${icon}  [${item.prioridad}] ${item.ref_id}`);
            counts[result]++;
        } catch (err) {
            console.error(`  ERR  [${item.prioridad}] ${item.ref_id} -- ${err.message}`);
            counts.ERROR++;
        }
    }

    console.log(`
[DONE] ${mode} sync completo
  Nuevos:       ${counts.INSERT}
  Actualizados: ${counts.UPDATE}
  Terminales:   ${counts.SKIP_TERMINAL} (COMPLETADO/RECHAZADO/DELEGADO -- preservados)
  Errores:      ${counts.ERROR}
`);

    if (mode === 'R01') {
        console.log('  --> R01: sync integrado. Ver breederhub_items en Firestore Console.');
    } else {
        console.log('  --> R02: sync ligero completado. El CRM refleja el estado actual.');
    }

    process.exit(counts.ERROR > 0 ? 1 : 0);
}

// [SEC-05] Entry point
runSync().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
