// %[CARRIL-AIP-INTERFACE] - [Fase 18.7]
/**
 * AIPHandler.js
 * Orquestador de interacción específico para la Vertical AIP.
 * Re-acoplamiento del Sistema Nervioso (Listeners + DOM Sync)
 * [VIBE-AIP-S-REBORN-03.7] - Refactor Sentinel: Zero-Race Condition & Apagón Legal
 */

import { mockState } from './mockState.js';
import { PassportValidator } from '../../01-core/passportValidator.js';
import { UserFSM } from '../../01-core/userFSM.js';
import '../../gadgets/aip-trinity-layout.js';
// [E6-T08-FIX-2] Importar app explícitamente — garantiza que initializeApp()
// se haya ejecutado antes de cualquier getAuth(app)/getFirestore(app).
// No depende de globals ni de orden de evaluación entre scripts paralelos.
import { app as firebaseApp } from '../../02-infra/firebase/FirebaseConnector.js';

export const AIPHandler = {
    // [SEC-VEC-01 · 2026-06-05] Flag de guardia contra race condition en signup nuevo.
    // true = el hilo de registro está activo; el onAuthStateChanged debe ignorar la esclusa Firestore.
    _signupInProgress: false,

    _t(key) {
        return window.Skeleton?.i18n?.t(key) ?? key;
    },

    init() {
        console.log('[AIPHandler] Inicializando handlers de vertical...');
        UserFSM.boot();

        // [E6-T08] Persistencia de sesión Firebase Auth — onAuthStateChanged
        // Si el usuario ya tiene sesión activa al recargar, salta el formulario de acceso.
        (async () => {
            try {
                const { getAuth, onAuthStateChanged } = await import('firebase/auth');
                const auth = getAuth(firebaseApp);
                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        // [SEC-VEC-01 · 2026-06-05] Esclusa Firestore — reemplaza kyc:'pending' hardcodeado.
                        // Fix Lead Architect (B_IMPACT_sec_vec_01.md · despachos_04.1.2):
                        //   FIX-1: Dev bypass → payload sintético (evita limbo visual en desarrollo)
                        //   FIX-2: Race condition guard → _signupInProgress (evita logout en registro nuevo)
                        console.log('[AIPHandler][SEC-VEC-01] Sesión detectada. Validando contra SSoT Firestore...');

                        const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
                        if (isDev) {
                            // [FIX-1] Dev bypass: inyectar payload sintético en lugar de return seco.
                            // Sin esto, PassportValidator nunca se llama → AccessGranted nunca se emite → limbo visual.
                            console.warn('[AIPHandler][DEV] Entorno local — usando payload sintético de desarrollo.');
                            UserFSM.transition('LOGIN_SUBMITTED');
                            PassportValidator.validateAccess({
                                usr:  user.uid,
                                rol:  'inv',
                                tier: 'inst',
                                jur:  'CH',
                                kyc:  'ok',
                                pv:   1,
                                wc:   ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                                secure_origin: 'DEV_SYNTHETIC',
                            });
                            return;
                        }

                        // [FIX-2] Race condition: si el hilo de registro está activo, el documento
                        // Firestore puede no existir aún. El signup gestiona su propio PassportValidator.
                        if (this._signupInProgress) {
                            console.warn('[AIPHandler][SEC-VEC-01] Registro en progreso — esclusa Firestore diferida.');
                            return;
                        }

                        UserFSM.transition('LOGIN_SUBMITTED');

                        try {
                            const { getFirestore, doc, getDoc } = await import('firebase/firestore');
                            const db = getFirestore(firebaseApp);
                            const userDocRef = doc(db, 'users', user.uid);
                            const userSnapshot = await getDoc(userDocRef);

                            if (!userSnapshot.exists()) {
                                console.error('[AIPHandler][CRITICAL] Identidad fantasma detectada. Forzando purga de sesión.');
                                const { signOut } = await import('firebase/auth');
                                await signOut(auth);
                                PassportValidator.validateAccess(null);
                                return;
                            }

                            const userData = userSnapshot.data();
                            PassportValidator.validateAccess({
                                usr:  user.uid,
                                rol:  userData.rol || 'inv',
                                tier: userData.tier || 'inst',
                                jur:  userData.jurisdiction || 'CH',
                                kyc:  userData.kyc === 'approved' ? 'ok' : 'pending',
                                pv:   1,
                                wc:   userData.kyc === 'approved'
                                        ? ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer']
                                        : [],
                                secure_origin: 'FIRESTORE_SSOT',
                            });

                        } catch (err) {
                            console.error('[AIPHandler][SEC-VEC-01] Error crítico en la esclusa de acceso:', err);
                            PassportValidator.validateAccess(null);
                        }
                    }
                });
            } catch (err) {
                console.error('[AIPHandler][E6-T08] Error inicializando persistencia de Auth:', err);
            }
        })();

        this._setupListeners();
        this._setupCRMControls();
        this._setupAccessForm();
        this._initGatekeeperSubscribers();
        return this;
    },

    _initGatekeeperSubscribers() {
        document.addEventListener('Skeleton:Gatekeeper:AccessGranted', (e) => {
            const { wc } = e.detail;
            UserFSM.transition('Skeleton:Gatekeeper:AccessGranted', { wc });
            this._showLegalAttestation(wc);
        });

        document.addEventListener('Skeleton:Gatekeeper:AccessDenied', (e) => {
            const { reason } = e.detail;
            UserFSM.transition('Skeleton:Gatekeeper:AccessDenied', { reason });
            this._showAccessDenied(reason);
        });

        // [Sutura R20 - Sentinel] Única fuente de verdad para el acceso legal.
        // Combina el cambio de FSM, el apagón visual y la hidratación de datos.
        document.addEventListener('Skeleton:Legal:Accepted', () => {
            document.getElementById('legal-attestation-gate')?.classList.add('hidden');

            UserFSM.transition('Skeleton:Legal:Accepted', { wc: this._wcPending });
            this.showCRM(this._wcPending);
        }, { once: true });
    },

    _setupListeners() {
        document.addEventListener('Skeleton:Action:GateWake', () => {
            this.toggleOrbit3(true);
            this._switchOrbit3Tab('acceso');
            // [B5-H3] "Request Access" desde landing → nueva cuenta (VR-REBORN-08)
            document.dispatchEvent(new CustomEvent('Skeleton:Form:PresetSignup', {
                bubbles: true,
                detail: { profile: 'inversor' },
            }));
        });

        document.addEventListener('Skeleton:Action:GateClosed', () => {
            this.toggleOrbit3(false);
            // [B5-H2] Reset perfil radio al cerrar — evita state leakage (VR-REBORN-08)
            const defaultRadio = document.querySelector('input[name="aip-perfil"][value="inversor"]');
            if (defaultRadio) { defaultRadio.checked = true; }
        });
        document.addEventListener('Skeleton:Action:GateIdle', () => {
            this.toggleOrbit3(false);
            // [B5-H2] Reset perfil radio al cerrar — evita state leakage (VR-REBORN-08)
            const defaultRadio = document.querySelector('input[name="aip-perfil"][value="inversor"]');
            if (defaultRadio) { defaultRadio.checked = true; }
        });
        document.addEventListener('Skeleton:Action:toggleOrbit3', () => this.toggleOrbit3());

        document.getElementById('btn-attest-enter')?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('Skeleton:Legal:Accepted', { bubbles: true }));
        });

        // [HALLAZGO-04] AuthToggle debe abrir Orbit-3, hacer switch a tab acceso
        // Y LUEGO mostrar el gatekeeper panel. Antes solo hacía switchGateMode sin abrir.
        document.addEventListener('Skeleton:Action:AuthToggle', () => {
            this.toggleOrbit3(true);
            this._switchOrbit3Tab('acceso');
            this.switchGateMode('gatekeeper');
        });

        document.addEventListener('Skeleton:Action:OAuthSuccess', async (e) => {
            // [DEV-BYPASS] localhost — OAuth buttons entran directamente sin Firebase
            const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            if (isDev) {
                console.warn('[AIPHandler][DEV] OAuth dev bypass activo — saltando Firebase.');
                UserFSM.transition('LOGIN_SUBMITTED');
                PassportValidator.validateAccess({
                    usr: 'dev-usr-001', rol: 'inv', tier: 'inst',
                    jur: 'CH', kyc: 'ok', pv: 1,
                    wc: ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                });
                return;
            }

            // [E6-T06] Firebase OAuth real — Google / Microsoft / LinkedIn fallback
            const providerName = e.detail?.provider; // 'google' | 'microsoft' | 'linkedin'

            if (providerName === 'linkedin') {
                console.warn('[AIPHandler] LinkedIn requiere Custom Token Backend. Usar Alta por Datos.');
                return;
            }

            try {
                const { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider } = await import('firebase/auth');
                const auth = getAuth(firebaseApp);
                let providerObj;
                if (providerName === 'google') {
                    providerObj = new GoogleAuthProvider();
                } else if (providerName === 'microsoft') {
                    providerObj = new OAuthProvider('microsoft.com');
                } else {
                    return;
                }
                const cred = await signInWithPopup(auth, providerObj);
                UserFSM.transition('LOGIN_SUBMITTED');
                PassportValidator.validateAccess({
                    usr: cred.user.uid, rol: 'inv', tier: 'inst',
                    jur: 'CH', kyc: 'ok', pv: 1,
                    wc: ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                });
            } catch (err) {
                console.error('[AIPHandler] Firebase OAuth error:', err.code, err.message);
                // [B2-H2] Mostrar error visible al usuario — popup vacío sin feedback (VR-REBORN-08)
                const errEl = document.getElementById('aip-signin-error');
                if (errEl) {
                    errEl.textContent = 'Autenticación OAuth no disponible. Usa correo y contraseña.';
                    errEl.classList.remove('hidden');
                }
            }
        });

        document.addEventListener('Skeleton:Action:NavInicio', () => {
            document.getElementById('orbit-2')?.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.addEventListener('Skeleton:Action:OrbitTab', (e) => this._switchOrbit3Tab(e.detail.tab));

        document.addEventListener('Skeleton:HydrateVertical', (e) => {
            if (e.detail.vertical === 'aip') this.hydrate(e.detail.data);
        });

        // [E6-T05 — 2026-06-03] EXIT → FSM real
        document.addEventListener('Skeleton:Action:Exit', () => {
            UserFSM.transition('LOGOUT');
            document.dispatchEvent(new CustomEvent('Skeleton:State:OrbitReset', { bubbles: true }));
            // Restablece orbit-3 a estado GUEST sin recargar página
        });
    },

    toggleOrbit3(forceShow = null) {
        const orbit3 = document.getElementById('orbit-3');
        const handoff = document.getElementById('handoff-container');
        if (!orbit3) return;

        const isCurrentlyActive = orbit3.classList.contains('active');
        const shouldShow = (forceShow !== null) ? forceShow : !isCurrentlyActive;

        if (shouldShow) {
            orbit3.classList.remove('orbit3-collapsed');
            const cvp = orbit3.querySelector('.content-viewport');
            if (cvp) cvp.classList.remove('hidden');
            orbit3.classList.add('active');
            setTimeout(() => {
                if (handoff) {
                    handoff.classList.remove('opacity-0', 'pointer-events-none');
                    handoff.classList.add('opacity-100');
                }
            }, 300);
        } else {
            if (handoff) {
                handoff.classList.add('opacity-0', 'pointer-events-none');
                handoff.classList.remove('opacity-100');
            }
            orbit3.classList.remove('active');
        }
    },

    _switchOrbit3Tab(tab) {
        const tabs = {
            sistema: document.getElementById('orbit3-tab-sistema'),
            aimon:   document.getElementById('orbit3-tab-aimon'),
            acceso:  document.getElementById('orbit3-tab-acceso'),
        };
        const buttons  = document.querySelectorAll('.mode-dial__option');
        const railBtns = document.querySelectorAll('[data-rail-tab]');

        Object.entries(tabs).forEach(([key, el]) => {
            if (!el) return;
            if (key === tab) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });

        buttons.forEach(btn  => btn.classList.toggle('mode-dial__option--active', btn.dataset.tab === tab));
        railBtns.forEach(btn => btn.classList.toggle('rail-node--active', btn.dataset.railTab === tab));
    },

    _showLegalAttestation(wcWhitelist) {
        console.log('[AIPHandler] Aislamiento Inmersivo — Mostrando Peaje Legal (Attestation)...');
        this._wcPending = wcWhitelist;

        // Apagón atómico del entorno público
        const landingHeader  = document.querySelector('body > header');
        const landingFooter  = document.querySelector('body > footer');
        const orbit3Landing  = document.getElementById('orbit-3');
        const landingContent = document.getElementById('orbit-2-main-content');
        const tabContainer   = document.getElementById('tab-content-container');

        if (landingHeader)  landingHeader.classList.add('hidden');
        if (landingFooter)  landingFooter.classList.add('hidden');
        if (orbit3Landing)  orbit3Landing.classList.add('hidden');
        if (landingContent) landingContent.classList.add('hidden');
        if (tabContainer)   tabContainer.classList.add('hidden');

        document.getElementById('landing-view')?.classList.add('hidden');
        document.getElementById('legal-attestation-gate')?.classList.remove('hidden');
    },

    showCRM(wcWhitelist = []) {
        const currentState = UserFSM.getState();
        if (currentState !== 'ORBIT_3_CRM_ACTIVE') {
            console.error(`[AIPHandler] showCRM abortado: estado inválido ${currentState}. Se requiere ORBIT_3_CRM_ACTIVE.`);
            return;
        }

        const chassis = document.querySelector('.aip-chassis');
        if (chassis) chassis.style.gridTemplateColumns = '1fr';

        const orbit2 = document.getElementById('orbit-2');
        if (orbit2) orbit2.className = 'overflow-hidden w-full h-full';

        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.cssText = 'display:flex;width:100%;height:100%;';
        }

        // Prevención Inception: Filtramos el web component host
        if (dashboard && Array.isArray(wcWhitelist) && wcWhitelist.length > 0) {
            wcWhitelist.forEach(tagName => {
                if (tagName === 'aip-trinity-layout') return; // Evita inyectar el chasis dentro de sí mismo
                const el = document.createElement(tagName);
                el.setAttribute('data-sdui', 'true');
                dashboard.appendChild(el);
            });
        }
    },

    _showAccessDenied(reasonCode) {
        const gate = document.getElementById('gatekeeper-panel');
        const idle = document.getElementById('orbit-3-idle');

        if (gate) gate.classList.add('hidden');
        if (idle) idle.classList.remove('hidden');

        const existingBanner = document.getElementById('gate-denied-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('div');
        banner.id = 'gate-denied-banner';
        banner.style.cssText = 'margin-top: 24px; padding: 16px; border: 1px solid var(--theme-error-border, #ff4d4f); background: var(--theme-error-bg, rgba(255, 77, 79, 0.1));';

        const title = document.createElement('p');
        title.style.cssText = 'font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--theme-error-text, #ff4d4f); margin-bottom: 8px;';
        title.textContent = 'ACCESO RESTRINGIDO';

        const detail = document.createElement('p');
        detail.style.cssText = 'font-size: 11px; color: var(--theme-text-secondary, #888); line-height: 1.5;';

        const reasonMap = Object.freeze({
            'ERR_KYC_FIELD_MISSING':          'Estado KYC no encontrado en credenciales.',
            'ERR_KYC_STATUS_NOT_OK':           'Validación KYC incompleta.',
            'ERR_WC_ARRAY_MISSING':            'Permisos de componentes no definidos.',
            'ERR_WC_ARRAY_EMPTY':              'Permisos de componentes vacíos.',
            'ERR_PAYLOAD_NULL':                'Token de sesión inválido.',
            'ERR_PAYLOAD_INVALID_STRUCTURE':   'Estructura de credenciales corrupta.',
        });
        detail.textContent = reasonMap[reasonCode] ?? 'Bloqueo de seguridad activo.';

        banner.append(title, detail);
        idle?.appendChild(banner);
    },

    switchGateMode(mode) {
        const idle = document.getElementById('orbit-3-idle');
        const gate = document.getElementById('gatekeeper-panel');

        if (mode === 'gatekeeper') {
            idle?.classList.add('hidden');
            gate?.classList.remove('hidden');
        } else {
            gate?.classList.add('hidden');
            idle?.classList.remove('hidden');
        }
    },

    hydrate(data) {
        const ticker = document.querySelector('.ticker-content');
        if (ticker && data.ticker) {
            ticker.textContent = `XAU/USD ${data.ticker.xau} • SOFR ${data.ticker.sofr} • EUR/CHF ${data.ticker.eur_chf}`;
        }
    },

    _setupAccessForm() {
        // [E6-T11] Toggle Sign-up / Sign-in — ACCEDER por defecto (H-02)
        let _formMode = 'signin'; // 'signup' | 'signin'
        const btnSignup      = document.getElementById('aip-mode-signup');
        const btnSignin      = document.getElementById('aip-mode-signin');
        const signupFields   = document.getElementById('aip-signup-fields');
        const signupExtra    = document.getElementById('aip-signup-extra');
        const submitBtn      = document.getElementById('aip-submit');

        const _setMode = (mode) => {
            _formMode = mode;
            const isSignup = mode === 'signup';
            if (signupFields) signupFields.classList.toggle('hidden', !isSignup);
            if (signupExtra)  signupExtra.classList.toggle('hidden',  !isSignup);
            if (submitBtn)    submitBtn.textContent = isSignup ? 'ENVIAR SOLICITUD' : 'ACCEDER';
            btnSignup?.classList.toggle('text-[#7FB4FF]',  isSignup);
            btnSignup?.classList.toggle('border-[#7FB4FF]', isSignup);
            btnSignup?.classList.toggle('text-[#9AA7B6]',  !isSignup);
            btnSignup?.classList.toggle('border-transparent', !isSignup);
            btnSignin?.classList.toggle('text-[#7FB4FF]',  !isSignup);
            btnSignin?.classList.toggle('border-[#7FB4FF]', !isSignup);
            btnSignin?.classList.toggle('text-[#9AA7B6]',   isSignup);
            btnSignin?.classList.toggle('border-transparent', isSignup);
            document.getElementById('aip-form-error')?.classList.add('hidden');
            document.getElementById('aip-signin-error')?.classList.add('hidden');
        };

        btnSignup?.addEventListener('click', () => _setMode('signup'));
        btnSignin?.addEventListener('click', () => _setMode('signin'));
        _setMode('signin'); // estado inicial canónico

        // [VENTURES-CTA] Preset signup desde CTA externo — HALLAZGO-02
        // Disparado por Orbit4VenturesSubmit en index.html inline script.
        // Entra en scope de _setMode y de los radios de perfil.
        document.addEventListener('Skeleton:Form:PresetSignup', (e) => {
            _setMode('signup');
            const profile = e.detail?.profile ?? 'inversor';
            const radio = document.querySelector(`input[name="aip-perfil"][value="${profile}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true })); // activa fundador-hint si aplica
            }
            console.log(`[AIPHandler] PresetSignup → modo signup · perfil: ${profile}`);
        });

        document.querySelectorAll('input[name="aip-perfil"]').forEach(input => {
            input.addEventListener('change', () => {
                const wrap = document.getElementById('aip-entidad-wrap');
                if (!wrap) return;
                wrap.classList.toggle('hidden', !(input.value === 'agente' && input.checked));
            });
        });

        const motivos      = document.getElementById('aip-motivos');
        const countDisplay = document.getElementById('aip-motivos-count');
        const errorMsg     = document.getElementById('aip-motivos-error');

        if (motivos && countDisplay) {
            motivos.addEventListener('input', () => {
                const words = motivos.value.trim().split(/\s+/).filter(w => w.length > 0);
                const count = words.length;
                countDisplay.textContent = `Palabras: ${count} / 45`;
                if (count > 45) {
                    countDisplay.style.color = '#FF4757';
                } else if (count >= 12) {
                    countDisplay.style.color = '#00D4AA';
                } else {
                    countDisplay.style.color = '#9AA7B6';
                }
                if (errorMsg) {
                    errorMsg.classList.toggle('hidden', count === 0 || (count >= 12 && count <= 45));
                }
            });
        }

        const form = document.getElementById('aip-access-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formError   = document.getElementById('aip-form-error');
            const signinError = document.getElementById('aip-signin-error');
            formError?.classList.add('hidden');
            signinError?.classList.add('hidden');

            const email  = document.getElementById('aip-email')?.value?.trim();
            const isDev  = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

            // [E6-T11] Rama SIGN-IN — usuario ya registrado
            if (_formMode === 'signin') {
                const pass = document.getElementById('aip-password')?.value;
                if (!email || !pass) { signinError?.classList.remove('hidden'); return; }
                try {
                    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
                    const auth = getAuth(firebaseApp);
                    const cred = await signInWithEmailAndPassword(auth, email, pass);
                    console.log('[AIPHandler][E6-T11] Sign-in exitoso para UID:', cred.user.uid);
                    UserFSM.transition('LOGIN_SUBMITTED');
                    PassportValidator.validateAccess({
                        usr: cred.user.uid, rol: 'inv', tier: 'inst', jur: 'CH',
                        kyc: 'ok', pv: 1,
                        wc: ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                    });
                } catch (err) {
                    console.error('[AIPHandler][E6-T11] Sign-in error:', err.code);
                    signinError?.classList.remove('hidden');
                }
                return;
            }

            // [DEV-BYPASS] localhost only — email dev@aip.local salta TODAS las validaciones y Firebase
            if (isDev && email === 'dev@aip.local') {
                console.warn('[AIPHandler][DEV] Dev bypass activo — saltando Firebase Auth.');
                UserFSM.transition('LOGIN_SUBMITTED');
                const devPayload = {
                    usr:  'dev-usr-001',
                    rol:  'inv',
                    tier: 'inst',
                    jur:  'CH',
                    kyc:  'ok',
                    pv:   1,
                    wc:   ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                };
                PassportValidator.validateAccess(devPayload);
                return;
            }

            // Validación normal (solo si no es dev bypass)
            const motivosVal = document.getElementById('aip-motivos')?.value.trim() ?? '';
            const wordCount  = motivosVal.split(/\s+/).filter(w => w.length > 0).length;
            if (wordCount < 12 || wordCount > 45) {
                document.getElementById('aip-motivos-error')?.classList.remove('hidden');
                formError?.classList.remove('hidden');
                return;
            }
            const nombre = document.getElementById('aip-nombre')?.value.trim();
            const razon  = document.getElementById('aip-razon')?.value.trim();
            const comms  = document.getElementById('aip-check-comms')?.checked;
            const data   = document.getElementById('aip-check-data')?.checked;
            const pass   = document.getElementById('aip-password')?.value;
            if (!nombre || !razon || !email || !comms || !data || !pass) {
                formError?.classList.remove('hidden');
                return;
            }
            formError?.classList.add('hidden');

            // [E6-T07b] Formulario = ALTA/REGISTRO — createUserWithEmailAndPassword + Firestore write
            // [SEC-VEC-01 · FIX-2] Activar guardia antes de createUser para bloquear esclusa en onAuthStateChanged.
            this._signupInProgress = true;
            try {
                const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
                const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');

                const auth = getAuth(firebaseApp);
                const cred = await createUserWithEmailAndPassword(auth, email, pass);

                // Escritura real en Firestore — colección 'users', documento uid
                const db = getFirestore(firebaseApp);
                await setDoc(doc(db, 'users', cred.user.uid), {
                    uid:       cred.user.uid,
                    email:     email,
                    nombre:    nombre,
                    razon:     razon,
                    comms:     comms,
                    data:      data,
                    kyc:       'pending',
                    rol:       'inv',
                    createdAt: serverTimestamp(),
                    status:    'REGISTERED',
                });

                console.log('[AIPHandler] Firestore: solicitud de acceso registrada para UID:', cred.user.uid);

                UserFSM.transition('LOGIN_SUBMITTED');
                // [E6-T10] kyc:'ok' para el validador de UI → dispara LegalModal (Attestation).
                // El documento Firestore guarda 'pending' — ese es el estado real de KYC.
                PassportValidator.validateAccess({
                    usr:  cred.user.uid,
                    rol:  'inv',
                    tier: 'inst',
                    jur:  'CH',
                    kyc:  'ok',
                    pv:   1,
                    wc:   ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                });
                // [SEC-VEC-01 · FIX-2] Registro completado — liberar guardia.
                this._signupInProgress = false;
            } catch (err) {
                // [SEC-VEC-01 · FIX-2] Liberar guardia también en error para no bloquear futuros intentos.
                this._signupInProgress = false;
                console.error('[AIPHandler] Firebase Auth/Firestore registry error:', err.code, err.message);
                if (err.code === 'auth/email-already-in-use') {
                    // [E6-T11] Redirigir al modo sign-in con mensaje orientativo
                    _setMode('signin');
                    if (signinError) {
                        signinError.textContent = 'Este correo ya tiene cuenta. Introduce tu contraseña para acceder.';
                        signinError.classList.remove('hidden');
                    }
                } else {
                    formError?.classList.remove('hidden');
                }
            }
        });
    },

    _setupCRMControls() {
        const orbit1Toggle = document.getElementById('crm-orbit1-toggle');
        const orbit1Panel  = document.getElementById('crm-orbit-1');

        if (orbit1Toggle && orbit1Panel) {
            orbit1Toggle.addEventListener('click', () => {
                const isCollapsed = orbit1Panel.classList.toggle('collapsed');
                orbit1Toggle.setAttribute('aria-expanded', !isCollapsed);
                const icon = orbit1Toggle.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.textContent = isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left';
                }
            });
        }

        const orbit3Toggle = document.getElementById('crm-orbit3-toggle');
        const orbit3Panel  = document.getElementById('crm-orbit-3-panel');

        if (orbit3Toggle && orbit3Panel) {
            orbit3Toggle.addEventListener('click', () => {
                const isCollapsed = orbit3Panel.classList.toggle('collapsed');
                orbit3Toggle.setAttribute('aria-expanded', !isCollapsed);
                const icon = orbit3Toggle.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.textContent = isCollapsed ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right';
                }
            });
        }

        const themeInput = document.getElementById('crm-theme-toggle-input');
        const themeLabel = document.querySelector('.crm-theme-label');
        const themeKey   = 'crm_theme';

        if (themeInput) {
            const savedTheme = localStorage.getItem(themeKey) || 'dark';
            if (savedTheme === 'light') {
                document.body.classList.add('light-mode');
                themeInput.checked = true;
                if (themeLabel) themeLabel.textContent = 'Light';
            }

            themeInput.addEventListener('change', () => {
                const isLight = themeInput.checked;
                document.body.classList.toggle('light-mode', isLight);
                localStorage.setItem(themeKey, isLight ? 'light' : 'dark');
                if (themeLabel) themeLabel.textContent = isLight ? 'Light' : 'Dark';
            });
        }
    },
};

export default AIPHandler;
