# Prueba webview — WhatsApp → Laravel local

**Proyecto Jelou:** `01j5661e5gaf6330435zh3bzjx` (Lucy Ecuador)  
**Skill nuevo (no modifica los 117 skills existentes):** `prueba_webview`  
**Skill ID:** `51025` · **Workflow ID:** `70197`  
**Studio:** [Abrir skill prueba_webview](https://apps.jelou.ai/studio/01j5661e5gaf6330435zh3bzjx/skills/51025)

Código del workflow (solo este archivo): `jelou/lucy-prueba-webview/workflows/prueba-webview.whatsapp.json`

---

## 1. Cómo probar el vocablo en WhatsApp

1. Publica el draft del skill (ver §4).
2. En el chat con Lucy escribe: **`prueba_webview`** (o frases como “probar webview lucy”).
3. El **IA Router** debe enrutar al skill `prueba_webview` (la descripción del skill incluye esa palabra).
4. El bot abre la **webview** con tu URL pública + `?embedded=1&telefono=…` (si WhatsApp aún expone `$user.id` como MSISDN; si no, la webview pide el celular en el primer paso).

Verificar routing sin WhatsApp:

```powershell
jelou workflow evaluate --project-id 01j5661e5gaf6330435zh3bzjx --message "prueba_webview" --agent
```

---

## 2. Exponer Laravel en local (sin servidor propio)

WhatsApp/Jelou **no pueden** abrir `http://127.0.0.1:8000` en tu PC. Necesitas un **túnel HTTPS** hacia tu máquina.

### A. Levantar la app

```powershell
cd C:\Users\alvarezdx\Documents\CURSOR\formulario_fe_lucy
composer install
cp .env.example .env   # si aún no existe
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

En otra terminal (Vite si usas `npm run dev`):

```powershell
npm install
npm run dev
```

Prueba en el navegador: `http://127.0.0.1:8000`

### B. Túnel recomendado — Cloudflare Tunnel (gratis)

1. Instala [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Ejecuta:

```powershell
cloudflared tunnel --url http://127.0.0.1:8000
```

3. Copia la URL `https://….trycloudflare.com` que imprime la consola.

### C. Alternativa — ngrok

```powershell
ngrok http 8000
```

Usa la URL `https://….ngrok-free.app`.

### D. Configurar la URL en Jelou

En el workflow `prueba_webview`, nodo **URL pública webview** (`MEMORY`), variable:

`lucy_webview_base_url` → tu URL del túnel **sin** barra final.

Ejemplo: `https://abc123.trycloudflare.com`

O edita el JSON local y haz `jelou push` (§4).

---

## 3. Teléfono en webview (cambio reciente en código)

| Capa | Comportamiento |
|------|----------------|
| **Vue** | Paso **Teléfono** al inicio; `sessionStorage` (`lucy_prueba_telefono`) hasta cerrar la pestaña; hidrata `context.telefono` al cargar. |
| **API Laravel** | Ya **no** rellena `0999999999` si falta teléfono en rutas GEA tools / cabina (responde **422**). |
| **Query Jelou** | `?telefono=09…&embedded=1` — si viene vacío, el usuario lo ingresa en la webview. |

---

## 4. Publicar cambios del skill (solo `prueba_webview`)

```powershell
cd C:\Users\alvarezdx\Documents\CURSOR\formulario_fe_lucy\jelou\lucy-prueba-webview
jelou workflow validate --file workflows/prueba-webview.whatsapp.json
jelou push --workflow prueba-webview --agent
```

Opcional publicar a producción del brain (cuando GEA lo apruebe):

```powershell
jelou project publish --project-id 01j5661e5gaf6330435zh3bzjx --workflow prueba-webview --yes
```

---

## 5. Cierre webview → WhatsApp

La webview envía `postMessage` `jelou:webview:close` (ver `docs/PHASE4_TEST.md`). El skill `prueba_webview` espera el callback en la rama **exit** del nodo webview.

---

## 6. Limitaciones

- El túnel debe estar **encendido** cada vez que pruebes desde WhatsApp.
- Sin túnel, solo puedes probar en navegador: `http://127.0.0.1:8000/?telefono=09XXXXXXXX`.
- Meta/BSUID: si `$user.id` ya no es el celular, deja `telefono_webview` vacío en la URL y usa el campo de teléfono de la webview.
