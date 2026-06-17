/**
 * ARCHIVO: aip-agent-desktop.js
 * VERSIÓN: 1.0.0
 * FECHA: 2026-06-15
 * PROPÓSITO: Desktop del Agente (Órbita 4) — panel para usuarios con
 *            rol "agente" (espejo funcional de aip-superadmin-kyc.js sin
 *            permisos de aprobación/auditoría). Gestión de documentos
 *            propios: subir, listar, descargar, eliminar. Yacimiento [N-34],
 *            ticket ORB4-DESKTOP-AGENTE-01, V-1 de
 *            .claude/PROPUESTAS_AGENTE.md Bloque V.
 * ÍNDICE:
 *   [SEC-01] Imports
 *   [SEC-02] Configuración y Constantes
 *   [SEC-03] Clase AipAgentDesktop extends OrbitPanelElement
 *   [SEC-04] customElements.define
 */

// [SEC-01] Imports
import { OrbitPanelElement, _c } from '../../base/orbit-panel-element.js';
import { getAuth } from 'firebase/auth';
import {
    getFirestore, collection, addDoc, deleteDoc, doc,
    getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// [SEC-02] Configuración y Constantes
const STORAGE_PREFIX = 'agent_docs';
const COLLECTION = 'agent_documents';

class AipAgentDesktop extends OrbitPanelElement {
    #uid = null;
    #authorized = false;
    #loading = false;
    #uploading = false;
    #documents = [];

    async connectedCallback() {
        super.connectedCallback();
        const auth = getAuth();
        this.#uid = auth.currentUser?.uid || null;

        if (!this.#uid) {
            this.#authorized = false;
            this._render();
            return;
        }

        try {
            const data = await this._fetchUserDoc(this.#uid);
            this.#authorized = this._hasRole(data, 'agente');
        } catch (err) {
            console.error('[AgentDesktop Guard]', err);
            this.#authorized = false;
        }

        if (this.#authorized) await this._loadDocuments();
        this._render();
    }

    disconnectedCallback() { super.disconnectedCallback(); }
    stateChanged() { }

    // [SEC-03] Lógica de Carga

    async _loadDocuments() {
        this.#loading = true;
        try {
            const db = getFirestore();
            const q = query(
                collection(db, COLLECTION),
                where('uid', '==', this.#uid),
                orderBy('uploadedAt', 'desc')
            );
            const snap = await getDocs(q);
            this.#documents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (err) {
            console.error('[AgentDesktop] _loadDocuments', err);
        } finally {
            this.#loading = false;
        }
    }

    // Lógica de Acciones

    async _handleUpload(file) {
        if (!file || !this.#uid || this.#uploading) return;
        this.#uploading = true;
        this._render();

        try {
            const storage = getStorage();
            const ts = Date.now();
            const storagePath = `${STORAGE_PREFIX}/${this.#uid}/${ts}_${file.name}`;
            const sRef = ref(storage, storagePath);
            await uploadBytes(sRef, file);
            const url = await getDownloadURL(sRef);

            const db = getFirestore();
            await addDoc(collection(db, COLLECTION), {
                uid: this.#uid,
                fileName: file.name,
                storagePath,
                url,
                size: file.size,
                contentType: file.type || 'application/octet-stream',
                uploadedAt: serverTimestamp()
            });

            await this._loadDocuments();
        } catch (err) {
            console.error('[AgentDesktop] _handleUpload', err);
        } finally {
            this.#uploading = false;
            this._render();
        }
    }

    async _handleDelete(docItem) {
        try {
            const storage = getStorage();
            await deleteObject(ref(storage, docItem.storagePath));
        } catch (err) {
            console.error('[AgentDesktop] _handleDelete (storage)', err);
        }

        try {
            const db = getFirestore();
            await deleteDoc(doc(db, COLLECTION, docItem.id));
        } catch (err) {
            console.error('[AgentDesktop] _handleDelete (firestore)', err);
        }

        await this._loadDocuments();
        this._render();
    }

    _back() {
        document.dispatchEvent(new CustomEvent('AIP:Config:OpenRequested', { bubbles: true }));
    }

    // Motor de Renderizado

    _render() {
        while (this.firstChild) this.removeChild(this.firstChild);

        if (!this.#authorized) {
            this.appendChild(_c('div', { className: 'p-8 text-center border border-red-500/50' }, [
                _c('p', { className: 'text-xs text-[var(--theme-foreground-alt)]', 'data-i18n': 'agent_desktop.auth.required' })
            ]));
            return;
        }

        const root = _c('div', { className: 'agent-desktop p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)]' });

        const btnBack = _c('button', {
            type: 'button',
            className: 'mb-4 text-xs uppercase tracking-widest text-[var(--theme-foreground-alt)] hover:text-[var(--theme-accent)]',
            'data-i18n': 'agent_desktop.btn.back'
        });
        btnBack.addEventListener('click', () => this._back());
        root.appendChild(btnBack);

        root.appendChild(_c('h1', { className: 'font-serif text-3xl text-[var(--theme-foreground)] mb-6 tracking-wide', 'data-i18n': 'agent_desktop.title' }));

        const docsSection = _c('div', { className: 'border border-[var(--theme-border)] p-4' });
        docsSection.appendChild(_c('h3', { className: 'text-sm font-bold uppercase mb-2 text-[var(--theme-accent)]', 'data-i18n': 'agent_desktop.section.documents' }));
        docsSection.appendChild(_c('p', { className: 'text-xs text-[var(--theme-foreground-alt)] mb-4', 'data-i18n': 'agent_desktop.section.documents_desc' }));

        const uploadWrap = _c('div', { className: 'flex gap-2 mb-4' });
        const fileInput = _c('input', {
            type: 'file',
            className: 'flex-1 text-xs bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] p-2'
        });
        const btnUpload = _c('button', {
            type: 'button',
            disabled: this.#uploading,
            className: 'px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-deep-ocean)] font-bold text-[10px] uppercase',
            'data-i18n': 'agent_desktop.btn.upload'
        });
        btnUpload.addEventListener('click', () => this._handleUpload(fileInput.files?.[0]));
        uploadWrap.appendChild(fileInput);
        uploadWrap.appendChild(btnUpload);
        docsSection.appendChild(uploadWrap);

        if (this.#documents.length === 0) {
            docsSection.appendChild(_c('p', { className: 'text-xs text-[var(--theme-foreground-alt)] italic', 'data-i18n': 'agent_desktop.msg.no_documents' }));
        } else {
            const list = _c('div', { className: 'space-y-2' });
            this.#documents.forEach(docItem => {
                const row = _c('div', { className: 'flex items-center justify-between gap-2 py-2 border-b border-[var(--theme-border)] text-xs' });
                row.appendChild(_c('span', { className: 'truncate', textContent: docItem.fileName }));

                const actions = _c('div', { className: 'flex gap-2 shrink-0' });
                const link = _c('a', {
                    href: docItem.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'px-2 py-1 border border-[var(--theme-accent)] text-[var(--theme-accent)] text-[10px] uppercase',
                    'data-i18n': 'agent_desktop.btn.download'
                });
                actions.appendChild(link);

                const btnDelete = _c('button', {
                    type: 'button',
                    className: 'px-2 py-1 border border-red-500 text-red-400 text-[10px] uppercase',
                    'data-i18n': 'agent_desktop.btn.delete'
                });
                btnDelete.addEventListener('click', () => this._handleDelete(docItem));
                actions.appendChild(btnDelete);

                row.appendChild(actions);
                list.appendChild(row);
            });
            docsSection.appendChild(list);
        }

        root.appendChild(docsSection);

        this.appendChild(root);
        this._hydrated('aip-agent-desktop');
    }
}

// [SEC-04] customElements.define
customElements.define('aip-agent-desktop', AipAgentDesktop);
