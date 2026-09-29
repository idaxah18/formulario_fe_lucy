# Deep links — webview Lucy (Jelou → WhatsApp)

Tras **auth** (teléfono, cédula, nombre, LOPDP), la URL puede indicar el destino con `intent`.

## URL de ejemplo (nodo webview en Jelou)

```text
{{lucy_webview_base_url}}/?embedded=1&telefono={{$memory.telefono_webview}}&intent=medico_agendar
```

| Parámetro | Uso |
|-----------|-----|
| `embedded=1` | Marca webview embebida |
| `telefono` | Celular Ecuador `09xxxxxxxx` (salta input de teléfono) |
| `intent` | Slug del flujo (tabla abajo) |

## Comportamiento

1. **Sin asistencias en curso:** tras auth → nodo del `intent` (o `menu_solucion_24_7` si no hay intent).
2. **Con asistencias en curso:** hub «Tienes asistencias en curso» + paginación; el botón inferior es **Continuar con …** según el intent (en flujo normal sigue **Menú principal**).
3. **Intent inválido:** se ignora; flujo normal + aviso en consola del navegador.

## Slugs soportados

| `intent` | Botón en hub (ejemplo) | Destino |
|----------|------------------------|---------|
| `medico` | Continuar con Médico | `menu_medico` |
| `medico_agendar` | Continuar con cita médica | elegibilidad Omniax médico |
| `medico_reagendar` | Continuar con reagendar cita médica | reagendar médico |
| `dental` | Continuar con Dental | `menu_dental` |
| `dental_agendar` | Continuar con cita dental | elegibilidad Omniax dental |
| `dental_reagendar` | Continuar con reagendar cita dental | reagendar dental |
| `hogar` | Continuar con Hogar | `menu_hogar` |
| `vial` | Continuar con Vial | `menu_vial` |
| `grua` / `gruas` | Continuar con Grúas | inicio servicio Grúa (GEA) |
| `aseguradora` | Continuar con Vial aseguradora | `menu_aseguradora` |
| `agendar_cita` | Continuar con agendar cita | elegir médico/dental |
| `solucion_24_7` | Continuar con Solución 24/7 | menú 24/7 |

Alias comunes: `gruas`→`grua`, `cita_medica`→`medico_agendar`, `agendar_medico`→`medico_agendar`, etc. (ver `webviewIntent.js`).

## Código

Registro: `resources/js/flows/lucy/webviewIntent.js`

Cierre webview (sin cambios): `jelou:webview:close` en `webviewBridge.js`.
