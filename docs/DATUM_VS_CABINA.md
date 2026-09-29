# Datum vs Cabina — guía para desarrollo (Lucy webview)

Este documento aclara por qué **`POST /api/v1/jelou/datum/derivacion`** no es lo mismo que **notificar cabina**, y por qué en pruebas la derivación puede parecer que “no hace nada”.

---

## Resumen en una frase

| Integración | Rol |
|-------------|-----|
| **Cabina (GEA / Omniax)** | Validación operativa: ¿el afiliado puede seguir creando o agendando una asistencia? |
| **Datum (`/derivacion`)** | Registro comercial en Jelou (lead / interés en asesor). **No** llama a GEA ni dispara cabina. |

El núcleo 24/7 (médico, dental, hogar, vial, grúas, agendar, reagendar) va por **Omniax**, no por Datum.

---

## `POST /api/v1/jelou/datum/derivacion`

**Controlador:** `App\Http\Controllers\Api\JelouDatumController::derivacionLead`  
**Frontend:** `resources/js/api/comercialApi.js` → `crearDerivacionLead()`  
**Usado en:** derivación a asesor comercial, info de servicio contratado, factura, e-doctor info, Pycca, banco, etc. (`comercialRunner`, nodos `*_asesor_load`).

### Comportamiento

1. Valida: `identificacion`, `nombre`, `telefono`, `producto`, `notas`.
2. Si **Datum no está configurado** en el servidor (`JELOU_DATUM_VENTA_BASIC_*` / `JELOU_DATUM_BASIC_*` o lo que exija `JelouApiClient::configured()`):
   - Responde **HTTP 200** con `ok: true`, **`simulated: true`** y mensaje de simulación.
   - **No hay llamada a `api.jelou.ai` ni fila creada.**
3. Si **sí está configurado**:
   - Crea una fila en la tabla Datum **`venta_asistencias`** (config: `JELOU_DATUM_TABLE_VENTA`, default **1435**).
   - Campos típicos: `identificacion`, `identificador_canal` (teléfono), `producto`, `opcion_recurso_utilizado`, `canal: WEBVIEW`, `accion_ejecutada: INTERESADO`, `segmento: Chat`, fecha/hora.

### Qué **no** hace

- No llama a **Omniax / GEA**.
- No ejecuta **notificar cabina**.
- No crea asistencia operativa (grúa, hogar, cita médica, etc.).
- No garantiza una **llamada telefónica** automática: es un **lead en CRM Jelou**. En WhatsApp, el seguimiento suele depender de **workflows/skills Jelou** (PMA, etc.) sobre esa tabla.

### Cómo verificar en pruebas

- **Network (DevTools):** respuesta con `simulated: true` → falta configurar Datum en `.env` del servidor.
- **Postman:** mismo endpoint; sin credenciales Datum verás simulación, no error 404.
- **Efecto visible en GEA/cabina:** ninguno; es esperado.

---

## Notificar cabina (tool GEA)

**Ruta Lucy:** `POST /api/v1/gea-tools/notificar-cabina` (ver `routes/api.php` y `GeaToolsController::notificarCabina`).  
**Frontend:** `resources/js/api/geaToolsApi.js` → `notificarCabinaAsistencia()`  
**Lógica:** `resources/js/flows/lucy/gea/cabinaGate.js` → `runCabinaGateOrBlock()`

### Comportamiento

- Llama a Omniax: **`POST /v1/chatbot/validacion/asistencias/en-proceso`** con cédula, teléfono, `tipo_servicio`, `plan_asistencia`, placa, etc.
- Respuesta con ramas como:
  - `success` — puede continuar el flujo de creación/agendamiento.
  - `asistencia_vigente` — bloqueo (salvo excepciones como citas Omniax con `allowVigenteForAppointments`).
  - `error_http` — fallo de API.

### Dónde aparece en el producto

- Prefacio + nodo `cabina_gate` antes de crear asistencias GEA (hogar, vial, grúa, etc.).
- Citas **médico/dental** (Omniax): `omx_*_cabina` tras el prefacio de cabina.
- **No** es el botón “Continuar con asesor” de cobertura Omniax (eso va a derivación Datum u otro nodo comercial).

---

## Comparación rápida

| | **Derivación Datum** | **Notificar cabina** |
|--|----------------------|----------------------|
| **URL local** | `/api/v1/jelou/datum/derivacion` | `/api/v1/gea-tools/notificar-cabina` |
| **Backend remoto** | Jelou Datum (`api.jelou.ai`, tabla ventas) | GEA Omniax (`GEA_OMNIAX_*`) |
| **Credenciales** | `JELOU_DATUM_VENTA_BASIC_*`, tablas en `config/services.php` | `GEA_OMNIAX_CLIENT_ID/SECRET` |
| **Sin credenciales** | `simulated: true` (200) | Error o respuesta GEA según caso |
| **Propósito** | Lead / interés comercial | Regla de asistencia en proceso |
| **¿Crea asistencia GEA?** | No | No (solo valida; la creación es otro paso) |
| **¿“Llama” al cliente?** | No por este endpoint | No por este endpoint (mensaje de negocio vía flujo/cabina) |

---

## Por qué el dev puede decir que “los endpoints Datum están mal”

1. **Mezclar catálogo Jelou (98 tools)** con **proxies Laravel**: la webview no expone un endpoint por cada tool; solo un subconjunto (Datum venta/derivación, Pay, Omniax, GEA tools).
2. **Probar derivación esperando efecto de cabina u Omniax** — son sistemas distintos.
3. **Datum sin `.env`** — la API “responde bien” en simulación pero no hay fila en Jelou.
4. **Datum con credenciales incorrectas** — Basic auth por perfil (`venta` vs `default`); Bearer `sk_` del Brain no sustituye Datum v2 en este proyecto.

Referencias adicionales:

- `docs/STUB_FALTANTES.md` (§3 credenciales)
- `docs/JELOU_PARITY_ROADMAP.md` (familias Omniax vs Jelou plataforma)
- `config/services.php` → `jelou.datum_*`, `gea_omniax`

---

## Checklist para derivación real (no simulación)

1. Configurar en el servidor (no commitear secretos):
   - `JELOU_DATUM_VENTA_BASIC_USER`
   - `JELOU_DATUM_VENTA_BASIC_PASSWORD`
   - Opcional: `JELOU_DATUM_TABLE_VENTA` si la tabla no es 1435.
2. Reiniciar `php artisan` / workers tras cambiar `.env`.
3. Llamar `POST /derivacion` con body JSON de prueba; confirmar **`simulated` ausente** y `data` con el registro creado.
4. En Jelou Brain, verificar que existan automatizaciones sobre filas `INTERESADO` / canal `WEBVIEW` (paridad con WhatsApp PMA).

---

## Checklist para cabina (operativo)

1. `GEA_OMNIAX_*` y país/ruta correctos en `.env`.
2. Probar flujo que pase por `cabina_gate` (grúa, hogar, agendar cita con prefacio).
3. En Network, ver llamada a **`notificar-cabina`**, no a `/jelou/datum/derivacion`.
