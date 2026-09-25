# Paridad Lucy Jelou → Webview (Laravel + Vue)

**Proyecto Jelou:** `01j5661e5gaf6330435zh3bzjx`  
**Export local:** `jelou-lucy-ecuador-observe` (117 workflows, 98 tools en catálogo org)  
**Keyword:** `lucy_webview`

## Qué significa “replicar el bot”

No es copiar 117 JSON de workflow en Vue. Es:

1. **Misma UX conversacional** (grafo `lucyFlowGraph.js` ya mapea menús y textos).
2. **Mismas llamadas de negocio** que hoy hacen los nodos `TOOL` / skill templates en Jelou.
3. **Mismas reglas** (asistencia en curso, cabina, LOPDP, validación cédula, etc.).
4. **Misma credencial Omniax** (`GEA_OMNIAX_*` = tool Auth / Auth Gea en Jelou).

Jelou sigue siendo dueño de: **canal WhatsApp**, **webview URL**, **HSM**, **cierre post-webview**, y opcionalmente **IA Router** si no movemos el LLM al VPS.

## Tres familias de integración (importante)

| Familia | Ejemplos en Jelou | En webview hoy |
|--------|-------------------|----------------|
| **A. Omniax API directa** | Creación de asistencia, médico/dental PDF, cancelar, ubicación GEA, Auth token | **Mayoría hecha** vía `OmniaxClient` + controllers |
| **B. Jelou Function / proxy legacy** | `Asistencia en Curso` → `POST functions.jelou.ai/gea-lucy/asistenciasEnCurso` | **Parcial**: usamos Omniax `en-proceso`; hay que alinear respuesta con tool (ramas `sinAsistencias` / lista / cabina) |
| **C. Plataforma Jelou** | Datum (Create/Update Record), Jelou Pay, Speech-to-text, Vision, Set Flow Later | **No** — requiere API Datum/Pay o estado en Laravel + SQLite |

## Tools compartidos (alto impacto — `jelou graph summary`)

| Tool | Backend | Prioridad webview |
|------|---------|-------------------|
| Auth / Auth Gea | Omniax token | Hecho (`OmniaxClient`) |
| Asistencias en proceso new | Omniax médico/dental | Hecho |
| Asistencia Chatbot GEA | Omniax `POST .../chatbot/asistencias/gea` | Hecho (`geaRunner`) |
| Asistencia Cancelar | Omniax PUT cancelar | Hecho |
| Aplica asignación / establecimientos / fechas / horas / Reagendar cita / Creación de asistencia | Omniax PDF | Hecho en médico/dental |
| **Asistencia en Curso** | Jelou Function | **P0** — gate antes de crear hogar/vial/médico/dental |
| **Notificar Cabina Asistencia en Proceso** | Tool workflow 29962 (GEA) | **P0** — misma lógica que en WF hogar/vial |
| Validacion cedula | Tool 4303 | **P0** — hoy solo regex en cliente |
| Consulta Placa / Consulta Placa Siniestro | Omniax EC | **P1** — ASAP aseguradora |
| Consulta Provincias / Ciudades | Omniax división territorial | **P1** — siniestros |
| Reporte Siniestro Colisión / Robo | Omniax chatbot siniestro | **P1** |
| Aceptacion LOPDP | `POST .../aceptar-terminos` | **P1** — inicio bot |
| Obtener Afiliacion / Verificación cobertura / coordenadas | Vial-Hogar tools | **P1** — ASAP + hogar/vial automático |
| Crear Afiliación / Datum | Datum + APIs GEA | **P2** — ventas |
| Jelou Pay | Pasarelas | **P2** — e-doctor, compra viaja, inmediata |
| IA (Hogar IA, vial IA, Agendar cita IA) | AI_TASK + tools | **P2/P3** — replicar con mismo prompt o dejar en Jelou |

## Fases hasta “100% operativa” (definición acordada)

### Fase 0 — Go-live webview (alcance negocio acordado)

- Solución 24/7: dental, médico, hogar, vial, crear GEA, cancelar, en curso, utilidades GEA ya cableadas.
- **Falta:** gate **Asistencia en Curso** + **Notificar Cabina** idéntico a Jelou; bridge cierre webview ↔ WhatsApp.

### Fase 1 — Paridad tools GEA/Omniax (sin IA ni Pay)

- Proxy Laravel por tool slug (contrato = `jelou tool show <slug>`).
- Validación cédula, LOPDP, ubicación/termino/contacto proveedor (menú oculto).
- Reagendar asistencia genérico → menú médico/dental.

### Fase 2 — Aseguradora ASAP + siniestros + inspección

- Flujos `v2-aseguradora-inicio`, `siniestro*`, `inspeccion` → APIs Consulta Placa, reportes, parentesco, contador.

### Fase 3 — Comercial, VIP, Datum, pagos

- Ventas, afiliación, Jelou Pay, recordatorios cita.

### Fase 4 — IA Router (opcional en VPS)

- Si el jefe exige mismos subflujos IA: endpoint Laravel con mismos system prompts exportados de workflows `*-ia.whatsapp.json`, o **híbrido**: webview solo formularios y Jelou mantiene IA.

## Cómo implementamos cada tool en Laravel

```text
resources/js/flows/...  →  resources/js/api/jelouToolsApi.js (o por dominio)
                        →  app/Http/Controllers/Api/JelouToolProxyController.php
                        →  OmniaxClient | Http:: Jelou Function | Datum API
```

- Pull de contratos: `cd jelou-lucy-ecuador-observe && jelou tool pull <slug>`
- Tests: comparar respuesta tool vs proxy con mismos inputs de memoria Jelou (`telefono_remitente`, `cveafiliado`, `plan_asistencia`).

## Definición “100% operativa”

| Criterio | Responsable |
|----------|-------------|
| Usuario completa flujo en webview sin “registrado en sistema” falso | Vue + API |
| Mismas ramas de error que Jelou (mensajes `noticias`) | Vue |
| Credenciales y ambientes test-ec / prod | DevOps `.env` |
| Vuelta a WhatsApp con mensaje final | Jelou skill + JS `postMessage`/SDK |
| Flujos fuera de alcance deshabilitados en menú Jelou | Config canal |

## Siguiente sprint técnico (recomendado)

1. `jelou tool pull` — `asistencia-en-curso`, `notificar-cabina-asistencia-en-proceso`, `validacion-cedula`.
2. Laravel: servicio `AsistenciaEnCurso` (Function + fallback Omniax si aplica).
3. `geaRunner` + dental/médico/hogar/vial: copiar árbol de decisión de `2-3-hogar`, `2-4-vial`, `2-1-dental`, `2-2-medico` (nodos TOOL).
4. Matriz tool → endpoint en este doc (ampliar tabla por slug).
