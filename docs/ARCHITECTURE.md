# Arquitectura — Lucy Ecuador Webview

## Objetivo

Reemplazar la **interacción visual de WhatsApp** por una **aplicación web embebida (webview)** manteniendo la lógica de negocio en Jelou/GEA. Laravel entrega el shell y APIs; Vue renderiza las pantallas.

## Stack

| Capa | Tecnología | Rol |
|------|------------|-----|
| Backend | Laravel 11 | Rutas web, API interna, sesión, proxy a servicios |
| Frontend | Vue 3 + Vue Router | Pantallas del flujo (SPA) |
| Build | Vite + laravel-vite-plugin | Assets en `public/build` |
| Estilos | Tailwind CSS 3 | UI + tokens de marca GEA |
| HTTP cliente | Axios | Llamadas a `/api` (futuro) |

## Flujo de una petición

```text
Navegador / Webview Jelou
    → GET /aseguradora/placa
    → Laravel WebviewController → resources/views/app.blade.php
    → Vite carga resources/js/app.js
    → Vue Router carga `ChatView.vue` (interfaz tipo WhatsApp: burbujas + botones + composer)
```

Todas las rutas de UI usan **history mode** en Vue. Laravel captura cualquier path con `routes/web.php` y devuelve el mismo Blade (`/{any?}`).

## Estructura de carpetas

```text
formulario_fe_lucy/
├── app/
│   ├── Http/Controllers/     # WebviewController + APIs por dominio (futuro)
│   └── Providers/
├── config/                   # app, services (jelou.*)
├── docs/                     # Documentación
├── public/                   # index.php, fonts/, build/
├── resources/
│   ├── css/                  # app.css, tokens, fonts
│   ├── js/
│   │   ├── components/ui/    # Botones, inputs, header
│   │   ├── layouts/          # WebviewLayout
│   │   ├── modules/          # Pantallas por dominio de negocio
│   │   │   ├── aseguradora/  # ASAP / placa, ubicación, siniestros…
│   │   │   ├── asistencias/  # Solución 24/7 (futuro)
│   │   │   └── shared/       # Home, encuestas, errores
│   │   └── router/
│   └── views/app.blade.php   # Shell HTML único
└── routes/
    ├── web.php               # SPA fallback
    └── api.php               # JSON para la webview
```

## Convención de módulos Vue

Cada **módulo** = un área del bot Lucy:

- `modules/aseguradora/views/` — flujos del canal **Lucy Ecuador Aseguradora**
- `modules/asistencias/views/` — menú Solución 24/7, dental, médico, etc.
- `modules/shared/views/` — encuestas, mantenimiento, not found

**Toda la experiencia es un chat web responsive** (máx. ~448px centrado en desktop, pantalla completa en móvil). Cada paso del flujo Jelou se modela como mensajes del bot, respuestas del usuario, botones rápidos o ubicación — no como formularios en páginas separadas. Los flujos viven en `resources/js/flows/*.js`.

## Integración Jelou (próximos pasos)

1. Variables en `.env`: `JELOU_PROJECT_ID`, token/API.
2. Servicios en `app/Services/Jelou/` para no acoplar controladores.
3. La webview envía eventos equivalentes a los nodos INPUT/LOCATION del bot.

**No modificar flujos en Jelou** desde este repo hasta definir el contrato API/webhook.

## Design system

Ver [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## Desarrollo local

Ver [SETUP.md](./SETUP.md).
