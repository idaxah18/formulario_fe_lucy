import { bot } from '../flowHelpers.js';
import { notificarCabinaAsistencia } from '@/api/geaToolsApi.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';

/**
 * Tool Notificar Cabina — bloquea creación si hay asistencia vigente (Jelou).
 * @returns {{ blocked: boolean, messages?: object[], nextNodeId?: string }}
 */
/**
 * @param {object} [options]
 * @param {boolean} [options.allowVigenteForAppointments] Citas Omniax (médico/dental): no cortar el flujo en asistencia_vigente; en_proceso valida citas.
 */
export async function runCabinaGateOrBlock(
    ctx,
    tipoServicio,
    returnNode = 'menu_solucion_24_7',
    planAsistencia = 'ASISTENCIAS',
    options = {},
) {
    const cedula = ctx.cedula;
    if (!cedula) {
        throw new Error('Completa cédula y nombre antes de continuar.');
    }
    const tipo = String(tipoServicio || 'HOGAR').toUpperCase();
    const cabina = await notificarCabinaAsistencia({
        cveafiliado: cedula,
        tipo_servicio: tipo,
        plan_asistencia: planAsistencia,
        placa: ctx.plate || ctx.gea?.placa || '',
        telefono: requireLucyTelefono(ctx),
    });

    if (cabina.branch === 'asistencia_vigente') {
        if (options.allowVigenteForAppointments) {
            return { blocked: false };
        }
        const fromApi =
            cabina.raw?.noticias?.mensaje ||
            cabina.raw?.data?.noticias?.mensaje ||
            cabina.raw?.message;
        const vigenteText =
            (typeof fromApi === 'string' && fromApi.trim()) ||
            'Veo que ya tienes una asistencia en curso y estamos trabajando en ella. Para continuar de la mejor manera, un especialista se pondrá en contacto contigo pronto.';
        return {
            blocked: true,
            messages: [bot(vigenteText)],
            nextNodeId: returnNode,
        };
    }
    if (cabina.branch !== 'success') {
        return {
            blocked: true,
            messages: [bot('Ups! No se logró iniciar la asistencia, intenta más tarde.')],
            nextNodeId: returnNode,
        };
    }
    return { blocked: false };
}
