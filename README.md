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
Maqueta de la página de inicio (React + TypeScript + Vite) con **datos ficticios**: lista y filtro de animales, ficha con composición racial, reproducción y estrategia, gráfico de peso, genealogía, descendencia, sanidad y avisos. Permite añadir pesos, tratamientos, partos y estrategias (se guardan en el navegador). Las demás secciones están en preparación.

## Ejecutar en local
```bash
npm install
npm run dev
```

## Nota sobre datos
El repositorio no debe contener datos reales de la explotación. Las demos usarán datos ficticios.
