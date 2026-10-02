import { CABINA_REGISTRO_HANDOFF_DONE } from './advisorHandoffCopy.js';
import { advisorHandoffMenuActions, LUCY_HOME_NODE } from './flowHelpers.js';

const EDOCTOR_APP_URL = 'https://bit.ly/app-e-doctor';
const EDOCTOR_WEB_URL = 'https://www.e-doctorgea.com/';

const EXTRA_DOCK_ACTIONS_BY_NODE = {
    edoctor_info_done: [
        {
            id: 'edoctor_app',
            label: 'Abrir app e-doctor',
            type: 'link',
            url: EDOCTOR_APP_URL,
            icon: 'smartphone',
            menuTone: 'tone-asist-medica',
        },
        {
            id: 'edoctor_web',
            label: 'Ir a e-doctor Web',
            type: 'link',
            url: EDOCTOR_WEB_URL,
            icon: 'globe',
            menuTone: 'tone-asist-medica',
        },
    ],
    edoctor_confirm: [
        {
            id: 'edoctor_app',
            label: 'Abrir app e-doctor',
            type: 'link',
            url: EDOCTOR_APP_URL,
            icon: 'smartphone',
            menuTone: 'tone-asist-medica',
        },
        {
            id: 'edoctor_web',
            label: 'Ir a e-doctor Web',
            type: 'link',
            url: EDOCTOR_WEB_URL,
            icon: 'globe',
            menuTone: 'tone-asist-medica',
        },
    ],
};

const RETURN_LABEL_BY_MENU = {
    menu_medico: 'Volver a Médico',
    menu_dental: 'Volver a Dental',
    menu_hogar: 'Volver a Hogar',
    menu_vial: 'Volver a Vial',
    menu_aseguradora: 'Volver a Aseguradora',
    menu_solucion_24_7: 'Volver al menú',
    otras_soluciones: 'Volver al menú',
};

const TIPO_SERVICIO_RETURN_MENU = {
    MEDICO: 'menu_medico',
    DENTAL: 'menu_dental',
    HOGAR: 'menu_hogar',
    VIAL: 'menu_vial',
};

function mapExitActions(returnMenu) {
    const menu = returnMenu || LUCY_HOME_NODE;
    const backLabel = RETURN_LABEL_BY_MENU[menu] || 'Volver';
    return advisorHandoffMenuActions(menu).map((a) => {
        if (a.id === 'back') {
            return { ...a, label: backLabel };
        }
        return a;
    });
}

/**
 * Menú de retorno tras cerrar un flujo (cabina, crear GEA, cita, etc.).
 * @param {object} state
 * @returns {string}
 */
export function resolveFlowExitReturnMenu(state) {
    const nodeId = state?.nodeId || '';
    const gea = state?.context?.gea || {};
    const omx = state?.context?.omniax || {};

    if (nodeId === CABINA_REGISTRO_HANDOFF_DONE) {
        return state.context?.cabinaHandoff?.returnNode || LUCY_HOME_NODE;
    }

    if (gea.exitReturnMenu) return gea.exitReturnMenu;

    if (nodeId === 'edoctor_info_done' || nodeId === 'edoctor_confirm') {
        return 'menu_medico';
    }

    if (nodeId === 'omx_med_done' || nodeId.startsWith('omx_med_')) {
        return 'menu_medico';
    }
    if (nodeId === 'omx_den_done' || nodeId.startsWith('omx_den_')) {
        return 'menu_dental';
    }

    const tipo = String(gea.tipoServicio || omx.tipoServicio || '').toUpperCase();
    if (tipo && TIPO_SERVICIO_RETURN_MENU[tipo]) {
        return TIPO_SERVICIO_RETURN_MENU[tipo];
    }

    return LUCY_HOME_NODE;
}

/** Acciones del dock al terminar un flujo: Volver al submenú + Menú principal. */
export function getFlowExitQuickActions(state) {
    const returnMenu = resolveFlowExitReturnMenu(state);
    const nav = mapExitActions(returnMenu).map((a) => ({
        id: a.id,
        label: a.label,
        next: a.next,
        icon: a.icon,
        menuTone: a.menuTone,
    }));
    const extras = EXTRA_DOCK_ACTIONS_BY_NODE[state?.nodeId] || [];
    return [...extras, ...nav];
}

export function inferGeaExitReturnMenu(tipoServicio) {
    const tipo = String(tipoServicio || '').toUpperCase();
    return TIPO_SERVICIO_RETURN_MENU[tipo] || LUCY_HOME_NODE;
}
