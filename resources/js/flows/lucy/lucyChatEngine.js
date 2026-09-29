import { LUCY_ENTRY_NODE, LUCY_FLOW_NODES } from './lucyFlowGraph.js';
import {
    applyLucyTelefonoToContext,
    getTelefonoFromQuery,
    isValidLucyTelefono,
    readPersistedLucyTelefono,
    resolveLucyTelefono,
    shouldSkipTelefonoPrompt,
    TELEFONO_EC_RE,
} from '@/lib/lucyTelefono.js';

import { openExternalUrl } from '@/lib/webviewBridge.js';
import { advisorHandoffMenuActions, bot, user, LUCY_HOME_NODE, LUCY_LEGACY_ROOT_NODES } from './flowHelpers.js';
import { CABINA_REGISTRO_HANDOFF_DONE } from './advisorHandoffCopy.js';
import {
    isComHandoffTerminalNode,
    isGeaServiceTerminalNode,
    isApiConsumerNode,
    resolveBackNodeId,
    resolveNavigateBackTarget,
    shouldShowBackButton,
} from './navBack.js';
import { isOmniaxScheduleFlow } from './omniax/omniaxScheduleBack.js';

import {
    applyComQuickMeta,
    clearComMenu,
    getComEnterTask,
    getComMenuActions,
    syncComFromNode,
} from './comercial/comercialEngine.js';
import {
    endIaSession,
    getIaEnterTask,
    syncIaFromNode,
} from './ia/iaEngine.js';
import {
    applyAsegQuickMeta,
    clearAsegMenu,
    getAsegEnterTask,
    getAsegMenuActions,
    syncAsegFromNode,
} from './aseguradora/aseguradoraEngine.js';
import {
    applyGeaQuickMeta,
    clearGeaMenu,
    getGeaEnterTask,
    getGeaMenuActions,
    syncGeaFromNode,
} from './gea/geaEngine.js';
import { recordAutomaticoAnswer } from './gea/automaticoPreguntas.js';
import {
    applyOmniaxQuickMeta,
    clearOmniaxMenu,
    getOmniaxEnterTask,
    getOmniaxMenuActions,
    syncOmniaxKind,
} from './omniax/omniaxEngine.js';
import { applyWebviewIntentToContext } from './webviewIntent.js';

function packEnter(enter) {
    return {
        scroll: enter.scroll !== false,
        omniaxEnter: enter.omniaxEnter ?? null,
        geaEnter: enter.geaEnter ?? null,
        asegEnter: enter.asegEnter ?? null,
        comEnter: enter.comEnter ?? null,
        iaEnter: enter.iaEnter ?? null,
    };
}



const PLATE_RE = /^(?:[A-Z]{3}\d{3,4}|[A-Z]{2}\d{3}[A-Z])$/i;

const CEDULA_RE = /^\d{10}$/;



export function createLucyChatState(entryNode = LUCY_ENTRY_NODE) {
    const context = {};
    const fromQuery = getTelefonoFromQuery();
    if (fromQuery) {
        applyLucyTelefonoToContext(context, fromQuery);
    } else {
        const persisted = readPersistedLucyTelefono();
        if (persisted && TELEFONO_EC_RE.test(persisted)) {
            context.telefono = persisted;
        }
    }

    applyWebviewIntentToContext(context);

    return {
        nodeId: entryNode,
        context,
        pendingLocationNext: null,
        navStack: [],
    };
}

export function canNavigateBack(state) {
    return shouldShowBackButton(state);
}

function pushNavHistory(state, fromNodeId) {
    if (!fromNodeId) return;
    const stack = state.navStack ? [...state.navStack] : [];
    if (stack[stack.length - 1] === fromNodeId) return;
    stack.push(fromNodeId);
    state.navStack = stack;
}

function clearNavStack(state) {
    state.navStack = [];
}



function getNode(nodeId) {

    return LUCY_FLOW_NODES[nodeId] || null;

}



export function getComposerPlaceholder(state) {

    const node = getNode(state.nodeId);

    if (state.pendingLocationNext) return 'Usa el botón de ubicación ↑';

    if (node?.useIaChat && state.context?.ia?.active) return 'Escribe a Lucy…';

    if (node?.input) {

        if (node.input.field === 'plate') return 'Ej: GYE1234';

        if (node.input.field === 'cedula') return '10 dígitos';

        if (node.input.field === 'telefono') return 'Ej: 0991234567';

        return 'Escribe tu respuesta…';

    }

    return 'Escribe un mensaje o usa los botones';

}



export function isComposerEnabled(state) {

    const node = getNode(state.nodeId);

    if (state.pendingLocationNext) return false;

    if (node?.useIaChat && state.context?.ia?.active) return true;

    return Boolean(node?.input);

}



export function getQuickActions(state) {
    if (state.nodeId === CABINA_REGISTRO_HANDOFF_DONE) {
        const returnNode = state.context?.cabinaHandoff?.returnNode || LUCY_HOME_NODE;
        return advisorHandoffMenuActions(returnNode).map((a) => ({
            id: a.id,
            label: a.label,
            next: a.next,
            icon: a.icon,
            menuTone: a.menuTone,
        }));
    }

    const node = getNode(state.nodeId);
    const dynamicOmx = getOmniaxMenuActions(state);

    if (node?.useOmniaxMenu && dynamicOmx?.length) {
        return dynamicOmx.map((a) => ({
            id: a.id,
            label: a.label,
            type: a.type,
            next: a.next,
            meta: a.meta,
            icon: a.icon,
            menuTone: a.menuTone,
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
            icon: a.icon,
            menuTone: a.menuTone,
        }));
    }

    const dynamicAseg = getAsegMenuActions(state);
    if (node?.useAsegMenu && dynamicAseg?.length) {
        return dynamicAseg.map((a) => ({
            id: a.id,
            label: a.label,
            type: a.type,
            next: a.next,
            meta: a.meta,
        }));
    }

    const dynamicCom = getComMenuActions(state);
    if (node?.useComMenu && dynamicCom?.length) {
        return dynamicCom.map((a) => ({
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

        icon: a.icon,

        menuTone: a.menuTone,

        url: a.url,

    }));



    if (actions.length === 0 && !node.input) {

        return [{ id: 'menu', label: 'Menú principal', next: LUCY_HOME_NODE }];

    }

    return actions;

}



function enterNode(state, nodeId, messages, options = {}) {
    const { recordHistory = true } = options;

    const node = getNode(nodeId);

    if (!node) {

        messages.push(bot('No encontramos ese paso del flujo. Volviendo al inicio.'));

        clearNavStack(state);

        return enterNode(state, LUCY_ENTRY_NODE, messages, { recordHistory: false });

    }

    if (LUCY_LEGACY_ROOT_NODES.includes(nodeId)) {
        return enterNode(state, LUCY_HOME_NODE, messages, options);
    }

    if (nodeId === 'auth_telefono' && shouldSkipTelefonoPrompt()) {
        const next = node.input?.next || 'auth_cedula';
        return enterNode(state, next, messages, { recordHistory: false });
    }

    if (nodeId === 'auth_cedula' && !resolveLucyTelefono(state.context)) {
        return enterNode(state, 'auth_telefono', messages, options);
    }

    const fromNodeId = state.nodeId;
    if (recordHistory && fromNodeId && fromNodeId !== nodeId && !isApiConsumerNode(fromNodeId)) {
        pushNavHistory(state, fromNodeId);
    }

    state.nodeId = nodeId;

    state.pendingLocationNext = null;

    const queryTel = getTelefonoFromQuery();
    if (queryTel) {
        applyLucyTelefonoToContext(state.context, queryTel);
    }

    syncOmniaxKind(state, node);
    syncGeaFromNode(state, node);
    syncAsegFromNode(state, node);
    syncComFromNode(state, node);
    syncIaFromNode(state, node);

    if (!node.useIaChat) {
        endIaSession(state.context);
    }

    if (!node.useOmniaxMenu) {
        clearOmniaxMenu(state.context);
    }
    if (!node.useGeaMenu) {
        clearGeaMenu(state.context);
    }
    if (!node.useAsegMenu) {
        clearAsegMenu(state.context);
    }
    if (!node.useComMenu) {
        clearComMenu(state.context);
    }

    if (!node.skipSay) {

        for (const line of node.say || []) {

            messages.push(bot(line.replace(/\*\*/g, '')));

        }

    }

    if (node.returnTo) {
        return enterNode(state, node.returnTo, messages, { recordHistory: false });
    }

    const skipAsyncEnter = recordHistory === false;

    let omniaxEnter = skipAsyncEnter ? null : getOmniaxEnterTask(state, node);
    let geaEnter = skipAsyncEnter ? null : getGeaEnterTask(state, node);
    const asegEnter = skipAsyncEnter ? null : getAsegEnterTask(state, node);
    const comEnter = skipAsyncEnter ? null : getComEnterTask(state, node);
    const iaEnter = skipAsyncEnter ? null : getIaEnterTask(state, node);

    if (
        !skipAsyncEnter
        && !geaEnter
        && node.gea?.refreshMenuEnter
        && node.useGeaMenu
        && !(getGeaMenuActions(state)?.length)
        && state.context.gea?.asistenciasActivas?.length
    ) {
        geaEnter = node.gea.refreshMenuEnter;
    }

    if (
        !skipAsyncEnter
        && !omniaxEnter
        && node.omx?.refreshMenuEnter
        && node.useOmniaxMenu
        && !(getOmniaxMenuActions(state)?.length)
    ) {
        omniaxEnter = node.omx.refreshMenuEnter;
    }

    if (nodeId === LUCY_HOME_NODE) {
        clearNavStack(state);
    }

    return { scroll: true, omniaxEnter, geaEnter, asegEnter, comEnter, iaEnter };

}



function handleGlobalCommand(text, state, messages) {

    const t = text.trim().toLowerCase();

    if (['menu', 'menú', 'menu principal', 'menú principal'].includes(t)) {

        messages.push(user(text));

        if (state.context.omniax) state.context.omniax = {};

        clearNavStack(state);
        enterNode(state, LUCY_HOME_NODE, messages, { recordHistory: false });

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

        const enter = enterNode(nextState, nextState.nodeId || LUCY_ENTRY_NODE, newMessages, {
            recordHistory: false,
        });

        return {

            state: nextState,

            messages: [...messages, ...newMessages],

            ...packEnter(enter),

        };

    }

    if (event.type === 'navigateBack') {
        const prevNodeId = resolveNavigateBackTarget(nextState);
        if (!prevNodeId) {
            return { state: nextState, messages, scroll: false };
        }

        if (prevNodeId === LUCY_HOME_NODE || prevNodeId === 'menu_medico' || prevNodeId === 'menu_dental') {
            clearNavStack(nextState);
        } else if (!isOmniaxScheduleFlow(nextState.nodeId)) {
            const { stack } = resolveBackNodeId(nextState.navStack || []);
            nextState.navStack = stack;
        }

        const enter = enterNode(nextState, prevNodeId, newMessages, { recordHistory: false });
        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            ...packEnter(enter),
        };
    }

    if (
        event.type === 'omniaxResult'
        || event.type === 'geaResult'
        || event.type === 'asegResult'
        || event.type === 'comResult'
        || event.type === 'iaResult'
    ) {

        const { result } = event;
        const isGea = event.type === 'geaResult';
        const isAseg = event.type === 'asegResult';
        const isCom = event.type === 'comResult';
        const isIa = event.type === 'iaResult';

        if (result.messages?.length) newMessages.push(...result.messages);

        if (result.patchContext) Object.assign(nextState.context, result.patchContext);

        if (result.clearNavStack) clearNavStack(nextState);

        if (result.rerunTask) {

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

                ...(isGea
                    ? { geaEnter: result.rerunTask }
                    : isAseg
                      ? { asegEnter: result.rerunTask }
                      : isCom
                        ? { comEnter: result.rerunTask }
                        : isIa
                          ? { iaEnter: result.rerunTask }
                          : { omniaxEnter: result.rerunTask }),

            };

        }

        if (!result.stayOnNode && result.nextNodeId) {
            if (isGeaServiceTerminalNode(result.nextNodeId)) {
                clearNavStack(nextState);
            }
            if (isCom && isComHandoffTerminalNode(result.nextNodeId)) {
                clearNavStack(nextState);
            }

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
        clearNavStack(nextState);
        const enter = enterNode(nextState, LUCY_HOME_NODE, newMessages, { recordHistory: false });
        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            ...packEnter(enter),
        };
    }

    if (event.type === 'asegError') {
        const detail = String(event.message || 'No pudimos completar la operación ASAP.').trim();
        newMessages.push(bot(`⚠️ ${detail}`));
        const enter = enterNode(nextState, 'menu_aseguradora', newMessages);
        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            ...packEnter(enter),
        };
    }

    if (event.type === 'comError') {
        const detail = String(event.message || 'No pudimos completar la operación comercial.').trim();
        newMessages.push(bot(`⚠️ ${detail}`));
        clearNavStack(nextState);
        const enter = enterNode(nextState, LUCY_HOME_NODE, newMessages, { recordHistory: false });
        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            ...packEnter(enter),
        };
    }

    if (event.type === 'iaError') {
        const detail = String(event.message || 'No pudimos completar la conversación IA.').trim();
        newMessages.push(bot(`⚠️ ${detail}`));
        return {
            state: nextState,
            messages: [...messages, ...newMessages],
            scroll: true,
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
        if (action.meta?.aseg) {
            applyAsegQuickMeta(nextState, action);
        }
        if (action.meta?.com) {
            applyComQuickMeta(nextState, action);
        }

        if (action.type === 'webview_close') {
            newMessages.push(user(action.label || 'Volver a WhatsApp'));
            return {
                state: nextState,
                messages: [...messages, ...newMessages],
                scroll: true,
                webviewClose: {
                    nodeId: nextState.nodeId,
                    reason: 'user_action',
                },
            };
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

        if (action.type === 'link' && action.url) {
            newMessages.push(user(action.label || 'Abrir enlace'));
            if (typeof window !== 'undefined') {
                openExternalUrl(action.url);
            }
            return {
                state: nextState,
                messages: [...messages, ...newMessages],
                scroll: false,
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

        const goingHome = action.next === LUCY_HOME_NODE;
        if (goingHome) {
            clearNavStack(nextState);
        }

        const enter = enterNode(nextState, action.next, newMessages, {
            recordHistory: !goingHome,
        });

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

        const iaNode = getNode(nextState.nodeId);
        if (iaNode?.useIaChat && nextState.context?.ia?.active) {
            newMessages.push(user(text));
            return {
                state: nextState,
                messages: [...messages, ...newMessages],
                scroll: true,
                iaUserMessage: text,
            };
        }

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



        if (node.input.field === 'telefono' && !isValidLucyTelefono(text)) {

            newMessages.push(
                bot('Ingresa un celular válido de Ecuador (10 dígitos, empieza con 09). Ej: 0991234567.'),
            );

            return {

                state: nextState,

                messages: [...messages, ...newMessages],

                scroll: true,

            };

        }



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



        if (node.input.field === 'telefono') {
            applyLucyTelefonoToContext(nextState.context, text);
        }

        if (node.input.field === 'cedula') nextState.context.cedula = text;

        if (node.input.field === 'plate') nextState.context.plate = text.toUpperCase();

        if (node.input.field === 'nombre') nextState.context.nombre = text;

        if (node.input.geaField) {
            const gea = nextState.context.gea || {};
            gea[node.input.geaField] = text;
            if (node.input.geaField === 'descripcion_problema') {
                recordAutomaticoAnswer(gea, {
                    pregunta: 'Cuéntanos brevemente cuál es el problema que presentas.',
                    respuesta: text,
                    aplicaAutomatico: true,
                });
            }
            nextState.context.gea = gea;
        }
        if (node.input.asegField) {
            const aseg = nextState.context.aseg || {};
            aseg[node.input.asegField] = text;
            nextState.context.aseg = aseg;
        }
        if (node.input.comField) {
            const com = nextState.context.com || {};
            com[node.input.comField] = text;
            nextState.context.com = com;
        }
        if (node.input.geaField === 'id_asistencia_evaluar') {
            const gea = nextState.context.gea || {};
            const id = Number.parseInt(text, 10);
            gea.id_asistencia_evaluar = id;
            gea.id_asistencia = id;
            nextState.context.gea = gea;
        }



        let nextId = node.input.next;

        if (
            nextState.context.skipToAseguradora
            && (nextId === 'truncal_en_curso' || nextId === 'post_auth_gate_load')
        ) {
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


