/**
 * Subgrafo Omniax — agendar / reagendar cita dental.
 */

import { advisorHandoffSay } from '../advisorHandoffCopy.js';
import { buildCabinaPrefaceNode } from '../flowHelpers.js';
import { citaPlanNodes } from './omniaxEligibility.js';

export const OMX_DEN_FECHA_HORA_NODE = 'omx_den_fecha_hora';
export const OMX_DEN_BENEF_FORM_NODE = 'omx_den_benef_form';

export function buildOmniaxDentalNodes() {
    return {
        ...citaPlanNodes('dental'),
        omx_den_elegibilidad_load: {
            jelou: '2.1.1 Agendar cita dental - elegibilidad',
            skipSay: true,
            omniax: {
                enter: 'elegibilidad_agendar',
                kind: 'dental',
                tipoServicio: 'DENTAL',
            },
        },
        omx_den_sin_cobertura: {
            jelou: '2.1.1 Agendar cita dental - sin cobertura',
            skipSay: true,
            useOmniaxMenu: true,
        },
        omx_den_cabina_preface: buildCabinaPrefaceNode(
            'omx_den_cabina_preface',
            'omx_den_cabina',
            'cita_dental',
        ),
        omx_den_reag_cabina_preface: buildCabinaPrefaceNode(
            'omx_den_reag_cabina_preface',
            'omx_den_reag_cabina',
            'cita_reagendar',
        ),
        omx_den_cabina: {
            jelou: 'Notificar Cabina Asistencia en Proceso',
            say: ['Validando asistencias en curso…'],
            skipSay: true,
            omniax: {
                enter: 'cabina_gate',
                kind: 'dental',
                tipoServicio: 'DENTAL',
                afterCabinaNext: 'omx_den_who',
            },
        },
        omx_den_reag_cabina: {
            jelou: 'Notificar Cabina Asistencia en Proceso',
            skipSay: true,
            omniax: {
                enter: 'cabina_gate',
                kind: 'dental',
                tipoServicio: 'DENTAL',
                afterCabinaNext: 'omx_den_reag_list_load',
            },
        },
        omx_den_en_proceso_load: {
            jelou: '2.1.1 Agendar cita dental - en proceso',
            skipSay: true,
            omniax: { enter: 'en_proceso_agendar', kind: 'dental', reagendar: false },
        },
        omx_den_seguimiento_ask: {
            jelou: 'Seguimiento dental',
            say: ['¿Deseas continuar con el seguimiento dental desde tu ubicación?'],
            actions: [
                {
                    id: 'si',
                    label: 'Sí',
                    next: 'omx_den_seguimiento_share',
                    meta: { omx: true, usuario_acepta_seguimiento: true },
                },
                {
                    id: 'no',
                    label: 'No',
                    next: 'omx_den_en_proceso_hub_load',
                    meta: { omx: true, usuario_acepta_seguimiento: false },
                },
            ],
        },
        omx_den_en_proceso_hub_load: {
            jelou: 'Asistencias dentales en proceso',
            skipSay: true,
            omniax: { enter: 'en_proceso_hub_after_seguimiento', kind: 'dental', reagendar: false },
        },
        omx_den_en_proceso_hub: {
            jelou: 'Asistencias dentales en proceso',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { refreshMenuEnter: 'en_proceso_hub', kind: 'dental', reagendar: false },
        },
        omx_den_en_proceso_pick_load: {
            jelou: 'Detalle asistencia dental',
            skipSay: true,
            omniax: { enter: 'en_proceso_pick', kind: 'dental', reagendar: false },
        },
        omx_den_seguimiento_share: {
            jelou: 'Seguimiento dental — ubicación',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_den_seguimiento_crear_load',
                },
            ],
        },
        omx_den_seguimiento_crear_load: {
            jelou: 'Seguimiento dental — registro',
            skipSay: true,
            omniax: { enter: 'crear_seguimiento_dental', kind: 'dental', reagendar: false },
        },
        omx_den_start: {
            jelou: '2.1.1 Agendar cita dental - Omniax',
            skipSay: true,
            omniax: { enter: 'long_flow_dental', kind: 'dental', reagendar: false },
        },
        omx_den_reag_list_load: {
            jelou: 'Listado reagendar dental',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'en_proceso_reagendar', kind: 'dental', reagendar: true },
        },
        omx_den_reag_pick: {
            jelou: 'Reagendar dental',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { kind: 'dental', reagendar: true, refreshMenuEnter: 'en_proceso_reagendar' },
        },
        omx_den_reagendar_load: {
            jelou: 'Reagendar cita dental',
            skipSay: true,
            omniax: { enter: 'reagendar' },
        },
        omx_den_who: {
            jelou: 'Agendar dental',
            say: ['¿Para quién es la cita dental?'],
            actions: [
                {
                    id: 'para_mi',
                    label: 'Para mí',
                    next: 'omx_den_start',
                    meta: { omx: true, para_beneficiario: false },
                },
                {
                    id: 'benef',
                    label: 'Beneficiario',
                    next: 'omx_den_benef_form',
                },
            ],
        },
        omx_den_benef_form: {
            jelou: 'Beneficiario dental',
            say: ['Completa los datos del beneficiario en el formulario.'],
        },
        omx_den_aplica_load: {
            jelou: 'Aplica asignación dental',
            skipSay: true,
            omniax: { enter: 'aplica_asignacion' },
        },
        omx_den_donde: {
            jelou: 'Ubicación cita dental',
            say: ['¿Dónde te gustaría agendar tu cita?'],
            actions: [
                { id: 'cerca', label: 'Cerca de tu ubicación actual', next: 'omx_den_share_location' },
                { id: 'otra', label: 'Otra ubicación', next: 'omx_den_ciudades_load' },
            ],
        },
        omx_den_share_location: {
            jelou: 'Ubicación',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_den_est_gps_load',
                },
            ],
        },
        omx_den_ciudades_load: {
            jelou: 'Ciudades',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_ciudades', kind: 'dental', refreshMenuEnter: 'zonas_ciudades' },
        },
        omx_den_zonas_load: {
            jelou: 'Zonas',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_lista', kind: 'dental', refreshMenuEnter: 'zonas_lista' },
        },
        omx_den_est_gps_load: {
            jelou: 'Establecimientos',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_gps' },
        },
        omx_den_est_zona_load: {
            jelou: 'Establecimientos zona',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_zona' },
        },
        omx_den_franja_load: {
            jelou: 'Franja horaria dental',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_franja' },
        },
        omx_den_dias_load: {
            jelou: 'Fechas disponibles dental',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_dias' },
        },
        omx_den_horas_load: {
            jelou: 'Horarios disponibles dental',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_horas' },
        },
        omx_den_fecha_hora: {
            jelou: 'Fecha y hora (reagendar)',
            say: ['Ingresa la nueva fecha y hora para reagendar la cita dental.'],
        },
        omx_den_sin_asignacion: {
            jelou: 'Sin asignación dental',
            skipSay: true,
            useOmniaxMenu: true,
        },
        omx_den_asesor_load: {
            jelou: 'Derivación asesor — cita dental',
            skipSay: true,
            com: {
                enter: 'derivacion_asesor',
                producto: 'Agendar cita dental',
                notas: 'Omniax: no aplica asignación de establecimiento',
                afterDerivacion: 'omx_den_asesor_done',
            },
        },
        omx_den_asesor_done: {
            jelou: 'Derivación asesor — cita dental',
            say: advisorHandoffSay('cita_agenda'),
            actions: [
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
                { id: 'den', label: 'Menú dental', next: 'menu_dental' },
            ],
        },
        omx_den_sin_fechas: {
            jelou: 'Sin fechas dental',
            say: ['Lo sentimos. No existen fechas disponibles. Por favor, escoge otro establecimiento.'],
            actions: [
                { id: 'volver', label: 'Elegir otro establecimiento', next: 'omx_den_donde' },
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
            ],
        },
        omx_den_reag_sin_fechas: {
            jelou: 'Sin fechas reagendar',
            say: ['Lo sentimos. No existen fechas disponibles.'],
            actions: [
                {
                    id: 'volver',
                    label: 'Volver al listado de citas',
                    next: 'omx_den_reag_list_load',
                },
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
            ],
        },
        omx_den_verificar_disponibilidad_load: {
            jelou: 'Verificar disponibilidad',
            skipSay: true,
            omniax: { enter: 'verificar_disponibilidad' },
        },
        omx_den_crear_load: {
            jelou: 'Crear asistencia dental',
            skipSay: true,
            omniax: { enter: 'crear' },
        },
        omx_den_location_skip_load: {
            jelou: 'Ubicación mínima',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_den_donde',
                },
            ],
        },
        omx_den_done: {
            jelou: 'Cita dental confirmada',
            skipSay: true,
            actions: [],
        },
        omx_den_error: {
            jelou: 'Error Omniax dental',
            skipSay: true,
            actions: [
                { id: 'retry', label: 'Reintentar', next: 'omx_den_elegibilidad_load' },
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
            ],
        },
    };
}
