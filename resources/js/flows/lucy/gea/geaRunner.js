import {
    actualizarUbicacionAsistencia,
    calificarCuestionario,
    cancelarAsistencia,
    crearAsistenciaGea,
    evaluacionConfirmada,
    fetchAsistenciasEnProcesoRemitente,
    fetchCuestionario,
    fetchListadoChatbotTelefono,
    reenviarEvaluacion,
    respuestaContacto,
    respuestaTermino,
} from '@/api/omniaxGeaApi.js';
import { bot, standardExitActions } from '../flowHelpers.js';
import { botFromOmniaxResponse } from '../omniax/omniaxNoticias.js';
import {
    buildEncuestaMenuActions,
    cuestionarioId,
    normalizePreguntas,
    pushEncuestaRespuesta,
} from './geaEncuesta.js';

function ensureGea(ctx) {
    if (!ctx.gea) ctx.gea = {};
    return ctx.gea;
}

function telefonoFromRoute() {
    const params = new URLSearchParams(window.location.search);
    return params.get('telefono') || '0999999999';
}

function setMenu(ctx, headline, hint, actions) {
    const gea = ensureGea(ctx);
    gea.dockHeadline = headline;
    gea.dockHint = hint || '';
    gea.menuActions = actions;
}

export function clearGeaMenu(ctx) {
    if (!ctx?.gea) return;
    delete ctx.gea.menuActions;
    delete ctx.gea.dockHeadline;
    delete ctx.gea.dockHint;
}

export function getGeaMenuActions(state) {
    return state.context?.gea?.menuActions || null;
}

export function getGeaDockCopy(state) {
    const gea = state.context?.gea;
    if (!gea?.dockHeadline) return null;
    return { headline: gea.dockHeadline, hint: gea.dockHint || '' };
}

export function getGeaEnterTask(state, node) {
    return node?.gea?.enter || null;
}

export function applyGeaQuickMeta(state, action) {
    if (!action?.meta?.gea) return;
    const patch = { ...action.meta.gea };
    if (patch.encuestaAnswer) {
        ensureGea(state.context).pendingEncuestaAnswer = patch.encuestaAnswer;
        delete patch.encuestaAnswer;
    }
    if (patch.respuestaProveedor != null) {
        ensureGea(state.context).respuestaProveedor = String(patch.respuestaProveedor);
    }
    Object.assign(ensureGea(state.context), patch);
}

function normalizeAsistenciaRows(payload) {
    const raw = payload?.data ?? payload;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray(raw.asistencias)) return raw.asistencias;
    return [];
}

function asistenciaLabel(row, index) {
    const id = row.id_asistencia ?? row.IdAsistencia ?? row.id ?? row.ID;
    const desc =
        row.servicio_descripcion ??
        row.servicio ??
        row.service ??
        row.descripcion ??
        row.Servicio ??
        'Asistencia';
    if (id != null) return `${index + 1}. ${desc} (#${id})`;
    return `${index + 1}. ${desc}`;
}

function pickIdAsistencia(row) {
    const id = row.id_asistencia ?? row.IdAsistencia ?? row.id ?? row.ID;
    return id != null ? Number(id) : null;
}

function resolveIdAsistencia(gea) {
    const id =
        gea.id_asistencia_evaluar ??
        gea.id_asistencia ??
        gea.preview_id;
    return id != null ? Number(id) : null;
}

function showEncuestaQuestion(ctx, gea) {
    const preguntas = gea.encuestaPreguntas || [];
    const idx = gea.encuestaIndex ?? 0;
    if (idx >= preguntas.length) {
        return null;
    }
    const pregunta = preguntas[idx];
    const enunciado =
        pregunta?.enunciado ?? pregunta?.pregunta ?? pregunta?.texto ?? 'Selecciona una opción:';
    const actions = buildEncuestaMenuActions(pregunta, idx, preguntas.length);
    actions.push({
        id: 'gea_enc_salir',
        label: '0. Salir del menú',
        next: 'menu_utilidades',
    });
    setMenu(
        ctx,
        `Pregunta ${idx + 1} de ${preguntas.length}`,
        String(enunciado).trim(),
        actions,
    );
    return bot(String(enunciado).trim());
}

async function submitEncuesta(gea) {
    const idAsistencia = resolveIdAsistencia(gea);
    const body = {
        id_asistencia: idAsistencia,
        id_cuestionario: gea.id_cuestionario,
        preguntas: gea.encuestaRespuestas || [],
    };
    return calificarCuestionario(body);
}

export async function runGeaEnter(task, state) {
    const ctx = state.context;
    const gea = ensureGea(ctx);
    const cedula = ctx.cedula;
    const nombre = ctx.nombre;
    const telefono = telefonoFromRoute();
    gea.telefono = telefono;

    if (!String(task).startsWith('encuesta_')) {
        clearGeaMenu(ctx);
    }

    switch (task) {
        case 'crear': {
            const serviceId = String(gea.idServicio || '').trim();
            if (!cedula || !nombre) {
                throw new Error('Completa cédula y nombre antes de solicitar la asistencia.');
            }
            if (!serviceId) {
                throw new Error('No hay id_servicio configurado para este tipo de asistencia.');
            }
            const lat = gea.latitud || ctx.omniax?.latitud || ctx.lastLocation?.latitude;
            const lng = gea.longitud || ctx.omniax?.longitud || ctx.lastLocation?.longitude;
            if (lat == null || lng == null) {
                throw new Error('Falta la ubicación GPS para crear la asistencia.');
            }
            const body = {
                telefono,
                nombres: nombre,
                cveafiliado: cedula,
                id_servicio: serviceId,
                direccion: String(gea.direccion || 'Sin referencia').trim(),
                latitud: String(lat),
                longitud: String(lng),
            };
            const placa = ctx.plate || gea.placa;
            if (placa) body.placa = String(placa).trim();

            const res = await crearAsistenciaGea(body);
            const caso = res.data?.numero_caso;
            const idAsist = res.data?.id_asistencia;
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

        case 'en_proceso_remitente': {
            const res = await fetchAsistenciasEnProcesoRemitente(telefono);
            const list = normalizeAsistenciaRows(res);
            if (!list.length) {
                return {
                    messages: [
                        bot(
                            res?.noticias?.mensaje ||
                                'Al momento no tienes asistencias en proceso con este número.',
                        ),
                    ],
                    nextNodeId: 'choose_plan',
                    patchContext: { gea },
                };
            }
            const actions = list.slice(0, 9).map((row, i) => ({
                id: `gea_enp_${i}`,
                label: asistenciaLabel(row, i),
                next: 'menu_solucion_24_7',
                meta: { gea: { preview_id: pickIdAsistencia(row) } },
            }));
            actions.push(
                { id: 'reag', label: 'Reagendar asistencia', next: 'reagendar_asistencia' },
                { id: 'cancel_flow', label: 'Cancelar asistencia', next: 'cancelar_asistencia' },
                ...standardExitActions('choose_plan'),
            );
            setMenu(ctx, 'Asistencias en curso', 'Selecciona una opción.', actions);
            return {
                messages: [bot('Estas son tus asistencias activas:')],
                stayOnNode: true,
                patchContext: { gea: { ...gea, enProcesoList: list } },
            };
        }

        case 'listado_cancel': {
            if (!cedula) throw new Error('Falta la cédula del titular.');
            const res = await fetchListadoChatbotTelefono(cedula, telefono);
            const list = normalizeAsistenciaRows(res);
            if (!list.length) {
                return {
                    messages: [
                        bot(
                            res?.noticias?.mensaje ||
                                'No encontramos asistencias activas que puedas cancelar.',
                        ),
                    ],
                    nextNodeId: 'menu_solucion_24_7',
                    patchContext: { gea },
                };
            }
            const actions = list.slice(0, 9).map((row, i) => {
                const id = pickIdAsistencia(row);
                return {
                    id: `gea_can_${id ?? i}`,
                    label: asistenciaLabel(row, i),
                    next: 'gea_cancel_done',
                    meta: { gea: { id_asistencia: id } },
                };
            });
            actions.push(...standardExitActions());
            setMenu(ctx, '¿Cuál asistencia deseas cancelar?', '', actions);
            return {
                messages: [bot('Tienes estos servicios en proceso. ¿Cuál quieres cancelar?')],
                stayOnNode: true,
                patchContext: { gea },
            };
        }

        case 'cancelar': {
            const id = Number(gea.id_asistencia);
            if (!id) throw new Error('No se seleccionó una asistencia para cancelar.');
            const res = await cancelarAsistencia(id);
            return {
                messages: [
                    botFromOmniaxResponse(res, [
                        'Tu solicitud de asistencia ha sido cancelada. Si necesitas otro servicio, elige una opción del menú.',
                    ]),
                ],
                nextNodeId: 'menu_solucion_24_7',
                patchContext: { gea },
            };
        }

        case 'ubicacion_put': {
            const id = resolveIdAsistencia(gea);
            const lat = gea.latitud || ctx.lastLocation?.latitude;
            const lng = gea.longitud || ctx.lastLocation?.longitude;
            if (!id) throw new Error('Indica el número de asistencia.');
            if (lat == null || lng == null) throw new Error('Comparte la ubicación GPS.');
            const res = await actualizarUbicacionAsistencia(id, lat, lng);
            return {
                messages: [botFromOmniaxResponse(res, [`Ubicación actualizada para asistencia #${id}.`])],
                nextNodeId: 'menu_utilidades',
                patchContext: { gea },
            };
        }

        case 'cuestionario_load': {
            const id = resolveIdAsistencia(gea);
            if (!id) throw new Error('Indica el ID de asistencia para la encuesta.');
            const res = await fetchCuestionario(id);
            const preguntas = normalizePreguntas(res);
            if (!preguntas.length) {
                return {
                    messages: [
                        bot(
                            res?.noticias?.mensaje ||
                                'No hay cuestionario disponible para esta asistencia.',
                        ),
                    ],
                    nextNodeId: 'menu_utilidades',
                    patchContext: { gea },
                };
            }
            gea.id_asistencia_evaluar = id;
            gea.id_cuestionario = cuestionarioId(res);
            gea.encuestaPreguntas = preguntas;
            gea.encuestaIndex = 0;
            gea.encuestaRespuestas = [];
            delete gea.pendingEncuestaAnswer;
            delete gea.awaitingMotivo;
            const line = showEncuestaQuestion(ctx, gea);
            return {
                messages: line ? [line] : [],
                nextNodeId: 'gea_encuesta_active',
                patchContext: { gea },
            };
        }

        case 'encuesta_process_answer': {
            const pending = gea.pendingEncuestaAnswer;
            if (!pending) throw new Error('No hay respuesta de encuesta pendiente.');
            if (pending.aplica_motivo) {
                gea.awaitingMotivo = true;
                gea.pendingEncuestaAnswer = pending;
                return {
                    messages: [bot(String(pending.motivo_label || 'Cuéntanos un poco más:'))],
                    nextNodeId: 'gea_encuesta_active',
                    patchContext: { gea },
                };
            }
            pushEncuestaRespuesta(gea, {
                id: pending.id_pregunta,
                respuestas: [{ id: pending.id_respuesta }],
            });
            gea.encuestaIndex = (gea.encuestaIndex ?? 0) + 1;
            delete gea.pendingEncuestaAnswer;
            return advanceEncuesta(ctx, gea);
        }

        case 'encuesta_motivo_submit': {
            const pending = gea.pendingEncuestaAnswer;
            const texto = String(gea.lastMotivoText || '').trim();
            if (!pending || !texto) throw new Error('Escribe el motivo solicitado.');
            pushEncuestaRespuesta(gea, {
                id: pending.id_pregunta,
                respuestas: [{ id: pending.id_respuesta, respuestaAplicaMotivo: texto }],
            });
            gea.encuestaIndex = (gea.encuestaIndex ?? 0) + 1;
            delete gea.pendingEncuestaAnswer;
            delete gea.awaitingMotivo;
            delete gea.lastMotivoText;
            return advanceEncuesta(ctx, gea);
        }

        case 'reenviar_evaluacion': {
            const id = resolveIdAsistencia(gea);
            if (!id) throw new Error('Indica el ID de asistencia.');
            const res = await reenviarEvaluacion(id);
            return {
                messages: [botFromOmniaxResponse(res)],
                nextNodeId: 'menu_utilidades',
                patchContext: { gea },
            };
        }

        case 'evaluacion_confirmada': {
            const id = resolveIdAsistencia(gea);
            if (!id) throw new Error('Indica el ID de asistencia.');
            const res = await evaluacionConfirmada(id);
            return {
                messages: [botFromOmniaxResponse(res)],
                nextNodeId: 'menu_utilidades',
                patchContext: { gea },
            };
        }

        case 'prov_termino': {
            const id = resolveIdAsistencia(gea);
            const resp = gea.respuestaProveedor;
            if (!id || !resp) throw new Error('Faltan datos de asistencia o respuesta.');
            const res = await respuestaTermino(id, resp);
            return {
                messages: [botFromOmniaxResponse(res)],
                nextNodeId: 'menu_utilidades',
                patchContext: { gea },
            };
        }

        case 'prov_contacto': {
            const id = resolveIdAsistencia(gea);
            const resp = gea.respuestaProveedor;
            if (!id || !resp) throw new Error('Faltan datos de asistencia o respuesta.');
            const res = await respuestaContacto(id, resp);
            return {
                messages: [botFromOmniaxResponse(res)],
                nextNodeId: 'menu_utilidades',
                patchContext: { gea },
            };
        }

        default:
            throw new Error(`Tarea GEA desconocida: ${task}`);
    }
}

async function advanceEncuesta(ctx, gea) {
    const preguntas = gea.encuestaPreguntas || [];
    const idx = gea.encuestaIndex ?? 0;
    if (idx < preguntas.length) {
        const line = showEncuestaQuestion(ctx, gea);
        return {
            messages: line ? [line] : [],
            nextNodeId: 'gea_encuesta_active',
            patchContext: { gea },
        };
    }
    const res = await submitEncuesta(gea);
    clearGeaMenu(ctx);
    return {
        messages: [botFromOmniaxResponse(res, ['¡Gracias por completar la encuesta!'])],
        nextNodeId: 'menu_utilidades',
        patchContext: { gea },
    };
}
