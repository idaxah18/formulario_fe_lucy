# Handoff — Lucy Ecuador Webview (`formulario_fe_lucy`)

**Keyword Cursor / Obsidian:** `lucy_webview` (alias: `lucy-webview`)

## Arquitectura objetivo (producción)

```text
Usuario WhatsApp
  → Jelou Lucy Ecuador (skill/nodo Webview abre URL HTTPS)
  → ?telefono={wa_id}&flow=... (opcional)
  → VPS: Laravel sirve SPA Vue (chat)
  → Laravel proxy: /api/v1/omniax/*  →  Omniax (GEA) con Bearer
  → Usuario cierra webview → vuelve a WhatsApp → mensaje de cierre en Jelou (POR IMPLEMENTAR en Jelou + bridge JS)
```

Jelou **no ejecuta** el flujo de negocio dentro de la webview; solo abre el link. La lógica Omniax vive en **este repo** (motor de chat + proxy).

---

## Clonar y correr (otro dev)

### Requisitos

- PHP **8.2+** (ext: openssl, pdo, mbstring, tokenizer, xml, ctype, json, bcmath, **zip**)
- Composer 2.x
- Node **20+** y npm

### Pasos

```powershell
git clone <URL_REPO>
cd formulario_fe_lucy

copy .env.example .env
# Editar .env: GEA_OMNIAX_CLIENT_ID, GEA_OMNIAX_CLIENT_SECRET (pedir a GEA, no commitear)

composer install
php artisan key:generate

npm install
npm run build          # producción local; en dev usar npm run dev

php artisan serve      # http://localhost:8000
```

Prueba: `http://localhost:8000/?telefono=0999999999` → cédula QA → menús.

### Verificar APIs (con credenciales en `.env`)

```powershell
php scripts/omniax_probe_gea.php 0979461382 0999999999
node scripts/validate_lucy_graph.mjs
curl http://localhost:8000/api/health
```

---

## Variables de entorno

### Backend (`.env`)

| Variable | Uso |
|----------|-----|
| `APP_NAME`, `APP_URL`, `APP_KEY` | Laravel |
| `APP_TIMEZONE` | `America/Guayaquil` |
| `DB_CONNECTION` | `sqlite` (sesión en file; DB mínima) |
| `JELOU_PROJECT_ID` | Referencia `01j5661e5gaf6330435zh3bzjx` (no modifica Jelou desde aquí) |
| `JELOU_API_BASE_URL`, `JELOU_API_TOKEN` | Futuro webhook/Jelou API |
| `GEA_OMNIAX_BASE_URL` | `https://api.geainternacional.com/test-ec` o prod `/ec` |
| `GEA_OMNIAX_CLIENT_ID` | Omniax OAuth |
| `GEA_OMNIAX_CLIENT_SECRET` | Omniax OAuth |
| `GEA_OMNIAX_ID_SERVICIO_MEDICO` | Default `297` |
| `GEA_OMNIAX_ID_SERVICIO_DENTAL` | Default `298` |
| `GEA_OMNIAX_TELEFONO_DEFAULT` | Fallback si no hay `?telefono=` |
| `GEA_OMNIAX_PLAN_ASISTENCIA` | Crear GEA: `ASISTENCIAS` |
| `GEA_OMNIAX_TIMEOUT` | Segundos HTTP (default 45) |

### Frontend (Vite — prefijo `VITE_`)

| Variable | Uso |
|----------|-----|
| `VITE_APP_NAME` | Título UI |
| `VITE_OMNIAX_ID_SERVICIO_MEDICO` | `omniaxMedicoApi.js` |
| `VITE_OMNIAX_ID_SERVICIO_DENTAL` | `omniaxDentalApi.js` |
| `VITE_GEA_ID_SERVICIO_DEFAULT` | Fallback `id_servicio` GEA |
| `VITE_GEA_ID_<SERVICIO>` | Override por etiqueta (ver `geaServiceIds.js`) |

### Query string webview

| Param | Uso |
|-------|-----|
| `telefono` | Remitente WhatsApp → APIs GEA listado/en-proceso/crear |
| `flow` | `aseguradora` \| `hsm` (entrada menú) |

---

## API proxy Laravel → Omniax

Base: `/api/v1/omniax/`

### GEA — PDF `servicios-omniax-2024-03-15`

| Método | Ruta local | Omniax |
|--------|------------|--------|
| PUT | `gea/asistencias/{id}/ubicacion` | `/v1/asistencias/{id}/ubicacion` |
| GET | `gea/cuestionarios/asistencias/{id}` | `/v1/m2m/cuestionarios/asistencias/{id}` |
| POST | `gea/cuestionarios/calificar` | `/v1/m2m/cuestionarios/calificar` |
| POST | `gea/asistencias/{id}/termino` | `/v1/chatbot/asistencia/{id}/termino` |
| POST | `gea/asistencias/{id}/contacto` | `/v1/chatbot/asistencia/{id}/contacto` |
| POST | `gea/asistencias/gea` | `/v1/chatbot/asistencias/gea` |
| POST | `gea/asistencias/listado` | `/v1/asistencias/listado/chatbot-telefono` |
| POST | `gea/asistencias/en-proceso-remitente` | `/v1/chatbot/asistencias/en-proceso` |
| PUT | `gea/asistencias/{id}/cancelar` | `/v1/asistencias/{id}/cancelar` |
| POST | `gea/asistencias/{id}/reenviar-evaluacion` | … |
| POST | `gea/asistencias/{id}/evaluacion-confirmada` | … |

Controller: `app/Http/Controllers/Api/OmniaxGeaController.php`  
Cliente JS: `resources/js/api/omniaxGeaApi.js`  
Runner UI: `resources/js/flows/lucy/gea/*`

### Médico / dental — PDFs 2025 (servicios 1–12)

| Prefijo | Controller | JS API |
|---------|------------|--------|
| `/api/v1/omniax/medico/*` | `OmniaxMedicoController.php` | `omniaxMedicoApi.js` |
| `/api/v1/omniax/dental/*` | `OmniaxDentalController.php` | `omniaxDentalApi.js` |

Auth Omniax: `app/Services/Gea/OmniaxClient.php` → `POST /v1/auth/token` (solo servidor).

---

## Frontend — motor de chat

| Ruta | Rol |
|------|-----|
| `resources/js/modules/chat/views/ChatView.vue` | Shell chat, geolocalización, Omniax/GEA tasks |
| `resources/js/flows/lucy/lucyFlowGraph.js` | ~267 nodos (menús Jelou) |
| `resources/js/flows/lucy/lucyChatEngine.js` | Reducer eventos (text, quick, location, omniax/gea results) |
| `resources/js/flows/lucy/flowHelpers.js` | `crearAsistenciaChain`, stubs |
| `resources/js/flows/lucy/omniax/*` | Flujos médico/dental Omniax |
| `resources/js/flows/lucy/gea/*` | Flujos PDF GEA (crear, cancelar, encuesta, proveedor) |
| `resources/js/flows/lucy/uiMeta.js` | Dock, formularios auth |
| `resources/js/flows/lucy/flowStepper.js` | Stepper citas |

Entrada SPA: `routes/web.php` → `WebviewController` → `resources/views/app.blade.php`

---

## Integrado vs stub (UI)

**Con API real:** `omx_med_*`, `omx_den_*`, cadenas `asist_*` (hogar/vial/médico asistencias), aseguradora vial GEA, `cancelar_asistencia`, `asistencias_en_curso`, utilidades GEA (encuesta, ubicación, proveedor término/contacto).

**Stub (`stubRegistered` — ~44 hojas):** IA, siniestros aseguradora, VIP, E-Doctor, comercial, PMA, derivación asesor, muchas hojas informativas. No llaman Omniax.

---

## Pendiente (producto / Jelou)

1. Bridge **cerrar webview** + skill WhatsApp de despedida.
2. URL Jelou con `telefono` + `flow` acotado (solo rutas con API).
3. Normalización `593` → `09…` en teléfono.
4. VPS prod: `GEA_OMNIAX_BASE_URL` producción, HTTPS.
5. Gate “asistencia en curso” al crear hogar/vial (paridad Jelou).
6. Postman colección completa GEA en repo (opcional).

---

## Docs en repo

- `docs/OMNIAX_MEDICO.md`, `docs/OMNIAX_GEA.md`, `docs/FLOW_MAP.md`, `docs/SETUP.md`, `docs/ARCHITECTURE.md`

## Postman

- `postman/collections/omniax-lucy-proxy`, `lucy-omniax`, `omniax-direct-test-ec`

## Scripts

- `scripts/omniax_probe_gea.php`, `omniax_probe_*.php`, `validate_lucy_graph.mjs`, `postman_run_direct.php`
