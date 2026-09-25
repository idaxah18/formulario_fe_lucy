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

/** Menú estándar al final de un subflujo */
export function standardExitActions(returnNode = 'menu_solucion_24_7') {
    return [
        { id: 'exit_menu', label: 'Menú principal', next: 'menu_principal' },
        { id: 'exit_solucion', label: '0. Salir del menú', next: returnNode },
    ];
}

export function stubRegistered(serviceLabel, jelouRef, returnNode = 'menu_solucion_24_7') {
    return {
        jelou: jelouRef,
        say: [
            `✅ Simulación: tu solicitud de **${serviceLabel}** fue registrada.`,
            'En WhatsApp un asesor o proveedor continuaría el proceso por este chat.',
            '(Sin integración API en esta webview de prueba.)',
        ],
        actions: standardExitActions(returnNode),
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
    const { idServicio = null, requiresPlaca = false } = options;
    const base = slugify(`${jelouRef}_${serviceLabel}`);
    const locId = `asist_loc_${base}`;
    const dirId = `asist_dir_${base}`;
    const doneId = `asist_done_${base}`;
    const placaId = `asist_placa_${base}`;

    const entry = requiresPlaca ? placaId : locId;
    const nodes = {};

    if (requiresPlaca) {
        nodes[placaId] = {
            jelou: jelouRef,
            say: [
                `Servicio: **${serviceLabel}**`,
                'Por favor envíame el número de la placa de tu vehículo o moto (ej: GYE1234).',
            ],
            input: { field: 'plate', next: locId, echoUser: true },
        };
    }

    nodes[locId] = {
        jelou: jelouRef,
        say: [
            ...(requiresPlaca ? [] : [`Servicio: **${serviceLabel}**`]),
            'Por favor compárteme la ubicación del lugar donde se brindará el servicio 📍',
        ],
        actions: [
            { id: 'share_location', label: '📍 Compartir ubicación', type: 'location', next: dirId },
        ],
    };

    nodes[dirId] = {
        jelou: 'V2 Crear asistencia',
        say: ['Ahora escribe la dirección o una referencia de esta ubicación.'],
        input: { next: doneId, echoUser: true, geaField: 'direccion' },
    };

    nodes[doneId] = {
        jelou: 'V2 Crear asistencia',
        say: ['Registrando tu solicitud de asistencia…'],
        skipSay: true,
        gea: {
            enter: 'crear',
            idServicio,
            serviceLabel,
            afterCrearNext: 'gea_crear_exit',
        },
    };

    return { entry, nodes };
}
