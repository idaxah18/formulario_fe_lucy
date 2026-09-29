import {
    postAfiliacionAutomatico,
    postAsistenciaAutomatico,
    postCoberturaAutomatico,
    postUbicacionAutomatico,
    postValidacionCombustibleAutomatico,
    postValidacionCoordenadasAutomatico,
    postVehiculoAfiliacionAutomatico,
} from '@/api/proyectosAutomaticoApi.js';
import { LUCY_HOME_NODE, bot } from '../flowHelpers.js';
import { botFromOmniaxResponse } from '../omniax/omniaxNoticias.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import { AUTO_COPY } from './automaticoFlowCopy.js';
import {
    aplicaAutomaticoFlag,
    buildPreguntasRespuestasJson,
} from './automaticoPreguntas.js';
import {
    buildTipoVehiculoMenuActions,
    clearVehiculoTipoCategorization,
    mergeTiposVehiculoPermitidosFromApi,
    needsTipoVehiculoCategorization,
    resolveTipoVehiculoMenuNodeId,
    resolvedTipoVehiculo,
} from './automaticoTipoVehiculo.js';

function pickDetalle(res, gea) {
    const data = res?.data;
    const fromData =
        data?.id_detalle_proceso_automatico_chatbot ?? data?.id_detalle_servicio_automatico;
    if (fromData != null) return Number(fromData);
    return gea.id_detalle_proceso_automatico_chatbot ?? null;
}

function mergeDetalle(gea, res) {
    const id = pickDetalle(res, gea);
    if (id != null) gea.id_detalle_proceso_automatico_chatbot = id;
}

function todayIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todaySlash() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function locationBundle(ctx, gea) {
    const lat = gea.latitud ?? ctx.omniax?.latitud ?? ctx.lastLocation?.latitude;
    const lng = gea.longitud ?? ctx.omniax?.longitud ?? ctx.lastLocation?.longitude;
    const direccion = String(gea.direccion || 'Sin referencia').trim();
    return { lat, lng, direccion, referencia: direccion };
}

function vehicleFields(gea, ctx) {
    const v = gea.vehiculo || {};
    const extra = v.datos_extra || v.datosExtra || {};
    const placa = ctx?.plate || gea.placa || v.placa || '';
    const datosExtra = {
        serie: extra.serie || v.serie || '',
        motor: extra.motor || v.motor || '',
    };
    if (placa) datosExtra.placa = String(placa).trim().toUpperCase();
    return {
        marca_vehiculo: v.marca_vehiculo || v.marca || '',
        modelo_vehiculo: v.modelo_vehiculo || v.modelo || '',
        anio_vehiculo: String(v.anio_vehiculo || v.anio || v.año || ''),
        tipo_vehiculo: resolvedTipoVehiculo(gea),
        datos_extra: datosExtra,
    };
}

function coberturaAplica(res) {
    const flag = res?.data?.aplica_servicio_automatico;
    if (flag === 0 || flag === false || flag === '0') return false;
    if (flag === 1 || flag === true || flag === '1') return true;
    const estado = Number(res?.estado);
    return !Number.isFinite(estado) || estado < 400;
}

function omniaxErrorMessage(err) {
    return (
        err?.omniax?.noticias?.mensaje
        || err?.response?.data?.noticias?.mensaje
        || err?.message
        || 'No se pudo completar la operación.'
    );
}

function isSinAfiliacionError(err) {
    const estado = Number(err?.omniax?.estado ?? err?.response?.data?.estado);
    const msg = omniaxErrorMessage(err).toLowerCase();
    return (
        estado === 404
        || msg.includes('no se encuentra afiliación')
        || msg.includes('no se encuentra afiliacion')
    );
}

function sinAfiliacionHandoff(ctx, gea, tipo, serviceLabel) {
    const telefono = requireLucyTelefono(ctx);
    const cedula = ctx.cedula || '';
    const screen =
        tipo === 'VIAL' ? 'gea_auto_sin_afiliacion_vial' : 'gea_auto_sin_afiliacion_hogar';
    return {
        messages: [],
        nextNodeId: screen,
        patchContext: {
            gea,
            com: {
                producto: `Sin afiliación — ${serviceLabel || 'asistencia'}`,
                notas: `proceso_automatico; tipo=${tipo}; servicio=${serviceLabel}; cedula=${cedula}; telefono=${telefono}`,
                afterDerivacion: 'gea_auto_sin_afiliacion_done',
            },
        },
    };
}

function requireDetalle(gea) {
    const id = gea.id_detalle_proceso_automatico_chatbot;
    if (id == null) {
        throw new Error('Falta id_detalle_proceso_automatico_chatbot (reinicia el flujo del servicio).');
    }
    return Number(id);
}

function cfg(gea) {
    return gea.automatico || {};
}

export async function runAutomaticoEnter(task, state) {
    const ctx = state.context;
    const gea = ctx.gea || {};
    const cedula = ctx.cedula;
    const telefono = requireLucyTelefono(ctx);
    const auto = cfg(gea);
    const plan = gea.planAsistencia || auto.plan_asistencia || 'ASISTENCIAS';
    const tipo = gea.tipoServicio || auto.tipo_servicio || 'HOGAR';

    try {
        switch (task) {
            case 'auto_afiliacion': {
                if (!cedula) throw new Error('Ingresa tu cédula al inicio.');
                const idSub = auto.id_servicio_subservicio;
                if (!idSub) {
                    throw new Error(
                        `No hay id_servicio_subservicio para «${gea.serviceLabel || 'servicio'}».`,
                    );
                }
                const placa = ctx.plate || gea.placa;
                const body = {
                    telefono,
                    cveafiliado: cedula,
                    nivel_busquedad: auto.nivel_busquedad || 'SERVICIO',
                    id_servicio_subservicio: idSub,
                    tipo_servicio: tipo,
                    plan_asistencia: plan,
                    chasis: '',
                };
                if (placa) body.placa = String(placa).trim().toUpperCase();

                const res = await postAfiliacionAutomatico(body);
                mergeTiposVehiculoPermitidosFromApi(gea, res);
                mergeDetalle(gea, res);
                const detalle = pickDetalle(res, gea);
                if (!detalle) {
                    return sinAfiliacionHandoff(ctx, gea, tipo, gea.serviceLabel || auto.serviceLabel);
                }
                if (res?.data && typeof res.data === 'object') {
                    gea.afiliacion = res.data;
                }
                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_vehiculo': {
                const placa = ctx.plate || gea.placa;
                if (!placa) throw new Error('Indica la placa del vehículo.');
                const res = await postVehiculoAfiliacionAutomatico({
                    id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                    placa: String(placa).trim().toUpperCase(),
                    chasis: '',
                    plan_asistencia: plan,
                });
                mergeTiposVehiculoPermitidosFromApi(gea, res);
                mergeDetalle(gea, res);
                const raw = res?.data;
                const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
                if (list.length > 1) {
                    gea.vehiculosOpciones = list;
                    gea.menuActions = [
                        ...list.map((v, index) => ({
                            id: `veh_${index}`,
                            label: [v.placa, v.marca || v.marca_vehiculo, v.modelo || v.modelo_vehiculo]
                                .filter(Boolean)
                                .join(' — '),
                            next: gea.afterAutoNext,
                            meta: { gea: { vehiculo: v } },
                        })),
                        {
                            id: 'veh_otros',
                            label: AUTO_COPY.vehiculoOtros,
                            next: gea.afterAutoNext,
                            meta: { gea: { vehiculoManual: true } },
                        },
                    ];
                    gea.dockHeadline = AUTO_COPY.vehiculoPick;
                    gea.dockHint = '';
                    return {
                        messages: [],
                        nextNodeId: gea.afterVehiculoPickNext || gea.afterAutoNext,
                        patchContext: { gea },
                    };
                }
                if (list[0]) gea.vehiculo = list[0];
                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_vehiculo_pick': {
                return {
                    messages: [],
                    nextNodeId: state.nodeId,
                    patchContext: { gea },
                };
            }

            case 'auto_tipo_vehiculo_gate': {
                const locNext = gea.afterAutoNext;
                if (!needsTipoVehiculoCategorization(gea)) {
                    return {
                        messages: [],
                        nextNodeId: locNext,
                        patchContext: { gea },
                    };
                }
                gea.menuActions = buildTipoVehiculoMenuActions(gea, locNext);
                gea.dockHeadline = AUTO_COPY.tipoVehiculo;
                gea.dockHint = '';
                const menuNodeId = resolveTipoVehiculoMenuNodeId(gea);
                return {
                    messages: [],
                    nextNodeId: menuNodeId || locNext,
                    patchContext: { gea },
                };
            }

            case 'auto_ubicacion': {
                const { lat, lng, direccion, referencia } = locationBundle(ctx, gea);
                if (lat == null || lng == null) {
                    throw new Error('Falta la ubicación GPS.');
                }
                await postUbicacionAutomatico({
                    id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                    latitud: String(lat),
                    longitud: String(lng),
                    referencia,
                    direccion,
                    tipo_coordenada: auto.tipo_coordenada || 'TRASLADO',
                });
                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_cobertura': {
                const detalle = requireDetalle(gea);
                const { lat, lng, direccion, referencia } = locationBundle(ctx, gea);
                const esProgramado = Number(gea.esProgramado) === 1 ? 1 : 0;
                const body = {
                    id_detalle_proceso_automatico_chatbot: detalle,
                    aplica_servicio_automatico: aplicaAutomaticoFlag(gea),
                    es_programado: esProgramado,
                    fecha_emergencia: todayIso(),
                    plan_asistencia: plan,
                    tipo_servicio: tipo,
                    telefono,
                };
                if (esProgramado === 1 && gea.fecha_programada) {
                    body.fecha_programada = gea.fecha_programada;
                }
                if (esProgramado === 1 && gea.hora_programada) {
                    body.hora_programada = gea.hora_programada;
                }

                if (tipo === 'VIAL') {
                    if (lat == null || lng == null) {
                        throw new Error('Falta la ubicación GPS para validar cobertura.');
                    }
                    body.latitud = String(lat);
                    body.longitud = String(lng);
                    body.referencia = referencia;
                    body.direccion = direccion;
                    Object.assign(body, vehicleFields(gea, ctx));
                } else {
                    body.fecha_emergencia = todayIso();
                    if (lat != null && lng != null) {
                        body.latitud = String(lat);
                        body.longitud = String(lng);
                        body.referencia = referencia;
                        body.direccion = direccion;
                    }
                }

                const res = await postCoberturaAutomatico(body);
                mergeDetalle(gea, res);

                if (!coberturaAplica(res)) {
                    return {
                        messages: [botFromOmniaxResponse(res)],
                        nextNodeId: gea.afterCoberturaSinAplica || 'derivacion_asesor',
                        patchContext: {
                            gea,
                            com: {
                                ...(ctx.com || {}),
                                producto: `Sin cobertura: ${gea.serviceLabel || tipo}`,
                                afterDerivacion: LUCY_HOME_NODE,
                            },
                        },
                    };
                }

                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_combustible': {
                await postValidacionCombustibleAutomatico({
                    id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                });
                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_coordenadas': {
                await postValidacionCoordenadasAutomatico({
                    id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                    tipo_coordenada: auto.tipo_coordenada || 'TRASLADO',
                });
                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_crear': {
                const { lat, lng, direccion, referencia } = locationBundle(ctx, gea);
                if (lat == null || lng == null) {
                    throw new Error('Falta la ubicación GPS para crear la asistencia.');
                }
                const esProgramado = Number(gea.esProgramado) === 1 ? 1 : 0;
                const preguntasJson = buildPreguntasRespuestasJson(gea);
                const body = {
                    telefono,
                    id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                    fecha_emergencia: todaySlash(),
                    latitud: String(lat),
                    longitud: String(lng),
                    referencia,
                    direccion,
                    es_programado: esProgramado,
                    aplica_servicio_automatico: aplicaAutomaticoFlag(gea),
                    plan_asistencia: plan,
                    tipo_servicio: tipo,
                };
                if (preguntasJson) body.preguntas_respuestas = preguntasJson;
                if (esProgramado === 1 && gea.fecha_programada) {
                    body.fecha_programada = gea.fecha_programada;
                }
                if (esProgramado === 1 && gea.hora_programada) {
                    body.hora_programada = gea.hora_programada;
                }
                if (gea.id_lugar_destino != null) {
                    body.id_lugar_destino = Number(gea.id_lugar_destino);
                }
                if (gea.tipoCombustible) {
                    body.tipo_combustible = gea.tipoCombustible;
                }
                if (gea.id_tipo_combustible != null) {
                    body.id_tipo_combustible = Number(gea.id_tipo_combustible);
                }

                const res = await postAsistenciaAutomatico(body);
                const caso = res.data?.numero_caso ?? res.data?.numeroCaso;
                const idAsist = res.data?.id_asistencia ?? res.data?.idAsistencia;
                if (idAsist) gea.id_asistencia = idAsist;
                const extra = [];
                if (caso) extra.push(`Número de caso: ${caso}`);
                if (idAsist) extra.push(`ID asistencia: ${idAsist}`);

                return {
                    messages: [botFromOmniaxResponse(res, extra)],
                    nextNodeId: gea.afterCrearNext || 'gea_crear_exit',
                    patchContext: { gea },
                };
            }

            default:
                throw new Error(`Tarea proceso automático desconocida: ${task}`);
        }
    } catch (err) {
        const serviceLabel = gea.serviceLabel || auto.serviceLabel;
        if (task === 'auto_afiliacion' && isSinAfiliacionError(err)) {
            return sinAfiliacionHandoff(ctx, gea, tipo, serviceLabel);
        }
        const msg = omniaxErrorMessage(err);
        if (
            task === 'auto_cobertura'
            && (
                /categorizar.*tipo de veh[ií]culo/i.test(msg)
                || /no está permitido para el servicio autogestionado/i.test(msg)
            )
        ) {
            const retryCoberturaNodeId = state.nodeId;
            const menuNodeId = resolveTipoVehiculoMenuNodeId(gea);
            if (/no está permitido/i.test(msg)) {
                clearVehiculoTipoCategorization(gea);
            }
            gea.menuActions = buildTipoVehiculoMenuActions(gea, retryCoberturaNodeId);
            gea.dockHeadline = AUTO_COPY.tipoVehiculo;
            gea.dockHint = '';
            if (!menuNodeId) {
                return {
                    messages: [bot(`⚠️ ${msg}`)],
                    nextNodeId: gea.jelouRef === '2.4 Vial' ? 'menu_vial' : 'menu_hogar',
                    patchContext: { gea },
                };
            }
            const messages = gea.tipoVehiculoMenuActive
                ? []
                : [bot('Selecciona el **tipo de vehículo** en el menú inferior para validar cobertura.')];
            gea.tipoVehiculoMenuActive = true;
            return {
                messages,
                nextNodeId: menuNodeId,
                patchContext: { gea },
            };
        }
        if (task === 'auto_cobertura' && /configuraci[oó]n de cobertura para el servicio/i.test(msg)) {
            return {
                messages: [
                    bot(
                        '⚠️ GEA no tiene cobertura autogestionada para esa combinación (servicio, tipo de vehículo o plan). Prueba con **Liviano** y placa de tu afiliación, o continúa con un asesor.',
                    ),
                ],
                nextNodeId: 'derivacion_asesor',
                patchContext: {
                    gea,
                    com: {
                        ...(ctx.com || {}),
                        producto: `Cobertura: ${gea.serviceLabel || 'vial'}`,
                        notas: `cobertura_sin_config; ${msg}`,
                        afterDerivacion: LUCY_HOME_NODE,
                    },
                },
            };
        }
        return {
            messages: [bot(`⚠️ ${msg}`)],
            nextNodeId: gea.jelouRef === '2.4 Vial' ? 'menu_vial' : 'menu_hogar',
            patchContext: { gea },
        };
    }
}
