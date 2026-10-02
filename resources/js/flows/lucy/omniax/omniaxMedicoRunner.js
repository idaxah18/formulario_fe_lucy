import {
    crearAsistenciaMedica,
    fetchAplicaAsignacion,
    fetchAsistenciasEnProceso,
    fetchDisponibilidadDias,
    fetchDisponibilidadHoras,
    fetchEspecialidades,
    fetchEstablecimientosPorGps,
    fetchEstablecimientosPorZona,
    fetchZonasPorCiudad,
    reagendarAsistencia,
} from '@/api/omniaxMedicoApi.js';
import {
    formatHora12LabelFrom24,
    mustValidateOmniaxSlots,
    normalizeOmniaxHorasList,
    normalizeToOmniaxHora24,
    resolveOmniaxHoraSlot24,
} from './omniaxHoraFormat.js';
import {
    runOmniaxDisponibilidadDias,
    runOmniaxDisponibilidadFranja,
    runOmniaxDisponibilidadHoras,
} from './omniaxScheduleEnter.js';
import {
    establecimientoMenuLabel,
    normalizeEstablecimientosList,
} from './omniaxEstablecimientos.js';
import { patchOmniaxScheduleMeta, pickEstablecimientoHorarioFromRecord } from './omniaxScheduleSlots.js';
import {
    buildReagendarPayload,
    clearBeneficiarioFields,
    resolveCrearCoordenadas,
    withBeneficiarioFields,
} from './omniaxPayload.js';
import { idServicioMedico } from '@/api/omniaxMedicoApi.js';
import {
    asistenciaMenuLabel,
    loadAsistenciasParaReagendar,
    mensajeSinCitasReagendar,
    enrichEnProcesoResponse,
} from './omniaxAsistencias.js';
import { botOmniaxCitaConfirm } from './omniaxCitaConfirm.js';
import { botFromOmniaxResponse } from './omniaxNoticias.js';
import { runCabinaGateOrBlock } from '../gea/cabinaGate.js';
import { buildCabinaBlockedTransition } from '../cabinaHandoff.js';
import { bot } from '../flowHelpers.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import { buildSinCoberturaTransition, routeAfterAplicaAsignacion } from './omniaxEligibility.js';
import { resolveCitaPlanGate } from './omniaxPlanGate.js';
import {
    beginNuevaCitaAgendar,
    buildEnProcesoHubMenu,
    buildReagendarPickActions,
    buildEnProcesoHubTransition,
    buildEnProcesoPickTransition,
    routeAfterEnProcesoFetch,
} from './omniaxEnProcesoAgendar.js';

function parseOmniaxBool(value) {
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
    return Boolean(value);
}

function ensureOmx(ctx) {
    if (!ctx.omniax) ctx.omniax = {};
    return ctx.omniax;
}

function setMenu(ctx, headline, hint, actions) {
    const omx = ensureOmx(ctx);
    omx.dockHeadline = headline;
    omx.dockHint = hint || '';
    omx.menuActions = actions;
}

export function clearOmniaxMenu(ctx) {
    if (!ctx?.omniax) return;
    delete ctx.omniax.menuActions;
    delete ctx.omniax.dockHeadline;
    delete ctx.omniax.dockHint;
}

function clearMenu(ctx) {
    clearOmniaxMenu(ctx);
}

export function getOmniaxMenuActions(state) {
    return state.context?.omniax?.menuActions || null;
}

export function getOmniaxDockCopy(state) {
    const omx = state.context?.omniax;
    if (!omx?.dockHeadline) return null;
    return { headline: omx.dockHeadline, hint: omx.dockHint || '' };
}

export function getOmniaxEnterTask(state, node) {
    return node?.omniax?.enter || null;
}

export function applyOmniaxQuickMeta(state, action) {
    if (!action?.meta) return;
    const { omx, ...rest } = action.meta;
    const target = ensureOmx(state.context);
    const prevFecha = target.fecha;
    const prevEst = target.id_establecimiento;
    const prevFranja = target.horas_franja;
    Object.assign(target, rest);
    if (rest.para_beneficiario === false) {
        clearBeneficiarioFields(target);
    }
    if (rest.reagendar === true) {
        target.reagendar = true;
    }
    if (rest.horas_page_inc) {
        target.horas_page = (target.horas_page || 0) + 1;
    }
    if (rest.otra_fecha) {
        target.horas_page = 0;
        delete target.fecha;
        delete target.hora;
        delete target.horas_franja;
        delete target.horas_slots;
        delete target._horas_fecha;
        delete target._horas_all_for_fecha;
    }
    if (rest.fecha !== undefined && rest.fecha !== prevFecha) {
        target.horas_page = rest.horas_page ?? 0;
        delete target.horas_franja;
        delete target.horas_slots;
        delete target._horas_fecha;
        delete target._horas_all_for_fecha;
    }
    if (rest.horas_franja !== undefined && rest.horas_franja !== prevFranja) {
        target.horas_page = rest.horas_page ?? 0;
        delete target.horas_slots;
    }
    if (rest.id_establecimiento !== undefined && rest.id_establecimiento !== prevEst) {
        patchOmniaxScheduleMeta(target, { id_establecimiento: rest.id_establecimiento }, prevEst);
    } else {
        patchOmniaxScheduleMeta(target, rest, prevEst);
    }
    if (rest.en_proceso_index != null) {
        target.en_proceso_pick_index = Number(rest.en_proceso_index);
    }
    if (rest.usuario_acepta_seguimiento != null) {
        target.usuario_acepta_seguimiento = Boolean(rest.usuario_acepta_seguimiento);
    }
}

function applyEnProcesoMenu(ctx, result) {
    if (!result?.enProcesoMenu) return result;
    const { headline, hint, actions } = result.enProcesoMenu;
    setMenu(ctx, headline, hint, actions);
    const next = { ...result };
    delete next.enProcesoMenu;
    return next;
}

const OMX_MED_SCHEDULE_NODES = {
    franjaLoad: 'omx_med_franja_load',
    diasLoad: 'omx_med_dias_load',
    horasLoad: 'omx_med_horas_load',
    verifyLoad: 'omx_med_verificar_disponibilidad_load',
    sinFechas: 'omx_med_sin_fechas',
    sinFechasReag: 'omx_med_reag_sin_fechas',
    reagPick: 'omx_med_reag_pick',
};

function medScheduleFetchers(omx, cedula) {
    const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
    return {
        fetchDias: () =>
            fetchDisponibilidadDias(omx.id_especialidad, omx.id_establecimiento, idAsistencia),
        fetchHoras: (fecha) =>
            fetchDisponibilidadHoras({
                idEspecialidad: omx.id_especialidad,
                idEstablecimiento: omx.id_establecimiento,
                fecha,
                idAsistencia,
            }),
    };
}

export async function runOmniaxMedicoEnter(task, state) {
    const ctx = state.context;
    const omx = ensureOmx(ctx);
    omx.kind = 'medico';
    const cedula = ctx.cedula;
    const nombre = ctx.nombre;

    if (!cedula && task !== 'especialidades') {
        throw new Error('Falta la cédula del titular. Completa el inicio del chat.');
    }

    clearMenu(ctx);

    switch (task) {
        case 'plan_cita': {
            const blocked = await resolveCitaPlanGate(ctx, 'medico');
            if (blocked) return blocked;
            return {
                messages: [],
                nextNodeId: omx.afterPlanNext || 'omx_med_reag_cabina_preface',
                patchContext: { omniax: omx },
            };
        }

        case 'elegibilidad_agendar': {
            const blocked = await resolveCitaPlanGate(ctx, 'medico');
            if (blocked) return blocked;
            try {
                const espRes = await fetchEspecialidades();
                const items = espRes.data || [];
                if (!items.length) {
                    return buildSinCoberturaTransition(ctx, omx, 'medico');
                }
                omx.elegibilidad_ok = true;
                return {
                    nextNodeId: 'omx_med_en_proceso_load',
                    messages: [],
                    patchContext: { omniax: omx },
                };
            } catch (e) {
                return buildSinCoberturaTransition(ctx, omx, 'medico');
            }
        }

        case 'cabina_gate': {
            const gate = await runCabinaGateOrBlock(ctx, omx.tipoServicio || 'MEDICO', 'menu_medico', 'ASISTENCIAS', {
                allowVigenteForAppointments: true,
            });
            if (gate.blocked) {
                const blocked = buildCabinaBlockedTransition(gate, 'menu_medico');
                return {
                    ...blocked,
                    patchContext: { omniax: omx, ...blocked.patchContext },
                };
            }
            return {
                messages: [],
                nextNodeId: omx.afterCabinaNext || 'omx_med_who',
                patchContext: { omniax: omx },
            };
        }

        case 'en_proceso_agendar': {
            const res = await enrichEnProcesoResponse(
                await fetchAsistenciasEnProceso(cedula, false),
                cedula,
                requireLucyTelefono(ctx),
            );
            return applyEnProcesoMenu(
                ctx,
                routeAfterEnProcesoFetch(omx, 'medico', res),
            );
        }

        case 'en_proceso_hub': {
            if (!omx.enProcesoList?.length) {
                return beginNuevaCitaAgendar(omx, 'medico', {});
            }
            const menu = buildEnProcesoHubMenu(omx, 'medico');
            setMenu(ctx, menu.headline, menu.hint, menu.actions);
            return {
                nextNodeId: menu.hubNodeId,
                messages: [],
                stayOnNode: true,
                patchContext: { omniax: omx },
            };
        }

        case 'en_proceso_pick': {
            const idx = Number(omx.en_proceso_pick_index);
            delete omx.en_proceso_pick_index;
            return buildEnProcesoPickTransition(ctx, omx, 'medico', idx);
        }

        case 'long_flow_medico': {
            return { nextNodeId: 'omx_med_especialidades_load', messages: [] };
        }

        case 'en_proceso_reagendar': {
            omx.reagendar = true;
            const { res, list, usedFallback } = await loadAsistenciasParaReagendar(
                async (c, paraReagendar) =>
                    enrichEnProcesoResponse(
                        await fetchAsistenciasEnProceso(c, paraReagendar),
                        c,
                        requireLucyTelefono(ctx),
                    ),
                cedula,
                { requireEspecialidad: true },
            );
            omx.aplica_seguimiento_dental = Boolean(res.data?.aplica_seguimiento_dental);

            if (!list.length) {
                return {
                    nextNodeId: 'omx_med_error',
                    messages: [bot(mensajeSinCitasReagendar('medico'))],
                };
            }
            const intro = usedFallback
                ? [
                      bot(
                          'Omniax no devolvió citas con para_reagendar; mostramos las citas confirmadas de tu historial.',
                      ),
                  ]
                : [];
            const headline =
                list.length === 1
                    ? 'Tienes esta cita para reagendar. ¿La confirmamos?'
                    : 'Tienes estos servicios en proceso. ¿Cuál quieres reagendar?';
            setMenu(
                ctx,
                headline,
                res.noticias?.mensaje || '',
                buildReagendarPickActions(list, 'medico'),
            );
            return {
                nextNodeId: 'omx_med_reag_pick',
                messages: intro,
            };
        }

        case 'especialidades': {
            const res = await fetchEspecialidades();
            const items = res.data || [];
            if (!items.length) {
                return { nextNodeId: 'omx_med_error', messages: [bot('No hay especialidades disponibles en este momento.')] };
            }
            setMenu(
                ctx,
                'Indícame la especialidad en la que requieres ser atendido',
                '',
                items.map((e) => ({
                    id: `esp_${e.id}`,
                    label: e.nombre,
                    next: 'omx_med_aplica_load',
                    meta: { omx: true, id_especialidad: e.id, especialidad_nombre: e.nombre },
                })),
            );
            return { nextNodeId: 'omx_med_especialidades_load', messages: [], stayOnNode: true };
        }

        case 'aplica_asignacion': {
            const benefId = omx.para_beneficiario ? omx.identificacion_beneficiario : null;
            const res = await fetchAplicaAsignacion(cedula, omx.id_especialidad, benefId);
            omx.aplica_asignacion_establecimiento = parseOmniaxBool(
                res.data?.aplica_asignacion_establecimiento,
            );
            return routeAfterAplicaAsignacion(omx, 'medico');
        }

        case 'disponibilidad_franja': {
            const back = omx.reagendar ? 'omx_med_reag_pick' : 'omx_med_donde';
            const msg = omx.reagendar
                ? 'No pudimos cargar el establecimiento de esa cita. Elige otra asistencia.'
                : 'Primero elige un establecimiento.';
            const { fetchHoras } = medScheduleFetchers(omx, cedula);
            return runOmniaxDisponibilidadFranja(ctx, omx, setMenu, {
                nodes: OMX_MED_SCHEDULE_NODES,
                fetchHoras,
                backNodeId: back,
                backMessage: msg,
            });
        }

        case 'disponibilidad_dias': {
            const back = omx.reagendar ? 'omx_med_reag_pick' : 'omx_med_donde';
            const msg = omx.reagendar
                ? 'No pudimos cargar el establecimiento de esa cita. Elige otra asistencia.'
                : 'Primero elige un establecimiento.';
            const { fetchDias } = medScheduleFetchers(omx, cedula);
            return runOmniaxDisponibilidadDias(ctx, omx, setMenu, {
                nodes: OMX_MED_SCHEDULE_NODES,
                fetchDias,
                backNodeId: back,
                backMessage: msg,
            });
        }

        case 'disponibilidad_horas': {
            const { fetchHoras } = medScheduleFetchers(omx, cedula);
            return runOmniaxDisponibilidadHoras(ctx, omx, setMenu, {
                nodes: OMX_MED_SCHEDULE_NODES,
                fetchHoras,
            });
        }

        case 'establecimientos_gps': {
            const loc = ctx.lastLocation || omx;
            const lat = String(loc.latitude ?? omx.latitud);
            const lng = String(loc.longitude ?? omx.longitud);
            omx.latitud = lat;
            omx.longitud = lng;
            const res = await fetchEstablecimientosPorGps({
                idEspecialidad: omx.id_especialidad,
                latitud: lat,
                longitud: lng,
            });
            return buildEstablecimientosMenu(ctx, normalizeEstablecimientosList(res.data));
        }

        case 'zonas_ciudades': {
            const res = await fetchZonasPorCiudad();
            omx.zonasPorCiudad = res.data || [];
            if (!omx.zonasPorCiudad.length) {
                return { nextNodeId: 'omx_med_error', messages: [bot('No hay ciudades disponibles para otra ubicación.')] };
            }
            setMenu(
                ctx,
                'Por favor indícame la ciudad',
                '',
                omx.zonasPorCiudad.map((c, idx) => ({
                    id: `ciudad_${c.id_ciudad}`,
                    label: c.nombre_ciudad,
                    next: 'omx_med_zonas_load',
                    meta: { omx: true, ciudad_index: idx },
                })),
            );
            return { nextNodeId: 'omx_med_ciudades_load', messages: [], stayOnNode: true };
        }

        case 'zonas_lista': {
            const ciudad = omx.zonasPorCiudad?.[omx.ciudad_index];
            const zonas = ciudad?.zonas || [];
            if (!zonas.length) {
                return { nextNodeId: 'omx_med_error', messages: [bot('No hay zonas para esta ciudad.')] };
            }
            setMenu(
                ctx,
                'Por favor indícanos tu zona',
                ciudad.nombre_ciudad,
                zonas.map((z) => ({
                    id: `zona_${z.id_zona}`,
                    label: z.nombre_zona,
                    next: 'omx_med_est_zona_load',
                    meta: { omx: true, id_zona: z.id_zona },
                })),
            );
            return { nextNodeId: 'omx_med_zonas_load', messages: [], stayOnNode: true };
        }

        case 'establecimientos_zona': {
            const res = await fetchEstablecimientosPorZona({
                idEspecialidad: omx.id_especialidad,
                idZona: omx.id_zona,
            });
            return buildEstablecimientosMenu(ctx, normalizeEstablecimientosList(res.data), true);
        }

        case 'verificar_disponibilidad': {
            const fecha = omx.fecha;
            const hora = omx.hora;
            const validateSlots = mustValidateOmniaxSlots(omx);
            const fechaBack = 'omx_med_dias_load';
            const horaBack = 'omx_med_horas_load';

            if (!fecha || !hora) {
                return {
                    nextNodeId: fechaBack,
                    messages: [bot('Elige fecha y hora antes de continuar.')],
                };
            }

            let fechaApi = fecha;
            let horaApi = normalizeToOmniaxHora24(hora);
            if (!horaApi) {
                return {
                    nextNodeId: horaBack,
                    messages: [bot('Hora inválida. Elige un horario de la lista o usa formato 12 h con a. m. / p. m.')],
                };
            }

            const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
            const nextLoad = omx.reagendar ? 'omx_med_reagendar_load' : 'omx_med_crear_load';

            if (validateSlots && omx.id_establecimiento && omx.id_especialidad) {
                const diasRes = await fetchDisponibilidadDias(
                    omx.id_especialidad,
                    omx.id_establecimiento,
                    idAsistencia,
                );
                const dias = diasRes.data || [];
                const diaMatch = dias.find((d) => d.valor === fecha);
                if (!diaMatch) {
                    return {
                        nextNodeId: fechaBack,
                        messages: [
                            bot(
                                'Esa fecha no tiene cupo en este establecimiento. Elige un día de la lista (solo días hábiles con disponibilidad en Omniax).',
                            ),
                        ],
                    };
                }
                fechaApi = diaMatch.valor;

                const horasRes = await fetchDisponibilidadHoras({
                    idEspecialidad: omx.id_especialidad,
                    idEstablecimiento: omx.id_establecimiento,
                    fecha: fechaApi,
                    idAsistencia,
                });
                const horas = normalizeOmniaxHorasList(horasRes.data);
                const resolved = resolveOmniaxHoraSlot24(hora, horasRes.data);
                if (!resolved) {
                    const muestra = horas
                        .slice(0, 6)
                        .map((h) => formatHora12LabelFrom24(normalizeToOmniaxHora24(h) || h))
                        .join(', ');
                    return {
                        nextNodeId: horaBack,
                        messages: [
                            bot(
                                `Esa hora no está disponible. Ejemplos con cupo: ${muestra || '10:00 a. m.'}.`,
                            ),
                        ],
                    };
                }
                horaApi = resolved;
            }

            omx.fecha = fechaApi;
            omx.hora = horaApi;
            delete omx.fechaHoraError;

            return {
                nextNodeId: nextLoad,
                messages: [
                    bot(
                        `Disponibilidad validada para ${fechaApi} a las ${formatHora12LabelFrom24(horaApi)}. ${
                            omx.reagendar ? 'Reagendando…' : 'Registrando asistencia…'
                        }`,
                    ),
                ],
            };
        }

        case 'crear': {
            const needsEst = omx.agenda_completa !== false;
            if ((needsEst && !omx.id_establecimiento) || !omx.fecha || !omx.hora) {
                return {
                    nextNodeId: 'omx_med_error',
                    messages: [
                        bot(
                            'Faltan datos para crear la cita (fecha, hora'
                                + (needsEst ? ' o establecimiento' : '')
                                + '). Vuelve a «Agendar cita médica» y completa todos los pasos.',
                        ),
                    ],
                };
            }
            const coords = resolveCrearCoordenadas(omx, ctx);
            omx.latitud = coords.latitud;
            omx.longitud = coords.longitud;
            const payload = withBeneficiarioFields(
                {
                    telefono: requireLucyTelefono(ctx),
                    identificacion_titular: cedula,
                    nombre_titular: nombre,
                    latitud: coords.latitud,
                    longitud: coords.longitud,
                    aplica_seguimiento_dental: Boolean(omx.aplica_seguimiento_dental),
                    id_especialidad: omx.id_especialidad,
                    id_establecimiento: omx.id_establecimiento,
                    fecha: String(omx.fecha),
                    hora: String(omx.hora),
                },
                omx,
            );
            const res = await crearAsistenciaMedica(payload);
            const d = res.data || {};
            clearMenu(ctx);
            return {
                nextNodeId: 'omx_med_done',
                messages: [botOmniaxCitaConfirm(res, d, { kind: 'crear' })],
            };
        }

        case 'reagendar': {
            const res = await reagendarAsistencia(
                buildReagendarPayload({
                    telefono: requireLucyTelefono(ctx),
                    omx,
                }),
            );
            const d = res.data || {};
            clearMenu(ctx);
            return {
                nextNodeId: 'omx_med_done',
                messages: [botOmniaxCitaConfirm(res, d, { kind: 'reagendar' })],
            };
        }

        default:
            throw new Error(`Tarea Omniax desconocida: ${task}`);
    }
}

function buildEstablecimientosMenu(ctx, list, fromZona = false) {
    const omx = ensureOmx(ctx);
    if (!list.length) {
        return {
            nextNodeId: 'omx_med_error',
            messages: [bot('No encontramos establecimientos disponibles.')],
        };
    }
    const actions = list.map((e) => {
        const horario = pickEstablecimientoHorarioFromRecord(e);
        return {
            id: `est_${e.id}`,
            label: establecimientoMenuLabel(e),
            next: 'omx_med_dias_load',
            meta: {
                omx: true,
                id_establecimiento: e.id,
                url_mapa: e.url_mapa,
                hora_apertura_establecimiento: horario.open,
                hora_cierre_establecimiento: horario.close,
            },
        };
    });
    if (!fromZona) {
        actions.push({
            id: 'otra_ubic',
            label: 'Otra ubicación',
            next: 'omx_med_ciudades_load',
            meta: { omx: true, menuPinned: true },
        });
    }
    setMenu(
        ctx,
        'Establecimientos disponibles:',
        'Selecciona un establecimiento para ver fechas disponibles.',
        actions,
    );
    return { nextNodeId: fromZona ? 'omx_med_est_zona_load' : 'omx_med_est_gps_load', messages: [], stayOnNode: true };
}
