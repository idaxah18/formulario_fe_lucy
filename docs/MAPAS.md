# Keyword: `mapas`

Decisión pendiente de ubicación con mapa (pin + búsqueda) vs solo GPS. Ver notas completas en el handoff del equipo.

**Resumen:** preferir **Mapbox** (GL JS + Search/Geocoding) frente a Google por coste; validar cobertura Ecuador en QA.

**Bloqueante para sizing:** logs de ejecuciones mensuales del bot (map loads, geocoding/search) antes de contratar tier.

**Estado:** no implementado en webview; flujo actual usa `navigator.geolocation` en `ChatView.vue`.
