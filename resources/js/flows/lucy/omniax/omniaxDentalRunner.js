import {
    crearAsistenciaDental,
    fetchAplicaAsignacion,
    fetchAsistenciasEnProceso,
    fetchDisponibilidadDias,
    fetchDisponibilidadHoras,
    fetchEstablecimientosPorGps,
    fetchEstablecimientosPorZona,
    fetchZonasPorCiudad,
    reagendarAsistencia,
} from '@/api/omniaxDentalApi.js';
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
import { pickEstablecimientoHorarioFromRecord } from './omniaxScheduleSlots.js';
import { buildReagendarPayload, resolveCrearCoordenadas, withBeneficiarioFields } from './omniaxPayload.js';
import { fetchAsistenciasEnProceso as fetchMedicoAsistenciasEnProceso } from '@/api/omniaxMedicoApi.js';
import {
    asistenciaMenuLabel,
    loadAsistenciasParaReagendar,
    mensajeSinCitasReagendar,
    enrichEnProcesoResponse,
} from './omniaxAsistencias.js';
import { botOmniaxCitaConfirm } from './omniaxCitaConfirm.js';
import { botFromOmniaxResponse } from './omniaxNoticias.js';
import { bot } from '../flowHelpers.js';
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
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import { runCabinaGateOrBlock } from '../gea/cabinaGate.js';
import { buildCabinaBlockedTransition } from '../cabinaHandoff.js';
import {
    applyOmniaxQuickMeta,
    clearOmniaxMenu,
    getOmniaxDockCopy,
    getOmniaxMenuActions,
} from './omniaxMedicoRunner.js';

function parseOmniaxBool(value) {
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
    return Boolean(value);
}

function ensureOmx(ctx) {
    if (!ctx.omniax) ctx.omniax = {};
    return ctx.omniax;
}

const OMX_DEN_SCHEDULE_NODES = {
    franjaLoad: 'omx_den_franja_load',
    diasLoad: 'omx_den_dias_load',
    horasLoad: 'omx_den_horas_load',
    verifyLoad: 'omx_den_verificar_disponibilidad_load',
    sinFechas: 'omx_den_sin_fechas',
    sinFechasReag: 'omx_den_reag_sin_fechas',
    reagPick: 'omx_den_reag_pick',
};

function denScheduleFetchers(omx) {
    const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
    return {
        fetchDias: () => fetchDisponibilidadDias(omx.id_establecimiento, idAsistencia),
        fetchHoras: (fecha) =>
            fetchDisponibilidadHoras({
                idEstablecimiento: omx.id_establecimiento,
                fecha,
                idAsistencia,
            }),
    };
}

function setMenu(ctx, headline, hint, actions) {
    const omx = ensureOmx(ctx);
    omx.dockHeadline = headline;
    omx.dockHint = hint || '';
    omx.menuActions = actions;
}

function applyEnProcesoMenu(ctx, result) {
    if (!result?.enProcesoMenu) return result;
    const { headline, hint, actions } = result.enProcesoMenu;
    setMenu(ctx, headline, hint, actions);
    const next = { ...result };
    delete next.enProcesoMenu;
    return next;
}

function clearMenu(ctx) {
    clearOmniaxMenu(ctx);
}

export function getOmniaxDentalEnterTask(state, node) {
    return node?.omniax?.enter || null;
}

export async function runOmniaxDentalEnter(task, state) {
    const ctx = state.context;
    const omx = ensureOmx(ctx);
    omx.kind = 'dental';
    const cedula = ctx.cedula;
    const nombre = ctx.nombre;

    if (!cedula) {
        throw new Error('Falta la cédula del titular. Completa el inicio del chat.');
    }

    clearMenu(ctx);

    switch (task) {
        case 'plan_cita': {
            const blocked = await resolveCitaPlanGate(ctx, 'dental');
            if (blocked) return blocked;
            return {
                messages: [],
                nextNodeId: omx.afterPlanNext || 'omx_den_reag_cabina_preface',
                patchContext: { omniax: omx },
            };
        }

        case 'elegibilidad_agendar': {
            const blocked = await resolveCitaPlanGate(ctx, 'dental');
            if (blocked) return blocked;
            try {
                const apRes = await fetchAplicaAsignacion(cedula, null);
                omx.aplica_asignacion_establecimiento = parseOmniaxBool(
                    apRes.data?.aplica_asignacion_establecimiento,
                );
                omx.agenda_completa = true;
                omx.elegibilidad_ok = true;
                return {
                    nextNodeId: 'omx_den_en_proceso_load',
                    messages: [],
                    patchContext: { omniax: omx },
                };
            } catch {
                return buildSinCoberturaTransition(ctx, omx, 'dental');
            }
        }

        case 'cabina_gate': {
            const gate = await runCabinaGateOrBlock(ctx, omx.tipoServicio || 'DENTAL', 'menu_dental', 'ASISTENCIAS', {
                allowVigenteForAppointments: true,
            });
            if (gate.blocked) {
                const blocked = buildCabinaBlockedTransition(gate, 'menu_dental');
                return {
                    ...blocked,
                    patchContext: { omniax: omx, ...blocked.patchContext },
                };
            }
            return {
                messages: [],
                nextNodeId: omx.afterCabinaNext || 'omx_den_who',
                patchContext: { omniax: omx },
            };
        }

        case 'en_proceso_agendar': {
            const res = await enrichEnProcesoResponse(
                await fetchAsistenciasEnProceso(cedula, false),
                cedula,
                requireLucyTelefono(ctx),
            );
            return applyEnProcesoMenu(ctx, routeAfterEnProcesoFetch(omx, 'dental', res));
        }

        case 'en_proceso_hub':
        case 'en_proceso_hub_after_seguimiento': {
            if (task === 'en_proceso_hub_after_seguimiento') {
                omx.usuario_acepta_seguimiento = false;
            }
            if (!omx.enProcesoList?.length) {
                return beginNuevaCitaAgendar(omx, 'dental', {});
            }
            const menu = buildEnProcesoHubMenu(omx, 'dental');
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
            return buildEnProcesoPickTransition(ctx, omx, 'dental', idx);
        }

        case 'long_flow_dental': {
            return { nextNodeId: 'omx_den_aplica_load', messages: [] };
        }

        case 'crear_seguimiento_dental': {
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
                    aplica_seguimiento_dental: true,
                },
                omx,
            );
            const res = await crearAsistenciaDental(payload);
            const d = res.data || {};
            clearMenu(ctx);
            omx.usuario_acepta_seguimiento = false;
            return {
                nextNodeId: 'omx_den_done',
                messages: [botOmniaxCitaConfirm(res, d, { kind: 'crear' })],
            };
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
                { requireEspecialidad: false },
            );
            omx.aplica_seguimiento_dental = Boolean(res.data?.aplica_seguimiento_dental);

            if (!list.length) {
                let hint = mensajeSinCitasReagendar('dental');
                try {
                    const { list: medicoList } = await loadAsistenciasParaReagendar(
                        (c, paraReagendar) => fetchMedicoAsistenciasEnProceso(c, paraReagendar),
                        cedula,
                        { requireEspecialidad: true },
                    );
                    if (medicoList.length) {
                        hint += `\n\nEncontramos ${medicoList.length} cita(s) médica(s) reagendable(s), por ejemplo: ${asistenciaMenuLabel(medicoList[0])}.`;
                    }
                } catch {
                    /* ignorar — solo ayuda contextual */
                }
                return {
                    nextNodeId: 'omx_den_error',
                    messages: [bot(hint)],
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
                    ? 'Tienes esta cita dental para reagendar. ¿La confirmamos?'
                    : 'Tienes estos servicios en proceso. ¿Cuál quieres reagendar?';
            setMenu(
                ctx,
                headline,
                res.noticias?.mensaje || '',
                buildReagendarPickActions(list, 'dental'),
            );
            return {
                nextNodeId: 'omx_den_reag_pick',
                messages: intro,
            };
        }

        case 'aplica_asignacion': {
            const benefId = omx.para_beneficiario ? omx.identificacion_beneficiario : null;
            const res = await fetchAplicaAsignacion(cedula, benefId);
            omx.aplica_asignacion_establecimiento = parseOmniaxBool(
                res.data?.aplica_asignacion_establecimiento,
            );
            return routeAfterAplicaAsignacion(omx, 'dental');
        }

        case 'disponibilidad_franja': {
            const back = omx.reagendar ? 'omx_den_reag_pick' : 'omx_den_donde';
            const msg = omx.reagendar
                ? 'No pudimos cargar el establecimiento de esa cita. Elige otra asistencia.'
                : 'Primero elige un establecimiento.';
            const { fetchHoras } = denScheduleFetchers(omx);
            return runOmniaxDisponibilidadFranja(ctx, omx, setMenu, {
                nodes: OMX_DEN_SCHEDULE_NODES,
                fetchHoras,
                backNodeId: back,
                backMessage: msg,
            });
        }

        case 'disponibilidad_dias': {
            const back = omx.reagendar ? 'omx_den_reag_pick' : 'omx_den_donde';
            const msg = omx.reagendar
                ? 'No pudimos cargar el establecimiento de esa cita. Elige otra asistencia.'
                : 'Primero elige un establecimiento.';
            const { fetchDias } = denScheduleFetchers(omx);
            return runOmniaxDisponibilidadDias(ctx, omx, setMenu, {
                nodes: OMX_DEN_SCHEDULE_NODES,
                fetchDias,
                backNodeId: back,
                backMessage: msg,
            });
        }

        case 'disponibilidad_horas': {
            const { fetchHoras } = denScheduleFetchers(omx);
            return runOmniaxDisponibilidadHoras(ctx, omx, setMenu, {
                nodes: OMX_DEN_SCHEDULE_NODES,
                fetchHoras,
            });
        }

        case 'establecimientos_gps': {
            const loc = ctx.lastLocation || omx;
            const lat = String(loc.latitude ?? omx.latitud);
            const lng = String(loc.longitude ?? omx.longitud);
            omx.latitud = lat;
            omx.longitud = lng;
            const res = await fetchEstablecimientosPorGps({ latitud: lat, longitud: lng });
            return buildEstablecimientosMenu(ctx, normalizeEstablecimientosList(res.data));
        }

        case 'zonas_ciudades': {
            const res = await fetchZonasPorCiudad();
            omx.zonasPorCiudad = res.data || [];
            if (!omx.zonasPorCiudad.length) {
                return { nextNodeId: 'omx_den_error', messages: [bot('No hay ciudades disponibles.')] };
            }
            setMenu(
                ctx,
                'Por favor indícame la ciudad',
                '',
                omx.zonasPorCiudad.map((c, idx) => ({
                    id: `ciudad_${c.id_ciudad}`,
                    label: c.nombre_ciudad,
                    next: 'omx_den_zonas_load',
                    meta: { omx: true, ciudad_index: idx },
                })),
            );
            return { nextNodeId: 'omx_den_ciudades_load', messages: [], stayOnNode: true };
        }

        case 'zonas_lista': {
            const ciudad = omx.zonasPorCiudad?.[omx.ciudad_index];
            const zonas = ciudad?.zonas || [];
            if (!zonas.length) {
                return { nextNodeId: 'omx_den_error', messages: [bot('No hay zonas para esta ciudad.')] };
            }
            setMenu(
                ctx,
                'Por favor indícanos tu zona',
                ciudad.nombre_ciudad,
                zonas.map((z) => ({
                    id: `zona_${z.id_zona}`,
                    label: z.nombre_zona,
                    next: 'omx_den_est_zona_load',
                    meta: { omx: true, id_zona: z.id_zona },
                })),
            );
            return { nextNodeId: 'omx_den_zonas_load', messages: [], stayOnNode: true };
        }

        case 'establecimientos_zona': {
            const res = await fetchEstablecimientosPorZona({ idZona: omx.id_zona });
            return buildEstablecimientosMenu(ctx, normalizeEstablecimientosList(res.data), true);
        }

        case 'verificar_disponibilidad': {
            const fecha = omx.fecha;
            const hora = omx.hora;
            const validateSlots = mustValidateOmniaxSlots(omx);
            const fechaBack = 'omx_den_dias_load';
            const horaBack = 'omx_den_horas_load';

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
            const nextLoad = omx.reagendar ? 'omx_den_reagendar_load' : 'omx_den_crear_load';

            if (validateSlots && omx.id_establecimiento) {
                const diasRes = await fetchDisponibilidadDias(omx.id_establecimiento, idAsistencia);
                const dias = diasRes.data || [];
                const diaMatch = dias.find((d) => d.valor === fecha);
                if (!diaMatch) {
                    return {
                        nextNodeId: fechaBack,
                        messages: [
                            bot(
                                'Esa fecha no tiene cupo en este establecimiento. Elige un día de la lista (solo días con disponibilidad en Omniax).',
                            ),
                        ],
                    };
                }
                fechaApi = diaMatch.valor;

                const horasRes = await fetchDisponibilidadHoras({
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
                            bot(`Esa hora no está disponible. Ejemplos con cupo: ${muestra || '10:00 a. m.'}.`),
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
                            omx.reagendar ? 'Reagendando…' : 'Registrando…'
                        }`,
                    ),
                ],
            };
        }

        case 'crear': {
            const needsEst = omx.agenda_completa !== false;
            if ((needsEst && !omx.id_establecimiento) || !omx.fecha || !omx.hora) {
                return {
                    nextNodeId: 'omx_den_error',
                    messages: [
                        bot(
                            'Faltan datos para crear la cita dental (fecha, hora'
                                + (needsEst ? ' o establecimiento' : '')
                                + '). Completa el flujo desde el inicio.',
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
                    id_establecimiento: omx.id_establecimiento,
                    fecha: String(omx.fecha),
                    hora: String(omx.hora),
                },
                omx,
            );
            const res = await crearAsistenciaDental(payload);
            const d = res.data || {};
            clearMenu(ctx);
            return {
                nextNodeId: 'omx_den_done',
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
                nextNodeId: 'omx_den_done',
                messages: [botOmniaxCitaConfirm(res, d, { kind: 'reagendar' })],
            };
        }

        default:
            throw new Error(`Tarea Omniax dental desconocida: ${task}`);
    }
}

function buildEstablecimientosMenu(ctx, list, fromZona = false) {
    if (!list.length) {
        return {
            nextNodeId: 'omx_den_error',
            messages: [bot('No encontramos establecimientos disponibles.')],
        };
    }
    const actions = list.map((e) => {
        const horario = pickEstablecimientoHorarioFromRecord(e);
        return {
            id: `est_${e.id}`,
            label: establecimientoMenuLabel(e),
            next: 'omx_den_dias_load',
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
            next: 'omx_den_ciudades_load',
            meta: { omx: true, menuPinned: true },
        });
    }
    setMenu(
        ctx,
        'Establecimientos disponibles:',
        'Selecciona un establecimiento para ver fechas disponibles.',
        actions,
    );
    return {
        nextNodeId: fromZona ? 'omx_den_est_zona_load' : 'omx_den_est_gps_load',
        messages: [],
        stayOnNode: true,
    };
}

export { getOmniaxMenuActions, getOmniaxDockCopy, applyOmniaxQuickMeta, clearOmniaxMenu };
