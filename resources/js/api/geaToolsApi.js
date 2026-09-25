import axios from 'axios';
import { requireLucyTelefono } from '@/lib/lucyTelefono.js';

const http = axios.create({
    baseURL: '/api/v1/gea/tools',
    headers: { Accept: 'application/json' },
});

function telefonoOrThrow(telefono) {
    if (telefono != null && String(telefono).trim() !== '') {
        return requireLucyTelefono({ telefono });
    }
    return requireLucyTelefono();
}

/** Tool Asistencia en Curso */
export async function fetchAsistenciaEnCurso(telefono) {
    const tel = telefonoOrThrow(telefono);
    const { data } = await http.post('/asistencia-en-curso', { telefono: tel });
    return data;
}

/** Tool Notificar Cabina Asistencia en Proceso */
export async function notificarCabinaAsistencia(payload) {
    const { data } = await http.post('/notificar-cabina', {
        telefono: telefonoOrThrow(payload.telefono),
        cveafiliado: payload.cveafiliado,
        tipo_servicio: payload.tipo_servicio,
        plan_asistencia: payload.plan_asistencia ?? 'ASISTENCIAS',
        placa: payload.placa ?? '',
        chasis: payload.chasis ?? '',
        id_asistencia: payload.id_asistencia ?? '',
    });
    return data;
}

/** Tool Validacion cedula */
export async function validarCedulaTool(identificacion) {
    const { data } = await http.post('/validacion-cedula', { identificacion });
    return data;
}

/** Tool Aceptacion LOPDP */
export async function aceptarLopdp(identificacion, codigoIsoPais = 'ec') {
    const { data } = await http.post('/aceptacion-lopdp', {
        identificacion,
        codigo_iso_pais: codigoIsoPais,
    });
    return data;
}

/** Tool Menu Oculto Asistencia Valida */
export async function fetchMenuProveedorValida(idAsistencia, opcion = 'contacto') {
    try {
        const { data } = await http.get(`/menu-proveedor/asistencias/${idAsistencia}`, {
            params: { opcion },
        });
        return data;
    } catch (error) {
        if (error.response?.data) {
            return error.response.data;
        }
        throw error;
    }
}

/** Tool Asistencia Reagendar (servicios GEA por id_servicio) */
export async function reagendarAsistenciaTool({ id_servicio, identificacion, telefono }) {
    const { data } = await http.post('/asistencia-reagendar', {
        id_servicio,
        identificacion,
        telefono: telefonoOrThrow(telefono),
    });
    return data;
}
