import { slugify } from '../flowHelpers.js';
import { resolveAutomaticoConfig } from './automaticoCatalog.js';
import { AUTO_COPY } from './automaticoFlowCopy.js';
import { getAutomaticoQuestionPlan } from './automaticoQuestions.js';

function geaAutoMeta(serviceLabel, jelouRef) {
    const automatico = resolveAutomaticoConfig(serviceLabel, jelouRef);
    return {
        serviceLabel,
        jelouRef,
        tipoServicio: automatico.tipo_servicio,
        planAsistencia: automatico.plan_asistencia,
        automatico,
    };
}

function questionNode(q, nodeId, nextId, meta) {
    return {
        jelou: meta.jelouRef,
        say: [q.say],
        actions: q.actions.map((a) => ({
            id: a.id,
            label: a.label,
            next: a.cabina ? `auto_cabina_route_${meta.chainBase}` : nextId,
            meta: {
                gea: {
                    autoPreguntaRecord: {
                        pregunta: q.say.replace(/\*\*/g, ''),
                        respuesta: a.label,
                        aplicaAutomatico: a.aplicaAutomatico !== false,
                    },
                    ...(a.meta || {}),
                },
            },
        })),
        gea: meta,
    };
}

/** Pipeline idéntico Hogar/Vial (diagrama Lucy); ramas solo por placa/vehículo y preguntas por servicio. */
export function crearAutomaticoChain(serviceLabel, jelouRef, returnNode = 'menu_solucion_24_7') {
    const base = slugify(`${jelouRef}_${serviceLabel}`);
    const meta = geaAutoMeta(serviceLabel, jelouRef);
    meta.chainBase = base;
    const cfg = meta.automatico;

    const timingId = `auto_timing_${base}`;
    const progFechaId = `auto_prog_fecha_${base}`;
    const progHoraId = `auto_prog_hora_${base}`;
    const placaId = `auto_placa_${base}`;
    const afiliacionId = `auto_afiliacion_${base}`;
    const vehiculoId = `auto_vehiculo_${base}`;
    const vehiculoPickId = `auto_vehiculo_pick_${base}`;
    const tipoVehiculoGateId = `auto_tipo_vehiculo_gate_${base}`;
    const tipoVehiculoMenuId = `auto_tipo_vehiculo_pick_${base}`;
    const telId = `auto_tel_${base}`;
    const locId = `auto_loc_${base}`;
    const dirId = `auto_dir_${base}`;
    const hogarProblemaId = `auto_hogar_problema_${base}`;
    const ubicacionId = `auto_ubicacion_${base}`;
    const coberturaId = `auto_cobertura_${base}`;
    const combustibleTipoId = `auto_combustible_tipo_${base}`;
    const combustibleId = `auto_combustible_${base}`;
    const coordsId = `auto_coords_${base}`;
    const crearId = `auto_crear_${base}`;
    const cabinaRouteId = `auto_cabina_route_${base}`;

    const afterUbicacion = coberturaId;
    const afterCoberturaCombustible = cfg.requiresCombustible ? combustibleTipoId : coordsId;
    const afterCombustible = cfg.requiresCoordValidation ? coordsId : crearId;
    const afterCoords = crearId;

    const isHogar = cfg.tipo_servicio === 'HOGAR';
    let afterDir = isHogar ? hogarProblemaId : cfg.requiresUbicacionApi ? ubicacionId : coberturaId;

    const nodes = {};

    let entry = timingId;

    nodes[timingId] = {
        jelou: jelouRef,
        say: [`Servicio: **${serviceLabel}**`, ...AUTO_COPY.timing.say],
        actions: [
            {
                id: 'ahora',
                label: AUTO_COPY.timing.ahora,
                next: cfg.requiresPlaca ? placaId : telId,
                meta: { gea: { esProgramado: 0 } },
            },
            {
                id: 'prog',
                label: AUTO_COPY.timing.programada,
                next: progFechaId,
                meta: { gea: { esProgramado: 1 } },
            },
        ],
        gea: meta,
    };

    nodes[progFechaId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.programadaFecha],
        input: { next: progHoraId, echoUser: true, geaField: 'fecha_programada' },
        gea: meta,
    };
    nodes[progHoraId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.programadaHora],
        input: { next: cfg.requiresPlaca ? placaId : telId, echoUser: true, geaField: 'hora_programada' },
        gea: meta,
    };

    const questionPlan = getAutomaticoQuestionPlan(serviceLabel);
    let afterAfiliacion = cfg.requiresVehiculo ? vehiculoId : locId;
    let pregNext = telId;
    for (let i = questionPlan.length - 1; i >= 0; i--) {
        const q = questionPlan[i];
        const qId = `auto_preg_${base}_${q.id}`;
        nodes[qId] = questionNode(q, qId, pregNext, meta);
        pregNext = qId;
    }
    const afterPlacaOrTiming = pregNext;
    nodes[timingId].actions[0].next = cfg.requiresPlaca ? placaId : afterPlacaOrTiming;
    nodes[progHoraId].input.next = cfg.requiresPlaca ? placaId : afterPlacaOrTiming;

    if (cfg.requiresPlaca) {
        nodes[placaId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.placa],
            input: { field: 'plate', next: afterPlacaOrTiming, echoUser: true },
            gea: meta,
        };
    }

    nodes[telId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.confirmarTelefono],
        input: { field: 'telefono', next: afiliacionId, echoUser: true },
        gea: meta,
    };

    nodes[afiliacionId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.validandoAfiliacion],
        skipSay: true,
        gea: { enter: 'auto_afiliacion', afterAutoNext: afterAfiliacion, ...meta },
    };

    nodes[cabinaRouteId] = {
        jelou: jelouRef,
        say: [
            'Según tus respuestas, un **asesor de cabina** debe continuar contigo.',
            'Continuemos con la ubicación para registrar tu solicitud.',
        ],
        actions: [{ id: 'ok', label: 'Continuar', next: locId }],
        gea: meta,
    };

    if (cfg.requiresVehiculo) {
        nodes[vehiculoId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.validandoVehiculo],
            skipSay: true,
            gea: {
                enter: 'auto_vehiculo',
                afterAutoNext: tipoVehiculoGateId,
                afterVehiculoPickNext: vehiculoPickId,
                afterTipoVehiculoMenuNext: tipoVehiculoMenuId,
                ...meta,
            },
        };
        nodes[vehiculoPickId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.vehiculoPick],
            skipSay: true,
            navAllowBack: true,
            useGeaMenu: true,
            gea: {
                afterAutoNext: tipoVehiculoGateId,
                afterTipoVehiculoMenuNext: tipoVehiculoMenuId,
                ...meta,
            },
        };
        nodes[tipoVehiculoGateId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.tipoVehiculo],
            skipSay: true,
            gea: {
                enter: 'auto_tipo_vehiculo_gate',
                afterAutoNext: locId,
                afterTipoVehiculoMenuNext: tipoVehiculoMenuId,
                ...meta,
            },
        };
        nodes[tipoVehiculoMenuId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.tipoVehiculo],
            skipSay: true,
            navAllowBack: true,
            useGeaMenu: true,
            gea: {
                afterAutoNext: locId,
                afterTipoVehiculoMenuNext: tipoVehiculoMenuId,
                ...meta,
            },
        };
    }

    nodes[locId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.ubicacion],
        actions: [
            { id: 'share_location', label: AUTO_COPY.ubicacionBtn, type: 'location', next: dirId },
        ],
        gea: meta,
    };

    nodes[dirId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.direccion],
        input: { next: afterDir, echoUser: true, geaField: 'direccion' },
        gea: meta,
    };

    if (isHogar) {
        nodes[hogarProblemaId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.hogarProblema],
            input: {
                next: coberturaId,
                echoUser: true,
                geaField: 'descripcion_problema',
            },
            gea: meta,
        };
    }

    if (cfg.requiresUbicacionApi) {
        nodes[ubicacionId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.guardandoUbicacion],
            skipSay: true,
            gea: { enter: 'auto_ubicacion', afterAutoNext: coberturaId, ...meta },
        };
    }

    nodes[coberturaId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.verificandoCobertura],
        skipSay: true,
        gea: {
            enter: 'auto_cobertura',
            afterAutoNext: afterCoberturaCombustible,
            afterCoberturaSinAplica: 'derivacion_asesor',
            afterTipoVehiculoMenuNext: cfg.requiresVehiculo ? tipoVehiculoMenuId : undefined,
            ...meta,
        },
    };

    if (cfg.requiresCombustible) {
        nodes[combustibleTipoId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.combustibleTipo],
            actions: [
                { id: 'super', label: 'Súper', next: combustibleId, meta: { gea: { tipoCombustible: 'SUPER', id_tipo_combustible: 1 } } },
                { id: 'extra', label: 'Extra', next: combustibleId, meta: { gea: { tipoCombustible: 'EXTRA', id_tipo_combustible: 4 } } },
                { id: 'diesel', label: 'Diésel', next: combustibleId, meta: { gea: { tipoCombustible: 'DIESEL', id_tipo_combustible: 3 } } },
                { id: 'eco', label: 'Eco / Ecopaís', next: combustibleId, meta: { gea: { tipoCombustible: 'ECO', id_tipo_combustible: 2 } } },
            ],
            gea: meta,
        };
        nodes[combustibleId] = {
            jelou: jelouRef,
            say: ['Validando cobertura de combustible…'],
            skipSay: true,
            gea: { enter: 'auto_combustible', afterAutoNext: afterCombustible, ...meta },
        };
    }

    if (cfg.requiresCoordValidation) {
        nodes[coordsId] = {
            jelou: jelouRef,
            say: ['Validando coordenadas del servicio…'],
            skipSay: true,
            gea: { enter: 'auto_coordenadas', afterAutoNext: afterCoords, ...meta },
        };
    }

    nodes[crearId] = {
        jelou: 'Proceso automático — crear asistencia',
        say: [AUTO_COPY.creando],
        skipSay: true,
        gea: { enter: 'auto_crear', afterCrearNext: 'gea_crear_exit', ...meta },
    };

    return { entry, nodes };
}

export function automaticoChainEntry(jelouRef, serviceLabel) {
    const base = slugify(`${jelouRef}_${serviceLabel}`);
    return `auto_timing_${base}`;
}

export function buildAutomaticoServiceChains(serviceDefs, jelouRef, returnNode) {
    const items = serviceDefs.map((def) => (typeof def === 'string' ? { label: def } : def));
    let nodes = {};
    const actions = [];
    for (const item of items) {
        const label = item.label;
        const chain = crearAutomaticoChain(label, jelouRef, returnNode);
        nodes = { ...nodes, ...chain.nodes };
        const action = { id: slugify(label), label, next: chain.entry };
        if (item.icon) {
            action.icon = item.icon;
            action.menuTone = item.menuTone || 'tone-blue';
        }
        actions.push(action);
    }
    return { nodes, actions };
}
