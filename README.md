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
Fase inicial: definición de requisitos y modelo de datos. Aún sin código.

## Nota sobre datos
El repositorio no debe contener datos reales de la explotación. Las demos usarán datos ficticios.
