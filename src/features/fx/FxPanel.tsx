import { useRef, useEffect } from 'react'
import type { FxRates } from './exchangeRate'

const DISPLAY_CURRENCIES = ['USD', 'JPY', 'EUR', 'GBP', 'HKD', 'USDT'] as const

interface Props {
  apiRates: FxRates
  manualRates: Partial<FxRates>
  onSetManualRate: (currency: string, value: number | null) => void
  onClearAll: () => void
  lastUpdated: Date | null
  loading: boolean
  onClose: () => void
}

export function FxPanel({ apiRates, manualRates, onSetManualRate, onClearAll, lastUpdated, loading, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const hasOverrides = Object.keys(manualRates).length > 0
  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 56, right: 16, zIndex: 200,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: '16px',
      minWidth: 280,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>匯率設定（TWD 等值）</span>
        <button onClick={onClose} aria-label="關閉匯率設定" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
        {loading ? '載入中…' : `來源：open.er-api.com · ${updatedStr}`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DISPLAY_CURRENCIES.map(cur => {
          const apiVal = apiRates[cur]
          const overrideVal = manualRates[cur]
          const displayVal = overrideVal ?? apiVal ?? ''
          const isOverridden = overrideVal !== undefined

          return (
            <div key={cur} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 40, fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{cur}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', width: 16 }}>＝</span>
              <input
                type="number"
                step="0.01"
                value={displayVal}
                onChange={e => {
                  const v = parseFloat(e.target.value)
                  onSetManualRate(cur, isNaN(v) ? null : v)
                }}
                style={{
                  width: 80, fontSize: 13, padding: '4px 8px',
                  border: `1px solid ${isOverridden ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: isOverridden ? 'rgba(37,99,235,0.04)' : 'var(--color-surface)',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>TWD</span>
              {isOverridden && (
                <button
                  onClick={() => onSetManualRate(cur, null)}
                  style={{ fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  還原
                </button>
              )}
            </div>
          )
        })}
      </div>

      {hasOverrides && (
        <button
          onClick={onClearAll}
          style={{
            marginTop: 12, width: '100%', fontSize: 12, padding: '6px',
            background: 'none', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            color: 'var(--color-text-muted)',
          }}
        >
          清除所有覆蓋，還原 API 值
        </button>
      )}
    </div>
  )
}
