# Eidon Smart — landing

Sitio estático (HTML/CSS/JS, sin framework) para Eidon Smart. Reemplaza la versión anterior, que seguía casi al pie de la letra el molde genérico de "agencia de IA" (hero + 3 servicios + calculadora citando estudios de 2021 + FAQ genérico). Este rediseño usa la estructura del sitio para reforzar la identidad: cada sección es un "nodo" de un pipeline (TRIGGER → ACTION → LOGIC → FILTER → OUTPUT → DEBUG → DEPLOY), con la terminología real de automatización, y sube el único elemento realmente diferencial — el diagrama de flujo en producción — al principio de la página.

## Correr en local

No hay build step. Cualquier servidor estático alcanza:

```bash
npx serve .
# o
python3 -m http.server 8000
```

Abrí `index.html` desde ese servidor (no funciona bien con `file://` directo por el `import` de `config.js` como módulo).

## Estructura

```
index.html               página principal
portafolio.html          casos de estudio
calculadora-tarifa.html  calculadora de tarifa por hora (usa calc.js)
privacidad.html, terminos.html, 404.html
styles.css               todos los estilos
script.js                flujo animado del hero, calculadora, FAQ, contacto
config.js                email, redes y precio de referencia (priceFromUSD)
calc.js                  lógica pura de la calculadora de tarifa
```

## Deploy a Netlify

Es un sitio 100% estático — arrastrar la carpeta a Netlify o conectar el repo funciona sin configuración extra. `netlify.toml` ya tiene el publish dir apuntando a la raíz.

## Números del sitio

Todas las cifras de la home salen de casos reales del portafolio (3 flujos en producción, <60 s del formulario a la alerta, 1–3 semanas de entrega, <24 h de respuesta). El precio de referencia se publica solo cuando `priceFromUSD` en `config.js` deja de ser `null`. Si cambia un número, actualizarlo en `index.html` y `portafolio.html`.

## Pendiente (a propósito, no lo inventé)

- **`portafolio.html`**: tres casos reales documentados (prospección con IA, clasificación de leads, monitoreo y facturas), más equipo, stack y precios. Sumar casos nuevos a medida que se cierren proyectos — no inventar números.
- La calculadora de ROI ya no cita estudios genéricos (Zapier 2021 / McKinsey) como si fueran investigación propia — ahora se presenta explícitamente como una estimación editable.
- Las conversiones de moneda en la calculadora (ARS/COP) son aproximadas, no tipos de cambio en vivo — si hace falta precisión, conectar una API de cotización.
- El formulario de contacto usa **Netlify Forms** (`data-netlify="true"` + submit por fetch en `script.js`). Se activa solo en el próximo deploy — las respuestas van a aparecer en el dashboard de Netlify, en Forms. Si querés notificación por email de cada envío nuevo, se configura ahí mismo (Site settings → Forms → Form notifications), no es algo que se resuelva desde el código.
