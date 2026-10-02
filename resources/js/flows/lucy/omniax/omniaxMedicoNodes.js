/**
 * Subgrafo Omniax — agendar / reagendar cita médica.
 */

import { advisorHandoffSay } from '../advisorHandoffCopy.js';
import { buildCabinaPrefaceNode } from '../flowHelpers.js';
import { citaPlanNodes } from './omniaxEligibility.js';

export const OMX_MED_FECHA_HORA_NODE = 'omx_med_fecha_hora';
export const OMX_MED_BENEF_FORM_NODE = 'omx_med_benef_form';

export function buildOmniaxMedicoNodes() {
    return {
        ...citaPlanNodes('medico'),
        omx_med_elegibilidad_load: {
            jelou: '2.2 Agendar cita médica - elegibilidad',
            skipSay: true,
            omniax: {
                enter: 'elegibilidad_agendar',
                kind: 'medico',
                tipoServicio: 'MEDICO',
            },
        },
        omx_med_sin_cobertura: {
            jelou: '2.2 Agendar cita médica - sin cobertura',
            skipSay: true,
            useOmniaxMenu: true,
        },
        omx_med_cabina_preface: buildCabinaPrefaceNode(
            'omx_med_cabina_preface',
            'omx_med_cabina',
            'cita_medica',
        ),
        omx_med_reag_cabina_preface: buildCabinaPrefaceNode(
            'omx_med_reag_cabina_preface',
            'omx_med_reag_cabina',
            'cita_reagendar',
        ),
        omx_med_cabina: {
            jelou: 'Notificar Cabina Asistencia en Proceso',
            say: ['Validando asistencias en curso…'],
            skipSay: true,
            omniax: {
                enter: 'cabina_gate',
                kind: 'medico',
                tipoServicio: 'MEDICO',
                afterCabinaNext: 'omx_med_who',
            },
        },
        omx_med_reag_cabina: {
            jelou: 'Notificar Cabina Asistencia en Proceso',
            skipSay: true,
            omniax: {
                enter: 'cabina_gate',
                kind: 'medico',
                tipoServicio: 'MEDICO',
                afterCabinaNext: 'omx_med_reag_list_load',
            },
        },
        omx_med_en_proceso_load: {
            jelou: '2.2 Agendar cita médica - en proceso',
            skipSay: true,
            omniax: { enter: 'en_proceso_agendar', kind: 'medico', reagendar: false },
        },
        omx_med_en_proceso_hub: {
            jelou: 'Asistencias médicas en proceso',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { refreshMenuEnter: 'en_proceso_hub', kind: 'medico', reagendar: false },
        },
        omx_med_en_proceso_pick_load: {
            jelou: 'Detalle asistencia médica',
            skipSay: true,
            omniax: { enter: 'en_proceso_pick', kind: 'medico', reagendar: false },
        },
        omx_med_start: {
            jelou: '2.2 Agendar cita médica - Omniax',
            skipSay: true,
            omniax: { enter: 'long_flow_medico', kind: 'medico', reagendar: false },
        },
        omx_med_reag_list_load: {
            jelou: 'Listado reagendar',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'en_proceso_reagendar', kind: 'medico', reagendar: true },
        },
        omx_med_reag_pick: {
            jelou: 'Reagendar - elegir cita',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { kind: 'medico', reagendar: true, refreshMenuEnter: 'en_proceso_reagendar' },
        },
        omx_med_reagendar_load: {
            jelou: 'Reagendar cita',
            skipSay: true,
            omniax: { enter: 'reagendar' },
        },
        omx_med_who: {
            jelou: 'Agendar - titular',
            say: ['Genial, ¿para quién es la cita?'],
            actions: [
                {
                    id: 'para_mi',
                    label: 'Para mí',
                    next: 'omx_med_start',
                    meta: { omx: true, para_beneficiario: false },
                },
                {
                    id: 'benef',
                    label: 'Beneficiario',
                    next: 'omx_med_benef_form',
                },
            ],
        },
        omx_med_benef_form: {
            jelou: 'Beneficiario',
            say: ['Completa los datos del beneficiario en el formulario.'],
        },
        omx_med_especialidades_load: {
            jelou: 'Especialidades',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'especialidades' },
        },
        omx_med_aplica_load: {
            jelou: 'Aplica asignación',
            skipSay: true,
            omniax: { enter: 'aplica_asignacion' },
        },
        omx_med_donde: {
            jelou: 'Ubicación cita',
            say: ['¿Dónde te gustaría agendar tu cita?'],
            actions: [
                { id: 'cerca', label: 'Cerca de tu ubicación actual', next: 'omx_med_share_location' },
                { id: 'otra', label: 'Otra ubicación', next: 'omx_med_ciudades_load' },
            ],
        },
        omx_med_share_location: {
            jelou: 'Ubicación',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_med_est_gps_load',
                },
            ],
        },
        omx_med_ciudades_load: {
            jelou: 'Ciudades',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_ciudades', kind: 'medico', refreshMenuEnter: 'zonas_ciudades' },
        },
        omx_med_zonas_load: {
            jelou: 'Zonas',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'zonas_lista', kind: 'medico', refreshMenuEnter: 'zonas_lista' },
        },
        omx_med_est_gps_load: {
            jelou: 'Establecimientos',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_gps' },
        },
        omx_med_est_zona_load: {
            jelou: 'Establecimientos zona',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'establecimientos_zona' },
        },
        omx_med_franja_load: {
            jelou: 'Franja horaria',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_franja' },
        },
        omx_med_dias_load: {
            jelou: 'Fechas disponibles',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_dias' },
        },
        omx_med_horas_load: {
            jelou: 'Horarios disponibles',
            skipSay: true,
            useOmniaxMenu: true,
            omniax: { enter: 'disponibilidad_horas' },
        },
        omx_med_fecha_hora: {
            jelou: 'Fecha y hora (reagendar)',
            say: ['Ingresa la nueva fecha y hora para reagendar la cita.'],
        },
        omx_med_sin_asignacion: {
            jelou: 'Sin asignación establecimiento',
            skipSay: true,
            useOmniaxMenu: true,
        },
        omx_med_asesor_load: {
            jelou: 'Derivación asesor — cita médica',
            skipSay: true,
            com: {
                enter: 'derivacion_asesor',
                producto: 'Agendar cita médica',
                notas: 'Omniax: no aplica asignación de establecimiento',
                afterDerivacion: 'omx_med_asesor_done',
            },
        },
        omx_med_asesor_done: {
            jelou: 'Derivación asesor — cita médica',
            say: advisorHandoffSay('cita_agenda'),
            actions: [
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
                { id: 'med', label: 'Menú médico', next: 'menu_medico' },
            ],
        },
        omx_med_verificar_disponibilidad_load: {
            jelou: 'Verificar disponibilidad',
            skipSay: true,
            omniax: { enter: 'verificar_disponibilidad' },
        },
        omx_med_crear_load: {
            jelou: 'Crear asistencia',
            skipSay: true,
            omniax: { enter: 'crear' },
        },
        omx_med_location_skip_load: {
            jelou: 'Ubicación mínima',
            say: ['Por favor compárteme tu ubicación actual 📍'],
            actions: [
                {
                    id: 'share_location',
                    label: '📍 Compartir ubicación',
                    type: 'location',
                    next: 'omx_med_donde',
                },
            ],
        },
        omx_med_done: {
            jelou: 'Cita confirmada',
            skipSay: true,
            actions: [],
        },
        omx_med_error: {
            jelou: 'Error Omniax',
            skipSay: true,
            actions: [
                { id: 'retry', label: 'Reintentar', next: 'omx_med_elegibilidad_load' },
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
            ],
        },
        omx_med_sin_fechas: {
            jelou: 'Sin fechas',
            say: ['Lo sentimos. No existen fechas disponibles. Por favor, escoge otro establecimiento.'],
            actions: [
                { id: 'volver', label: 'Elegir otro establecimiento', next: 'omx_med_donde' },
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
            ],
        },
        omx_med_reag_sin_fechas: {
            jelou: 'Sin fechas reagendar',
            say: ['Lo sentimos. No existen fechas disponibles.'],
            actions: [
                {
                    id: 'volver',
                    label: 'Volver al listado de citas',
                    next: 'omx_med_reag_list_load',
                },
                { id: 'menu', label: 'Menú principal', next: 'menu_solucion_24_7' },
            ],
        },
    };
}
