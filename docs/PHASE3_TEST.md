# Fase 3 — Pruebas (comercial, Datum, Jelou Pay)

## Nuevo en esta fase

| Área | Endpoint Laravel | UI |
|------|------------------|-----|
| Datum — lead venta | `GET /api/v1/jelou/datum/venta/lead?identificacion=` | Comprar asistencia → Contratar |
| Datum — marcar contrato | `POST /api/v1/jelou/datum/venta/contrato` | Tras lead válido |
| Datum — derivación asesor | `POST /api/v1/jelou/datum/derivacion` | Venta / Pycca / derivación |
| Jelou Pay — planes | `GET /api/v1/jelou/pay/plans` | Probe |
| Jelou Pay — enlace | `POST /api/v1/jelou/pay/checkout-link` | E-Doctor, Compra y viaja, Inmediata |

**Cableado chat:** `comercialRunner` + `comEnter` / `comResult` en `lucyChatEngine` y `ChatView`.

## Variables `.env`

```env
JELOU_API_TOKEN=          # Datum v2 (misma credencial que Studio/CLI)
JELOU_PAY_BEARER=         # Bearer payments.jelou.ai (no commitear)
JELOU_PAY_GATEWAY_ID=     # Opcional si el API exige gateway (tool Pay en Jelou)
```

Sin token: venta/derivación responden en **modo simulación**; Pay muestra mensaje 503 con texto guía.

## Pruebas manuales

1. **E-Doctor** — Médico → E-doctor → Adquirir plan → correo → enlace de pago (o aviso de config).
2. **Compra y viaja / Inmediata** — Utilidades → Comercial → producto → enlace.
3. **Venta contratar** — 24/7 → Comprar servicio → Contratar (requiere lead Datum con `accion_ejecutada=CONTRATADO`).
4. **Derivación asesor** — Venta → Chatear con asesor → registro Datum `INTERESADO`.
5. **VIP** — Menú principal → VIP → código → empresa/cargo (verificación Omniax pendiente de proxy tool).

## Probes

```powershell
php scripts/jelou_comercial_probe.php 0979461382
node scripts/validate_lucy_graph.mjs
npm run build
```

## Pendiente (paridad Jelou)

- **Crear Afiliación** post-pago (tool 6822) — Fase 3+ u Omniax proxy.
- **Verifica Código VIP** (tool 5585).
- **Recordatorio cita** (tool Confirmar Recordatorio Cita) — suele entrar por HSM, no menú webview.
- **Pycca / Banco / Jaher** — siguen stub informativo o derivación.

## Siguiente: Fase 4

Ver `docs/PHASE4_TEST.md` (IA + cierre webview).
