interface TooltipPayloadItem {
  name?: string
  value?: number | string | null
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  formatter?: (value: number) => string
}

export function ChartTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    }}>
      {label !== undefined && (
        <p style={{ color: '#94a3b8', marginBottom: 4, marginTop: 0 }}>{label}</p>
      )}
      {payload.map((p, i) => {
        const val = p.value != null ? Number(p.value) : null
        return (
          <p key={i} style={{ color: p.color ?? '#f1f5f9', margin: '2px 0' }}>
            <span style={{ color: '#94a3b8' }}>{p.name}: </span>
            {val != null ? (formatter ? formatter(val) : String(val)) : '—'}
          </p>
        )
      })}
    </div>
  )
}
