# Fase 1 — Pruebas (tools GEA/Omniax sin IA)

## Nuevo en esta fase

| Tool Jelou | Endpoint | UI |
|------------|----------|-----|
| Notificar Cabina | (ya Fase 0) | **Dental / Médico** agendar y reagendar pasan por `omx_*_cabina` |
| Menu Oculto Asistencia Valida | `GET /api/v1/gea/tools/menu-proveedor/asistencias/{id}` | Utilidades → Menú oculto → contacto/término |
| Asistencia Reagendar (genérico) | `POST /api/v1/gea/tools/asistencia-reagendar` | API lista (hogar/vial usan crear GEA) |
| Reagendar asistencia (menú) | — | En curso → Reagendar → Dental / Médico |

Cancelar, ubicación, contacto y término proveedor siguen en `OmniaxGeaController` (equivalente tools 2603/2604).

## Pruebas manuales

1. **Dental con cabina**  
   Cédula + nombre → 24/7 → Dental → Agendar → si hay asistencia vigente, mensaje de bloqueo; si no, flujo Omniax.

2. **Médico con cabina**  
   Igual en Médico → Agendar cita médica. La llamada a `notificar-cabina` sigue ocurriendo; si GEA responde `asistencia_vigente`, el flujo de **citas** no vuelve al menú (sigue a Omniax). Hogar/vial sí bloquean.

3. **Reagendar menú**  
   Asistencias en curso → Reagendar asistencia → elegir Dental o Médico.

4. **Menú oculto proveedor**  
   Utilidades → Menú oculto → Contacto o Término → ID asistencia válido (estado Omniax 404 en valida) → preguntas Sí/No → API real.

```powershell
php scripts/gea_tools_probe.php 0979461382 0999999999
node scripts/validate_lucy_graph.mjs
```

## Siguiente: Fase 2 (ASAP / siniestros)

Consulta Placa, provincias/ciudades, reportes de siniestro, inspección.
