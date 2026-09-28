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
    normalizeOmniaxHorasList,
    normalizeToOmniaxHora24,
    resolveOmniaxHoraSlot24,
} from './omniaxHoraFormat.js';
import { buildDiasMenuActions, buildHorasMenuActions } from './omniaxDisponibilidadMenus.js';
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
} from './omniaxAsistencias.js';
import { botFromOmniaxResponse } from './omniaxNoticias.js';
import { runCabinaGateOrBlock } from '../gea/cabinaGate.js';
import { bot } from '../flowHelpers.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import { OMX_SIN_ASIGNACION_DOCK } from './omniaxDockCopy.js';

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
    if (rest.fecha !== undefined && rest.fecha !== target.fecha) {
        target.horas_page = rest.horas_page ?? 0;
        delete target.horas_slots;
        delete target._horas_fecha;
    }
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
        case 'cabina_gate': {
            const gate = await runCabinaGateOrBlock(ctx, omx.tipoServicio || 'MEDICO', 'menu_medico', 'ASISTENCIAS', {
                allowVigenteForAppointments: true,
            });
            if (gate.blocked) {
                return {
                    messages: gate.messages,
                    nextNodeId: gate.nextNodeId,
                    patchContext: { omniax: omx },
                };
            }
            return {
                messages: [],
                nextNodeId: omx.afterCabinaNext || 'omx_med_start',
                patchContext: { omniax: omx },
            };
        }

        case 'en_proceso': {
            const res = await fetchAsistenciasEnProceso(cedula, false);
            omx.aplica_seguimiento_dental = Boolean(res.data?.aplica_seguimiento_dental);
            const list = res.data?.asistencias || [];
            if (list.length > 0) {
                const lines = list.map((a) => `• ${a.detalle} (No. ${a.id_asistencia})`);
                return {
                    nextNodeId: 'omx_med_who',
                    messages: [
                        bot('Tienes asistencias en proceso:\n' + lines.join('\n')),
                        bot('Puedes generar una nueva cita médica a continuación.'),
                    ],
                };
            }
            return { nextNodeId: 'omx_med_who', messages: [] };
        }

        case 'en_proceso_reagendar': {
            omx.reagendar = true;
            const { res, list, usedFallback } = await loadAsistenciasParaReagendar(
                (c, paraReagendar) => fetchAsistenciasEnProceso(c, paraReagendar),
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
            setMenu(
                ctx,
                '¿Cuál quieres reagendar?',
                res.noticias?.mensaje || '',
                list.map((a) => ({
                    id: `reag_${a.id_asistencia}`,
                    label: asistenciaMenuLabel(a),
                    next: 'omx_med_fecha_hora',
                    meta: {
                        omx: true,
                        id_asistencia: a.id_asistencia,
                        id_especialidad: a.id_especialidad,
                        id_establecimiento: a.id_establecimiento,
                        reagendar: true,
                    },
                })),
            );
            return {
                nextNodeId: 'omx_med_reag_pick',
                messages: intro,
                stayOnNode: true,
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
            omx.agenda_completa = omx.aplica_asignacion_establecimiento;
            if (omx.aplica_asignacion_establecimiento) {
                return {
                    nextNodeId: 'omx_med_donde',
                    messages: [bot('¿Dónde te gustaría agendar tu cita?')],
                };
            }
            setMenu(
                ctx,
                OMX_SIN_ASIGNACION_DOCK.headline,
                OMX_SIN_ASIGNACION_DOCK.hint,
                [
                    {
                        id: 'asesor',
                        label: 'Continuar con asesor',
                        next: 'omx_med_asesor_load',
                    },
                    { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
                ],
            );
            return {
                nextNodeId: 'omx_med_sin_asignacion',
                messages: [],
            };
        }

        case 'disponibilidad_dias': {
            if (!omx.id_establecimiento) {
                return {
                    nextNodeId: 'omx_med_donde',
                    messages: [bot('Primero elige un establecimiento.')],
                };
            }
            const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
            const diasRes = await fetchDisponibilidadDias(
                omx.id_especialidad,
                omx.id_establecimiento,
                idAsistencia,
            );
            const dias = diasRes.data || [];
            if (!dias.length) {
                return {
                    nextNodeId: 'omx_med_sin_fechas',
                    messages: [bot('No hay fechas disponibles en este establecimiento.')],
                };
            }
            setMenu(
                ctx,
                '¿En qué fecha deseas la cita?',
                omx.especialidad_nombre || '',
                buildDiasMenuActions(dias, 'omx_med_horas_load'),
            );
            return { nextNodeId: 'omx_med_dias_load', messages: [], stayOnNode: true };
        }

        case 'disponibilidad_horas': {
            if (!omx.id_establecimiento || !omx.fecha) {
                return {
                    nextNodeId: 'omx_med_dias_load',
                    messages: [bot('Elige primero la fecha de la cita.')],
                };
            }
            const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
            const page = omx.horas_page || 0;
            if (!omx.horas_slots?.length || omx._horas_fecha !== omx.fecha) {
                const horasRes = await fetchDisponibilidadHoras({
                    idEspecialidad: omx.id_especialidad,
                    idEstablecimiento: omx.id_establecimiento,
                    fecha: omx.fecha,
                    idAsistencia,
                });
                omx.horas_slots = horasRes.data || [];
                omx._horas_fecha = omx.fecha;
            }
            if (!omx.horas_slots.length) {
                return {
                    nextNodeId: 'omx_med_dias_load',
                    messages: [bot('No hay horarios para esa fecha. Elige otra fecha.')],
                };
            }
            const actions = buildHorasMenuActions(omx.horas_slots, page, {
                nextVerifyNode: 'omx_med_verificar_disponibilidad_load',
                nextHorasNode: 'omx_med_horas_load',
                fecha: omx.fecha,
            });
            setMenu(
                ctx,
                'Elige el horario disponible:',
                omx.fecha,
                actions,
            );
            return { nextNodeId: 'omx_med_horas_load', messages: [], stayOnNode: true };
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
            return buildEstablecimientosMenu(ctx, res.data || []);
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
            return buildEstablecimientosMenu(ctx, res.data || [], true);
        }

        case 'verificar_disponibilidad': {
            const fecha = omx.fecha;
            const hora = omx.hora;
            if (!fecha || !hora) {
                return {
                    nextNodeId: 'omx_med_fecha_hora',
                    messages: [bot('Ingresa fecha y hora antes de continuar.')],
                };
            }

            let fechaApi = fecha;
            let horaApi = normalizeToOmniaxHora24(hora);
            if (!horaApi) {
                return {
                    nextNodeId: 'omx_med_fecha_hora',
                    messages: [bot('Formato de hora inválido. Usa HH:mm (ej. 08:30).')],
                };
            }

            const idAsistencia = omx.reagendar ? omx.id_asistencia : null;
            const nextLoad = omx.reagendar ? 'omx_med_reagendar_load' : 'omx_med_crear_load';

            if (omx.id_establecimiento && omx.id_especialidad) {
                const diasRes = await fetchDisponibilidadDias(
                    omx.id_especialidad,
                    omx.id_establecimiento,
                    idAsistencia,
                );
                const dias = diasRes.data || [];
                const diaMatch = dias.find((d) => d.valor === fecha);
                if (!diaMatch) {
                    return {
                        nextNodeId: 'omx_med_fecha_hora',
                        messages: [
                            bot('La fecha no tiene disponibilidad en este establecimiento. Prueba otra fecha.'),
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
                        .slice(0, 8)
                        .map((h) => normalizeToOmniaxHora24(h) || h)
                        .join(', ');
                    return {
                        nextNodeId: 'omx_med_fecha_hora',
                        messages: [
                            bot(
                                `Esa hora no está disponible. Horarios ejemplo (HH:mm): ${muestra || '08:30'}.`,
                            ),
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
                            omx.reagendar ? 'Reagendando…' : 'Registrando asistencia…'
                        }`,
                    ),
                ],
            };
        }

        case 'crear': {
            if (!omx.id_establecimiento || !omx.fecha || !omx.hora) {
                return {
                    nextNodeId: 'omx_med_error',
                    messages: [
                        bot(
                            'Faltan datos para crear la cita (establecimiento, fecha u hora). Vuelve a «Agendar cita médica» y completa todos los pasos.',
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
                messages: [
                    botFromOmniaxResponse(res, [
                        d.establecimiento_y_url || d.proveedor ? `📍 ${d.establecimiento_y_url || d.proveedor}` : '',
                        d.fecha && d.hora ? `📅 ${d.fecha} a las ${d.hora}` : '',
                        d.url_monitoreo ? `Seguimiento: ${d.url_monitoreo}` : '',
                        'Por favor acude 15 minutos antes. No olvides llevar tu cédula.',
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
                nextNodeId: 'omx_med_done',
                messages: [
                    botFromOmniaxResponse(res, [
                        d.fecha && d.hora ? `📅 ${d.fecha} a las ${d.hora}` : '',
                    ]),
                ],
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
    const actions = list.map((e) => ({
        id: `est_${e.id}`,
        label: e.nombre_establecimiento,
        next: 'omx_med_dias_load',
        meta: { omx: true, id_establecimiento: e.id, url_mapa: e.url_mapa },
    }));
    if (!fromZona) {
        actions.push({
            id: 'otra_ubic',
            label: 'Otra ubicación',
            next: 'omx_med_ciudades_load',
            meta: { omx: true },
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
