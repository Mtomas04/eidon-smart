# Eidon Smart — landing

Sitio estático (HTML/CSS/JS, sin framework ni build) para Eidon Smart. Diseño oscuro cálido con el naranja de la marca como único acento (sistema Nocturne de Claude Design adaptado), tipografía Bricolage Grotesque, hero 3D con three.js y la demo de pedidos y stock en video.

## Correr en local

No hay build step. Cualquier servidor estático alcanza:

```bash
npx serve .
# o
python3 -m http.server 8000
```

Abrí `index.html` desde ese servidor (Netlify Forms y los headers solo funcionan en producción).

## Estructura

```
index.html               página principal
portafolio.html          casos reales + demo
calculadora-tarifa.html  calculadora de tarifa por hora (tarifa.js)
privacidad.html          privacidad + cookies (actualizar si se suma un proveedor o una cookie)
terminos.html            términos del servicio, devoluciones, baja, encargo de datos
arrepentimiento.html     Botón de arrepentimiento y de baja (Disposición 954/2025) + tramite.js
gracias.html, 404.html
styles.css               todos los estilos (tokens de color arriba de todo)
site.js                  común a todas las páginas: aparición al scrollear, tarjetas 3D, barra de progreso, CTA flotante
app.js                   solo home: demo de leads, calculadora de ahorro, planes, contacto (Netlify Forms)
hero3d.js                escena 3D del hero (three.js)
vendor/three.module.min.js   three.js r170, alojado acá para no sumar un CDN a la CSP
vendor/phosphor/         íconos Phosphor recortados a los que se usan
assets/fonts/            fuentes propias (sin Google Fonts: nada de IP a terceros)
assets/demo/             video y portada de la demo de pedidos y stock (datos inventados)
```

Todo se sirve desde el propio dominio: no hay CDNs ni Google Fonts, así la CSP de `netlify.toml` queda en `'self'` y la promesa de privacidad sigue siendo cierta. Si sumás un ícono, recortá la fuente de nuevo:

```bash
pyftsubset Phosphor.woff2 --unicodes="U+e03a,..." --flavor=woff2 --output-file=Phosphor.woff2
```

(los códigos son los `content: "\e…"` de `vendor/phosphor/style.css`; partí de la fuente completa de unpkg).

## Deploy a Netlify

Es un sitio 100% estático — arrastrar la carpeta a Netlify o conectar el repo funciona sin configuración extra. `netlify.toml` ya tiene el publish dir apuntando a la raíz.

## Números del sitio

Todas las cifras de la home salen de casos reales del portafolio (3 flujos en producción, <60 s del formulario a la alerta, 1–3 semanas de entrega, <24 h de respuesta). Si cambia un número, actualizarlo en `index.html` y `portafolio.html`.

## Pendiente (a propósito, no lo inventé)

- **`portafolio.html`**: tres casos reales documentados (prospección con IA, clasificación de leads, monitoreo y facturas), más equipo, stack y precios. Sumar casos nuevos a medida que se cierren proyectos — no inventar números.
- La calculadora de ROI ya no cita estudios genéricos (Zapier 2021 / McKinsey) como si fueran investigación propia — ahora se presenta explícitamente como una estimación editable.
- Las conversiones de moneda en la calculadora (ARS/COP) son aproximadas, no tipos de cambio en vivo — si hace falta precisión, conectar una API de cotización.
- El formulario de contacto usa **Netlify Forms** (`data-netlify="true"` + submit por fetch en `app.js`). Se activa solo en el próximo deploy — las respuestas van a aparecer en el dashboard de Netlify, en Forms. Si querés notificación por email de cada envío nuevo, se configura ahí mismo (Site settings → Forms → Form notifications), no es algo que se resuelva desde el código.

## Legales: qué no romper

- Los links "Botón de arrepentimiento" y "Botón de baja de servicio" tienen que estar visibles en todas las páginas (franja superior + footer). Son obligatorios.
- Cada solicitud del formulario `tramite` hay que responderla por email con su código dentro de las 24 h.
- Si se agrega un servicio externo (script, IA, CRM, cookie), actualizar `privacidad.html` y la CSP de `netlify.toml` en el mismo PR.
