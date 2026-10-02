import { LUCY_FLOW_NODES } from './lucyFlowGraph.js';



const AUTH_ITEMS = [

    { title: 'Celular' },

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



const OMX_REAG_ITEMS = [

    { title: 'Citas', description: 'En proceso' },

    { title: 'Fecha', description: 'Disponibilidad' },

    { title: 'Hora', description: 'Horario' },

    { title: 'Confirmación', description: 'Reagendar' },

];



function isOmxAgendaPaso(nodeId) {

    return (

        nodeId.includes('_dias_load')

        || nodeId.includes('_franja_load')

        || nodeId.includes('_horas_load')

        || nodeId.includes('_verificar_disponibilidad')

        || nodeId.includes('_sin_fechas')

        || nodeId.includes('_fecha_hora')

    );

}



function isOmxUbicacionPaso(nodeId) {

    return (

        nodeId.includes('_donde')

        || nodeId.includes('_location')

        || nodeId.includes('_est_')

        || nodeId.includes('_ciudad')

        || nodeId.includes('_zona')

        || nodeId.includes('_share_location')

    );

}



function isOmxInicioPaso(nodeId) {

    return (

        nodeId.includes('_elegibilidad')

        || nodeId.includes('_cabina')

        || nodeId.endsWith('_who')

        || nodeId.endsWith('_benef_form')

        || nodeId.endsWith('_start')

        || (nodeId.includes('_reag_') && !nodeId.includes('_reagendar_load'))

    );

}



function omniaxMedicoReagendarStepIndex(nodeId) {

    if (nodeId.includes('_reag_pick') || nodeId.includes('_reag_list')) return 0;

    if (nodeId.includes('_dias_load')) return 1;

    if (nodeId.includes('_franja_load') || nodeId.includes('_horas_load')) return 2;

    if (

        nodeId.includes('_reagendar_load')

        || nodeId.includes('_verificar_disponibilidad_load')

        || nodeId === 'omx_med_done'

    ) {

        return 3;

    }

    return -1;

}



function omniaxMedicoStepIndex(nodeId, state) {

    if (!nodeId.startsWith('omx_med_')) return -1;

    const omx = state?.context?.omniax;

    if (omx?.reagendar || nodeId.includes('_reag_')) {

        return omniaxMedicoReagendarStepIndex(nodeId);

    }

    const direct = omx?.agenda_completa === false;



    if (nodeId === 'omx_med_done' || nodeId === 'omx_med_crear_load') return 4;

    if (isOmxAgendaPaso(nodeId)) return 3;

    if (isOmxUbicacionPaso(nodeId)) return 2;

    if (

        nodeId.includes('especialidad')

        || nodeId === 'omx_med_aplica_load'

        || nodeId === 'omx_med_sin_asignacion'

    ) {

        return 1;

    }

    if (isOmxInicioPaso(nodeId) || nodeId === 'omx_med_en_proceso') return 0;



    if (direct) {

        if (nodeId === 'omx_med_location_skip_load') return 2;

        return 0;

    }



    return 0;

}



function omniaxDentalStepIndex(nodeId, state) {

    if (!nodeId.startsWith('omx_den_')) return -1;

    const omx = state?.context?.omniax;

    if (omx?.reagendar || nodeId.includes('_reag_')) {

        const idx = omniaxMedicoReagendarStepIndex(nodeId.replace('omx_den_', 'omx_med_'));

        return idx;

    }

    const direct = omx?.agenda_completa === false;



    if (nodeId === 'omx_den_done' || nodeId.includes('_crear_load')) return 4;

    if (isOmxAgendaPaso(nodeId)) return 3;

    if (isOmxUbicacionPaso(nodeId)) return 2;

    if (nodeId === 'omx_den_aplica_load' || nodeId === 'omx_den_sin_asignacion') return 1;

    if (isOmxInicioPaso(nodeId)) return 0;



    if (direct) return 2;

    return 0;

}



export function getFlowStepper(state) {

    const nodeId = state.nodeId;



    const denIdx = omniaxDentalStepIndex(nodeId, state);

    if (denIdx >= 0) {

        const omx = state.context?.omniax;

        const reag = omx?.reagendar || nodeId.includes('_reag_');

        const direct = omx?.agenda_completa === false;

        return {

            visible: true,

            currentIndex: denIdx,

            items: reag ? OMX_REAG_ITEMS : direct ? OMX_MED_ITEMS_DIRECT : OMX_MED_ITEMS,

        };

    }



    const omxIdx = omniaxMedicoStepIndex(nodeId, state);

    if (omxIdx >= 0) {

        const omx = state.context?.omniax;

        const reag = omx?.reagendar || nodeId.includes('_reag_');

        const direct = omx?.agenda_completa === false;

        return {

            visible: true,

            currentIndex: omxIdx,

            items: reag ? OMX_REAG_ITEMS : direct ? OMX_MED_ITEMS_DIRECT : OMX_MED_ITEMS,

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



/** Stepper + tarjetas tipo auth (Fase 2) en flujo agendar/reagendar médico/dental (Fase 3). */

export function isOmniaxCitaWizardChrome(state) {

    const nodeId = state?.nodeId ?? '';

    if (!nodeId.startsWith('omx_med_') && !nodeId.startsWith('omx_den_')) {

        return false;

    }

    return getFlowStepper(state).visible;

}



export function isFlowWizardChrome(state) {

    return isAuthFlowStep(state?.nodeId) || isOmniaxCitaWizardChrome(state);

}


