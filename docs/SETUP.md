# Instalación y desarrollo

## Requisitos

- **PHP** 8.2+ con extensiones: `openssl`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`
- **Composer** 2.x
- **Node.js** 20+ y **npm**

En Windows con **Laragon** (recomendado en este equipo):

- PHP: `C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe`
- Composer: `C:\laragon\bin\composer\composer.phar`
- En Cursor ya está el PATH de PHP en `.vscode/settings.json` para la terminal integrada.

**Importante:** en `php.ini` debe estar habilitado `extension=zip` para que `composer install` funcione (Laragon suele traerlo comentado).

Alternativa sin Laragon:

```powershell
winget install PHP.PHP.8.3
winget install Composer.Composer
```

## Pasos

```powershell
cd C:\Users\alvarezdx\Documents\CURSOR\formulario_fe_lucy

copy .env.example .env
composer install
php artisan key:generate

npm install
```

## Desarrollo (dos terminales)

**Terminal 1 — Vite**

```powershell
npm run dev
```

**Terminal 2 — Laravel**

```powershell
php artisan serve
```

Abre: http://localhost:8000

## Rutas demo incluidas

| URL | Pantalla |
|-----|----------|
| `/` | Home con enlaces demo |
| `/aseguradora/placa` | Ingreso de placa (PDF conversación) |
| `/aseguradora/ubicacion` | Geolocalización |
| `/encuesta/nps` | Encuesta 0–10 |

## Producción

```powershell
npm run build
php artisan config:cache
php artisan route:cache
```

Servir `public/` con nginx/Apache apuntando al `index.php` de Laravel.

## Fuentes Gotham

Copiar archivos a `public/fonts/` (ver DESIGN_SYSTEM.md).
