/**
 * ArchetypeDetector.js
 * Versión 1.0.0
 * 
 * Motor determinístico de detección de arquetipos.
 * Basado en opciones discretas (sin NLP, sin ML).
 */

const APP_PREFIX = window.APP_PREFIX || 'AIP_LANDING_V0_';
const STORAGE_KEY_ARCHETYPE = `${APP_PREFIX}archetype`;
const STORAGE_KEY_TIMESTAMP = `${APP_PREFIX}archetype_timestamp`;
const STORAGE_KEY_RESPONSES = `${APP_PREFIX}archetype_responses`;

const SIGNALS_REQUIRED = 2;

const QUESTION_BANK = {
  "_metadata": {
    "version": "1.0.0",
    "last_updated": "2026-05-08",
    "total_questions": 4,
    "total_tiebreakers": 3,
    "languages": ["en", "es", "fr", "pt"],
    "detection_method": "deterministic",
    "signals_required": 2
  },
  "questions": [
    {
      "id": "q1_decision_structure",
      "type": "primary",
      "required": false,
      "display_order": 1,
      "text": {
        "en": "How would you describe your investment decision structure?",
        "es": "¿Cómo describiría su estructura de decisión de inversión?",
        "fr": "Comment décririez-vous votre structure de décision d'investissement ?",
        "pt": "Como descreveria a sua estrutura de decisão de investimento?"
      },
      "options": [
        {
          "id": "opt_solo",
          "text": {
            "en": "I make decisions alone, without intermediaries or committees",
            "es": "Las decisiones las tomo yo solo, sin intermediarios ni comités",
            "fr": "Je prends les décisions seul, sans intermédiaires ni comités",
            "pt": "Eu tomo as decisões sozinho, sem intermediários ou comités"
          },
          "signal": "UHNWI",
          "value": 2
        },
        {
          "id": "opt_comite",
          "text": {
            "en": "Decisions involve a committee or require beneficiary review",
            "es": "Las decisiones involucran a un comité o requieren revisión de beneficiarios",
            "fr": "Les décisions impliquent un comité ou nécessitent l'approbation des bénéficiaires",
            "pt": "As decisões envolvem um comité ou requerem revisão dos beneficiários"
          },
          "signal": "FAMILY_OFFICE",
          "value": 2
        },
        {
          "id": "opt_refiere",
          "text": {
            "en": "I refer investment opportunities to my clients or network",
            "es": "Refiero oportunidades de inversión a mis clientes o red de contactos",
            "fr": "Je réfère des opportunités d'investissement à mes clients ou à mon réseau",
            "pt": "Refiro oportunidades de investimento aos meus clientes ou rede de contactos"
          },
          "signal": "AGENT",
          "value": 2
        },
        {
          "id": "opt_no_sabe",
          "text": {
            "en": "Not sure yet / Prefer not to answer",
            "es": "Aún no lo tengo claro / Prefiero no responder",
            "fr": "Pas encore sûr / Je préfère ne pas répondre",
            "pt": "Ainda não tenho a certeza / Prefiro não responder"
          },
          "signal": null,
          "value": 0
        }
      ]
    }
  ],
  "tiebreakers": [
    {
      "id": "tb1_executor",
      "type": "tiebreaker",
      "trigger": "mixed_uhnwi_fo",
      "condition": "mixed_UHNWI_FO",
      "display_order": 1,
      "text": {
        "en": "In practice, who executes the final investment order?",
        "es": "En la práctica, ¿quién ejecuta la orden final de inversión?",
        "fr": "En pratique, qui exécute l'ordre d'investissement final ?",
        "pt": "Na prática, quem executa a ordem final de investimento?"
      },
      "options": [
        {
          "id": "tb1_opt_yo",
          "text": {
            "en": "I do directly, without additional approval",
            "es": "Yo directamente, sin necesidad de aprobación adicional",
            "fr": "Je le fais directement, sans approbation supplémentaire",
            "pt": "Eu diretamente, sem aprovação adicional"
          },
          "signal": "UHNWI"
        },
        {
          "id": "tb1_opt_comite",
          "text": {
            "en": "Requires signature or approval from a committee or beneficiary",
            "es": "Requiere la firma o aprobación de un comité o beneficiario",
            "fr": "Nécessite la signature ou l'approbation d'un comité ou d'un bénéficiaire",
            "pt": "Requer assinatura ou aprovação de um comité ou beneficiário"
          },
          "signal": "FAMILY_OFFICE"
        }
      ]
    },
    {
      "id": "tb2_activity",
      "type": "tiebreaker",
      "trigger": "mixed_uhnwi_agent",
      "condition": "mixed_UHNWI_AGENT",
      "display_order": 2,
      "text": {
        "en": "Would you say most of your activity is managing your own wealth or advising/referring third parties?",
        "es": "¿Diría que la mayor parte de su actividad es gestionar su propio patrimonio o asesorar/refiere a terceros?",
        "fr": "Diriez-vous que la majeure partie de votre activité consiste à gérer votre propre patrimoine ou à conseiller/référer des tiers ?",
        "pt": "Diria que a maior parte da sua atividade é gerir o seu próprio património ou aconselhar/referir terceiros?"
      },
      "options": [
        {
          "id": "tb2_opt_patrimonio",
          "text": {
            "en": "Mostly my own wealth",
            "es": "Principalmente mi propio patrimonio",
            "fr": "Principalement mon propre patrimoine",
            "pt": "Principalmente o meu próprio património"
          },
          "signal": "UHNWI"
        },
        {
          "id": "tb2_opt_refiere",
          "text": {
            "en": "Mostly I refer or advise clients/third parties",
            "es": "Principalmente refiero o asesoro a clientes/terceros",
            "fr": "Principalement, je réfère ou conseille des clients/tiers",
            "pt": "Principalmente refiro ou aconselho clientes/terceiros"
          },
          "signal": "AGENT"
        },
        {
          "id": "tb2_opt_ambos",
          "text": {
            "en": "Both equally",
            "es": "Ambos por igual",
            "fr": "Les deux également",
            "pt": "Ambos igualmente"
          },
          "signal": null
        }
      ]
    },
    {
      "id": "tb3_fiduciary_obligation",
      "type": "tiebreaker",
      "trigger": "small_fo_vs_uhnwi",
      "condition": "mixed_UHNWI_FO",
      "display_order": 3,
      "text": {
        "en": "Do you have formal fiduciary obligations to other family members or beneficiaries?",
        "es": "¿Tiene obligaciones fiduciarias formales hacia otros miembros de su familia o beneficiarios?",
        "fr": "Avez-vous des obligations fiduciaires formelles envers d'autres membres de votre famille ou bénéficiaires ?",
        "pt": "Tem obrigações fiduciárias formais para com outros membros da família ou beneficiários?"
      },
      "options": [
        {
          "id": "tb3_opt_si",
          "text": {
            "en": "Yes, I am legally accountable to others",
            "es": "Sí, legalmente debo rendir cuentas a otros",
            "fr": "Oui, je suis légalement redevable envers d'autres",
            "pt": "Sim, sou legalmente responsável perante outros"
          },
          "signal": "FAMILY_OFFICE"
        },
        {
          "id": "tb3_opt_no",
          "text": {
            "en": "No, I answer only to myself",
            "es": "No, solo respondo ante mí mismo",
            "fr": "Non, je ne réponds qu'à moi-même",
            "pt": "Não, respondo apenas perante mim mesmo"
          },
          "signal": "UHNWI"
        }
      ]
    }
  ]
};

function detectArchetype(responses) {
  let signals = { UHNWI: 0, FAMILY_OFFICE: 0, AGENT: 0 };
  let tiebreakerApplied = false;

  if (responses.decisionStructure === 'opt_solo') {
    signals.UHNWI += 2;
  } else if (responses.decisionStructure === 'opt_comite') {
    signals.FAMILY_OFFICE += 2;
  } else if (responses.decisionStructure === 'opt_refiere') {
    signals.AGENT += 2;
  }

  let archetype = null;

  if (signals.UHNWI >= SIGNALS_REQUIRED && 
      signals.UHNWI > signals.FAMILY_OFFICE && 
      signals.UHNWI > signals.AGENT) {
    archetype = 'UHNWI';
  } 
  else if (signals.FAMILY_OFFICE >= SIGNALS_REQUIRED && 
           signals.FAMILY_OFFICE > signals.UHNWI && 
           signals.FAMILY_OFFICE > signals.AGENT) {
    archetype = 'FAMILY_OFFICE';
  } 
  else if (signals.AGENT >= SIGNALS_REQUIRED && 
           signals.AGENT > signals.UHNWI && 
           signals.AGENT > signals.FAMILY_OFFICE) {
    archetype = 'AGENT';
  }

  if (!archetype && responses.tiebreaker) {
    tiebreakerApplied = true;

    if (responses.tiebreaker.executor === 'tb1_opt_yo') {
      archetype = 'UHNWI';
    } 
    else if (responses.tiebreaker.executor === 'tb1_opt_comite') {
      archetype = 'FAMILY_OFFICE';
    }
    
    else if (responses.tiebreaker.activity === 'tb2_opt_patrimonio') {
      archetype = 'UHNWI';
    } 
    else if (responses.tiebreaker.activity === 'tb2_opt_refiere') {
      archetype = 'AGENT';
    }
    
    else if (responses.tiebreaker.fiduciaryObligation === 'tb3_opt_no') {
      archetype = 'UHNWI';
    } 
    else if (responses.tiebreaker.fiduciaryObligation === 'tb3_opt_si') {
      archetype = 'FAMILY_OFFICE';
    }
  }

  if (archetype) {
    sessionStorage.setItem(STORAGE_KEY_ARCHETYPE, archetype);
    sessionStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
    sessionStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(responses));
    
    dispatchArchetypeEvent(archetype, tiebreakerApplied);
  } else {
    sessionStorage.removeItem(STORAGE_KEY_ARCHETYPE);
    sessionStorage.removeItem(STORAGE_KEY_TIMESTAMP);
  }

  return { archetype, tiebreakerApplied };
}

function dispatchArchetypeEvent(archetype, tiebreakerApplied) {
  const event = new CustomEvent('Skeleton:ArchetypeDetected', {
    detail: {
      archetype: archetype,
      tiebreakerApplied: tiebreakerApplied,
      detectionMethod: 'deterministic'
    }
  });
  document.dispatchEvent(event);
}

/**
 * Inicializa el cuestionario en la UI (Órbita 2)
 */
function initQuestionnaire() {
  const container = document.getElementById('archetype-questionnaire');
  if (!container) {
    return;
  }

  console.log('[ArchetypeDetector] Inicializando cuestionario UI...');

  // Verificar si hay estado guardado
  const savedState = restoreQuestionnaireState();
  if (savedState) {
    restoreResponsesToUI(savedState);
    detectArchetype(savedState);
  }

  // Configurar listeners
  setupQuestionnaireListeners();
}

/**
 * Configura listeners para detección en tiempo real
 */
function setupQuestionnaireListeners() {
  // Listener para cambios en pregunta base
  const radioButtons = document.querySelectorAll('input[name="decisionStructure"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      const responses = collectResponses();
      detectArchetype(responses);
      
      // Mostrar tiebreaker si hay ambigüedad (opcional)
      const tiebreaker = document.getElementById('tiebreaker-container');
      if (tiebreaker && responses.decisionStructure === 'opt_no_sabe') {
          tiebreaker.classList.remove('hidden');
      }
    });
  });

  // Listeners para preguntas de desempate
  const tiebreakerElements = document.querySelectorAll('.tiebreaker-question');
  tiebreakerElements.forEach(element => {
    element.addEventListener('change', () => {
      const responses = collectResponses();
      detectArchetype(responses);
    });
  });
}

/**
 * Restaura respuestas guardadas en la UI
 */
function restoreResponsesToUI(savedState) {
  if (savedState.decisionStructure) {
    const radio = document.querySelector(`input[name="decisionStructure"][value="${savedState.decisionStructure}"]`);
    if (radio) radio.checked = true;
  }

  if (savedState.tiebreaker) {
    if (savedState.tiebreaker.executor) {
      const radio = document.querySelector(`input[name="tiebreaker_executor"][value="${savedState.tiebreaker.executor}"]`);
      if (radio) radio.checked = true;
    }
    if (savedState.tiebreaker.activity) {
      const radio = document.querySelector(`input[name="tiebreaker_activity"][value="${savedState.tiebreaker.activity}"]`);
      if (radio) radio.checked = true;
    }
    if (savedState.tiebreaker.fiduciaryObligation) {
      const radio = document.querySelector(`input[name="tiebreaker_fiduciary"][value="${savedState.tiebreaker.fiduciaryObligation}"]`);
      if (radio) radio.checked = true;
    }
  }
}

function getQuestionBank() {
  return QUESTION_BANK;
}

function restoreQuestionnaireState() {
  const saved = sessionStorage.getItem(STORAGE_KEY_RESPONSES);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function clearQuestionnaireState() {
  sessionStorage.removeItem(STORAGE_KEY_ARCHETYPE);
  sessionStorage.removeItem(STORAGE_KEY_TIMESTAMP);
  sessionStorage.removeItem(STORAGE_KEY_RESPONSES);
}

function collectResponses() {
  const responses = {};

  const selectedBase = document.querySelector('input[name="decisionStructure"]:checked');
  if (selectedBase) {
    responses.decisionStructure = selectedBase.value;
  }

  const executorSelected = document.querySelector('input[name="tiebreaker_executor"]:checked');
  if (executorSelected) {
    responses.tiebreaker = responses.tiebreaker || {};
    responses.tiebreaker.executor = executorSelected.value;
  }

  const activitySelected = document.querySelector('input[name="tiebreaker_activity"]:checked');
  if (activitySelected) {
    responses.tiebreaker = responses.tiebreaker || {};
    responses.tiebreaker.activity = activitySelected.value;
  }

  const fiduciarySelected = document.querySelector('input[name="tiebreaker_fiduciary"]:checked');
  if (fiduciarySelected) {
    responses.tiebreaker = responses.tiebreaker || {};
    responses.tiebreaker.fiduciaryObligation = fiduciarySelected.value;
  }

  return responses;
}

export {
  detectArchetype,
  initQuestionnaire,
  getQuestionBank,
  restoreQuestionnaireState,
  clearQuestionnaireState,
  collectResponses
};
