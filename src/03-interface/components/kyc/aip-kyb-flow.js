/**
 * ARCHIVO: aip-kyb-flow.js
 * VERSIÓN: 1.1.0
 * FECHA: 2026-06-16
 * PROPÓSITO: Flujo KYB corporativo (6 pasos). AMLD5 (Directiva EU 2018/843) · FATF Rec 10 y 24 · umbral UBO: 25%.
 * ÍNDICE: 
 *   [SEC-01] Configuración y Constantes
 *   [SEC-02] Estado Interno y Ciclo de Vida
 *   [SEC-03] Gestión de Pasos (1 a 6)
 *   [SEC-04] Lógica QR (Paso 3)
 *   [SEC-05] Persistencia Final (Storage + Triple-Write)
 */

import { ReactiveElement } from '../../base/reactive-element.js';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// [SEC-01] Configuración y Constantes
const STEP = Object.freeze({
    ENTITY: 1, REPRESENTATIVE: 2, CORP_DOCS: 3, UBO: 4, PEP: 5, CONFIRMATION: 6
});

const QR_TTL_SECS = 15 * 60;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.pdf';
const MOBILE_UPLOAD_BASE = 'https://aip.example.com/mobile-upload';

function _c(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        switch (k) {
            case 'className': el.className = v; break;
            case 'textContent': el.textContent = v; break;
            case 'type': el.type = v; break;
            case 'name': el.name = v; break;
            case 'value': el.value = v; break;
            case 'required': el.required = v; break;
            case 'disabled': el.disabled = v; break;
            case 'readOnly': el.readOnly = v; break;
            case 'checked': el.checked = v; break;
            case 'htmlFor': el.htmlFor = v; break;
            case 'src': el.src = v; break;
            case 'alt': el.alt = v; break;
            case 'width': el.width = v; break;
            case 'height': el.height = v; break;
            case 'min': el.min = v; break;
            case 'max': el.max = v; break;
            case 'accept': el.accept = v; break;
            case 'placeholder': el.placeholder = v; break;
            default: if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v === true ? '' : v);
        }
    }
    for (const child of children) {
        if (child instanceof Node) el.appendChild(child);
        else if (child !== null && child !== undefined) el.appendChild(document.createTextNode(String(child)));
    }
    return el;
}

class AipKybFlow extends ReactiveElement {
    // [SEC-02] Estado Interno y Ciclo de Vida
    #step = STEP.ENTITY;
    #loading = false;
    #error = '';

    #entityData = { nombre_entidad: '', pais_constitucion: '', cif_tax_id: '', objeto_social: '', fecha_constitucion: '' };

    #repData = { nombre: '', cargo: '' };
    #repFile = null;
    #repUrl = null;

    #escrituraFile = null;
    #escrituraUrl = null;
    #extractoFile = null;
    #extractoUrl = null;
    #docsConfirmed = false;

    #qrStates = {
        escritura: { token: null, ttl: 0, timerRef: null, unsub: null },
        extracto: { token: null, ttl: 0, timerRef: null, unsub: null }
    };

    #uboHasOwners = null;
    #ubos = [];
    #uboNoDeclaration = false;

    #isPEP = null;

    connectedCallback() { super.connectedCallback(); this._render(); }
    disconnectedCallback() { super.disconnectedCallback(); this._teardownQR('escritura'); this._teardownQR('extracto'); }
    stateChanged() { }

    // [SEC-03] Gestión de Pasos (1 a 6)

    // --- PASO 1: ENTIDAD ---
    _handleEntitySubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        this.#entityData = {
            nombre_entidad: (fd.get('nombre_entidad') || '').trim(),
            pais_constitucion: (fd.get('pais_constitucion') || '').trim(),
            cif_tax_id: (fd.get('cif_tax_id') || '').trim(),
            objeto_social: (fd.get('objeto_social') || '').trim(),
            fecha_constitucion: fd.get('fecha_constitucion') || ''
        };
        this.#error = '';
        this.#step = STEP.REPRESENTATIVE;
        this._render();
    }

    // --- PASO 2: REPRESENTANTE ---
    _handleRepFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) { this.#error = 'kyc.upload.error.too_large'; this._render(); return; }
        this.#error = '';
        this.#repFile = file;
        this.#repUrl = URL.createObjectURL(file);
        this._render();
    }

    _handleRepNext() {
        if (!this.#repData.nombre || !this.#repData.cargo || !this.#repFile) return;
        this.#error = '';
        this.#step = STEP.CORP_DOCS;
        this._render();
    }

    // --- PASO 3: CORP_DOCS ---
    _handleDocFile(e, type) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) { this.#error = 'kyc.upload.error.too_large'; this._render(); return; }
        this.#error = '';
        if (type === 'escritura') { this.#escrituraFile = file; this.#escrituraUrl = URL.createObjectURL(file); }
        else if (type === 'extracto') { this.#extractoFile = file; this.#extractoUrl = URL.createObjectURL(file); }
        this._teardownQR(type);
        this._render();
    }

    _handleDocsNext() {
        if (!this.#escrituraUrl || !this.#extractoUrl || !this.#docsConfirmed) return;
        this.#error = '';
        this.#step = STEP.UBO;
        this._render();
    }

    // --- PASO 4: UBO ---
    _handleUboRadio(e) {
        this.#uboHasOwners = e.target.value;
        this.#uboNoDeclaration = false;
        this.#error = '';
        this._render();
    }

    _addUbo() {
        this.#ubos.push({ nombre: '', nacionalidad: '', porcentaje: 0, docFile: null, docUrl: null });
        this._render();
    }

    _removeUbo(i) {
        this.#ubos.splice(i, 1);
        this._render();
    }

    _handleUboField(e, i, field) {
        if (!this.#ubos[i]) return;
        if (field === 'porcentaje') this.#ubos[i][field] = parseFloat(e.target.value) || 0;
        else this.#ubos[i][field] = e.target.value;
    }

    _handleUboDoc(e, i) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) { this.#error = 'kyc.upload.error.too_large'; this._render(); return; }
        this.#error = '';
        this.#ubos[i].docFile = file;
        this.#ubos[i].docUrl = URL.createObjectURL(file);
        this._render();
    }

    _canSubmitUbo() {
        if (this.#uboHasOwners === 'no') return this.#uboNoDeclaration;
        if (this.#uboHasOwners === 'si') {
            if (this.#ubos.length === 0) return false;
            return this.#ubos.every(u => u.nombre && u.nacionalidad && u.porcentaje >= 25 && u.docUrl);
        }
        return false;
    }

    _handleUboNext() {
        if (!this._canSubmitUbo()) return;
        this.#error = '';
        this.#step = STEP.PEP;
        this._render();
    }

    // --- PASO 5: PEP ---
    _handlePepRadio(e) {
        this.#isPEP = e.target.value;
        this.#error = '';
        this._render();
    }

    // [SEC-05] Persistencia Final (Storage + Triple-Write)
    async _handleFinalSubmit() {
        if (this.#isPEP === null || this.#loading) return;
        this.#loading = true;
        this.#error = '';
        this._render();

        try {
            const uid = getAuth().currentUser?.uid;
            if (!uid) throw new Error('Unauth');
            const storage = getStorage();
            const ts = Date.now();

            let repDocUrl = this.#repUrl;
            let escrituraUrl = this.#escrituraUrl;
            let extractoUrl = this.#extractoUrl;
            const uboUrls = [];

            const uploads = [];

            if (this.#repFile) {
                const ext = this.#repFile.name.split('.').pop();
                const sRef = ref(storage, `kyb/${uid}/representative/auth_doc_${ts}.${ext}`);
                uploads.push(uploadBytes(sRef, this.#repFile).then(() => getDownloadURL(sRef).then(u => repDocUrl = u)));
            }
            if (this.#escrituraFile) {
                const ext = this.#escrituraFile.name.split('.').pop();
                const sRef = ref(storage, `kyb/${uid}/corporate/escritura_${ts}.${ext}`);
                uploads.push(uploadBytes(sRef, this.#escrituraFile).then(() => getDownloadURL(sRef).then(u => escrituraUrl = u)));
            }
            if (this.#extractoFile) {
                const ext = this.#extractoFile.name.split('.').pop();
                const sRef = ref(storage, `kyb/${uid}/corporate/extracto_${ts}.${ext}`);
                uploads.push(uploadBytes(sRef, this.#extractoFile).then(() => getDownloadURL(sRef).then(u => extractoUrl = u)));
            }

            this.#ubos.forEach((u, i) => {
                if (u.docFile) {
                    const ext = u.docFile.name.split('.').pop();
                    const sRef = ref(storage, `kyb/${uid}/ubo/ubo_${i}_identity_${ts}.${ext}`);
                    uploads.push(uploadBytes(sRef, u.docFile).then(() => getDownloadURL(sRef).then(url => uboUrls[i] = url)));
                } else {
                    uboUrls[i] = u.docUrl;
                }
            });

            await Promise.all(uploads);

            await httpsCallable(getFunctions(), 'executeUserAction')({
                action: 'submitKyb',
                payload: {
                    company_name: this.#entityData.nombre_empresa || '',
                    kyb_data: {
                        entity_data:        this.#entityData,
                        representative:     { nombre: this.#repData.nombre, cargo: this.#repData.cargo, doc_url: repDocUrl },
                        corporate_docs:     { escritura_url: escrituraUrl, extracto_url: extractoUrl },
                        ubo_has_owners:     this.#uboHasOwners === 'si',
                        ubos:               this.#ubos.map((u, i) => ({ nombre: u.nombre, nacionalidad: u.nacionalidad, porcentaje: u.porcentaje, doc_url: uboUrls[i] })),
                        no_ubo_declaration: this.#uboNoDeclaration,
                        is_pep:             this.#isPEP === 'si',
                    },
                    user_agent: navigator.userAgent,
                },
            });

            this.#step = STEP.CONFIRMATION;
        } catch (err) {
            console.error('[KYB Submit]', err);
            this.#error = 'kyc.submit.error.general';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    _emitFinalEvent() {
        this.dispatchEvent(new CustomEvent('AIP:KYC:KYBSubmitted', {
            bubbles: true,
            detail: { isPEP: this.#isPEP === 'si' },
        }));
    }

    // [SEC-04] Lógica QR (Paso 3)
    async _initQRHandoff(type) {
        this.#error = '';
        this._teardownQR(type);
        this._render();
        try {
            const uid = getAuth().currentUser?.uid;
            if (!uid) throw new Error('No user');
            const token = crypto.randomUUID();
            await setDoc(doc(getFirestore(), 'qr_tokens', token), {
                uid, type, created_at: serverTimestamp(), expires_at: Date.now() + QR_TTL_SECS * 1000, status: 'pending'
            });
            this.#qrStates[type].token = token;
            this._startQRCountdown(type);
            this._listenMobileUpload(type, token);
        } catch (err) {
            console.error('[QR]', err);
            this.#error = 'kyc.qr.error.generation';
        } finally {
            this._render();
        }
    }

    _startQRCountdown(type) {
        const state = this.#qrStates[type];
        state.ttl = QR_TTL_SECS;
        state.timerRef = setInterval(() => {
            state.ttl--;
            if (state.ttl <= 0) {
                this._teardownQR(type);
                this.#error = 'kyc.qr.error.expired';
            }
            this._render();
        }, 1000);
    }

    _listenMobileUpload(type, token) {
        const state = this.#qrStates[type];
        state.unsub = onSnapshot(doc(getFirestore(), 'qr_tokens', token), (snap) => {
            const data = snap.data();
            if (data?.status === 'uploaded' && data?.download_url) {
                if (type === 'escritura') { this.#escrituraUrl = data.download_url; this.#escrituraFile = null; }
                else if (type === 'extracto') { this.#extractoUrl = data.download_url; this.#extractoFile = null; }
                this._teardownQR(type);
                this._render();
            }
        });
    }

    _teardownQR(type) {
        const state = this.#qrStates[type];
        if (state.timerRef) clearInterval(state.timerRef);
        if (state.unsub) state.unsub();
        state.token = null;
        state.ttl = 0;
        state.timerRef = null;
        state.unsub = null;
    }

    _formatTTL(s) {
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }

    _generateQRImg(token) {
        const qrSrc = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(MOBILE_UPLOAD_BASE + '?token=' + token)}`;
        return _c('img', { src: qrSrc, alt: '', width: '200', height: '200' });
    }

    _renderDocBlock(type) {
        const frag = document.createDocumentFragment();
        const isEscritura = type === 'escritura';
        const url = isEscritura ? this.#escrituraUrl : this.#extractoUrl;
        const state = this.#qrStates[type];
        const titleKey = isEscritura ? 'kyb.docs.escritura' : 'kyb.docs.extracto';

        frag.appendChild(_c('h4', { 'data-i18n': titleKey }));

        if (!isEscritura) frag.appendChild(_c('p', { 'data-i18n': 'kyb.docs.extracto_nota' }));

        if (url) {
            frag.appendChild(_c('img', { src: url, alt: '', width: '120', className: 'mt-2 border border-[var(--theme-accent)]' }));
        } else if (state.token) {
            frag.appendChild(this._generateQRImg(state.token));
            frag.appendChild(_c('p', { className: 'text-xs mt-2 text-[var(--theme-accent)]', textContent: this._formatTTL(state.ttl) }));
        } else {
            const inputId = `file-${type}`;
            const input = _c('input', { type: 'file', id: inputId, accept: ACCEPTED_TYPES, className: 'hidden' });
            input.addEventListener('change', (e) => this._handleDocFile(e, type));

            const label = _c('label', { htmlFor: inputId, className: 'inline-block mt-2 px-4 py-2 border border-[var(--theme-border)] text-xs cursor-pointer hover:bg-[var(--theme-surface-bright)]', 'data-i18n': 'kyb.rep.doc_label' });

            const qrBtn = _c('button', { type: 'button', className: 'ml-4 px-4 py-2 border border-[var(--theme-accent)] text-[var(--theme-accent)] text-xs', 'data-i18n': 'kyb.docs.use_phone' });
            qrBtn.addEventListener('click', () => this._initQRHandoff(type));

            frag.appendChild(input);
            frag.appendChild(label);
            frag.appendChild(qrBtn);
        }
        return frag;
    }

    _renderUboBlock(u, i) {
        const frag = document.createDocumentFragment();
        const div = _c('div', { className: 'kyc-kyb__ubo-block p-4 mb-4 border border-[var(--theme-border)] bg-[var(--theme-surface-alt)]' });

        const inputNombre = _c('input', { type: 'text', value: u.nombre, 'data-i18n-placeholder': 'kyb.ubo.nombre', className: 'w-full mb-2 p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs', required: '' });
        inputNombre.addEventListener('input', (e) => this._handleUboField(e, i, 'nombre'));
        div.appendChild(inputNombre);

        const inputNac = _c('input', { type: 'text', value: u.nacionalidad, 'data-i18n-placeholder': 'kyb.ubo.nacionalidad', className: 'w-full mb-2 p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs', required: '' });
        inputNac.addEventListener('input', (e) => this._handleUboField(e, i, 'nacionalidad'));
        div.appendChild(inputNac);

        const inputPct = _c('input', { type: 'number', value: u.porcentaje, min: '25', max: '100', 'data-i18n-placeholder': 'kyb.ubo.porcentaje', className: 'w-full mb-2 p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs', 'data-i18n': 'kyb.ubo.porcentaje', required: '' });
        inputPct.addEventListener('input', (e) => this._handleUboField(e, i, 'porcentaje'));
        div.appendChild(inputPct);

        if (u.docUrl) {
            div.appendChild(_c('img', { src: u.docUrl, alt: '', width: '80', className: 'mb-2' }));
        }

        const inputDoc = _c('input', { type: 'file', id: `ubo-doc-${i}`, accept: ACCEPTED_TYPES, className: 'hidden' });
        inputDoc.addEventListener('change', (e) => this._handleUboDoc(e, i));
        const labelDoc = _c('label', { htmlFor: `ubo-doc-${i}`, className: 'inline-block mb-2 px-3 py-1 border border-[var(--theme-border)] text-[10px] cursor-pointer', 'data-i18n': 'kyb.rep.doc_label' });
        div.appendChild(inputDoc);
        div.appendChild(labelDoc);

        const removeBtn = _c('button', { type: 'button', className: 'text-red-500 text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.ubo.remove_btn' });
        removeBtn.addEventListener('click', () => this._removeUbo(i));
        div.appendChild(removeBtn);

        frag.appendChild(div);
        return frag;
    }

    _render() {
        while (this.firstChild) this.removeChild(this.firstChild);
        const root = _c('div', { className: 'kyc-kyb' });

        if (this.#error) {
            root.appendChild(_c('div', { className: 'kyc-kyb__error mb-4 p-2 border border-red-500/50 text-red-400 text-xs', role: 'alert' }, [_c('span', { 'data-i18n': this.#error })]));
        }

        if (this.#step === STEP.ENTITY) {
            const form = _c('form', { className: 'space-y-4' });
            form.addEventListener('submit', (e) => this._handleEntitySubmit(e));

            form.appendChild(_c('label', { 'data-i18n': 'kyb.entity.nombre' }));
            form.appendChild(_c('input', { type: 'text', name: 'nombre_entidad', value: this.#entityData.nombre_entidad, required: '', className: 'w-full p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs' }));

            form.appendChild(_c('label', { 'data-i18n': 'kyb.entity.pais' }));
            form.appendChild(_c('input', { type: 'text', name: 'pais_constitucion', value: this.#entityData.pais_constitucion, required: '', className: 'w-full p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs' }));

            form.appendChild(_c('label', { 'data-i18n': 'kyb.entity.cif' }));
            form.appendChild(_c('input', { type: 'text', name: 'cif_tax_id', value: this.#entityData.cif_tax_id, required: '', className: 'w-full p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs' }));

            form.appendChild(_c('label', { 'data-i18n': 'kyb.entity.objeto' }));
            form.appendChild(_c('input', { type: 'text', name: 'objeto_social', value: this.#entityData.objeto_social, required: '', className: 'w-full p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs' }));

            form.appendChild(_c('label', { 'data-i18n': 'kyb.entity.fecha' }));
            form.appendChild(_c('input', { type: 'date', name: 'fecha_constitucion', value: this.#entityData.fecha_constitucion, required: '', className: 'w-full p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs' }));

            form.appendChild(_c('button', { type: 'submit', className: 'mt-4 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.entity.cta' }));
            root.appendChild(form);
        }

        else if (this.#step === STEP.REPRESENTATIVE) {
            const div = _c('div', { className: 'space-y-4' });

            div.appendChild(_c('label', { 'data-i18n': 'kyb.rep.nombre' }));
            const inNombre = _c('input', { type: 'text', value: this.#repData.nombre, required: '', className: 'w-full p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs' });
            inNombre.addEventListener('input', (e) => this.#repData.nombre = e.target.value);
            div.appendChild(inNombre);

            div.appendChild(_c('label', { 'data-i18n': 'kyb.rep.cargo' }));
            const inCargo = _c('input', { type: 'text', value: this.#repData.cargo, required: '', className: 'w-full p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs' });
            inCargo.addEventListener('input', (e) => this.#repData.cargo = e.target.value);
            div.appendChild(inCargo);

            if (this.#repUrl) {
                div.appendChild(_c('img', { src: this.#repUrl, alt: '', width: '120', className: 'border border-[var(--theme-accent)]' }));
            } else {
                const inFile = _c('input', { type: 'file', id: 'rep-doc', accept: ACCEPTED_TYPES, className: 'hidden' });
                inFile.addEventListener('change', (e) => this._handleRepFile(e));
                div.appendChild(inFile);
                div.appendChild(_c('label', { htmlFor: 'rep-doc', className: 'inline-block px-4 py-2 border border-[var(--theme-border)] text-xs cursor-pointer hover:bg-[var(--theme-surface-bright)]', 'data-i18n': 'kyb.rep.doc_label' }));
                div.appendChild(_c('p', { className: 'text-[10px] text-[var(--theme-foreground-alt)] mt-1', 'data-i18n': 'kyb.rep.doc_nota' }));
            }

            const cta = _c('button', { type: 'button', className: 'mt-4 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.rep.cta', disabled: !this.#repData.nombre || !this.#repData.cargo || !this.#repFile });
            cta.addEventListener('click', () => this._handleRepNext());
            div.appendChild(cta);
            root.appendChild(div);
        }

        else if (this.#step === STEP.CORP_DOCS) {
            const div = _c('div', { className: 'space-y-8' });
            div.appendChild(this._renderDocBlock('escritura'));
            div.appendChild(this._renderDocBlock('extracto'));

            if (this.#escrituraUrl && this.#extractoUrl) {
                const chk = _c('input', { type: 'checkbox', id: 'chk-docs-valid', checked: this.#docsConfirmed, className: 'mr-2' });
                chk.addEventListener('change', (e) => this.#docsConfirmed = e.target.checked);
                const lbl = _c('label', { htmlFor: 'chk-docs-valid', className: 'text-xs text-[var(--theme-foreground-alt)]', 'data-i18n': 'kyb.docs.confirm_valid' });
                const wrap = _c('div', { className: 'mt-4 flex items-center' });
                wrap.appendChild(chk);
                wrap.appendChild(lbl);
                div.appendChild(wrap);

                const cta = _c('button', { type: 'button', className: 'mt-4 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.docs.cta', disabled: !this.#docsConfirmed });
                cta.addEventListener('click', () => this._handleDocsNext());
                div.appendChild(cta);
            }
            root.appendChild(div);
        }

        else if (this.#step === STEP.UBO) {
            const div = _c('div', { className: 'space-y-4' });
            div.appendChild(_c('h2', { 'data-i18n': 'kyb.ubo.title' }));
            div.appendChild(_c('p', { 'data-i18n': 'kyb.ubo.question' }));

            const radSi = _c('input', { type: 'radio', name: 'ubo_has_owners', value: 'si', checked: this.#uboHasOwners === 'si', className: 'mr-2' });
            radSi.addEventListener('change', (e) => this._handleUboRadio(e));
            const lblSi = _c('label', { className: 'text-xs mr-4', 'data-i18n': 'kyb.ubo.yes' });
            const wrapSi = _c('div', { className: 'flex items-center mb-2' });
            wrapSi.appendChild(radSi); wrapSi.appendChild(lblSi);
            div.appendChild(wrapSi);

            const radNo = _c('input', { type: 'radio', name: 'ubo_has_owners', value: 'no', checked: this.#uboHasOwners === 'no', className: 'mr-2' });
            radNo.addEventListener('change', (e) => this._handleUboRadio(e));
            const lblNo = _c('label', { className: 'text-xs', 'data-i18n': 'kyb.ubo.no' });
            const wrapNo = _c('div', { className: 'flex items-center mb-4' });
            wrapNo.appendChild(radNo); wrapNo.appendChild(lblNo);
            div.appendChild(wrapNo);

            if (this.#uboHasOwners === 'no') {
                const chk = _c('input', { type: 'checkbox', id: 'chk-no-ubo', checked: this.#uboNoDeclaration, className: 'mr-2' });
                chk.addEventListener('change', (e) => this.#uboNoDeclaration = e.target.checked);
                const lbl = _c('label', { htmlFor: 'chk-no-ubo', className: 'text-xs', 'data-i18n': 'kyb.ubo.no_ubo_declaration' });
                const wrap = _c('div', { className: 'flex items-center' });
                wrap.appendChild(chk); wrap.appendChild(lbl);
                div.appendChild(wrap);
            } else if (this.#uboHasOwners === 'si') {
                const addBtn = _c('button', { type: 'button', className: 'mb-4 px-4 py-2 border border-[var(--theme-accent)] text-[var(--theme-accent)] text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.ubo.add_btn' });
                addBtn.addEventListener('click', () => this._addUbo());
                div.appendChild(addBtn);
                this.#ubos.forEach((u, i) => div.appendChild(this._renderUboBlock(u, i)));
            }

            const cta = _c('button', { type: 'button', className: 'mt-6 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.ubo.cta_confirm', disabled: !this._canSubmitUbo() });
            cta.addEventListener('click', () => this._handleUboNext());
            div.appendChild(cta);
            root.appendChild(div);
        }

        else if (this.#step === STEP.PEP) {
            const div = _c('div', { className: 'space-y-4' });
            div.appendChild(_c('h2', { 'data-i18n': 'kyb.pep.title' }));
            div.appendChild(_c('p', { 'data-i18n': 'kyb.pep.question' }));

            const radSi = _c('input', { type: 'radio', name: 'pep', value: 'si', checked: this.#isPEP === 'si', className: 'mr-2' });
            radSi.addEventListener('change', (e) => this._handlePepRadio(e));
            const lblSi = _c('label', { className: 'text-xs mr-4', 'data-i18n': 'kyb.pep.yes' });
            const wrapSi = _c('div', { className: 'flex items-center mb-2' });
            wrapSi.appendChild(radSi); wrapSi.appendChild(lblSi);
            div.appendChild(wrapSi);

            const radNo = _c('input', { type: 'radio', name: 'pep', value: 'no', checked: this.#isPEP === 'no', className: 'mr-2' });
            radNo.addEventListener('change', (e) => this._handlePepRadio(e));
            const lblNo = _c('label', { className: 'text-xs', 'data-i18n': 'kyb.pep.no' });
            const wrapNo = _c('div', { className: 'flex items-center mb-4' });
            wrapNo.appendChild(radNo); wrapNo.appendChild(lblNo);
            div.appendChild(wrapNo);

            if (this.#isPEP === 'si') {
                div.appendChild(_c('div', { className: 'kyc-kyb__pep-notice p-4 mb-4 border border-[var(--theme-accent)] bg-[var(--theme-surface-alt)]' }, [_c('p', { 'data-i18n': 'kyb.pep.yes_notice' })]));
            }

            const cta = _c('button', { type: 'button', className: 'mt-4 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.pep.cta', disabled: this.#isPEP === null || this.#loading });
            cta.addEventListener('click', () => this._handleFinalSubmit());
            div.appendChild(cta);
            root.appendChild(div);
        }

        else if (this.#step === STEP.CONFIRMATION) {
            root.appendChild(_c('h2', { 'data-i18n': 'kyb.submitted.title' }));
            root.appendChild(_c('p', { 'data-i18n': 'kyb.submitted.desc' }));
            const btn = _c('button', { type: 'button', className: 'mt-6 px-6 py-2 border border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'kyb.submitted.cta_return' });
            btn.addEventListener('click', () => this._emitFinalEvent());
            root.appendChild(btn);
        }

        this.appendChild(root);
        this.dispatchEvent(new CustomEvent('Skeleton:DOM:Hydrated', { bubbles: true, detail: { source: 'aip-kyb-flow', step: this.#step } }));
    }
}

customElements.define('aip-kyb-flow', AipKybFlow);