import { slugify } from '../flowHelpers.js';
import { resolveAutomaticoConfig } from './automaticoCatalog.js';
import { AUTO_COPY } from './automaticoFlowCopy.js';
import {
    getAutomaticoEarlyQuestionPlan,
    getAutomaticoLateQuestionPlan,
    HOGAR_DOMICILIO_PERMANENTE,
} from './automaticoQuestions.js';
import { resolveGeaIdServicio } from './geaServiceIds.js';

function geaAutoMeta(serviceLabel, jelouRef) {
    const automatico = resolveAutomaticoConfig(serviceLabel, jelouRef);
    /** POST /asistencias/gea (cabina). No usar id proceso-automatico (ej. 159). */
    const idServicio = resolveGeaIdServicio(serviceLabel);
    if (!idServicio) {
        throw new Error(
            `Falta id_servicio GEA (cabina) en geaServiceIds para «${serviceLabel}».`,
        );
    }
    return {
        serviceLabel,
        jelouRef,
        tipoServicio: automatico.tipo_servicio,
        planAsistencia: automatico.plan_asistencia,
        idServicio,
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

function chainQuestions(plan, base, meta, nextId, nodes) {
    let next = nextId;
    for (let i = plan.length - 1; i >= 0; i--) {
        const q = plan[i];
        const qId = `auto_preg_${base}_${q.id}`;
        nodes[qId] = questionNode(q, qId, next, meta);
        next = qId;
    }
    return next;
}

/** Pipeline Hogar/Vial — LUCY_V3 (preguntas → S1/S2 → timing → ubicación → S3 → late → S5). */
export function crearAutomaticoChain(serviceLabel, jelouRef, returnNode = 'menu_solucion_24_7') {
    const base = slugify(`${jelouRef}_${serviceLabel}`);
    const meta = geaAutoMeta(serviceLabel, jelouRef);
    meta.exitReturnMenu = returnNode;
    meta.chainBase = base;
    const cfg = meta.automatico;

    const timingId = `auto_timing_${base}`;
    const progFechaId = `auto_prog_fecha_${base}`;
    const progHoraId = `auto_prog_hora_${base}`;
    const progLinkId = `auto_prog_link_${base}`;
    const preCrearGateId = `auto_pre_crear_gate_${base}`;
    const placaId = `auto_placa_${base}`;
    const afiliacionId = `auto_afiliacion_${base}`;
    const vehiculoId = `auto_vehiculo_${base}`;
    const vehiculoPickId = `auto_vehiculo_pick_${base}`;
    const tipoVehiculoGateId = `auto_tipo_vehiculo_gate_${base}`;
    const tipoVehiculoMenuId = `auto_tipo_vehiculo_pick_${base}`;
    const vehDatosGateId = `auto_veh_datos_gate_${base}`;
    const vehMarcaId = `auto_veh_marca_${base}`;
    const vehModeloId = `auto_veh_modelo_${base}`;
    const vehAnioId = `auto_veh_anio_${base}`;
    const telId = `auto_tel_${base}`;
    const locId = `auto_loc_${base}`;
    const dirId = `auto_dir_${base}`;
    const hogarDomicilioId = `auto_hogar_domicilio_${base}`;
    const hogarProblemaId = `auto_hogar_problema_${base}`;
    const ubicacionId = `auto_ubicacion_${base}`;
    const coberturaId = `auto_cobertura_${base}`;
    const combustibleTipoId = `auto_combustible_tipo_${base}`;
    const combustibleId = `auto_combustible_${base}`;
    const coordsId = `auto_coords_${base}`;
    const crearId = `auto_crear_${base}`;
    const cabinaRouteId = `auto_cabina_route_${base}`;
    const locCabinaId = `auto_loc_cabina_${base}`;
    const dirCabinaId = `auto_dir_cabina_${base}`;
    const cabinaCrearId = `auto_cabina_crear_${base}`;

    const afterCoberturaCombustible = cfg.requiresCombustible
        ? combustibleTipoId
        : cfg.requiresCoordValidation
            ? coordsId
            : preCrearGateId;
    const afterCombustible = cfg.requiresCoordValidation ? coordsId : preCrearGateId;
    const afterCoords = preCrearGateId;

    const isHogar = cfg.tipo_servicio === 'HOGAR';
    const afterDir = isHogar ? hogarDomicilioId : cfg.requiresUbicacionApi ? ubicacionId : coberturaId;
    const afterProgUbicacion = isHogar ? hogarDomicilioId : coberturaId;

    if (cfg.requiresVehiculo) {
        meta.vehMarcaNodeId = vehMarcaId;
        meta.vehModeloNodeId = vehModeloId;
        meta.vehAnioNodeId = vehAnioId;
        meta.vehDatosGateId = vehDatosGateId;
    }

    const nodes = {};

    const afterLate = afterCoberturaCombustible;
    const afterCobertura = chainQuestions(
        getAutomaticoLateQuestionPlan(serviceLabel),
        base,
        meta,
        afterLate,
        nodes,
    );

    nodes[timingId] = {
        jelou: jelouRef,
        say: [`Servicio: **${serviceLabel}**`, ...AUTO_COPY.timing.say],
        actions: [
            {
                id: 'ahora',
                label: AUTO_COPY.timing.ahora,
                next: locId,
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
        input: { next: progLinkId, echoUser: true, geaField: 'hora_programada' },
        gea: meta,
    };

    nodes[progLinkId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.programadoLinkIntro, AUTO_COPY.programadoLinkHint],
        actions: [
            {
                id: 'share_location',
                label: AUTO_COPY.ubicacionBtn,
                type: 'location',
                next: dirId,
            },
            {
                id: 'continue',
                label: AUTO_COPY.programadoLinkContinue,
                next: afterProgUbicacion,
            },
        ],
        gea: meta,
    };

    const afterAfiliacion = cfg.requiresVehiculo ? vehiculoId : timingId;
    const afterTel = afiliacionId;
    const afterEarly = chainQuestions(
        getAutomaticoEarlyQuestionPlan(serviceLabel),
        base,
        meta,
        cfg.requiresPlaca ? placaId : afterTel,
        nodes,
    );
    const entry = afterEarly;

    if (cfg.requiresPlaca) {
        nodes[placaId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.placa],
            input: { field: 'plate', next: afterTel, echoUser: true },
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
        say: [AUTO_COPY.cabinaRuta],
        actions: [{ id: 'ok', label: 'Continuar', next: locCabinaId }],
        gea: { ...meta, cabinaFromAutomatico: true },
    };

    nodes[locCabinaId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.ubicacion],
        actions: [
            { id: 'share_location', label: AUTO_COPY.ubicacionBtn, type: 'location', next: dirCabinaId },
        ],
        gea: meta,
    };

    nodes[dirCabinaId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.direccion],
        input: { next: cabinaCrearId, echoUser: true, geaField: 'direccion' },
        gea: meta,
    };

    nodes[cabinaCrearId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.creandoCabina],
        skipSay: true,
        gea: {
            enter: 'cabina_gate',
            idServicio: meta.idServicio,
            serviceLabel: meta.serviceLabel,
            tipoServicio: meta.tipoServicio,
            planAsistencia: meta.planAsistencia,
            aplica_servicio_automatico: 0,
            afterCrearNext: 'gea_crear_exit',
            jelouRef: meta.jelouRef,
            chainBase: meta.chainBase,
            cabinaFromAutomatico: true,
        },
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
                refreshMenuEnter: 'auto_vehiculo',
                afterAutoNext: tipoVehiculoGateId,
                afterVehiculoPickNext: vehiculoPickId,
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
                afterAutoNext: vehDatosGateId,
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
                refreshMenuEnter: 'auto_tipo_vehiculo_gate',
                afterAutoNext: vehDatosGateId,
                afterTipoVehiculoMenuNext: tipoVehiculoMenuId,
                ...meta,
            },
        };
        nodes[vehDatosGateId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.validandoVehiculo],
            skipSay: true,
            gea: {
                enter: 'auto_veh_datos_gate',
                afterAutoNext: timingId,
                vehMarcaNodeId: vehMarcaId,
                vehModeloNodeId: vehModeloId,
                vehAnioNodeId: vehAnioId,
                ...meta,
            },
        };
        nodes[vehMarcaId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.vehMarca],
            input: { next: vehModeloId, echoUser: true, vehiculoField: 'marca_vehiculo' },
            navAllowBack: true,
            gea: meta,
        };
        nodes[vehModeloId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.vehModelo],
            input: { next: vehAnioId, echoUser: true, vehiculoField: 'modelo_vehiculo' },
            navAllowBack: true,
            gea: meta,
        };
        nodes[vehAnioId] = {
            jelou: jelouRef,
            say: [AUTO_COPY.vehAnio],
            input: { next: timingId, echoUser: true, vehiculoField: 'anio_vehiculo' },
            navAllowBack: true,
            gea: meta,
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
        nodes[hogarDomicilioId] = questionNode(
            HOGAR_DOMICILIO_PERMANENTE,
            hogarDomicilioId,
            hogarProblemaId,
            meta,
        );
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
            afterAutoNext: afterCobertura,
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
            say: [AUTO_COPY.validandoCoordenadas],
            skipSay: true,
            gea: { enter: 'auto_coordenadas', afterAutoNext: afterCoords, ...meta },
        };
    }

    nodes[preCrearGateId] = {
        jelou: jelouRef,
        say: [AUTO_COPY.validandoCoordenadas],
        skipSay: true,
        gea: { enter: 'auto_pre_crear_gate', afterAutoNext: crearId, ...meta },
    };

    nodes[crearId] = {
        jelou: 'Proceso automático — crear asistencia',
        say: [AUTO_COPY.creando],
        skipSay: true,
        gea: { enter: 'auto_crear', afterCrearNext: 'gea_crear_exit', ...meta },
    };

    return { entry, nodes };
}

export function automaticoChainEntry(jelouRef, serviceLabel) {
    return crearAutomaticoChain(serviceLabel, jelouRef).entry;
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
