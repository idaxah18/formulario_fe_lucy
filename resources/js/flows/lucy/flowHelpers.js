import { resolveIdServicioCrearGea } from './gea/geaServiceIds.js';

export function slugify(text) {
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 48);
}

export function bot(text) {
    return { role: 'bot', text, at: new Date() };
}

export function user(text) {
    return { role: 'user', text, at: new Date() };
}

/** Home del bot (Solución 24/7). Reemplaza el antiguo menú raíz `choose_plan`. */
export const LUCY_HOME_NODE = 'menu_solucion_24_7';

/** Nodos legacy del menú raíz (ocultos); `enterNode` redirige a {@link LUCY_HOME_NODE}. */
export const LUCY_LEGACY_ROOT_NODES = ['choose_plan', 'menu_principal'];

/** Menú estándar al final de un subflujo */
export function standardExitActions(returnNode = LUCY_HOME_NODE) {
    if (returnNode === LUCY_HOME_NODE) {
        return [{ id: 'exit_menu', label: 'Menú principal', next: LUCY_HOME_NODE }];
    }
    return [
        { id: 'exit_solucion', label: 'Salir del menú', next: returnNode },
        { id: 'exit_menu', label: 'Menú principal', next: LUCY_HOME_NODE },
    ];
}

/** Tras derivación comercial: dock “jugoso” + volver al submenú anterior. */
export function advisorHandoffMenuActions(returnNode) {
    return [
        {
            id: 'back',
            label: 'Volver',
            next: returnNode,
            icon: 'arrow-left',
            menuTone: 'tone-blue',
        },
        {
            id: 'exit_menu',
            label: 'Menú principal',
            next: LUCY_HOME_NODE,
            icon: 'home',
            menuTone: 'tone-blue',
        },
    ];
}

export function stubRegistered(serviceLabel, jelouRef, returnNode = 'menu_solucion_24_7') {
    return {
        jelou: jelouRef,
        say: [
            `Tu solicitud de **${serviceLabel}** fue registrada.`,
            'Un asesor continuará contigo por este chat.',
        ],
        actions: standardExitActions(returnNode),
    };
}

/** Pantalla antes de Notificar Cabina (dock jugoso + botón continuar). */
export function buildCabinaPrefaceNode(prefaceId, loadNodeId, prefaceKind = 'servicio', serviceLabel = '') {
    const isCita = String(prefaceKind).startsWith('cita');
    return {
        jelou: 'Notificar Cabina Asistencia en Proceso',
        skipSay: true,
        cabinaPreface: prefaceKind,
        ...(serviceLabel ? { serviceLabel } : {}),
        actions: [
            {
                id: 'go',
                label: isCita ? 'Continuar' : 'Registrar mi solicitud',
                next: loadNodeId,
                icon: 'check',
                menuTone: 'tone-blue',
            },
        ],
    };
}

export function wizardTextSteps(steps, jelouRef, returnNode) {
    const nodes = {};
    steps.forEach((step, i) => {
        const id = `wiz_${slugify(jelouRef)}_${i}`;
        const nextId =
            i < steps.length - 1 ? `wiz_${slugify(jelouRef)}_${i + 1}` : `leaf_${slugify(jelouRef)}`;
        nodes[id] = {
            jelou: jelouRef,
            say: [step.prompt],
            input: { next: nextId, echoUser: true },
        };
    });
    nodes[`leaf_${slugify(jelouRef)}`] = stubRegistered(jelouRef, jelouRef, returnNode);
    return nodes;
}

export function crearAsistenciaChain(
    serviceLabel,
    jelouRef,
    returnNode = 'menu_solucion_24_7',
    options = {},
) {
    const {
        idServicio: idServicioOpt = null,
        requiresPlaca = false,
        skipLocation = false,
        sinUbicacion = false,
        tipoServicio = 'HOGAR',
        planAsistencia = 'ASISTENCIAS',
        crearJelouRef = 'V2 Crear asistencia',
        afterCrearNext = 'gea_crear_exit',
        skipCabinaPreface = false,
    } = options;
    const idServicio = resolveIdServicioCrearGea(serviceLabel, idServicioOpt);
    if (!idServicio) {
        throw new Error(`Falta id_servicio GEA en geaServiceIds para «${serviceLabel}».`);
    }
    const base = slugify(`${jelouRef}_${serviceLabel}`);
    const locId = `asist_loc_${base}`;
    const dirId = `asist_dir_${base}`;
    const prefaceId = `asist_preface_${base}`;
    const cabinaLoadId = `asist_cabina_${base}`;
    const placaId = `asist_placa_${base}`;

    let entry = locId;
    if (requiresPlaca) entry = placaId;
    else if (skipLocation) entry = prefaceId;
    const nodes = {};

    const afterPlaca = skipLocation ? prefaceId : locId;

    if (requiresPlaca) {
        nodes[placaId] = {
            jelou: jelouRef,
            say: [
                `Servicio: **${serviceLabel}**`,
                'Por favor envíame el número de la placa de tu vehículo o moto (ej: GYE1234).',
            ],
            input: { field: 'plate', next: afterPlaca, echoUser: true },
        };
    }

    const geaTrail = {
        serviceLabel,
        tipoServicio,
        exitReturnMenu: returnNode,
    };

    if (!skipLocation) {
        nodes[locId] = {
            jelou: jelouRef,
            say: [
                ...(requiresPlaca ? [] : [`Servicio: **${serviceLabel}**`]),
                'Por favor compárteme la ubicación del lugar donde se brindará el servicio 📍',
            ],
            actions: [
                { id: 'share_location', label: '📍 Compartir ubicación', type: 'location', next: dirId },
            ],
            gea: geaTrail,
        };

        nodes[dirId] = {
            jelou: crearJelouRef,
            say: ['Ahora escribe la dirección o una referencia de esta ubicación.'],
            input: {
                next: skipCabinaPreface ? cabinaLoadId : prefaceId,
                echoUser: true,
                geaField: 'direccion',
            },
            gea: geaTrail,
        };
    }

    if (!skipCabinaPreface) {
        const prefaceNode = buildCabinaPrefaceNode(prefaceId, cabinaLoadId, 'servicio', serviceLabel);
        prefaceNode.gea = geaTrail;
        nodes[prefaceId] = prefaceNode;
    }

    nodes[cabinaLoadId] = {
        jelou: crearJelouRef,
        say: ['Registrando tu solicitud de asistencia…'],
        skipSay: true,
        gea: {
            enter: 'cabina_gate',
            idServicio,
            serviceLabel,
            tipoServicio,
            planAsistencia,
            sinUbicacion,
            afterCrearNext,
            exitReturnMenu: returnNode,
            ...geaTrail,
        },
    };

    return { entry, nodes };
}
