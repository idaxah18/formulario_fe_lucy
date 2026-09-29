import { slugify } from './flowHelpers.js';

/** Nodo de entrada GEA (placa en vial, ubicación en hogar) — `crearAsistenciaChain`. */
function geaServiceEntry(jelouRef, serviceLabel) {
    const base = slugify(`${jelouRef}_${serviceLabel}`);
    const vial = jelouRef === '2.4 Vial';
    return vial ? `asist_placa_${base}` : `asist_loc_${base}`;
}

/**
 * Intención desde WhatsApp/Jelou → nodo destino tras auth (o botón en hub de asistencias activas).
 * @type {Record<string, { targetNode: string, continueLabel: string }>}
 */
const INTENT_REGISTRY = {
    solucion_24_7: { targetNode: 'menu_solucion_24_7', continueLabel: 'Solución 24/7' },
    medico: { targetNode: 'menu_medico', continueLabel: 'Médico' },
    medico_agendar: { targetNode: 'omx_med_elegibilidad_load', continueLabel: 'cita médica' },
    medico_reagendar: { targetNode: 'omx_med_reag_cabina_preface', continueLabel: 'reagendar cita médica' },
    dental: { targetNode: 'menu_dental', continueLabel: 'Dental' },
    dental_agendar: { targetNode: 'omx_den_elegibilidad_load', continueLabel: 'cita dental' },
    dental_reagendar: { targetNode: 'omx_den_reag_cabina_preface', continueLabel: 'reagendar cita dental' },
    hogar: { targetNode: 'menu_hogar', continueLabel: 'Hogar' },
    vial: { targetNode: 'menu_vial', continueLabel: 'Vial' },
    grua: { targetNode: geaServiceEntry('2.4 Vial', 'Grúa (otro motivo)'), continueLabel: 'Grúas' },
    aseguradora: { targetNode: 'menu_aseguradora', continueLabel: 'Vial aseguradora' },
    agendar_cita: { targetNode: 'agendar_cita_tipo', continueLabel: 'agendar cita' },
};

/** Sinónimos que Jelou/NLU pueden enviar en `?intent=`. */
const INTENT_ALIASES = {
    gruas: 'grua',
    grúa: 'grua',
    tow: 'grua',
    doctor: 'medico',
    medica: 'medico',
    medicina: 'medico',
    dentista: 'dental',
    agendar_medico: 'medico_agendar',
    cita_medica: 'medico_agendar',
    agendar_dental: 'dental_agendar',
    cita_dental: 'dental_agendar',
    reagendar_medico: 'medico_reagendar',
    reagendar_dental: 'dental_reagendar',
    plan_asistencias: 'solucion_24_7',
    asistencias: 'solucion_24_7',
};

function normalizeIntentSlug(raw) {
    const key = String(raw || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
    if (!key) return null;
    return INTENT_ALIASES[key] || key;
}

export function getIntentFromUrl(search = window.location.search) {
    const q = new URLSearchParams(search);
    const raw = q.get('intent') || '';
    const slug = normalizeIntentSlug(raw);
    if (!slug) return null;
    const config = INTENT_REGISTRY[slug];
    if (!config) return null;
    return { slug, ...config };
}

export function resolveWebviewIntent(context) {
    const slug = context?.webviewIntent;
    if (!slug) return null;
    const normalized = normalizeIntentSlug(slug);
    const config = INTENT_REGISTRY[normalized];
    if (!config) return null;
    return { slug: normalized, ...config };
}

export function applyWebviewIntentToContext(context) {
    const q = new URLSearchParams(window.location.search);
    let intent = getIntentFromUrl();
    if (!intent && q.get('flow') === 'aseguradora') {
        intent = { slug: 'aseguradora', ...INTENT_REGISTRY.aseguradora };
    }
    if (!intent) return;
    context.webviewIntent = intent.slug;
}

export function getPostAuthIntentTargetNode(context) {
    const intent = resolveWebviewIntent(context);
    return intent?.targetNode || null;
}

/** Acción inferior del hub «asistencias en curso». */
export function buildAsistenciasHubExitAction(context) {
    const intent = resolveWebviewIntent(context);
    if (intent) {
        return {
            id: 'intent_continue',
            label: `Continuar con ${intent.continueLabel}`,
            next: intent.targetNode,
            icon: 'arrow-right',
            menuTone: 'tone-blue',
        };
    }
    return {
        id: 'home',
        label: 'Menú principal',
        next: 'menu_solucion_24_7',
        icon: 'home',
        menuTone: 'tone-blue',
    };
}

/** Catálogo para documentación / Jelou (slug → etiqueta). */
export function listWebviewIntentSlugs() {
    return Object.entries(INTENT_REGISTRY).map(([slug, cfg]) => ({
        slug,
        continueLabel: cfg.continueLabel,
        targetNode: cfg.targetNode,
    }));
}
