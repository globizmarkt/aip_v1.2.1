// ============================================================
// ARCHIVO  : aip-kyc-individual.js
// VERSIÓN  : 1.1.0
// FECHA    : 2026-06-16
// PROPÓSITO: Componente Fase 2 — KYC Individual (L3).
//            4 pasos: Datos personales → Naturaleza jurídica →
//            Documentación (upload + QR handoff) → Confirmación.
//            Transición: NDA_CONFIRMED → KYC_SUBMITTED (Triple-Write R11)
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Constantes de Operación
// [SEC-03] Helper DOM — _c() (R32: cero innerHTML)
// [SEC-04] Clase AipKycIndividual — Web Component
//   [SEC-04a] Estado interno
//   [SEC-04b] Lifecycle & Inicialización (readState)
//   [SEC-04c] Controladores de navegación (Pasos 1 y 2)
//   [SEC-04d] Controladores Documentales (Paso 3a y 3b)
//   [SEC-04e] Lógica QR Handoff (por cara, Google Charts, cero polling)
//   [SEC-04f] Motor de Envío: Storage Upload + Triple-Write (R11)
//   [SEC-04g] Evento Final
//   [SEC-04h] DOM Builder (_render) — R32 / R8
// [SEC-05] Registro del custom element

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA ACTIVA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R8  (DOM Mudo): textos vía data-i18n — nunca strings hardcodeados en DOM
//   R11 (Triple-Write): users/ + kyc_submissions/ + audit_log/ via Promise.all()
//   R19 (No borrar): en error de Firestore, NO eliminar archivos ya subidos a Storage
//   R32 (XSS Zero-Trust): textContent y createElement — nunca innerHTML
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones
import { ReactiveElement } from '../../base/reactive-element.js';
import { readState }        from '../../../01-core/app-store.js';
import { getAuth }          from 'firebase/auth';
import {
    getFirestore,
    doc,
    onSnapshot,
}                           from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
}                           from 'firebase/storage';

// [SEC-02] Constantes de Operación
const STEP = Object.freeze({ PERSONAL: 1, LEGAL: 2, DOCUMENTS: 3, CONFIRMATION: 4 });
const QR_TTL_SECS        = 15 * 60;  // 15 minutos
const MAX_FILE_BYTES      = 10 * 1024 * 1024;
const ACCEPTED_TYPES      = '.jpg,.jpeg,.png,.pdf';

// SEC-02 — URL base para QR mobile (Sentinel reemplaza con dominio real antes de integración)
const MOBILE_UPLOAD_BASE  = 'https://aip.example.com/mobile-upload';

// [SEC-03] Helper DOM — scope de módulo (R32: cero innerHTML)
function _c(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        switch (k) {
            case 'className':   el.className  = v; break;
            case 'textContent': el.textContent = v; break;
            case 'type':        el.type        = v; break;
            case 'name':        el.name        = v; break;
            case 'value':       el.value       = v; break;
            case 'required':    el.required    = v; break;
            case 'disabled':    el.disabled    = v; break;
            case 'readOnly':    el.readOnly    = v; break;
            case 'checked':     el.checked     = v; break;
            case 'htmlFor':     el.htmlFor     = v; break;
            case 'src':         el.src         = v; break;
            case 'alt':         el.alt         = v; break;
            case 'width':       el.width       = v; break;
            case 'height':      el.height      = v; break;
            default:
                if (v !== false && v !== null && v !== undefined)
                    el.setAttribute(k, v === true ? '' : v);
        }
    }
    for (const child of children) {
        if (child instanceof Node) el.appendChild(child);
        else if (child !== null && child !== undefined)
            el.appendChild(document.createTextNode(String(child)));
    }
    return el;
}

// [SEC-04] Clase AipKycIndividual — Web Component
class AipKycIndividual extends ReactiveElement {

    // [SEC-04a] Estado interno
    #step    = STEP.PERSONAL;
    #loading = false;
    #error   = '';

    // Paso 1 — datos personales
    #formData = {
        nombre_legal:     '',
        fecha_nacimiento: '',
        nacionalidad:     '',
        pais_residencia:  '',
        direccion:        '',
        telefono:         '',
    };

    // Paso 2 — naturaleza jurídica
    #legalNature = '';   // 'persona_fisica' | 'persona_juridica'
    #requiresKYB = false;

    // Paso 3 — documentación
    #docType   = '';     // 'pasaporte' | 'dni_cedula' | 'permiso_conduccion'
    #frontFile = null;
    #backFile  = null;
    #frontUrl  = null;   // URL local (createObjectURL) o remote (Storage download_url)
    #backUrl   = null;
    #isLegible = false;

    // QR State — por cara
    #qrStates = {
        front: { token: null, ttl: 0, timerRef: null, unsub: null },
        back:  { token: null, ttl: 0, timerRef: null, unsub: null },
    };

    // [SEC-04b] Lifecycle & Inicialización
    connectedCallback() {
        super.connectedCallback();
        this._initData();
        this._render();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._teardownQR('front');
        this._teardownQR('back');
    }

    stateChanged(_newState) {
        // Fase 2 gestiona su estado internamente — no re-renderizar desde el store global
    }

    _initData() {
        const state = readState();
        const s     = state.session ?? {};
        const auth  = getAuth();
        this.#formData.nombre_legal = s.nombre ?? s.operador ?? auth.currentUser?.displayName ?? '';
        this.#formData.telefono     = s.telefono ?? '';
    }

    // [SEC-04c] Controladores de navegación (Pasos 1 y 2)
    _handlePersonalSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        this.#formData = {
            nombre_legal:     (fd.get('nombre_legal')     || '').trim(),
            fecha_nacimiento:  fd.get('fecha_nacimiento')  || '',
            nacionalidad:     (fd.get('nacionalidad')      || '').trim(),
            pais_residencia:  (fd.get('pais_residencia')   || '').trim(),
            direccion:        (fd.get('direccion')          || '').trim(),
            telefono:         (fd.get('telefono')           || '').trim(),
        };
        this.#error = '';
        this.#step  = STEP.LEGAL;
        this._render();
    }

    _handleLegalSubmit(e) {
        e.preventDefault();
        const fd     = new FormData(e.target);
        const nature = fd.get('legal_nature');
        if (!nature) return;

        this.#legalNature = nature;
        this.#requiresKYB = (nature === 'persona_juridica');
        this.#error = '';
        this.#step  = STEP.DOCUMENTS;
        this._render();
    }

    // [SEC-04d] Controladores Documentales (Paso 3a y 3b)
    _handleDocTypeSelect(e) {
        this.#docType   = e.target.value;
        this.#frontFile = null;
        this.#backFile  = null;
        this.#frontUrl  = null;
        this.#backUrl   = null;
        this.#isLegible = false;
        this._teardownQR('front');
        this._teardownQR('back');
        this._render();
    }

    _handleDesktopFile(e, face) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            this.#error = 'kyc.upload.error.too_large';
            this._render();
            return;
        }
        this.#error = '';
        if (face === 'front') {
            this.#frontFile = file;
            this.#frontUrl  = URL.createObjectURL(file);
        } else {
            this.#backFile = file;
            this.#backUrl  = URL.createObjectURL(file);
        }
        this._teardownQR(face);
        this._render();
    }

    // [SEC-04e] Lógica QR Handoff (despacho .68 Fase 3, 2026-07-09)
    // Reemplaza el patrón cliente-escribe-directo-a-qr_tokens (bloqueado por
    // firestore.rules deny-all + bug serverTimestamp no importado) por sesión
    // server-side vía Cloud Function createKycSession.
    async _initQRHandoff(face) {
        this.#error = '';
        this._teardownQR(face);
        this._render();

        try {
            const uid = getAuth().currentUser?.uid;
            if (!uid) throw new Error('No authenticated user');

            const { data } = await httpsCallable(getFunctions(), 'createKycSession')();
            const sessionId = data.sessionId;

            this.#qrStates[face].token = sessionId;
            this._startQRCountdown(face);
            this._listenMobileUpload(face, sessionId);

        } catch (err) {
            console.error('[KYC:QR] Error generando sesión handoff:', err);
            this.#error = 'kyc.qr.error.generation';
        } finally {
            this._render();
        }
    }

    _startQRCountdown(face) {
        const state   = this.#qrStates[face];
        state.ttl     = QR_TTL_SECS;
        state.timerRef = setInterval(() => {
            state.ttl--;
            if (state.ttl <= 0) {
                this._teardownQR(face);
                this.#error = 'kyc.qr.error.expired';
            }
            this._render();
        }, 1000);
    }

    _listenMobileUpload(face, sessionId) {
        const db    = getFirestore();
        const state = this.#qrStates[face];

        state.unsub = onSnapshot(doc(db, 'kyc_sessions', sessionId), (snap) => {
            const data = snap.data();
            // Estados: pending -> scanned -> attested -> in_progress -> completed
            if (data?.status === 'completed' && data?.download_url) {
                if (face === 'front') { this.#frontUrl = data.download_url; this.#frontFile = null; }
                else                  { this.#backUrl  = data.download_url; this.#backFile  = null; }
                this._teardownQR(face);
                this._render();
            } else if (data?.status === 'expired') {
                this._teardownQR(face);
                this.#error = 'kyc.qr.error.expired';
                this._render();
            }
        });
    }

    _teardownQR(face) {
        const state = this.#qrStates[face];
        if (state.timerRef) clearInterval(state.timerRef);
        if (state.unsub)    state.unsub();
        state.token    = null;
        state.ttl      = 0;
        state.timerRef = null;
        state.unsub    = null;
    }

    // [SEC-04f] Motor de Envío: Storage Upload + Triple-Write (R11)
    async _handleFinalSubmit(e) {
        e.preventDefault();

        const requireBack = (this.#docType !== 'pasaporte');
        if (!this.#frontUrl || (requireBack && !this.#backUrl) || !this.#isLegible) return;

        this.#loading = true;
        this.#error   = '';
        this._render();

        try {
            const uid     = getAuth().currentUser?.uid;
            if (!uid) throw new Error('Unauthenticated');

            const storage = getStorage();
            const ts      = Date.now();
            let finalFrontUrl = this.#frontUrl;
            let finalBackUrl  = this.#backUrl;

            // Upload a Storage si son archivos locales (no vinieron por QR)
            if (this.#frontFile) {
                const ext  = this.#frontFile.name.split('.').pop();
                const sRef = ref(storage, `kyc/${uid}/documents/${this.#docType}_front_${ts}.${ext}`);
                await uploadBytes(sRef, this.#frontFile);
                finalFrontUrl = await getDownloadURL(sRef);
            }
            if (requireBack && this.#backFile) {
                const ext  = this.#backFile.name.split('.').pop();
                const sRef = ref(storage, `kyc/${uid}/documents/${this.#docType}_back_${ts}.${ext}`);
                await uploadBytes(sRef, this.#backFile);
                finalBackUrl = await getDownloadURL(sRef);
            }
            if (!requireBack) finalBackUrl = null;

            // Triple-Write R11 — via Cloud Function executeUserAction (08-01.1.9)
            await httpsCallable(getFunctions(), 'executeUserAction')({
                action: 'submitKycIndividual',
                payload: {
                    doc_type:      this.#docType,
                    front_url:     finalFrontUrl,
                    back_url:      finalBackUrl,
                    legal_nature:  this.#legalNature,
                    requires_kyb:  this.#requiresKYB,
                    personal_data: this.#formData,
                    user_agent:    navigator.userAgent,
                },
            });

            this.#step = STEP.CONFIRMATION;

        } catch (err) {
            console.error('[KYC:Individual] Error en envío:', err);
            // R19: NO borrar archivos de Storage si el error ocurre en Firestore
            this.#error = 'kyc.submit.error.general';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    // [SEC-04g] Evento Final
    _emitFinalEvent() {
        this.dispatchEvent(new CustomEvent('AIP:KYC:IndividualSubmitted', {
            bubbles: true,
            detail:  { requiresKYB: this.#requiresKYB },
        }));
    }

    // Utilidades internas
    _formatTTL(secs) {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    _generateQRImg(token) {
        const mobileUrl = `${MOBILE_UPLOAD_BASE}?token=${token}`;
        const qrSrc     = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(mobileUrl)}`;
        // alt vacío: el QR es funcional, no descriptivo (R8)
        return _c('img', { src: qrSrc, alt: '', width: '200', height: '200' });
    }

    // [SEC-04h] DOM Builder (_render) — R8 / R32
    _render() {
        while (this.firstChild) this.removeChild(this.firstChild);
        const root = _c('div', { className: 'kyc-individual' });

        // Banner de error
        if (this.#error) {
            root.appendChild(
                _c('div', { className: 'kyc-individual__error', role: 'alert' }, [
                    _c('span', { 'data-i18n': this.#error }),
                ])
            );
        }

        // ── PASO 1 — Datos personales ──────────────────────────────────────────
        if (this.#step === STEP.PERSONAL) {
            const form = _c('form', { className: 'kyc-individual__form' });
            form.addEventListener('submit', this._handlePersonalSubmit.bind(this));

            form.appendChild(_c('h2', { 'data-i18n': 'kyc.personal.title' }));

            const fields = [
                { name: 'nombre_legal',     type: 'text', i18n: 'kyc.personal.nombre_legal',     val: this.#formData.nombre_legal },
                { name: 'fecha_nacimiento', type: 'date', i18n: 'kyc.personal.fecha_nacimiento',  val: this.#formData.fecha_nacimiento },
                { name: 'nacionalidad',     type: 'text', i18n: 'kyc.personal.nacionalidad',      val: this.#formData.nacionalidad },
                { name: 'pais_residencia',  type: 'text', i18n: 'kyc.personal.pais_residencia',   val: this.#formData.pais_residencia },
                { name: 'direccion',        type: 'text', i18n: 'kyc.personal.direccion',         val: this.#formData.direccion },
                { name: 'telefono',         type: 'tel',  i18n: 'kyc.personal.telefono',          val: this.#formData.telefono },
            ];
            for (const f of fields) {
                form.appendChild(_c('label', { 'data-i18n': f.i18n, htmlFor: f.name }));
                form.appendChild(_c('input', { type: f.type, name: f.name, id: f.name, value: f.val, required: true, className: 'aip-input' }));
            }
            form.appendChild(
                _c('button', { type: 'submit', className: 'aip-btn-primary' }, [
                    _c('span', { 'data-i18n': 'kyc.personal.cta' }),
                ])
            );
            root.appendChild(form);

        // ── PASO 2 — Naturaleza jurídica ───────────────────────────────────────
        } else if (this.#step === STEP.LEGAL) {
            const form = _c('form', { className: 'kyc-individual__form' });
            form.addEventListener('submit', this._handleLegalSubmit.bind(this));

            form.appendChild(_c('h2', { 'data-i18n': 'kyc.nature.title' }));
            form.appendChild(_c('p',  { 'data-i18n': 'kyc.nature.question' }));

            const radios = [
                { value: 'persona_fisica',   i18n: 'kyc.nature.individual', id: 'rad_fisica' },
                { value: 'persona_juridica', i18n: 'kyc.nature.entity',     id: 'rad_juridica' },
            ];
            for (const r of radios) {
                const input = _c('input', {
                    type:    'radio',
                    name:    'legal_nature',
                    id:      r.id,
                    value:   r.value,
                    checked: this.#legalNature === r.value,
                    required: true,
                });
                const wrap = _c('div', { className: 'kyc-individual__radio-row' });
                wrap.appendChild(input);
                wrap.appendChild(_c('label', { htmlFor: r.id, 'data-i18n': r.i18n }));
                form.appendChild(wrap);
            }
            form.appendChild(
                _c('button', { type: 'submit', className: 'aip-btn-primary' }, [
                    _c('span', { 'data-i18n': 'kyc.nature.cta' }),
                ])
            );
            root.appendChild(form);

        // ── PASO 3 — Documentación ─────────────────────────────────────────────
        } else if (this.#step === STEP.DOCUMENTS) {
            const container = _c('div', { className: 'kyc-individual__upload-panel' });
            container.appendChild(_c('h2', { 'data-i18n': 'kyc.docs.title' }));

            // Sub-paso 3.a — Tipo de documento
            const docTypes = [
                { value: 'pasaporte',          i18n: 'kyc.doc.passport' },
                { value: 'dni_cedula',          i18n: 'kyc.doc.national_id' },
                { value: 'permiso_conduccion',  i18n: 'kyc.doc.driving_license' },
            ];
            const typeGroup = _c('div', { className: 'kyc-individual__doc-type-group' });
            for (const dt of docTypes) {
                const input = _c('input', {
                    type:    'radio',
                    name:    'doc_type',
                    id:      dt.value,
                    value:   dt.value,
                    checked: this.#docType === dt.value,
                });
                input.addEventListener('change', this._handleDocTypeSelect.bind(this));
                const wrap = _c('div', { className: 'kyc-individual__radio-row' });
                wrap.appendChild(input);
                wrap.appendChild(_c('label', { htmlFor: dt.value, 'data-i18n': dt.i18n }));
                typeGroup.appendChild(wrap);
            }
            container.appendChild(typeGroup);

            // Sub-pasos 3.b y 3.c — Upload (solo si hay docType seleccionado)
            if (this.#docType) {
                const requireBack = (this.#docType !== 'pasaporte');
                const faces       = requireBack ? ['front', 'back'] : ['front'];
                const facesGrid   = _c('div', { className: 'kyc-individual__faces-grid' });

                for (const face of faces) {
                    const faceUrl  = face === 'front' ? this.#frontUrl : this.#backUrl;
                    const qrState  = this.#qrStates[face];
                    const faceI18n = face === 'front' ? 'kyc.docs.anverso' : 'kyc.docs.reverso';

                    const block = _c('div', { className: 'kyc-individual__face-block' });
                    block.appendChild(_c('h4', { 'data-i18n': faceI18n }));

                    if (faceUrl) {
                        // Preview — imagen ya cargada
                        block.appendChild(_c('img', {
                            src:       faceUrl,
                            alt:       '',
                            className: 'kyc-individual__preview-thumb',
                            width:     '140',
                        }));
                    } else if (qrState.token) {
                        // QR activo para esta cara
                        block.appendChild(this._generateQRImg(qrState.token));
                        block.appendChild(
                            _c('div', { className: 'kyc-individual__qr-timer' }, [
                                _c('span', { textContent: this._formatTTL(qrState.ttl) }),
                            ])
                        );
                    } else {
                        // Opciones de carga
                        const fileInput = _c('input', {
                            type:   'file',
                            accept: ACCEPTED_TYPES,
                            id:     `file-${face}`,
                            style:  'display:none',
                        });
                        fileInput.addEventListener('change', (e) => this._handleDesktopFile(e, face));

                        const fileLabel = _c('label', { htmlFor: `file-${face}`, className: 'aip-btn-secondary' }, [
                            _c('span', { 'data-i18n': 'kyc.docs.upload_from_device' }),
                        ]);

                        const qrBtn = _c('button', { type: 'button', className: 'aip-btn-secondary' }, [
                            _c('span', { 'data-i18n': 'kyc.docs.use_phone' }),
                        ]);
                        qrBtn.addEventListener('click', () => this._initQRHandoff(face));

                        block.append(fileInput, fileLabel, qrBtn);
                    }
                    facesGrid.appendChild(block);
                }
                container.appendChild(facesGrid);

                // Sub-paso 3.d — Preview + checkbox + CTA (cuando ambas caras listas)
                const frontReady = !!this.#frontUrl;
                const backReady  = !requireBack || !!this.#backUrl;

                if (frontReady && backReady) {
                    const checkWrap = _c('div', { className: 'kyc-individual__confirm-check' });
                    const checkbox  = _c('input', { type: 'checkbox', id: 'chk-readable', checked: this.#isLegible });
                    checkbox.addEventListener('change', (e) => { this.#isLegible = e.target.checked; this._render(); });
                    checkWrap.appendChild(checkbox);
                    checkWrap.appendChild(_c('label', { htmlFor: 'chk-readable', 'data-i18n': 'kyc.preview.confirm_readable' }));

                    const btnSend = _c('button', { type: 'button', className: 'aip-btn-primary', disabled: !this.#isLegible || this.#loading }, [
                        _c('span', { 'data-i18n': this.#loading ? 'actions.loading' : 'kyc.docs.cta_send' }),
                    ]);
                    btnSend.addEventListener('click', this._handleFinalSubmit.bind(this));

                    container.append(checkWrap, btnSend);
                }
            }
            root.appendChild(container);

        // ── PASO 4 — Confirmación ──────────────────────────────────────────────
        } else if (this.#step === STEP.CONFIRMATION) {
            const panel = _c('div', { className: 'kyc-individual__confirmation' });
            panel.appendChild(_c('h2', { 'data-i18n': 'kyc.submitted.title' }));
            panel.appendChild(_c('p',  { 'data-i18n': 'kyc.submitted.desc' }));

            const btn = _c('button', { type: 'button', className: 'aip-btn-primary' }, [
                _c('span', { 'data-i18n': 'kyc.submitted.cta_return' }),
            ]);
            btn.addEventListener('click', this._emitFinalEvent.bind(this));
            panel.appendChild(btn);
            root.appendChild(panel);
        }

        this.appendChild(root);

        // Re-ignición i18n — notifica hidratación de nuevo DOM
        this.dispatchEvent(new CustomEvent('Skeleton:DOM:Hydrated', {
            bubbles: true,
            detail:  { source: 'aip-kyc-individual', step: this.#step },
        }));
    }
}

// [SEC-05] Registro del custom element
customElements.define('aip-kyc-individual', AipKycIndividual);
