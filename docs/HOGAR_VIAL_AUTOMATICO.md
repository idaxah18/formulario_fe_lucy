# Hogar / Vial — test-ec (`GEA_OMNIAX_BASE_URL`)

Base acordada con GEA:

```env
GEA_OMNIAX_BASE_URL=https://api.geainternacional.com/test-ec
GEA_OMNIAX_CLIENT_ID=...
GEA_OMNIAX_CLIENT_SECRET=...
```

**Nota:** El PDF de creación cita `test.api.geainternacional.com/test-ec`, pero desde PHP/Laravel en Windows las peticiones **con Bearer** a ese host suelen fallar con `cURL error 35 (Connection was reset)`. La colección `postman/environments/omniax-direct.yaml` y las pruebas que pasan usan **`https://api.geainternacional.com/test-ec`** (mismo ambiente test-ec).

| Flujo | Upstream |
|-------|----------|
| Auth | `POST {base}/v1/auth/token` |
| **Normal** (grúa otro motivo, inspector, hogar no listado, …) | `POST {base}/v1/chatbot/asistencias/gea` |
| **Automático** (plomero, electricista, llanta, gasolina, …) | `POST {base}/v1/chatbot/proceso-automatico/*` |

La collection Postman en `apoyo/` (host `test.siga`) está **obsoleta**; el proxy Lucy usa solo Omniax test-ec.

## Webview

- Menú **Hogar** / **Vial** → `buildHybridGeaServiceChains` en `lucyFlowGraph.js`.
- Servicios del listado GEA → `automaticoChain` + `POST /api/v1/gea/proyectos-automatico/*` → Omniax `proceso-automatico`.
- Resto → `crearAsistenciaChain` + cabina → `POST /api/v1/omniax/gea/asistencias/gea`.

IDs automáticos: `resources/js/flows/lucy/gea/automaticoCatalog.js` (override `VITE_GEA_AUTO_ID_*`).

## Probar

1. `php artisan config:clear`
2. Electricista → red `.../proyectos-automatico/afiliacion` (no `test.siga`).
3. Grúa → red `.../omniax/gea/asistencias/gea`.
