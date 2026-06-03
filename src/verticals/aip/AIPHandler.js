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

export const AIPHandler = {
    _t(key) {
        return window.Skeleton?.i18n?.t(key) ?? key;
    },

    init() {
        console.log('[AIPHandler] Inicializando handlers de vertical...');
        UserFSM.boot();
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
            // [DT-AIP-07] populateCRMTable extirpada — reemplazada por <aip-orbit1-tree>
        }, { once: true });
    },

    _setupListeners() {
        document.addEventListener('Skeleton:Action:GateWake', () => {
            this.toggleOrbit3(true);
            this._switchOrbit3Tab('acceso');
        });

        document.addEventListener('Skeleton:Action:GateClosed', () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:GateIdle',   () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:toggleOrbit3', () => this.toggleOrbit3());

        document.getElementById('btn-attest-enter')?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('Skeleton:Legal:Accepted', { bubbles: true }));
        });

        document.addEventListener('Skeleton:Action:AuthToggle', () => this.switchGateMode('gatekeeper'));

        document.addEventListener('Skeleton:Action:OAuthSuccess', async () => {
            const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
            const emailEl = document.getElementById('aip-email');
            const passEl  = document.getElementById('aip-password');
            const email   = emailEl?.value?.trim();
            const pass    = passEl?.value;
            if (!email || !pass) return;
            try {
                const auth = getAuth();
                const cred = await signInWithEmailAndPassword(auth, email, pass);
                UserFSM.transition('LOGIN_SUBMITTED');
                const payload = {
                    usr:  cred.user.uid,
                    rol:  'inv',
                    tier: 'inst',
                    jur:  'CH',
                    kyc:  'ok',
                    pv:   1,
                    wc:   ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                };
                PassportValidator.validateAccess(payload);
            } catch (err) {
                console.error('[AIPHandler] Firebase Auth error:', err.code);
                document.getElementById('aip-form-error')?.classList.remove('hidden');
            }
        });

        document.addEventListener('Skeleton:Action:NavInicio', () => {
            document.getElementById('orbit-2')?.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.addEventListener('Skeleton:Action:OrbitTab', (e) => this._switchOrbit3Tab(e.detail.tab));
        // [DT-AIP-07] Skeleton:Action:CRMFilter eliminado — filterCRM() nunca existió (dead listener)

        document.addEventListener('Skeleton:HydrateVertical', (e) => {
            if (e.detail.vertical === 'aip') this.hydrate(e.detail.data);
        });

        // [DT-AIP-07 Cycle 3 — 2026-05-31] Skeleton:Action:MandateSelected EXTIRPADO de este handler.
        // Listener migrado a aip-crm-home.js → _wire() → ARQ-FIND-11 cerrado.

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

        // [DT-AIP-07 Cycle 3 — 2026-05-31] _injectKYCBanner() EXTIRPADA.
        // El estado KYC es responsabilidad de aip-crm-home.js (notice plate interno).

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
        // [DT-AIP-07] populateCRMTable extirpada — datos de mandatos via aip-orbit1-tree
    },

    // [DT-AIP-07 — 2026-05-31] populateCRMTable() + _stateKey() EXTIRPADAS.
    // Reemplazadas por <aip-orbit1-tree> (src/gadgets/aip-orbit1-tree.js).
    // La taxonomía 3 niveles (Dominio→Categoría→Mandato) vive en el WC reactivo.

    // [DT-AIP-07 Cycle 3 — 2026-05-31] _injectKYCBanner() EXTIRPADA.
    // El banner de KYC es responsabilidad del layout interno del CRM (notice plate en aip-crm-home.js).

    // [DT-AIP-07 Cycle 3 — 2026-05-31] _showMandateDetail() EXTIRPADA (~320 líneas).
    // Reemplazada por _renderMandateDetail() en aip-crm-home.js.
    // Trigger: Skeleton:Action:MandateSelected → aip-crm-home._wire()

    _setupAccessForm() {
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
            const motivosVal  = document.getElementById('aip-motivos')?.value.trim() ?? '';
            const wordCount   = motivosVal.split(/\s+/).filter(w => w.length > 0).length;

            if (wordCount < 12 || wordCount > 45) {
                errorMsg?.classList.remove('hidden');
                formError?.classList.remove('hidden');
                return;
            }

            const nombre = document.getElementById('aip-nombre')?.value.trim();
            const razon  = document.getElementById('aip-razon')?.value.trim();
            const email  = document.getElementById('aip-email')?.value.trim();
            const comms  = document.getElementById('aip-check-comms')?.checked;
            const data   = document.getElementById('aip-check-data')?.checked;
            const pass   = document.getElementById('aip-password')?.value;

            if (!nombre || !razon || !email || !comms || !data || !pass) {
                formError?.classList.remove('hidden');
                return;
            }

            formError?.classList.add('hidden');

            try {
                const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
                const auth = getAuth();
                const cred = await signInWithEmailAndPassword(auth, email, pass);
                UserFSM.transition('LOGIN_SUBMITTED');
                const payload = {
                    usr:  cred.user.uid,
                    rol:  'inv',
                    tier: 'inst',
                    jur:  'CH',
                    kyc:  'ok',
                    pv:   1,
                    wc:   ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'],
                };
                PassportValidator.validateAccess(payload);
            } catch (err) {
                console.error('[AIPHandler] Firebase Auth error:', err.code);
                formError?.classList.remove('hidden');
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
