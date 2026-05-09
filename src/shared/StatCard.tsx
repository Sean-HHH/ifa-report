interface Props {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}

const accentMap: Record<NonNullable<Props['color']>, { border: string; value: string }> = {
  blue:   { border: '#2563eb', value: '#1d4ed8' },
  green:  { border: '#10b981', value: '#059669' },
  red:    { border: '#ef4444', value: '#dc2626' },
  orange: { border: '#f97316', value: '#ea580c' },
  purple: { border: '#8b5cf6', value: '#7c3aed' },
}

export function StatCard({ label, value, sub, color = 'blue' }: Props) {
  const accent = accentMap[color]
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      borderLeft: `4px solid ${accent.border}`,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent.value }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
