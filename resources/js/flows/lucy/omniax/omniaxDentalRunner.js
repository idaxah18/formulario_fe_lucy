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
    normalizeOmniaxHorasList,
    normalizeToOmniaxHora24,
    resolveOmniaxHoraSlot24,
} from './omniaxHoraFormat.js';
import { buildDiasMenuActions, buildHorasMenuActions } from './omniaxDisponibilidadMenus.js';
import { buildReagendarPayload, resolveCrearCoordenadas, withBeneficiarioFields } from './omniaxPayload.js';
import { idServicioDental } from '@/api/omniaxDentalApi.js';
import { fetchAsistenciasEnProceso as fetchMedicoAsistenciasEnProceso } from '@/api/omniaxMedicoApi.js';
import {
    asistenciaMenuLabel,
    loadAsistenciasParaReagendar,
    mensajeSinCitasReagendar,
} from './omniaxAsistencias.js';
import { botFromOmniaxResponse } from './omniaxNoticias.js';
import { bot } from '../flowHelpers.js';
import { buildSinCoberturaTransition, routeAfterAplicaAsignacion } from './omniaxEligibility.js';
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

function setMenu(ctx, headline, hint, actions) {
    const omx = ensureOmx(ctx);
    omx.dockHeadline = headline;
    omx.dockHint = hint || '';
    omx.menuActions = actions;
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
        case 'elegibilidad_agendar': {
            try {
                const res = await fetchAsistenciasEnProceso(cedula, false);
                omx.aplica_seguimiento_dental = Boolean(res.data?.aplica_seguimiento_dental);
                const list = res.data?.asistencias || [];
                const intro = list.length
                    ? [botFromOmniaxResponse(res), bot('Puedes generar una nueva cita dental a continuación.')]
                    : [];
                const apRes = await fetchAplicaAsignacion(cedula, null);
                omx.aplica_asignacion_establecimiento = parseOmniaxBool(
                    apRes.data?.aplica_asignacion_establecimiento,
                );
                omx.agenda_completa = omx.aplica_asignacion_establecimiento;
                omx.elegibilidad_ok = true;
                return {
                    nextNodeId: 'omx_den_cabina_preface',
                    messages: intro,
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

        case 'en_proceso': {
            const res = await fetchAsistenciasEnProceso(cedula, false);
            omx.aplica_seguimiento_dental = Boolean(res.data?.aplica_seguimiento_dental);
            const list = res.data?.asistencias || [];
            const intro = list.length
                ? [
                      botFromOmniaxResponse(res),
                      bot('Puedes generar una nueva cita dental a continuación.'),
                  ]
                : [];
            return { nextNodeId: 'omx_den_who', messages: intro };
        }

        case 'en_proceso_reagendar': {
            omx.reagendar = true;
            const { res, list, usedFallback } = await loadAsistenciasParaReagendar(
                (c, paraReagendar) => fetchAsistenciasEnProceso(c, paraReagendar),
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
            setMenu(
                ctx,
                '¿Cuál quieres reagendar?',
                res.noticias?.mensaje || '',
                list.map((a) => ({
                    id: `reag_${a.id_asistencia}`,
                    label: asistenciaMenuLabel(a),
                    next: 'omx_den_fecha_hora',
                    meta: {
                        omx: true,
                        id_asistencia: a.id_asistencia,
                        id_establecimiento: a.id_establecimiento,
                        reagendar: true,
                    },
                })),
            );
            return {
                nextNodeId: 'omx_den_reag_pick',
                messages: intro,
                stayOnNode: true,
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

        case 'disponibilidad_dias': {
            if (!omx.id_establecimiento) {
                return {
                    nextNodeId: 'omx_den_donde',
                    messages: [bot('Primero elige un establecimiento.')],
                };
            }
            const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
            const diasRes = await fetchDisponibilidadDias(omx.id_establecimiento, idAsistencia);
            const dias = diasRes.data || [];
            if (!dias.length) {
                return {
                    nextNodeId: 'omx_den_sin_fechas',
                    messages: [bot('No hay fechas disponibles en este establecimiento.')],
                };
            }
            setMenu(
                ctx,
                '¿En qué fecha deseas la cita?',
                '',
                buildDiasMenuActions(dias, 'omx_den_horas_load'),
            );
            return { nextNodeId: 'omx_den_dias_load', messages: [], stayOnNode: true };
        }

        case 'disponibilidad_horas': {
            if (!omx.id_establecimiento || !omx.fecha) {
                return {
                    nextNodeId: 'omx_den_dias_load',
                    messages: [bot('Elige primero la fecha de la cita.')],
                };
            }
            const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
            const page = omx.horas_page || 0;
            if (!omx.horas_slots?.length || omx._horas_fecha !== omx.fecha) {
                const horasRes = await fetchDisponibilidadHoras({
                    idEstablecimiento: omx.id_establecimiento,
                    fecha: omx.fecha,
                    idAsistencia,
                });
                omx.horas_slots = horasRes.data || [];
                omx._horas_fecha = omx.fecha;
            }
            if (!omx.horas_slots.length) {
                return {
                    nextNodeId: 'omx_den_dias_load',
                    messages: [bot('No hay horarios para esa fecha. Elige otra fecha.')],
                };
            }
            const actions = buildHorasMenuActions(omx.horas_slots, page, {
                nextVerifyNode: 'omx_den_verificar_disponibilidad_load',
                nextHorasNode: 'omx_den_horas_load',
                fecha: omx.fecha,
            });
            setMenu(ctx, 'Elige el horario disponible:', omx.fecha, actions);
            return { nextNodeId: 'omx_den_horas_load', messages: [], stayOnNode: true };
        }

        case 'establecimientos_gps': {
            const loc = ctx.lastLocation || omx;
            const lat = String(loc.latitude ?? omx.latitud);
            const lng = String(loc.longitude ?? omx.longitud);
            omx.latitud = lat;
            omx.longitud = lng;
            const res = await fetchEstablecimientosPorGps({ latitud: lat, longitud: lng });
            return buildEstablecimientosMenu(ctx, res.data || []);
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
            return buildEstablecimientosMenu(ctx, res.data || [], true);
        }

        case 'verificar_disponibilidad': {
            const fecha = omx.fecha;
            const hora = omx.hora;
            if (!fecha || !hora) {
                return {
                    nextNodeId: 'omx_den_fecha_hora',
                    messages: [bot('Ingresa fecha y hora antes de continuar.')],
                };
            }

            let fechaApi = fecha;
            let horaApi = normalizeToOmniaxHora24(hora);
            if (!horaApi) {
                return {
                    nextNodeId: 'omx_den_fecha_hora',
                    messages: [bot('Formato de hora inválido. Usa HH:mm (ej. 08:30).')],
                };
            }

            const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
            const nextLoad = omx.reagendar ? 'omx_den_reagendar_load' : 'omx_den_crear_load';

            if (omx.id_establecimiento) {
                const diasRes = await fetchDisponibilidadDias(omx.id_establecimiento, idAsistencia);
                const dias = diasRes.data || [];
                const diaMatch = dias.find((d) => d.valor === fecha);
                if (!diaMatch) {
                    return {
                        nextNodeId: 'omx_den_fecha_hora',
                        messages: [bot('La fecha no tiene disponibilidad. Prueba otra fecha.')],
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
                        .slice(0, 8)
                        .map((h) => normalizeToOmniaxHora24(h) || h)
                        .join(', ');
                    return {
                        nextNodeId: 'omx_den_fecha_hora',
                        messages: [
                            bot(`Esa hora no está disponible. Ejemplos (HH:mm): ${muestra || '08:30'}.`),
                        ],
                    };
                }
                horaApi = resolved;
            }

            omx.fecha = fechaApi;
            omx.hora = horaApi;

            return {
                nextNodeId: nextLoad,
                messages: [
                    bot(
                        `Disponibilidad validada para ${fechaApi} a las ${horaApi}. ${
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
                messages: [
                    botFromOmniaxResponse(res, [
                        d.establecimiento_y_url || d.proveedor ? `📍 ${d.establecimiento_y_url || d.proveedor}` : '',
                        d.fecha && d.hora ? `📅 ${d.fecha} a las ${d.hora}` : '',
                    ]),
                ],
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
                messages: [
                    botFromOmniaxResponse(res, [
                        d.fecha && d.hora ? `📅 ${d.fecha} a las ${d.hora}` : '',
                    ]),
                ],
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
    const actions = list.map((e) => ({
        id: `est_${e.id}`,
        label: e.nombre_establecimiento,
        next: 'omx_den_dias_load',
        meta: { omx: true, id_establecimiento: e.id, url_mapa: e.url_mapa },
    }));
    if (!fromZona) {
        actions.push({
            id: 'otra_ubic',
            label: 'Otra ubicación',
            next: 'omx_den_ciudades_load',
            meta: { omx: true },
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
