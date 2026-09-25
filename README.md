# Lucy Ecuador — Webview (Laravel + Vue)

Webview del bot **Lucy Ecuador** (Jelou `01j5661e5gaf6330435zh3bzjx`): chat estilo WhatsApp que consume **Omniax** vía proxy Laravel.

**Handoff completo:** [docs/HANDOFF.md](./docs/HANDOFF.md)  
**Keyword:** `lucy_webview`

## Requisitos

- PHP 8.2+, Composer, Node 20+, npm
- Credenciales Omniax en `.env` (no incluidas en el repo)

## Instalación (clonar y correr)

```powershell
git clone <URL_DEL_REPO>
cd formulario_fe_lucy

copy .env.example .env
# Completar GEA_OMNIAX_CLIENT_ID y GEA_OMNIAX_CLIENT_SECRET

composer install
php artisan key:generate
npm install
npm run build
php artisan serve
```

Abrir: `http://localhost:8000/?telefono=0999999999`

**Desarrollo con hot reload:**

```powershell
npm run dev
# otra terminal:
php artisan serve
```

## Verificación

```powershell
curl http://localhost:8000/api/health
php scripts/omniax_probe_gea.php 0979461382 0999999999
node scripts/validate_lucy_graph.mjs
```

## Documentación

| Doc | Contenido |
|-----|-----------|
| [HANDOFF.md](./docs/HANDOFF.md) | Variables, APIs, archivos, pendientes |
| [OMNIAX_MEDICO.md](./docs/OMNIAX_MEDICO.md) | PDF médico/dental |
| [OMNIAX_GEA.md](./docs/OMNIAX_GEA.md) | PDF GEA chatbot |
| [FLOW_MAP.md](./docs/FLOW_MAP.md) | Mapa de nodos |
| [SETUP.md](./docs/SETUP.md) | Laragon / Windows |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Capas |

## Stack

Laravel 12, Vue 3, Vite, Tailwind — SPA en `/` (`ChatView.vue`).

## Licencia

Uso interno GEA Ecuador.
