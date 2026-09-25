import axios from 'axios';
import { attachOmniaxError } from './omniaxMedicoErrors.js';

const http = axios.create({
    baseURL: '/api/v1/omniax/gea',
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

export async function crearAsistenciaGea(payload) {
    const { data } = await http.post('/asistencias/gea', payload);
    return unwrap({ data });
}

export async function fetchAsistenciasEnProcesoRemitente(telefonoRemitente) {
    const { data } = await http.post('/asistencias/en-proceso-remitente', {
        telefono_remitente: String(telefonoRemitente),
    });
    return unwrap({ data });
}

export async function fetchListadoChatbotTelefono(cveafiliado, telefono) {
    const { data } = await http.post('/asistencias/listado', {
        cveafiliado: String(cveafiliado),
        telefono: String(telefono),
    });
    return unwrap({ data });
}

export async function cancelarAsistencia(idAsistencia) {
    const { data } = await http.put(`/asistencias/${idAsistencia}/cancelar`);
    return unwrap({ data });
}

export async function actualizarUbicacionAsistencia(idAsistencia, latitud, longitud) {
    const { data } = await http.put(`/asistencias/${idAsistencia}/ubicacion`, {
        latitud: String(latitud),
        longitud: String(longitud),
    });
    return unwrap({ data });
}

export async function fetchCuestionario(idAsistencia) {
    const { data } = await http.get(`/cuestionarios/asistencias/${idAsistencia}`);
    return unwrap({ data });
}

export async function calificarCuestionario(body) {
    const { data } = await http.post('/cuestionarios/calificar', body);
    return unwrap({ data });
}

export async function respuestaTermino(idAsistencia, respuestaUsuario) {
    const { data } = await http.post(`/asistencias/${idAsistencia}/termino`, {
        respuesta_usuario: String(respuestaUsuario),
    });
    return unwrap({ data });
}

export async function respuestaContacto(idAsistencia, respuestaUsuario) {
    const { data } = await http.post(`/asistencias/${idAsistencia}/contacto`, {
        respuesta_usuario: String(respuestaUsuario),
    });
    return unwrap({ data });
}

export async function reenviarEvaluacion(idAsistencia) {
    const { data } = await http.post(`/asistencias/${idAsistencia}/reenviar-evaluacion`);
    return unwrap({ data });
}

export async function evaluacionConfirmada(idAsistencia) {
    const { data } = await http.post(`/asistencias/${idAsistencia}/evaluacion-confirmada`);
    return unwrap({ data });
}
