import { LUCY_FLOW_NODES } from './lucyFlowGraph.js';

const AUTH_ITEMS = [
    { title: 'Teléfono', description: 'Celular de prueba' },
    { title: 'Cédula', description: 'Identificación' },
    { title: 'Nombre', description: 'Datos personales' },
];

const ASSIST_ITEMS = [
    { title: 'Ubicación', description: 'Lugar del servicio' },
    { title: 'Dirección', description: 'Referencia' },
    { title: 'Confirmación', description: 'Registro' },
];

const EDOCTOR_ITEMS = [
    { title: 'Correo', description: 'Contacto' },
    { title: 'Pago', description: 'Plan' },
    { title: 'Listo', description: 'Activación' },
];

function assistStepIndex(nodeId) {
    if (nodeId.startsWith('asist_loc_')) return 0;
    if (nodeId.startsWith('asist_dir_')) return 1;
    if (nodeId.startsWith('asist_done_')) return 2;
    return -1;
}

function wizardStepper(nodeId) {
    const match = nodeId.match(/^wiz_(.+)_(\d+)$/);
    if (!match) return null;

    const slug = match[1];
    const current = Number.parseInt(match[2], 10);
    const keys = Object.keys(LUCY_FLOW_NODES)
        .filter((k) => k.startsWith(`wiz_${slug}_`))
        .sort((a, b) => {
            const ai = Number.parseInt(a.split('_').pop(), 10);
            const bi = Number.parseInt(b.split('_').pop(), 10);
            return ai - bi;
        });

    if (!keys.length) return null;

    const items = keys.map((_, i) => ({
        title: `Paso ${i + 1}`,
        description: 'Información',
    }));

    return {
        visible: true,
        currentIndex: Math.min(current, items.length - 1),
        items,
    };
}

const OMX_MED_ITEMS = [
    { title: 'Inicio', description: 'Asistencias' },
    { title: 'Especialidad', description: 'Médico' },
    { title: 'Ubicación', description: 'Establecimiento' },
    { title: 'Fecha y hora', description: 'Agenda' },
    { title: 'Confirmación', description: 'Registro' },
];

const OMX_MED_ITEMS_DIRECT = [
    { title: 'Inicio', description: 'Asistencias' },
    { title: 'Especialidad', description: 'Médico' },
    { title: 'Ubicación', description: 'GPS' },
    { title: 'Fecha y hora', description: 'Agenda' },
    { title: 'Confirmación', description: 'Registro' },
];

function omniaxMedicoStepIndex(nodeId, state) {
    if (!nodeId.startsWith('omx_med_')) return -1;
    const omx = state?.context?.omniax;
    const direct = omx?.agenda_completa === false;

    if (direct) {
        if (nodeId === 'omx_med_start' || nodeId === 'omx_med_who' || nodeId === 'omx_med_benef_form') return 0;
        if (
            nodeId.includes('especialidad')
            || nodeId === 'omx_med_aplica_load'
            || nodeId === 'omx_med_sin_asignacion'
        ) {
            return 1;
        }
        if (nodeId === 'omx_med_done') return 4;
        if (nodeId.includes('fecha') || nodeId.includes('hora') || nodeId === 'omx_med_verificar_disponibilidad_load') {
            return 3;
        }
        if (
            nodeId.includes('location') ||
            nodeId === 'omx_med_crear_load' ||
            nodeId === 'omx_med_location_skip_load'
        ) {
            return 2;
        }
        if (nodeId.startsWith('omx_med_')) return 1;
        return -1;
    }

    if (nodeId === 'omx_med_start' || nodeId === 'omx_med_who' || nodeId === 'omx_med_benef_form') return 0;
    if (
        nodeId.includes('especialidad')
        || nodeId === 'omx_med_aplica_load'
        || nodeId === 'omx_med_sin_asignacion'
    ) {
        return 1;
    }
    if (
        nodeId.includes('donde') ||
        nodeId.includes('location') ||
        nodeId.includes('est_') ||
        nodeId.includes('ciudad') ||
        nodeId.includes('zona')
    ) {
        return 2;
    }
    if (nodeId.includes('fecha') || nodeId.includes('hora')) return 3;
    if (nodeId === 'omx_med_done' || nodeId === 'omx_med_crear_load') return 4;
    if (nodeId.startsWith('omx_med_')) return 1;
    return -1;
}

function omniaxDentalStepIndex(nodeId, state) {
    if (!nodeId.startsWith('omx_den_')) return -1;
    const omx = state?.context?.omniax;
    const direct = omx?.agenda_completa === false;

    if (direct) {
        if (nodeId === 'omx_den_start' || nodeId === 'omx_den_who' || nodeId === 'omx_den_benef_form') return 0;
        if (nodeId === 'omx_den_aplica_load') return 1;
        if (nodeId === 'omx_den_done') return 4;
        if (nodeId.includes('fecha') || nodeId.includes('hora') || nodeId === 'omx_den_verificar_disponibilidad_load') {
            return 3;
        }
        if (nodeId.includes('location') || nodeId.includes('crear') || nodeId.includes('reagendar')) return 2;
        return 1;
    }

    if (nodeId === 'omx_den_start' || nodeId === 'omx_den_who' || nodeId === 'omx_den_benef_form') return 0;
    if (nodeId === 'omx_den_aplica_load' || nodeId === 'omx_den_sin_asignacion') return 1;
    if (nodeId.includes('donde') || nodeId.includes('location') || nodeId.includes('est_') || nodeId.includes('ciudad') || nodeId.includes('zona')) {
        return 2;
    }
    if (nodeId.includes('fecha') || nodeId.includes('hora')) return 3;
    if (nodeId === 'omx_den_done' || nodeId.includes('crear') || nodeId.includes('reagendar')) return 4;
    return 1;
}

export function getFlowStepper(state) {
    const nodeId = state.nodeId;

    const denIdx = omniaxDentalStepIndex(nodeId, state);
    if (denIdx >= 0) {
        const direct = state.context?.omniax?.agenda_completa === false;
        return {
            visible: true,
            currentIndex: denIdx,
            items: direct ? OMX_MED_ITEMS_DIRECT : OMX_MED_ITEMS,
        };
    }

    const omxIdx = omniaxMedicoStepIndex(nodeId, state);
    if (omxIdx >= 0) {
        const direct = state.context?.omniax?.agenda_completa === false;
        return {
            visible: true,
            currentIndex: omxIdx,
            items: direct ? OMX_MED_ITEMS_DIRECT : OMX_MED_ITEMS,
        };
    }

    if (nodeId === 'auth_telefono' || nodeId === 'auth_cedula' || nodeId === 'auth_nombre') {
        const indexMap = { auth_telefono: 0, auth_cedula: 1, auth_nombre: 2 };
        return {
            visible: true,
            currentIndex: indexMap[nodeId] ?? 0,
            items: AUTH_ITEMS,
        };
    }

    const assistIdx = assistStepIndex(nodeId);
    if (assistIdx >= 0) {
        return {
            visible: true,
            currentIndex: assistIdx,
            items: ASSIST_ITEMS,
        };
    }

    if (nodeId === 'edoctor_registro' || nodeId === 'edoctor_pago' || nodeId === 'edoctor_confirm') {
        const map = { edoctor_registro: 0, edoctor_pago: 1, edoctor_confirm: 2 };
        return {
            visible: true,
            currentIndex: map[nodeId],
            items: EDOCTOR_ITEMS,
        };
    }

    const wiz = wizardStepper(nodeId);
    if (wiz) return wiz;

    return { visible: false, currentIndex: 0, items: [] };
}

export function isAuthFlowStep(nodeId) {
    return nodeId === 'auth_telefono' || nodeId === 'auth_cedula' || nodeId === 'auth_nombre';
}
