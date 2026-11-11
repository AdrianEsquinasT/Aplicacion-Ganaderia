// DATOS FICTICIOS para probar la aplicación. No son datos reales de ninguna explotación.
import type { Animal, Baja, Ciclo, Facilidad, Lote, Parto, Pesaje, Sanidad, Semental, State, TipoParto } from './types'

const L = {
  repro: 'l-repro', secas: 'l-secas', gest: 'l-gest', nov: 'l-nov', toros: 'l-toros',
  terneros: 'l-terneros', repos: 'l-repos', cebo: 'l-cebo', venta: 'l-venta',
}

export function makeSeed(): State {
  const lotes: Lote[] = [
    { id: L.repro, name: 'Vacas reproductoras' },
    { id: L.secas, name: 'Vacas secas' },
    { id: L.gest, name: 'Vacas gestantes' },
    { id: L.nov, name: 'Novillas' },
    { id: L.toros, name: 'Toros' },
    { id: L.terneros, name: 'Terneros' },
    { id: L.repos, name: 'Reposición' },
    { id: L.cebo, name: 'Cebo' },
    { id: L.venta, name: 'Venta' },
  ]

  const sementales: Semental[] = [
    { id: 's-rumba', name: 'Rumba', officialId: 'CAT-LIM-0001', breed: 'Limusina', procedencia: 'Catálogo de sementales (ejemplo)', caracteristicas: 'Facilidad de parto alta, buen crecimiento', genetica: 'Datos del catálogo (ficticios)', sireName: 'Semental A (ejemplo)', damName: 'Vaca A (ejemplo)' },
    { id: 's-forro', name: 'Forro', officialId: 'CAT-LIM-0002', breed: 'Limusina', procedencia: 'Catálogo de sementales (ejemplo)', caracteristicas: 'Buena conformación cárnica', genetica: 'Datos del catálogo (ficticios)' },
    { id: 's-galan', name: 'Galán', officialId: 'CAT-LIM-0003', breed: 'Limusina', procedencia: 'Catálogo de sementales (ejemplo)', caracteristicas: 'Temperamento tranquilo, aptitud materna', genetica: 'Datos del catálogo (ficticios)' },
  ]

  const base = { breed: 'Limusina', explotacion: 'Mi Ganadería' }
  const animals: Animal[] = [
    { ...base, id: 'a-v051', crotal: 'ES123456789051', num: '051', name: 'Gitana', sex: 'F', birth: '2010-02-01', partosPrevios: 6 },
    { ...base, id: 'a-t041', crotal: 'ES123456789041', num: '041', name: 'Cierzo', sex: 'M', birth: '2014-03-10', entryDate: '2015-06-01' },
    { ...base, id: 'a-v087', crotal: 'ES123456789087', num: '087', name: 'Lulú', sex: 'F', birth: '2016-04-02', sire: { kind: 'animal', id: 'a-t041' }, dam: 'a-v051', loteId: L.gest, condition: 3 },
    { ...base, id: 'a-t034', crotal: 'ES123456789034', num: '034', name: 'Centurión', sex: 'M', birth: '2018-05-20', entryDate: '2019-09-01', sire: { kind: 'semental', id: 's-forro' }, loteId: L.toros, condition: 4, manejabilidad: 7 },
    { ...base, id: 'a-v125', crotal: 'ES123456789012', num: '125', officialId: 'ES123456789012', name: 'Morena', sex: 'F', birth: '2021-03-12', sire: { kind: 'animal', id: 'a-t034' }, dam: 'a-v087', loteId: L.gest, condition: 3, manejabilidad: 8 },
    { ...base, id: 'a-bravo', crotal: 'ES123456789301', num: '301', name: 'Bravo', sex: 'M', birth: '2024-02-09', sire: { kind: 'semental', id: 's-rumba' }, dam: 'a-v125', destino: 'Venta' },
    { ...base, id: 'a-luna', crotal: 'ES123456789312', num: '312', name: 'Luna', sex: 'F', birth: '2025-02-14', sire: { kind: 'semental', id: 's-forro' }, dam: 'a-v125', destino: 'Reposición', loteId: L.nov, condition: 3 },
    { ...base, id: 'a-trueno', crotal: 'ES123456789320', num: '320', name: 'Trueno', sex: 'M', birth: '2026-02-18', sire: { kind: 'semental', id: 's-rumba' }, dam: 'a-v125', destino: 'Venta', loteId: L.terneros, condition: 3 },
    { ...base, id: 'a-v142', crotal: 'ES123456789142', num: '142', name: 'Rubia', sex: 'F', birth: '2019-02-14', sire: { kind: 'semental', id: 's-galan' }, dam: 'a-v098', loteId: L.repro, partosPrevios: 2, condition: 3 },
    { ...base, id: 'a-capitan', crotal: 'ES123456789305', num: '305', name: 'Capitán', sex: 'M', birth: '2025-03-10', sire: { kind: 'semental', id: 's-rumba' }, dam: 'a-v142', destino: 'Venta', loteId: L.cebo },
    { ...base, id: 'a-v133', crotal: 'ES123456789133', num: '133', name: 'Canela', sex: 'F', birth: '2018-06-01', sire: { kind: 'semental', id: 's-galan' }, loteId: L.gest, partosPrevios: 2, condition: 3 },
    { ...base, id: 'a-perla', crotal: 'ES123456789330', num: '330', name: 'Perla', sex: 'F', birth: '2026-01-05', sire: { kind: 'semental', id: 's-galan' }, dam: 'a-v133', loteId: L.terneros },
    { ...base, id: 'a-v098', crotal: 'ES123456789098', num: '098', name: 'Nube', sex: 'F', birth: '2015-03-03', sire: { kind: 'semental', id: 's-forro' }, loteId: L.secas, partosPrevios: 6, seca: true, condition: 2 },
    { ...base, id: 'a-pinto', crotal: 'ES123456789222', num: '222', name: 'Pinto', sex: 'M', birth: '2022-03-05', sire: { kind: 'semental', id: 's-rumba' }, dam: 'a-v087' },
    { ...base, id: 'a-gala', crotal: 'ES123456789233', num: '233', name: 'Gala', sex: 'F', birth: '2023-03-08', sire: { kind: 'semental', id: 's-galan' }, dam: 'a-v087' },
    { ...base, id: 'a-estrella', crotal: 'ES123456789118', num: '118', name: 'Estrella', sex: 'F', birth: '2024-03-12', sire: { kind: 'semental', id: 's-forro' }, dam: 'a-v087', destino: 'Reposición', loteId: L.nov, condition: 3 },
  ]

  const cria = (calfId: string, tipo: TipoParto, facilidad: Facilidad, cicloId?: string): Parto => ({ id: 'p-' + calfId, calfId, tipo, facilidad, cicloId, estadoMadre: 'Buena', estadoCria: 'Vivo' })
  const partos: Parto[] = [
    cria('a-v142', 'Normal', 'Normal'),
    cria('a-v125', 'Normal', 'Fácil'),
    cria('a-pinto', 'Normal', 'Normal'),
    cria('a-gala', 'Normal', 'Fácil'),
    cria('a-estrella', 'Asistido', 'Difícil'),
    cria('a-bravo', 'Normal', 'Fácil', 'c-m23'),
    cria('a-luna', 'Normal', 'Normal', 'c-m24'),
    cria('a-trueno', 'Normal', 'Fácil', 'c-m25'),
    cria('a-capitan', 'Asistido', 'Difícil'),
    cria('a-perla', 'Normal', 'Fácil', 'c-c25'),
  ]

  const ia = (fecha: string, sementalId: string, hora?: string) => ({ fecha, hora, sementalId, tipoSemen: 'Convencional' })
  const ciclos: Ciclo[] = [
    { id: 'c-m23', vacaId: 'a-v125', label: 'Ciclo 2023', metodo: 'Inseminación artificial', cidr: { fecha: '2023-04-25' }, retirada: { fecha: '2023-05-03' }, pg: { fecha: '2023-05-03' }, ia: ia('2023-05-05', 's-rumba', '09:30'), diag: { fecha: '2023-06-10', resultado: 'Gestante', metodo: 'Ecografía' }, partoId: 'p-a-bravo' },
    { id: 'c-m24', vacaId: 'a-v125', label: 'Ciclo 2024', metodo: 'Inseminación artificial', cidr: { fecha: '2024-05-02' }, retirada: { fecha: '2024-05-10' }, pg: { fecha: '2024-05-10' }, ia: ia('2024-05-12', 's-forro', '10:00'), diag: { fecha: '2024-06-14', resultado: 'Gestante', metodo: 'Ecografía' }, partoId: 'p-a-luna' },
    { id: 'c-m25', vacaId: 'a-v125', label: 'Ciclo 2025', metodo: 'Inseminación artificial', cidr: { fecha: '2025-05-03' }, retirada: { fecha: '2025-05-11' }, pg: { fecha: '2025-05-11' }, ia: ia('2025-05-13', 's-rumba', '09:00'), diag: { fecha: '2025-06-16', resultado: 'Gestante', metodo: 'Ecografía' }, partoId: 'p-a-trueno' },
    { id: 'c-m26', vacaId: 'a-v125', label: 'Ciclo 2026', metodo: 'Inseminación artificial', cidr: { fecha: '2026-04-10' }, retirada: { fecha: '2026-04-18' }, pg: { fecha: '2026-04-18' }, ia: ia('2026-04-20', 's-rumba', '09:30'), diag: { fecha: '2026-05-05', resultado: 'Gestante', metodo: 'Ecografía' } },
    { id: 'c-r26', vacaId: 'a-v142', label: 'Ciclo 2026', metodo: 'Inseminación artificial', cidr: { fecha: '2026-04-25' }, retirada: { fecha: '2026-05-03' }, pg: { fecha: '2026-05-03' }, ia: ia('2026-05-05', 's-galan'), diag: { fecha: '2026-06-08', resultado: 'Vacía', metodo: 'Ecografía' } },
    { id: 'c-r26b', vacaId: 'a-v142', label: 'Ciclo 2026 (monta natural)', metodo: 'Monta natural', monta: { toroId: 'a-t034', entrada: '2026-09-20', salida: '2026-11-01', obs: 'No quedó gestante con IA' } },
    { id: 'c-087', vacaId: 'a-v087', label: 'Ciclo 2026', metodo: 'Inseminación artificial', cidr: { fecha: '2026-05-04' }, retirada: { fecha: '2026-05-12' }, pg: { fecha: '2026-05-12' }, ia: ia('2026-05-14', 's-galan'), diag: { fecha: '2026-06-17', resultado: 'Gestante', metodo: 'Ecografía' } },
    { id: 'c-c25', vacaId: 'a-v133', label: 'Ciclo 2025', metodo: 'Inseminación artificial', ia: ia('2025-03-31', 's-galan'), diag: { fecha: '2025-05-05', resultado: 'Gestante' }, partoId: 'p-a-perla' },
    { id: 'c-c26', vacaId: 'a-v133', label: 'Ciclo 2026', metodo: 'Inseminación artificial', cidr: { fecha: '2026-03-14' }, retirada: { fecha: '2026-03-22' }, pg: { fecha: '2026-03-22' }, ia: ia('2026-03-24', 's-galan'), diag: { fecha: '2026-05-02', resultado: 'Gestante', metodo: 'Ecografía' } },
  ]

  let k = 0
  const pe = (animalId: string, fecha: string, kg: number, tipo: Pesaje['tipo'] = 'control'): Pesaje => ({ id: 'w' + ++k, animalId, fecha, kg, tipo })
  const pesajes: Pesaje[] = [
    pe('a-v125', '2021-03-12', 38, 'nacimiento'), pe('a-v125', '2021-10-10', 235, 'destete'), pe('a-v125', '2022-03-12', 410), pe('a-v125', '2023-03-10', 520), pe('a-v125', '2024-03-15', 565), pe('a-v125', '2025-03-12', 590), pe('a-v125', '2025-09-15', 605), pe('a-v125', '2026-03-12', 612), pe('a-v125', '2026-09-15', 620),
    pe('a-bravo', '2024-02-09', 44, 'nacimiento'), pe('a-bravo', '2024-09-10', 280, 'destete'), pe('a-bravo', '2025-02-01', 430),
    pe('a-luna', '2025-02-14', 39, 'nacimiento'), pe('a-luna', '2025-09-12', 255, 'destete'), pe('a-luna', '2026-03-10', 380), pe('a-luna', '2026-09-12', 470),
    pe('a-trueno', '2026-02-18', 42, 'nacimiento'), pe('a-trueno', '2026-06-12', 150), pe('a-trueno', '2026-09-12', 268, 'destete'),
    pe('a-v142', '2019-02-14', 40, 'nacimiento'), pe('a-v142', '2019-09-20', 250, 'destete'), pe('a-v142', '2024-09-01', 585), pe('a-v142', '2025-09-01', 600), pe('a-v142', '2026-09-01', 605),
    pe('a-capitan', '2025-03-10', 45, 'nacimiento'), pe('a-capitan', '2025-10-08', 285, 'destete'), pe('a-capitan', '2026-09-10', 520),
    pe('a-v133', '2026-09-01', 600), pe('a-perla', '2026-01-05', 40, 'nacimiento'), pe('a-perla', '2026-08-03', 250, 'destete'),
    pe('a-v098', '2026-09-01', 575), pe('a-t034', '2024-09-01', 1050), pe('a-t034', '2025-09-01', 1080), pe('a-t034', '2026-09-01', 1100),
    pe('a-estrella', '2024-03-12', 41, 'nacimiento'), pe('a-estrella', '2024-10-08', 262, 'destete'), pe('a-estrella', '2025-03-12', 380), pe('a-estrella', '2025-06-20', 425), pe('a-estrella', '2025-09-15', 470), pe('a-estrella', '2026-01-10', 515), pe('a-estrella', '2026-09-15', 560),
    pe('a-pinto', '2022-03-05', 43, 'nacimiento'), pe('a-pinto', '2022-10-05', 275, 'destete'), pe('a-gala', '2023-03-08', 40, 'nacimiento'), pe('a-gala', '2023-10-04', 248, 'destete'),
    pe('a-v087', '2025-09-01', 575), pe('a-v087', '2026-09-01', 590),
  ]

  let j = 0
  const sa = (animalId: string, fecha: string, tipo: Sanidad['tipo'], o: Partial<Sanidad> = {}): Sanidad => ({ id: 'h' + ++j, animalId, fecha, tipo, ...o })
  const sanidad: Sanidad[] = [
    sa('a-v125', '2026-04-15', 'Vacunación', { producto: 'IBR-BVD', proxima: '2026-11-30' }),
    sa('a-v125', '2026-03-10', 'Desparasitación interna', { proxima: '2026-11-20' }),
    sa('a-v125', '2025-12-20', 'Tratamiento', { producto: 'Antibiótico (ejemplo)', obs: 'Tratamiento respiratorio', duracionDias: 7, veterinario: 'Veterinario (ejemplo)' }),
    sa('a-v125', '2025-11-05', 'Revisión', { obs: 'Revisión general', proxima: '2026-12-01' }),
    sa('a-v142', '2026-04-15', 'Vacunación', { producto: 'IBR-BVD', proxima: '2026-11-30' }),
    sa('a-v133', '2026-04-15', 'Vacunación', { producto: 'IBR-BVD', proxima: '2026-11-30' }),
    sa('a-v087', '2026-04-15', 'Vacunación', { producto: 'IBR-BVD', proxima: '2026-11-30' }),
    sa('a-v098', '2026-11-03', 'Incidencia', { obs: 'Cojera', veterinario: 'Veterinario (ejemplo)' }),
    sa('a-v098', '2026-11-05', 'Tratamiento', { producto: 'Antiinflamatorio (ejemplo)', dosis: '10 ml', duracionDias: 10, obs: 'Cojera' }),
  ]

  const bajas: Baja[] = [
    { id: 'b1', animalId: 'a-v051', fecha: '2020-11-03', motivo: 'Muerte' },
    { id: 'b2', animalId: 'a-t041', fecha: '2021-06-15', motivo: 'Venta', precio: 3200, comprador: 'Comprador (ejemplo)' },
    { id: 'b4', animalId: 'a-pinto', fecha: '2023-02-10', motivo: 'Venta', precio: 1200 },
    { id: 'b5', animalId: 'a-gala', fecha: '2024-03-01', motivo: 'Venta', precio: 1100 },
    { id: 'b3', animalId: 'a-bravo', fecha: '2025-02-20', motivo: 'Venta', precio: 1450 },
  ]

  return {
    animals,
    sementales,
    ciclos,
    partos,
    pesajes,
    sanidad,
    lotes,
    bajas,
    photos: [],
    config: {
      id: 'config',
      nombre: 'Mi Ganadería',
      localizacion: 'Localización por definir',
      breeds: ['Limusina', 'Retinta', 'Charolesa', 'Rubia Gallega', 'Avileña', 'Morucha', 'Pirenaica', 'Parda', 'Otra'],
      razaPorDefecto: 'Limusina',
      gestacionDias: 280,
      diasSinGestar: 120,
      avisoDias: 90,
    },
  }
}
