# Trazabilidad — Flujo Lucy (PNG) ↔ webview

Ambiente API: `GEA_OMNIAX_BASE_URL` → `https://api.geainternacional.com/test-ec` (médico, dental, GEA, proceso automático).

## Servicios

| Menú | Flujo | Upstream principal |
|------|--------|-------------------|
| Hogar: Plomero, Electricista | Automático (`automaticoChain`) | `proceso-automatico/*` |
| Hogar: resto | Normal (`crearAsistenciaChain`) | `chatbot/asistencias/gea` |
| Vial: Grúa por avería, llanta, gasolina, corriente, cerrajería | Automático | `proceso-automatico/*` |
| Vial: Grúa (otro motivo), inspector, legal | Normal | `asistencias/gea` |

## Pipeline automático compartido (Hogar/Vial)

Orden de nodos (misma estructura; vial incluye placa/vehículo):

1. `auto_timing_*` — ahora / programada  
2. `auto_prog_fecha_*` / `auto_prog_hora_*` — si programada  
3. `auto_placa_*` — solo vial  
4. `auto_afiliacion_*` — API afiliación  
5. `auto_preg_*` — cuestionario (ver `automaticoQuestions.js`)  
6. `auto_vehiculo_*` / `auto_vehiculo_pick_*` — API vehículo + menú si hay varios  
7. `auto_loc_*` / `auto_dir_*` / `auto_hogar_problema_*` (hogar)  
8. `auto_ubicacion_*` — API ubicación (vial)  
9. `auto_tel_*` — confirmar teléfono  
10. `auto_cobertura_*` — API cobertura  
11. Combustible / coordenadas — según servicio  
12. `auto_crear_*` — API asistencia  

Sin afiliación: `gea_auto_sin_afiliacion_hogar|vial` → asesor.

Preguntas y copy: `automaticoQuestions.js`, `automaticoFlowCopy.js`.

## Pendiente vs PNG completo

- Hogar no listado (cerrajero, vidriería, …): aún flujo cabina legacy.  
- HSM / webview ubicación programada y traslado (`EC-{id}`): revisar `webviewIntent` + coordenadas.  
- Validar textos letra por letra contra PNG con QA GEA.
