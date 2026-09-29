import {
    aceptarLopdp,
    fetchAsistenciaEnCurso,
    fetchMenuProveedorValida,
} from '@/api/geaToolsApi.js';
import { crearDerivacionLead } from '@/api/comercialApi.js';
import { fetchAsistenciasEnProceso as fetchDentalEnProceso } from '@/api/omniaxDentalApi.js';
import { fetchAsistenciasEnProceso as fetchMedicoEnProceso } from '@/api/omniaxMedicoApi.js';
import {
    ASISTENCIAS_ACTIVAS_PAGE_SIZE,
    asistenciaActivaMenuStyle,
    buildDerivacionAsistenciaPayload,
    labelAsistenciaActiva,
    mergeAsistenciasActivas,
    sortAsistenciasActivasDesc,
} from './asistenciasActivas.js';
import { isAdvisorHandoffDoneNode } from '../advisorHandoffCopy.js';
import { runCabinaGateOrBlock } from './cabinaGate.js';
import { buildCabinaBlockedTransition } from '../cabinaHandoff.js';
import {
    actualizarUbicacionAsistencia,
    calificarCuestionario,
    cancelarAsistencia,
    crearAsistenciaGea,
    evaluacionConfirmada,
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
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import {
    buildAsistenciasHubExitAction,
    getPostAuthIntentTargetNode,
    resolveWebviewIntent,
} from '../webviewIntent.js';
import { runAutomaticoEnter } from './automaticoRunner.js';
import { recordAutomaticoAnswer } from './automaticoPreguntas.js';

function ensureGea(ctx) {
    if (!ctx.gea) ctx.gea = {};
    return ctx.gea;
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
    if (patch.autoPreguntaRecord) {
        recordAutomaticoAnswer(ensureGea(state.context), patch.autoPreguntaRecord);
        delete patch.autoPreguntaRecord;
    }
    if (patch.selectedAsistenciaIndex != null) {
        ensureGea(state.context).selectedAsistenciaIndex = Number(patch.selectedAsistenciaIndex);
    }
    if (patch.asistenciasActivasPage != null) {
        ensureGea(state.context).asistenciasActivasPage = Number(patch.asistenciasActivasPage);
    }
    if (patch.encuestaAnswer) {
        ensureGea(state.context).pendingEncuestaAnswer = patch.encuestaAnswer;
        delete patch.encuestaAnswer;
    }
    if (patch.respuestaProveedor != null) {
        ensureGea(state.context).respuestaProveedor = String(patch.respuestaProveedor);
    }
    if (patch.setTipoVehiculo) {
        const gea = ensureGea(state.context);
        const apiTipo = String(patch.setTipoVehiculo).trim().toUpperCase();
        gea.vehiculo = {
            ...(gea.vehiculo || {}),
            tipo_vehiculo: apiTipo,
        };
        gea.tipoVehiculoMenuActive = false;
        delete patch.setTipoVehiculo;
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

function showAsistenciasActivasHub(ctx, gea, merged, { resetPage = false } = {}) {
    if (resetPage) {
        gea.asistenciasActivasPage = 0;
    }
    const page = Number(gea.asistenciasActivasPage) || 0;
    const sorted = sortAsistenciasActivasDesc(merged);
    gea.asistenciasActivas = sorted;

    const pageSize = ASISTENCIAS_ACTIVAS_PAGE_SIZE;
    const start = page * pageSize;
    const pageItems = sorted.slice(start, start + pageSize);

    const actions = pageItems.map((item, i) => {
        const globalIndex = start + i;
        const style = asistenciaActivaMenuStyle(item) || {};
        return {
            id: `asig_${globalIndex}`,
            label: labelAsistenciaActiva(item),
            next: 'asistencia_activa_pick_load',
            meta: { gea: { selectedAsistenciaIndex: globalIndex } },
            icon: style.icon,
            menuTone: style.menuTone,
        };
    });

    if (start + pageSize < sorted.length) {
        actions.push({
            id: 'more',
            label: 'Ver más',
            next: 'asistencia_activa_list',
            meta: { gea: { asistenciasActivasPage: page + 1 } },
            icon: 'chevron-right',
            menuTone: 'tone-blue',
        });
    }

    actions.push(buildAsistenciasHubExitAction(ctx));

    let hint =
        sorted.length > pageSize
            ? `Mostrando ${start + 1}–${Math.min(start + pageSize, sorted.length)} de ${sorted.length} (más recientes primero).`
            : `${sorted.length} asistencia(s), más recientes primero.`;
    if (resolveWebviewIntent(ctx)) {
        hint += ' También puedes escribir Menú principal para volver al inicio.';
    }

    setMenu(
        ctx,
        'Tienes asistencias en curso',
        hint,
        actions,
    );
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
        label: 'Salir del menú',
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
    const telefono = requireLucyTelefono(ctx);
    gea.telefono = telefono;

    const preserveGeaMenu =
        task === 'auto_vehiculo_pick'
        || task === 'auto_tipo_vehiculo_pick';
    if (!String(task).startsWith('encuesta_') && !preserveGeaMenu) {
        clearGeaMenu(ctx);
    }

    if (String(task).startsWith('auto_')) {
        return runAutomaticoEnter(task, state);
    }

    switch (task) {
        case 'lopdp': {
            if (!cedula) {
                throw new Error('Falta la cédula para registrar LOPDP.');
            }
            const lopdpMessages = [];
            try {
                const res = await aceptarLopdp(cedula);
                if (res.branch && res.branch !== 'success') {
                    lopdpMessages.push(
                        bot(`⚠️ LOPDP: ${res.message || 'No se pudo registrar aceptación.'}`),
                    );
                }
            } catch (e) {
                const msg =
                    e.response?.data?.noticias?.mensaje
                    || e.response?.data?.message
                    || e.message
                    || 'Configura GEA_LOPDP_API_KEY en el servidor (.env).';
                lopdpMessages.push(bot(`⚠️ LOPDP: ${msg}`));
            }
            return {
                messages: lopdpMessages,
                nextNodeId: gea.afterLopdpNext || 'post_auth_gate_load',
                patchContext: { gea },
            };
        }

        case 'post_auth_asistencias_gate': {
            if (ctx.skipToAseguradora) {
                ctx.skipToAseguradora = false;
                return {
                    messages: [],
                    nextNodeId: 'menu_aseguradora',
                    patchContext: { gea },
                };
            }
            if (!cedula) {
                throw new Error('Falta la cédula del titular.');
            }

            const [geaToolRes, medicoRes, dentalRes] = await Promise.allSettled([
                fetchAsistenciaEnCurso(telefono),
                fetchMedicoEnProceso(cedula, false),
                fetchDentalEnProceso(cedula, false),
            ]);

            const merged = mergeAsistenciasActivas({
                geaTool: geaToolRes.status === 'fulfilled' ? geaToolRes.value : null,
                medicoRes: medicoRes.status === 'fulfilled' ? medicoRes.value : null,
                dentalRes: dentalRes.status === 'fulfilled' ? dentalRes.value : null,
            });

            if (!merged.length) {
                const intentNode = getPostAuthIntentTargetNode(ctx);
                return {
                    messages: [],
                    nextNodeId: intentNode || 'menu_solucion_24_7',
                    patchContext: { gea },
                };
            }

            showAsistenciasActivasHub(ctx, gea, merged, { resetPage: true });
            return {
                messages: [],
                nextNodeId: 'asistencias_activas_hub',
                patchContext: { gea },
                clearNavStack: true,
            };
        }

        case 'asistencia_activa_list': {
            const merged = gea.asistenciasActivas || [];
            if (!merged.length) {
                return {
                    messages: [],
                    nextNodeId: 'post_auth_gate_load',
                    patchContext: { gea },
                };
            }
            showAsistenciasActivasHub(ctx, gea, merged);
            return {
                messages: [],
                nextNodeId: 'asistencias_activas_hub',
                patchContext: { gea },
            };
        }

        case 'asistencia_activa_pick': {
            const idx = Number(gea.selectedAsistenciaIndex);
            const item = gea.asistenciasActivas?.[idx];
            if (!item) {
                return {
                    messages: [bot('No encontramos esa asistencia. Vuelve al listado.')],
                    nextNodeId: 'asistencia_activa_list',
                    patchContext: { gea },
                };
            }
            gea.selectedAsistencia = item;
            setMenu(
                ctx,
                item.tipo,
                `${item.detalle}${item.id != null ? `\nID asistencia: ${item.id}` : ''}`,
                [
                    {
                        id: 'asesor',
                        label: 'Contactar asesor por esta asistencia',
                        next: 'asistencia_activa_asesor_load',
                    },
                    {
                        id: 'back',
                        label: 'Volver al listado',
                        next: 'asistencia_activa_list',
                        meta: { gea: { asistenciasActivasPage: 0 } },
                    },
                    { id: 'home', label: 'Menú principal', next: 'menu_solucion_24_7' },
                ],
            );
            return {
                messages: [],
                nextNodeId: 'asistencia_activa_detalle',
                patchContext: { gea },
            };
        }

        case 'derivacion_asesor_asistencia': {
            if (!cedula) throw new Error('Ingresa tu cédula al inicio.');
            const item = gea.selectedAsistencia;
            if (!item) {
                return {
                    messages: [bot('Selecciona primero una asistencia del listado.')],
                    nextNodeId: 'asistencia_activa_list',
                    patchContext: { gea },
                };
            }
            const derivacion = await crearDerivacionLead(
                buildDerivacionAsistenciaPayload(item, { cedula, nombre, telefono }),
            );
            const simulated = Boolean(derivacion?.simulated);
            clearGeaMenu(ctx);
            if (simulated) {
                gea.advisorHandoffSimulated = true;
            }
            return {
                messages: [],
                nextNodeId: 'asistencia_activa_asesor_done',
                patchContext: { gea },
            };
        }

        case 'cabina_gate': {
            const gate = await runCabinaGateOrBlock(
                ctx,
                gea.tipoServicio || 'HOGAR',
                'menu_solucion_24_7',
                gea.planAsistencia || 'ASISTENCIAS',
            );
            if (gate.blocked) {
                const blocked = buildCabinaBlockedTransition(gate, 'menu_solucion_24_7');
                return {
                    ...blocked,
                    patchContext: { gea, ...blocked.patchContext },
                };
            }
            return { rerunTask: 'crear' };
        }

        case 'prov_valida': {
            const id = resolveIdAsistencia(gea);
            if (!id) throw new Error('Indica el número de asistencia.');
            const valida = await fetchMenuProveedorValida(id, gea.provOpcion || 'contacto');
            if (valida.branch !== 'successOutput') {
                return {
                    messages: [
                        bot(
                            valida.message ||
                                'La asistencia ingresada no es válida o no tiene proveedor asignado.',
                        ),
                    ],
                    nextNodeId: 'menu_utilidades',
                    patchContext: { gea },
                };
            }
            return {
                messages: [],
                nextNodeId: gea.afterProvValidaNext || 'menu_utilidades',
                patchContext: { gea },
            };
        }

        case 'crear': {
            const serviceId = String(gea.idServicio || '').trim();
            if (!cedula || !nombre) {
                throw new Error('Completa cédula y nombre antes de solicitar la asistencia.');
            }
            if (!serviceId) {
                throw new Error('No hay id_servicio configurado para este tipo de asistencia.');
            }
            let lat = gea.latitud || ctx.omniax?.latitud || ctx.lastLocation?.latitude;
            let lng = gea.longitud || ctx.omniax?.longitud || ctx.lastLocation?.longitude;
            let direccion = String(gea.direccion || 'Sin referencia').trim();
            if (gea.sinUbicacion) {
                lat = lat ?? '';
                lng = lng ?? '';
                direccion = 'NO APLICA DIRECCION';
            } else if (lat == null || lng == null) {
                throw new Error('Falta la ubicación GPS para crear la asistencia.');
            }
            const body = {
                telefono,
                nombres: nombre,
                cveafiliado: cedula,
                id_servicio: serviceId,
                direccion,
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

            const nextNodeId = gea.afterCrearNext || 'gea_crear_exit';
            const messages = isAdvisorHandoffDoneNode(nextNodeId)
                ? []
                : [botFromOmniaxResponse(res, extra)];

            return {
                messages,
                nextNodeId,
                patchContext: { gea },
            };
        }

        case 'en_proceso_remitente': {
            return {
                messages: [],
                nextNodeId: 'post_auth_gate_load',
                patchContext: { gea },
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
