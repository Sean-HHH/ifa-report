interface Props {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}

const valueColorMap: Record<NonNullable<Props['color']>, string> = {
  blue:   'var(--color-text-primary)',
  green:  '#059669',
  red:    '#DC2626',
  orange: '#D97706',
  purple: '#7C3AED',
}

const dotColorMap: Record<NonNullable<Props['color']>, string> = {
  blue:   'var(--color-lime)',
  green:  '#059669',
  red:    '#DC2626',
  orange: '#D97706',
  purple: '#7C3AED',
}

export function StatCard({ label, value, sub, color = 'blue' }: Props) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: dotColorMap[color], flexShrink: 0,
        }} />
        <div style={{
          fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{label}</div>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: valueColorMap[color], lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
