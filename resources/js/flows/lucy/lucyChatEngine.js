import { LUCY_ENTRY_NODE, LUCY_FLOW_NODES } from './lucyFlowGraph.js';

import { bot, user } from './flowHelpers.js';

import {
    applyGeaQuickMeta,
    clearGeaMenu,
    getGeaEnterTask,
    getGeaMenuActions,
    syncGeaFromNode,
} from './gea/geaEngine.js';
import {
    applyOmniaxQuickMeta,
    clearOmniaxMenu,
    getOmniaxEnterTask,
    getOmniaxMenuActions,
    syncOmniaxKind,
} from './omniax/omniaxEngine.js';

function packEnter(enter) {
    return {
        scroll: enter.scroll !== false,
        omniaxEnter: enter.omniaxEnter ?? null,
        geaEnter: enter.geaEnter ?? null,
    };
}



const PLATE_RE = /^(?:[A-Z]{3}\d{3,4}|[A-Z]{2}\d{3}[A-Z])$/i;

const CEDULA_RE = /^\d{10}$/;



export function createLucyChatState(entryNode = LUCY_ENTRY_NODE) {

    return {

        nodeId: entryNode,

        context: {},

        pendingLocationNext: null,

    };

}



function getNode(nodeId) {

    return LUCY_FLOW_NODES[nodeId] || null;

}



export function getComposerPlaceholder(state) {

    const node = getNode(state.nodeId);

    if (state.pendingLocationNext) return 'Usa el botón de ubicación ↑';

    if (node?.input) {

        if (node.input.field === 'plate') return 'Ej: GYE1234';

        if (node.input.field === 'cedula') return '10 dígitos';

        return 'Escribe tu respuesta…';

    }

    return 'Escribe un mensaje o usa los botones';

}



export function isComposerEnabled(state) {

    const node = getNode(state.nodeId);

    if (state.pendingLocationNext) return false;

    return Boolean(node?.input);

}



export function getQuickActions(state) {
    const node = getNode(state.nodeId);
    const dynamicOmx = getOmniaxMenuActions(state);

    if (node?.useOmniaxMenu && dynamicOmx?.length) {
        return dynamicOmx.map((a) => ({
            id: a.id,
            label: a.label,
            type: a.type,
            next: a.next,
            meta: a.meta,
        }));
    }

    const dynamicGea = getGeaMenuActions(state);
    if (node?.useGeaMenu && dynamicGea?.length) {
        return dynamicGea.map((a) => ({
            id: a.id,
            label: a.label,
            type: a.type,
            next: a.next,
            meta: a.meta,
        }));
    }

    if (!node) return [{ id: 'restart', label: 'Reiniciar chat', next: LUCY_ENTRY_NODE }];



    if (state.pendingLocationNext) {

        return [

            {

                id: 'share_location',

                label: '📍 Compartir ubicación',

                type: 'location',

                next: state.pendingLocationNext,

            },

        ];

    }



    const actions = (node.actions || []).map((a) => ({

        id: a.id,

        label: a.label,

        type: a.type,

        next: a.next,

        meta: a.meta,

    }));



    if (actions.length === 0 && !node.input) {

        return [{ id: 'menu', label: 'Menú principal', next: 'menu_principal' }];

    }

    return actions;

}



function enterNode(state, nodeId, messages) {

    const node = getNode(nodeId);

    if (!node) {

        messages.push(bot('No encontramos ese paso del flujo. Volviendo al inicio.'));

        state.nodeId = LUCY_ENTRY_NODE;

        return enterNode(state, LUCY_ENTRY_NODE, messages);

    }

    state.nodeId = nodeId;

    state.pendingLocationNext = null;

    syncOmniaxKind(state, node);
    syncGeaFromNode(state, node);

    if (!node.useOmniaxMenu) {
        clearOmniaxMenu(state.context);
    }
    if (!node.useGeaMenu) {
        clearGeaMenu(state.context);
    }

    if (!node.skipSay) {

        for (const line of node.say || []) {

            messages.push(bot(line.replace(/\*\*/g, '')));

        }

    }

    const omniaxEnter = getOmniaxEnterTask(state, node);
    const geaEnter = getGeaEnterTask(state, node);

    return { scroll: true, omniaxEnter, geaEnter };

}



function handleGlobalCommand(text, state, messages) {

    const t = text.trim().toLowerCase();

    if (['menu', 'menú', 'menu principal', 'menú principal'].includes(t)) {

        messages.push(user(text));

        if (state.context.omniax) state.context.omniax = {};

        enterNode(state, 'menu_principal', messages);

        return true;

    }

    if (t === 'empezar' && state.nodeId !== LUCY_ENTRY_NODE) {

        messages.push(user(text));

        enterNode(state, LUCY_ENTRY_NODE, messages);

        return true;

    }

    return false;

}



export function reduceLucyChat(state, messages, event) {

    const nextState = { ...state, context: { ...state.context } };

    const newMessages = [];



    if (event.type === 'init') {

        const enter = enterNode(nextState, nextState.nodeId || LUCY_ENTRY_NODE, newMessages);

        return {

            state: nextState,

            messages: [...messages, ...newMessages],

            ...packEnter(enter),

        };

    }



    if (event.type === 'omniaxResult' || event.type === 'geaResult') {

        const { result } = event;
        const isGea = event.type === 'geaResult';

        if (result.messages?.length) newMessages.push(...result.messages);

        if (result.patchContext) Object.assign(nextState.context, result.patchContext);

        if (result.rerunTask) {

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

                ...(isGea ? { geaEnter: result.rerunTask } : { omniaxEnter: result.rerunTask }),

            };

        }

        if (!result.stayOnNode && result.nextNodeId) {

            const enter = enterNode(nextState, result.nextNodeId, newMessages);

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                ...packEnter(enter),

            };

        }

        return {

            state: nextState,

            messages: [...messages, ...newMessages],

            scroll: true,

        };

    }



    if (event.type === 'omniaxBeneficiario') {
        const omx = nextState.context.omniax || {};
        omx.identificacion_beneficiario = event.identificacion_beneficiario;
        omx.nombre_beneficiario = event.nombre_beneficiario;
        omx.edad_beneficiario = event.edad_beneficiario;
        omx.sexo_beneficiario = event.sexo_beneficiario;
        omx.parentesco_beneficiario = event.parentesco_beneficiario;
        omx.para_beneficiario = true;
        nextState.context.omniax = omx;

        newMessages.push(user(`Beneficiario: ${event.nombre_beneficiario || 'registrado'}`));

        const dental = String(nextState.nodeId || '').startsWith('omx_den_');
        const reagendar = Boolean(nextState.context.omniax?.reagendar);
        let nextId = dental ? 'omx_den_aplica_load' : 'omx_med_especialidades_load';
        if (reagendar) {
            nextId = dental ? 'omx_den_reag_list_load' : 'omx_med_reag_list_load';
        }
        const enter = enterNode(nextState, nextId, newMessages);

        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            ...packEnter(enter),
        };
    }

    if (event.type === 'omniaxFechaHora') {
        const fecha = String(event.fecha || '').trim();
        const hora = String(event.hora || '').trim();
        if (!fecha || !hora) {
            return { state: nextState, messages, scroll: false };
        }

        const omx = nextState.context.omniax || {};
        omx.fecha = fecha;
        omx.hora = hora;
        nextState.context.omniax = omx;

        newMessages.push(user(`${fecha} · ${hora}`));

        const dental = String(nextState.nodeId || '').startsWith('omx_den_');
        const verifyNode = dental
            ? 'omx_den_verificar_disponibilidad_load'
            : 'omx_med_verificar_disponibilidad_load';
        const enter = enterNode(nextState, verifyNode, newMessages);

        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            ...packEnter(enter),
        };
    }

    if (event.type === 'geaError') {
        const detail = String(event.message || 'No pudimos completar la operación GEA.').trim();
        newMessages.push(bot(`⚠️ ${detail}`));
        const enter = enterNode(nextState, 'menu_solucion_24_7', newMessages);
        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            ...packEnter(enter),
        };
    }

    if (event.type === 'omniaxError') {

        const detail = String(event.message || 'No pudimos completar la operación.').trim();
        newMessages.push(bot(`⚠️ ${detail}`));

        const dentalFlow = String(nextState.nodeId || '').startsWith('omx_den_');
        const fechaRecover = dentalFlow ? 'omx_den_fecha_hora' : 'omx_med_fecha_hora';
        const errorRecover = dentalFlow ? 'omx_den_error' : 'omx_med_error';
        const recoverNode =
            nextState.nodeId &&
            (nextState.nodeId.includes('fecha') ||
                nextState.nodeId.includes('verificar') ||
                nextState.nodeId.includes('crear_load') ||
                nextState.nodeId.includes('reagendar_load'))
                ? fechaRecover
                : errorRecover;

        const enter = enterNode(nextState, recoverNode, newMessages);

        return {

            state: nextState,

            messages: [...messages, ...newMessages],

            ...packEnter(enter),

        };

    }



    if (event.type === 'quick') {

        const action = event.action;

        if (!action?.next && action?.id !== 'share_location') {

            return { state: nextState, messages, scroll: false };

        }



        if (action.meta?.omx) {
            applyOmniaxQuickMeta(nextState, action);
        }
        if (action.meta?.gea) {
            applyGeaQuickMeta(nextState, action);
        }

        if (action.meta?.gea?.encuestaAnswer) {
            newMessages.push(user(action.label));
            return {
                state: nextState,
                messages: [...messages, ...newMessages],
                scroll: true,
                geaEnter: 'encuesta_process_answer',
            };
        }

        if (action.type === 'location' || action.id === 'share_location') {

            newMessages.push(user(action.label || '📍 Ubicación'));

            nextState.pendingLocationNext = action.next;

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

                requestLocation: true,

            };

        }



        newMessages.push(user(action.label));

        const enter = enterNode(nextState, action.next, newMessages);

        return {

            state: nextState,

            messages: [...messages, ...newMessages],

            ...packEnter(enter),

        };

    }



    if (event.type === 'location') {

        newMessages.push(user('📍 Ubicación compartida'));

        const target = nextState.pendingLocationNext;

        nextState.pendingLocationNext = null;

        if (target) {

            nextState.context.lastLocation = event.coords;

            const omx = nextState.context.omniax || {};

            omx.latitud = String(event.coords.latitude);

            omx.longitud = String(event.coords.longitude);

            nextState.context.omniax = omx;

            const gea = nextState.context.gea || {};
            gea.latitud = String(event.coords.latitude);
            gea.longitud = String(event.coords.longitude);
            nextState.context.gea = gea;

            const enter = enterNode(nextState, target, newMessages);

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                ...packEnter(enter),

            };

        }

        return {

            state: nextState,

            messages: [...messages, ...newMessages],

            scroll: true,

        };

    }



    if (event.type === 'text') {

        const text = String(event.text || '').trim();

        if (!text) return { state: nextState, messages, scroll: false };

        const geaCtx = nextState.context.gea;
        if (geaCtx?.awaitingMotivo) {
            geaCtx.lastMotivoText = text;
            newMessages.push(user(text));
            return {
                state: nextState,
                messages: [...messages, ...newMessages],
                scroll: true,
                geaEnter: 'encuesta_motivo_submit',
            };
        }

        if (handleGlobalCommand(text, nextState, newMessages)) {

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

            };

        }



        const node = getNode(nextState.nodeId);

        if (!node?.input) {

            newMessages.push(user(text));

            newMessages.push(

                bot('Selecciona una opción de la lista o escribe "Menú principal".'),

            );

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

            };

        }



        newMessages.push(user(text));



        if (node.input.field === 'cedula' && !CEDULA_RE.test(text)) {

            newMessages.push(bot('La cédula debe tener 10 dígitos. Intenta de nuevo.'));

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

            };

        }



        if (node.input.field === 'plate' && !PLATE_RE.test(text.toUpperCase())) {

            newMessages.push(

                bot(

                    'No he podido ingresar tu solicitud. Por favor ayúdame con la información solicitada (ej: GYE1234).',

                ),

            );

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

            };

        }



        if (node.input.field === 'cedula') nextState.context.cedula = text;

        if (node.input.field === 'plate') nextState.context.plate = text.toUpperCase();

        if (node.input.field === 'nombre') nextState.context.nombre = text;

        if (node.input.geaField === 'direccion') {
            const gea = nextState.context.gea || {};
            gea.direccion = text;
            nextState.context.gea = gea;
        }
        if (node.input.geaField === 'id_asistencia_evaluar') {
            const gea = nextState.context.gea || {};
            const id = Number.parseInt(text, 10);
            gea.id_asistencia_evaluar = id;
            gea.id_asistencia = id;
            nextState.context.gea = gea;
        }



        let nextId = node.input.next;

        if (nextState.context.skipToAseguradora && nextId === 'truncal_en_curso') {

            nextState.context.skipToAseguradora = false;

            nextId = 'menu_aseguradora';

        }



        const enter = enterNode(nextState, nextId, newMessages);

        return {

            state: nextState,

            messages: [...messages, ...newMessages],

            ...packEnter(enter),

        };

    }



    return { state: nextState, messages, scroll: false };

}


