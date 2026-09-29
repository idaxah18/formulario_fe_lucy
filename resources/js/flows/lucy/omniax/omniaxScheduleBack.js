import { getFlowStepper } from '../flowStepper.js';

const MED_UBICACION_SUB = {
    omx_med_zonas_load: 'omx_med_ciudades_load',
    omx_med_ciudades_load: 'omx_med_donde',
    omx_med_est_zona_load: 'omx_med_zonas_load',
    omx_med_est_gps_load: 'omx_med_share_location',
    omx_med_share_location: 'omx_med_donde',
};

const DEN_UBICACION_SUB = {
    omx_den_zonas_load: 'omx_den_ciudades_load',
    omx_den_ciudades_load: 'omx_den_donde',
    omx_den_est_zona_load: 'omx_den_zonas_load',
    omx_den_est_gps_load: 'omx_den_share_location',
    omx_den_share_location: 'omx_den_donde',
};

function prefixFor(nodeId) {
    if (nodeId.startsWith('omx_den_')) return 'omx_den';
    if (nodeId.startsWith('omx_med_')) return 'omx_med';
    return null;
}

function isReagendarFlow(nodeId, omx) {
    if (omx?.reagendar) return true;
    return nodeId.includes('_reag_');
}

function resolveReagendarBack(nodeId, omx) {
    const p = prefixFor(nodeId);
    if (!p) return null;

    if (nodeId === `${p}_reag_pick`) return `${p}_reag_start`;
    if (nodeId === `${p}_fecha_hora` && omx?.reagendar) {
        return nodeId.includes('_den_') ? 'omx_den_reag_pick' : 'omx_med_reag_pick';
    }
    if (nodeId === `${p}_reag_list_load`) return `${p}_reag_start`;
    if (
        nodeId === `${p}_reag_start`
        || nodeId === `${p}_reag_cabina`
        || nodeId === `${p}_reag_cabina_preface`
    ) {
        return p === 'omx_den' ? 'menu_dental' : 'menu_medico';
    }
    if (nodeId === `${p}_benef_form` && omx?.reagendar) return `${p}_reag_start`;
    return null;
}

function resolveFechaSubBack(nodeId, omx) {
    if (nodeId === 'omx_med_horas_load') return 'omx_med_dias_load';
    if (nodeId === 'omx_den_horas_load') return 'omx_den_dias_load';

    if (nodeId === 'omx_med_dias_load') {
        if (omx?.id_zona) return 'omx_med_est_zona_load';
        if (omx?.latitud || omx?.longitud) return 'omx_med_est_gps_load';
        return 'omx_med_donde';
    }
    if (nodeId === 'omx_den_dias_load') {
        if (omx?.id_zona) return 'omx_den_est_zona_load';
        if (omx?.latitud || omx?.longitud) return 'omx_den_est_gps_load';
        return 'omx_den_donde';
    }
    return null;
}

function canonicalOmniaxStepNode(state, stepIndex) {
    const nodeId = state.nodeId;
    const p = prefixFor(nodeId);
    if (!p || stepIndex < 0) return null;

    const omx = state.context?.omniax || {};
    const direct = omx.agenda_completa === false;
    const dental = p === 'omx_den';

    if (stepIndex === 0) {
        if (nodeId === `${p}_benef_form`) return `${p}_who`;
        if (omx.para_beneficiario && omx.identificacion_beneficiario) {
            return `${p}_benef_form`;
        }
        return `${p}_who`;
    }

    if (dental) {
        if (stepIndex === 1) return `${p}_who`;
        if (stepIndex === 2) return `${p}_donde`;
        if (stepIndex === 3) return direct ? `${p}_fecha_hora` : `${p}_dias_load`;
        if (stepIndex === 4) return `${p}_verificar_disponibilidad_load`;
        return null;
    }

    // médico agendar
    if (stepIndex === 1) return 'omx_med_especialidades_load';
    if (stepIndex === 2) return 'omx_med_donde';
    if (stepIndex === 3) return direct ? 'omx_med_fecha_hora' : 'omx_med_dias_load';
    if (stepIndex === 4) return 'omx_med_verificar_disponibilidad_load';
    return null;
}

function resolveIntraStepBack(nodeId, omx) {
    if (MED_UBICACION_SUB[nodeId] || DEN_UBICACION_SUB[nodeId]) {
        return MED_UBICACION_SUB[nodeId] || DEN_UBICACION_SUB[nodeId];
    }
    const fechaSub = resolveFechaSubBack(nodeId, omx);
    if (fechaSub) return fechaSub;

    const p = prefixFor(nodeId);
    if (!p) return null;

    if (nodeId === `${p}_benef_form`) return `${p}_who`;
    if (nodeId === 'omx_med_sin_cobertura' || nodeId === 'omx_den_sin_cobertura') {
        return p === 'omx_den' ? 'menu_dental' : 'menu_medico';
    }
    if (nodeId === 'omx_med_sin_asignacion') return 'omx_med_especialidades_load';
    if (nodeId === 'omx_den_sin_asignacion') return `${p}_who`;
    if (nodeId === 'omx_med_aplica_load') return 'omx_med_especialidades_load';

    if (nodeId === 'omx_med_verificar_disponibilidad_load' || nodeId === 'omx_den_verificar_disponibilidad_load') {
        const direct = omx?.agenda_completa === false;
        return direct ? `${p}_fecha_hora` : `${p}_horas_load`;
    }
    if (nodeId === 'omx_med_crear_load' || nodeId === 'omx_den_crear_load') {
        return `${p}_verificar_disponibilidad_load`;
    }
    if (nodeId === 'omx_med_location_skip_load') return 'omx_med_especialidades_load';
    if (nodeId === 'omx_den_location_skip_load') return 'omx_den_who';

    return null;
}

/**
 * Nodo destino al pulsar Atrás en flujos Omniax de agendar/reagendar cita.
 * @returns {string|null}
 */
export function resolveOmniaxScheduleBackTarget(state) {
    const nodeId = state?.nodeId;
    if (!nodeId?.startsWith('omx_')) return null;

    if (
        nodeId.endsWith('_done')
        || nodeId.endsWith('_asesor_done')
        || nodeId === 'omx_med_error'
        || nodeId === 'omx_den_error'
    ) {
        return null;
    }

    const omx = state.context?.omniax || {};

    if (isReagendarFlow(nodeId, omx)) {
        const reag = resolveReagendarBack(nodeId, omx);
        if (reag) return reag;
    }

    const intra = resolveIntraStepBack(nodeId, omx);
    if (intra) return intra;

    const stepper = getFlowStepper(state);
    if (!stepper.visible) return null;

    const idx = stepper.currentIndex;
    if (idx <= 0) {
        return nodeId.startsWith('omx_den_') ? 'menu_dental' : 'menu_medico';
    }

    return canonicalOmniaxStepNode(state, idx - 1);
}

export function isOmniaxScheduleFlow(nodeId) {
    return Boolean(nodeId?.startsWith('omx_med_') || nodeId?.startsWith('omx_den_'));
}

export function canOmniaxScheduleBack(state) {
    if (!isOmniaxScheduleFlow(state?.nodeId)) return false;
    return resolveOmniaxScheduleBackTarget(state) != null;
}
