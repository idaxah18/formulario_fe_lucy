import {
    postAfiliacionAutomatico,
    postAsistenciaAutomatico,
    postCoberturaAutomatico,
    postUbicacionAutomatico,
    postValidacionCombustibleAutomatico,
    postValidacionCoordenadasAutomatico,
    postVehiculoAfiliacionAutomatico,
} from '@/api/proyectosAutomaticoApi.js';
import { isAdvisorHandoffDoneNode } from '../advisorHandoffCopy.js';
import { inferGeaExitReturnMenu } from '../flowExitMenus.js';
import { LUCY_HOME_NODE, bot } from '../flowHelpers.js';
import { botFromOmniaxResponse } from '../omniax/omniaxNoticias.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import { AUTO_COPY } from './automaticoFlowCopy.js';
import {
    isAsistenciaProgramada,
    mergeProgramadoForApi,
    requiereUbicacionGps,
} from './automaticoProgramado.js';
import {
    nextVehiculoDatoStep,
    normalizeVehiculoFromApi,
    resolvedAnioVehiculo,
    resolveVehAnioNodeId,
    resolveVehDatosGateId,
    resolveVehMarcaNodeId,
    resolveVehModeloNodeId,
    vehiculoDatosCompletos,
} from './automaticoVehiculoDatos.js';
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

function vehiculoDatoNodeId(gea) {
    const step = nextVehiculoDatoStep(gea);
    if (!step) return null;
    const byStep = {
        marca: resolveVehMarcaNodeId(gea),
        modelo: resolveVehModeloNodeId(gea),
        anio: resolveVehAnioNodeId(gea),
    };
    return byStep[step] || resolveVehDatosGateId(gea) || null;
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
    const anioDigits = resolvedAnioVehiculo(gea);
    const anioInt = anioDigits ? Number.parseInt(anioDigits, 10) : NaN;
    const fields = {
        marca_vehiculo: String(v.marca_vehiculo || v.marca || '').trim(),
        modelo_vehiculo: String(v.modelo_vehiculo || v.modelo || '').trim(),
        tipo_vehiculo: resolvedTipoVehiculo(gea),
        datos_extra: datosExtra,
    };
    if (Number.isFinite(anioInt)) {
        fields.anio_vehiculo = String(anioDigits);
    } else {
        throw new Error('Falta el año del vehículo para validar cobertura.');
    }
    return fields;
}

function redirectVehiculoDatosIfNeeded(gea, tipo) {
    if (tipo !== 'VIAL' || vehiculoDatosCompletos(gea)) return null;
    const nextNodeId = vehiculoDatoNodeId(gea);
    if (!nextNodeId) return null;
    return {
        messages: [bot('Necesitamos completar los datos del vehículo antes de validar cobertura.')],
        nextNodeId,
        patchContext: { gea },
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

/** Placa sin historial en afiliación (S1 con placa o S2 vehículo-afiliación). */
function isHistorialPlacaAfiliacionError(err) {
    const msg = omniaxErrorMessage(err).toLowerCase();
    return (
        msg.includes('no se encontró historial de asistencias')
        || msg.includes('no se encontro historial de asistencias')
        || (msg.includes('historial de asistencias') && msg.includes('placa'))
    );
}

function rememberPlaca(ctx, gea) {
    const placa = String(ctx?.plate || gea?.placa || '').trim().toUpperCase();
    if (placa) gea.placa = placa;
    return placa;
}

function continueSinHistorialVehiculo(gea, placa) {
    const placaNorm = String(placa || gea.placa || '').trim().toUpperCase();
    if (placaNorm) gea.placa = placaNorm;
    gea.vehiculo = placaNorm ? { placa: placaNorm } : {};
    gea.vehiculoManual = true;
    return {
        messages: [
            bot(
                'No encontramos historial de asistencias con esa **placa** en tu afiliación. Indica el **tipo de vehículo** y luego marca, modelo y año.',
            ),
        ],
        nextNodeId: gea.afterAutoNext,
        patchContext: { gea },
    };
}

async function postAfiliacionAutomaticoResilient(body, placa) {
    const placaNorm = placa ? String(placa).trim().toUpperCase() : '';
    if (!placaNorm) {
        return postAfiliacionAutomatico(body);
    }
    try {
        return await postAfiliacionAutomatico({ ...body, placa: placaNorm });
    } catch (err) {
        if (!isHistorialPlacaAfiliacionError(err)) throw err;
        return postAfiliacionAutomatico(body);
    }
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
                const placa = rememberPlaca(ctx, gea);
                const body = {
                    telefono,
                    cveafiliado: cedula,
                    nivel_busquedad: auto.nivel_busquedad || 'SERVICIO',
                    id_servicio_subservicio: idSub,
                    tipo_servicio: tipo,
                    plan_asistencia: plan,
                    chasis: '',
                };

                const res = await postAfiliacionAutomaticoResilient(body, placa);
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
                const placa = rememberPlaca(ctx, gea);
                if (!placa) throw new Error('Indica la placa del vehículo.');
                let res;
                try {
                    res = await postVehiculoAfiliacionAutomatico({
                        id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                        placa,
                        chasis: '',
                        plan_asistencia: plan,
                    });
                } catch (vehErr) {
                    if (isHistorialPlacaAfiliacionError(vehErr)) {
                        return continueSinHistorialVehiculo(gea, placa);
                    }
                    throw vehErr;
                }
                mergeTiposVehiculoPermitidosFromApi(gea, res);
                mergeDetalle(gea, res);
                const raw = res?.data;
                const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
                if (!list.length) {
                    return continueSinHistorialVehiculo(gea, placa);
                }
                const stayOnPick = state.nodeId && state.nodeId === gea.afterVehiculoPickNext;
                if (list.length > 1 || (stayOnPick && list.length >= 1)) {
                    gea.vehiculosOpciones = list;
                    gea.menuActions = [
                        ...list.map((v, index) => ({
                            id: `veh_${index}`,
                            label: [v.placa, v.marca || v.marca_vehiculo, v.modelo || v.modelo_vehiculo]
                                .filter(Boolean)
                                .join(' — '),
                            next: gea.afterAutoNext,
                            meta: { gea: { vehiculo: normalizeVehiculoFromApi(v) } },
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
                if (list[0]) gea.vehiculo = normalizeVehiculoFromApi(list[0]);
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
                const menuNodeId = resolveTipoVehiculoMenuNodeId(gea);
                const stayOnMenu = Boolean(menuNodeId) && state.nodeId === menuNodeId;
                if (!stayOnMenu && !needsTipoVehiculoCategorization(gea)) {
                    return {
                        messages: [],
                        nextNodeId: locNext,
                        patchContext: { gea },
                    };
                }
                gea.menuActions = buildTipoVehiculoMenuActions(gea, locNext);
                gea.dockHeadline = AUTO_COPY.tipoVehiculo;
                gea.dockHint = '';
                const datosNode = vehiculoDatoNodeId(gea);
                if (!stayOnMenu && !needsTipoVehiculoCategorization(gea) && datosNode) {
                    return {
                        messages: [],
                        nextNodeId: datosNode,
                        patchContext: { gea },
                    };
                }
                return {
                    messages: [],
                    nextNodeId: menuNodeId || locNext,
                    patchContext: { gea },
                };
            }

            case 'auto_veh_datos_gate': {
                const step = nextVehiculoDatoStep(gea);
                const byStep = {
                    marca: resolveVehMarcaNodeId(gea),
                    modelo: resolveVehModeloNodeId(gea),
                    anio: resolveVehAnioNodeId(gea),
                };
                let nextNodeId = step ? (byStep[step] || gea.afterAutoNext) : gea.afterAutoNext;
                if (!step && gea.pendingCoberturaRetry) {
                    nextNodeId = gea.pendingCoberturaRetry;
                    delete gea.pendingCoberturaRetry;
                    delete gea.vehAnioCompletedNext;
                }
                return {
                    messages: [],
                    nextNodeId,
                    patchContext: { gea },
                };
            }

            case 'auto_ubicacion': {
                const { lat, lng, direccion, referencia } = locationBundle(ctx, gea);
                if (lat == null || lng == null) {
                    if (isAsistenciaProgramada(gea)) {
                        return {
                            messages: [],
                            nextNodeId: gea.afterAutoNext,
                            patchContext: { gea },
                        };
                    }
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
                const datosRedirect = redirectVehiculoDatosIfNeeded(gea, tipo);
                if (datosRedirect) return datosRedirect;

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
                Object.assign(body, mergeProgramadoForApi(gea));

                if (tipo === 'VIAL') {
                    if (requiereUbicacionGps(gea, tipo) && (lat == null || lng == null)) {
                        throw new Error('Falta la ubicación GPS para validar cobertura.');
                    }
                    if (lat != null && lng != null) {
                        body.latitud = String(lat);
                        body.longitud = String(lng);
                        body.referencia = referencia;
                        body.direccion = direccion;
                    }
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
                const tipoCoord = isAsistenciaProgramada(gea)
                    ? 'PROGRAMADA'
                    : auto.tipo_coordenada || 'TRASLADO';
                await postValidacionCoordenadasAutomatico({
                    id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                    tipo_coordenada: tipoCoord,
                });
                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_pre_crear_gate': {
                if (isAsistenciaProgramada(gea) && !auto.requiresCoordValidation) {
                    await postValidacionCoordenadasAutomatico({
                        id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                        tipo_coordenada: 'PROGRAMADA',
                    });
                }
                return {
                    messages: [],
                    nextNodeId: gea.afterAutoNext,
                    patchContext: { gea },
                };
            }

            case 'auto_crear': {
                const { lat, lng, direccion, referencia } = locationBundle(ctx, gea);
                const esProgramado = Number(gea.esProgramado) === 1 ? 1 : 0;
                if (requiereUbicacionGps(gea, tipo) && (lat == null || lng == null)) {
                    throw new Error('Falta la ubicación GPS para crear la asistencia.');
                }
                const preguntasJson = buildPreguntasRespuestasJson(gea);
                const body = {
                    telefono,
                    id_detalle_proceso_automatico_chatbot: requireDetalle(gea),
                    fecha_emergencia: todaySlash(),
                    es_programado: esProgramado,
                    aplica_servicio_automatico: aplicaAutomaticoFlag(gea),
                    plan_asistencia: plan,
                    tipo_servicio: tipo,
                };
                if (lat != null && lng != null) {
                    body.latitud = String(lat);
                    body.longitud = String(lng);
                    body.referencia = referencia;
                    body.direccion = direccion;
                }
                const descripcionFalla = String(
                    gea.descripcion_falla || gea.descripcion_problema || '',
                ).trim();
                if (descripcionFalla) {
                    body.descripcion_falla = descripcionFalla;
                }
                if (preguntasJson) body.preguntas_respuestas = preguntasJson;
                Object.assign(body, mergeProgramadoForApi(gea));
                if (gea.acepta_pago_combustible != null) {
                    body.acepta_pago_combustible = Number(gea.acepta_pago_combustible);
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
                const urlMon = res.data?.url_monitoreo ?? res.data?.urlMonitoreo;
                if (urlMon) {
                    extra.push(
                        'Puedes consultar el estado de tu solicitud en el enlace de monitoreo que te enviaremos.',
                    );
                }

                if (!gea.exitReturnMenu) {
                    gea.exitReturnMenu = inferGeaExitReturnMenu(gea.tipoServicio);
                }
                const nextNodeId = gea.afterCrearNext || 'gea_crear_exit';
                return {
                    messages: isAdvisorHandoffDoneNode(nextNodeId)
                        ? []
                        : [botFromOmniaxResponse(res, extra)],
                    nextNodeId,
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
        if (task === 'auto_vehiculo' && isHistorialPlacaAfiliacionError(err)) {
            const placa = rememberPlaca(ctx, gea);
            if (placa) return continueSinHistorialVehiculo(gea, placa);
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
            gea.pendingCoberturaRetry = retryCoberturaNodeId;
            gea.vehAnioCompletedNext = retryCoberturaNodeId;
            const menuNodeId = resolveTipoVehiculoMenuNodeId(gea);
            if (/no está permitido/i.test(msg)) {
                clearVehiculoTipoCategorization(gea);
            }
            const afterTipoNext = resolveVehDatosGateId(gea) || retryCoberturaNodeId;
            gea.menuActions = buildTipoVehiculoMenuActions(gea, afterTipoNext);
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
        if (
            task === 'auto_cobertura'
            && (/anio_vehiculo/i.test(msg) || /año del vehículo/i.test(msg))
        ) {
            const datosRedirect = redirectVehiculoDatosIfNeeded(gea, tipo);
            if (datosRedirect) return datosRedirect;
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
