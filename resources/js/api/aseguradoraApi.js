import axios from 'axios';
import { attachOmniaxError } from './omniaxMedicoErrors.js';

const http = axios.create({
    baseURL: '/api/v1/aseguradora',
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

export function consultaPlacaVial(placa) {
    return http.post('/consulta-placa-vial', { placa }).then(unwrap);
}

export function consultaPlacaSiniestro(placa) {
    return http.post('/consulta-placa-siniestro', { placa }).then(unwrap);
}

export function fetchProvincias(iso = 'EC') {
    return http.get('/provincias', { params: { iso } }).then(unwrap);
}

export function fetchCiudades(idProvincia) {
    return http.get(`/provincias/${idProvincia}/ciudades`).then(unwrap);
}

export function inspeccionBuscarAseguradora(codigoRiesgo) {
    return http.post('/inspeccion/buscar-aseguradora', { codigo_riesgo: codigoRiesgo }).then(unwrap);
}

export function reporteColision(payload) {
    return http.post('/siniestro/colision', payload).then(unwrap);
}

export function reporteRoboTotal(payload) {
    return http.post('/siniestro/robo-total', payload).then(unwrap);
}

export function reporteRoboParcial(payload) {
    return http.post('/siniestro/robo-parcial', payload).then(unwrap);
}
