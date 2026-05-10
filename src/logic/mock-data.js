/**
 * AIP v1.2 — BÓVEDA DE DATOS SIMULADOS (MOCK)
 * DOCTRINA R27 (Inmutabilidad) / FASE 15.3
 * PRODUCED BY: GEM Antigravity (Core Architect)
 */

window.MOCK_PROJECTS = [
  {
    // Expediente 1 — Activo en Due Diligence
    id_expediente: "AIP-2026-001",
    nombre_activo: "Rotterdam Port Logistics Hub",
    estado_proceso: "Due Diligence",
    nivel_kyc_requerido: "Nivel 1 - Basic",
    fecha_apertura: "2026-04-15",
    ultima_actividad: "2026-05-05",
    
    // Datos visibles sin KYC completo (acceso público restringido)
    datos_publicos: {
      pais: "Países Bajos",
      ticket_minimo: "€50,000",
      roi_estimado: "8.4% - 10.2%",
      duracion_proyectada: "48 meses",
      clase_activo: "Logística Industrial"
    },
    
    // Datos protegidos por KYC (solo visibles tras superar nivel requerido)
    datos_kyc_protegidos: {
      rendimiento_actual: "9.1%",
      ocupacion_asset: "94%",
      socios_operadores: "Rotterdam Port Authority, Van der Wel Logistics",
      estructura_legal: "STAK (Stichting Administratiekantoor)",
      folleto_informativo: "https://storage.aip.ai/expedientes/AIP-2026-001/prospectus.pdf"
    },
    
    // Documentación por pasos — feedback secuencial
    documentos_secuenciales: [
      {
        paso: 1,
        nombre: "Acuerdo de Confidencialidad (NDA)",
        estado: "liberado",
        fecha_completado: "2026-04-20",
        url_mock: "/docs/nda/AIP-2026-001-NDA.pdf",
        feedback_requerido: "Aceptación de términos fiduciarios"
      },
      {
        paso: 2,
        nombre: "Ficha Técnica del Proyecto",
        estado: "liberado",
        fecha_completado: "2026-04-28",
        url_mock: "/docs/tech_sheet/AIP-2026-001-TS.pdf",
        feedback_requerido: "Confirmación de idoneidad de inversión"
      },
      {
        paso: 3,
        nombre: "Contrato de Adhesión STAK",
        estado: "bloqueado",
        fecha_completado: null,
        url_mock: null,
        feedback_requerido: "Firma digital + verificación de identidad",
        desbloqueo_condicion: "KYC Nivel 1 completado"
      }
    ],
    
    // Historial de feedbacks del cliente (simulado)
    feedbacks: [
      {
        paso: 1,
        timestamp: "2026-04-20T14:32:00Z",
        tipo: "aceptacion_legal",
        valor: "NDA aceptado"
      },
      {
        paso: 2,
        timestamp: "2026-04-28T09:15:00Z",
        tipo: "conformidad_inversor",
        valor: "Perfil de riesgo compatible"
      }
    ]
  },
  
  {
    // Expediente 2 — Pendiente de firma
    id_expediente: "AIP-2026-042",
    nombre_activo: "Amsterdam Green Bond 2026",
    estado_proceso: "Firma Pendiente",
    nivel_kyc_requerido: "Nivel 2 - Full",
    fecha_apertura: "2026-05-01",
    ultima_actividad: "2026-05-06",
    
    datos_publicos: {
      pais: "Países Bajos",
      ticket_minimo: "€100,000",
      roi_estimado: "5.8% - 6.5%",
      duracion_proyectada: "60 meses",
      clase_activo: "Deuda Verde / ESG"
    },
    
    datos_kyc_protegidos: {
      rendimiento_actual: "6.2% (proyectado)",
      calificacion_crediticia: "BBB+ (S&P equivalente)",
      emisor: "Municipio de Amsterdam + AIP Structured Finance",
      prospecto_base: "https://storage.aip.ai/expedientes/AIP-2026-042/base-prospectus.pdf"
    },
    
    documentos_secuenciales: [
      {
        paso: 1,
        nombre: "Term Sheet",
        estado: "liberado",
        fecha_completado: "2026-05-02",
        url_mock: "/docs/term_sheet/AIP-2026-042-TS.pdf",
        feedback_requerido: "Aceptación de términos comerciales"
      },
      {
        paso: 2,
        nombre: "Due Diligence Pack",
        estado: "liberado",
        fecha_completado: "2026-05-04",
        url_mock: "/docs/dd_pack/AIP-2026-042-DD.pdf",
        feedback_requerido: "Validación de información financiera"
      },
      {
        paso: 3,
        nombre: "Contrato de Suscripción",
        estado: "bloqueado",
        fecha_completado: null,
        url_mock: null,
        feedback_requerido: "Firma electrónica cualificada + KYC Full",
        desbloqueo_condicion: "KYC Nivel 2 completado + aprobación Compliance"
      }
    ],
    
    feedbacks: [
      {
        paso: 1,
        timestamp: "2026-05-02T11:20:00Z",
        tipo: "aceptacion_term_sheet",
        valor: "Términos aceptados con reserva sobre cláusula 7.2"
      },
      {
        paso: 2,
        timestamp: "2026-05-04T16:45:00Z",
        tipo: "conformidad_dd",
        valor: "Due diligence revisado sin objeciones"
      }
    ]
  },
  
  {
    // Expediente 3 — Cerrado / Finalizado
    id_expediente: "AIP-2025-189",
    nombre_activo: "The Hague Residential Yield Fund I",
    estado_proceso: "Cerrado",
    nivel_kyc_requerido: "Nivel 1 - Basic",
    fecha_apertura: "2025-09-10",
    ultima_actividad: "2026-03-15",
    
    datos_publicos: {
      pais: "Países Bajos",
      ticket_minimo: "€25,000",
      roi_estimado: "7.2% (realizado)",
      duracion_proyectada: "36 meses",
      clase_activo: "Residencial / Renta"
    },
    
    datos_kyc_protegidos: {
      rendimiento_real: "7.4%",
      exit_valuation: "€42.5M",
      informe_final: "https://storage.aip.ai/expedientes/AIP-2025-189/final_report.pdf"
    },
    
    documentos_secuenciales: [
      {
        paso: 1,
        nombre: "NDA + Term Sheet",
        estado: "liberado",
        fecha_completado: "2025-09-15",
        url_mock: "/docs/nda_ts/AIP-2025-189-NDA_TS.pdf",
        feedback_requerido: "Aceptación de condiciones"
      },
      {
        paso: 2,
        nombre: "Contrato de Inversión",
        estado: "liberado",
        fecha_completado: "2025-10-01",
        url_mock: "/docs/contract/AIP-2025-189-CONTRACT.pdf",
        feedback_requerido: "Firma + desembolso"
      },
      {
        paso: 3,
        nombre: "Informe de Cierre",
        estado: "liberado",
        fecha_completado: "2026-03-15",
        url_mock: "/docs/close_report/AIP-2025-189-CLOSE.pdf",
        feedback_requerido: "Evaluación post-inversión"
      }
    ],
    
    feedbacks: [
      {
        paso: 1,
        timestamp: "2025-09-15T10:05:00Z",
        tipo: "aceptacion_legal",
        valor: "Términos aceptados"
      },
      {
        paso: 2,
        timestamp: "2025-10-01T14:30:00Z",
        tipo: "ejecucion_contrato",
        valor: "Contrato firmado, desembolso confirmado"
      },
      {
        paso: 3,
        timestamp: "2026-03-15T12:00:00Z",
        tipo: "evaluacion_final",
        valor: "Cliente satisfecho, ROI supera expectativas"
      }
    ]
  },
  
  {
    // Expediente 4 — Simulación de expediente en espera (feedback requerido)
    id_expediente: "AIP-2026-057",
    nombre_activo: "Utrecht Life Sciences Campus",
    estado_proceso: "Feedback Pendiente",
    nivel_kyc_requerido: "Nivel 2 - Full",
    fecha_apertura: "2026-05-03",
    ultima_actividad: "2026-05-06",
    
    datos_publicos: {
      pais: "Países Bajos",
      ticket_minimo: "€75,000",
      roi_estimado: "9.5% - 11.0%",
      duracion_proyectada: "60 meses",
      clase_activo: "Infraestructura Científica"
    },
    
    datos_kyc_protegidos: {
      rendimiento_actual: "N/A (pre-lanzamiento)",
      anchor_tenant: "Universidad de Utrecht + Instituto Hubrecht",
      estructura_fiscal: "CBI exención fiscal para inversores institucionales"
    },
    
    documentos_secuenciales: [
      {
        paso: 1,
        nombre: "Memoria del Proyecto",
        estado: "liberado",
        fecha_completado: "2026-05-03",
        url_mock: "/docs/memoria/AIP-2026-057-MEM.pdf",
        feedback_requerido: "Confirmación de interés vinculante"
      },
      {
        paso: 2,
        nombre: "Ficha de Suscripción",
        estado: "bloqueado",
        fecha_completado: null,
        url_mock: null,
        feedback_requerido: "Completar formulario de idoneidad",
        desbloqueo_condicion: "Feedback paso 1 recibido"
      },
      {
        paso: 3,
        nombre: "Documentación Legal Completa",
        estado: "bloqueado",
        fecha_completado: null,
        url_mock: null,
        feedback_requerido: "KYC Nivel 2 + Compliance",
        desbloqueo_condicion: "KYC Full + aprobación legal"
      }
    ],
    
    feedbacks: [
      {
        paso: 1,
        timestamp: "2026-05-03T16:20:00Z",
        tipo: "interes_proyecto",
        valor: "Pendiente de respuesta del cliente"
      }
    ]
  }
];

// Metadata del mock para control de validación
window.MOCK_METADATA = {
  version: "1.0.0",
  fase: "15.3",
  timestamp: "2026-05-06",
  total_expedientes: 4,
  estados_posibles: ["Due Diligence", "Firma Pendiente", "Cerrado", "Feedback Pendiente"],
  niveles_kyc: ["Nivel 1 - Basic", "Nivel 2 - Full"],
  simular_delay_ms: 300  // Para pruebas de UX
};

// Utilidades mock para simular feedback secuencial
window.MOCK_FUNCTIONS = {
  // Solicitar desbloqueo de documento
  requestUnlock: function(expedienteId, pasoNumero) {
    console.log(`[MOCK] Solicitud de desbloqueo: ${expedienteId} - Paso ${pasoNumero}`);
    // Simula validación de Compliance
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          mensaje: "Solicitud recibida. Compliance evaluará en 24-48h.",
          ticket_seguimiento: `REQ-${Date.now()}`
        });
      }, window.MOCK_METADATA.simular_delay_ms);
    });
  },
  
  // Registrar feedback del cliente
  submitFeedback: function(expedienteId, pasoNumero, feedbackData) {
    console.log(`[MOCK] Feedback recibido: ${expedienteId} - Paso ${pasoNumero}`, feedbackData);
    return {
      success: true,
      expediente_id: expedienteId,
      paso: pasoNumero,
      timestamp: new Date().toISOString(),
      numero_expediente_actualizado: expedienteId  // Mismo número, pero confirma trazabilidad
    };
  },
  
  // Obtener número de expediente formateado
  getNumeroExpediente: function(expedienteId) {
    return expedienteId; // Ya viene con formato AIP-YYYY-NNN
  }
};

// Congelar objetos para inmutabilidad (R27)
Object.freeze(window.MOCK_PROJECTS);
Object.freeze(window.MOCK_METADATA);
Object.freeze(window.MOCK_FUNCTIONS);
