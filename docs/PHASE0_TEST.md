# Fase 0 — Pruebas (tools Jelou → Laravel)

## Acceso Jelou

- CLI perfil `gea-ecuador`, proyecto `01j5661e5gaf6330435zh3bzjx`
- Tools pull local: `jelou-lucy-ecuador-observe/tools/*.json`

## APIs nuevas

| Tool Jelou | Endpoint webview |
|------------|------------------|
| Asistencia en Curso | `POST /api/v1/gea/tools/asistencia-en-curso` `{ "telefono": "0999999999" }` |
| Notificar Cabina | `POST /api/v1/gea/tools/notificar-cabina` |
| Validación cédula | `POST /api/v1/gea/tools/validacion-cedula` |
| Aceptación LOPDP | `POST /api/v1/gea/tools/aceptacion-lopdp` (requiere `GEA_LOPDP_API_KEY`) |

## Script

```powershell
php scripts/gea_tools_probe.php 0979461382 0999999999
```

## Flujo UI (manual)

1. `http://localhost:8000/?telefono=0999999999`
2. Cédula QA `0979461382` + nombre → pasa LOPDP (si hay api-key) → menú truncal
3. **Sí** asistencia en curso → lista vía tool
4. Hogar → Plomero → ubicación → dirección → **cabina_gate** → crear GEA real

## Criterio Fase 0 OK

- [ ] `asistencia-en-curso` devuelve `branch` coherente
- [ ] Crear hogar/vial no omite validación cabina
- [ ] Mensaje bloqueo si `asistencia_vigente`

Siguiente: **Fase 1** — resto tools Omniax compartidos (Auth ya, cancelar, ubicación, menú oculto, dental gate DENTAL).
