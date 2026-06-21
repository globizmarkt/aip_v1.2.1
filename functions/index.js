// ============================================================
// ARCHIVO  : index.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-15
// PROPÓSITO: Dispatcher único `executeUserAction` (Cloud Functions 2nd gen,
//            firebase-functions v5 + Admin SDK) — sustituye las escrituras
//            directas de cliente sobre `users/{uid}` que violan R0
//            (`firestore.rules: allow update: if false`). Diseñado en
//            despacho 08-01.1.2 (CCD Pregunta 18, decisión Director
//            2026-06-15: "infraestructura actual (firebase-functions) +
//            escalabilidad futura, sin hipotecar el presente").
// ============================================================

// ÍNDICE
// [SEC-01] Imports e inicialización Admin SDK
// [SEC-02] Helpers de validación
// [SEC-03] Registro ACTIONS (handler por flujo) — punto de extensión
// [SEC-04] Dispatcher executeUserAction (onCall)

// [SEC-01] Imports e inicialización Admin SDK
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// [SYS-RATE-01] Cooldowns de rate-limit por acción (ms). 0 = sin límite.
// La doc rate_limits/{uid} acumula timestamps por action key (merge atómico en batch).
const RATE_LIMIT_MS = {
    submitKycIndividual: 30_000,
    submitKyb:           30_000,
    submitKycL4:         30_000,
    patchAccountProfile: 0,        // sin cooldown — operación no destructiva
};

// [SEC-02] Helpers de validación y rate-limit

// [ARQ-CLEAN-01] Responsabilidad única: verifica el cooldown y devuelve la ref
// para que el dispatcher la añada al batch. Lanza HttpsError si está en cooldown.
// Retorna null si esta acción no tiene límite (cooldown === 0).
async function assertNotRateLimited(uid, action) {
    const cooldown = RATE_LIMIT_MS[action] ?? 0;
    if (cooldown === 0) return null;
    const limitRef = db.doc(`rate_limits/${uid}`);
    const snap = await limitRef.get();
    if (snap.exists) {
        const lastAt = snap.data()?.[action]?.toMillis?.() ?? 0;
        if (Date.now() - lastAt < cooldown) {
            throw new HttpsError('resource-exhausted', 'Demasiadas solicitudes. Espera antes de reintentarlo.');
        }
    }
    return limitRef;
}

function requireString(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new HttpsError('invalid-argument', `Campo requerido: ${field}`);
    }
    return value;
}

function optionalString(value, field) {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') {
        throw new HttpsError('invalid-argument', `Campo inválido: ${field}`);
    }
    return value;
}

// [SEC-03] Registro ACTIONS — punto de extensión para V-4..V-7 y futuros
// flujos. Cada acción declara:
//   - validate(payload)        → payload saneado o lanza HttpsError
//   - build(uid, payload)       → { userPatch, submission, auditEvent }
//       userPatch   : objeto a fusionar en users/{uid} (merge:true)
//       submission  : { collection, data } | null — doc owner-scoped
//                      (id = uid) en una colección kyc_*_submissions
//       auditEvent  : objeto a añadir en audit_log/{uid}/events
// Añadir un flujo nuevo = registrar una entrada aquí. CERO nuevas Cloud
// Functions desplegadas — el dispatcher es el único punto de entrada.
const ACTIONS = {

    // Triple-Write R11 — KYC individual (aip-kyc-individual.js)
    submitKycIndividual: {
        validate(payload) {
            return {
                doc_type:     requireString(payload.doc_type, 'doc_type'),
                front_url:    requireString(payload.front_url, 'front_url'),
                back_url:     optionalString(payload.back_url, 'back_url'),
                legal_nature: requireString(payload.legal_nature, 'legal_nature'),
                requires_kyb: Boolean(payload.requires_kyb),
                personal_data: payload.personal_data ?? {},
                user_agent:   optionalString(payload.user_agent, 'user_agent'),
            };
        },
        build(uid, p) {
            return {
                userPatch: {
                    kyc_status:       'KYC_SUBMITTED',
                    kyc_submitted_at: FieldValue.serverTimestamp(),
                    requires_kyb:     p.requires_kyb,
                },
                submission: {
                    collection: 'kyc_submissions',
                    data: {
                        uid,
                        doc_type:      p.doc_type,
                        front_url:     p.front_url,
                        back_url:      p.back_url,
                        submitted_at:  FieldValue.serverTimestamp(),
                        legal_nature:  p.legal_nature,
                        personal_data: p.personal_data, // NOTE: cifrar PII en producción (heredado del código cliente)
                    },
                },
                auditEvent: {
                    event:     'KYC_SUBMITTED',
                    doc_type:  p.doc_type,
                    user_agent: p.user_agent,
                },
            };
        },
    },

    // Triple-Write R11 — KYB (aip-kyb-flow.js)
    // FIX Hallazgo B (01_AUDITORIA_FIRESTORE_RULES.md [SEC-04]): la colección
    // canónica es `kyc_kyb_submissions` (la que lee aip-superadmin-kyc.js),
    // no `kyb_submissions` (la que escribía el cliente hasta ahora).
    submitKyb: {
        validate(payload) {
            return {
                company_name: requireString(payload.company_name, 'company_name'),
                kyb_data:     payload.kyb_data ?? {},
                user_agent:   optionalString(payload.user_agent, 'user_agent'),
            };
        },
        build(uid, p) {
            return {
                userPatch: {
                    kyb_status: 'KYB_SUBMITTED',
                    kyb_submitted_at: FieldValue.serverTimestamp(),
                },
                submission: {
                    collection: 'kyc_kyb_submissions',
                    data: {
                        uid,
                        company_name: p.company_name,
                        kyb_data:     p.kyb_data,
                        submitted_at: FieldValue.serverTimestamp(),
                    },
                },
                auditEvent: {
                    event: 'KYB_SUBMITTED',
                    user_agent: p.user_agent,
                },
            };
        },
    },

    // Triple-Write R11 — KYC L4 (aip-l4-qualifier.js)
    submitKycL4: {
        validate(payload) {
            return {
                income_range: requireString(payload.income_range, 'income_range'),
                l4_data:      payload.l4_data ?? {},
                user_agent:   optionalString(payload.user_agent, 'user_agent'),
            };
        },
        build(uid, p) {
            return {
                userPatch: {
                    kyc_l4_status:       'KYC_L4_SUBMITTED',
                    kyc_l4_submitted_at: FieldValue.serverTimestamp(),
                },
                submission: {
                    collection: 'kyc_l4_submissions',
                    data: {
                        uid,
                        income_range: p.income_range,
                        l4_data:      p.l4_data,
                        submitted_at: FieldValue.serverTimestamp(),
                    },
                },
                auditEvent: {
                    event: 'KYC_L4_SUBMITTED',
                    user_agent: p.user_agent,
                },
            };
        },
    },

    // [S2 — SYS-ADMIN-IS-01] Admin: asignar IntegrityScore manualmente
    // Solo superadmin. Guard adicional: el dispatcher verifica rol del llamante
    // en users/{uid} antes de ejecutar — no depende solo de autenticación.
    // Flujo: panel aip-superadmin-kyc.js → botón "Asignar IntegrityScore" →
    // executeUserAction({ action:'setIntegrityScore', payload:{ targetUid, score } })
    setIntegrityScore: {
        async validate(payload, callerUid) {
            const callerSnap = await db.doc(`users/${callerUid}`).get();
            if (callerSnap.data()?.rol !== 'superadmin') {
                throw new HttpsError('permission-denied', 'Solo superadmin puede asignar IntegrityScore');
            }
            const score = Number(payload.score);
            if (!Number.isFinite(score) || score < 0 || score > 100) {
                throw new HttpsError('invalid-argument', 'score debe ser un número entre 0 y 100');
            }
            if (!payload.targetUid || typeof payload.targetUid !== 'string') {
                throw new HttpsError('invalid-argument', 'targetUid requerido');
            }
            return { targetUid: payload.targetUid, score };
        },
        build(callerUid, p) {
            // userPatch se aplica al targetUid, no al callerUid
            // El dispatcher normal usa uid del caller — aquí lo sobrescribimos
            // en el campo __targetOverride para que el dispatcher lo detecte.
            return {
                __targetOverride: p.targetUid,
                userPatch: { integrity_score: p.score },
                submission: null,
                auditEvent: {
                    event: 'INTEGRITY_SCORE_SET',
                    score: p.score,
                    set_by: callerUid,
                },
            };
        },
    },

    // Account Config — perfil + preferencia de timeframe (aip-account-config.js)
    // Whitelist de campos: el cliente NUNCA puede tocar kyc_*/role/level/rol
    // vía este dispatcher — solo los campos declarados aquí.
    patchAccountProfile: {
        validate(payload) {
            const patch = {};
            if (payload.displayName !== undefined) {
                patch.displayName = requireString(payload.displayName, 'displayName');
            }
            if (payload.timeframe_pref !== undefined) {
                const allowed = ['short', 'medium', 'long'];
                if (!allowed.includes(payload.timeframe_pref)) {
                    throw new HttpsError('invalid-argument', 'timeframe_pref inválido');
                }
                patch.timeframe_pref = payload.timeframe_pref;
            }
            if (Object.keys(patch).length === 0) {
                throw new HttpsError('invalid-argument', 'Sin campos válidos para actualizar');
            }
            return patch;
        },
        build(uid, patch) {
            return {
                userPatch: patch,
                submission: null,
                auditEvent: {
                    event: 'ACCOUNT_PROFILE_UPDATED',
                    fields: Object.keys(patch),
                },
            };
        },
    },

};

// [SEC-04] Dispatcher executeUserAction (onCall)
// Escritura atómica vía batch: users/{uid} (merge) + colección de
// submission (si aplica) + audit_log/{uid}/events. Admin SDK bypasea
// firestore.rules — R0 (`users.allow update: if false`) permanece intacto
// para el cliente directo.
// [SYS-COLD-01] minInstances:1 — elimina cold start en el path crítico KYC.
exports.executeUserAction = onCall({ minInstances: 1 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Requiere usuario autenticado');
    }

    const { action, payload } = request.data ?? {};
    const handler = ACTIONS[action];
    if (!handler) {
        throw new HttpsError('invalid-argument', `Acción desconocida: ${action}`);
    }

    // [ARQ-CLEAN-01] Rate limit delegado a assertNotRateLimited — responsabilidad única.
    // Retorna limitRef (para incluir en batch) o null (sin cooldown).
    const limitRef = await assertNotRateLimited(uid, action);

    const validated = await Promise.resolve(handler.validate(payload ?? {}, uid));
    const built = handler.build(uid, validated);
    const { userPatch, submission, auditEvent } = built;

    // [S2] Acciones admin pueden escribir sobre un targetUid distinto al caller.
    const writeUid = built.__targetOverride ?? uid;

    const batch = db.batch();
    batch.set(db.doc(`users/${writeUid}`), userPatch, { merge: true });

    if (submission) {
        batch.set(db.doc(`${submission.collection}/${writeUid}`), submission.data, { merge: true });
    }

    // [ARQ-CLEAN-01] Audit event incluye action name — facilita queries por tipo.
    batch.set(db.collection(`audit_log/${writeUid}/events`).doc(), {
        action,
        ...auditEvent,
        timestamp: FieldValue.serverTimestamp(),
    });

    if (limitRef) {
        batch.set(limitRef, { [action]: FieldValue.serverTimestamp() }, { merge: true });
    }

    await batch.commit();
    return { ok: true };
});
