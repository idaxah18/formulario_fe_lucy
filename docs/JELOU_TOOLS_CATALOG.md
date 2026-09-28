# Catálogo tools — Lucy Ecuador (Jelou)

**Proyecto (brain):** `01j5661e5gaf6330435zh3bzjx` — **Lucy Ecuador** (117 skills).

**Catálogo org:** 98 tools (scopes SHARED + PURCHASED, perfil `gea-ecuador`). Los workflows del bot invocan subconjuntos de esta lista.

> **Seguridad:** los valores reales de API keys viven en Jelou Secrets / `.env` del VPS, **no** en este repo.

## Resumen por credencial

| Credencial (webview `.env` o Jelou) | Tools típicas |
|-------------------------------------|---------------|
| `GEA_OMNIAX_CLIENT_ID` + `GEA_OMNIAX_CLIENT_SECRET` → Bearer | Auth 1946, Auth Gea 8505, y ~70 tools GEA/Omniax |
| `GEA_LOPDP_API_KEY` (header api-key) | Aceptacion LOPDP 2620 |
| `GEA_JELOU_FUNCTION_USER` + `PASSWORD` | Asistencia en Curso 2678 |
| `JELOU_API_TOKEN` | Datum (Create/Update/Consulta términos) |
| `JELOU_PAY_BEARER` + `JELOU_PAY_APP_ID` | Jelou Pay (links, pasarelas) |
| Jelou plataforma (Speech, Vision, Email, Set Flow) | PURCHASED/FORKED utilities |
| GiftPoint / Integrations marketplace | Secrets en Jelou Developers |

## Listado completo

| ID | Tool | Qué hace (resumen) | API / destino | API key / credencial |
|----|------|-------------------|---------------|----------------------|
| 333 | Speech to text | Transcripci├│n de voz a texto. | Jelou Speech-to-text (plataforma) | Suscripción Jelou / OpenAI en Jelou |
| 1440 | Set Flow Parameters | Redireccionar a un flujo junto con parametros adicionales de un bot | Jelou Jobs / routing interno | Config Jelou plataforma |
| 1442 | Set Flow Later | L a herramienta recibir├í como input un campo llamado client_sercret, client_id, tambi├®n un campo llamado onSuccessFlow | Jelou Jobs / routing interno | Config Jelou plataforma |
| 1497 | ECU: Datos biogr├íficos + biom├®tricos | Esta herramienta recibe como input la cedula y el codigo dactilar y devuelve la informaci├│n proporcionada por el regist | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 1498 | Lip Sync | Crerar un tool que a partir del siguiente curl: curl --request POST \ --url https://integrations.jelou.ai/api/v1/integra | Jelou Integrations marketplace | Token integración en Jelou (no webview) |
| 1501 | Get SocketId | Te muestra el socketId de tu usuario | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 1812 | Dev - Auth | Tool para iniciar sesi├│n y usar servicios de GEA | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 1930 | Jelou Pay: Pago con link | Jelou Pay: Pago con link | Jelou Pay (payments.jelou.ai) | JELOU_PAY_BEARER + JELOU_PAY_APP_ID |
| 1931 | [Pay] Crear link de pago para tarjetas | Genera un link de pago para tarjetas de cr├®dito. Utilizar con tool Obtener pasarelas de pago antes se llamaba [Pay] Jel | Jelou Pay (payments.jelou.ai) | JELOU_PAY_BEARER + JELOU_PAY_APP_ID |
| 1932 | Jelou Pay: Obtener Pasarelas de Pagos | Obtener Pasarelas de Pagos de desarrollo o produccion | Jelou Pay (payments.jelou.ai) | JELOU_PAY_BEARER + JELOU_PAY_APP_ID |
| 1935 | Jelou Pay: Pago en un click | Jelou Pay: Pago en un click | Jelou Pay (payments.jelou.ai) | JELOU_PAY_BEARER + JELOU_PAY_APP_ID |
| 1940 | Dev - Crear Afiliaci├│n | Tool para crear afiliaci├│n en Omniax | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 1942 | Create Datum Record | Guardar registro en Datum y retornar el ID | Jelou Datum API (api.jelou.ai) | JELOU_API_TOKEN (Jelou Developers) |
| 1943 | Update Datum Record | Actualiza un registro en Datum de acuerdo al ID | Jelou Datum API (api.jelou.ai) | JELOU_API_TOKEN (Jelou Developers) |
| 1946 | Auth | Tool para iniciar sesi├│n y usar servicios de GEA 3c4e9e | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 1947 | Crear Afiliaci├│n | Tool para crear afiliaci├│n en Omniax | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2005 | Jelou Cedula Ecuatoriana | Solo se requiere los 10 digitos de la cedula | Validación local Jelou (algoritmo cédula) | Ninguna (lógica en tool) |
| 2006 | Consultar Registros Datum | Crear un tool donde se mande 3 inputs, botId, clientId, clientSecret. Luego crear inputs que no sean obligatorios, llama | Jelou Datum API (api.jelou.ai) | JELOU_API_TOKEN (Jelou Developers) |
| 2094 | Aceptaci├│n LOPD | Tool para registrar la aceptaci├│n de la Ley de Protecci├│n de Datos. | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 2599 | Asistencia Chatbot GEA | Quiero consumir un servicio API POST https://api.geainternacional.com/{pais}/v1/chatbot/asistencias/gea estas son las va | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2600 | Proveedor Contacto Confirmar | Generame un consumo API POST https://api.geainternacional.com/{pais}/v1/chatbot/asistencia/{id_asistencia}/contacto Vari | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2601 | Proveedor T├®rmino Confirmar | Generame un consumo API https://api.geainternacional.com/{pais}/v1/chatbot/asistencia/{id_asistencia}/termino Variables  | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2602 | Historial Asistencia Terceros | Generame un consumo API POST https://api.geainternacional.com/{pais}/v1/asistencias/listado/chatbot-telefono Variables D | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2603 | Asistencia Cancelar | Generame un consumo API PUT https://api.geainternacional.com/{pais}/v1/asistencias/{id_asistencia}/cancelar Variables Di | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2604 | Asistencia Ubicaci├│n | Generame una API Consumo PUT https://api.geainternacional.com/{pais}/v1/asistencias/{id_asistencia}/ubicacion Variables  | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2605 | Asistencias En Proceso | Generame un consumo API POST https://api.geainternacional.com/{pais}/v1/chatbot/asistencias/en-proceso. Variables Din├ím | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2606 | HSM - Env├¡o solo texto | Realizar un tool que envie el siguiente curl: curl --request POST \ --url https://api.jelou.ai/v2/whatsapp/{botId}/hsm \ | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 2607 | Get Data HSM | Generame un consumo API GET https://api.jelou.ai/v1/bots/{_botId}/notifications/{gsId} con credenciales de username y pa | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 2608 | Get Hsm State | Generamre una api consumo POST https://api.jelou.ai/v1/companies/{_companyId}/store/show con un parametro key de body en | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 2620 | Aceptacion LOPDP | Genermae una API POST https://api.geainternacional.com/aceptar-terminos Variables Din├ímicas: Las variables din├ímicas e | GEA LOPDP POST …/aceptar-terminos | GEA_LOPDP_API_KEY (header api-key; Jelou Secret tool 2620) |
| 2678 | Asistencia en Curso | Consumir un API POST https://functions.jelou.ai/gea-lucy/asistenciasEnCurso en las que va a tener variables input o dina | Jelou Function gea-lucy/asistenciasEnCurso | GEA_JELOU_FUNCTION_USER + GEA_JELOU_FUNCTION_PASSWORD (Jelou Secrets) |
| 2743 | Consulta Provincias | Generame un onsumo api GET https://api.geainternacional.com/ec/v1/division-territorial/estado-provincia-departamento con | Jelou Vision (OpenAI) | API key en Jelou marketplace |
| 2744 | Consulta Ciudades Por Provincia | Generame un consumo api GET https://api.geainternacional.com/ec/v1/division-territorial/{id_provincia}/subdivisiones con | Jelou Vision (OpenAI) | API key en Jelou marketplace |
| 2746 | Consulta Placa | Se hara un consumo api GET https://api.geainternacional.com/ec/v1/afiliaciones/busqueda con body con key placa, y header | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2747 | Consulta Placa Siniestro | Se hara un consumo api GET https://api.geainternacional.com/ec/v1/chatbot/reporte-siniestro/afiliacion con body con key  | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2751 | Inspecci├│n Riesgo Buscar Aseguradora | quier consumir esta API POST https://api.geainternacional.com/ec/v1/chatbot/inspeccion-riesgo/buscar-aseguradora con inp | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2752 | Asistencia Reagendar | Generame consumo API POST https://api.geainternacional.com/{{$input.pais}}/v1/asistencias/reagendar con parametros de en | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2757 | Lista Parentesco | Generme consumo GET de este servicio https://api.geainternacional.com/ec/v1/chatbot/opciones-parentesco trendra 3 parame | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2758 | Reporte Siniestro Colisi├│n | generame un consumo POST de https://api.geainternacional.com/ec/v1/chatbot/reporte-siniestro/colision los datos input so | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 2773 | [Utility] Dynamic Email | Tool para realizar env├¡o de Email a usuario  | Jelou Utility Email | Config Jelou |
| 3098 | Reporte Siniestro Robo Parcial | Reporte Siniestro Robo Parcial | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3111 | Reporte Inspecci├│n Riesgo C├│digo | Reporte Inspecci├│n Riesgo C├│digo  | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3129 | Reporte Siniestro Robo Total | Reporte Siniestro Robo Total | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3139 | [EXACT] Speech to text | Transcripcion exacta de voz a texto. | Jelou Speech-to-text (plataforma) | Suscripción Jelou / OpenAI en Jelou |
| 3423 | Contador V4 | Contador V4 | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3579 | contador de caracteres | contador de caracteres | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3581 | Contador V4 | Contador V4 | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3594 | Menu Oculto Asistencia Valida | Menu Oculto Asistencia Valida  | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3596 | Menu Oculto Contacto | Menu Oculto Contacto | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3602 | Menu Oculto Asistencia Termino | Menu Oculto Asistencia Termino | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3605 | Menu Oculto Asistencia Subir Fotos V2 | Menu Oculto Asistencia Subir Fotos V2 | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3805 | [Pay] Crear link de pago para tarjetas | Genera un link de pago para tarjetas de cr├®dito. Utilizar con tool Obtener pasarelas de pago antes se llamaba [Pay] Jel | Jelou Pay (payments.jelou.ai) | JELOU_PAY_BEARER + JELOU_PAY_APP_ID |
| 3813 | iaresponse | va almacenar las variables de las asistencias que toma de la IA | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3822 | [Utility] Jelou Vision | Este tool env├¡a un prompt para analizar el contenido de una imagen | Jelou Vision (OpenAI) | API key en Jelou marketplace |
| 3829 | Asistencias en proceso new | Este servicio se consume luego de escoger la opci├│n del servicio dental o m├®dico. Del mismo modo tambi├®n cuando se de | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3830 | Especialidades MEDICO | Este servicio se consume en la pregunta correspondiente a la selecci├│n de la especialidad | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3836 | Aplica asignaci├│n de establecimiento | Este servicio se consume tras la recopilaci├│n de los datos del titular | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3837 | Listado de establecimientos por proximidad / zona / prioridad | Este servicio se consume en la pregunta correspondiente a la selecci├│n del establecimiento. | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3838 | Listado de zonas por ciudad | Listado de zonas por ciudad | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3839 | Fechas disponibles del establecimiento | Este servicio se consume cuando el afiliado escoge un establecimiento en el flujo m├®dico. Devuelve el listado de d├¡as  | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3840 | Horas disponibles del establecimiento | Este servicio se consume cuando el afiliado escoge una fecha del establecimiento en el flujo. Devuelve el listado de hor | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3841 | Creaci├│n de asistencia | Este servicio se consume al finalizar el flujo de asistencia m├®dica o dental. | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 3843 | Reagendar cita | Este servicio se consume al finalizar el flujo de reagendar cita. | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4188 | Aplica asignaci├│n IA | Tool que procesara todos los 12 servicios que contiene crear asistencia | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4189 | Servicio ciudades y Zona | Servicio ciudades y Zona | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4190 | fecha y hora disponibilidad IA | fecha y hora disponibilidad IA | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4237 | formato placa | formato placa | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4291 | Tool generar citas medicas | Tool generar citas medicas | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4303 | Validacion cedula | Validacion cedula | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4544 | B├║squeda Ventas Empaquetadas | Servicio que me permite consultar las ventas empaquetadas de un cliente | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4747 | Consulta t├®rminos en datum | Consulta t├®rminos en datum | Jelou Datum API (api.jelou.ai) | JELOU_API_TOKEN (Jelou Developers) |
| 4818 | instrucciones datos iniciales | analizara el mensaje inicial y omitir├í procesos de acuerdo al an├ílisis | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4834 | ubicaciones agendamiento | ubicaciones del men├║ de agendamiento | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4939 | Ciudades fase 2 | Ciudades fase 2 | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 4958 | direcciones fase 2 | direcciones fase 2 | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5547 | prueba ubicaci├│n | prueba ubicaci├│n | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5585 | Verifica C├│digo VIP | Servicio para validar la disponibilidad de un c├│digo VIP | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5587 | Actualizaci├│n C├│digo VIP | Servicio para actualizar el estado de un c├│digo VIP | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5744 | Obtener Afiliacion | [Vial - Hogar] Obtener Afiliacion para proceso automatico (Servicio 1 - 2) | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5781 | Verificacion de cobertura | [Vial - Hogar] Verificacion de cobertura para proceso automatico | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5782 | crear asistencia vial - hogar | [Vial - Hogar] Creacion de asistencia proceso automatico (Servicio 5) | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5784 | [Vial - Hogar] Verificacion de coordenadas | Verificacion de coordenadas  | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5785 | validaci├│n cobertura | validaci├│n cobertura | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5795 | [Hogar IA]  Obtener afiliacion | Obtener Afiliacion para proceso automatico (Servicio 1) | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5796 | hogar cobertura | hogar cobertura | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5819 | Verificacion de coordenadas | Verificacion de coordenadas (Servicio 6) | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5831 | Get Chat History | Obtiene el historial del chat | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 5837 | T├®rminos y Condiciones Datum | Tool para consulta o aceptaci├│n para los t├®rminos y condiciones en datum | Jelou Datum API (api.jelou.ai) | JELOU_API_TOKEN (Jelou Developers) |
| 5885 | Get Lista Especialidades | Servicio para obtener la lista de especialidades para agendamiento de citas | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 6224 | Notificar Cabina Asistencia en Proceso | (sin descripción en catálogo) | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 6324 | buscar auto por marca | (sin descripción en catálogo) | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 6388 | Fuera de Horario | (sin descripción en catálogo) | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 6718 | Enviar nodo lista | Env├¡o de mensajes tipo lista. | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 6865 | Validaci├│n de horario programado | Verificaci├│n de horario propuesto a programar. | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 6923 | Validaci├│n horario inferior - actual | Verificaci├│n de que la fecha ingresada sea inferior o igual a la actual. | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
| 7568 | Auth GiftPoint | Servicio de autenticaci├│n de GiftPoint | GiftPoint (vía tool Auth GiftPoint) | Credencial en Jelou Secrets (no en webview .env) |
| 8505 | Auth Gea | Autenticaci├│n GEA | GEA Omniax (api.geainternacional.com) | Bearer: GEA_OMNIAX_CLIENT_ID + GEA_OMNIAX_CLIENT_SECRET (tools Auth 1946 / Auth Gea 8505) |
| 8507 | Confirmar Recordatorio Cita | Servicio para confirmar el recordatorio de cita | GEA Omniax u otro (revisar tool en Jelou) | GEA_OMNIAX_* o ver workflow tool |
