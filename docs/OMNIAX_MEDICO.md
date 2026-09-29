# Prueba — agendar cita médica (Omniax test-ec)

## Configuración

Variables en `.env` (`GEA_OMNIAX_*`). Tras cambiar `.env`, reinicia `php artisan serve` y `npm run dev`.

## Recorrido en la webview

1. Cédula de prueba: `0979461382` (o la que indique GEA).
2. Nombre cualquiera.
3. Menú → Solución 24/7 → Médico → **Agendar cita médica**.
4. **Elegibilidad (automática):** `en-proceso` + catálogo de especialidades. Si no hay especialidades o falla Omniax → pantalla “sin cobertura” + asesor (no entras al flujo).
5. Prefacio cabina → notificar cabina → **Para mí** / beneficiario → especialidad **MEDICINA GENERAL** (recomendado en QA).
6. Tras especialidad, `aplica-asignacion`: `false` **no** es bloqueo; es agenda simplificada (ubicación + crear). `true` = elegir centro, días y horas.
7. Ubicación de prueba: `-2.164525162397198`, `-79.89574580754577` (o GPS real).
8. Si `aplica` fue `true`: establecimiento **PROVEEDOR JELOU**, fecha y hora. Si fue `false`: ubicación y confirmación sin elegir centro en app.
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

Beneficiario: cédula, nombre, edad, sexo (`MASCULINO`/`FEMENINO`), parentesco (`CONYUGE`, `HIJO`, `OTROS`, etc.) en crear y en aplica-asignación médica/dental.

Los mensajes de éxito y error muestran `noticias` y `errors` de Omniax.

## ¿Por qué a veces no sale fecha/hora?

Tras elegir especialidad, Omniax responde en **aplica-asignacion**:

- `aplica_asignacion_establecimiento: true` → establecimiento, **disponibilidad-dias**, **disponibilidad-horas**, luego **asistencias**.
- `false` → solo ubicación y **POST asistencias** (servicio 11). En Red verás **201** en `asistencias` (éxito al crear), **no** es un error.

Para el flujo completo en test: cédula **0979461382**, **MEDICINA GENERAL**, coordenadas del PDF.

## ¿Son solicitudes reales?

Sí: el entorno **test-ec** (`api.geainternacional.com/test-ec`) crea asistencias reales en el ambiente de pruebas de GEA (afiliado y proveedor JELOU del manual). No es mock local; evita datos sensibles en notas y no uses producción sin autorización.
