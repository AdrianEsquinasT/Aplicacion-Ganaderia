# Modelo de datos

Ver `src/types.ts` (definición) y `src/logic.ts` (cálculos derivados).

## Principio: una sola fuente de verdad
| Dato | Dónde se guarda | Cómo se obtiene lo demás |
|---|---|---|
| Padre y madre | Solo en el animal hijo (`sire`, `dam`) | Descendencia, abuelos y árbol se **calculan** |
| Parto | `Parto.calfId` apunta al ternero | Madre, padre, sexo, fecha y crotal se leen del ternero |
| Peso | Un `Pesaje` por medición (con tipo: nacimiento / destete / control) | Peso actual = último pesaje; gráfica y ganancia se calculan |
| Estado reproductivo | Resultado del último `Ciclo` | Gestante / vacía / pendiente / seca |
| Nº de partos | Se cuentan los partos | + `partosPrevios` para los anteriores a usar la app |
| Composición racial | `breed` declarada o `compositionManual` | Si hay padre y madre, se calcula como media de los progenitores |
| Baja | Registro `Baja` (el animal no se borra) | El animal sigue en genealogía e historial |

## Entidades
`Animal`, `Semental` (catálogo), `Ciclo` (CIDR, retirada, prostaglandina, inseminación o monta natural,
diagnóstico, aborto), `Parto`, `Pesaje`, `Sanidad`, `Lote`, `Baja`, `Photo`, `Config`.

El padre es una referencia `{kind: 'animal' | 'semental', id}`: puede ser un toro de la explotación
o un semental del catálogo de inseminación.

## Qué se calcula (no se guarda)
- Categoría (ternero / novilla / vaca / toro) a partir de edad, sexo y partos.
- Fecha prevista de parto: fecha de inseminación + días de gestación (configurable, 280 por defecto).
- Índices internos del animal (0-10). **No son valores genéticos oficiales**; las fórmulas son una
  propuesta pendiente de revisar con la ganadera.
- Avisos: partos próximos, vacunas, desparasitaciones, revisiones, tratamientos, incidencias,
  vacas sin gestar, decisiones de reposición o descarte.
- Estadísticas. Definición de la tasa de partos: de las cubriciones con resultado conocido
  (parto, aborto o vacía), el porcentaje que terminó en parto.

## Persistencia
IndexedDB del navegador (un almacén por entidad, escritura solo de lo que cambia).
Copia de seguridad y restauración en JSON desde Configuración.
