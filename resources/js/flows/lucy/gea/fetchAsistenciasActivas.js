import { fetchAsistenciaEnCurso } from '@/api/geaToolsApi.js';
import { fetchAsistenciasEnProceso as fetchDentalEnProceso } from '@/api/omniaxDentalApi.js';
import { fetchAsistenciasEnProceso as fetchMedicoEnProceso } from '@/api/omniaxMedicoApi.js';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';
import { enrichEnProcesoResponse } from '../omniax/omniaxAsistencias.js';
import {
    filterAsistenciasForPostAuth,
    mergeAsistenciasActivas,
    sortAsistenciasActivasDesc,
} from './asistenciasActivas.js';

/**
 * Carga asistencias en curso (GEA + Omniax médico/dental) sin navegar al hub del chat.
 * @param {object} context Estado Lucy (`state.context`)
 */
export async function fetchMergedAsistenciasActivas(context) {
    const cedula = context?.cedula;
    if (!cedula) return [];

    const telefono = requireLucyTelefono(context);

    const [geaToolRes, medicoRes, dentalRes] = await Promise.allSettled([
        fetchAsistenciaEnCurso(telefono),
        fetchMedicoEnProceso(cedula, false).then((res) => enrichEnProcesoResponse(res, cedula, telefono)),
        fetchDentalEnProceso(cedula, false).then((res) => enrichEnProcesoResponse(res, cedula, telefono)),
    ]);

    const merged = filterAsistenciasForPostAuth(
        mergeAsistenciasActivas({
            geaTool: geaToolRes.status === 'fulfilled' ? geaToolRes.value : null,
            medicoRes: medicoRes.status === 'fulfilled' ? medicoRes.value : null,
            dentalRes: dentalRes.status === 'fulfilled' ? dentalRes.value : null,
        }),
    );

    return sortAsistenciasActivasDesc(merged);
}
