# Eidon Smart — landing

Sitio estático (HTML/CSS/JS, sin framework) para Eidon Smart. Reemplaza la
versión anterior, que seguía casi al pie de la letra el molde genérico de
"agencia de IA" (hero + 3 servicios + calculadora citando estudios de 2021 +
FAQ genérico). Este rediseño usa la estructura del sitio para reforzar la
identidad: cada sección es un "nodo" de un pipeline (TRIGGER → ACTION →
LOGIC → FILTER → OUTPUT → DEBUG → DEPLOY), con la terminología real de
automatización, y sube el único elemento realmente diferencial — el diagrama
de flujo en producción — al principio de la página.

## Correr en local

No hay build step. Cualquier servidor estático alcanza:

```bash
npx serve .
# o
python3 -m http.server 8000
```

Abrí `index.html` desde ese servidor (no funciona bien con `file://` directo
por el `import` de `config.js` como módulo).

## Estructura

```
index.html        página principal
portafolio.html    casos de estudio
styles.css         todos los estilos
script.js          calculadora, FAQ, inyección de contacto
config.js          UN SOLO lugar con el email de contacto y los links sociales
```

## Deploy a Netlify

Es un sitio 100% estático — arrastrar la carpeta a Netlify o conectar el
repo funciona sin configuración extra. `netlify.toml` ya tiene el publish
dir apuntando a la raíz.

## Pendiente (a propósito, no lo inventé)

- **`config.js`**: tiene dos TODO — actualizar el email a `contacto@eidonsmart.com`
  y la URL del sitio cuando el dominio propio esté activo.
- **`portafolio.html`**: solo tiene un caso real documentado (el de
  clasificación de leads, que también aparece en el home). Los otros dos
  slots están marcados como placeholder a propósito — hay un comentario en
  el HTML con instrucciones de qué completar. No agregué métricas ni
  clientes inventados: eso hubiera sido peor que dejarlo vacío.
- La calculadora de ROI ya no cita estudios genéricos (Zapier 2021 /
  McKinsey) como si fueran investigación propia — ahora se presenta
  explícitamente como una estimación editable.
- Las conversiones de moneda en la calculadora (ARS/COP) son aproximadas,
  no tipos de cambio en vivo — si hace falta precisión, conectar una API de
  cotización.
