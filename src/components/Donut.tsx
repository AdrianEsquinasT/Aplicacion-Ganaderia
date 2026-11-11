interface Props {
  breed: { name: string; pct: number }[]
}

const COLORS = ['#b8812f', '#4f7a3a', '#7a5a3a', '#c8a46a']

export default function Donut({ breed }: Props) {
  const r = 46
  const c = 2 * Math.PI * r
  let offset = 0
  const main = breed[0]
  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" width="130" height="130" role="img" aria-label="Composición racial">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e6dcc3" strokeWidth="12" />
        {breed.map((b, i) => {
          const len = (b.pct / 100) * c
          const el = (
            <circle
              key={b.name}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          )
          offset += len
          return el
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="700" fill="#2f3a1c">
          {main.pct} %
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#4a4a35">
          {main.name}
        </text>
      </svg>
      {breed.length > 1 && (
        <ul className="legend">
          {breed.map((b, i) => (
            <li key={b.name}>
              <span style={{ background: COLORS[i % COLORS.length] }} /> {b.name} {b.pct} %
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
