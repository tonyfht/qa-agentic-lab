// Generated illustration per category: no image files, no third-party rights, no network requests.
const PALETTE: Record<string, { bg: string; fg: string; icon: string }> = {
  cocina: { bg: '#f6e3d3', fg: '#b4532a', icon: 'M20 30h40v6a20 20 0 0 1-40 0zM60 32h6a5 5 0 0 1 0 10h-6' },
  textil: { bg: '#e3ecf2', fg: '#3b6e8f', icon: 'M18 26h44v28H18zM18 34h44M18 42h44M18 50h44' },
  decoracion: { bg: '#ece6f3', fg: '#6b4f8f', icon: 'M40 18c10 8 14 16 14 24a14 14 0 0 1-28 0c0-8 4-16 14-24zM34 62h12' },
  bano: { bg: '#dff0ec', fg: '#2f7d6b', icon: 'M22 40h36v6a12 12 0 0 1-12 12H34a12 12 0 0 1-12-12zM26 40V26a6 6 0 0 1 12 0' },
  iluminacion: { bg: '#f7efcf', fg: '#9a7414', icon: 'M28 20h24l8 20H20zM40 40v16M30 58h20' },
}

export function ProductArt({ category, name, size = 'card' }: { category: string; name: string; size?: 'card' | 'large' }) {
  const p = PALETTE[category] ?? PALETTE.decoracion
  const initials = name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return (
    <svg
      viewBox="0 0 80 80"
      role="img"
      aria-label={`Ilustración de ${name}`}
      className={size === 'large' ? 'w-full max-w-sm rounded-2xl' : 'w-full rounded-xl'}
    >
      <rect width="80" height="80" fill={p.bg} />
      <path d={p.icon} fill="none" stroke={p.fg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="72" y="72" textAnchor="end" fontSize="9" fontWeight="700" fill={p.fg} fontFamily="system-ui, sans-serif">
        {initials}
      </text>
    </svg>
  )
}
