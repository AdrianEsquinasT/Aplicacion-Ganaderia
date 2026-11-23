<p align="center"><img src="public/logo.svg" alt="Logotipo de Mi Ganadería" width="120" /></p>

# Aplicación Ganadería

Aplicación privada para la gestión visual de una explotación ganadera: registro de animales (vacas, toros, terneros), razas, y panel con gráficos y dashboard, en vez de una base de datos "fría".

## Objetivos
- Uso personal de una única usuaria (la ganadera); sin registro de usuarios ni venta.
- Funcionar **sin cobertura** en el campo (offline-first) y sincronizar o respaldar cuando haya conexión.
- Instalable en iPhone sin pasar por la App Store.
- Interfaz visual: dashboard, gráficos y fichas de animales.

## Stack previsto
TypeScript · React (o Svelte) + Vite · PWA (`vite-plugin-pwa`) · IndexedDB (Dexie) · Recharts/Chart.js · Tailwind CSS.

Detalles y decisiones en [`docs/arquitectura.md`](docs/arquitectura.md).

## Estado
Aplicación funcional con **datos ficticios** de ejemplo. Incluye: resumen de la ganadería, animales (fichas, edición, fotos, bajas, lotes),
reproducción (estrategia CIDR → retirada → prostaglandina → inseminación → diagnóstico en línea temporal, historial de ciclos,
monta natural como excepción), partos que crean el ternero y lo enlazan con madre y padre, catálogo de sementales,
genealogía dinámica con descendencia, pesajes con gráfica, producción, sanidad con avisos, estadísticas y copia de seguridad.
Incluye praderas y ubicaciones (ficha con datos generales, valoración del pasto y control de aprovechamiento), movimientos de animales con historial,
calendario de pastoreo, tiempo de descanso, carga orientativa y avisos.
Los datos se guardan en el propio dispositivo (IndexedDB).

Pendiente: mapa de la explotación con límites SIGPAC, integración con collares GPS, instalación como PWA y funcionamiento sin conexión (service worker), pruebas en iPhone real y revisión de fórmulas con la ganadera.

## Imágenes de ejemplo
Los animales y sementales de ejemplo llevan ilustraciones originales de perfil (20 en `public/demo/animales/`),
generadas con `python3 scripts/ilustraciones.py`. No son fotografías ni proceden de terceros, así que no hay problemas
de licencia. Las fotos reales de la ganadera se suben desde la propia aplicación y se guardan en el dispositivo.

## Ejecutar en local
```bash
npm install
npm run dev
```

## Nota sobre datos
El repositorio no debe contener datos reales de la explotación. Las demos usarán datos ficticios.
