import { notificarCabinaAsistencia } from '@/api/geaToolsApi.js';
import { bot } from '../flowHelpers.js';

function familyMenu(kind) {
    return kind === 'dental' ? 'menu_dental' : 'menu_medico';
}

function sinAfiliacionNodeId(kind) {
    return kind === 'dental' ? 'omx_den_sin_afiliacion' : 'omx_med_sin_afiliacion';
}

/**
 * ¿Esta cédula tiene plan de asistencias para cita médica o dental?
 * Proceso automático solo acepta HOGAR/VIAL. Cabina con tipo MEDICO distingue
 * afiliado (puede crear) de cédula sin plan (sin asistencias y sin flujo de creación).
 * Dental usa la misma señal: cabina DENTAL no marca el flujo aunque ya existan citas.
 * @returns {Promise<object|null>} transición si hay que detener; null si puede seguir.
 */
export async function resolveCitaPlanGate(ctx, kind) {
    const cedula = String(ctx?.cedula || '').trim();
    const menu = familyMenu(kind);
    if (!/^\d{10}$/.test(cedula)) {
        return { messages: [], nextNodeId: sinAfiliacionNodeId(kind) };
    }
    try {
        const cabina = await notificarCabinaAsistencia({
            cveafiliado: cedula,
            tipo_servicio: 'MEDICO',
            plan_asistencia: 'ASISTENCIAS',
            telefono: ctx.telefono,
            placa: '',
        });
        const list = Array.isArray(cabina?.asistencias) ? cabina.asistencias : [];
        const aplica =
            cabina?.branch === 'success' || cabina?.aplica_flujo_creacion_asistencia === true;
        if (aplica || list.length > 0) return null;
        if (cabina?.branch === 'asistencia_vigente') {
            return { messages: [], nextNodeId: sinAfiliacionNodeId(kind) };
        }
        return {
            messages: [bot('No pudimos validar tu plan en este momento. Intenta de nuevo en unos minutos.')],
            nextNodeId: menu,
        };
    } catch {
        return {
            messages: [bot('No pudimos validar tu plan en este momento. Intenta de nuevo en unos minutos.')],
            nextNodeId: menu,
        };
    }
}
