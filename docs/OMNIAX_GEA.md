# Omniax GEA — servicios generales (PDF 2024-03-15, Jelou skill 4220)

Proxy Laravel: `/api/v1/omniax/gea/*` → Omniax `test-ec`.

## Flujo webview

| Experiencia | Nodos | API |
|-------------|-------|-----|
| Hogar / vial / médico GEA (ambulancia, orientación telf., médico domicilio, etc.) | `asist_loc_*` → dirección → `asist_done_*` | `POST /asistencias/gea` |
| Troncal “asistencia en curso” | `asistencias_en_curso` | `POST /asistencias/en-proceso-remitente` |
| Cancelar | `cancelar_asistencia` → menú → `gea_cancel_done` | `POST /asistencias/listado` + `PUT …/cancelar` |

`id_servicio` por etiqueta de menú: `resources/js/flows/lucy/gea/geaServiceIds.js` (alineado a Jelou 2.3 / 2.4 / 2.2).

Vial: placa → ubicación → dirección (skill 4220 en Jelou).

## Variables

- `GEA_OMNIAX_PLAN_ASISTENCIA` (default `ASISTENCIAS`)
- `VITE_GEA_ID_<SERVICIO>` override opcional por servicio
- `?telefono=` en la URL del webview (WhatsApp remitente)

## Utilidades webview (menú Utilidades / Proveedores)

| Flujo | Nodos |
|-------|--------|
| Encuesta | `gea_encuesta_id` → cuestionario → calificar |
| Reenviar evaluación | `gea_reeval_id` |
| Evaluación confirmada | `gea_eval_conf_id` |
| Actualizar ubicación | `gea_ubicacion_id` → GPS → PUT |
| Proveedor contacto / término | `gea_prov_*` |

Validación grafo: `node scripts/validate_lucy_graph.mjs`  
Probe API: `php scripts/omniax_probe_gea.php [cedula] [telefono]`
