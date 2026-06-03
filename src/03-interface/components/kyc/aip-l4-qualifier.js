/**
 * ARCHIVO: aip-l4-qualifier.js
 * VERSIÓN: 1.0.0
 * FECHA: 2026-06-02
 * PROPÓSITO: Flujo de Cualificación L4 (MiFID II / ESMA). Requiere estado IDENTITY_VERIFIED.
 * BASE NORMATIVA: MiFID II (Directiva 2014/65/UE) · ESMA Guidelines on suitability 2018/1113
 * ÍNDICE: 
 *   [SEC-01] Configuración y Constantes
 *   [SEC-02] Estado Interno y Ciclo de Vida
 *   [SEC-03] Gestión de Pasos (1 a 5)
 *   [SEC-04] Lógica QR (Paso 3)
 *   [SEC-05] Persistencia Final (Storage + Triple-Write R11)
 */

import { ReactiveElement } from '../../base/reactive-element.js';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// [SEC-01] Configuración y Constantes
const STEP = Object.freeze({
    INCOME: 1,
    MIFID: 2,
    PROOF_OF_FUNDS: 3,
    EXPERIENCE: 4,
    CONSENT: 5,
    CONFIRMATION: 6
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
            case 'accept': el.accept = v; break;
            case 'multiple': el.multiple = v; break;
            default: if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v === true ? '' : v);
        }
    }
    for (const child of children) {
        if (child instanceof Node) el.appendChild(child);
        else if (child !== null && child !== undefined) el.appendChild(document.createTextNode(String(child)));
    }
    return el;
}

class AipL4Qualifier extends ReactiveElement {
    // [SEC-02] Estado Interno y Ciclo de Vida
    #step = STEP.INCOME;
    #loading = false;
    #error = '';

    // Paso 1
    #incomeRange = null;

    // Paso 2
    #mifidClass = null;

    // Paso 3
    #pofDocType = null;
    #pofFile = null;
    #pofUrl = null;
    #pofConfirmed = false;
    #qrStates = {
        pof: { token: null, ttl: 0, timerRef: null, unsub: null }
    };

    // Paso 4
    #expYears = null;
    #expAssets = [];
    #expMaxTicket = null;

    // Paso 5
    #consent = { terms: false, data: false, risk: false };

    connectedCallback() { super.connectedCallback(); this._render(); }
    disconnectedCallback() { super.disconnectedCallback(); this._teardownQR('pof'); }
    stateChanged() { }

    // [SEC-03] Gestión de Pasos (1 a 5)

    // --- PASO 1: INCOME ---
    _handleIncomeChange(e) {
        this.#incomeRange = e.target.value;
        this.#error = '';
        this._render();
    }

    // --- PASO 2: MIFID ---
    _handleMifidChange(e) {
        this.#mifidClass = e.target.value;
        this.#error = '';
        this._render();
    }

    // --- PASO 3: PROOF OF FUNDS ---
    _handlePofTypeChange(e) {
        this.#pofDocType = e.target.value;
        this.#pofFile = null;
        this.#pofUrl = null;
        this.#pofConfirmed = false;
        this._teardownQR('pof');
        this.#error = '';
        this._render();
    }

    _handlePofFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            this.#error = 'kyc.upload.error.too_large';
            this._render();
            return;
        }
        this.#error = '';
        this.#pofFile = file;
        this.#pofUrl = URL.createObjectURL(file);
        this._teardownQR('pof');
        this._render();
    }

    _handlePofNext() {
        if (!this.#pofUrl || !this.#pofConfirmed) return;
        this.#error = '';
        this.#step = STEP.EXPERIENCE;
        this._render();
    }

    // --- PASO 4: EXPERIENCE ---
    _handleExpYearsChange(e) {
        this.#expYears = e.target.value;
        this.#error = '';
        this._render();
    }

    _handleExpAssetToggle(e) {
        const val = e.target.value;
        if (e.target.checked) {
            if (!this.#expAssets.includes(val)) this.#expAssets.push(val);
        } else {
            this.#expAssets = this.#expAssets.filter(a => a !== val);
        }
        this.#error = '';
        this._render();
    }

    _handleExpMaxTicketChange(e) {
        this.#expMaxTicket = e.target.value;
        this.#error = '';
        this._render();
    }

    _handleExpNext() {
        if (!this.#expYears || this.#expAssets.length === 0 || !this.#expMaxTicket) return;
        this.#error = '';
        this.#step = STEP.CONSENT;
        this._render();
    }

    // --- PASO 5: CONSENT ---
    _handleConsentToggle(e) {
        const key = e.target.dataset.consentKey;
        if (key && this.#consent.hasOwnProperty(key)) {
            this.#consent[key] = e.target.checked;
            this.#error = '';
            this._render();
        }
    }

    // [SEC-05] Persistencia Final (Storage + Triple-Write R11)
    async _handleFinalSubmit() {
        if (!(this.#consent.terms && this.#consent.data && this.#consent.risk) || this.#loading) return;
        this.#loading = true;
        this.#error = '';
        this._render();

        try {
            const uid = getAuth().currentUser?.uid;
            if (!uid) throw new Error('Unauth');
            const storage = getStorage();
            const ts = Date.now();
            let pofUrl = this.#pofUrl;

            // Upload only if file came from desktop
            if (this.#pofFile) {
                const ext = this.#pofFile.name.split('.').pop();
                const sRef = ref(storage, `l4/${uid}/proof_of_funds/pof_${ts}.${ext}`);
                await uploadBytes(sRef, this.#pofFile);
                pofUrl = await getDownloadURL(sRef);
            }

            const db = getFirestore();
            await Promise.all([
                // WRITE 1
                setDoc(doc(db, 'users', uid), {
                    kyc_l4_status: 'KYC_L4_SUBMITTED',
                    kyc_l4_submitted_at: serverTimestamp(),
                    mifid_class: this.#mifidClass,
                }, { merge: true }),

                // WRITE 2
                setDoc(doc(db, 'kyc_l4_submissions', uid), {
                    uid,
                    income_range: this.#incomeRange,
                    mifid_class: this.#mifidClass,
                    pof_doc_type: this.#pofDocType,
                    pof_url: pofUrl,
                    exp_years: this.#expYears,
                    exp_assets: this.#expAssets,
                    exp_max_ticket: this.#expMaxTicket,
                    consent: { ...this.#consent },
                    submitted_at: serverTimestamp(),
                }, { merge: true }),

                // WRITE 3
                setDoc(doc(collection(db, 'audit_log', uid, 'events')), {
                    event: 'KYC_L4_SUBMITTED',
                    timestamp: serverTimestamp(),
                    mifid_class: this.#mifidClass,
                    user_agent: navigator.userAgent,
                })
            ]);

            this.#step = STEP.CONFIRMATION;
        } catch (err) {
            console.error('[L4 Submit]', err);
            this.#error = 'kyc.submit.error.general';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    _emitFinalEvent() {
        this.dispatchEvent(new CustomEvent('AIP:KYC:L4Submitted', {
            bubbles: true,
            detail: { mifidClass: this.#mifidClass },
        }));
    }

    // [SEC-04] Lógica QR (Paso 3)
    async _initQRHandoff() {
        this.#error = '';
        this._teardownQR('pof');
        this._render();
        try {
            const uid = getAuth().currentUser?.uid;
            if (!uid) throw new Error('No user');
            const token = crypto.randomUUID();
            await setDoc(doc(getFirestore(), 'qr_tokens', token), {
                uid, context: 'l4_pof', created_at: serverTimestamp(), expires_at: Date.now() + QR_TTL_SECS * 1000, status: 'pending'
            });
            this.#qrStates.pof.token = token;
            this._startQRCountdown('pof');
            this._listenMobileUpload('pof', token);
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
                this.#pofUrl = data.download_url;
                this.#pofFile = null; // From mobile, no local File to upload later
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

    _render() {
        while (this.firstChild) this.removeChild(this.firstChild);
        const root = _c('div', { className: 'kyc-l4' });

        if (this.#error) {
            root.appendChild(_c('div', { className: 'kyc-l4__error mb-4 p-2 border border-red-500/50 text-red-400 text-xs', role: 'alert' }, [_c('span', { 'data-i18n': this.#error })]));
        }

        if (this.#step === STEP.INCOME) {
            const select = _c('select', { className: 'w-full p-3 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-foreground)]', required: '' });
            select.appendChild(_c('option', { value: '', 'data-i18n': 'l4.income.select_placeholder' }));
            [['menos_100k', 'l4.income.lt100k'], ['100k_500k', 'l4.income.100k500k'], ['500k_2m', 'l4.income.500k2m'], ['mas_2m', 'l4.income.gt2m']].forEach(([val, i18n]) => {
                select.appendChild(_c('option', { value: val, 'data-i18n': i18n }));
            });
            if (this.#incomeRange) select.value = this.#incomeRange;
            select.addEventListener('change', (e) => this._handleIncomeChange(e));
            root.appendChild(select);

            const cta = _c('button', { type: 'button', className: 'mt-6 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'l4.cta_continue', disabled: !this.#incomeRange });
            cta.addEventListener('click', () => { this.#step = STEP.MIFID; this._render(); });
            root.appendChild(cta);
        }

        else if (this.#step === STEP.MIFID) {
            root.appendChild(_c('p', { className: 'mb-4 text-sm text-[var(--theme-foreground-alt)]', 'data-i18n': 'l4.mifid.question' }));

            const options = [
                { val: 'minorista', label: 'l4.mifid.retail', note: 'l4.mifid.retail_note' },
                { val: 'profesional', label: 'l4.mifid.professional', note: 'l4.mifid.professional_note' },
                { val: 'contraparte', label: 'l4.mifid.counterparty', note: 'l4.mifid.counterparty_note' }
            ];

            options.forEach(opt => {
                const rad = _c('input', { type: 'radio', name: 'mifid_class', value: opt.val, checked: this.#mifidClass === opt.val, className: 'mr-2' });
                rad.addEventListener('change', (e) => this._handleMifidChange(e));
                const lbl = _c('label', { className: 'text-xs mr-2', 'data-i18n': opt.label });
                const wrap = _c('div', { className: 'flex items-center mb-2' });
                wrap.appendChild(rad);
                wrap.appendChild(lbl);
                root.appendChild(wrap);

                if (this.#mifidClass === opt.val) {
                    root.appendChild(_c('p', { className: 'ml-6 mb-4 text-[10px] text-[var(--theme-foreground-alt)] italic', 'data-i18n': opt.note }));
                }
            });

            const cta = _c('button', { type: 'button', className: 'mt-6 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'l4.mifid.cta', disabled: !this.#mifidClass });
            cta.addEventListener('click', () => { this.#step = STEP.PROOF_OF_FUNDS; this._render(); });
            root.appendChild(cta);
        }

        else if (this.#step === STEP.PROOF_OF_FUNDS) {
            const docTypes = [
                { val: 'extracto_bancario', label: 'l4.pof.bank_statement', note: 'l4.pof.bank_statement_note' },
                { val: 'declaracion_renta', label: 'l4.pof.tax_return', note: null },
                { val: 'certificado_cartera', label: 'l4.pof.portfolio_cert', note: null },
                { val: 'carta_auditor', label: 'l4.pof.auditor_letter', note: null }
            ];

            docTypes.forEach(opt => {
                const rad = _c('input', { type: 'radio', name: 'pof_doc_type', value: opt.val, checked: this.#pofDocType === opt.val, className: 'mr-2' });
                rad.addEventListener('change', (e) => this._handlePofTypeChange(e));
                const lbl = _c('label', { className: 'text-xs mr-2', 'data-i18n': opt.label });
                const wrap = _c('div', { className: 'flex items-center mb-2' });
                wrap.appendChild(rad);
                wrap.appendChild(lbl);
                root.appendChild(wrap);
                if (this.#pofDocType === opt.val && opt.note) {
                    root.appendChild(_c('p', { className: 'ml-6 mb-2 text-[10px] text-[var(--theme-foreground-alt)]', 'data-i18n': opt.note }));
                }
            });

            if (this.#pofDocType) {
                const uploadDiv = _c('div', { className: 'mt-6 p-4 border border-dashed border-[var(--theme-border)]' });

                if (this.#pofUrl) {
                    uploadDiv.appendChild(_c('img', { src: this.#pofUrl, alt: '', width: '120', className: 'border border-[var(--theme-accent)] mb-2' }));
                    uploadDiv.appendChild(_c('p', { className: 'text-[10px] text-[var(--theme-accent)]', 'data-i18n': 'l4.pof.doc_ready' }));
                } else if (this.#qrStates.pof.token) {
                    uploadDiv.appendChild(this._generateQRImg(this.#qrStates.pof.token));
                    uploadDiv.appendChild(_c('p', { className: 'text-xs mt-2 text-[var(--theme-accent)]', textContent: this._formatTTL(this.#qrStates.pof.ttl) }));
                } else {
                    const inFile = _c('input', { type: 'file', id: 'pof-file-input', accept: ACCEPTED_TYPES, className: 'hidden' });
                    inFile.addEventListener('change', (e) => this._handlePofFile(e));
                    uploadDiv.appendChild(inFile);

                    const lbl = _c('label', { htmlFor: 'pof-file-input', className: 'inline-block px-4 py-2 border border-[var(--theme-border)] text-xs cursor-pointer hover:bg-[var(--theme-surface-bright)]', 'data-i18n': 'l4.pof.upload_label' });
                    uploadDiv.appendChild(lbl);

                    const qrBtn = _c('button', { type: 'button', className: 'ml-4 px-4 py-2 border border-[var(--theme-accent)] text-[var(--theme-accent)] text-xs', 'data-i18n': 'l4.pof.use_phone' });
                    qrBtn.addEventListener('click', () => this._initQRHandoff());
                    uploadDiv.appendChild(qrBtn);
                }
                root.appendChild(uploadDiv);

                if (this.#pofUrl) {
                    const chkWrap = _c('div', { className: 'flex items-center mt-4' });
                    const chk = _c('input', { type: 'checkbox', id: 'chk-pof-auth', checked: this.#pofConfirmed, className: 'mr-2' });
                    chk.addEventListener('change', (e) => { this.#pofConfirmed = e.target.checked; this._render(); });
                    const chkLbl = _c('label', { htmlFor: 'chk-pof-auth', className: 'text-xs text-[var(--theme-foreground-alt)]', 'data-i18n': 'l4.pof.confirm_authentic' });
                    chkWrap.appendChild(chk);
                    chkWrap.appendChild(chkLbl);
                    root.appendChild(chkWrap);

                    const cta = _c('button', { type: 'button', className: 'mt-6 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'l4.pof.cta_submit', disabled: !this.#pofConfirmed });
                    cta.addEventListener('click', () => this._handlePofNext());
                    root.appendChild(cta);
                }
            }
        }

        else if (this.#step === STEP.EXPERIENCE) {
            // Campo A: Años
            root.appendChild(_c('label', { className: 'text-xs text-[var(--theme-foreground-alt)] block mb-1', 'data-i18n': 'l4.exp.years_label' }));
            const selYears = _c('select', { className: 'w-full p-3 mb-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-foreground)]', required: '' });
            selYears.appendChild(_c('option', { value: '' }));
            [['menos_1', 'l4.exp.lt1'], ['1_5', 'l4.exp.1to5'], ['5_10', 'l4.exp.5to10'], ['mas_10', 'l4.exp.gt10']].forEach(([v, k]) => selYears.appendChild(_c('option', { value: v, 'data-i18n': k })));
            if (this.#expYears) selYears.value = this.#expYears;
            selYears.addEventListener('change', (e) => this._handleExpYearsChange(e));
            root.appendChild(selYears);

            // Campo B: Activos
            root.appendChild(_c('label', { className: 'text-xs text-[var(--theme-foreground-alt)] block mb-2', 'data-i18n': 'l4.exp.assets_label' }));
            const assets = [['renta_fija', 'l4.exp.fixed_income'], ['renta_var', 'l4.exp.equities'], ['inmobiliario', 'l4.exp.real_estate'], ['materias_prim', 'l4.exp.commodities'], ['alternativos', 'l4.exp.alternatives']];
            assets.forEach(([val, i18n]) => {
                const chk = _c('input', { type: 'checkbox', value: val, checked: this.#expAssets.includes(val), className: 'mr-2' });
                chk.addEventListener('change', (e) => this._handleExpAssetToggle(e));
                const lbl = _c('label', { className: 'text-xs block mb-2', 'data-i18n': i18n });
                const wrap = _c('div', { className: 'flex items-center' });
                wrap.appendChild(chk);
                wrap.appendChild(lbl);
                root.appendChild(wrap);
            });

            // Campo C: Ticket
            root.appendChild(_c('label', { className: 'text-xs text-[var(--theme-foreground-alt)] block mb-1 mt-4', 'data-i18n': 'l4.exp.max_ticket_label' }));
            const selTicket = _c('select', { className: 'w-full p-3 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-foreground)]', required: '' });
            selTicket.appendChild(_c('option', { value: '' }));
            [['menos_50k', 'l4.exp.lt50k'], ['50k_500k', 'l4.exp.50k500k'], ['500k_5m', 'l4.exp.500k5m'], ['mas_5m', 'l4.exp.gt5m']].forEach(([v, k]) => selTicket.appendChild(_c('option', { value: v, 'data-i18n': k })));
            if (this.#expMaxTicket) selTicket.value = this.#expMaxTicket;
            selTicket.addEventListener('change', (e) => this._handleExpMaxTicketChange(e));
            root.appendChild(selTicket);

            const cta = _c('button', { type: 'button', className: 'mt-6 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'l4.cta_continue', disabled: !this.#expYears || this.#expAssets.length === 0 || !this.#expMaxTicket });
            cta.addEventListener('click', () => this._handleExpNext());
            root.appendChild(cta);
        }

        else if (this.#step === STEP.CONSENT) {
            const consents = [
                { key: 'terms', i18n: 'l4.consent.terms' },
                { key: 'data', i18n: 'l4.consent.data_processing' },
                { key: 'risk', i18n: 'l4.consent.risk_awareness' }
            ];

            consents.forEach(c => {
                const chk = _c('input', { type: 'checkbox', 'data-consent-key': c.key, checked: this.#consent[c.key], className: 'mr-2' });
                chk.addEventListener('change', (e) => this._handleConsentToggle(e));
                const lbl = _c('label', { className: 'text-xs block mb-4', 'data-i18n': c.i18n });
                const wrap = _c('div', { className: 'flex items-start' });
                wrap.appendChild(chk);
                wrap.appendChild(lbl);
                root.appendChild(wrap);
            });

            const cta = _c('button', { type: 'button', className: 'mt-6 px-6 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'l4.consent.cta_submit', disabled: !(this.#consent.terms && this.#consent.data && this.#consent.risk) || this.#loading });
            cta.addEventListener('click', () => this._handleFinalSubmit());
            root.appendChild(cta);
        }

        else if (this.#step === STEP.CONFIRMATION) {
            root.appendChild(_c('h2', { className: 'font-serif text-2xl mb-4', 'data-i18n': 'l4.submitted.title' }));
            root.appendChild(_c('p', { className: 'text-sm text-[var(--theme-foreground-alt)] mb-6', 'data-i18n': 'l4.submitted.desc' }));
            const cta = _c('button', { type: 'button', className: 'px-6 py-2 border border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold text-[10px] uppercase tracking-widest', 'data-i18n': 'l4.submitted.cta_return' });
            cta.addEventListener('click', () => this._emitFinalEvent());
            root.appendChild(cta);
        }

        this.appendChild(root);
        this.dispatchEvent(new CustomEvent('Skeleton:DOM:Hydrated', { bubbles: true, detail: { source: 'aip-l4-qualifier', step: this.#step } }));
    }
}

customElements.define('aip-l4-qualifier', AipL4Qualifier);