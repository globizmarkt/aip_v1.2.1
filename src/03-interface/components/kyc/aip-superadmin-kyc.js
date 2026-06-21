/**
 * ARCHIVO: aip-superadmin-kyc.js
 * VERSIÓN: 1.3.0
 * FECHA: 2026-06-21
 * PROPÓSITO: Panel de administración SuperAdmin para revisión y aprobación/rechazo de flujos KYC/KYB/L4.
 * ÍNDICE:
 *   [SEC-01] Configuración y Constantes
 *   [SEC-02] Estado Interno y Ciclo de Vida
 *   [SEC-03] Lógica de Carga de Datos (Vistas A, B, C)
 *   [SEC-04] Lógica de Acciones (Aprobación/Rechazo + setIntegrityScore)
 *   [SEC-05] Motor de Renderizado (Tabs y Vistas)
 *
 * /laparoscopia 2026-06-21 [S2 — SYS-ADMIN-IS-01]: añadido panel IntegrityScore
 * en Vista B (campo editable + botón Asignar → executeUserAction setIntegrityScore).
 * Sin cambios visuales en KYC/KYB/L4. R-GADGET-01 preservado.
 */

import { OrbitPanelElement, _c } from '../../base/orbit-panel-element.js';
import { getAuth } from 'firebase/auth';
import {
    getFirestore, doc, getDoc, getDocs, collection,
    setDoc, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// [SEC-01] Configuración y Constantes
const TAB = Object.freeze({ QUEUE: 'queue', USER: 'user', AUDIT: 'audit' });

class AipSuperadminKyc extends OrbitPanelElement {
    // [SEC-02] Estado Interno y Ciclo de Vida
    #tab = TAB.QUEUE;
    #authorized = false;
    #adminUid = null;
    #loading = false;
    #error = '';

    // Vista A
    #queue = [];
    #usersMap = {};

    // Vista B
    #searchUid = '';
    #selectedUid = null;
    #userProfile = null;
    #submissions = { kyc: null, kyb: null, l4: null };
    #actionLoading = false;
    #scoreInput = '';

    // Vista C
    #auditSearchUid = '';
    #auditLogs = [];

    async connectedCallback() {
        super.connectedCallback();
        const auth = getAuth();
        this.#adminUid = auth.currentUser?.uid;

        if (!this.#adminUid) {
            this.#authorized = false;
            this._render();
            return;
        }

        try {
            const data = await this._fetchUserDoc(this.#adminUid);
            if (data?.rol === 'superadmin') {
                this.#authorized = true;
                this._loadQueue();
            } else {
                this.#authorized = false;
            }
        } catch (err) {
            console.error('[SuperAdmin Guard]', err);
            this.#authorized = false;
        }
        this._render();
    }

    disconnectedCallback() { super.disconnectedCallback(); }
    stateChanged() { }

    // [SEC-03] Lógica de Carga de Datos

    async _loadQueue() {
        this.#loading = true;
        this.#error = '';
        this._render();
        const db = getFirestore();

        try {
            const [usersSnap, kycSnap, kybSnap, l4Snap] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'kyc_submissions')),
                getDocs(collection(db, 'kyc_kyb_submissions')),
                getDocs(collection(db, 'kyc_l4_submissions'))
            ]);

            this.#usersMap = {};
            usersSnap.forEach(d => { this.#usersMap[d.id] = d.data(); });

            const aggregate = {};
            const processSub = (snap, type) => {
                snap.forEach(d => {
                    const uid = d.id;
                    if (!aggregate[uid]) aggregate[uid] = { uid, kyc: null, kyb: null, l4: null, lastActivity: 0 };
                    aggregate[uid][type] = d.data();
                    const ts = d.data().submitted_at?.toMillis() || 0;
                    if (ts > aggregate[uid].lastActivity) aggregate[uid].lastActivity = ts;
                });
            };

            processSub(kycSnap, 'kyc');
            processSub(kybSnap, 'kyb');
            processSub(l4Snap, 'l4');

            this.#queue = Object.values(aggregate).sort((a, b) => b.lastActivity - a.lastActivity);
        } catch (err) {
            console.error(err);
            this.#error = 'admin.error.load_queue';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    async _loadUser() {
        const uid = this.#searchUid.trim();
        if (!uid) return;

        this.#loading = true;
        this.#error = '';
        this._render();
        const db = getFirestore();

        try {
            const [userSnap, kycSnap, kybSnap, l4Snap] = await Promise.all([
                getDoc(doc(db, 'users', uid)),
                getDoc(doc(db, 'kyc_submissions', uid)),
                getDoc(doc(db, 'kyc_kyb_submissions', uid)),
                getDoc(doc(db, 'kyc_l4_submissions', uid))
            ]);

            this.#selectedUid = uid;
            this.#userProfile = userSnap.exists() ? userSnap.data() : null;
            this.#submissions = {
                kyc: kycSnap.exists() ? kycSnap.data() : null,
                kyb: kybSnap.exists() ? kybSnap.data() : null,
                l4: l4Snap.exists() ? l4Snap.data() : null
            };
            this.#tab = TAB.USER;
        } catch (err) {
            console.error(err);
            this.#error = 'admin.error.load_user';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    async _loadAudit() {
        const uid = this.#auditSearchUid.trim();
        if (!uid) return;

        this.#loading = true;
        this.#error = '';
        this._render();
        const db = getFirestore();

        try {
            const q = query(collection(db, 'audit_log', uid, 'events'), orderBy('timestamp', 'desc'), limit(50));
            const snap = await getDocs(q);
            this.#auditLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            this.#tab = TAB.AUDIT;
        } catch (err) {
            console.error(err);
            this.#error = 'admin.error.load_audit';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    // [SEC-04] Lógica de Acciones

    async _handleSetIntegrityScore() {
        const score = Number(this.#scoreInput);
        if (!this.#selectedUid || !Number.isFinite(score) || score < 0 || score > 100) return;
        this.#actionLoading = true;
        this._render();
        try {
            await httpsCallable(getFunctions(), 'executeUserAction')({
                action: 'setIntegrityScore',
                payload: { targetUid: this.#selectedUid, score },
            });
            await this._loadUser();
        } catch (err) {
            console.error('[setIntegrityScore]', err);
            this.#error = 'admin.error.action';
            this.#actionLoading = false;
            this._render();
        }
    }

    async _handleAction(type, action) {
        if (!this.#selectedUid || this.#actionLoading) return;
        this.#actionLoading = true;
        this.#error = '';
        this._render();

        const db = getFirestore();
        const uidRef = doc(db, 'users', this.#selectedUid);
        const isApprove = action === 'approve';

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

        const updatePayload = {
            [statusKeyMap[type]]: statusValMap[type],
            [`${type === 'l4' ? 'kyc_l4' : type}_approved_at`]: serverTimestamp(),
            [`${type === 'l4' ? 'kyc_l4' : type}_approved_by`]: this.#adminUid
        };

        try {
            await Promise.all([
                setDoc(uidRef, updatePayload, { merge: true }),
                setDoc(doc(collection(db, 'audit_log', this.#selectedUid, 'events')), {
                    event: eventMap[type],
                    timestamp: serverTimestamp(),
                    approved_by: this.#adminUid,
                    user_agent: navigator.userAgent
                })
            ]);

            this.dispatchEvent(new CustomEvent('AIP:Admin:KYCActionDone', {
                bubbles: true,
                detail: { uid: this.#selectedUid, action, statusWritten: statusValMap[type] }
            }));

            this._loadUser(); // Refresh data
        } catch (err) {
            console.error(err);
            this.#error = 'admin.error.action';
            this.#actionLoading = false;
            this._render();
        }
    }

    // [SEC-05] Motor de Renderizado

    // [BUG-1 FIX — Sentinel 2026-06-03]
    // userDataOverride permite leer status desde usersMap en la Vista A
    // sin depender de this.#userProfile (que es null fuera de Vista B)
    _getStatusI18n(type, userDataOverride = null) {
        const userData = userDataOverride ?? this.#userProfile;
        if (!userData) return 'admin.status.pending';
        const key = type === 'kyc' ? 'kyc_status' : (type === 'kyb' ? 'kyb_status' : 'kyc_l4_status');
        const status = userData[key];
        if (!status) return 'admin.status.pending';
        if (status.includes('APPROVED')) return 'admin.status.approved';
        if (status.includes('REJECTED')) return 'admin.status.rejected';
        return 'admin.status.pending';
    }

    _formatTs(ts) {
        if (!ts) return '—';
        try {
            return new Date(ts.toMillis ? ts.toMillis() : ts).toLocaleString();
        } catch (e) { return '—'; }
    }

    _renderTabs() {
        const tabContainer = _c('div', { className: 'flex gap-4 mb-6 border-b border-[var(--theme-border)] pb-2' });
        [TAB.QUEUE, TAB.USER, TAB.AUDIT].forEach(t => {
            const btn = _c('button', {
                type: 'button',
                className: `text-xs uppercase tracking-widest pb-2 ${this.#tab === t ? 'border-b-2 border-[var(--theme-accent)] text-[var(--theme-accent)]' : 'text-[var(--theme-foreground-alt)]'}`,
                'data-i18n': `admin.tab.${t}`
            });
            btn.addEventListener('click', () => { this.#tab = t; this._render(); });
            tabContainer.appendChild(btn);
        });
        return tabContainer;
    }

    _renderQueueView() {
        const frag = document.createDocumentFragment();

        if (this.#queue.length === 0 && !this.#loading) {
            frag.appendChild(_c('p', { className: 'text-sm text-[var(--theme-foreground-alt)]', 'data-i18n': 'admin.queue.empty' }));
            return frag;
        }

        const table = _c('div', { className: 'w-full text-xs' });

        // Header
        const header = _c('div', { className: 'grid grid-cols-6 gap-2 pb-2 mb-2 border-b border-[var(--theme-border)] font-bold text-[var(--theme-accent)] uppercase' });
        ['admin.col.uid', 'admin.col.kyc', 'admin.col.kyb', 'admin.col.l4', 'admin.col.last_act', 'admin.col.action'].forEach(k => {
            header.appendChild(_c('span', { 'data-i18n': k }));
        });
        table.appendChild(header);

        // Rows
        this.#queue.forEach(item => {
            const row = _c('div', { className: 'grid grid-cols-6 gap-2 py-2 border-b border-[var(--theme-border)] items-center' });

            const uidShort = item.uid.substring(0, 8) + '...';
            row.appendChild(_c('span', { className: 'font-mono', textContent: uidShort }));

            const userData = this.#usersMap[item.uid] || {};
            ['kyc', 'kyb', 'l4'].forEach(type => {
                // [BUG-1 FIX] Pasar userData del usersMap, no this.#userProfile
                const statusI18n = item[type] ? this._getStatusI18n(type, userData) : 'admin.status.none';
                row.appendChild(_c('span', { 'data-i18n': statusI18n }));
            });

            row.appendChild(_c('span', { className: 'text-[var(--theme-foreground-alt)]', textContent: this._formatTs(item.lastActivity) }));

            const btn = _c('button', {
                type: 'button',
                className: 'px-2 py-1 border border-[var(--theme-accent)] text-[var(--theme-accent)] text-[10px] uppercase hover:bg-[var(--theme-accent)] hover:text-[var(--theme-deep-ocean)] transition-colors',
                'data-i18n': 'admin.btn.review'
            });
            btn.addEventListener('click', () => {
                this.#searchUid = item.uid;
                this._loadUser();
            });
            row.appendChild(btn);

            table.appendChild(row);
        });

        frag.appendChild(table);
        return frag;
    }

    _renderUserView() {
        const frag = document.createDocumentFragment();

        // Search Bar
        const searchWrap = _c('div', { className: 'flex gap-2 mb-6' });
        const input = _c('input', {
            type: 'text',
            value: this.#searchUid,
            'data-i18n-placeholder': 'admin.placeholder.uid',
            className: 'flex-1 p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs'
        });
        input.addEventListener('input', (e) => { this.#searchUid = e.target.value; });

        const btnLoad = _c('button', {
            type: 'button',
            className: 'px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase',
            'data-i18n': 'admin.btn.load'
        });
        btnLoad.addEventListener('click', () => this._loadUser());

        searchWrap.appendChild(input);
        searchWrap.appendChild(btnLoad);
        frag.appendChild(searchWrap);

        if (!this.#selectedUid || !this.#userProfile) {
            if (this.#selectedUid) frag.appendChild(_c('p', { className: 'text-red-400 text-xs', 'data-i18n': 'admin.error.user_not_found' }));
            return frag;
        }

        // Profile Header
        const header = _c('div', { className: 'mb-6 p-4 bg-[var(--theme-surface-alt)] border border-[var(--theme-border)]' });
        header.appendChild(_c('p', { className: 'font-mono text-sm text-[var(--theme-accent)]', textContent: `UID: ${this.#selectedUid}` }));
        header.appendChild(_c('p', { className: 'text-xs text-[var(--theme-foreground-alt)]', textContent: `Email: ${this.#userProfile.email || '—'}` }));
        frag.appendChild(header);

        // [S2 — SYS-ADMIN-IS-01] Panel IntegrityScore
        const isPanel = _c('div', { className: 'mb-6 p-4 border border-[var(--theme-accent)]/30 bg-[var(--theme-surface-alt)]' });
        isPanel.appendChild(_c('h3', { className: 'text-xs font-bold uppercase mb-3 text-[var(--theme-accent)]', 'data-i18n': 'admin.integrity.title' }));
        const currentScore = this.#userProfile.integrity_score ?? '—';
        isPanel.appendChild(_c('p', { className: 'text-xs text-[var(--theme-foreground-alt)] mb-3', textContent: `Current: ${currentScore}` }));
        const scoreWrap = _c('div', { className: 'flex gap-2 items-center' });
        const scoreInput = _c('input', {
            type: 'number',
            min: '0', max: '100',
            value: this.#scoreInput,
            className: 'w-20 p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-center',
            'data-i18n-placeholder': 'admin.integrity.placeholder',
        });
        scoreInput.addEventListener('input', (e) => { this.#scoreInput = e.target.value; });
        const btnScore = _c('button', {
            type: 'button',
            className: 'px-3 py-1 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase',
            'data-i18n': 'admin.integrity.btn',
        });
        btnScore.addEventListener('click', () => this._handleSetIntegrityScore());
        scoreWrap.appendChild(scoreInput);
        scoreWrap.appendChild(btnScore);
        isPanel.appendChild(scoreWrap);
        frag.appendChild(isPanel);

        // Sections
        const types = ['kyc', 'kyb', 'l4'];
        types.forEach(type => {
            const sub = this.#submissions[type];
            const section = _c('div', { className: 'mb-6 border border-[var(--theme-border)] p-4' });
            section.appendChild(_c('h3', { className: 'text-sm font-bold uppercase mb-4 text-[var(--theme-accent)]', 'data-i18n': `admin.section.${type}` }));

            if (!sub) {
                section.appendChild(_c('p', { className: 'text-xs text-[var(--theme-foreground-alt)] italic', 'data-i18n': 'admin.status.no_submission' }));
            } else {
                // Data display (safely avoiding innerHTML)
                const dataDiv = _c('div', { className: 'mb-4 text-xs text-[var(--theme-foreground-alt)] grid grid-cols-2 gap-2' });
                Object.entries(sub).forEach(([k, v]) => {
                    if (k === 'submitted_at' || k === 'timestamp') {
                        dataDiv.appendChild(_c('span', { className: 'font-bold', textContent: k }));
                        dataDiv.appendChild(_c('span', { textContent: this._formatTs(v) }));
                    } else if (typeof v !== 'object') {
                        dataDiv.appendChild(_c('span', { className: 'font-bold', textContent: k }));
                        dataDiv.appendChild(_c('span', { textContent: String(v) }));
                    }
                });
                section.appendChild(dataDiv);

                // Action buttons
                if (!this.#actionLoading) {
                    const btnWrap = _c('div', { className: 'flex gap-2' });

                    const btnApprove = _c('button', {
                        type: 'button',
                        className: 'px-3 py-1 bg-green-800 text-white text-[10px] uppercase',
                        'data-i18n': 'admin.btn.approve'
                    });
                    btnApprove.addEventListener('click', () => this._handleAction(type, 'approve'));

                    const btnReject = _c('button', {
                        type: 'button',
                        className: 'px-3 py-1 bg-red-800 text-white text-[10px] uppercase',
                        'data-i18n': 'admin.btn.reject'
                    });
                    btnReject.addEventListener('click', () => this._handleAction(type, 'reject'));

                    btnWrap.appendChild(btnApprove);
                    btnWrap.appendChild(btnReject);
                    section.appendChild(btnWrap);
                } else {
                    section.appendChild(_c('p', { className: 'text-xs text-[var(--theme-accent)] animate-pulse', 'data-i18n': 'admin.loading.action' }));
                }
            }
            frag.appendChild(section);
        });

        return frag;
    }

    _renderAuditView() {
        const frag = document.createDocumentFragment();

        const searchWrap = _c('div', { className: 'flex gap-2 mb-6' });
        const input = _c('input', {
            type: 'text',
            value: this.#auditSearchUid,
            'data-i18n-placeholder': 'admin.placeholder.uid',
            className: 'flex-1 p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs'
        });
        input.addEventListener('input', (e) => { this.#auditSearchUid = e.target.value; });

        const btnLoad = _c('button', {
            type: 'button',
            className: 'px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase',
            'data-i18n': 'admin.btn.load_history'
        });
        btnLoad.addEventListener('click', () => this._loadAudit());

        searchWrap.appendChild(input);
        searchWrap.appendChild(btnLoad);
        frag.appendChild(searchWrap);

        if (this.#auditLogs.length === 0 && this.#tab === TAB.AUDIT) {
            frag.appendChild(_c('p', { className: 'text-sm text-[var(--theme-foreground-alt)]', 'data-i18n': 'admin.audit.empty' }));
            return frag;
        }

        const list = _c('div', { className: 'space-y-2 border-l-2 border-[var(--theme-border)] pl-4' });
        this.#auditLogs.forEach(log => {
            const item = _c('div', { className: 'text-xs' });
            const timeStr = this._formatTs(log.timestamp);
            const approvedBy = log.approved_by ? ` · by ${log.approved_by}` : '';

            item.appendChild(_c('span', { className: 'font-mono text-[var(--theme-accent)] mr-2', textContent: `[${timeStr}]` }));
            item.appendChild(_c('span', { className: 'font-bold text-[var(--theme-foreground)]', textContent: log.event }));
            item.appendChild(_c('span', { className: 'text-[var(--theme-foreground-alt)]', textContent: approvedBy }));
            list.appendChild(item);
        });
        frag.appendChild(list);

        return frag;
    }

    _render() {
        while (this.firstChild) this.removeChild(this.firstChild);

        if (!this.#authorized) {
            this.appendChild(_c('div', { className: 'p-8 text-center border border-red-500/50' }, [
                _c('h2', { className: 'text-xl text-red-400 mb-2', 'data-i18n': 'admin.access.denied.title' }),
                _c('p', { className: 'text-xs text-[var(--theme-foreground-alt)]', 'data-i18n': 'admin.access.denied.desc' })
            ]));
            return;
        }

        const root = _c('div', { className: 'superadmin-kyc p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)]' });

        // [ORB4-ACCOUNTCONFIG-01] Botón de regreso al panel de configuración de cuenta
        const btnBack = _c('button', {
            type: 'button',
            className: 'mb-4 text-xs uppercase tracking-widest text-[var(--theme-foreground-alt)] hover:text-[var(--theme-accent)]',
            'data-i18n': 'account_config.btn.back'
        });
        btnBack.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('AIP:Config:OpenRequested', { bubbles: true }));
        });
        root.appendChild(btnBack);

        root.appendChild(_c('h1', { className: 'font-serif text-3xl text-[var(--theme-foreground)] mb-6 tracking-wide', 'data-i18n': 'admin.title' }));

        if (this.#error) {
            root.appendChild(_c('div', { className: 'mb-4 p-2 border border-red-500/50 text-red-400 text-xs', role: 'alert' }, [
                _c('span', { 'data-i18n': this.#error })
            ]));
        }

        root.appendChild(this._renderTabs());

        if (this.#loading && this.#tab === TAB.QUEUE) {
            root.appendChild(_c('p', { className: 'text-sm text-[var(--theme-accent)] animate-pulse', 'data-i18n': 'admin.loading.queue' }));
        } else if (this.#tab === TAB.QUEUE) {
            root.appendChild(this._renderQueueView());
        } else if (this.#tab === TAB.USER) {
            root.appendChild(this._renderUserView());
        } else if (this.#tab === TAB.AUDIT) {
            root.appendChild(this._renderAuditView());
        }

        this.appendChild(root);
        this._hydrated('aip-superadmin-kyc');
    }
}

customElements.define('aip-superadmin-kyc', AipSuperadminKyc);