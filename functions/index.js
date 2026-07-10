// ============================================================
// ARCHIVO  : index.js
// VERSION  : 1.1.0 (2026-07-06 - anade ApproveKycAction, SEC-CUSTOM-CLAIMS-01)
// FECHA    : 2026-06-15
// PROPÃ“SITO: Dispatcher Ãºnico `executeUserAction` (Cloud Functions 2nd gen,
//            firebase-functions v5 + Admin SDK) â€” sustituye las escrituras
//            directas de cliente sobre `users/{uid}` que violan R0
//            (`firestore.rules: allow update: if false`). DiseÃ±ado en
//            despacho 08-01.1.2 (CCD Pregunta 18, decisiÃ³n Director
//            2026-06-15: "infraestructura actual (firebase-functions) +
//            escalabilidad futura, sin hipotecar el presente").
// ============================================================

// ÃNDICE
// [SEC-01] Imports e inicializaciÃ³n Admin SDK
// [SEC-02] Helpers de validaciÃ³n
// [SEC-03] Registro ACTIONS (handler por flujo) - punto de extension
//   [SEC-03a] ApproveKycAction (2026-07-06, SEC-CUSTOM-CLAIMS-01) - setea custom claims via Auth
// [SEC-04] Dispatcher executeUserAction (onCall)

// [SEC-01] Imports e inicializaciÃ³n Admin SDK
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

initializeApp();
const db = getFirestore();

// [SYS-RATE-01] Cooldowns de rate-limit por acciÃ³n (ms). 0 = sin lÃ­mite.
// La doc rate_limits/{uid} acumula timestamps por action key (merge atÃ³mico en batch).
const RATE_LIMIT_MS = {
    submitKycIndividual: 30_000,
    submitKyb:           30_000,
    submitKycL4:         30_000,
    patchAccountProfile: 5_000,    // [SEC-FUNC-02] 5s cooldown â€” evita write abuse
};

// [SEC-02] Helpers de validaciÃ³n y rate-limit

// [ARQ-CLEAN-01] Responsabilidad Ãºnica: verifica el cooldown y devuelve la ref
// para que el dispatcher la aÃ±ada al batch. Lanza HttpsError si estÃ¡ en cooldown.
// Retorna null si esta acciÃ³n no tiene lÃ­mite (cooldown === 0).
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
        throw new HttpsError('invalid-argument', `Campo invÃ¡lido: ${field}`);
    }
    return value;
}

// [SEC-03] Registro ACTIONS â€” punto de extensiÃ³n para V-4..V-7 y futuros
// flujos. Cada acciÃ³n declara:
//   - validate(payload)        â†’ payload saneado o lanza HttpsError
//   - build(uid, payload)       â†’ { userPatch, submission, auditEvent }
//       userPatch   : objeto a fusionar en users/{uid} (merge:true)
//       submission  : { collection, data } | null â€” doc owner-scoped
//                      (id = uid) en una colecciÃ³n kyc_*_submissions
//       auditEvent  : objeto a aÃ±adir en audit_log/{uid}/events
// AÃ±adir un flujo nuevo = registrar una entrada aquÃ­. CERO nuevas Cloud
// Functions desplegadas â€” el dispatcher es el Ãºnico punto de entrada.
const ACTIONS = {

    // Triple-Write R11 â€” KYC individual (aip-kyc-individual.js)
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
                        personal_data: p.personal_data, // NOTE: cifrar PII en producciÃ³n (heredado del cÃ³digo cliente)
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

    // Triple-Write R11 â€” KYB (aip-kyb-flow.js)
    // FIX Hallazgo B (01_AUDITORIA_FIRESTORE_RULES.md [SEC-04]): la colecciÃ³n
    // canÃ³nica es `kyc_kyb_submissions` (la que lee aip-superadmin-kyc.js),
    // no `kyb_submissions` (la que escribÃ­a el cliente hasta ahora).
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

    // Triple-Write R11 â€” KYC L4 (aip-l4-qualifier.js)
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

    // [S2 â€” SYS-ADMIN-IS-01] Admin: asignar IntegrityScore manualmente
    // Solo superadmin. Guard adicional: el dispatcher verifica rol del llamante
    // en users/{uid} antes de ejecutar â€” no depende solo de autenticaciÃ³n.
    // Flujo: panel aip-superadmin-kyc.js â†’ botÃ³n "Asignar IntegrityScore" â†’
    // executeUserAction({ action:'setIntegrityScore', payload:{ targetUid, score } })
    setIntegrityScore: {
        async validate(payload, callerUid) {
            const callerSnap = await db.doc(`users/${callerUid}`).get();
            if (callerSnap.data()?.rol !== 'superadmin') {
                throw new HttpsError('permission-denied', 'Solo superadmin puede asignar IntegrityScore');
            }
            const score = Number(payload.score);
            if (!Number.isFinite(score) || score < 0 || score > 100) {
                throw new HttpsError('invalid-argument', 'score debe ser un nÃºmero entre 0 y 100');
            }
            if (!payload.targetUid || typeof payload.targetUid !== 'string') {
                throw new HttpsError('invalid-argument', 'targetUid requerido');
            }
            return { targetUid: payload.targetUid, score };
        },
        build(callerUid, p) {
            // userPatch se aplica al targetUid, no al callerUid
            // El dispatcher normal usa uid del caller â€” aquÃ­ lo sobrescribimos
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

    // Account Config â€” perfil + preferencia de timeframe (aip-account-config.js)
    // Whitelist de campos: el cliente NUNCA puede tocar kyc_*/role/level/rol
    // vÃ­a este dispatcher â€” solo los campos declarados aquÃ­.
    // [SEC-CUSTOM-CLAIMS-01] Cierre de cadena: KYC aprobado -> Custom Claims -> Acceso
    // Reemplaza la escritura directa client-side de aip-superadmin-kyc.js.
    // Al aprobar, setea los claims en el token de Auth para que firestore.rules
    // (isAdmin, hasClearanceMember, assets read) funcionen.
    ApproveKycAction: {
        async validate(payload, callerUid) {
            // 1. Guardia de Rol (Zero-Trust)
            const callerSnap = await db.doc(`users/${callerUid}`).get();
            if (callerSnap.data()?.rol !== 'superadmin') {
                throw new HttpsError('permission-denied', 'Solo superadmin puede aprobar KYC');
            }
            // 2. Validacion del target
            if (!payload.targetUid || typeof payload.targetUid !== 'string') {
                throw new HttpsError('invalid-argument', 'targetUid requerido');
            }
            if (!['kyc', 'kyb', 'l4'].includes(payload.type)) {
                throw new HttpsError('invalid-argument', 'Tipo de flujo invalido');
            }
            if (!['approve', 'reject'].includes(payload.action)) {
                throw new HttpsError('invalid-argument', 'Accion invalida');
            }
            return {
                targetUid: payload.targetUid,
                type: payload.type,
                action: payload.action,
                user_agent: payload.user_agent || null
            };
        },
        async build(callerUid, p) {
            const isApprove = p.action === 'approve';
            const statusKeyMap = { kyc: 'kyc_status', kyb: 'kyb_status', l4: 'kyc_l4_status' };
            const statusValMap = {
                kyc: isApprove ? 'KYC_APPROVED' : 'KYC_REJECTED',
                kyb: isApprove ? 'KYB_APPROVED' : 'KYB_REJECTED',
                l4: isApprove ? 'KYC_L4_APPROVED' : 'KYC_L4_REJECTED'
            };
            const eventMap = {
                kyc: isApprove ? 'KYC_APPROVED' : 'KYC_REJECTED',
                kyb: isApprove ? 'KYB_APPROVED' : 'KYB_REJECTED',
                l4: isApprove ? 'KYC_L4_APPROVED' : 'KYC_L4_REJECTED'
            };

            const typeKey = p.type === 'l4' ? 'kyc_l4' : p.type;

            // Construir el payload base para Firestore (misma logica que el draft SEC-NEW-03)
            const result = {
                __targetOverride: p.targetUid,
                userPatch: {
                    [statusKeyMap[p.type]]: statusValMap[p.type],
                    [`${typeKey}_approved_at`]: FieldValue.serverTimestamp(),
                    [`${typeKey}_approved_by`]: callerUid
                },
                submission: null,
                auditEvent: {
                    event: eventMap[p.type],
                    approved_by: callerUid,
                    user_agent: p.user_agent
                }
            };

            // [SEC-CUSTOM-CLAIMS-01] Logica de Promocion de Claims
            // Si se aprueba el KYC individual (la puerta de entrada), promovemos claims.
            // NOTA: kyb y l4 son flujos posteriores, no activan el claim kyc_verified.
            if (isApprove && p.type === 'kyc') {
                // Leer el documento del usuario para obtener su rol actual en Firestore
                const targetSnap = await db.doc(`users/${p.targetUid}`).get();
                const targetData = targetSnap.data();

                // Mapeo de roles de Firestore a claims esperados por firestore.rules
                // Regla :61 -> request.auth.token.role in ['superadmin', 'partner', 'desk_manager']
                const currentRole = targetData?.rol || 'inv';
                const validClaimRoles = ['superadmin', 'partner', 'desk_manager', 'inv'];
                const claimRole = validClaimRoles.includes(currentRole) ? currentRole : 'inv';

                result.__setClaims = {
                    kyc_verified: true,       // Usado en assets read (:48)
                    role: claimRole,          // Usado en isAdmin() (:61)
                    level: 1                  // Usado en hasClearanceMember() (:66) - Clearance base miembro
                };
            }

            // Si se RECHAZA el KYC, asegurarnos de revocar el acceso por si acaso
            // (ej. un admin aprobo por error y ahora rechaza)
            if (!isApprove && p.type === 'kyc') {
                result.__setClaims = {
                    kyc_verified: false,
                    level: 0
                };
                // No tocamos 'role' aqui para no degradar a un admin por un rechazo de KYC de un usuario normal,
                // a menos que el Director indique lo contrario.
            }

            return result;
        }
    },

    patchAccountProfile: {
        validate(payload) {
            const patch = {};
            if (payload.displayName !== undefined) {
                patch.displayName = requireString(payload.displayName, 'displayName');
            }
            if (payload.timeframe_pref !== undefined) {
                const allowed = ['short', 'medium', 'long'];
                if (!allowed.includes(payload.timeframe_pref)) {
                    throw new HttpsError('invalid-argument', 'timeframe_pref invÃ¡lido');
                }
                patch.timeframe_pref = payload.timeframe_pref;
            }
            if (Object.keys(patch).length === 0) {
                throw new HttpsError('invalid-argument', 'Sin campos vÃ¡lidos para actualizar');
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
// Escritura atÃ³mica vÃ­a batch: users/{uid} (merge) + colecciÃ³n de
// submission (si aplica) + audit_log/{uid}/events. Admin SDK bypasea
// firestore.rules â€” R0 (`users.allow update: if false`) permanece intacto
// para el cliente directo.
// [SYS-COLD-01] minInstances:1 â€” elimina cold start en el path crÃ­tico KYC.
exports.executeUserAction = onCall({ minInstances: 1 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Requiere usuario autenticado');
    }

    const { action, payload } = request.data ?? {};
    const handler = ACTIONS[action];
    if (!handler) {
        throw new HttpsError('invalid-argument', `AcciÃ³n desconocida: ${action}`);
    }

    // [ARQ-CLEAN-01] Rate limit delegado a assertNotRateLimited â€” responsabilidad Ãºnica.
    // Retorna limitRef (para incluir en batch) o null (sin cooldown).
    const limitRef = await assertNotRateLimited(uid, action);

    const validated = await Promise.resolve(handler.validate(payload ?? {}, uid));
    const built = handler.build(uid, validated);
    const { userPatch, submission, auditEvent, __setClaims } = built;

    // [S2] Acciones admin pueden escribir sobre un targetUid distinto al caller.
    const writeUid = built.__targetOverride ?? uid;

    // [SEC-CUSTOM-CLAIMS-01] Ejecutar promocion de Custom Claims en Auth
    if (__setClaims) {
        try {
            await getAuth().setCustomUserClaims(writeUid, __setClaims);
            console.log(`[Claims] Actualizados para ${writeUid}:`, __setClaims);
            // Forzar refresh del token del usuario si tiene una sesion activa
            // (Opcional pero recomendado para que el cambio sea inmediato sin re-login)
            await getAuth().revokeRefreshTokens(writeUid);
        } catch (err) {
            console.error(`[Claims] ERROR critico seteando claims para ${writeUid}:`, err);
            throw new HttpsError('internal', 'Error interno al asignar permisos de acceso.');
        }
    }

    const batch = db.batch();
    batch.set(db.doc(`users/${writeUid}`), userPatch, { merge: true });

    if (submission) {
        batch.set(db.doc(`${submission.collection}/${writeUid}`), submission.data, { merge: true });
    }

    // [ARQ-CLEAN-01] Audit event incluye action name â€” facilita queries por tipo.
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

// [SEC-05-TEMP] seedMandatePilot â€” ELIMINADO 2026-06-25
// Siembra ejecutada localmente vÃ­a Admin SDK (.agents/tools/seed-mandate.js).
// MND-2026-06-24-0001 confirmado en Firestore producciÃ³n { "ok": true }.

// [SEC-07] Flujo KYC Handoff QR (auth movil de un solo uso)
// Despacho .68 Fase 3 (2026-07-09) - reemplaza el patron cliente-escribe-directo
// a qr_tokens (bloqueado por firestore.rules deny-all + bug serverTimestamp no
// importado en aip-kyc-individual.js) por sesiones server-side via Cloud Function.
const crypto = require('crypto');
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.createKycSession = onCall({ minInstances: 1 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Requiere usuario autenticado');

    const sessionId = crypto.randomUUID();
    const secret = crypto.randomBytes(32).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(secret + salt).digest('hex');
    const nonce = crypto.randomUUID();

    const sessionData = {
        sessionId,
        userId: uid,
        tenantId: request.auth.token.tenant_id || 'default',
        status: 'pending',
        tokenHash,
        salt,
        nonce,
        createdAt: FieldValue.serverTimestamp(),
        // TTL nativo: expira en 10 minutos
        expiresAt: new Date(Date.now() + 10 * 60000),
        attempts: 0,
        maxAttempts: 3,
        desktopFingerprint: {
            userAgent: request.rawRequest?.headers['user-agent'] || 'unknown',
            ip: request.rawRequest?.ip || 'unknown'
        },
        audit: {
            createdIp: request.rawRequest?.ip || 'unknown',
            userAgent: request.rawRequest?.headers['user-agent'] || 'unknown',
            riskFlags: []
        }
    };

    await db.doc(`kyc_sessions/${sessionId}`).set(sessionData);

    // Solo se devuelve el sessionId al cliente desktop. NUNCA el secreto.
    return { sessionId };
});

exports.kycInit = onCall({ minInstances: 1 }, async (request) => {
    const { sessionId, deviceInfo } = request.data ?? {};
    if (!sessionId) throw new HttpsError('invalid-argument', 'sessionId requerido');

    const sessionRef = db.doc(`kyc_sessions/${sessionId}`);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) throw new HttpsError('not-found', 'SESSION_NOT_FOUND');
    const data = sessionSnap.data();

    if (data.status !== 'pending') throw new HttpsError('failed-precondition', 'SESSION_ALREADY_USED');
    if (data.expiresAt.toDate() < new Date()) {
        await sessionRef.update({ status: 'expired' });
        throw new HttpsError('deadline-exceeded', 'SESSION_EXPIRED');
    }
    if (data.attempts >= data.maxAttempts) throw new HttpsError('resource-exhausted', 'RATE_LIMIT_EXCEEDED');

    const challenge = crypto.randomBytes(32).toString('hex');

    await sessionRef.update({
        status: 'scanned',
        challenge,
        mobileFingerprint: deviceInfo || {},
        attempts: FieldValue.increment(1)
    });

    return { challenge, nonce: data.nonce };
});

exports.kycAttest = onCall({ minInstances: 1 }, async (request) => {
    const { sessionId, signedChallenge, mobilePubKey } = request.data ?? {};
    if (!sessionId || !signedChallenge) throw new HttpsError('invalid-argument', 'Faltan parametros de atestacion');

    const sessionRef = db.doc(`kyc_sessions/${sessionId}`);

    await db.runTransaction(async (t) => {
        const doc = await t.get(sessionRef);
        if (!doc.exists) throw new HttpsError('not-found', 'SESSION_NOT_FOUND');
        const data = doc.data();

        if (data.status !== 'scanned') throw new HttpsError('failed-precondition', 'Estado invalido para atestacion');

        // TODO: verificacion criptografica real del signedChallenge con mobilePubKey.
        // Placeholder documentado -- no usar en produccion sin cerrar este TODO.
        const signatureValid = true;

        if (!signatureValid) {
            t.update(sessionRef, { attempts: FieldValue.increment(1) });
            throw new HttpsError('unauthenticated', 'INVALID_SIGNATURE');
        }

        t.update(sessionRef, {
            status: 'attested',
            attempts: 0
        });
    });

    return { ok: true };
});

// Fallback de limpieza estricta (Sweep Job)
exports.cleanupKycSessions = onSchedule('every 10 minutes', async (event) => {
    const now = new Date();
    const expiredQuery = await db.collection('kyc_sessions')
        .where('expiresAt', '<', now)
        .where('status', 'in', ['pending', 'scanned'])
        .get();

    const batch = db.batch();
    expiredQuery.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'expired' });
    });

    if (expiredQuery.size > 0) await batch.commit();
    console.log(`[Cleanup] ${expiredQuery.size} sesiones expiradas marcadas.`);
});

// [SEC-06] Webhook EMAIL-INGEST (BHUB-EMAIL-01)
// Inyectado 2026-07-01 â€” email-ingest.js contiene lÃ³gica webhook SendGrid
exports.emailWebhook = require('./email-ingest').emailWebhook;


// [BHUB-INGESTA] Exportacion de webhooks multicanal
exports.emailWebhook = require('./email-ingest').emailWebhook;
exports.whatsappWebhook = require('./whatsapp-ingest').whatsappWebhook;
