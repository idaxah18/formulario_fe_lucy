import { HSM_CATEGORIES } from './hsmCatalog.js';
import { advisorHandoffSay } from './advisorHandoffCopy.js';
import {
    advisorHandoffMenuActions,
    buildCabinaPrefaceNode,
    crearAsistenciaChain,
    LUCY_HOME_NODE,
    slugify,
    standardExitActions,
    stubRegistered,
    wizardTextSteps,
} from './flowHelpers.js';
import { buildAseguradoraSiniestroNodes } from './aseguradora/aseguradoraNodes.js';
import { buildIaNodes } from './ia/iaNodes.js';
import { buildGeaNodes } from './gea/geaNodes.js';
import { geaChainOptions } from './gea/geaServiceIds.js';
import { buildAutomaticoServiceChains } from './gea/automaticoChain.js';
import { usesProcesoAutomatico } from './gea/automaticoCatalog.js';
import { buildOmniaxDentalNodes } from './omniax/omniaxDentalNodes.js';
import { buildOmniaxMedicoNodes } from './omniax/omniaxMedicoNodes.js';

function menuNode(id, jelou, say, actions) {
    return { [id]: { jelou, say: Array.isArray(say) ? say : [say], actions } };
}

function merge(...parts) {
    return Object.assign({}, ...parts);
}

/** Menú raíz legacy (oculto; redirige a {@link LUCY_HOME_NODE}). Pendiente decisión gerencia. */
const ROOT_HOME_ACTIONS = [
    { id: 'plan_asist', label: 'Solución 24/7 (Asistencias)', next: 'menu_solucion_24_7' },
    { id: 'plan_aseg', label: 'Aseguradora ASAP', next: 'menu_aseguradora' },
    { id: 'plan_vip', label: 'Asistencias VIP', next: 'asistencias_vip' },
    { id: 'plan_prot', label: 'Servicios Protección', next: 'servicios_proteccion' },
    { id: 'plan_ia', label: 'IA Router (registro)', next: 'ia_router' },
    { id: 'plan_hsm', label: 'Simulador HSM (QA)', next: 'hsm_root' },
    { id: 'plan_utils', label: 'Utilidades / sistema', next: 'menu_utilidades' },
];

const ROOT_HOME_SAY = 'Bienvenido. ¿Qué tipo de atención necesitas hoy?';

/** WF 2.7.1.1 → skill PMA (4236); webview: derivación Datum con producto por segmento. */
const INFO_SERVICIO_CONTRATADO_SEGMENTS = [
    { leaf: 'hogar', label: 'Hogar', producto: 'Información de servicio contratado' },
    { leaf: 'vial', label: 'Vial', producto: 'Información de servicio contratado - Vial' },
    { leaf: 'medico', label: 'Médico', producto: 'Información de servicio contratado - Médico' },
    { leaf: 'dental', label: 'Dental', producto: 'Información de servicio contratado - Dental' },
    {
        leaf: 'otras',
        label: 'Otras asistencias',
        producto: 'Información de servicio contratado - Otras asistencias',
    },
];

const SEGMENT_MENU_STYLE = {
    hogar: { icon: 'house', menuTone: 'tone-asist-hogar' },
    vial: { icon: 'car', menuTone: 'tone-asist-vial' },
    medico: { icon: 'heart', menuTone: 'tone-asist-medica' },
    dental: { icon: 'toothbrush-sparkles', menuTone: 'tone-asist-dental' },
    otras: { icon: 'handshake', menuTone: 'tone-olive' },
};

const COMPRAR_ASISTENCIA_SEGMENTS = [
    { id: 'd', label: 'Dental', key: 'dental', producto: 'Comprar asistencia - Dental' },
    { id: 'm', label: 'Médico', key: 'medico', producto: 'Comprar asistencia - Médico' },
    { id: 'h', label: 'Hogar', key: 'hogar', producto: 'Comprar asistencia - Hogar' },
    { id: 'v', label: 'Vial', key: 'vial', producto: 'Comprar asistencia - Vial' },
    {
        id: 'o',
        label: 'Otras asistencias',
        key: 'otras',
        producto: 'Comprar asistencia - Otras asistencias',
        icon: 'arrow-right-from-line',
        menuTone: 'tone-olive',
    },
];

function buildInfoServicioContratadoLeaves() {
    const nodes = {};
    for (const seg of INFO_SERVICIO_CONTRATADO_SEGMENTS) {
        const loadId = `leaf_info_${seg.leaf}_load`;
        const doneId = `leaf_info_${seg.leaf}_done`;
        nodes[loadId] = {
            jelou: '2.7.1.1 Información de servicio contratado',
            skipSay: true,
            com: {
                enter: 'derivacion_asesor',
                producto: seg.producto,
                notas: `Servicio contratado / ${seg.label}`,
                afterDerivacion: doneId,
            },
        };
        nodes[doneId] = {
            jelou: '2.7.1.1 Información de servicio contratado',
            skipSay: true,
            actions: advisorHandoffMenuActions('info_servicio_contratado'),
        };
    }
    return nodes;
}

const VIAL_SERVICE_MENU = [
    { label: 'Grúa por avería', icon: 'truck', menuTone: 'tone-asist-vial' },
    { label: 'Grúa (otro motivo)', icon: 'truck', menuTone: 'tone-asist-vial' },
    { label: 'Cambio de llanta', icon: 'life-buoy', menuTone: 'tone-asist-vial' },
    { label: 'Suministro de gasolina', icon: 'fuel', menuTone: 'tone-asist-vial' },
    { label: 'Paso de corriente', icon: 'unplug', menuTone: 'tone-asist-vial' },
    { label: 'Cerrajería de puertas', icon: 'lock-open', menuTone: 'tone-asist-vial' },
    { label: 'Inspector in situ', icon: 'user-star', menuTone: 'tone-asist-vial' },
];

const HOGAR_SERVICE_MENU = [
    { label: 'Plomero', icon: 'faucet', menuTone: 'tone-asist-hogar' },
    { label: 'Electricista', icon: 'zap', menuTone: 'tone-asist-hogar' },
    { label: 'Cerrajero', icon: 'anvil', menuTone: 'tone-asist-hogar' },
    { label: 'Vidriería', icon: 'mirror-rectangular', menuTone: 'tone-asist-hogar' },
    { label: 'Limpieza y mantenimiento', icon: 'broom-sparkles', menuTone: 'tone-asist-hogar' },
    { label: 'Spa y peluquería', icon: 'bubbles', menuTone: 'tone-asist-hogar' },
    { label: 'Handyman', icon: 'toolbox', menuTone: 'tone-asist-hogar' },
];

function buildServiceChains(serviceDefs, jelouRef, returnNode, chainExtra = {}) {
    const items = serviceDefs.map((def) => (typeof def === 'string' ? { label: def } : def));
    let nodes = {};
    const actions = [];
    for (const item of items) {
        const label = item.label;
        const chain = crearAsistenciaChain(
            label,
            jelouRef,
            returnNode,
            geaChainOptions(label, jelouRef, chainExtra),
        );
        nodes = merge(nodes, chain.nodes);
        const action = { id: slugify(label), label, next: chain.entry };
        if (item.icon) {
            action.icon = item.icon;
            action.menuTone = item.menuTone || 'tone-blue';
        }
        actions.push(action);
    }
    return { nodes, actions };
}

/** Hogar/vial: listado GEA → proceso automático; resto → asistencias/gea (cabina). */
function buildHybridGeaServiceChains(serviceDefs, jelouRef, returnNode, chainExtra = {}) {
    const items = serviceDefs.map((def) => (typeof def === 'string' ? { label: def } : def));
    const automaticItems = items.filter((item) => usesProcesoAutomatico(item.label, jelouRef));
    const legacyItems = items.filter((item) => !usesProcesoAutomatico(item.label, jelouRef));

    const automatic = buildAutomaticoServiceChains(automaticItems, jelouRef, returnNode);
    const legacy = buildServiceChains(legacyItems, jelouRef, returnNode, chainExtra);

    return {
        nodes: merge(automatic.nodes, legacy.nodes),
        actions: [...automatic.actions, ...legacy.actions],
    };
}

function buildCore() {
    return merge(
        {
            auth_telefono: {
                jelou: 'Telefono prueba webview',
                say: [
                    'Antes de continuar, ingresa tu **número de celular** (solo para pruebas en web; en WhatsApp se usa tu número automáticamente).',
                ],
                input: { field: 'telefono', next: 'auth_cedula' },
            },
            auth_cedula: {
                jelou: 'Proteccion datos cedula',
                say: ['Hola, soy Lucy. Para ayudarte, ingresa tu número de cédula.'],
                input: { field: 'cedula', next: 'auth_nombre' },
            },
            auth_nombre: {
                jelou: 'Proteccion datos nombre',
                say: ['Gracias. Ahora confirma tu nombre completo.'],
                input: { field: 'nombre', next: 'auth_lopdp' },
            },
            auth_lopdp: {
                jelou: 'Aceptacion LOPDP',
                say: ['Registrando aceptación de protección de datos…'],
                skipSay: true,
                gea: { enter: 'lopdp', afterLopdpNext: 'post_auth_gate_load' },
            },
            post_auth_gate_load: {
                jelou: 'Truncal-inicio',
                say: ['Revisando asistencias en curso…'],
                skipSay: true,
                gea: { enter: 'post_auth_asistencias_gate' },
            },
            asistencias_activas_hub: {
                jelou: 'Asistencias en curso',
                skipSay: true,
                useGeaMenu: true,
                gea: { refreshMenuEnter: 'asistencia_activa_list' },
            },
            asistencia_activa_list: {
                jelou: 'Asistencias en curso',
                skipSay: true,
                gea: { enter: 'asistencia_activa_list' },
            },
            asistencia_activa_pick_load: {
                jelou: 'Asistencias en curso',
                skipSay: true,
                gea: { enter: 'asistencia_activa_pick' },
            },
            asistencia_activa_detalle: {
                jelou: 'Asistencias en curso',
                skipSay: true,
                useGeaMenu: true,
            },
            asistencia_activa_asesor_load: {
                jelou: 'Derivación asesor — asistencia en curso',
                skipSay: true,
                gea: { enter: 'derivacion_asesor_asistencia' },
            },
            asistencia_activa_asesor_done: {
                jelou: 'Derivación asesor — asistencia en curso',
                say: advisorHandoffSay('asistencia_en_curso'),
                actions: [{ id: 'home', label: 'Menú principal', next: LUCY_HOME_NODE }],
            },
        },
        menuNode(
            'truncal_en_curso',
            'Truncal-inicio',
            '(Legacy) ¿Tienes una asistencia en curso?',
            [
                { id: 'si', label: 'Sí', next: 'post_auth_gate_load' },
                { id: 'no', label: 'No', next: 'menu_solucion_24_7' },
            ],
        ),
        menuNode('choose_plan', '0. Inicio del bot', ROOT_HOME_SAY, ROOT_HOME_ACTIONS),
        menuNode('menu_principal', '0. Inicio del bot', ROOT_HOME_SAY, ROOT_HOME_ACTIONS),
        buildGeaNodes(),
    );
}

function buildSolucion247() {
    const hogar = buildHybridGeaServiceChains(HOGAR_SERVICE_MENU, '2.3 Hogar');
    const vial = buildHybridGeaServiceChains(VIAL_SERVICE_MENU, '2.4 Vial');
    const vialLegalTelefonica = crearAsistenciaChain(
        'Asistencia Legal telefónica',
        '2.4 Vial',
        'menu_solucion_24_7',
        {
            ...geaChainOptions('Asistencia Legal telefónica', '2.4 Vial'),
            skipLocation: true,
            sinUbicacion: true,
            crearJelouRef: 'V2 Crear asistencia sin dirección sin ubicación',
        },
    );
    const otrasSolucionesGea = crearAsistenciaChain(
        'Otras soluciones',
        'Otras soluciones 2',
        'menu_solucion_24_7',
        {
            ...geaChainOptions('Otras soluciones', 'Otras soluciones 2'),
            skipLocation: true,
            sinUbicacion: true,
            crearJelouRef: 'V2 Crear asistencia sin dirección sin ubicación',
            afterCrearNext: 'otras_soluciones_gea_done',
        },
    );
    const medicoAsist = buildServiceChains(
        [
            'Ambulancia',
            'Orientación médica telefónica',
            'Médico a domicilio',
            'Bienestar y nutrición',
        ],
        '2.2 Médico',
    );

    const dentalWiz = wizardTextSteps(
        [
            { prompt: '¿Para qué fecha deseas la cita dental? (ej: 25/09/2026)' },
            { prompt: '¿En qué ciudad?' },
        ],
        '2.1.1 Agendar cita',
    );

    return merge(
        menuNode(
            'menu_solucion_24_7',
            '2. Servicios Solución 24/7',
            'Solución 24/7. ¿Cuál de estos servicios necesitas?',
            [
                {
                    id: 'dental',
                    label: 'Dental',
                    next: 'menu_dental',
                    icon: 'toothbrush-sparkles',
                    menuTone: 'tone-asist-dental',
                },
                {
                    id: 'medico',
                    label: 'Médico',
                    next: 'menu_medico',
                    icon: 'heart',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 'hogar',
                    label: 'Hogar',
                    next: 'menu_hogar',
                    icon: 'house',
                    menuTone: 'tone-asist-hogar',
                },
                {
                    id: 'vial',
                    label: 'Vial',
                    next: 'menu_vial',
                    icon: 'car',
                    menuTone: 'tone-asist-vial',
                },
                {
                    id: 'otras',
                    label: 'Otras soluciones',
                    next: 'otras_soluciones',
                    icon: 'handshake',
                    menuTone: 'tone-olive',
                },
                {
                    id: 'reportar',
                    label: 'Reportar un problema',
                    next: 'reportar_problema',
                    icon: 'info',
                    menuTone: 'tone-warm',
                },
                {
                    id: 'vermas',
                    label: 'Ver más opciones',
                    next: 'ver_mas_opciones',
                    icon: 'logs',
                    menuTone: 'tone-blue',
                },
            ],
        ),
        menuNode(
            'reagendar_asistencia',
            'reagendar asistencia',
            '¿Qué tipo de cita deseas reagendar?',
            [
                { id: 'den', label: 'Dental', next: 'omx_den_reag_start' },
                { id: 'med', label: 'Médico', next: 'omx_med_reag_start' },
                { id: 'back', label: 'Salir del menú', next: 'menu_solucion_24_7' },
            ],
        ),
        menuNode(
            'menu_dental',
            '2.1 Dental',
            'Dental 🦷 ¿Qué deseas?',
            [
                { id: 'ag', label: 'Agendar cita', next: 'omx_den_elegibilidad_load' },
                { id: 're', label: 'Reagendar cita', next: 'omx_den_reag_cabina_preface' },
                { id: 'back', label: 'Salir del menú', next: 'menu_solucion_24_7' },
            ],
        ),
        menuNode(
            'agendar_cita_tipo',
            '2.1.1 Agendar cita',
            '¿Qué tipo de cita deseas agendar?',
            [
                { id: 'cd', label: '🦷 Cita dental', next: 'omx_den_elegibilidad_load' },
                { id: 'cm', label: '👨🏻‍⚕️ Cita médica', next: 'omx_med_elegibilidad_load' },
                { id: 'ia', label: 'Agendar cita IA', next: 'agendar_cita_ia' },
            ],
        ),
        dentalWiz,
        menuNode(
            'menu_medico',
            '2.2 Médico',
            'Médico 🏥 ¿Qué necesitas?',
            [
                {
                    id: 'amb',
                    label: 'Ambulancia',
                    next: medicoAsist.actions[0].next,
                    icon: 'ambulance',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 'ori',
                    label: 'Orientación médica telefónica',
                    next: medicoAsist.actions[1].next,
                    icon: 'smartphone',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 'ag',
                    label: 'Agendar cita médica',
                    next: 'omx_med_elegibilidad_load',
                    icon: 'calendar-check',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 're',
                    label: 'Reagendar cita médica',
                    next: 'omx_med_reag_cabina_preface',
                    icon: 'calendar-clock',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 'dom',
                    label: 'Médico a domicilio',
                    next: medicoAsist.actions[2].next,
                    icon: 'briefcase-medical',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 'nut',
                    label: 'Bienestar y nutrición',
                    next: medicoAsist.actions[3].next,
                    icon: 'apple',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 'edo',
                    label: 'E-doctor',
                    next: 'activar_edoctor_inicio',
                    icon: 'globe-check',
                    menuTone: 'tone-asist-medica',
                },
                {
                    id: 'back',
                    label: 'Salir del menú',
                    next: 'menu_solucion_24_7',
                    icon: 'arrow-left',
                    menuTone: 'tone-blue',
                },
            ],
        ),
        menuNode(
            'menu_hogar',
            '2.3 Hogar',
            'Hogar 🏡 Elige el servicio:',
            [
                ...hogar.actions,
                {
                    id: 'back',
                    label: 'Salir del menú',
                    next: 'menu_solucion_24_7',
                    icon: 'arrow-left',
                    menuTone: 'tone-blue',
                },
            ],
        ),
        hogar.nodes,
        medicoAsist.nodes,
        menuNode(
            'menu_vial',
            '2.4 Vial',
            'Bienvenid@ a tu solución vial 🚗',
            [
                ...vial.actions,
                {
                    id: 'leg',
                    label: 'Asistencia legal telefónica',
                    next: vialLegalTelefonica.entry,
                    icon: 'smartphone',
                    menuTone: 'tone-asist-vial',
                },
                {
                    id: 'back',
                    label: 'Salir del menú',
                    next: 'menu_solucion_24_7',
                    icon: 'arrow-left',
                    menuTone: 'tone-blue',
                },
            ],
        ),
        vial.nodes,
        vialLegalTelefonica.nodes,
        menuNode('otras_soluciones', '2.5 Otras Soluciones', 'Otras soluciones para ti:', [
            { id: 'go', label: 'Continuar', next: 'otras_soluciones_2' },
            { id: 'no', label: 'No', next: 'menu_solucion_24_7' },
        ]),
        menuNode(
            'otras_soluciones_2',
            'Otras soluciones 2',
            '¿Quieres solicitar alguna otra solución que no se encuentra en el menú?',
            [
                { id: 'si', label: 'Sí', next: otrasSolucionesGea.entry },
                { id: 'salir', label: 'Salir', next: 'menu_solucion_24_7' },
            ],
        ),
        otrasSolucionesGea.nodes,
        {
            otras_soluciones_gea_done: {
                jelou: 'Otras soluciones 2',
                say: advisorHandoffSay('otras_soluciones'),
                actions: [
                    {
                        id: 'home',
                        label: 'Menú principal',
                        next: LUCY_HOME_NODE,
                        icon: 'home',
                        menuTone: 'tone-blue',
                    },
                ],
            },
        },
        {
            reportar_problema: {
                jelou: '2.6 Reportar un problema',
                say: ['Cuéntanos el problema que tuviste:'],
                input: { next: 'reportar_problema_done', echoUser: true },
            },
            reportar_problema_done: {
                jelou: '2.6 Reportar un problema',
                say: advisorHandoffSay('problema'),
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('ver_mas_opciones', '2.7 Ver más opciones', 'Aquí te presentamos más opciones.', [
            {
                id: 'info',
                label: 'Info de asistencia',
                next: 'info_asistencia',
                icon: 'info',
                menuTone: 'tone-blue',
            },
            {
                id: 'comp',
                label: 'Comprar asistencia',
                next: 'comprar_asistencia',
                icon: 'shopping-cart-plus',
                menuTone: 'tone-gold',
            },
            {
                id: 'blog',
                label: 'Blog Solución 24/7',
                next: 'blog_solucion',
                icon: 'sticky-note',
                menuTone: 'tone-green',
            },
            {
                id: 'back',
                label: 'Salir del menú',
                next: 'menu_solucion_24_7',
                icon: 'arrow-left',
                menuTone: 'tone-blue',
            },
        ]),
        menuNode('info_asistencia', '2.7.1 Info de asistencia', 'Selecciona una opción:', [
            {
                id: 'sc',
                label: 'Servicio contratado',
                next: 'info_servicio_contratado',
                icon: 'toolbox',
                menuTone: 'tone-blue',
            },
            {
                id: 'fac',
                label: 'Solicitar Factura',
                next: 'solicitar_factura_load',
                icon: 'info',
                menuTone: 'tone-blue',
            },
        ]),
        menuNode(
            'info_servicio_contratado',
            '2.7.1.1 Información de servicio contratado',
            '¿Qué línea de servicio consultas?',
            INFO_SERVICIO_CONTRATADO_SEGMENTS.map((seg) => {
                const style = SEGMENT_MENU_STYLE[seg.leaf] || {};
                return {
                    id: seg.leaf[0],
                    label: seg.label,
                    next: `leaf_info_${seg.leaf}_load`,
                    icon: style.icon,
                    menuTone: style.menuTone,
                };
            }),
        ),
        {
            ...buildInfoServicioContratadoLeaves(),
            /** WF 2.7.1.2 → skill PMA (4236); webview: derivación Datum. */
            solicitar_factura_load: {
                jelou: '2.7.1.2 Solicitar factura',
                skipSay: true,
                com: {
                    enter: 'derivacion_asesor',
                    producto: 'Solicitar factura',
                    notas: 'Info de asistencia / solicitar factura',
                    afterDerivacion: 'solicitar_factura_done',
                },
            },
            solicitar_factura_done: {
                jelou: '2.7.1.2 Solicitar factura',
                skipSay: true,
                actions: advisorHandoffMenuActions('info_asistencia'),
            },
            blog_solucion: {
                jelou: '2.7.3 Blog Solución 24/7',
                say: [
                    'Conoce tips, novedades y guías de tus asistencias en el blog oficial Solución 24/7.',
                ],
                actions: [
                    {
                        id: 'open_blog',
                        label: 'Abrir blog Solución 24/7',
                        type: 'link',
                        url: 'https://blog.solucion24-7.com.ec',
                        icon: 'sticky-note',
                        menuTone: 'tone-blue',
                    },
                    {
                        id: 'back',
                        label: 'Salir del menú',
                        next: 'ver_mas_opciones',
                        icon: 'arrow-left',
                        menuTone: 'tone-blue',
                    },
                ],
            },
        },
        menuNode(
            'comprar_asistencia',
            '2.7.2 Comprar un servicio de asistencia',
            '¿Qué deseas comprar?',
            [
                ...COMPRAR_ASISTENCIA_SEGMENTS.map((seg) => {
                    const style = SEGMENT_MENU_STYLE[seg.key] || {};
                    return {
                        id: seg.id,
                        label: seg.label,
                        next: 'venta_asistencias',
                        icon: seg.icon || style.icon,
                        menuTone: seg.menuTone || style.menuTone,
                        meta: {
                            com: {
                                producto: seg.producto,
                                notas: `Venta asistencias / ${seg.label}`,
                            },
                        },
                    };
                }),
                {
                    id: 'back',
                    label: 'Salir del menú',
                    next: 'ver_mas_opciones',
                    icon: 'arrow-left',
                    menuTone: 'tone-blue',
                },
            ],
        ),
        menuNode('venta_asistencias', 'Venta Asistencias - Inicio', '¿Cómo prefieres continuar?', [
            {
                id: 'con',
                label: 'Contratar',
                next: 'venta_contratar',
                icon: 'file',
                menuTone: 'tone-blue',
            },
            {
                id: 'ase',
                label: 'Chatear con Asesor',
                next: 'derivacion_asesor',
                icon: 'headset',
                menuTone: 'tone-blue',
                meta: {
                    com: {
                        afterDerivacion: 'venta_derivacion_done',
                        notas: 'Venta asistencias - chatear con asesor',
                    },
                },
            },
            {
                id: 'lla',
                label: 'Quiero llamar',
                next: 'derivacion_asesor',
                icon: 'phone',
                menuTone: 'tone-blue',
                meta: {
                    com: {
                        afterDerivacion: 'venta_derivacion_done',
                        notas: 'Venta asistencias - quiero llamar',
                    },
                },
            },
        ]),
        {
            venta_contratar: {
                jelou: 'Venta Asistencias - Contratar',
                skipSay: true,
                com: { enter: 'venta_contratar' },
            },
            venta_contratar_ok: {
                jelou: 'Venta Asistencias - Contratar',
                skipSay: true,
                actions: [
                    {
                        id: 'home',
                        label: 'Menú principal',
                        next: LUCY_HOME_NODE,
                        icon: 'home',
                        menuTone: 'tone-blue',
                    },
                ],
            },
            venta_derivacion_done: {
                jelou: 'Derivación a asesor',
                skipSay: true,
                actions: [
                    {
                        id: 'home',
                        label: 'Menú principal',
                        next: 'menu_solucion_24_7',
                        icon: 'home',
                        menuTone: 'tone-blue',
                    },
                ],
            },
            derivacion_asesor: {
                jelou: 'Derivación a asesor',
                say: ['Cuando estés listo, solicita que un asesor comercial te contacte.'],
                actions: [
                    {
                        id: 'go',
                        label: 'Solicitar contacto',
                        next: 'derivacion_asesor_load',
                        icon: 'user-star',
                        menuTone: 'tone-blue',
                    },
                ],
            },
            derivacion_asesor_load: {
                skipSay: true,
                com: { enter: 'derivacion_asesor' },
            },
        },
    );
}

function buildAseguradora() {
    const asegExtra = {
        planAsistencia: 'ASEGURADORA',
        tipoServicio: 'VIAL',
        requiresPlaca: true,
    };
    const asegChains = buildServiceChains(
        ['Grúa', 'Cambio de llanta', 'Suministro de gasolina', 'Paso de corriente', 'Cerrajería para apertura'],
        'V2 Aseguradora - Inicio',
        'menu_aseguradora',
        asegExtra,
    );
    const plateNodes = {};
    const asegMenu = [];
    for (const action of asegChains.actions) {
        const plateId = `aseg_placa_${action.id}`;
        const prefaceId = `aseg_cabina_preface_${action.id}`;
        const cabId = `aseg_cab_${action.id}`;
        const valId = `aseg_val_${action.id}`;
        plateNodes[plateId] = {
            jelou: 'V2 Aseguradora - Inicio',
            say: ['Por favor envíame el número de la placa (ej: GYE1234).'],
            input: { field: 'plate', next: prefaceId },
        };
        plateNodes[prefaceId] = buildCabinaPrefaceNode(prefaceId, cabId, 'aseguradora');
        plateNodes[cabId] = {
            skipSay: true,
            aseg: { enter: 'cabina_aseguradora', afterCabinaNext: valId },
        };
        plateNodes[valId] = {
            skipSay: true,
            aseg: { enter: 'consulta_placa_vial', afterOkNext: action.next },
        };
        asegMenu.push({ id: action.id, label: action.label, next: plateId });
    }

    return merge(
        menuNode(
            'menu_aseguradora',
            'V2 Aseguradora - Inicio',
            'Bienvenid@ a tu Solución Vial (Aseguradora). ¿Qué necesitas?',
            [
                ...asegMenu,
                { id: 'leg', label: 'Asistencia Legal', next: 'aseg_placa_legal' },
                { id: 'ins', label: 'Inspección vehícular', next: 'inspeccion' },
                { id: 'sin', label: 'Reportar un siniestro', next: 'menu_siniestro' },
                { id: 'main', label: 'Menú principal', next: LUCY_HOME_NODE },
            ],
        ),
        plateNodes,
        asegChains.nodes,
        {
            aseg_placa_legal: {
                jelou: 'V2 Aseguradora - Inicio',
                say: ['Por favor envíame el número de la placa (ej: GYE1234).'],
                input: { field: 'plate', next: 'aseg_legal_load' },
            },
            aseg_legal_load: {
                skipSay: true,
                aseg: {
                    enter: 'consulta_placa_vial',
                    afterOkNext: 'leaf_aseg_legal',
                },
            },
            leaf_aseg_legal: {
                jelou: 'V2 Aseguradora - Inicio',
                say: [
                    'Placa validada. Para asistencia legal un asesor continuará el caso por el canal oficial.',
                ],
                actions: standardExitActions('menu_aseguradora'),
            },
        },
        menuNode('menu_siniestro', 'Siniestro', 'Reporte de siniestro. Selecciona el tipo:', [
            { id: 'col', label: 'Colisión', next: 'siniestro_colision' },
            { id: 'rt', label: 'Robo Total', next: 'siniestro_robo_total' },
            { id: 'rp', label: 'Robo Parcial', next: 'siniestro_robo_parcial' },
            { id: 'post', label: 'Postergar', next: 'siniestro_postergar' },
            { id: 'back', label: 'Volver', next: 'menu_aseguradora' },
        ]),
        buildAseguradoraSiniestroNodes(),
    );
}

function buildComercial() {
    return merge(
        menuNode('asistencias_vip', '3 - Asistencias VIP - Inicio', 'Asistencias VIP:', [
            { id: 'si', label: 'Sí', next: 'vip_intro_load' },
            { id: 'no', label: 'No', next: LUCY_HOME_NODE },
        ]),
        {
            vip_intro_load: {
                jelou: '3 - Asistencias VIP - Inicio',
                skipSay: true,
                com: { enter: 'vip_info', afterVipInfo: 'vip_codigo' },
            },
            vip_codigo: {
                jelou: '3 - Asistencias VIP - Inicio',
                say: ['Ingresa el **código exclusivo** que recibiste (ej: VCX893).'],
                input: { next: 'vip_codigo_load', echoUser: true, comField: 'codigo_vip' },
            },
            vip_codigo_load: {
                skipSay: true,
                com: { enter: 'vip_codigo_stub', afterVipInfo: 'vip_registro_empresa' },
            },
            vip_registro_empresa: {
                say: ['Escribe el nombre de tu **empresa**.'],
                input: { next: 'vip_registro_cargo', echoUser: true, comField: 'empresa' },
            },
            vip_registro_cargo: {
                say: ['Escribe tu **cargo** en la empresa.'],
                input: { next: 'vip_registro_done', echoUser: true, comField: 'cargo' },
            },
            vip_registro_done: {
                say: [
                    '✅ Datos de registro VIP guardados en esta sesión.',
                    'La activación final (afiliación Omniax) se completa en WhatsApp con el mismo código.',
                ],
                actions: standardExitActions(),
            },
        },
        menuNode('servicios_proteccion', '4 - Servicios Protección - Inicio', 'Servicios de protección:', [
            { id: 'si', label: 'Sí', next: 'leaf_proteccion' },
            { id: 'no', label: 'No', next: LUCY_HOME_NODE },
        ]),
        menuNode('activar_edoctor_inicio', 'Activar e-doctor - Inicio', 'E-Doctor:', [
            { id: 'plan', label: 'Adquirir plan', next: 'edoctor_registro' },
            { id: 'info', label: 'Quiero más info.', next: 'edoctor_info' },
        ]),
        {
            edoctor_info: {
                jelou: 'Activar e-doctor - Quiero Más Información',
                say: ['Registrando tu solicitud de información sobre **e-doctor**…'],
                skipSay: true,
                com: {
                    enter: 'derivacion_asesor',
                    producto: 'E-doctor',
                    notas: 'Activar e-doctor - Quiero más información',
                    afterDerivacion: 'edoctor_info_done',
                },
            },
            edoctor_info_done: {
                jelou: 'Activar e-doctor - Quiero Más Información',
                say: [
                    '**E-doctor** es telemedicina GEA: consultas médicas en línea.',
                    'App: bit.ly/app-e-doctor — Web: https://www.e-doctorgea.com/',
                    'Para contratar el plan, vuelve al menú E-doctor y elige **Adquirir plan**.',
                ],
                actions: standardExitActions('menu_solucion_24_7'),
            },
            edoctor_registro: {
                jelou: 'Activar e-doctor - Registrar Datos',
                say: ['Ingresa tu **correo electrónico**:'],
                input: { next: 'edoctor_pago_load', echoUser: true, comField: 'email_edoctor' },
            },
            edoctor_pago_load: {
                jelou: 'Activar e-doctor -  Solicitud de Pago',
                skipSay: true,
                com: {
                    enter: 'pay_checkout',
                    payProduct: 'edoctor',
                    afterPayOk: 'edoctor_confirm',
                    afterPayFail: 'activar_edoctor_inicio',
                },
            },
            edoctor_confirm: {
                jelou: 'Activar e-doctor - Confirmacion',
                say: [
                    'Cuando el pago se confirme, recibirás instrucciones para usar e-doctor.',
                    'App: bit.ly/app-e-doctor — Web: https://www.e-doctorgea.com/',
                ],
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('compra_viaja', 'Asis. Compra y Viaja Seguro - Inicio', 'Compra y viaja seguro:', [
            { id: 'go', label: 'Empezar', next: 'compra_viaja_pago_load' },
        ]),
        {
            compra_viaja_pago_load: {
                jelou: 'Asis. Compra y Viaja Seguro - Solicitud de Pago',
                skipSay: true,
                com: {
                    enter: 'pay_checkout',
                    payProduct: 'viaja',
                    afterPayOk: 'compra_viaja_ok',
                    afterPayFail: 'compra_viaja',
                },
            },
            compra_viaja_ok: {
                jelou: 'Asis. Compra y Viaja Seguro - Confirmación',
                say: ['Gracias. Tras el pago, tu activación se procesará como en WhatsApp.'],
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('asistencia_inmediata', 'Asistencia Inmediata - Inicio', 'Asistencia inmediata:', [
            { id: 'go', label: 'Continuar', next: 'inmediata_pago_load' },
        ]),
        {
            inmediata_pago_load: {
                jelou: 'Asistencia Inmediata - Solicitud de Pago',
                skipSay: true,
                com: {
                    enter: 'pay_checkout',
                    payProduct: 'inmediata',
                    afterPayOk: 'inmediata_ok',
                    afterPayFail: 'asistencia_inmediata',
                },
            },
            inmediata_ok: {
                jelou: 'Asistencia Inmediata - Confirmación',
                say: ['Tu solicitud de asistencia inmediata continúa tras confirmar el pago.'],
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('pycca', 'Asistencia Cuidado Familiar Pycca - Inicio', 'Cuidado familiar Pycca:', [
            { id: 'con', label: 'Contratar', next: 'leaf_pycca' },
            { id: 'lla', label: 'Quiero que me llamen', next: 'pycca_llamada_load' },
        ]),
        {
            leaf_pycca: {
                jelou: 'Asistencia Cuidado Familiar Pycca - Inicio',
                say: ['Registrando tu solicitud de **Cuidado familiar Pycca**…'],
                skipSay: true,
                com: {
                    enter: 'derivacion_asesor',
                    producto: 'Pycca Cuidado familiar',
                    notas: 'Pycca - Contratar',
                    afterDerivacion: 'leaf_pycca_done',
                },
            },
            leaf_pycca_done: {
                jelou: 'Asistencia Cuidado Familiar Pycca - Inicio',
                say: advisorHandoffSay('comercial'),
                actions: standardExitActions('menu_solucion_24_7'),
            },
            pycca_llamada_load: {
                jelou: 'Asistencia Cuidado Familiar Pycca - Inicio',
                skipSay: true,
                com: {
                    enter: 'derivacion_asesor',
                    producto: 'Pycca Cuidado familiar',
                    notas: 'Pycca - Quiero que me llamen',
                    afterDerivacion: 'pycca',
                },
            },
        },
        menuNode('banco_bolivariano', 'Bco Bolivariano - Venta Asistencia - Inicio', 'Banco Bolivariano — venta:', [
            { id: 'on', label: 'Comprar online', next: 'leaf_banco' },
            { id: 'llam', label: 'Agendar una llamada', next: 'leaf_banco_llamada' },
        ]),
        {
            leaf_banco: {
                jelou: 'Bco Bolivariano - Venta Asistencia - Inicio',
                say: ['Registrando tu solicitud de **compra online**…'],
                skipSay: true,
                com: {
                    enter: 'derivacion_asesor',
                    producto: 'Banco Bolivariano',
                    notas: 'Bco Bolivariano - Comprar online',
                    afterDerivacion: 'leaf_banco_done',
                },
            },
            leaf_banco_done: {
                jelou: 'Bco Bolivariano - Venta Asistencia - Inicio',
                say: advisorHandoffSay('comercial'),
                actions: standardExitActions('menu_solucion_24_7'),
            },
            leaf_banco_llamada: {
                jelou: 'Bco Bolivariano - Venta Asistencia - Inicio',
                say: ['Registrando tu solicitud para **agendar una llamada**…'],
                skipSay: true,
                com: {
                    enter: 'derivacion_asesor',
                    producto: 'Banco Bolivariano',
                    notas: 'Bco Bolivariano - Agendar llamada',
                    afterDerivacion: 'leaf_banco_llamada_done',
                },
            },
            leaf_banco_llamada_done: {
                jelou: 'Bco Bolivariano - Venta Asistencia - Inicio',
                say: advisorHandoffSay('comercial'),
                actions: standardExitActions('menu_solucion_24_7'),
            },
        },
        menuNode('jaher', 'Jaher - Inicio', 'Jaher:', [
            { id: 'go', label: 'Empezar', next: 'leaf_jaher' },
        ]),
        { leaf_jaher: stubRegistered('Jaher', 'Jaher - Inicio') },
    );
}

function buildUtils() {
    return merge(
        menuNode('menu_utilidades', 'Error General', 'Utilidades del sistema:', [
            { id: 'enc', label: 'Encuesta de satisfacción', next: 'gea_encuesta_id' },
            { id: 'ree', label: 'Reenviar evaluación (HSM)', next: 'gea_reeval_id' },
            { id: 'ecf', label: 'Confirmar evaluación', next: 'gea_eval_conf_id' },
            { id: 'ubi', label: 'Actualizar ubicación asistencia', next: 'gea_ubicacion_id' },
            { id: 'mant', label: 'Mantenimiento', next: 'mantenimiento' },
            { id: 'err', label: 'Error general', next: 'error_general' },
            { id: 'exp', label: 'Expiración sesión', next: 'expiracion' },
            { id: 'adios', label: 'Adiós', next: 'adios' },
            { id: 'des', label: 'Desvincular', next: 'desvincular' },
            { id: 'pma', label: 'PMA', next: 'pma' },
            { id: 'pma_r', label: 'PMA Retención', next: 'pma_retencion' },
            { id: 'prov', label: 'Menú oculto proveedores', next: 'menu_proveedores' },
            { id: 'dev', label: 'Dev / pruebas', next: 'menu_dev' },
            { id: 'com', label: 'Comercial (viaja / inmediata / pycca / banco)', next: 'menu_comercial_extra' },
        ]),
        {
            mantenimiento: {
                jelou: 'Mantenimiento',
                say: ['🔧 Lucy está en mantenimiento. Intenta más tarde.'],
                actions: [{ id: 'back', label: 'Volver', next: 'menu_utilidades' }],
            },
            error_general: {
                jelou: 'Error General',
                say: ['Ocurrió un error inesperado (simulado).'],
                actions: standardExitActions(),
            },
            expiracion: {
                jelou: 'Expiracion',
                say: ['Tu sesión expiró. Escribe "Empezar" para reiniciar.'],
                actions: [{ id: 'start', label: 'Empezar', next: 'auth_telefono' }],
            },
            adios: {
                jelou: 'Adios',
                say: ['Gracias por usar Lucy. ¡Hasta pronto!'],
                actions: [{ id: 'start', label: 'Empezar', next: 'auth_telefono' }],
            },
            desvincular: stubRegistered('Desvinculación', 'Desvincular', 'menu_utilidades'),
            pma: stubRegistered('PMA', 'PMA', 'menu_utilidades'),
            pma_retencion: stubRegistered('PMA Retención', 'PMA - Retención', 'menu_utilidades'),
        },
        menuNode('menu_proveedores', 'Menú oculto proveedores', 'Proveedor:', [
            { id: 'c', label: 'Marcación de contacto', next: 'gea_prov_contacto_id' },
            { id: 't', label: 'Marcación de término', next: 'gea_prov_termino_id' },
            { id: 'f', label: 'Ingreso de fotografías', next: 'leaf_prov_fotos' },
        ]),
        {
            leaf_prov_fotos: stubRegistered('Fotos proveedor', 'Menú oculto proveedores'),
        },
        menuNode('menu_dev', 'Dev Gea', 'Entorno de desarrollo:', [
            { id: 'd1', label: 'Dev Gea', next: 'leaf_dev_gea' },
            { id: 'd2', label: 'pruebas Lucy', next: 'leaf_pruebas' },
            { id: 'd3', label: 'PMA equipo Lucy', next: 'leaf_pma_equipo' },
        ]),
        {
            leaf_dev_gea: stubRegistered('Dev Gea', 'Dev Gea'),
            leaf_pruebas: stubRegistered('Pruebas Lucy', 'pruebas Lucy'),
            leaf_pma_equipo: stubRegistered('PMA equipo', 'PMA - equipo lucy'),
        },
        menuNode('menu_comercial_extra', 'Información', 'Productos adicionales:', [
            { id: 'cv', label: 'Compra y viaja seguro', next: 'compra_viaja' },
            { id: 'ai', label: 'Asistencia inmediata', next: 'asistencia_inmediata' },
            { id: 'py', label: 'Pycca', next: 'pycca' },
            { id: 'bb', label: 'Banco Bolivariano', next: 'banco_bolivariano' },
            { id: 'jh', label: 'Jaher', next: 'jaher' },
            { id: 'inf', label: 'Información productos', next: 'info_productos' },
        ]),
        {
            info_productos: stubRegistered('Información productos', 'Informacion productos'),
        },
        menuNode('ia_router', 'IA Router', 'IA Router — ¿Cómo deseas continuar?', [
            { id: 'reg', label: 'Registro', next: 'auth_telefono' },
            { id: 'terms', label: 'Aceptar términos IA', next: 'ia_router_terms_load' },
            { id: 'sin', label: 'Sin registro', next: LUCY_HOME_NODE },
        ]),
    );
}

function buildHsm() {
    const nodes = {
        hsm_root: {
            jelou: 'HSM (plantillas)',
            say: [
                'Simulador de entradas HSM (mensajes que en WhatsApp llegan por plantilla).',
                'Elige una categoría:',
            ],
            actions: HSM_CATEGORIES.map((c) => ({
                id: c.id,
                label: c.label,
                next: c.id,
            })),
        },
    };

    for (const cat of HSM_CATEGORIES) {
        nodes[cat.id] = {
            jelou: cat.label,
            say: [`Categoría: ${cat.label}`],
            actions: [
                ...cat.items.map((name) => ({
                    id: `hsm_${slugify(name)}`,
                    label: name.length > 36 ? `${name.slice(0, 33)}…` : name,
                    next: `hsm_item_${slugify(name)}`,
                })),
                { id: 'back', label: '← Categorías HSM', next: 'hsm_root' },
            ],
        };
        for (const name of cat.items) {
            const id = `hsm_item_${slugify(name)}`;
            const actions = [
                { id: 'si', label: 'Sí', next: 'hsm_leaf_ok' },
                { id: 'no', label: 'No', next: 'hsm_leaf_ok' },
                { id: 'emp', label: 'Empezar', next: 'hsm_leaf_ok' },
                { id: 'back', label: '← Volver', next: cat.id },
            ];
            nodes[id] = {
                jelou: name,
                say: [
                    `📩 **[Simulación HSM]**`,
                    `Flujo Jelou: ${name}`,
                    'En WhatsApp este mensaje abriría la webview o continuaría en chat.',
                    'Responde como lo haría el usuario en la plantilla:',
                ],
                actions,
            };
        }
    }
    nodes.hsm_leaf_ok = {
        jelou: 'HSM',
        say: ['✅ Respuesta registrada (simulación).'],
        actions: [
            { id: 'hsm', label: 'Más HSM', next: 'hsm_root' },
            { id: 'menu', label: 'Menú principal', next: LUCY_HOME_NODE },
        ],
    };
    return nodes;
}

/** Grafo completo navegable (sin APIs) */
export const LUCY_FLOW_NODES = merge(
    buildCore(),
    buildSolucion247(),
    buildAseguradora(),
    buildComercial(),
    buildUtils(),
    buildHsm(),
    buildIaNodes(),
    buildOmniaxMedicoNodes(),
    buildOmniaxDentalNodes(),
);

export const LUCY_ENTRY_NODE = 'auth_telefono';

export const JELOU_SKILL_INDEX = Object.values(LUCY_FLOW_NODES)
    .map((n) => n.jelou)
    .filter(Boolean);
