# Mapa de interacciones — Lucy Ecuador (webview chat)

Simulación **sin integraciones API**. Navegación por burbujas, botones y texto igual que WhatsApp.

**Proyecto Jelou:** `01j5661e5gaf6330435zh3bzjx` · **117 skills** mapeados en el motor (`resources/js/flows/lucy/`).

## URLs de prueba

| URL | Uso |
|-----|-----|
| `/` | Flujo completo desde identificación |
| `/?flow=aseguradora` | Tras cédula/nombre → menú **Aseguradora ASAP** |
| `/?flow=hsm` | Entrada directa al **simulador HSM** |

Comandos globales en el chat: `Menú principal`, `Empezar`.

---

## 1. Autenticación y troncal

| Paso | Tipo interacción | Skill Jelou |
|------|------------------|-------------|
| Cédula (10 dígitos) | Texto | Proteccion datos cedula |
| Nombre | Texto | Proteccion datos nombre |
| ¿Asistencia en curso? | Botones Sí/No | Truncal-inicio |
| Listado / reagendar / cancelar | Botones | Asistencias en curso, reagendar asistencia, Cancelar asistencia |

---

## 2. Selector de línea de negocio

| Opción | Destino |
|--------|---------|
| Solución 24/7 | Menú dental / médico / hogar / vial… |
| Aseguradora ASAP | Menú vial aseguradora + siniestros |
| Asistencias VIP | 3 - Asistencias VIP - Inicio |
| Servicios Protección | 4 - Servicios Protección - Inicio |
| IA Router | Registro / Sin registro |
| Simulador HSM (QA) | Catálogo de plantillas |
| Utilidades | Mantenimiento, errores, dev, comercial |

---

## 3. Solución 24/7 (`2. Servicios Solución 24/7`)

### 3.1 Dental (`2.1 Dental`)

- Agendar cita → tipo dental/médica → wizard fecha/ciudad (`2.1.1 Agendar cita`)
- Reagendar (`2.1.2 Reagendar cita`)
- Dental IA

### 3.2 Médico (`2.2 Médico`)

- Ambulancia, médico a domicilio → **ubicación + dirección** (V2 crear asistencia)
- Orientación médica telefónica
- Agendar / reagendar cita médica
- Bienestar y nutrición
- E-doctor → ver §6

### 3.3 Hogar (`2.3 Hogar`)

Servicios con cadena ubicación → dirección → confirmación:

Plomero, Electricista, Cerrajero, Vidriería, Limpieza y mantenimiento, Spa y peluquería, Handyman.

### 3.4 Vial (`2.4 Vial`)

Grúa, Cambio de llanta, Suministro gasolina, Paso de corriente, Cerrajería puertas, Inspector in situ, Asistencia legal, Vial IA.

### 3.5 Otras y soporte

- Otras soluciones (`2.5` → `Otras soluciones 2`)
- Reportar problema (texto libre)
- Ver más opciones → info / comprar / blog

### 3.6 Ver más opciones (`2.7`)

- Info asistencia → servicio contratado (hogar/vial/médico/dental/otras) / solicitar factura
- Comprar asistencia → Venta asistencias (contratar / asesor / llamar)
- Blog Solución 24/7

---

## 4. Aseguradora (`V2 Aseguradora - Inicio`)

| Servicio | Interacciones |
|----------|----------------|
| Grúa, llanta, gasolina, paso corriente, cerrajería | Placa → ubicación → dirección → confirmación |
| Asistencia legal | Placa → confirmación |
| Inspección vehicular | Confirmación simulada |
| Reportar siniestro | Menú siniestro |

### Siniestros (`Siniestro`)

- Colisión → tipo lugar → fotos/documentos (texto) → biometría
- Robo total / robo parcial / postergar

---

## 5. Productos comerciales

| Flujo | Pasos simulados |
|-------|-----------------|
| Activar e-doctor | Plan / info → registro → pago → confirmación |
| Compra y viaja seguro | Inicio → pago → confirmación |
| Asistencia inmediata | Inicio → pago → confirmación |
| Pycca cuidado familiar | Contratar / llamada |
| Banco Bolivariano | Comprar online / agendar llamada |
| Jaher | Inicio |
| Información productos | Consulta simulada |

---

## 6. Utilidades y operación

| Skill | En chat |
|-------|---------|
| Mantenimiento | Mensaje mantenimiento |
| Error General | Error simulado |
| Expiracion / Adios | Reinicio |
| Desvincular | Confirmación |
| PMA / PMA Retención | Simulación |
| Derivación a asesor | Desde ventas |
| Menú oculto proveedores | Contacto / término / fotos |
| Dev Gea / pruebas Lucy / PMA equipo | QA interno |

---

## 7. HSM (plantillas WhatsApp)

Acceso: **Simulador HSM (QA)** o `/?flow=hsm`.

Categorías:

1. **Agendamiento** — confirmar cita, HSM dental/hogar/médico/vial, recordatorios  
2. **Encuestas y regalos** — obsequio bienvenida, DirectTV, suero, Disney, TyC gift cards, encuestas  
3. **E-Doctor** — app / web  
4. **Operaciones** — derivación calidad, no contacto, notificaciones proveedor  
5. **Otros** — QR Banco Machala  

Cada ítem: mensaje HSM + botones **Sí / No / Empezar** (simulación).

---

## 8. Skills Jelou — cobertura en webview

| Categoría | Cantidad aprox. | Cobertura webview |
|-----------|-----------------|-------------------|
| Menús y subflujos operativos | ~45 | Navegación completa con stubs |
| Crear asistencia (ubicación) | ~25 variantes | Cadena ubicación + dirección |
| HSM / notificaciones | ~35 | Simulador por categoría |
| IA (agendar/reagendar/hogar/vial/dental) | 5 | Nodo “IA” con mensaje simulado |
| Brain / proveedor / recordatorios | ~7 | Incluidos en HSM o utilidades |

Skills solo backend sin UI propia (ej. `asistencia ubicación`, `Agendar cita` monolítico) se representan dentro de **V2 Crear asistencia** o wizards de cita.

---

## 9. Tipos de interacción UI (webview)

| Tipo WhatsApp | Componente Vue |
|---------------|----------------|
| Mensaje bot | `ChatBubble` (izquierda) |
| Mensaje usuario | `ChatBubble` (derecha) |
| Botones / lista | `ChatQuickActions` |
| Texto libre | `ChatComposer` |
| Ubicación | Botón → `navigator.geolocation` |
| Pago / foto / API | Texto simulado + mensaje de confirmación |

---

## 10. Mantenimiento del mapa

- Grafo: `resources/js/flows/lucy/lucyFlowGraph.js` (~198 nodos)
- Motor: `resources/js/flows/lucy/lucyChatEngine.js`
- Catálogo HSM: `resources/js/flows/lucy/hsmCatalog.js`

Al agregar un skill nuevo en Jelou: crear nodo con `jelou: 'Nombre skill'`, enlazar con `actions` o `input`, y documentar aquí.
