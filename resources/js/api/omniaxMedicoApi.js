import axios from 'axios';
import { attachOmniaxError } from './omniaxMedicoErrors.js';

const http = axios.create({
    baseURL: '/api/v1/omniax/medico',
    headers: { Accept: 'application/json' },
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        const data = error.response?.data;
        if (data && (data.noticias || data.errors || data.estado != null)) {
            throw attachOmniaxError(error, data, error.response?.status);
        }
        throw error;
    },
);

function unwrap(response) {
    const body = response.data;
    const estado = Number(body?.estado);
    if (estado >= 400) {
        throw attachOmniaxError(new Error('Error Omniax'), body, estado);
    }
    return body;
}

export function idServicioMedico() {
    const raw = import.meta.env.VITE_OMNIAX_ID_SERVICIO_MEDICO;
    return Number.parseInt(raw || '297', 10);
}

export async function fetchAsistenciasEnProceso(identificacionTitular, paraReagendar = false) {
    const { data } = await http.post('/asistencias/en-proceso', {
        identificacion_titular: identificacionTitular,
        id_servicio: idServicioMedico(),
        para_reagendar: paraReagendar,
    });
    return unwrap({ data });
}

export async function fetchEspecialidades() {
    const { data } = await http.get('/especialidades');
    return unwrap({ data });
}

export async function fetchAplicaAsignacion(
    identificacionTitular,
    idEspecialidad,
    identificacionBeneficiario = null,
) {
    const body = {
        identificacion_titular: identificacionTitular,
        id_especialidad: Number(idEspecialidad),
    };
    if (identificacionBeneficiario) {
        body.identificacion_beneficiario = String(identificacionBeneficiario);
    }
    const { data } = await http.post('/aplica-asignacion', body);
    return unwrap({ data });
}

export async function reagendarAsistencia(payload) {
    const body = {
        telefono: String(payload.telefono),
        id_asistencia: Number(payload.id_asistencia),
        fecha: String(payload.fecha),
        hora: String(payload.hora),
    };

    const optional = [
        'identificacion_beneficiario',
        'nombre_beneficiario',
        'edad_beneficiario',
        'sexo_beneficiario',
        'parentesco_beneficiario',
    ];
    for (const key of optional) {
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
            body[key] = payload[key];
        }
    }

    const { data } = await http.post('/asistencias/reagendar', body);
    return unwrap({ data });
}

/** GPS: latitud + longitud (sin id_zona). Médico: incluye id_especialidad. */
export async function fetchEstablecimientosPorGps({ idEspecialidad, latitud, longitud }) {
    const body = {
        id_servicio: idServicioMedico(),
        latitud: String(latitud),
        longitud: String(longitud),
    };
    if (idEspecialidad != null) {
        body.id_especialidad = Number(idEspecialidad);
    }
    const { data } = await http.post('/establecimientos', body);
    return unwrap({ data });
}

/** Zona: id_zona (sin latitud/longitud). */
export async function fetchEstablecimientosPorZona({ idEspecialidad, idZona }) {
    const body = {
        id_servicio: idServicioMedico(),
        id_zona: Number(idZona),
    };
    if (idEspecialidad != null) {
        body.id_especialidad = Number(idEspecialidad);
    }
    const { data } = await http.post('/establecimientos', body);
    return unwrap({ data });
}

export async function fetchZonasPorCiudad() {
    const { data } = await http.get('/zonas-por-ciudad', {
        params: { id_servicio: idServicioMedico() },
    });
    return unwrap({ data });
}

export async function fetchDisponibilidadDias(idEspecialidad, idEstablecimiento, idAsistencia = null) {
    const body = {
        id_especialidad: Number(idEspecialidad),
        id_establecimiento: Number(idEstablecimiento),
    };
    if (idAsistencia != null) body.id_asistencia = Number(idAsistencia);
    const { data } = await http.post('/disponibilidad-dias', body);
    return unwrap({ data });
}

export async function fetchDisponibilidadHoras({
    idEspecialidad,
    idEstablecimiento,
    fecha,
    idAsistencia = null,
}) {
    const body = {
        id_especialidad: Number(idEspecialidad),
        id_establecimiento: Number(idEstablecimiento),
        fecha: String(fecha),
    };
    if (idAsistencia != null) body.id_asistencia = Number(idAsistencia);
    const { data } = await http.post('/disponibilidad-horas', body);
    return unwrap({ data });
}

export async function crearAsistenciaMedica(payload) {
    const body = {
        telefono: String(payload.telefono),
        id_servicio: idServicioMedico(),
        identificacion_titular: String(payload.identificacion_titular),
        nombre_titular: String(payload.nombre_titular),
        latitud: String(payload.latitud),
        longitud: String(payload.longitud),
        aplica_seguimiento_dental: Boolean(payload.aplica_seguimiento_dental),
    };

    const optional = [
        'identificacion_beneficiario',
        'nombre_beneficiario',
        'edad_beneficiario',
        'sexo_beneficiario',
        'parentesco_beneficiario',
        'id_especialidad',
        'id_establecimiento',
        'id_zona',
        'fecha',
        'hora',
    ];
    for (const key of optional) {
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
            body[key] = payload[key];
        }
    }

    const { data } = await http.post('/asistencias', body);
    return unwrap({ data });
}
