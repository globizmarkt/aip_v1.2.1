// ============================================================
// ARCHIVO  : aip-kyc-setup.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-02
// PROPÓSITO: Componente Phase 0 — cambio de contraseña + verificación de email.
//            Paso previo obligatorio al flujo KYC Orbit 4.
//            Autónomo: opera sobre Firebase Auth sin tocar el app-store.
//            Emite AIP:KYC:SetupComplete al completar los 3 pasos.
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Constantes y configuración
// [SEC-03] Helper DOM (R32 — cero innerHTML)
// [SEC-04] Validador de contraseña (cliente)
// [SEC-05] Clase AipKycSetup — Web Component
//   [SEC-05a] Campos privados + paso activo
//   [SEC-05b] connectedCallback / lifecycle / disconnectedCallback
//   [SEC-05c] stateChanged (pasivo — Phase 0 no lee el store global)
//   [SEC-05d] Paso 0.1 — Cambio de contraseña
//   [SEC-05e] Paso 0.2 — Envío de correo de verificación
//   [SEC-05f] Paso 0.3 — Comprobación + emisión de SetupComplete
//   [SEC-05g] _render — constructor de DOM (createElement, cero innerHTML)
//   [SEC-05h] _emitCompletion — señal canónica de fase completada
// [SEC-06] Registro del custom element

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA ACTIVA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R8  (DOM Mudo): textos via data-i18n — nunca strings hardcodeados en DOM
//   R32 (XSS Zero-Trust): textContent y createElement — nunca innerHTML con datos
//   R11 (Triple-Write): mutaciones de estado KYC deben tener triple confirmación
//
// NOTA FIREBASE (pendiente E6-T02):
//   Las importaciones de 'firebase/auth' requieren import map en index.html
//   o instalación del SDK modular. Cuando FirebaseConnector.js esté disponible
//   (E6-T02), este componente recibirá getAuth/currentUser vía parámetro de init
//   o desde window.__AIP_FIREBASE__ (a definir en ignition-v13.js).
//   Mientras tanto, el import directo funciona con bundler o import map CDN.
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones
import { ReactiveElement } from '../../base/reactive-element.js';
import {
    getAuth,
    updatePassword,
    sendEmailVerification,
    reload,
} from 'firebase/auth';

// [SEC-02] Constantes y configuración
const STEP = Object.freeze({ PASSWORD: 1, EMAIL: 2, VERIFY: 3 });

// [SEC-03] Helper DOM — R32 (cero innerHTML)
// Función pura, fuera de la clase para no recrearla en cada render.
function _c(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (k === 'textContent') { el.textContent = v; continue; }
        if (k === 'className')   { el.className = v;   continue; }
        if (k === 'disabled')    { el.disabled = v;    continue; }
        if (k === 'type')        { el.type = v;        continue; }
        if (k === 'name')        { el.name = v;        continue; }
        if (k === 'required')    { el.required = v;    continue; }
        el.setAttribute(k, v);
    }
    children.forEach(child => el.appendChild(child));
    return el;
}

// [SEC-04] Validador de contraseña (cliente — spec Brief 01)
// Retorna la clave i18n del error, o null si la contraseña es válida.
function validatePassword(pass, confirm) {
    if (!pass || pass.length < 8)          return 'auth.error.password_too_short';
    if (!/[A-Z]/.test(pass))              return 'auth.error.password_needs_uppercase';
    if (!/[0-9]/.test(pass))              return 'auth.error.password_needs_number';
    if (!/[^A-Za-z0-9]/.test(pass))       return 'auth.error.password_needs_special';
    if (pass !== confirm)                  return 'auth.error.password_mismatch';
    return null;
}

// [SEC-05] Clase AipKycSetup — Web Component
class AipKycSetup extends ReactiveElement {

    // [SEC-05a] Campos privados
    #step        = STEP.PASSWORD;
    #loading     = false;
    #error       = '';           // clave i18n del error activo
    #pwdValid    = false;        // habilita el botón de contraseña en tiempo real

    // [SEC-05b] connectedCallback / lifecycle
    connectedCallback() {
        super.connectedCallback(); // suscripción al store (pasiva para esta fase)

        const auth = getAuth();
        // Guardabarrera: si ya está verificado, completar directamente.
        if (auth.currentUser?.emailVerified) {
            this._emitCompletion();
            return;
        }
        this._render();
    }

    disconnectedCallback() {
        super.disconnectedCallback(); // limpia listener del store
    }

    // [SEC-05c] stateChanged — Phase 0 no necesita el store global.
    // El componente opera puramente sobre Firebase Auth y estado local.
    stateChanged(_newState) { /* intencional — Phase 0 es autónomo */ }

    // [SEC-05d] Paso 0.1 — Cambio de contraseña
    async _handlePasswordSubmit(e) {
        e.preventDefault();
        const data    = new FormData(e.target);
        const pass    = data.get('pwd');
        const confirm = data.get('pwd_confirm');

        // Validación completa en cliente antes de llamar a Firebase
        const validationError = validatePassword(pass, confirm);
        if (validationError) {
            this.#error = validationError;
            this._render();
            return;
        }

        this.#loading = true;
        this.#error   = '';
        this._render();

        try {
            await updatePassword(getAuth().currentUser, pass);
            this.#step = STEP.EMAIL;
        } catch (err) {
            console.error('[KYC:Setup:0.1]', err);
            this.#error = 'auth.error.password_update_failed';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    // Listener de input para habilitar el botón en tiempo real (spec: "deshabilitado hasta que la validación pase")
    _onPasswordInput(pwdEl, confirmEl, btnEl) {
        const err = validatePassword(pwdEl.value, confirmEl.value);
        this.#pwdValid  = (err === null);
        btnEl.disabled  = !this.#pwdValid;
    }

    // [SEC-05e] Paso 0.2 — Envío de correo de verificación
    async _handleEmailSend(e) {
        e.preventDefault();
        this.#loading = true;
        this.#error   = '';
        this._render();

        try {
            await sendEmailVerification(getAuth().currentUser);
            this.#step = STEP.VERIFY;
        } catch (err) {
            console.error('[KYC:Setup:0.2]', err);
            this.#error = 'auth.error.email_send_failed';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    // [SEC-05f] Paso 0.3 — Comprobación de verificación + completar
    async _handleVerifyCheck(e) {
        e.preventDefault();
        this.#loading = true;
        this.#error   = '';
        this._render();

        try {
            await reload(getAuth().currentUser);
            if (getAuth().currentUser?.emailVerified) {
                this._emitCompletion();
            } else {
                this.#error = 'auth.error.email_not_verified_yet';
            }
        } catch (err) {
            console.error('[KYC:Setup:0.3]', err);
            this.#error = 'auth.error.verification_check_failed';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    // [SEC-05g] _render — constructor de DOM (cero innerHTML)
    _render() {
        // Vaciado Light DOM
        while (this.firstChild) this.removeChild(this.firstChild);

        const wrapper = _c('div', { className: 'kyc-setup' });

        // Bloque de error — R8: texto via data-i18n, nunca string directo
        if (this.#error) {
            wrapper.appendChild(
                _c('div', { className: 'kyc-setup__error', role: 'alert' }, [
                    _c('span', { 'data-i18n': this.#error }),
                ])
            );
        }

        // ── Paso 0.1: Contraseña ─────────────────────────────────────────
        if (this.#step === STEP.PASSWORD) {
            const pwdInput     = _c('input', { type: 'password', name: 'pwd',         required: true, className: 'aip-input', 'data-i18n-placeholder': 'kyc.setup.pwd.placeholder' });
            const confirmInput = _c('input', { type: 'password', name: 'pwd_confirm', required: true, className: 'aip-input', 'data-i18n-placeholder': 'kyc.setup.pwd_confirm.placeholder' });
            const submitBtn    = _c('button', { type: 'submit', className: 'aip-btn-primary', disabled: !this.#pwdValid }, [
                _c('span', { 'data-i18n': this.#loading ? 'actions.loading' : 'actions.save_password' }),
            ]);

            // Validación reactiva en tiempo real
            const onInput = () => this._onPasswordInput(pwdInput, confirmInput, submitBtn);
            pwdInput.addEventListener('input', onInput);
            confirmInput.addEventListener('input', onInput);

            const form = _c('form', { className: 'kyc-setup__form' });
            form.addEventListener('submit', this._handlePasswordSubmit.bind(this));
            form.append(
                _c('h2', { 'data-i18n': 'kyc.setup.pwd.title' }),
                pwdInput,
                confirmInput,
                submitBtn,
            );
            wrapper.appendChild(form);

        // ── Paso 0.2: Email ──────────────────────────────────────────────
        } else if (this.#step === STEP.EMAIL) {
            const emailDisplay = _c('div', { className: 'kyc-setup__email-display' });
            // R32: datos del usuario via textContent, nunca innerHTML
            emailDisplay.textContent = getAuth().currentUser?.email ?? '';

            const form = _c('form', { className: 'kyc-setup__form' });
            form.addEventListener('submit', this._handleEmailSend.bind(this));
            form.append(
                _c('h2',  { 'data-i18n': 'kyc.setup.email.title' }),
                _c('p',   { 'data-i18n': 'kyc.setup.email.instruction' }),
                emailDisplay,
                _c('button', { type: 'submit', className: 'aip-btn-primary', disabled: this.#loading }, [
                    _c('span', { 'data-i18n': this.#loading ? 'actions.loading' : 'actions.send_verification' }),
                ]),
            );
            wrapper.appendChild(form);

        // ── Paso 0.3: Verificar ──────────────────────────────────────────
        } else if (this.#step === STEP.VERIFY) {
            const form = _c('form', { className: 'kyc-setup__form' });
            form.addEventListener('submit', this._handleVerifyCheck.bind(this));
            form.append(
                _c('h2', { 'data-i18n': 'kyc.setup.verify.title' }),
                _c('p',  { 'data-i18n': 'kyc.setup.verify.instruction' }),
                _c('p',  { 'data-i18n': 'kyc.setup.verify.spam_note', className: 'kyc-setup__note' }),
                _c('button', { type: 'submit', className: 'aip-btn-primary', disabled: this.#loading }, [
                    _c('span', { 'data-i18n': this.#loading ? 'actions.loading' : 'actions.i_have_verified' }),
                ]),
            );
            wrapper.appendChild(form);
        }

        this.appendChild(wrapper);

        // Re-ignición i18n: notifica al sistema que hay nuevo DOM que hidratar
        this.dispatchEvent(new CustomEvent('Skeleton:DOM:Hydrated', {
            bubbles: true,
            detail: { source: 'aip-kyc-setup', step: this.#step },
        }));
    }

    // [SEC-05h] _emitCompletion — señal canónica de fase completada
    _emitCompletion() {
        this.dispatchEvent(new CustomEvent('AIP:KYC:SetupComplete', { bubbles: true }));
    }
}

// [SEC-06] Registro del custom element
customElements.define('aip-kyc-setup', AipKycSetup);
