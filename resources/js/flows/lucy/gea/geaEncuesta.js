/** Estado y UI de cuestionario Omniax (PDF encuesta / skill 5676). */

export function normalizePreguntas(payload) {
    const data = payload?.data ?? payload;
    const raw = data?.preguntas ?? data?.Preguntas ?? [];
    return Array.isArray(raw) ? raw : [];
}

export function cuestionarioId(payload) {
    const data = payload?.data ?? payload;
    return data?.id ?? data?.id_cuestionario ?? null;
}

export function opcionesDePregunta(pregunta) {
    const raw =
        pregunta?.opciones ??
        pregunta?.respuestas ??
        pregunta?.Opciones ??
        pregunta?.Respuestas ??
        [];
    return Array.isArray(raw) ? raw : [];
}

export function needsMotivo(opcion) {
    const flag = opcion?.aplica_motivo ?? opcion?.aplicaMotivo;
    if (flag === 0 || flag === '0' || flag === false || flag === 'false') return false;
    if (flag === 1 || flag === '1' || flag === true || flag === 'true') return true;
    return Boolean(flag);
}

export function motivoLabel(opcion) {
    return (
        opcion?.label_aplica_motivo ??
        opcion?.labelAplicaMotivo ??
        'Cuéntanos un poco más (motivo):'
    );
}

export function buildEncuestaMenuActions(pregunta, questionIndex, total) {
    const opciones = opcionesDePregunta(pregunta);
    const idPregunta = pregunta?.id ?? pregunta?.id_pregunta;
    const actions = opciones.slice(0, 10).map((op, i) => {
        const idRespuesta = op?.id ?? op?.id_respuesta;
        const label = String(op?.descripcion ?? op?.texto ?? op?.nombre ?? `Opción ${i + 1}`).slice(
            0,
            80,
        );
        return {
            id: `gea_enc_${questionIndex}_${i}`,
            label,
            next: 'gea_encuesta_active',
            meta: {
                gea: {
                    encuestaAnswer: {
                        id_pregunta: idPregunta,
                        id_respuesta: idRespuesta,
                        aplica_motivo: needsMotivo(op),
                        motivo_label: motivoLabel(op),
                        opcion,
                    },
                },
            },
        };
    });
    return actions;
}

export function pushEncuestaRespuesta(gea, entry) {
    if (!gea.encuestaRespuestas) gea.encuestaRespuestas = [];
    gea.encuestaRespuestas.push(entry);
}
