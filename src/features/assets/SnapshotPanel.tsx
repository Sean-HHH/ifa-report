import { useState, useRef, useEffect } from 'react'
import type { ClientProfile, AssetPeriodSnapshot, InvestmentItem, InvestmentCategory } from '../../types/client'
import { totalAssetsConverted, convertCurrency } from '../../utils/calculations'
import { calcPeriodPnL } from './calc'
import type { FxRates } from '../fx/exchangeRate'
// import { LedgerPanel } from './LedgerPanel'  // hidden; see DECISIONS.md

const TRADEABLE = new Set<InvestmentCategory>(['stock', 'fund', 'bond', 'crypto'])

interface Props {
  client: ClientProfile
  rates: FxRates
  reportCurrency: string
  onUpdate: (c: ClientProfile) => void
  onClose: () => void
  onShare: (snapshot: AssetPeriodSnapshot) => void
}

function fmtWan(n: number) {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  return n.toLocaleString('zh-TW')
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

type DraftPrices = Record<string, { unitPrice: string; amount: string }>

export function SnapshotPanel({ client, rates, reportCurrency, onUpdate, onClose, onShare }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftDate, setDraftDate] = useState('')
  const [draftPrices, setDraftPrices] = useState<DraftPrices>({})
  const [draftNetContribution, setDraftNetContribution] = useState('')
  const [draftDividendIncome, setDraftDividendIncome] = useState('')

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const snapshots = client.assetSnapshots ?? []

  const patchSnapshot = (id: string, patch: Partial<AssetPeriodSnapshot>) => {
    onUpdate({
      ...client,
      assetSnapshots: snapshots.map(s => s.id === id ? { ...s, ...patch } : s),
    })
  }

  const openCreateForm = () => {
    const initial: DraftPrices = {}
    for (const item of client.assetItems) {
      initial[item.id] = {
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
        amount: String(item.amount),
      }
    }
    setDraftLabel('')
    setDraftDate(today())
    setDraftPrices(initial)
    setDraftNetContribution('')
    setDraftDividendIncome('')
    setShowCreateForm(true)
  }

  const updateDraftPrice = (assetId: string, field: 'unitPrice' | 'amount', value: string) => {
    setDraftPrices(prev => {
      const entry = { ...prev[assetId], [field]: value }
      if (field === 'unitPrice') {
        const item = client.assetItems.find(i => i.id === assetId)
        if (item && TRADEABLE.has(item.category) && item.units != null && item.units > 0) {
          const price = parseFloat(value)
          if (!isNaN(price)) entry.amount = (item.units * price).toFixed(0)
        }
      }
      return { ...prev, [assetId]: entry }
    })
  }

  const confirmCreate = () => {
    const prevTotal = totalAssetsConverted(client, rates, reportCurrency)
    const updatedItems: InvestmentItem[] = client.assetItems.map(item => {
      const d = draftPrices[item.id]
      if (!d) return item
      if (TRADEABLE.has(item.category) && item.units != null && item.units > 0) {
        const newPrice = parseFloat(d.unitPrice)
        if (!isNaN(newPrice) && newPrice > 0) return { ...item, unitPrice: newPrice, amount: item.units * newPrice }
      }
      const newAmount = parseFloat(d.amount)
      if (!isNaN(newAmount)) return { ...item, amount: newAmount }
      return item
    })

    const newTotal = updatedItems.reduce((s, i) => s + convertCurrency(i.amount, i.currency ?? 'TWD', reportCurrency, rates), 0)
    const snap: AssetPeriodSnapshot = {
      id: crypto.randomUUID(),
      periodLabel: draftLabel || draftDate,
      snapshotDate: draftDate,
      openingAssets: prevTotal,
      netContribution: snapshots.length > 0 ? (parseFloat(draftNetContribution) || 0) : 0,
      dividendIncome: snapshots.length > 0 ? (parseFloat(draftDividendIncome) || 0) : 0,
      fxImpact: 0,
      fees: 0,
      closingAssets: newTotal,
      openingAssetItems: [...client.assetItems],
      assetItems: [...updatedItems],
      ledgerEntries: [],
    }
    onUpdate({ ...client, assetItems: updatedItems, assetSnapshots: [snap, ...snapshots] })
    setShowCreateForm(false)
    setExpandedId(snap.id)
  }

  const deleteSnapshot = (id: string) => {
    onUpdate({ ...client, assetSnapshots: snapshots.filter(s => s.id !== id) })
    setConfirmDeleteId(null)
  }

  // Compute draft total for the create form preview
  const draftTotal = client.assetItems.reduce((s, item) => {
    const d = draftPrices[item.id]
    let raw: number
    if (TRADEABLE.has(item.category) && item.units != null && item.units > 0) {
      const p = d ? parseFloat(d.unitPrice) : NaN
      raw = isNaN(p) ? item.amount : item.units * p
    } else {
      const a = d ? parseFloat(d.amount) : NaN
      raw = isNaN(a) ? item.amount : a
    }
    return s + convertCurrency(raw, item.currency ?? 'TWD', reportCurrency, rates)
  }, 0)

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 56, right: 16, zIndex: 200,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      width: 520,
      maxHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-secondary)' }}>期間記錄管理</span>
        <button onClick={onClose} aria-label="關閉" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Create form or create button */}
      {showCreateForm ? (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, overflowY: 'auto', maxHeight: 380 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 10 }}>新增期間快照</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              placeholder="期間標籤（如 2025 Q1）"
              value={draftLabel}
              onChange={e => setDraftLabel(e.target.value)}
              style={{ flex: 1, fontSize: 12, padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none', background: '#fff' }}
            />
            <input
              type="date"
              value={draftDate}
              onChange={e => setDraftDate(e.target.value)}
              style={{ fontSize: 12, padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none', background: '#fff' }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>請輸入各資產的期末價格或金額：</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {client.assetItems.map(item => {
              const isTradeableWithUnits = TRADEABLE.has(item.category) && item.units != null && item.units > 0
              const draft = draftPrices[item.id] ?? { unitPrice: '', amount: String(item.amount) }
              const estAmt = isTradeableWithUnits
                ? (parseFloat(draft.unitPrice) || 0) * item.units!
                : parseFloat(draft.amount) || 0
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  <span style={{ flex: 1, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  {isTradeableWithUnits ? (
                    <>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>×{item.units} @</span>
                      <input
                        type="number"
                        placeholder={item.unitPrice != null ? String(item.unitPrice) : '市價'}
                        value={draft.unitPrice}
                        onChange={e => updateDraftPrice(item.id, 'unitPrice', e.target.value)}
                        style={{ width: 80, fontSize: 11, padding: '3px 6px', border: '1px solid var(--color-border)', borderRadius: 4, outline: 'none', background: '#fff' }}
                      />
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 11, minWidth: 64, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        = {fmtWan(estAmt)}
                      </span>
                    </>
                  ) : (
                    <input
                      type="number"
                      placeholder={String(item.amount)}
                      value={draft.amount}
                      onChange={e => updateDraftPrice(item.id, 'amount', e.target.value)}
                      style={{ width: 110, fontSize: 11, padding: '3px 6px', border: '1px solid var(--color-border)', borderRadius: 4, outline: 'none', background: '#fff' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {/* Cash flow fields — only for 2nd+ snapshots */}
          {snapshots.length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 10px 6px', background: '#fafafa', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 8 }}>本期資金流動</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, color: '#64748b', width: 120, flexShrink: 0 }}>淨投入</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={draftNetContribution}
                    onChange={e => setDraftNetContribution(e.target.value)}
                    style={{ width: 110, fontSize: 11, padding: '3px 6px', border: '1px solid var(--color-border)', borderRadius: 4, outline: 'none', background: '#fff' }}
                  />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>正 = 增資，負 = 提領</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, color: '#64748b', width: 120, flexShrink: 0 }}>配息收入（選填）</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={draftDividendIncome}
                    onChange={e => setDraftDividendIncome(e.target.value)}
                    style={{ width: 110, fontSize: 11, padding: '3px 6px', border: '1px solid var(--color-border)', borderRadius: 4, outline: 'none', background: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                賣股換現但留在組合內 → 淨投入填 0（內部流動）
              </div>
            </div>
          )}

          {/* Total preview */}
          {(() => {
            const prevTotal = totalAssetsConverted(client, rates, reportCurrency)
            const delta = draftTotal - prevTotal
            const nc = parseFloat(draftNetContribution) || 0
            const div = parseFloat(draftDividendIncome) || 0
            const marketReturn = snapshots.length > 0 ? delta - nc - div : delta
            return (
              <div style={{ marginTop: 8, padding: '6px 8px', background: '#f0f9ff', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                <div>期末總計：<strong>{fmtWan(draftTotal)}</strong>
                  <span style={{ marginLeft: 8, color: delta >= 0 ? '#059669' : '#ef4444' }}>
                    {delta >= 0 ? '+' : ''}{fmtWan(delta)} vs 期初 {fmtWan(prevTotal)}
                  </span>
                </div>
                {snapshots.length > 0 && (
                  <div style={{ marginTop: 4, color: '#64748b' }}>
                    市場損益估算：<span style={{ fontWeight: 600, color: marketReturn >= 0 ? '#059669' : '#ef4444' }}>
                      {marketReturn >= 0 ? '+' : ''}{fmtWan(marketReturn)}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 4 }}>（總變動 − 淨投入 − 配息）</span>
                  </div>
                )}
              </div>
            )
          })()}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={confirmCreate}
              disabled={!draftDate}
              style={{
                flex: 1, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                background: draftDate ? 'var(--color-primary)' : '#e2e8f0',
                color: draftDate ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: draftDate ? 'pointer' : 'not-allowed',
              }}
            >
              確認建立快照
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{ padding: '6px 12px', fontSize: 12, color: 'var(--color-text-muted)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <button onClick={openCreateForm} style={{
            width: '100%', padding: '7px 12px', fontSize: 13, fontWeight: 600,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}>
            ＋ 新增期間快照（現在 {fmtWan(totalAssetsConverted(client, rates, reportCurrency))} 元）
          </button>
        </div>
      )}

      {/* Snapshot list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {snapshots.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            尚無期間記錄，點上方建立第一個
          </div>
        ) : (
          snapshots.map(s => {
            const isConfirming = confirmDeleteId === s.id
            const isExpanded = expandedId === s.id
            const pnl = calcPeriodPnL(s, client.ledgerEntries)
            const hasClosed = s.closingAssets != null

            return (
              <div key={s.id} style={{
                borderBottom: '1px solid var(--color-border)',
                background: isConfirming ? '#fff5f5' : 'transparent',
                transition: 'background 0.15s',
              }}>
                {/* Main row */}
                <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>{s.snapshotDate}</span>
                      {s.periodLabel !== s.snapshotDate && <span>{s.periodLabel}</span>}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                        {fmtWan(s.openingAssets)}{hasClosed ? ` → ${fmtWan(s.closingAssets!)}` : ''}
                      </span>
                      {hasClosed && (
                        <span style={{ color: pnl.totalReturn >= 0 ? '#059669' : '#ef4444', fontSize: 11, fontWeight: 600 }}>
                          {pnl.totalReturn >= 0 ? '+' : ''}{fmtWan(pnl.totalReturn)}（{pnl.returnPct >= 0 ? '+' : ''}{pnl.returnPct.toFixed(1)}%）
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer' }}
                  >
                    {isExpanded ? '收合' : '詳情'}
                  </button>
                  <button
                    onClick={() => onShare(s)}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      border: `1px solid ${s.shareId ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: s.shareId ? 'rgba(37,99,235,0.06)' : 'none',
                      color: s.shareId ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {s.shareId ? '已分享' : '分享'}
                  </button>
                  {!isConfirming ? (
                    <button
                      onClick={() => { setConfirmDeleteId(s.id); setExpandedId(null) }}
                      style={{ fontSize: 12, color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                    >
                      刪除
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                    >
                      取消
                    </button>
                  )}
                </div>

                {/* Double-confirm delete */}
                {isConfirming && (
                  <div style={{ padding: '8px 16px 12px', background: '#fff5f5' }}>
                    <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>
                      確定刪除「{s.periodLabel}」期間記錄？此操作無法復原。
                    </div>
                    <button
                      onClick={() => deleteSnapshot(s.id)}
                      style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#ef4444', border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 12px', cursor: 'pointer' }}
                    >
                      確認刪除
                    </button>
                  </div>
                )}

                {/* Detail view (TASK-031) */}
                {isExpanded && (
                  <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--color-border)', background: '#f8fafc' }}>
                    {/* P&L summary strip (TASK-032) */}
                    {hasClosed && (
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10,
                        padding: '8px 10px', background: '#fff',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                      }}>
                        <PnLPill label="期初" value={pnl.openingAssets} />
                        <PnLPill label="期末" value={pnl.closingAssets} />
                        {pnl.netContribution !== 0 && <PnLPill label="淨投入" value={pnl.netContribution} signed />}
                        {pnl.dividendIncome !== 0 && <PnLPill label="配息" value={pnl.dividendIncome} signed />}
                        {(pnl.netContribution !== 0 || pnl.dividendIncome !== 0)
                          ? <PnLPill label="市場損益" value={pnl.marketGain} signed highlight />
                          : <PnLPill label="淨資產變動" value={pnl.totalReturn} signed highlight />
                        }
                        <div style={{ width: '100%', fontSize: 11, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 6, marginTop: 2 }}>
                          期間變動率：
                          <span style={{ fontWeight: 700, color: pnl.returnPct >= 0 ? '#059669' : '#ef4444' }}>
                            {pnl.returnPct >= 0 ? '+' : ''}{pnl.returnPct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Label edit */}
                    <SnapField label="期間標籤" value={s.periodLabel} onChange={v => patchSnapshot(s.id, { periodLabel: v })} isText />
                    {/* Transactions — hidden; workflow is update-input-then-snapshot, not ledger-driven */}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function PnLPill({ label, value, signed, highlight }: { label: string; value: number; signed?: boolean; highlight?: boolean }) {
  const color = !signed ? 'var(--color-text-secondary)' : value >= 0 ? '#059669' : '#ef4444'
  return (
    <div style={{ fontSize: 11, color: '#64748b' }}>
      {label}：
      <span style={{ fontWeight: highlight ? 700 : 600, color }}>
        {signed && value !== 0 ? (value >= 0 ? '+' : '') : ''}
        {fmtWan(value)}
      </span>
    </div>
  )
}

function SnapField({ label, value, onChange, isText }: {
  label: string
  value: string | number
  onChange: (v: never) => void
  isText?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 60, flexShrink: 0 }}>{label}</span>
      <input
        type={isText ? 'text' : 'number'}
        value={value}
        onChange={e => onChange((isText ? e.target.value : Number(e.target.value)) as never)}
        style={{
          flex: 1, fontSize: 12, padding: '3px 8px',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          background: '#fff', outline: 'none',
          color: 'var(--color-text-secondary)',
        }}
      />
    </div>
  )
}
