# Prueba — agendar cita médica (Omniax test-ec)

## Configuración

Variables en `.env` (`GEA_OMNIAX_*`). Tras cambiar `.env`, reinicia `php artisan serve` y `npm run dev`.

## Recorrido en la webview

1. Cédula de prueba: `0979461382` (o la que indique GEA).
2. Nombre cualquiera.
3. Menú → Solución 24/7 → Médico → **Agendar cita médica**.
4. **Elegibilidad (automática):** `en-proceso` + catálogo de especialidades. Si no hay especialidades o falla Omniax → pantalla “sin cobertura” + asesor (no entras al flujo).
5. Prefacio cabina → notificar cabina → **Para mí** / beneficiario → especialidad **MEDICINA GENERAL** (recomendado en QA).
6. Tras especialidad, `aplica-asignacion` se consulta, pero la cita **siempre** sigue por ubicación: cerca (listado de establecimientos) u otra ubicación (ciudad y zona, luego establecimientos). Después, días y horas con cupo.
7. Ubicación de prueba: `-2.164525162397198`, `-79.89574580754577` (o GPS real).
8. Establecimiento, fecha y hora de las listas de Omniax. Confirmación final.
9. Confirmación final.

Query opcional: `?telefono=0993333333` (sin prefijo país).

## API local (proxy Laravel)

Prefijo: `/api/v1/omniax/medico/*` — el frontend solo llama a estos endpoints.

## Flujos Omniax activos en webview

| Flujo | Entrada en menú |
|--------|------------------|
| Agendar médico (titular / beneficiario) | Médico → Agendar cita médica |
| Reagendar médico | Médico → Reagendar → Para mí / Beneficiario → listado → fecha/hora |
| Agendar dental | Dental → Agendar cita |
| Reagendar dental | Dental → Reagendar cita |

API dental: `/api/v1/omniax/dental/*`. Reagendar (serv. 12): mismo contexto que crear — `telefono`, `nombre_titular`, `aplica_seguimiento_dental`, `latitud`, `longitud`, `id_asistencia`, `fecha`, `hora`, más ids de cita.

**Ubicación (serv. 6–7 PDF):** `GET zonas-por-ciudad` lleva `id_servicio` en la **query** (no hay cuerpo JSON; en DevTools “Solicitud” vacío es normal). En **test-ec**, el catálogo de ciudades/centros dental puede usar otro `id_servicio` que en-proceso/crear (`298` vs `300`): configura `GEA_OMNIAX_ID_SERVICIO_DENTAL_UBICACION` y `VITE_OMNIAX_ID_SERVICIO_DENTAL_UBICACION`, luego `npm run build`.

Beneficiario: cédula, nombre, edad, sexo (`MASCULINO`/`FEMENINO`), parentesco (`CONYUGE`, `HIJO`, `OTROS`, etc.) en crear y en aplica-asignación médica/dental.

Los mensajes de éxito y error muestran `noticias` y `errors` de Omniax.

## Disponibilidad

Tras elegir especialidad, Omniax responde `aplica_asignacion_establecimiento`. Esa bandera ya no cambia la pantalla: médico y dental siempre piden ubicación (cerca u otra), luego establecimiento, **disponibilidad-dias** y **disponibilidad-horas**, y al final **asistencias**.

Para el flujo completo en test: cédula **0979461382**, **MEDICINA GENERAL**, coordenadas del PDF.

## ¿Son solicitudes reales?

Sí: el entorno **test-ec** (`api.geainternacional.com/test-ec`) crea asistencias reales en el ambiente de pruebas de GEA (afiliado y proveedor JELOU del manual). No es mock local; evita datos sensibles en notas y no uses producción sin autorización.
