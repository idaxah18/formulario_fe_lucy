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

Orden de nodos (draw.io Hogar/Vial automático):

1. `auto_preg_*` — cuestionario **early** (`getAutomaticoEarlyQuestionPlan`)  
3. `auto_placa_*` — solo vial  
4. `auto_tel_*` — confirmar teléfono  
5. `auto_afiliacion_*` — S1 afiliación  
6. `auto_vehiculo_*` / pick / tipo / datos marca-modelo-año — S2 (vial)  
7. `auto_timing_*` — inmediato / programado + fecha/hora + `auto_prog_link_*` (ubicación programada / HSM)  
8. `auto_loc_*` / `auto_dir_*` / `auto_hogar_problema_*` (hogar)  
9. `auto_ubicacion_*` — API ubicación (vial)  
10. `auto_cobertura_*` — S3 cobertura  
11. `auto_preg_*` — cuestionario **late** (`getAutomaticoLateQuestionPlan`)  
12. Combustible / coordenadas — según servicio  
13. `auto_pre_crear_gate_*` — SERVICIO 6 (`PROGRAMADA` si aplica)  
14. `auto_crear_*` — S5 crear asistencia  
15. Rama cabina: `auto_cabina_route_*` → ubicación → `cabina_gate` (GEA legacy)  

Sin afiliación: `gea_auto_sin_afiliacion_hogar|vial` → asesor.

Preguntas y copy: `automaticoQuestions.js`, `automaticoFlowCopy.js`.

## Pendiente vs PNG completo

- Hogar no listado (cerrajero, vidriería, …): aún flujo cabina legacy.  
- HSM / webview ubicación programada y traslado (`EC-{id}`): revisar `webviewIntent` + coordenadas.  
- Validar textos letra por letra contra PNG con QA GEA.
