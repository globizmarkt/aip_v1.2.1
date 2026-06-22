// ============================================================
// ARCHIVO  : aip-uploader.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-22
// PROPÓSITO: Gadget Wizard de Ingesta embebido en el CRM de AIP.
//            Recibe archivos (multi), recoge metadata (TIPO/DESTINO/
//            DESCRIPCION/BRIEF), inyecta cabecera METAFAC y empaqueta
//            en ZIP descargable para el Bridge (Drive → Firebase Fase 2).
//            Gate KYC: si el usuario no tiene kycStatus==='ok', muestra
//            pantalla explicativa bloqueada en lugar del wizard.
// RUNTIME  : Web Component Light DOM montado en #orb4-kyc-shell.
// STACK    : vanilla JS + window.JSZip (vendorizado en src/vendor/).
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes — estilos, catálogos (TIPOS/DESTINOS)
// [SEC-03] Helpers puros (slug, tamaño, fecha, escape)
// [SEC-04] Clase AipUploader — Web Component
//   [SEC-04a] Campos privados + lifecycle
//   [SEC-04b] _open — punto de entrada (kycOk gate)
//   [SEC-04c] _renderLocked — pantalla KYC requerido
//   [SEC-04d] _renderWizard — shell estático del wizard
//   [SEC-04e] _wire — event delegation interna
//   [SEC-04f] handleFiles / renderFileList — ingesta de archivos
//   [SEC-04g] updatePreview / METAFAC — preview en tiempo real
//   [SEC-04h] generateZip / downloadZip — empaquetado
//   [SEC-04i] _emit — bus canónico de salida
// [SEC-05] Registro customElements

// DOCTRINA
//   R2  — Light DOM estricto: sin attachShadow()
//   R32 — Sin innerHTML con datos externos: nombres de archivo y campos
//         del usuario se inyectan vía createElement + textContent.
//         innerHTML solo para chrome estático (sin datos del usuario).
//   R8  — Textos de UI con data-i18n (fallback ES embebido).
//   R-CROSS-01 — Bus namespace AIP: Skeleton:Uploader:*

// ─── [SEC-01] Importaciones y dependencias ────────────────────────────────────

import { ReactiveElement } from '../03-interface/base/reactive-element.js';

// ─── [SEC-02] Constantes — estilos y catálogos ───────────────────────────────

const TIPOS = [
    ['TRANS', 'TRANS — Transcripción de conversación'],
    ['CONV',  'CONV — Conversación de chat (export)'],
    ['DOC',   'DOC — Documento de trabajo'],
    ['NOTE',  'NOTE — Nota / apunte'],
    ['AUDIO', 'AUDIO — Audio / grabación'],
    ['OTROS', 'OTROS — otro tipo'],
];

const DESTINOS = [
    ['__grp', 'Proyectos activos'],
    ['GLOBIZMARKT', 'GLOBIZMARKT · Proyecto Globizmarkt'],
    ['AIP',         'AIP · AIP v1.2.1'],
    ['DEMIURGO',    'DEMIURGO · Cerebro Orquestador'],
    ['CPII',        'CPII · CPII CRM'],
    ['__grp', 'Agentes externos (GEM)'],
    ['GEM-LEX',    'GEM-LEX · Agente jurídico LEX'],
    ['GEM-ESTUDO', 'GEM-ESTUDO · Agente de estudios'],
    ['GEM-BP',     'GEM-BP · Business Plan Osterwalder'],
    ['__grp', 'General'],
    ['BH',    'BH · BreederHub general'],
    ['OTROS', 'OTROS — otro destino'],
];

const _CSS = `
<style>
/* [SEC-02] aip-uploader — tokens internos sobre paleta CRM */
aip-uploader { display:block; font-family: var(--crm-font-sans, 'Inter', system-ui, sans-serif); }
.upl {
    display:flex; flex-direction:column; width:100%; max-width:680px; margin:0 auto;
    background: var(--crm-surface, #0a0f1e);
    border: 1px solid var(--crm-border, rgba(255,255,255,0.08));
    border-radius: 12px; overflow:hidden; max-height:90vh;
}
.upl__topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 20px; flex-shrink:0;
    background: var(--crm-surface-raised, rgba(255,255,255,0.04));
    border-bottom:1px solid var(--crm-border, rgba(255,255,255,0.08));
}
.upl__title { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color: var(--crm-gold, #c9a84c); }
.upl__close {
    background:none; border:none; color: var(--crm-text-secondary, rgba(255,255,255,0.5));
    font-size:16px; cursor:pointer; line-height:1; padding:4px 8px;
}
.upl__close:hover { color: var(--crm-gold, #c9a84c); }
.upl__scroll { overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:18px; }

/* steps */
.upl__steps { display:flex; align-items:center; gap:8px; justify-content:center; }
.upl__step { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; max-width:120px; }
.upl__dot {
    width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:11px; border:1px solid var(--crm-border, rgba(255,255,255,0.2)); color: var(--crm-text-secondary, rgba(255,255,255,0.5));
}
.upl__step.active .upl__dot { border-color: var(--crm-gold, #c9a84c); color: var(--crm-gold, #c9a84c); }
.upl__step.done .upl__dot { border-color:#34d399; background:#34d399; color:#000; }
.upl__step-lbl { font-size:9px; letter-spacing:0.05em; color: var(--crm-text-secondary, rgba(255,255,255,0.5)); text-transform:uppercase; }
.upl__line { flex:1; height:1px; background: var(--crm-border, rgba(255,255,255,0.12)); }

/* dropzone */
.upl__drop {
    border:1.5px dashed var(--crm-border, rgba(255,255,255,0.2)); border-radius:8px;
    padding:32px 20px; text-align:center; cursor:pointer; position:relative; transition:border-color .2s, background .2s;
}
.upl__drop:hover, .upl__drop.over { border-color: var(--crm-gold, #c9a84c); background: var(--crm-accent-muted, rgba(201,168,76,0.06)); }
.upl__drop input[type=file] { position:absolute; inset:0; opacity:0; cursor:pointer; }
.upl__drop-ic { font-size:28px; margin-bottom:8px; }
.upl__drop-txt { font-size:13px; color: var(--crm-text-secondary, rgba(255,255,255,0.6)); line-height:1.5; }
.upl__drop-txt strong { color: var(--crm-text, #e8eaf0); }
.upl__drop-hint { font-size:10px; color: var(--crm-text-secondary, rgba(255,255,255,0.4)); margin-top:6px; }

/* file chips */
.upl__files { display:flex; flex-direction:column; gap:8px; }
.upl__chip {
    display:flex; align-items:center; gap:10px; padding:10px 12px;
    background: var(--crm-surface-raised, rgba(255,255,255,0.04));
    border:1px solid var(--crm-border, rgba(255,255,255,0.08)); border-radius:8px;
}
.upl__chip-ic { font-size:16px; flex-shrink:0; }
.upl__chip-name { font-size:12px; font-weight:600; flex:1; word-break:break-all; color: var(--crm-text, #e8eaf0); }
.upl__chip-size { font-size:10px; color: var(--crm-text-secondary, rgba(255,255,255,0.5)); flex-shrink:0; }
.upl__badge { font-size:9px; font-weight:600; letter-spacing:0.05em; padding:3px 8px; border-radius:4px; flex-shrink:0; }
.b-convert { background:rgba(52,211,153,0.15); color:#34d399; }
.b-qwen { background:rgba(251,191,36,0.15); color:#fbbf24; }
.b-native { background:rgba(79,142,247,0.15); color:#4f8ef7; }

/* form */
.upl__form { display:flex; flex-direction:column; gap:16px; }
.upl__row { display:flex; gap:12px; }
.upl__field { display:flex; flex-direction:column; gap:5px; flex:1; }
.upl__field label { font-size:10px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color: var(--crm-text-secondary, rgba(255,255,255,0.5)); }
.upl__field label span { color: var(--crm-gold, #c9a84c); margin-left:3px; }
.upl select, .upl input[type=text], .upl textarea {
    background: var(--crm-surface-raised, rgba(255,255,255,0.04));
    border:1px solid var(--crm-border, rgba(255,255,255,0.1)); border-radius:6px;
    color: var(--crm-text, #e8eaf0); font-family:inherit; font-size:12px; padding:9px 12px; width:100%;
}
.upl select:focus, .upl input:focus, .upl textarea:focus { outline:none; border-color: var(--crm-gold, #c9a84c); }
.upl textarea { resize:vertical; min-height:64px; line-height:1.5; }
.upl__otros { display:none; }
.upl__otros.visible { display:block; }
.upl__hint { font-size:9px; color: var(--crm-text-secondary, rgba(255,255,255,0.4)); }

/* preview */
.upl__preview { display:none; flex-direction:column; gap:8px; padding:14px; background: var(--crm-surface-raised, rgba(255,255,255,0.03)); border:1px solid var(--crm-border, rgba(255,255,255,0.08)); border-radius:8px; }
.upl__preview.visible { display:flex; }
.upl__preview-lbl { font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color: var(--crm-gold, #c9a84c); }
.upl__folder { font-family:'JetBrains Mono', monospace; font-size:12px; color: var(--crm-text, #e8eaf0); word-break:break-all; }
.upl__metafac { font-family:'JetBrains Mono', monospace; font-size:10px; line-height:1.6; white-space:pre-wrap; word-break:break-all; color: var(--crm-text-secondary, rgba(255,255,255,0.6)); }
.upl__metafac .k { color: var(--crm-gold, #c9a84c); }
.upl__metafac .s { color: var(--crm-text-secondary, rgba(255,255,255,0.35)); }

/* actions */
.upl__actions { display:flex; gap:8px; justify-content:flex-end; flex-shrink:0; }
.upl__btn {
    background: var(--crm-surface-raised, rgba(255,255,255,0.06));
    border:1px solid var(--crm-border, rgba(255,255,255,0.1)); border-radius:6px;
    color: var(--crm-text, #fff); cursor:pointer; font-size:11px; font-weight:600; letter-spacing:0.04em;
    padding:9px 16px; text-transform:uppercase;
}
.upl__btn:hover:not(:disabled) { border-color: var(--crm-gold, #c9a84c); color: var(--crm-gold, #c9a84c); }
.upl__btn:disabled { opacity:0.4; cursor:not-allowed; }
.upl__btn--primary { background: var(--crm-gold, #c9a84c); border-color: var(--crm-gold, #c9a84c); color:#000; }
.upl__btn--primary:hover:not(:disabled) { opacity:0.85; color:#000; }

/* result */
.upl__result { display:flex; flex-direction:column; align-items:center; gap:14px; padding:24px; text-align:center; }
.upl__result-ic { font-size:36px; }
.upl__result-title { font-size:15px; font-weight:700; color: var(--crm-text, #e8eaf0); }
.upl__result-folder { font-family:monospace; font-size:11px; color: var(--crm-gold, #c9a84c); word-break:break-all; padding:10px; background: var(--crm-surface-raised, rgba(255,255,255,0.04)); border-radius:6px; width:100%; box-sizing:border-box; }
.upl__result-sub { font-size:12px; color: var(--crm-text-secondary, rgba(255,255,255,0.6)); line-height:1.5; }

/* locked (KYC gate) */
.upl__locked { display:flex; flex-direction:column; align-items:center; gap:16px; padding:36px 28px; text-align:center; }
.upl__locked-ic { font-size:40px; }
.upl__locked-title { font-size:16px; font-weight:700; color: var(--crm-text, #e8eaf0); }
.upl__locked-body { font-size:13px; color: var(--crm-text-secondary, rgba(255,255,255,0.6)); line-height:1.6; max-width:440px; }
.upl__locked-body strong { color: var(--crm-gold, #c9a84c); }
.upl__hidden { display:none !important; }
</style>
`;

// ─── [SEC-03] Helpers puros ──────────────────────────────────────────────────

function toKebab(str) {
    return String(str ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
        .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}
function formatSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
}
function isoNow() { return new Date().toISOString().slice(0, 10); }
function detectFileType(ext) {
    if (['txt', 'md'].includes(ext)) return 'convert';
    if (['json', 'csv', 'yaml', 'yml'].includes(ext)) return 'convert';
    if (['pdf', 'docx', 'doc', 'pptx'].includes(ext)) return 'qwen';
    return 'native';
}
function fileIcon(ext) {
    const m = { pdf:'📕', docx:'📘', doc:'📘', txt:'📄', md:'📝', json:'📋',
                csv:'📊', mp3:'🎵', mp4:'🎬', jpg:'🖼', jpeg:'🖼', png:'🖼', zip:'📦' };
    return m[ext] || '📄';
}
function badgeForType(t) {
    if (t === 'convert') return { text: '→ MD automático',  cls: 'b-convert' };
    if (t === 'qwen')    return { text: '→ Qwen requerido',  cls: 'b-qwen' };
    return                      { text: 'empaqueta directo', cls: 'b-native' };
}

// ─── [SEC-04] Clase AipUploader ──────────────────────────────────────────────

class AipUploader extends ReactiveElement {

    // [SEC-04a] Campos privados + lifecycle
    #files = [];          // [{ file, fileType, fileText }]
    #zipBlob = null;
    #folderName = null;

    connectedCallback() {
        super.connectedCallback?.();
    }
    disconnectedCallback() { super.disconnectedCallback?.(); }
    stateChanged(_s) {}   // no reacciona al store

    // [SEC-04b] _open — punto de entrada con gate KYC ─────────────────────────
    _open({ kycOk } = {}) {
        if (kycOk) { this._renderWizard(); this._wire(); }
        else       { this._renderLocked(); this._wireLocked(); }
        this._emit('Skeleton:Uploader:Opened', { kycOk: !!kycOk });
    }

    // [SEC-04c] _renderLocked — KYC requerido ─────────────────────────────────
    _renderLocked() {
        this.innerHTML = _CSS + `
        <div class="upl">
            <div class="upl__topbar">
                <span class="upl__title" data-i18n="uploader.title">Uploader · Ingesta</span>
                <button class="upl__close" data-upl-action="Close" aria-label="Cerrar">✕</button>
            </div>
            <div class="upl__locked">
                <div class="upl__locked-ic">🔒</div>
                <div class="upl__locked-title" data-i18n="uploader.locked.title">Verificación KYC requerida</div>
                <div class="upl__locked-body" data-i18n="uploader.locked.body">
                    El <strong>Uploader de Ingesta</strong> permite cargar documentos, transcripciones
                    y archivos al sistema AIP de forma ordenada: tú los nombras y clasificas, la
                    herramienta les inyecta su trazabilidad y los empaqueta para subirlos al
                    repositorio central.<br><br>
                    Para garantizar la custodia y trazabilidad de la información, esta función está
                    disponible solo para usuarios que han <strong>completado el proceso KYC</strong>.
                    Completa tu verificación para desbloquearla.
                </div>
            </div>
        </div>`;
    }

    // [SEC-04d] _renderWizard — shell estático del wizard ─────────────────────
    _renderWizard() {
        const tiposHtml = TIPOS.map(([v, l]) =>
            `<option value="${v}">${l}</option>`).join('');

        // Construcción de <optgroup>/<option> a partir de marcadores '__grp'
        let destHtml = '', grpOpen = false;
        for (const [v, l] of DESTINOS) {
            if (v === '__grp') {
                if (grpOpen) destHtml += '</optgroup>';
                destHtml += `<optgroup label="${l}">`;
                grpOpen = true;
            } else {
                destHtml += `<option value="${v}">${l}</option>`;
            }
        }
        if (grpOpen) destHtml += '</optgroup>';

        this.innerHTML = _CSS + `
        <div class="upl">
            <div class="upl__topbar">
                <span class="upl__title" data-i18n="uploader.title">Uploader · Ingesta</span>
                <button class="upl__close" data-upl-action="Close" aria-label="Cerrar">✕</button>
            </div>
            <div class="upl__scroll">

                <div class="upl__steps">
                    <div class="upl__step active" data-step="1"><div class="upl__dot">1</div><div class="upl__step-lbl">Archivos</div></div>
                    <div class="upl__line"></div>
                    <div class="upl__step" data-step="2"><div class="upl__dot">2</div><div class="upl__step-lbl">Clasificar</div></div>
                    <div class="upl__line"></div>
                    <div class="upl__step" data-step="3"><div class="upl__dot">3</div><div class="upl__step-lbl">Descargar</div></div>
                </div>

                <!-- PANE: upload -->
                <div data-pane="upload">
                    <div class="upl__drop" data-upl-drop>
                        <input type="file" multiple data-upl-input>
                        <div class="upl__drop-ic">📂</div>
                        <div class="upl__drop-txt"><strong>Arrastra uno o más archivos</strong><br>o haz clic para seleccionarlos</div>
                        <div class="upl__drop-hint">Cualquier tipo · .txt/.md → MD automático · .pdf/.docx/.jpg → empaquetado directo</div>
                    </div>
                </div>

                <!-- PANE: form -->
                <div data-pane="form" class="upl__hidden">
                    <div class="upl__files" data-upl-filelist></div>
                    <div class="upl__form">
                        <div class="upl__row">
                            <div class="upl__field">
                                <label>Tipo <span>*</span></label>
                                <select data-upl-tipo><option value="">— selecciona —</option>${tiposHtml}</select>
                                <input type="text" class="upl__otros" data-upl-tipo-otros placeholder="Describe el tipo…">
                            </div>
                            <div class="upl__field">
                                <label>Destino <span>*</span></label>
                                <select data-upl-destino><option value="">— selecciona —</option>${destHtml}</select>
                                <input type="text" class="upl__otros" data-upl-destino-otros placeholder="Especifica el destino…">
                            </div>
                        </div>
                        <div class="upl__field">
                            <label>Descripción breve <span>*</span></label>
                            <input type="text" data-upl-desc maxlength="80" placeholder="ej: reunion-crm-orbit4 · contrato-modelo-spv">
                            <span class="upl__hint">Se convierte a kebab-case automáticamente. Sin acentos ni espacios.</span>
                        </div>
                        <div class="upl__field">
                            <label>Brief / contexto (opcional)</label>
                            <textarea data-upl-brief placeholder="¿De qué va? ¿Qué debe hacer AIP con esto?"></textarea>
                        </div>
                    </div>

                    <div class="upl__preview" data-upl-preview>
                        <span class="upl__preview-lbl">Carpeta destino</span>
                        <span class="upl__folder" data-upl-folder>—</span>
                        <span class="upl__preview-lbl">Cabecera METAFAC</span>
                        <span class="upl__metafac" data-upl-metafac></span>
                    </div>

                    <div class="upl__actions">
                        <button class="upl__btn" data-upl-action="Reset">← Cambiar</button>
                        <button class="upl__btn upl__btn--primary" data-upl-action="Generate" disabled>↓ Generar ZIP</button>
                    </div>
                </div>

                <!-- PANE: result -->
                <div data-pane="result" class="upl__hidden">
                    <div class="upl__result">
                        <div class="upl__result-ic" data-upl-result-ic>✅</div>
                        <div class="upl__result-title" data-upl-result-title>ZIP generado</div>
                        <div class="upl__result-folder" data-upl-result-folder>—</div>
                        <div class="upl__result-sub" data-upl-result-sub>—</div>
                        <div class="upl__actions">
                            <button class="upl__btn" data-upl-action="New">+ Nuevo lote</button>
                            <button class="upl__btn upl__btn--primary" data-upl-action="Download">↓ Descargar ZIP</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
    }

    // helpers de acceso DOM
    _q(sel) { return this.querySelector(sel); }
    _pane(name) { return this.querySelector(`[data-pane="${name}"]`); }
    _showPane(name) {
        ['upload', 'form', 'result'].forEach(p =>
            this._pane(p)?.classList.toggle('upl__hidden', p !== name));
    }
    _setStep(n) {
        this.querySelectorAll('.upl__step').forEach(el => {
            const i = Number(el.dataset.step);
            el.classList.toggle('active', i === n);
            el.classList.toggle('done', i < n);
            const dot = el.querySelector('.upl__dot');
            if (dot) dot.textContent = i < n ? '✓' : String(i);
        });
    }

    _getTipo() {
        const sel = this._q('[data-upl-tipo]');
        return sel?.value === 'OTROS'
            ? (this._q('[data-upl-tipo-otros]')?.value.trim() || 'OTROS')
            : (sel?.value || '');
    }
    _getDestino() {
        const sel = this._q('[data-upl-destino]');
        if (sel?.value === 'OTROS') {
            const raw = this._q('[data-upl-destino-otros]')?.value.trim();
            return raw ? toKebab(raw) : 'OTROS';
        }
        return sel?.value || '';
    }
    _buildFolderName() {
        const t = this._getTipo(), d = this._getDestino(), desc = toKebab(this._q('[data-upl-desc]')?.value);
        if (!t || !d || !desc) return null;
        return `${t}--${d}--${desc}`;
    }

    // [SEC-04e] _wire — event delegation interna ──────────────────────────────
    _wireLocked() {
        this.addEventListener('click', (e) => {
            if (e.target.closest('[data-upl-action="Close"]'))
                this._emit('Skeleton:Uploader:Cancelled', {});
        });
    }

    _wire() {
        // clicks
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-upl-action]');
            if (!btn) return;
            switch (btn.dataset.uplAction) {
                case 'Close':    this._emit('Skeleton:Uploader:Cancelled', {}); break;
                case 'Reset':    this._reset(false); break;
                case 'New':      this._reset(true); break;
                case 'Generate': this._generateZip(); break;
                case 'Download': this._downloadZip(); break;
            }
        });
        // drag & drop
        const dz = this._q('[data-upl-drop]');
        dz?.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('over'); });
        dz?.addEventListener('dragleave', () => dz.classList.remove('over'));
        dz?.addEventListener('drop', e => {
            e.preventDefault(); dz.classList.remove('over');
            if (e.dataTransfer.files.length) this._handleFiles(e.dataTransfer.files);
        });
        this._q('[data-upl-input]')?.addEventListener('change', e => {
            if (e.target.files.length) this._handleFiles(e.target.files);
        });
        // form live preview
        ['[data-upl-tipo]', '[data-upl-destino]'].forEach(sel => {
            this._q(sel)?.addEventListener('change', () => {
                const isOtros = this._q(sel)?.value === 'OTROS';
                const otros = this._q(sel + '-otros');
                if (otros) otros.classList.toggle('visible', isOtros);
                this._updatePreview();
            });
        });
        ['[data-upl-desc]', '[data-upl-tipo-otros]', '[data-upl-destino-otros]', '[data-upl-brief]']
            .forEach(sel => this._q(sel)?.addEventListener('input', () => this._updatePreview()));
    }

    // [SEC-04f] handleFiles / renderFileList ──────────────────────────────────
    async _handleFiles(fileList) {
        const arr = Array.from(fileList);
        if (!arr.length) return;
        this.#files = await Promise.all(arr.map(async file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const fileType = detectFileType(ext);
            const fileText = fileType === 'convert' ? await file.text() : null;
            return { file, fileType, fileText };
        }));
        this._renderFileList();
        this._setStep(2);
        this._showPane('form');
        this._updatePreview();
    }

    // R32: chips construidos con createElement + textContent (datos del usuario)
    _renderFileList() {
        const list = this._q('[data-upl-filelist]');
        if (!list) return;
        list.replaceChildren();
        this.#files.forEach(({ file, fileType }) => {
            const ext = file.name.split('.').pop().toLowerCase();
            const badge = badgeForType(fileType);
            const chip = document.createElement('div'); chip.className = 'upl__chip';
            const ic = document.createElement('span'); ic.className = 'upl__chip-ic'; ic.textContent = fileIcon(ext);
            const nm = document.createElement('span'); nm.className = 'upl__chip-name'; nm.textContent = file.name;
            const sz = document.createElement('span'); sz.className = 'upl__chip-size'; sz.textContent = formatSize(file.size);
            const bd = document.createElement('span'); bd.className = 'upl__badge ' + badge.cls; bd.textContent = badge.text;
            chip.append(ic, nm, sz, bd);
            list.appendChild(chip);
        });
    }

    // [SEC-04g] updatePreview / METAFAC ───────────────────────────────────────
    _updatePreview() {
        const folder = this._buildFolderName();
        const ready = folder !== null && this.#files.length > 0;
        const genBtn = this._q('[data-upl-action="Generate"]');
        if (genBtn) genBtn.disabled = !ready;
        const prev = this._q('[data-upl-preview]');
        if (!ready) { prev?.classList.remove('visible'); return; }

        const count = this.#files.length;
        const first = this.#files[0];
        const baseName = first.file.name.replace(/\.[^.]+$/, '');
        const filename = first.fileType === 'convert' ? toKebab(baseName) + '.md' : first.file.name;

        // R32: folder + metafac vía textContent
        this._q('[data-upl-folder]').textContent = `${folder}/  (${count} archivo${count > 1 ? 's' : ''})`;
        this._renderMetafac(folder, filename);
        prev?.classList.add('visible');
    }

    _renderMetafac(folder, filename) {
        const t = this._getTipo(), d = this._getDestino(), desc = this._q('[data-upl-desc]')?.value.trim() || '';
        const rows = [
            ['s', '---'],
            ['k', 'METAFAC_VER', '0.6.0'],
            ['k', 'GEO_LOC', `03_INBOX/00_BRIDGE/${folder}/${filename}`],
            ['k', 'TYPE', `${t} — ${desc}`],
            ['k', 'DESTINO', d],
            ['k', 'STATUS', 'BRIDGE — pendiente validación'],
            ['k', 'TIMESTAMP', isoNow()],
            ['k', 'PRODUCED_BY', 'Uploader AIP v1.0.0'],
            ['s', '---'],
        ];
        const box = this._q('[data-upl-metafac]');
        box.replaceChildren();
        rows.forEach(r => {
            if (r[0] === 's') {
                const s = document.createElement('span'); s.className = 's'; s.textContent = r[1];
                box.append(s, document.createTextNode('\n'));
            } else {
                const k = document.createElement('span'); k.className = 'k'; k.textContent = r[1] + ': ';
                box.append(k, document.createTextNode(r[2] + '\n'));
            }
        });
    }

    _buildMetafac(folder, filename) {
        const t = this._getTipo(), d = this._getDestino(), desc = this._q('[data-upl-desc]')?.value.trim() || '';
        return [
            '---',
            'METAFAC_VER: 0.6.0',
            `GEO_LOC: 03_INBOX/00_BRIDGE/${folder}/${filename}`,
            `TYPE: ${t} — ${desc}`,
            `DESTINO: ${d}`,
            'STATUS: BRIDGE — pendiente validación',
            `TIMESTAMP: ${isoNow()}`,
            'PRODUCED_BY: Uploader AIP v1.0.0 · Bridge pre-ingesta',
            '---', '',
        ].join('\n');
    }

    // [SEC-04h] generateZip / downloadZip ─────────────────────────────────────
    async _generateZip() {
        const JSZip = globalThis.JSZip;
        if (!JSZip) {
            console.error('[Uploader] window.JSZip no disponible — vendor/jszip.min.js no cargado.');
            alert('Error: librería de empaquetado no cargada. Recarga la página.');
            return;
        }
        const folder = this._buildFolderName();
        const zip = new JSZip();
        const dir = zip.folder(folder);
        let anyQwen = false;

        for (const { file, fileType, fileText } of this.#files) {
            const baseName = file.name.replace(/\.[^.]+$/, '');
            if (fileType === 'qwen') anyQwen = true;
            const targetName = fileType === 'convert' ? toKebab(baseName) + '.md' : file.name;
            const metafac = this._buildMetafac(folder, targetName);
            if (fileType === 'convert') dir.file(targetName, metafac + (fileText || ''));
            else                        dir.file(file.name, file);
        }

        // 00_BRIEF.md
        const lines = [
            `# BRIEF — ${folder}`, '',
            `**Archivos en este lote:** ${this.#files.length}`,
            `**Tipo:** ${this._getTipo()}`,
            `**Destino:** ${this._getDestino()}`,
            `**Fecha ingesta:** ${isoNow()}`, '',
        ];
        if (anyQwen) {
            lines.push('## ⚠️ PENDIENTE-CONVERSION-QWEN', '',
                'Uno o más archivos requieren conversión a MD vía Qwen Doc-to-MD.', '');
        }
        lines.push('## Archivos', '');
        this.#files.forEach(({ file, fileType }) =>
            lines.push(`- \`${file.name}\` — ${badgeForType(fileType).text}`));
        const brief = this._q('[data-upl-brief]')?.value.trim();
        if (brief) lines.push('', '## Contexto del admin', '', brief);
        lines.push('', '---', '*Generado por Uploader AIP v1.0.0 · BreederHub*');
        dir.file('00_BRIEF.md', lines.join('\n'));

        this.#zipBlob = await zip.generateAsync({ type: 'blob' });
        this.#folderName = folder;

        const count = this.#files.length;
        this._q('[data-upl-result-ic]').textContent = anyQwen ? '🟡' : '✅';
        this._q('[data-upl-result-title]').textContent = anyQwen
            ? 'ZIP generado — requiere Qwen' : 'ZIP generado — listo para Drive';
        this._q('[data-upl-result-folder]').textContent = `${folder}.zip`;
        this._q('[data-upl-result-sub]').textContent = anyQwen
            ? `${count} archivo${count > 1 ? 's' : ''} empaquetado${count > 1 ? 's' : ''}. Uno o más requieren Qwen. Sube el ZIP al Bridge de Drive.`
            : `${count} archivo${count > 1 ? 's' : ''} con METAFAC. Sube al Bridge de Drive.`;

        this._setStep(3);
        this._showPane('result');
        this._emit('Skeleton:Uploader:ZipGenerated', { folder, count, anyQwen });
    }

    _downloadZip() {
        if (!this.#zipBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(this.#zipBlob);
        a.download = `${this.#folderName}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // reset: keepClassify preserva TIPO+DESTINO para lotes al mismo destino
    _reset(keepClassify) {
        const saved = keepClassify ? {
            tipo: this._q('[data-upl-tipo]')?.value,
            tipoOtros: this._q('[data-upl-tipo-otros]')?.value,
            destino: this._q('[data-upl-destino]')?.value,
            destinoOtros: this._q('[data-upl-destino-otros]')?.value,
        } : null;

        this.#files = []; this.#zipBlob = null; this.#folderName = null;
        const input = this._q('[data-upl-input]'); if (input) input.value = '';
        this._q('[data-upl-filelist]')?.replaceChildren();
        ['[data-upl-tipo]', '[data-upl-tipo-otros]', '[data-upl-destino]', '[data-upl-destino-otros]', '[data-upl-desc]', '[data-upl-brief]']
            .forEach(s => { const el = this._q(s); if (el) el.value = ''; });
        this._q('[data-upl-tipo-otros]')?.classList.remove('visible');
        this._q('[data-upl-destino-otros]')?.classList.remove('visible');
        this._q('[data-upl-preview]')?.classList.remove('visible');
        const genBtn = this._q('[data-upl-action="Generate"]'); if (genBtn) genBtn.disabled = true;

        if (saved) {
            this._q('[data-upl-tipo]').value = saved.tipo || '';
            this._q('[data-upl-tipo-otros]').value = saved.tipoOtros || '';
            this._q('[data-upl-destino]').value = saved.destino || '';
            this._q('[data-upl-destino-otros]').value = saved.destinoOtros || '';
            this._q('[data-upl-tipo-otros]')?.classList.toggle('visible', saved.tipo === 'OTROS');
            this._q('[data-upl-destino-otros]')?.classList.toggle('visible', saved.destino === 'OTROS');
        }

        this._setStep(1);
        this._showPane('upload');
    }

    // [SEC-04i] _emit ─────────────────────────────────────────────────────────
    _emit(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { detail: Object.freeze(detail), bubbles: true }));
        console.log(`[Uploader] → ${name}`, detail);
    }
}

// ─── [SEC-05] Registro customElements ────────────────────────────────────────

if (!customElements.get('aip-uploader')) {
    customElements.define('aip-uploader', AipUploader);
}

export { AipUploader };
