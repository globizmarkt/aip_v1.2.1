// ============================================================
// ARCHIVO  : aip-cis-form.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-06
// PROPÓSITO: Web Component — Customer Information Sheet (CIS).
//            Formulario esqueleto MVP para captura de datos de
//            contraparte. Copy genérico — reemplazable en ronda 04.2.3.
// TICKET   : CIS-FORM-01
// ============================================================
// %[CARRIL-AIP-INFRA] - [Fase REBORN-04]
//
// DOCTRINA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R3  (Zero-Hex): Solo variables --crm-* para estilos inline
//   DT-AIP-05 (XSS Zero-Trust): createElement + textContent, nunca innerHTML con datos externos
//
// USO
//   <aip-cis-form mandate-id="MDT_001" mode="edit"></aip-cis-form>
//   mode: edit (editable, default) | view (solo lectura)
//
// NOTA
//   Labels y placeholders son genéricos (MVP). El output D de 04.2.3
//   proporcionará el copy final conforme a la investigación DD (C_cis_dd_research.md).
// ─────────────────────────────────────────────────────────────────────────────

// ÍNDICE
// [SEC-01] Imports
// [SEC-02] Definición de secciones y campos (schema)
// [SEC-03] Clase AipCisForm
//   [SEC-03a] static get observedAttributes()
//   [SEC-03b] connectedCallback()
//   [SEC-03c] _buildShell() → HTMLElement
//   [SEC-03d] _buildSection(sectionDef) → HTMLElement
//   [SEC-03e] _buildField(fieldDef) → HTMLElement
//   [SEC-03f] _buildSelectField(fieldDef) → HTMLElement
//   [SEC-03g] _buildSubmitZone() → HTMLElement
//   [SEC-03h] _applyViewMode()
//   [SEC-03i] _validate() → { valid, errors }
//   [SEC-03j] _showFieldError(fieldKey, message)
//   [SEC-03k] _clearFieldError(fieldKey)
//   [SEC-03l] _clearAllErrors()
//   [SEC-03m] _collectData() → object
//   [SEC-03n] _handleSubmit(e)
// [SEC-04] Registro

// [SEC-01] Imports
import { ReactiveElement } from '../03-interface/base/reactive-element.js';

// [SEC-02] Definición de secciones y campos
// MVP: labels genéricos. Siguiente ronda reemplaza con copy regulatorio.
const CIS_SECTIONS = [
    {
        key: 'identification',
        label: 'IDENTIFICATION',
        fields: [
            { key: 'legal_name', label: 'Legal Name', type: 'text', required: true },
            { key: 'tax_id', label: 'Tax ID', type: 'text', required: true },
            { key: 'lei', label: 'LEI (ISO 17442)', type: 'text', required: false },
            { key: 'incorporation_country', label: 'Country of Incorporation', type: 'text', required: true }
        ]
    },
    {
        key: 'address',
        label: 'REGISTERED ADDRESS',
        fields: [
            { key: 'reg_addr_street', label: 'Street', type: 'text', required: true },
            { key: 'reg_addr_city', label: 'City', type: 'text', required: true },
            { key: 'reg_addr_country', label: 'Country', type: 'text', required: true },
            { key: 'reg_addr_postal', label: 'Postal Code', type: 'text', required: true }
        ]
    },
    {
        key: 'classification',
        label: 'REGULATORY CLASSIFICATION',
        fields: [
            {
                key: 'client_category',
                label: 'MiFID Client Category',
                type: 'select',
                required: true,
                options: [
                    { value: '', text: '— Select —' },
                    { value: 'retail', text: 'Retail' },
                    { value: 'professional', text: 'Professional' },
                    { value: 'ecp', text: 'Eligible Counterparty' }
                ]
            },
            {
                key: 'pep_status',
                label: 'PEP Status',
                type: 'select',
                required: true,
                options: [
                    { value: '', text: '— Select —' },
                    { value: 'yes', text: 'Yes' },
                    { value: 'no', text: 'No' },
                    { value: 'unknown', text: 'Unknown' }
                ]
            },
            {
                key: 'emir_counterparty_type',
                label: 'EMIR Counterparty Type',
                type: 'select',
                required: false,
                options: [
                    { value: '', text: '— Select —' },
                    { value: 'FC', text: 'Financial Counterparty (FC)' },
                    { value: 'NFC', text: 'Non-Financial Counterparty (NFC)' }
                ]
            }
        ]
    },
    {
        key: 'purpose',
        label: 'RELATIONSHIP PURPOSE',
        fields: [
            { key: 'relationship_purpose', label: 'Purpose of Relationship', type: 'text', required: true },
            { key: 'intended_activity', label: 'Intended Activity', type: 'text', required: true }
        ]
    }
];

// [SEC-03] Clase AipCisForm
class AipCisForm extends ReactiveElement {

    // [SEC-03a] Atributos observados
    static get observedAttributes() {
        return ['mandate-id', 'mode'];
    }

    // [SEC-03b] connectedCallback
    connectedCallback() {
        this._mandateId = this.getAttribute('mandate-id') || '';
        this._mode = this.getAttribute('mode') || 'edit';

        if (!this._mandateId) {
            console.warn('[CisForm] mandate-id no proporcionado.');
            return;
        }

        this.appendChild(this._buildShell());

        if (this._mode === 'view') {
            this._applyViewMode();
        }
    }

    // [SEC-03c] _buildShell — contenedor raíz con header + form
    _buildShell() {
        const shell = document.createElement('div');
        shell.className = 'cis-form-shell';
        shell.style.cssText = 'display:flex;flex-direction:column;gap:16px;';

        // ── Header ──
        const header = document.createElement('div');
        header.style.cssText = 'border-bottom:1px solid var(--crm-border);padding-bottom:8px;';

        const title = document.createElement('span');
        title.className = 'label-xs';
        title.style.color = 'var(--crm-accent)';
        title.textContent = 'CUSTOMER INFORMATION SHEET';

        const ref = document.createElement('span');
        ref.className = 'label-sm ghost';
        ref.style.marginLeft = '12px';
        ref.textContent = this._mandateId;

        header.append(title, ref);

        // ── Error container global ──
        const globalError = document.createElement('div');
        globalError.setAttribute('data-cis-global-error', '');
        globalError.style.cssText = 'display:none;';

        // ── Form ──
        const form = document.createElement('form');
        form.setAttribute('data-cis-form', '');
        form.setAttribute('novalidate', '');
        form.style.cssText = 'display:flex;flex-direction:column;gap:20px;';

        // Construir cada sección
        for (let i = 0; i < CIS_SECTIONS.length; i++) {
            form.appendChild(this._buildSection(CIS_SECTIONS[i]));
        }

        // Zona de submit (solo en modo edit)
        if (this._mode === 'edit') {
            form.appendChild(this._buildSubmitZone());
        }

        form.addEventListener('submit', (e) => this._handleSubmit(e));

        shell.append(header, globalError, form);
        return shell;
    }

    // [SEC-03d] _buildSection — grupo de campos con título de sección
    _buildSection(sectionDef) {
        const section = document.createElement('fieldset');
        section.setAttribute('data-section', sectionDef.key);
        section.style.cssText = 'border:1px solid var(--crm-border);padding:16px 20px;display:flex;flex-direction:column;gap:12px;margin:0;';

        // Título de sección
        const legend = document.createElement('legend');
        legend.className = 'label-xs';
        legend.style.cssText = 'color:var(--crm-accent);font-size:10px;letter-spacing:0.15em;text-transform:uppercase;padding:0 8px;';
        legend.textContent = sectionDef.label;
        section.appendChild(legend);

        // Grid de campos
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;';

        for (let i = 0; i < sectionDef.fields.length; i++) {
            grid.appendChild(this._buildField(sectionDef.fields[i]));
        }

        section.appendChild(grid);
        return section;
    }

    // [SEC-03e] _buildField — campo individual (input o select)
    _buildField(fieldDef) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

        // Label
        const label = document.createElement('label');
        label.setAttribute('for', `cis-${fieldDef.key}`);
        label.className = 'label-sm ghost';
        label.style.fontSize = '9px';
        label.textContent = fieldDef.label;

        // Input o Select
        let control;
        if (fieldDef.type === 'select') {
            control = this._buildSelectField(fieldDef);
        } else {
            control = document.createElement('input');
            control.type = fieldDef.type || 'text';
            control.id = `cis-${fieldDef.key}`;
            control.setAttribute('data-cis-field', fieldDef.key);
            if (fieldDef.required) control.setAttribute('required', '');
            control.style.cssText = 'padding:6px 10px;font-size:11px;font-family:inherit;color:var(--crm-text-primary);background:var(--crm-surface);border:1px solid var(--crm-border);outline:none;';
        }

        // Clear error on input
        control.addEventListener('input', () => this._clearFieldError(fieldDef.key));
        control.addEventListener('change', () => this._clearFieldError(fieldDef.key));

        // Error slot
        const errorSlot = document.createElement('span');
        errorSlot.setAttribute('data-cis-error', fieldDef.key);
        errorSlot.style.cssText = 'display:none;font-size:9px;color:var(--crm-error, #FF4757);min-height:0;';

        wrap.append(label, control, errorSlot);
        return wrap;
    }

    // [SEC-03f] _buildSelectField — campo tipo select con opciones
    _buildSelectField(fieldDef) {
        const select = document.createElement('select');
        select.id = `cis-${fieldDef.key}`;
        select.setAttribute('data-cis-field', fieldDef.key);
        if (fieldDef.required) select.setAttribute('required', '');
        select.style.cssText = 'padding:6px 10px;font-size:11px;font-family:inherit;color:var(--crm-text-primary);background:var(--crm-surface);border:1px solid var(--crm-border);outline:none;';

        if (fieldDef.options) {
            for (let i = 0; i < fieldDef.options.length; i++) {
                const opt = document.createElement('option');
                opt.value = fieldDef.options[i].value;
                opt.textContent = fieldDef.options[i].text;
                select.appendChild(opt);
            }
        }

        return select;
    }

    // [SEC-03g] _buildSubmitZone — botón de envío + nota
    _buildSubmitZone() {
        const zone = document.createElement('div');
        zone.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid var(--crm-border);';

        const note = document.createElement('span');
        note.className = 'label-sm ghost';
        note.style.fontSize = '9px';
        note.textContent = 'Fields marked with * are required.';

        const btn = document.createElement('button');
        btn.type = 'submit';
        btn.className = 'btn-inst btn-primary';
        btn.style.cssText = 'padding:8px 24px;font-size:9px;';
        btn.textContent = 'SUBMIT CIS';

        zone.append(note, btn);
        return zone;
    }

    // [SEC-03h] _applyViewMode — convierte todos los campos a solo lectura
    _applyViewMode() {
        const form = this.querySelector('[data-cis-form]');
        if (!form) return;

        const inputs = form.querySelectorAll('input, select');
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].readOnly = true;
            inputs[i].disabled = true;
            inputs[i].style.opacity = '0.7';
        }
    }

    // [SEC-03i] _validate — validación básica de campos requeridos
    _validate() {
        const errors = {};
        let valid = true;

        for (let s = 0; s < CIS_SECTIONS.length; s++) {
            const fields = CIS_SECTIONS[s].fields;
            for (let f = 0; f < fields.length; f++) {
                const field = fields[f];
                if (!field.required) continue;

                const el = this.querySelector(`[data-cis-field="${field.key}"]`);
                if (!el) continue;

                const value = el.value ? el.value.trim() : '';
                if (value.length === 0) {
                    errors[field.key] = `${field.label} is required.`;
                    valid = false;
                }
            }
        }

        return { valid, errors };
    }

    // [SEC-03j] _showFieldError — muestra error inline bajo un campo
    _showFieldError(fieldKey, message) {
        const slot = this.querySelector(`[data-cis-error="${fieldKey}"]`);
        if (!slot) return;
        slot.textContent = '';
        const msg = document.createElement('span');
        msg.textContent = message;
        slot.appendChild(msg);
        slot.style.display = 'block';
    }

    // [SEC-03k] _clearFieldError — oculta error de un campo
    _clearFieldError(fieldKey) {
        const slot = this.querySelector(`[data-cis-error="${fieldKey}"]`);
        if (slot) {
            slot.textContent = '';
            slot.style.display = 'none';
        }
    }

    // [SEC-03l] _clearAllErrors — limpia todos los errores visibles
    _clearAllErrors() {
        const slots = this.querySelectorAll('[data-cis-error]');
        for (let i = 0; i < slots.length; i++) {
            slots[i].textContent = '';
            slots[i].style.display = 'none';
        }
        const global = this.querySelector('[data-cis-global-error]');
        if (global) {
            global.textContent = '';
            global.style.display = 'none';
        }
    }

    // [SEC-03m] _collectData — recoge valores de todos los campos del DOM
    _collectData() {
        const data = {};

        for (let s = 0; s < CIS_SECTIONS.length; s++) {
            const fields = CIS_SECTIONS[s].fields;
            for (let f = 0; f < fields.length; f++) {
                const field = fields[f];
                const el = this.querySelector(`[data-cis-field="${field.key}"]`);
                data[field.key] = el ? (el.value ? el.value.trim() : '') : '';
            }
        }

        return data;
    }

    // [SEC-03n] _handleSubmit — orquesta validación + envío
    _handleSubmit(e) {
        e.preventDefault();
        this._clearAllErrors();

        const { valid, errors } = this._validate();

        if (!valid) {
            // Mostrar errores inline por campo
            const keys = Object.keys(errors);
            for (let i = 0; i < keys.length; i++) {
                this._showFieldError(keys[i], errors[keys[i]]);
            }

            // Error global
            const global = this.querySelector('[data-cis-global-error]');
            if (global) {
                global.textContent = '';
                global.style.cssText = 'display:flex;padding:8px 12px;background:var(--crm-surface);border:1px solid var(--crm-error, #FF4757);color:var(--crm-error, #FF4757);font-size:10px;';
                const msg = document.createElement('span');
                msg.textContent = `Validation failed: ${keys.length} field(s) require attention.`;
                global.appendChild(msg);
            }

            console.warn('[CisForm] Validación fallida:', errors);
            return;
        }

        const cisData = this._collectData();

        console.log(`[CisForm] CIS submitted for mandate ${this._mandateId}.`);

        document.dispatchEvent(new CustomEvent('aip:cis:submitted', {
            bubbles: true,
            detail: {
                mandateId: this._mandateId,
                cisData: cisData
            }
        }));
    }
}

// [SEC-04] Registro
customElements.define('aip-cis-form', AipCisForm);
export { AipCisForm };
export default AipCisForm;