// DATOS FICTICIOS: solo para la maqueta. No usar datos reales en el repositorio.

export type Category = 'Vaca' | 'Toro' | 'Novilla' | 'Ternero'

export interface Animal {
  id: string
  num: string // número de identificación interno
  name: string
  sex: 'F' | 'M'
  category: Category
  crotal: string
  birth: string // YYYY-MM-DD
  condition: number // condición corporal 1-5
  lot: string
  score: number // índice interno /10
  statusTag: string // etiqueta de estado mostrada en la lista
  tags: string[]
  breed: { name: string; pct: number }[]
  weights: { date: string; kg: number }[]
  health: { date: string; text: string }[]
  repro?: { lastIA: string; semen: string; diag: string; nextBirth: string; state: string }
  strategy?: { title: string; steps: { label: string; date: string; done: boolean }[] }
  sire: string
  dam: string
  sireParents: [string, string]
  damParents: [string, string]
  offspring: { name: string; sex: 'Macho' | 'Hembra'; birth: string }[]
}

export const herdStats = { vacas: 102, toros: 6, novillas: 18, terneros: 85, tasaPartos: 92 }

export const initialAnimals: Animal[] = [
  {
    id: 'v125',
    num: '125',
    name: 'Morena',
    sex: 'F',
    category: 'Vaca',
    crotal: 'ES123456789012',
    birth: '2021-03-12',
    condition: 3,
    lot: 'Lote 1',
    score: 8.4,
    statusTag: 'Gestante',
    tags: ['Reproductora', 'Gestante'],
    breed: [{ name: 'Limusina', pct: 100 }],
    weights: [
      { date: '2021-12-15', kg: 470 },
      { date: '2022-06-15', kg: 500 },
      { date: '2023-01-15', kg: 535 },
      { date: '2023-09-15', kg: 580 },
      { date: '2026-09-15', kg: 620 },
    ],
    health: [
      { date: '2026-04-15', text: 'Vacunación IBR-BVD' },
      { date: '2026-03-10', text: 'Desparasitación interna' },
      { date: '2025-12-20', text: 'Tratamiento respiratorio' },
      { date: '2025-11-05', text: 'Revisión general' },
    ],
    repro: {
      lastIA: '2026-04-20',
      semen: 'Rumba (Cat. Sementales)',
      diag: '2026-05-05',
      nextBirth: '2027-01-25',
      state: 'Gestante',
    },
    strategy: {
      title: 'Estrategia reproductiva (Ciclo 2026)',
      steps: [
        { label: 'CIDR', date: '2026-04-10', done: true },
        { label: 'Retirada', date: '2026-04-18', done: true },
        { label: 'PG', date: '2026-04-18', done: true },
        { label: 'IA', date: '2026-04-20', done: true },
        { label: 'Diag.', date: '2026-05-05', done: false },
      ],
    },
    sire: 'Toro Catálogo Rumba',
    dam: 'Vaca 103 (Limusina)',
    sireParents: ['Toro Catálogo Rumba', 'Vaca 103 (Limusina)'],
    damParents: ['Toro Catálogo Forro', 'Vaca 087 (100 % Limusina)'],
    offspring: [
      { name: 'Ternero 251', sex: 'Macho', birth: '2026-02-12' },
      { name: 'Ternera 248', sex: 'Hembra', birth: '2026-02-10' },
      { name: 'Ternero 243', sex: 'Macho', birth: '2026-01-05' },
    ],
  },
  {
    id: 'v087',
    num: '087',
    name: 'Lulú',
    sex: 'F',
    category: 'Vaca',
    crotal: 'ES123456789087',
    birth: '2019-04-02',
    condition: 3,
    lot: 'Lote 1',
    score: 7.9,
    statusTag: 'Reproductora',
    tags: ['Reproductora'],
    breed: [{ name: 'Limusina', pct: 100 }],
    weights: [
      { date: '2024-09-01', kg: 560 },
      { date: '2025-09-01', kg: 575 },
      { date: '2026-09-01', kg: 590 },
    ],
    health: [{ date: '2026-04-15', text: 'Vacunación IBR-BVD' }],
    repro: { lastIA: '—', semen: '—', diag: '—', nextBirth: '—', state: 'Reproductora' },
    sire: 'Toro Catálogo Forro',
    dam: 'Vaca 051',
    sireParents: ['—', '—'],
    damParents: ['—', '—'],
    offspring: [{ name: 'Vaca 125 – Morena', sex: 'Hembra', birth: '2021-03-12' }],
  },
  {
    id: 't034',
    num: '034',
    name: 'Toro 034',
    sex: 'M',
    category: 'Toro',
    crotal: 'ES123456789034',
    birth: '2020-05-20',
    condition: 4,
    lot: 'Lote 3',
    score: 8.9,
    statusTag: 'En servicio',
    tags: ['Semental', 'En servicio'],
    breed: [{ name: 'Limusina', pct: 100 }],
    weights: [
      { date: '2024-09-01', kg: 1050 },
      { date: '2025-09-01', kg: 1080 },
      { date: '2026-09-01', kg: 1100 },
    ],
    health: [{ date: '2026-03-10', text: 'Desparasitación interna' }],
    sire: 'Toro Catálogo X',
    dam: 'Vaca 011',
    sireParents: ['—', '—'],
    damParents: ['—', '—'],
    offspring: [],
  },
  {
    id: 'v142',
    num: '142',
    name: 'Rubia',
    sex: 'F',
    category: 'Vaca',
    crotal: 'ES123456789142',
    birth: '2020-02-14',
    condition: 3,
    lot: 'Lote 2',
    score: 7.2,
    statusTag: 'Vacía',
    tags: ['Reproductora', 'Vacía'],
    breed: [
      { name: 'Limusina', pct: 75 },
      { name: 'Rubia Gallega', pct: 25 },
    ],
    weights: [
      { date: '2024-09-01', kg: 590 },
      { date: '2025-09-01', kg: 600 },
      { date: '2026-09-01', kg: 605 },
    ],
    health: [{ date: '2026-03-10', text: 'Desparasitación interna' }],
    repro: { lastIA: '—', semen: '—', diag: '—', nextBirth: '—', state: 'Vacía' },
    sire: '—',
    dam: '—',
    sireParents: ['—', '—'],
    damParents: ['—', '—'],
    offspring: [],
  },
  {
    id: 'c251',
    num: '251',
    name: 'Ternero 251',
    sex: 'M',
    category: 'Ternero',
    crotal: 'ES123456789251',
    birth: '2026-02-12',
    condition: 3,
    lot: 'Cebo',
    score: 7.6,
    statusTag: 'Destete',
    tags: ['Ternero', 'Destete'],
    breed: [{ name: 'Limusina', pct: 100 }],
    weights: [
      { date: '2026-03-12', kg: 90 },
      { date: '2026-06-12', kg: 190 },
      { date: '2026-09-12', kg: 312 },
    ],
    health: [{ date: '2026-04-15', text: 'Vacunación IBR-BVD' }],
    sire: 'Toro Catálogo Rumba',
    dam: 'Vaca 125 – Morena',
    sireParents: ['—', '—'],
    damParents: ['—', '—'],
    offspring: [],
  },
]

export const avisos = [
  { icon: 'calendar', text: '5 partos próximos (enero-febrero)' },
  { icon: 'syringe', text: '2 vacunas pendientes' },
  { icon: 'drops', text: '3 desparasitaciones pendientes' },
]
