import type { BreedShare } from '../types'

const COLORS = ['#b8812f', '#4f7a3a', '#7a5a3a', '#c8a46a', '#3b86c6']

export default function Donut({ breed }: { breed: BreedShare[] }) {
  const r = 46
  const c = 2 * Math.PI * r
  let offset = 0
  const main = breed[0]
  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" width="130" height="130" role="img" aria-label="Composición racial">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e6dcc3" strokeWidth="12" />
        {breed.map((b, k) => {
          const len = (b.pct / 100) * c
          const el = <circle key={b.breed} cx="60" cy="60" r={r} fill="none" stroke={COLORS[k % COLORS.length]} strokeWidth="12" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />
          offset += len
          return el
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="700" fill="#2f3a1c">{Math.round(main.pct)} %</text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#4a4a35">{main.breed}</text>
      </svg>
      {breed.length > 1 && (
        <ul className="legend">
          {breed.map((b, k) => <li key={b.breed}><span style={{ background: COLORS[k % COLORS.length] }} /> {b.breed} {Math.round(b.pct)} %</li>)}
        </ul>
      )}
    </div>
  )
}
