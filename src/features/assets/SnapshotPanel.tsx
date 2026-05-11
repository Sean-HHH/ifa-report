import { useState, useRef, useEffect } from 'react'
import type { ClientProfile, AssetPeriodSnapshot, InvestmentItem, MajorExpense } from '../../types/client'
import { totalAssets } from '../../utils/calculations'
import { LedgerPanel } from './LedgerPanel'

interface Props {
  client: ClientProfile
  onUpdate: (c: ClientProfile) => void
  onClose: () => void
}

function fmtWan(n: number) {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  return n.toLocaleString('zh-TW')
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function SnapshotPanel({ client, onUpdate, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  const createSnapshot = () => {
    const date = today()
    const snap: AssetPeriodSnapshot = {
      id: crypto.randomUUID(),
      periodLabel: date,
      snapshotDate: date,
      openingAssets: totalAssets(client),
      netContribution: 0,
      dividendIncome: 0,
      fxImpact: 0,
      fees: 0,
      assetItems: [...client.assetItems],
      ledgerEntries: [],
    }
    onUpdate({ ...client, assetSnapshots: [snap, ...snapshots] })
    setExpandedId(snap.id)
  }

  const deleteSnapshot = (id: string) => {
    onUpdate({ ...client, assetSnapshots: snapshots.filter(s => s.id !== id) })
    setConfirmDeleteId(null)
  }

  const handleCommit = (
    updatedAssetItems: InvestmentItem[],
    updatedMajorExpenses: MajorExpense[],
    updatedSnapshot: AssetPeriodSnapshot,
  ) => {
    onUpdate({
      ...client,
      assetItems: updatedAssetItems,
      majorExpenses: updatedMajorExpenses,
      assetSnapshots: snapshots.map(s => s.id === updatedSnapshot.id ? updatedSnapshot : s),
    })
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 56, right: 16, zIndex: 200,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      width: 460,
      maxHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-secondary)' }}>期間記錄管理</span>
        <button onClick={onClose} aria-label="關閉期間記錄管理" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Create button */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button onClick={createSnapshot} style={{
          width: '100%', padding: '7px 12px', fontSize: 13, fontWeight: 600,
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        }}>
          ＋ 建立期間記錄（現在 {fmtWan(totalAssets(client))} 元）
        </button>
      </div>

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
                      <span>{s.periodLabel !== s.snapshotDate ? s.periodLabel : ''}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, marginTop: 2 }}>
                      {fmtWan(s.openingAssets)} 元
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer' }}
                  >
                    {isExpanded ? '收合' : '詳情'}
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

                {/* 詳情 */}
                {isExpanded && (
                  <div style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--color-border)', background: '#f8fafc' }}>
                    <SnapField label="標籤" value={s.periodLabel} onChange={v => patchSnapshot(s.id, { periodLabel: v })} isText />
                    <LedgerPanel
                      snapshot={s}
                      assetItems={client.assetItems}
                      majorExpenses={client.majorExpenses}
                      onUpdate={updated => patchSnapshot(s.id, updated)}
                      onCommit={handleCommit}
                    />
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

function SnapField({ label, value, onChange, isText }: {
  label: string
  value: string | number
  onChange: (v: never) => void
  isText?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 80, flexShrink: 0 }}>{label}</span>
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
