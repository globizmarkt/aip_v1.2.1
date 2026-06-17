/**
 * ARCHIVO: aip-account-config.js
 * VERSIÓN: 1.3.0
 * FECHA: 2026-06-16
 * PROPÓSITO: Panel de configuración de cuenta (Órbita 4) — perfil, seguridad,
 *            preferencias, gate de acceso al panel SuperAdmin para
 *            Administradores y Personal AIP, y gate de acceso al Desktop del
 *            Agente para usuarios con rol "agente". Yacimiento [N-34],
 *            tickets ORB4-ACCOUNTCONFIG-01 / ORB4-DESKTOP-AGENTE-01.
 * ÍNDICE:
 *   [SEC-01] Configuración y Constantes
 *   [SEC-02] Estado Interno y Ciclo de Vida — MODIFICADA: añadido #isAgente
 *   [SEC-03] Lógica de Carga (Firestore users/{uid}) — MODIFICADA: usa
 *     OrbitPanelElement._fetchUserDoc + _hasRole (forja [N-34], V-2/V-3)
 *   [SEC-04] Lógica de Acciones (guardar perfil, reset password, timeframe,
 *     navegación) — AMPLIADA: _openAgentDesktop()
 *   [SEC-05] Motor de Renderizado — AMPLIADA: sección "Mi Desktop" gateada
 *     por rol "agente"
 *
 * /laparoscopia 2026-06-15: V-1 (ORB4-DESKTOP-AGENTE-01) — gate SuperAdmin
 * migrado a OrbitPanelElement._hasRole(); nueva sección "Mi Desktop" gateada
 * por _hasRole(data,'agente') que abre <aip-agent-desktop> vía
 * AIP:Agent:OpenRequested. Sin cambios visuales en secciones existentes
 * (R-GADGET-01).
 */

import { OrbitPanelElement, _c } from '../../base/orbit-panel-element.js';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// [SEC-01] Configuración y Constantes
const TIMEFRAMES = Object.freeze(['short', 'medium', 'long']);

class AipAccountConfig extends OrbitPanelElement {
    // [SEC-02] Estado Interno y Ciclo de Vida
    #uid = null;
    #email = '';
    #displayName = '';
    #role = null;
    #timeframe = 'medium';
    #isSuperadmin = false;
    #isAgente = false;
    #authorized = false;
    #saving = false;
    #message = '';

    async connectedCallback() {
        super.connectedCallback();
        const auth = getAuth();
        this.#uid = auth.currentUser?.uid || null;
        this.#email = auth.currentUser?.email || '';

        if (!this.#uid) {
            this.#authorized = false;
            this._render();
            return;
        }

        this.#authorized = true;
        await this._loadProfile();
        this._render();
    }

    disconnectedCallback() { super.disconnectedCallback(); }
    stateChanged() { }

    // [SEC-03] Lógica de Carga

    async _loadProfile() {
        try {
            const data = (await this._fetchUserDoc(this.#uid)) ?? {};
            this.#displayName = data.displayName || '';
            this.#role = data.rol || null;
            this.#timeframe = TIMEFRAMES.includes(data.timeframe_pref) ? data.timeframe_pref : 'medium';
            this.#isSuperadmin = this._hasRole(data, 'superadmin');
            this.#isAgente = this._hasRole(data, 'agente');
        } catch (err) {
            console.error('[AccountConfig] _loadProfile', err);
        }
    }

    // [SEC-04] Lógica de Acciones

    async _saveProfile() {
        if (!this.#uid || this.#saving) return;
        this.#saving = true;
        this.#message = '';
        this._render();

        try {
            await httpsCallable(getFunctions(), 'executeUserAction')({
                action: 'patchAccountProfile',
                payload: { displayName: this.#displayName },
            });
        } catch (err) {
            console.error('[AccountConfig] _saveProfile', err);
        } finally {
            this.#saving = false;
            this._render();
        }
    }

    async _sendPasswordReset() {
        if (!this.#email) return;
        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, this.#email);
            this.#message = 'account_config.msg.reset_sent';
        } catch (err) {
            console.error('[AccountConfig] _sendPasswordReset', err);
        }
        this._render();
    }

    async _setTimeframe(value) {
        if (!TIMEFRAMES.includes(value) || !this.#uid) return;
        this.#timeframe = value;
        this._render();
        try {
            await httpsCallable(getFunctions(), 'executeUserAction')({
                action: 'patchAccountProfile',
                payload: { timeframe_pref: value },
            });
        } catch (err) {
            console.error('[AccountConfig] _setTimeframe', err);
        }
    }

    _openSuperadmin() {
        document.dispatchEvent(new CustomEvent('AIP:Admin:OpenOrbit4', { bubbles: true }));
    }

    _openAgentDesktop() {
        document.dispatchEvent(new CustomEvent('AIP:Agent:OpenRequested', { bubbles: true }));
    }

    _close() {
        document.dispatchEvent(new CustomEvent('AIP:Config:CloseRequested', { bubbles: true }));
    }

    // [SEC-05] Motor de Renderizado

    _render() {
        while (this.firstChild) this.removeChild(this.firstChild);

        if (!this.#authorized) {
            this.appendChild(_c('div', { className: 'p-8 text-center border border-red-500/50' }, [
                _c('p', { className: 'text-xs text-[var(--theme-foreground-alt)]', 'data-i18n': 'account_config.auth.required' })
            ]));
            return;
        }

        const root = _c('div', { className: 'account-config p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)]' });

        // Header
        const header = _c('div', { className: 'flex items-center justify-between mb-6' });
        header.appendChild(_c('h1', { className: 'font-serif text-3xl text-[var(--theme-foreground)] tracking-wide', 'data-i18n': 'account_config.title' }));
        const btnClose = _c('button', {
            type: 'button',
            className: 'text-xs uppercase tracking-widest text-[var(--theme-foreground-alt)] hover:text-[var(--theme-accent)]',
            'data-i18n': 'account_config.btn.close'
        });
        btnClose.addEventListener('click', () => this._close());
        header.appendChild(btnClose);
        root.appendChild(header);

        if (this.#message) {
            root.appendChild(_c('div', { className: 'mb-4 p-2 border border-[var(--theme-accent)]/50 text-[var(--theme-accent)] text-xs', role: 'status' }, [
                _c('span', { 'data-i18n': this.#message })
            ]));
        }

        // Sección Perfil
        const profileSection = _c('div', { className: 'mb-6 border border-[var(--theme-border)] p-4' });
        profileSection.appendChild(_c('label', { className: 'block text-xs uppercase tracking-widest mb-2 text-[var(--theme-foreground-alt)]', htmlFor: 'aip-account-username', 'data-i18n': 'account_config.field.username' }));
        const inputName = _c('input', {
            type: 'text',
            id: 'aip-account-username',
            value: this.#displayName,
            className: 'w-full mb-3 p-2 bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] text-xs'
        });
        inputName.addEventListener('input', (e) => { this.#displayName = e.target.value; });
        profileSection.appendChild(inputName);

        const btnSave = _c('button', {
            type: 'button',
            disabled: this.#saving,
            className: 'px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase',
            'data-i18n': 'account_config.btn.save'
        });
        btnSave.addEventListener('click', () => this._saveProfile());
        profileSection.appendChild(btnSave);
        root.appendChild(profileSection);

        // Sección Seguridad
        const securitySection = _c('div', { className: 'mb-6 border border-[var(--theme-border)] p-4' });
        const btnReset = _c('button', {
            type: 'button',
            className: 'px-4 py-2 border border-[var(--theme-accent)] text-[var(--theme-accent)] text-[10px] uppercase hover:bg-[var(--theme-accent)] hover:text-[var(--theme-deep-ocean)] transition-colors',
            'data-i18n': 'account_config.btn.reset_password'
        });
        btnReset.addEventListener('click', () => this._sendPasswordReset());
        securitySection.appendChild(btnReset);
        root.appendChild(securitySection);

        // Sección Preferencias
        const prefsSection = _c('div', { className: 'mb-6 border border-[var(--theme-border)] p-4' });
        prefsSection.appendChild(_c('label', { className: 'block text-xs uppercase tracking-widest mb-2 text-[var(--theme-foreground-alt)]', htmlFor: 'aip-account-timeframe', 'data-i18n': 'account_config.timeframe.label' }));
        const select = _c('select', {
            id: 'aip-account-timeframe',
            className: 'w-full p-2 bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] text-xs'
        });
        TIMEFRAMES.forEach(tf => {
            const opt = _c('option', { value: tf, 'data-i18n': `account_config.timeframe.${tf}` });
            if (tf === this.#timeframe) opt.selected = true;
            select.appendChild(opt);
        });
        select.addEventListener('change', (e) => this._setTimeframe(e.target.value));
        prefsSection.appendChild(select);
        root.appendChild(prefsSection);

        // Sección Administradores y Personal AIP (gate SuperAdmin)
        if (this.#isSuperadmin) {
            const adminSection = _c('div', { className: 'border border-[var(--theme-border)] p-4' });
            adminSection.appendChild(_c('h3', { className: 'text-sm font-bold uppercase mb-2 text-[var(--theme-accent)]', 'data-i18n': 'account_config.section.admin' }));
            adminSection.appendChild(_c('p', { className: 'text-xs text-[var(--theme-foreground-alt)] mb-4', 'data-i18n': 'account_config.section.admin_desc' }));
            const btnAdmin = _c('button', {
                type: 'button',
                className: 'px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase',
                'data-i18n': 'account_config.btn.open_admin'
            });
            btnAdmin.addEventListener('click', () => this._openSuperadmin());
            adminSection.appendChild(btnAdmin);
            root.appendChild(adminSection);
        }

        // Sección Mi Desktop (gate Agente)
        if (this.#isAgente) {
            const agentSection = _c('div', { className: 'border border-[var(--theme-border)] p-4 mt-6' });
            agentSection.appendChild(_c('h3', { className: 'text-sm font-bold uppercase mb-2 text-[var(--theme-accent)]', 'data-i18n': 'account_config.section.agent_desktop' }));
            agentSection.appendChild(_c('p', { className: 'text-xs text-[var(--theme-foreground-alt)] mb-4', 'data-i18n': 'account_config.section.agent_desktop_desc' }));
            const btnAgent = _c('button', {
                type: 'button',
                className: 'px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase',
                'data-i18n': 'account_config.btn.open_agent_desktop'
            });
            btnAgent.addEventListener('click', () => this._openAgentDesktop());
            agentSection.appendChild(btnAgent);
            root.appendChild(agentSection);
        }

        this.appendChild(root);
        this._hydrated('aip-account-config');
    }
}

customElements.define('aip-account-config', AipAccountConfig);
