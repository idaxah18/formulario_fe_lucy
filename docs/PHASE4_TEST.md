# Fase 4 — Pruebas (IA + cierre webview)

## Nuevo en esta fase

| Área | Detalle |
|------|---------|
| **Chat IA** | `POST /api/v1/lucy/ia/bootstrap`, `POST /api/v1/lucy/ia/message` |
| **Prompts** | `resources/prompts/lucy-ia/*.txt` (dental, hogar, vial, agendar, reagendar, router) |
| **Modo guiado** | Sin `LUCY_IA_API_KEY` → respuestas locales + hint |
| **Modo LLM** | Con API key → OpenAI-compatible `chat/completions` |
| **Flujos IA** | `dental_ia`, `hogar_ia`, `vial_ia`, `agendar_cita_ia`, `reagendar_cita_ia` |
| **IA Router** | `?flow=ia` → `ia_router`; Datum términos tabla `2756` |
| **Webview bridge** | `postMessage` `jelou:webview:close` + botón **WhatsApp** en header |

## Variables `.env`

```env
LUCY_IA_API_KEY=sk-...
LUCY_IA_BASE_URL=https://api.openai.com/v1
LUCY_IA_MODEL=gpt-4o-mini
JELOU_API_TOKEN=          # para Datum IA Router
```

## Pruebas manuales

1. **IA Dental** — 24/7 → Dental → Dental IA → escribe mensaje → respuesta (guiada o LLM).
2. **Menú guiado** — En IA, botón **Usar menú guiado** → flujo Omniax clásico.
3. **Cerrar webview** — Botón **WhatsApp** o **Volver a WhatsApp**; en DevTools ver `postMessage` al parent.
4. **IA Router** — `http://localhost:8000/?telefono=0999999999&flow=ia` → registro / términos Datum.
5. **Hogar / Vial IA** — mismos patrones desde menús 2.3 / 2.4.

## Jelou (skill WhatsApp)

En el skill que abre la webview, escuchar:

```javascript
window.addEventListener('message', (e) => {
  if (e.data?.type === 'jelou:webview:close') {
    // cerrar webview y enviar mensaje de despedida al usuario
  }
});
```

## Limitaciones (paridad Jelou)

- Los agentes IA de Jelou usan **tools** (ubicación, Omniax, end_function JSON); aquí es conversación + enlace a menú guiado.
- Para paridad 1:1 hace falta replicar function-calling o mantener IA solo en WhatsApp (híbrido).

## Probe

```powershell
curl -s http://localhost:8000/api/v1/lucy/ia/profiles
node scripts/validate_lucy_graph.mjs
npm run build
```
