/**
 * Acumula preguntas/respuestas para `preguntas_respuestas` y `aplica_servicio_automatico`.
 */

export function ensurePreguntasState(gea) {
    if (!gea.preguntasRespuestasList) gea.preguntasRespuestasList = [];
    if (gea.aplicaServicioAutomatico == null) gea.aplicaServicioAutomatico = true;
}

export function recordAutomaticoAnswer(gea, { pregunta, respuesta, aplicaAutomatico }) {
    ensurePreguntasState(gea);
    gea.preguntasRespuestasList.push({
        pregunta: String(pregunta).trim(),
        respuesta: String(respuesta).trim(),
    });
    if (aplicaAutomatico === false) {
        gea.aplicaServicioAutomatico = false;
    }
}

export function buildPreguntasRespuestasJson(gea) {
    const list = gea.preguntasRespuestasList || [];
    if (!list.length) return '';
    return JSON.stringify(list);
}

export function aplicaAutomaticoFlag(gea) {
    return gea.aplicaServicioAutomatico === false ? 0 : 1;
}
