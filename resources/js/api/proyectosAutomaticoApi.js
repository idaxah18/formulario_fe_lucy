import axios from 'axios';
import { attachOmniaxError } from './omniaxMedicoErrors.js';

const http = axios.create({
    baseURL: '/api/v1/gea/proyectos-automatico',
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
        throw attachOmniaxError(new Error('Error SIGA Proyectos'), body, estado);
    }
    return body;
}

export async function postAfiliacionAutomatico(payload) {
    const { data } = await http.post('/afiliacion', payload);
    return unwrap({ data });
}

export async function postVehiculoAfiliacionAutomatico(payload) {
    const { data } = await http.post('/vehiculo-afiliacion', payload);
    return unwrap({ data });
}

export async function postCoberturaAutomatico(payload) {
    const { data } = await http.post('/cobertura', payload);
    return unwrap({ data });
}

export async function postValidacionCombustibleAutomatico(payload) {
    const { data } = await http.post('/validacion-combustible', payload);
    return unwrap({ data });
}

export async function postValidacionCoordenadasAutomatico(payload) {
    const { data } = await http.post('/validacion-coordenadas', payload);
    return unwrap({ data });
}

export async function postUbicacionAutomatico(payload) {
    const { data } = await http.post('/ubicacion', payload);
    return unwrap({ data });
}

export async function postAsistenciaAutomatico(payload) {
    const { data } = await http.post('/asistencia', payload);
    return unwrap({ data });
}
