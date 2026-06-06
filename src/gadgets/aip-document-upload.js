// ============================================================
// ARCHIVO  : aip-document-upload.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-06
// PROPÓSITO: Web Component — Interfaz de carga de documentos para el VDR de mandatos
// TICKET   : E6-DOC-02
// ============================================================
// %[CARRIL-AIP-INFRA] - [Fase REBORN-04]
//
// DOCTRINA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R3  (Zero-Hex): Solo variables --crm-* para estilos inline
//   DT-AIP-05 (XSS Zero-Trust): createElement + textContent, nunca innerHTML con datos externos
//
// USO
//   <aip-document-upload mandate-id="MDT_001" clearance="MEMBER"></aip-document-upload>
//   clearance: GUEST (solo lectura) | MEMBER (lectura + upload) | PLATINUM (lectura + upload)
// ─────────────────────────────────────────────────────────────────────────────

// ÍNDICE
// [SEC-01] Imports
// [SEC-02] Constantes internas
// [SEC-03] Clase AipDocumentUpload
//   [SEC-03a] static get observedAttributes()
//   [SEC-03b] connectedCallback()
//   [SEC-03c] disconnectedCallback()
//   [SEC-03d] _canUpload() → boolean
//   [SEC-03e] _buildShell() → HTMLElement
//   [SEC-03f] _buildUploadZone() → HTMLElement
//   [SEC-03g] _buildProgressIndicator() → HTMLElement
//   [SEC-03h] _renderDocuments(docs)
//   [SEC-03i] _renderEmptyState() → HTMLElement
//   [SEC-03j] _renderDocItem(doc) → HTMLElement
//   [SEC-03k] _handleFileSelect(e)
//   [SEC-03l] _handleDownload(doc)
//   [SEC-03m] _showError(message)
//   [SEC-03n] _clearError()
//   [SEC-03o] _inferDocType(filename) → string
// [SEC-04] Registro

// [SEC-01] Imports
import { ReactiveElement } from '../03-interface/base/reactive-element.js';
import { CloudStorageAdapter } from '../02-infra/storage/CloudStorageAdapter.js';
import { subscribeToDocuments, addDocument } from '../02-infra/firebase/DocumentRepository.js';

// [SEC-02] Constantes internas
const CLEARANCE_WRITE = ['MEMBER', 'PLATINUM'];
const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx';
const ATTR_MANDATE = 'mandate-id';
const ATTR_CLEARANCE = 'clearance';

// [SEC-03] Clase AipDocumentUpload
class AipDocumentUpload extends ReactiveElement {

    // [SEC-03a] Atributos observados
    static get observedAttributes() {
        return [ATTR_MANDATE, ATTR_CLEARANCE];
    }

    // [SEC-03b] connectedCallback — montaje del componente
    connectedCallback() {
        this._mandateId = this.getAttribute(ATTR_MANDATE);
        this._clearance = this.getAttribute(ATTR_CLEARANCE) || 'GUEST';
        this._unsubscribe = null;
        this._isUploading = false;

        if (!this._mandateId) {
            console.warn('[DocumentUpload] mandate-id no proporcionado.');
            return;
        }

        this.appendChild(this._buildShell());

        if (this._canUpload()) {
            const zone = this.querySelector('[data-doc-upload-zone]');
            if (zone) zone.appendChild(this._buildUploadZone());
        }

        this._unsubscribe = subscribeToDocuments(
            this._mandateId,
            (docs) => this._renderDocuments(docs),
            (err) => {
                console.error('[DocumentUpload] Error en suscripción Firestore:', err);
                this._showError('Error de conexión con el repositorio de documentos.');
            }
        );
    }

    // [SEC-03c] disconnectedCallback — limpieza de suscripción
    disconnectedCallback() {
        if (typeof this._unsubscribe === 'function') {
            this._unsubscribe();
            this._unsubscribe = null;
        }
    }

    // [SEC-03d] _canUpload — verifica si el clearance permite escritura
    _canUpload() {
        return CLEARANCE_WRITE.includes(this._clearance);
    }

    // [SEC-03e] _buildShell — estructura raíz del componente
    _buildShell() {
        const shell = document.createElement('div');
        shell.className = 'doc-upload-shell';
        shell.style.cssText = 'display:flex;flex-direction:column;gap:12px;';

        // ── Header: título + contador ──
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--crm-border);padding-bottom:8px;';

        const title = document.createElement('span');
        title.className = 'label-xs';
        title.style.color = 'var(--crm-accent)';
        title.textContent = 'DOCUMENTOS DEL MANDATO';

        const count = document.createElement('span');
        count.className = 'label-sm ghost';
        count.setAttribute('data-doc-count', '');
        count.textContent = '—';

        header.append(title, count);

        // ── Error container (oculto por defecto) ──
        const errorBox = document.createElement('div');
        errorBox.setAttribute('data-doc-error', '');
        errorBox.style.cssText = 'display:none;';

        // ── Lista de documentos ──
        const list = document.createElement('div');
        list.setAttribute('data-doc-list', '');
        list.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

        // ── Zona de upload (se popula si clearance lo permite) ──
        const uploadZone = document.createElement('div');
        uploadZone.setAttribute('data-doc-upload-zone', '');
        uploadZone.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:4px;';

        shell.append(header, errorBox, list, uploadZone);
        return shell;
    }

    // [SEC-03f] _buildUploadZone — input oculto + botón + barra de progreso
    _buildUploadZone() {
        const zone = document.createElement('div');

        // Input file oculto
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ACCEPTED_TYPES;
        input.style.display = 'none';
        input.setAttribute('data-doc-file-input', '');
        input.addEventListener('change', (e) => this._handleFileSelect(e));

        // Botón visible
        const btn = document.createElement('button');
        btn.className = 'btn-inst btn-primary';
        btn.style.cssText = 'padding:6px 16px;font-size:9px;align-self:flex-start;';
        btn.textContent = 'SUBIR DOCUMENTO';
        btn.addEventListener('click', () => input.click());

        // Barra de progreso (oculta hasta activar upload)
        const progressWrap = this._buildProgressIndicator();

        zone.append(input, btn, progressWrap);
        return zone;
    }

    // [SEC-03g] _buildProgressIndicator — barra visual de porcentaje
    _buildProgressIndicator() {
        const wrap = document.createElement('div');
        wrap.setAttribute('data-doc-progress', '');
        wrap.style.cssText = 'display:none;align-items:center;gap:10px;padding:8px 12px;background:var(--crm-surface);border:1px solid var(--crm-border);';

        const barOuter = document.createElement('div');
        barOuter.style.cssText = 'flex:1;height:4px;background:var(--crm-border);overflow:hidden;';

        const barInner = document.createElement('div');
        barInner.setAttribute('data-doc-progress-bar', '');
        barInner.style.cssText = 'height:100%;width:0%;background:var(--crm-accent);transition:width 0.2s ease;';

        barOuter.appendChild(barInner);

        const label = document.createElement('span');
        label.className = 'label-sm ghost';
        label.setAttribute('data-doc-progress-label', '');
        label.textContent = '0%';

        wrap.append(barOuter, label);
        return wrap;
    }

    // [SEC-03h] _renderDocuments — limpia y re-renderiza la lista completa
    _renderDocuments(docs) {
        const list = this.querySelector('[data-doc-list]');
        if (!list) return;

        // DT-AIP-05: limpieza fiduciaria sin innerHTML
        list.textContent = '';

        // Actualizar contador
        const countEl = this.querySelector('[data-doc-count]');
        if (countEl) {
            countEl.textContent = `${docs.length} documento${docs.length !== 1 ? 's' : ''}`;
        }

        if (!docs || docs.length === 0) {
            list.appendChild(this._renderEmptyState());
            return;
        }

        for (let i = 0; i < docs.length; i++) {
            list.appendChild(this._renderDocItem(docs[i]));
        }
    }

    // [SEC-03i] _renderEmptyState — mensaje cuando no hay documentos
    _renderEmptyState() {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:20px;text-align:center;';

        const msg = document.createElement('span');
        msg.className = 'label-sm ghost';
        msg.textContent = 'Sin documentos adjuntos.';

        empty.appendChild(msg);
        return empty;
    }

    // [SEC-03j] _renderDocItem — fila individual de documento
    _renderDocItem(doc) {
        const item = document.createElement('div');
        item.className = 'doc-item';
        item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--crm-border);background:var(--crm-surface);';

        // ── Izquierda: icono + metadatos ──
        const left = document.createElement('div');
        left.style.cssText = 'display:flex;align-items:center;gap:10px;min-width:0;';

        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.style.cssText = 'font-size:16px;color:var(--crm-text-secondary);flex-shrink:0;';
        icon.textContent = 'description';

        const info = document.createElement('div');
        info.style.cssText = 'display:flex;flex-direction:column;gap:2px;min-width:0;';

        const name = document.createElement('span');
        name.style.cssText = 'font-size:11px;color:var(--crm-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;';
        name.textContent = doc.name || doc.storagePath || '—';

        const meta = document.createElement('span');
        meta.className = 'label-sm ghost';
        const parts = [];
        if (doc.contentType) parts.push(doc.contentType);
        if (doc.size) parts.push(`${(doc.size / 1024).toFixed(1)} KB`);
        if (doc.uploadedAt) parts.push(new Date(doc.uploadedAt).toLocaleDateString());
        meta.textContent = parts.length > 0 ? parts.join(' · ') : '—';

        info.append(name, meta);
        left.append(icon, info);

        // ── Derecha: acción de descarga ──
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn-inst';
        dlBtn.style.cssText = 'padding:3px 10px;font-size:8px;flex-shrink:0;';
        dlBtn.textContent = 'DESCARGAR';
        dlBtn.addEventListener('click', () => this._handleDownload(doc));

        item.append(left, dlBtn);
        return item;
    }

    // [SEC-03k] _handleFileSelect — orquesta el flujo completo de subida
    async _handleFileSelect(e) {
        const input = e.target;
        const file = input && input.files && input.files[0];
        if (!file) return;

        if (this._isUploading) return;
        this._isUploading = true;
        this._clearError();

        // Referencias UI de progreso
        const progressWrap = this.querySelector('[data-doc-progress]');
        const progressBar = this.querySelector('[data-doc-progress-bar]');
        const progressLabel = this.querySelector('[data-doc-progress-label]');
        const uploadBtn = this.querySelector('[data-doc-upload-zone] .btn-inst');

        // Mostrar progreso, deshabilitar botón
        if (progressWrap) progressWrap.style.display = 'flex';
        if (progressBar) progressBar.style.width = '0%';
        if (progressLabel) progressLabel.textContent = '0%';
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.style.opacity = '0.4';
        }

        try {
            const userId = window.PassportEngine && window.PassportEngine.uid ? window.PassportEngine.uid : 'unknown';
            const docType = this._inferDocType(file.name);

            // Iniciar subida a Cloud Storage
            const uploadPromise = CloudStorageAdapter.uploadDocument(
                file,
                this._mandateId,
                { uploadedBy: userId, documentType: docType }
            );

            // Suscribir progreso visual (solo onProgress — errores via try/catch)
            CloudStorageAdapter.getUploadProgress(CloudStorageAdapter.lastUploadTask, {
                onProgress: (pct) => {
                    if (progressBar) progressBar.style.width = `${pct}%`;
                    if (progressLabel) progressLabel.textContent = `${Math.round(pct)}%`;
                }
            });

            // Esperar completado
            const result = await uploadPromise;

            // Persistir metadatos en Firestore
            const firestoreId = await addDocument(this._mandateId, {
                name: file.name,
                storagePath: result.storagePath,
                url: result.url,
                size: result.size,
                contentType: result.contentType,
                uploadedAt: new Date().toISOString(),
                uploadedBy: userId,
                documentType: docType,
            });

            // Notificar al ecosistema
            document.dispatchEvent(new CustomEvent('aip:document:uploaded', {
                bubbles: true,
                detail: {
                    mandateId: this._mandateId,
                    document: {
                        id: firestoreId,
                        name: file.name,
                        storagePath: result.storagePath,
                        url: result.url,
                    },
                },
            }));

        } catch (err) {
            console.error('[DocumentUpload] Error en upload:', err);
            this._showError('Error al subir el documento. Intente nuevamente.');
        } finally {
            this._isUploading = false;
            // Reset input para permitir re-selección del mismo archivo
            input.value = '';
            // Ocultar progreso
            if (progressWrap) progressWrap.style.display = 'none';
            // Re-habilitar botón
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.style.opacity = '1';
            }
        }
    }

    // [SEC-03l] _handleDownload — descarga un documento via Cloud Storage
    _handleDownload(doc) {
        if (doc.url) {
            window.open(doc.url, '_blank', 'noopener,noreferrer');
            return;
        }
        if (doc.storagePath) {
            CloudStorageAdapter.downloadDocument(doc.storagePath)
                .then((url) => window.open(url, '_blank', 'noopener,noreferrer'))
                .catch((err) => {
                    console.error('[DocumentUpload] Error descargando:', err);
                    this._showError('Error al obtener el documento.');
                });
        }
    }

    // [SEC-03m] _showError — muestra mensaje de error en el DOM (sin alert)
    _showError(message) {
        const box = this.querySelector('[data-doc-error]');
        if (!box) return;
        box.textContent = '';
        box.style.cssText = 'display:flex;padding:8px 12px;background:var(--crm-surface);border:1px solid var(--crm-error, #FF4757);color:var(--crm-error, #FF4757);font-size:10px;';
        const msg = document.createElement('span');
        msg.textContent = message;
        box.appendChild(msg);
    }

    // [SEC-03n] _clearError — oculta el contenedor de error
    _clearError() {
        const box = this.querySelector('[data-doc-error]');
        if (box) {
            box.textContent = '';
            box.style.display = 'none';
        }
    }

    // [SEC-03o] _inferDocType — deduce tipo documental de la extensión
    _inferDocType(filename) {
        if (!filename || typeof filename !== 'string') return 'other';
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            pdf:  'pdf',
            doc:  'word',
            docx: 'word',
            xls:  'excel',
            xlsx: 'excel',
        };
        return map[ext] || 'other';
    }
}

// [SEC-04] Registro
customElements.define('aip-document-upload', AipDocumentUpload);
export { AipDocumentUpload };
export default AipDocumentUpload;
