# Fase 2 — Pruebas (ASAP / siniestros / inspección)

## Nuevo en esta fase

| Tool Jelou | Endpoint Laravel | UI |
|------------|------------------|-----|
| Consulta Placa (vial ASAP) | `POST /api/v1/aseguradora/consulta-placa-vial` | Aseguradora → servicio vial → placa → cabina ASEGURADORA → consulta placa |
| Consulta Placa Siniestro | `POST /api/v1/aseguradora/consulta-placa-siniestro` | Menú siniestro (colisión / robo) |
| Consulta Provincias / Ciudades | `GET .../provincias`, `GET .../provincias/{id}/ciudades` | Wizard siniestro |
| Reporte Colisión / Robo total / parcial | `POST .../siniestro/*` | Tras dirección, fecha y hora |
| Inspección buscar aseguradora | `POST .../inspeccion/buscar-aseguradora` | Aseguradora → Inspección de riesgo |
| Lista Parentesco | `GET .../parentesco` | API lista (UI completa en fases posteriores si aplica) |

**Cableado chat:** `aseguradoraRunner` + `lucyChatEngine` (`asegEnter` / `asegResult` / `useAsegMenu`) + `ChatView.runAsegTask`.

## Prerrequisitos

- `.env` con `GEA_OMNIAX_*` (misma credencial que Fase 0/1).
- URL de prueba con query `?telefono=0999999999` (o el teléfono QA acordado).
- Cédula y nombre al inicio del flujo (`0979461382` en QA).

## Pruebas manuales

1. **Vial ASAP**  
   Solución 24/7 → Aseguradora → un servicio vial (grúa, batería, etc.) → placa válida con afiliación → si no hay asistencia en curso (cabina), debe continuar al flujo GEA del servicio.

2. **Asistencia legal**  
   Aseguradora → Asistencia Legal → placa → consulta vial → mensaje informativo (sin crear GEA).

3. **Siniestro colisión**  
   Menú siniestro → Colisión → placa → provincia/ciudad (menús dinámicos) → dirección, fecha (`DD/MM/AAAA` o formato que uses en QA), hora → envío → mensaje de éxito y nodo `sin_done`.

4. **Robo total / parcial**  
   Mismo wizard sin tipo de colisión.

5. **Inspección**  
   Aseguradora → Inspección → código de riesgo o placa → respuesta Omniax en chat.

6. **Postergar siniestro**  
   Solo mensaje informativo (sin Datum/Jelou); paridad completa en Fase 3 si aplica.

## Probe backend (sin UI)

```powershell
php scripts/aseguradora_probe.php GYE1234
node scripts/validate_lucy_graph.mjs
npm run build
```

## Limitaciones conocidas (paridad Jelou)

- Reportes de colisión envían `imagenes` / biometría vacíos; en WhatsApp Jelou puede pedir fotos.
- Menú parentesco expuesto en API; flujos que lo requieran en bot completo pueden ampliarse después.
- Provincias/ciudades: máximo 12 opciones por menú en UI (acortar o paginar si QA lo exige).

## Siguiente: Fase 3

Ver `docs/PHASE3_TEST.md` (Datum, Jelou Pay, ventas/comercial).
