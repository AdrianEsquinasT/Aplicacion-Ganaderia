# Arquitectura (borrador)

## Decisión: PWA offline-first en lugar de app nativa
- Instalación en iPhone con "Añadir a pantalla de inicio" desde Safari; sin firma ni App Store.
- Sideloading nativo con Apple ID gratuito: la app caduca a los 7 días y requiere refrescar con un ordenador (a verificar en developer.apple.com). Con cuenta de pago (~99 $/año) dura 1 año.
- Si más adelante hace falta Bluetooth, cámara avanzada o notificaciones fiables, se valorará envolver la misma base web con Capacitor.

## Stack
- TypeScript, React o Svelte, Vite, `vite-plugin-pwa`.
- Datos locales: IndexedDB con Dexie.js.
- Gráficos: Recharts o Chart.js. Estilos: Tailwind CSS.
- Hosting estático gratuito (GitHub Pages o Cloudflare Pages). Dominio propio opcional (~10 €/año).
- Sin servidor obligatorio. Copia de seguridad/sincronización opcional (Supabase/Firebase gratuito o exportación JSON/CSV).

## Riesgos conocidos de PWA en iOS (a probar en iPhone real)
- Safari puede borrar datos de webs sin uso en 7 días; las PWA instaladas en pantalla de inicio están exentas según web.dev, pero hay fuentes que lo matizan.
- Los datos de Safari y de la PWA instalada están separados: registrar siempre desde la PWA instalada.
- Las peticiones de almacenamiento persistente no son fiables en iOS.
- Mitigación: exportación/copia de seguridad periódica obligatoria.

## Portfolio
- Repo privado por ahora; puede hacerse público (revisar antes el historial: sin datos reales ni claves).
- Demo pública con datos ficticios, capturas y README.

## Pendiente
- Definir entidades y modelo de datos (animales, razas, partos, sanidad, pesos, ventas...).
- Definir pantallas y dashboard.

## Diseño responsive
- Unidades relativas (`rem`, `fr`, `%`, `clamp()`): el tamaño base del texto escala con la pantalla y con
  el tamaño de letra que el usuario tenga configurado. Iconos, fotos y gráficos también escalan.
- Las filas del panel se reparten solas (`flex-wrap`, `auto-fit`) y las cajas de una misma fila miden lo mismo.
- Consultas de contenedor (`@container`): cada bloque se adapta al espacio que tiene, no al ancho de la ventana.
- Un único cambio de modo por media query en `em` (menú lateral en ordenador, barra inferior en móvil).
