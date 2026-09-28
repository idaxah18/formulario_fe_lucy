# Stub faltantes — Lucy Ecuador webview

> También disponible como [`Stub Faltantes.md`](./Stub%20Faltantes.md).

**Keyword:** `lucy_webview`  
**Proyecto Jelou:** `01j5661e5gaf6330435zh3bzjx` (Lucy Ecuador)  
**Código stub:** `stubRegistered()` en `resources/js/flows/lucy/flowHelpers.js`  
**Grafo:** `resources/js/flows/lucy/lucyFlowGraph.js`

---

## ¿Qué es un stub aquí?

Un **stub** no es “falta de API key”. Es un nodo que **nunca llama a backend**: muestra mensaje de simulación y sale al menú. Aunque el `.env` esté completo, esas rutas **siguen sin integrar** hasta cambiar el grafo y el runner/proxy.

**Otras situaciones (no son stub):**

| Situación | Ejemplo |
|-----------|---------|
| API implementada, falta key | Pay/Datum → 503 o `simulated: true` |
| Parcial | VIP: pide código pero no llama tool **5585** |
| Solo QA | Simulador **HSM** (`hsm_*`) — sin API GEA |
| Menú sin entrada en webview | Muchas de las **98 tools** del catálogo org nunca aparecen en el chat web |

---

## ¿Este documento lo incluye **todo** lo que falta?

| Alcance | ¿Incluido? |
|---------|------------|
| Los **9 nodos stub** restantes del grafo (integración pendiente por diseño) | **Sí** — tablas §1 |
| **Parciales** (UI sin API o API distinta a Jelou) | **Sí** — §2 |
| **Dependencia de `.env`** (no es stub, es configuración) | **Sí** — §3 |
| **Cada tool del catálogo (98)** sin pantalla en webview | **No al detalle** — ver `docs/JELOU_TOOLS_CATALOG.md` y §4 |
| Paridad **byte-a-byte** con cada salida de tool Jelou | **No** — requiere matriz de tests por tool |

Para el dev del bot: usar la columna **Referencia Jelou** (nombre de skill/checkpoint en Brain) y buscar en **Jelou Developers → Proyecto Lucy Ecuador → Skills** (o export local `jelou-lucy-ecuador-observe/workflows/*.whatsapp.json` si lo tienen en disco).

---

## §1 — Stubs puros (sin API)

Comportamiento actual: *“Simulación… (Sin integración API en esta webview de prueba.)”*

### 1.1 Solución 24/7 — Médico, Vial, soporte

| Nodo webview | Ruta en el chat | Referencia Jelou (skill / checkpoint) | Workflow / skill sugerido (export) | Tools Jelou relacionadas (catálogo) |
|--------------|-----------------|--------------------------------------|-----------------------------------|-------------------------------------|
| ~~`leaf_orientacion_medica`~~ | **Hecho** — cadena GEA `asist_*` (`id_servicio` **302**, skill **4220**) | `2.2 Médico` | `2-2-medico.whatsapp.json` | Mismo `POST /asistencias/gea` que ambulancia |
| ~~`bienestar_nutricion`~~ | **Hecho** — cadena GEA (`id_servicio` **304**, skill **4220**) | `2.2.6 Bienestar y nutrición` | Skill `2.2.6` / `2-2-medico` | Mismo flujo cabina + `POST /asistencias/gea` |
| ~~`leaf_asistencia_legal_vial`~~ | **Hecho** — WF `2.4 Vial` lista opción 7; placa → skill **5231** (`id_servicio` **322**) | `2.4 Vial` | `2-4-vial.whatsapp.json` | Sin GPS; cabina + `POST /asistencias/gea` |
| ~~`otras_soluciones_2`~~ | **Hecho** — menú Sí/Salir; Sí → GEA **476** + skill **5231** (sin ubicación) | `Otras soluciones 2` | `otras-soluciones-2.whatsapp.json` | Cabina + `POST /asistencias/gea` |
| ~~`reportar_problema_done`~~ | **Hecho** — texto WF + salida menú (en WA skill **7492** PMA equipo; sin ticket Datum en WF) | `2.6 Reportar un problema` | `2-6-reportar-un-problema.whatsapp.json` | Derivación operativa vía PMA (no replicada en webview) |

### 1.2 Ver más opciones — Información y factura

| Nodo webview | Ruta en el chat | Referencia Jelou | Workflow sugerido | Tools relacionadas |
|--------------|-----------------|------------------|-------------------|-------------------|
| ~~`leaf_info_hogar`~~ | **Hecho** — derivación Datum (`producto` PMA) | `2.7.1.1` / `Información de servicio contratado` | `2-7-1-1-informacion-de-servicio-contratado` | En WA → skill **4236** PMA |
| ~~`leaf_info_vial`~~ | **Hecho** — idem segmento Vial | Idem | Idem | Idem |
| ~~`leaf_info_medico`~~ | **Hecho** — idem segmento Médico | Idem | Idem | Idem |
| ~~`leaf_info_dental`~~ | **Hecho** — idem segmento Dental | Idem | Idem | Idem |
| ~~`leaf_info_otras`~~ | **Hecho** — idem Otras asistencias | Idem | Idem | Idem |
| ~~`solicitar_factura`~~ | **Hecho** — WF solo PMA (4236); webview derivación Datum `producto: Solicitar factura` | `2.7.1.2 Solicitar factura` | `2-7-1-2-solicitar-factura` (workflowId **7707**) | En WA → skill **4236** PMA |

### 1.3 Protección y productos comerciales (solo hoja stub)

| Nodo webview | Ruta en el chat | Referencia Jelou | Workflow sugerido | Tools relacionadas |
|--------------|-----------------|------------------|-------------------|-------------------|
| ~~`leaf_proteccion`~~ | **Hecho** — perfil IA `proteccion` (paridad AI_TASK WF 29787; KB Jelou vía prompt) | `4 - Servicios Protección - Inicio` | `4-servicios-proteccion-inicio` | Sin `LUCY_IA_API_KEY` = modo guiado |
| ~~`edoctor_info`~~ | **Hecho** — derivación Datum `producto: E-doctor` + mensaje informativo | `Activar e-doctor - Quiero Más Información` | Flujo e-doctor (info) | “Adquirir plan” → Pay (`JELOU_PAY_*`) |
| ~~`leaf_pycca`~~ | **Hecho** — Contratar y “Quiero que me llamen” → derivación Datum `producto: Pycca Cuidado familiar` | `Asistencia Cuidado Familiar Pycca - Inicio` | Skill Pycca | Tabla venta 1435 |
| ~~`leaf_banco`~~ | **Hecho** — derivación Datum `producto: Banco Bolivariano` (compra online; Pay empaquetado pendiente si GEA lo exige) | `Bco Bolivariano - Venta Asistencia - Inicio` | Skill banco | Tabla venta 1435 |
| ~~`leaf_banco_llamada`~~ | **Hecho** — derivación Datum `producto: Banco Bolivariano` | `Bco Bolivariano - Venta Asistencia - Inicio` | Idem | Tabla venta 1435 |
| `leaf_jaher` | Jaher → Empezar | `Jaher - Inicio` | Skill Jaher | — |
| `info_productos` | Utilidades → Comercial extra → Información productos | `Informacion productos` | Menú comercial / info | — |

### 1.4 Utilidades, proveedor, dev

| Nodo webview | Ruta en el chat | Referencia Jelou | Workflow sugerido | Tools relacionadas |
|--------------|-----------------|------------------|-------------------|-------------------|
| `desvincular` | Utilidades → Desvincular | `Desvincular` | Skill utilidades | — |
| `pma` | Utilidades → PMA | `PMA` | Skill PMA | — |
| `pma_retencion` | Utilidades → PMA Retención | `PMA - Retención` | Skill PMA retención | — |
| `leaf_prov_fotos` | Utilidades → Menú oculto proveedores → Fotos | `Menú oculto proveedores` | Proveedor / menú oculto | **3605** Menu Oculto Asistencia Subir Fotos V2 |
| `leaf_dev_gea` | Utilidades → Dev → Dev Gea | `Dev Gea` | `dev.whatsapp.json` (típico) | — |
| `leaf_pruebas` | Dev → pruebas Lucy | `pruebas Lucy` | Dev / QA | — |
| `leaf_pma_equipo` | Dev → PMA equipo Lucy | `PMA - equipo lucy` | PMA interno | — |

**Total §1: 9 nodos stub** (más 16 integrados en §1.1–§1.3).

---

## §2 — No son `stubRegistered`, pero falta integración o paridad

| Ítem | Nodo / tarea | Qué falta | Referencia Jelou | Tool ID (catálogo) |
|------|--------------|-----------|------------------|-------------------|
| VIP verificación | `vip_codigo` → `vip_codigo_stub` | No llama API Omniax | `3 - Asistencias VIP - Inicio` | **5585** Verifica Código VIP, **5587** Actualización Código VIP |
| VIP afiliación final | `vip_registro_done` | Mensaje: activación final en WA | Idem | Crear afiliación / Omniax (revisar WF) |
| Blog 24/7 | `blog_solucion` | Solo texto, sin enlace/API | `2.7.3 Blog Solución 24/7` | — |
| Wizard dental viejo | `wiz_*` / `leaf_2_1_1_agendar_cita` | Stub al final; **no enlazado** al menú (agendar real = `omx_den_cabina`) | `2.1.1 Agendar cita` | Usar flujo Omniax (**3829**, **3843**, etc.) |
| Simulador HSM | `hsm_*` | QA plantillas, sin API | Skills HSM / categorías en `hsmCatalog.js` | Herramientas de notificación en Jelou, no GEA |
| Validación cédula en login | `auth_cedula` | Solo regex cliente; backend **4303** existe pero no se usa en UI | `Proteccion datos cedula` | **4303** Validacion cedula |
| Asistencia en curso (troncal) | `truncal_en_curso` / tool | Webview usa Omniax directo; Jelou tool usa **Function** | Truncal-inicio | **2678** Asistencia en Curso → `functions.jelou.ai` |
| Crear afiliación post-pago | Varios comerciales | Pay puede funcionar; alta afiliación Omniax incompleta | Venta / e-doctor WF | **5744** Obtener Afiliacion, Datum, etc. |
| IA en Jelou vs VPS | `hogar_ia`, `vial_ia`, … | Webview usa `LUCY_IA_*`; no es el mismo runtime que AI_TASK de WhatsApp | `*-ia.whatsapp.json`, `ia-router.whatsapp.json` | **4188** Aplica asignación IA, etc. |
| Cierre webview → WhatsApp | `webviewBridge` | Evento JS listo; skill Jelou debe escuchar | Skill Webview / cierre | — |

---

## §3 — Integrado en código, pero “no funciona” sin `.env`

No son stubs: al entrar al flujo **sí hay llamada** (o middleware bloquea).

| Integración | Variables | Afecta (ejemplos) |
|-------------|-----------|-------------------|
| Core Omniax | `GEA_OMNIAX_CLIENT_ID`, `GEA_OMNIAX_CLIENT_SECRET` | Médico, dental, GEA, ASAP, cabina |
| LOPDP | `GEA_LOPDP_API_KEY` | Inicio → aceptación términos |
| Datum | `JELOU_API_TOKEN` | Venta contratar, derivación asesor, IA router términos |
| Pay | `JELOU_PAY_BEARER`, `JELOU_PAY_APP_ID` | E-doctor, viaja, inmediata |
| IA LLM | `LUCY_IA_API_KEY` | Chat IA (modo guiado sin key) |
| Function legacy (opcional) | `GEA_JELOU_FUNCTION_*` | Solo si se alinea tool **2678** 1:1 |

Diagnóstico: `php scripts/check_integrations.php` · `GET /api/v1/integrations/status`

---

## §4 — Catálogo Jelou (98 tools) vs menú webview

El bot en WhatsApp puede usar **cualquier tool** del catálogo org vía workflows. El webview solo replica **las rutas del grafo** (~324 nodos) y proxies Laravel.

- Listado completo tool → API → familia de credencial: **`docs/JELOU_TOOLS_CATALOG.md`**
- Roadmap de paridad por fases: **`docs/JELOU_PARITY_ROADMAP.md`**

Ejemplos de tools **sin menú dedicado** en webview (aunque existan en Jelou): Speech-to-text (**333**), Jelou Vision (**3822**), Lip Sync (**1498**), GiftPoint (**7568**), Set Flow Later (**1442**), muchas validaciones de horario (**6865**, **6923**), etc. No hace falta stub en grafo si el usuario **no puede llegar** a esa opción en la web.

---

## §5 — Qué **sí** está integrado (para no confundir con stub)

Referencia rápida — **no** listar como faltante:

- Agendar / reagendar **médico y dental** (`omx_med_*`, `omx_den_*`) → Omniax PDF
- **Hogar / vial** crear asistencia (`asist_*` + `geaRunner`)
- **Aseguradora** vial + **siniestros** + inspección (API ASAP)
- **Cancelar**, **en curso**, **encuesta**, **ubicación**, proveedor **contacto/término** (GEA)
- **LOPDP**, **notificar cabina**, **menú proveedor valida**
- **Comercial** Pay/Datum (con credenciales)
- **IA** composer (con o sin `LUCY_IA_API_KEY`)

---

## §6 — Cómo el dev del bot debe rastrear cada integración

1. **Proyecto:** `01j5661e5gaf6330435zh3bzjx` en [Jelou Developers](https://developers.jelou.ai) (o consola que use GEA).
2. **Skill:** buscar por el texto de columna *Referencia Jelou* (coincide con `jelou:` en nodos del grafo).
3. **Tool:** en el skill, nodos tipo **TOOL** → nombre / ID → `jelou tool show <slug>` con perfil `gea-ecuador`.
4. **Export local (si existe):** `jelou-lucy-ecuador-observe/tools/<slug>.json` y `workflows/<skill>.whatsapp.json`.
5. **Webview:** implementar equivalente en `routes/api.php` + `resources/js/api/*` + runner (`geaRunner`, `omniax*Runner`, `comercialRunner`, …).

---

## Mantenimiento

Al quitar un stub:

1. Sustituir `stubRegistered(...)` por nodo con `gea` / `omniax` / `com` / `aseg` `enter`.
2. Actualizar esta tabla (marcar fila como **Hecho** o eliminarla).
3. Añadir prueba en `docs/PHASE*_TEST.md` o script probe si aplica.

Última revisión: alineado al grafo en `lucyFlowGraph.js` (9 llamadas a `stubRegistered`).
