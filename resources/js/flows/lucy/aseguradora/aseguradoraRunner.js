import {
    consultaPlacaSiniestro,
    consultaPlacaVial,
    fetchCiudades,
    fetchProvincias,
    inspeccionBuscarAseguradora,
    reporteColision,
    reporteRoboParcial,
    reporteRoboTotal,
} from '@/api/aseguradoraApi.js';
import { botFromOmniaxResponse } from '../omniax/omniaxNoticias.js';
import { bot, standardExitActions } from '../flowHelpers.js';
import { runCabinaGateOrBlock } from '../gea/cabinaGate.js';
import { buildCabinaBlockedTransition } from '../cabinaHandoff.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';

function ensureAseg(ctx) {
    if (!ctx.aseg) ctx.aseg = {};
    return ctx.aseg;
}

function setMenu(ctx, headline, hint, actions) {
    const aseg = ensureAseg(ctx);
    aseg.dockHeadline = headline;
    aseg.dockHint = hint || '';
    aseg.menuActions = actions;
}

export function clearAsegMenu(ctx) {
    if (!ctx?.aseg) return;
    delete ctx.aseg.menuActions;
    delete ctx.aseg.dockHeadline;
    delete ctx.aseg.dockHint;
}

export function getAsegMenuActions(state) {
    return state.context?.aseg?.menuActions || null;
}

export function getAsegDockCopy(state) {
    const aseg = state.context?.aseg;
    if (!aseg?.dockHeadline) return null;
    return { headline: aseg.dockHeadline, hint: aseg.dockHint || '' };
}

export function getAsegEnterTask(state, node) {
    return node?.aseg?.enter || null;
}

function pickAfiliacion(res) {
    const d = res?.data;
    if (!d) return null;
    if (Array.isArray(d) && d.length) return d[0];
    if (typeof d === 'object') return d;
    return null;
}

function applyAfiliacion(aseg, row) {
    if (!row) return;
    aseg.id_afiliacion = row.id_afiliacion ?? row.idAfiliacion ?? row.id;
    aseg.id_vehiculo = row.id_vehiculo ?? row.idVehiculo ?? null;
}

function territorioList(res) {
    const raw = res?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.subdivisiones)) return raw.subdivisiones;
    if (raw && Array.isArray(raw.items)) return raw.items;
    return [];
}

function menuFromTerritorio(list, prefix, nextNode, metaKey) {
    return list.slice(0, 12).map((row, i) => {
        const id = row.id ?? row.id_estado_provincia_depto ?? row.id_condado_canton_ciudad;
        const label = row.nombre ?? row.descripcion ?? row.name ?? `Opción ${i + 1}`;
        return {
            id: `${prefix}_${i}`,
            label: String(label),
            next: nextNode,
            meta: { aseg: { [metaKey]: id } },
        };
    });
}

export async function runAsegEnter(task, state) {
    const ctx = state.context;
    const aseg = ensureAseg(ctx);
    const cedula = ctx.cedula;
    const nombre = ctx.nombre;
    const telefono = requireLucyTelefono(ctx);

    clearAsegMenu(ctx);

    switch (task) {
        case 'cabina_aseguradora': {
            const gate = await runCabinaGateOrBlock(ctx, 'VIAL', 'menu_aseguradora', 'ASEGURADORA');
            if (gate.blocked) {
                const blocked = buildCabinaBlockedTransition(gate, 'menu_aseguradora');
                return {
                    ...blocked,
                    patchContext: { aseg, ...blocked.patchContext },
                };
            }
            return {
                messages: [],
                nextNodeId: aseg.afterCabinaNext,
                patchContext: { aseg },
            };
        }

        case 'consulta_placa_vial': {
            const placa = ctx.plate;
            if (!placa) throw new Error('Ingresa la placa del vehículo.');
            const res = await consultaPlacaVial(placa);
            const row = pickAfiliacion(res);
            if (!row) {
                return {
                    messages: [bot(res?.noticias?.mensaje || 'No encontramos afiliación para esa placa.')],
                    nextNodeId: 'menu_aseguradora',
                    patchContext: { aseg },
                };
            }
            applyAfiliacion(aseg, row);
            return {
                messages: [botFromOmniaxResponse(res, ['Placa validada. Continuemos con tu solicitud.'])],
                nextNodeId: aseg.afterOkNext,
                patchContext: { aseg },
            };
        }

        case 'consulta_placa_siniestro': {
            const placa = ctx.plate || aseg.placa;
            if (!placa) throw new Error('Ingresa la placa.');
            const res = await consultaPlacaSiniestro(placa);
            const row = pickAfiliacion(res);
            if (!row) {
                return {
                    messages: [bot(res?.noticias?.mensaje || 'No encontramos afiliación para esa placa.')],
                    nextNodeId: aseg.sinReturnNode || 'menu_siniestro',
                    patchContext: { aseg },
                };
            }
            applyAfiliacion(aseg, row);
            aseg.placa = placa;
            return {
                messages: [botFromOmniaxResponse(res, ['Afiliación encontrada.'])],
                nextNodeId: aseg.afterOkNext,
                patchContext: { aseg },
            };
        }

        case 'provincias_menu': {
            const res = await fetchProvincias('EC');
            const list = territorioList(res);
            const actions = menuFromTerritorio(list, 'prov', aseg.afterProvinciaNext || 'sin_datos', 'id_provincia');
            actions.push(...standardExitActions(aseg.sinReturnNode || 'menu_siniestro'));
            setMenu(ctx, 'Provincia del siniestro', 'Selecciona una opción.', actions);
            return {
                messages: [bot('Selecciona la provincia donde ocurrió el siniestro:')],
                stayOnNode: true,
                patchContext: { aseg },
            };
        }

        case 'ciudades_menu': {
            const idProv = aseg.id_provincia;
            if (!idProv) throw new Error('Selecciona primero la provincia.');
            const res = await fetchCiudades(idProv);
            const list = territorioList(res);
            const actions = menuFromTerritorio(list, 'ciu', aseg.afterCiudadNext || 'sin_datos', 'id_ciudad');
            actions.push(...standardExitActions(aseg.sinReturnNode || 'menu_siniestro'));
            setMenu(ctx, 'Ciudad del siniestro', '', actions);
            return {
                messages: [bot('Selecciona la ciudad:')],
                stayOnNode: true,
                patchContext: { aseg },
            };
        }

        case 'reporte_colision': {
            if (!cedula || !nombre) throw new Error('Completa cédula y nombre al inicio.');
            const res = await reporteColision({
                telefono_remitente: telefono,
                id_afiliacion: aseg.id_afiliacion,
                id_vehiculo: aseg.id_vehiculo,
                id_estado_provincia_depto: aseg.id_provincia,
                id_condado_canton_ciudad: aseg.id_ciudad,
                direccion_siniestro: aseg.direccion || 'Sin referencia',
                fecha_siniestro: aseg.fecha_siniestro,
                hora_siniestro: aseg.hora_siniestro,
                asegurado_nombre: nombre,
                asegurado_cedula: cedula,
                asegurado_telefono: telefono,
                asegurado_correo: aseg.correo || '',
                tipo_colision: aseg.tipo_colision || 'otro',
            });
            return {
                messages: [botFromOmniaxResponse(res, ['Reporte de colisión registrado.'])],
                nextNodeId: 'sin_done',
                patchContext: { aseg },
            };
        }

        case 'reporte_robo_total':
        case 'reporte_robo_parcial': {
            if (!cedula || !nombre) throw new Error('Completa cédula y nombre al inicio.');
            const fn = task === 'reporte_robo_total' ? reporteRoboTotal : reporteRoboParcial;
            const res = await fn({
                telefono_remitente: telefono,
                id_afiliacion: aseg.id_afiliacion,
                id_vehiculo: aseg.id_vehiculo,
                id_estado_provincia_depto: aseg.id_provincia,
                id_condado_canton_ciudad: aseg.id_ciudad,
                direccion_siniestro: aseg.direccion || 'Sin referencia',
                fecha_siniestro: aseg.fecha_siniestro,
                hora_siniestro: aseg.hora_siniestro,
                asegurado_nombre: nombre,
                asegurado_cedula: cedula,
                asegurado_telefono: telefono,
                asegurado_correo: aseg.correo || '',
            });
            return {
                messages: [botFromOmniaxResponse(res, ['Reporte de siniestro registrado.'])],
                nextNodeId: 'sin_done',
                patchContext: { aseg },
            };
        }

        case 'inspeccion_buscar': {
            const codigo = aseg.codigo_riesgo || ctx.plate;
            if (!codigo) throw new Error('Ingresa el código de riesgo o placa.');
            const res = await inspeccionBuscarAseguradora(String(codigo).trim());
            return {
                messages: [botFromOmniaxResponse(res, ['Consulta de inspección procesada.'])],
                nextNodeId: 'menu_aseguradora',
                patchContext: { aseg },
            };
        }

        default:
            throw new Error(`Tarea aseguradora desconocida: ${task}`);
    }
}
