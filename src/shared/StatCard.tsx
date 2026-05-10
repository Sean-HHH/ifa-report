interface Props {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}

const accentMap: Record<NonNullable<Props['color']>, { top: string; value: string; bg: string }> = {
  blue:   { top: '#1E40AF', value: '#1E40AF', bg: 'rgba(30,64,175,0.04)' },
  green:  { top: '#059669', value: '#059669', bg: 'rgba(5,150,105,0.04)' },
  red:    { top: '#DC2626', value: '#DC2626', bg: 'rgba(220,38,38,0.04)' },
  orange: { top: '#D97706', value: '#B45309', bg: 'rgba(217,119,6,0.04)' },
  purple: { top: '#7C3AED', value: '#6D28D9', bg: 'rgba(124,58,237,0.04)' },
}

export function StatCard({ label, value, sub, color = 'blue' }: Props) {
  const accent = accentMap[color]
  return (
    <div style={{
      background: accent.bg,
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      borderTop: `3px solid ${accent.top}`,
      borderRight: '1px solid var(--color-border)',
      borderBottom: '1px solid var(--color-border)',
      borderLeft: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
      }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color: accent.value, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
