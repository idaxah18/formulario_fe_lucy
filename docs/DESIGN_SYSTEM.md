# Design system — GEA / Lucy

Basado en el manual de colores gradientes y tipografías proporcionado.

## Tipografía

| Uso | Familia CSS | Tailwind | Archivo esperado |
|-----|-------------|----------|------------------|
| **Fuente Solución** (títulos, botones) | `Gotham Rounded` | `font-solution` | `public/fonts/GothamRounded-Bold.woff2` |
| **“Lo hacemos fácil”** / cuerpo | `Gotham` | `font-tagline` / `font-sans` | `public/fonts/Gotham-Regular.woff2` |

Coloca los `.woff2` con licencia GEA en `public/fonts/`. Sin archivos, el navegador usará la fallback sans de Tailwind.

## Colores sólidos

| Token | Hex | Tailwind |
|-------|-----|----------|
| Navy | `#202246` | `lucy-navy` |
| Índigo | `#292c5d` | `lucy-indigo` |
| Azul | `#1b5a9e` | `lucy-blue` |
| Bosque | `#174225` | `lucy-forest` |
| Verde | `#136733` | `lucy-green` |
| Oliva | `#7d9533` | `lucy-olive` |
| Burdeos | `#9c1c2d` | `lucy-burgundy` |
| Naranja | `#e2682f` | `lucy-orange` |

## Gradientes

| Nombre | CSS | Uso sugerido |
|--------|-----|----------------|
| Azul | `#202246 → #292c5d → #1b5a9e` | Header principal, CTA primario |
| Verde | `#174225 → #136733 → #7d9533` | Asistencia en curso / ubicación |
| Cálido | `#9c1c2d → #e2682f` | Encuestas, alertas suaves |

Clases Tailwind: `bg-gradient-lucy-blue`, `bg-gradient-lucy-green`, `bg-gradient-lucy-warm`.

Variables CSS en `resources/css/tokens.css`.

## Componentes base

- `AppHeader` — barra superior con gradiente por ruta (`meta.gradient`)
- `LucyButton` — primary / secondary
- `LucyInput` — label, hint, error
- Utilidades: `.lucy-page`, `.lucy-card`, `.lucy-btn-primary`

## Meta de ruta (Vue Router)

```js
meta: {
  title: 'Placa vehicular',
  gradient: 'blue', // blue | green | warm
}
```
