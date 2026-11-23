import type { ReactNode } from 'react'

interface P {
  size?: number
  className?: string
}

const wrap =
  (children: ReactNode) =>
  ({ size = 20, className }: P) => (
    <svg
      className={className}
      width={`${size / 14}rem`}
      height={`${size / 14}rem`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )

export const Home = wrap(<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />)
export const Heart = wrap(<path d="M12 21s-8-5.5-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 10c0 5.5-8 11-8 11z" />)
export const Book = wrap(<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4zM5 17a3 3 0 013-3h11" />)
export const Tree = wrap(<path d="M12 3v6M12 9H6v4M12 9h6v4M6 13v3M18 13v3M12 9v12M9 21h6" />)
export const Scale = wrap(<path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />)
export const Cross = wrap(<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" />)
export const Pie = wrap(<path d="M12 3v9h9a9 9 0 11-9-9zM15 3.5A9 9 0 0120.5 9H15V3.5z" />)
export const Gear = wrap(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
  </>,
)
export const Search = wrap(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </>,
)
export const Bell = wrap(<path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 21h4" />)
export const User = wrap(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </>,
)
export const Camera = wrap(
  <>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </>,
)
export const Calendar = wrap(<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />)
export const Syringe = wrap(<path d="M18 2l4 4M15 5l4 4M13 7l4 4-8 8-4-4zM5 19l-3 3M10 12l2 2" />)
export const Drops = wrap(
  <>
    <path d="M8 3s4 4.5 4 7.5a4 4 0 01-8 0C4 7.5 8 3 8 3z" />
    <path d="M17 12s3 3.2 3 5.4a3 3 0 01-6 0c0-2.2 3-5.4 3-5.4z" />
  </>,
)
export const Leaf = wrap(<path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19c3-5 6-8 10-10" />)
export const Menu = wrap(<path d="M4 7h16M4 12h16M4 17h16" />)
export const Plus = wrap(<path d="M12 5v14M5 12h14" />)
export const Chevron = wrap(<path d="M9 5l7 7-7 7" />)
export const Check = wrap(<path d="M5 12l5 5 9-10" />)
export const Edit = wrap(<path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />)
export const Tag = wrap(
  <>
    <path d="M3 12V4h8l10 10-8 8L3 12z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
  </>,
)
export const Pin = wrap(
  <>
    <circle cx="12" cy="10" r="3" />
    <path d="M12 21s-7-6-7-11a7 7 0 1114 0c0 5-7 11-7 11z" />
  </>,
)
export const Pulse = wrap(<path d="M3 12h4l3-7 4 14 3-7h4" />)
export const Star = ({ size = 20 }: P) => (
  <svg width={`${size / 14}rem`} height={`${size / 14}rem`} viewBox="0 0 24 24" fill="#e8a817" aria-hidden="true">
    <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8L12 2z" />
  </svg>
)

// Silueta simple de vaca (lateral)
export const Cow = ({ size = 24, className }: P) => (
  <svg className={className} width={`${size / 14}rem`} height={`${size / 14}rem`} viewBox="0 0 48 32" fill="currentColor" aria-hidden="true">
    <path d="M4 10c0-2 1-3 3-3h2l1-3 2 3h3c2-2 6-3 10-3h8c4 0 7 2 8 5l2 3c1 1 1 2 0 3l-2 1v9h-3v-8h-3v8h-3v-8H20v8h-3v-8h-3v8h-3v-9c-3 0-6-1-7-3-1-1-1-2-1-3z" />
    <circle cx="9" cy="9" r="1" fill="#f6efe0" />
  </svg>
)
export const CowOutline = ({ size = 80 }: P) => (
  <svg width={`${size / 14}rem`} height={`${(size * 0.66) / 14}rem`} viewBox="0 0 48 32" fill="none" stroke="#f6efe0" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10c0-2 1-3 3-3h2l1-3 2 3h3c2-2 6-3 10-3h8c4 0 7 2 8 5l2 3c1 1 1 2 0 3l-2 1v9h-3v-8h-3v8h-3v-8H20v8h-3v-8h-3v8h-3v-9c-3 0-6-1-7-3-1-1-1-2-1-3z" />
  </svg>
)
