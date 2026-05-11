import { useState } from 'react'
import type { AssetPeriodSnapshot, InvestmentItem, LedgerEntry, LedgerLine, MajorExpense } from '../../types/client'

function fmtWan(n: number) {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  return n.toLocaleString('zh-TW')
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  snapshot: AssetPeriodSnapshot
  assetItems: InvestmentItem[]
  majorExpenses: MajorExpense[]
  onUpdate: (s: AssetPeriodSnapshot) => void
  onCommit: (updatedAssetItems: InvestmentItem[], updatedMajorExpenses: MajorExpense[], updatedSnapshot: AssetPeriodSnapshot) => void
}

type DraftLine = {
  id: string
  assetItemId: string
  amountDelta: string
  qtyDelta: string
  price: string
  note: string
}

function emptyDraftLine(): DraftLine {
  return { id: crypto.randomUUID(), assetItemId: '', amountDelta: '', qtyDelta: '', price: '', note: '' }
}

const inputSm: React.CSSProperties = {
  fontSize: 11, padding: '3px 6px',
  border: '1px solid var(--color-border)', borderRadius: 4,
  background: '#fff', outline: 'none',
  color: 'var(--color-text-secondary)',
}

export function LedgerPanel({ snapshot, assetItems, majorExpenses, onUpdate, onCommit }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showNewForm, setShowNewForm] = useState(false)
  const [draftDesc, setDraftDesc] = useState('')
  const [draftDate, setDraftDate] = useState(todayStr())
  const [draftLines, setDraftLines] = useState<DraftLine[]>([emptyDraftLine()])
  const [missingIds, setMissingIds] = useState<string[]>([])

  const entries = snapshot.ledgerEntries ?? []
  const totalExplained = entries.flatMap(e => e.lines).reduce((s, l) => s + l.amountDelta, 0)
  const unexplained = snapshot.closingAssets != null
    ? snapshot.closingAssets - snapshot.openingAssets - totalExplained
    : null

  const patchEntries = (updated: LedgerEntry[]) =>
    onUpdate({ ...snapshot, ledgerEntries: updated })

  const deleteEntry = (id: string) =>
    patchEntries(entries.filter(e => e.id !== id))

  const patchEntry = (id: string, p: Partial<Omit<LedgerEntry, 'lines'>>) =>
    patchEntries(entries.map(e => e.id === id ? { ...e, ...p } : e))

  const patchLine = (entryId: string, lineId: string, p: Partial<LedgerLine>) =>
    patchEntries(entries.map(e =>
      e.id === entryId
        ? { ...e, lines: e.lines.map(l => l.id === lineId ? { ...l, ...p } : l) }
        : e
    ))

  const addLineToEntry = (entryId: string) =>
    patchEntries(entries.map(e =>
      e.id === entryId
        ? { ...e, lines: [...e.lines, { id: crypto.randomUUID(), assetItemId: '', amountDelta: 0 }] }
        : e
    ))

  const removeLineFromEntry = (entryId: string, lineId: string) =>
    patchEntries(entries.map(e =>
      e.id === entryId
        ? { ...e, lines: e.lines.filter(l => l.id !== lineId) }
        : e
    ))

  const commitNewEntry = () => {
    if (!draftDesc.trim()) return
    const lines: LedgerLine[] = draftLines
      .filter(l => l.assetItemId !== '' && l.amountDelta !== '')
      .map(l => ({
        id: l.id,
        assetItemId: l.assetItemId,
        amountDelta: Number(l.amountDelta),
        ...(l.qtyDelta !== '' ? { qtyDelta: Number(l.qtyDelta) } : {}),
        ...(l.price !== '' ? { price: Number(l.price) } : {}),
        ...(l.note !== '' ? { note: l.note } : {}),
      }))
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      description: draftDesc.trim(),
      date: draftDate,
      lines,
    }
    patchEntries([...entries, entry])
    setDraftDesc('')
    setDraftDate(todayStr())
    setDraftLines([emptyDraftLine()])
    setShowNewForm(false)
    setExpandedIds(prev => new Set([...prev, entry.id]))
  }

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div style={{ marginTop: 10 }}>
      {/* Section label */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        本期交易記錄
      </div>

      {/* Reconciliation summary */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <Chip label="期初" value={fmtWan(snapshot.openingAssets)} />
        <Chip
          label="已記錄"
          value={(totalExplained >= 0 ? '+' : '') + fmtWan(totalExplained)}
          color={totalExplained > 0 ? '#16a34a' : totalExplained < 0 ? '#dc2626' : undefined}
        />
        {unexplained != null && (
          <Chip
            label="差額"
            value={(unexplained >= 0 ? '+' : '') + fmtWan(unexplained)}
            color={Math.abs(unexplained) > 1 ? '#d97706' : '#94a3b8'}
          />
        )}
      </div>

      {/* Entry list */}
      {entries.length === 0 && !showNewForm && (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 0 8px', textAlign: 'center' }}>
          尚未記錄任何交易，點擊下方新增
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
          {entries.map(entry => {
            const entryTotal = entry.lines.reduce((s, l) => s + l.amountDelta, 0)
            const isExpanded = expandedIds.has(entry.id)
            return (
              <div key={entry.id} style={{ border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.description}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{entry.date}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: entryTotal >= 0 ? '#16a34a' : '#dc2626', flexShrink: 0 }}>
                    {(entryTotal >= 0 ? '+' : '') + fmtWan(entryTotal)}
                  </span>
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {isExpanded ? '收合' : '展開'}
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    aria-label="刪除此筆交易"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: '2px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Expanded edit area */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '8px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      <input type="date" value={entry.date}
                        onChange={e => patchEntry(entry.id, { date: e.target.value })}
                        style={inputSm} />
                      <input value={entry.description}
                        onChange={e => patchEntry(entry.id, { description: e.target.value })}
                        placeholder="交易描述" style={{ ...inputSm, flex: 1 }} />
                    </div>

                    {entry.lines.map(line => (
                      <div key={line.id} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <select value={line.assetItemId}
                            onChange={e => patchLine(entry.id, line.id, { assetItemId: e.target.value })}
                            style={{ ...inputSm, flex: 1 }}>
                            <option value="">選擇資產</option>
                            {assetItems.map(a => (
                              <option key={a.id} value={a.id}>{a.label}</option>
                            ))}
                          </select>
                          <input type="number" value={line.amountDelta}
                            onChange={e => patchLine(entry.id, line.id, { amountDelta: Number(e.target.value) })}
                            placeholder="金額 ±" style={{ ...inputSm, width: 72 }} />
                          <button onClick={() => removeLineFromEntry(entry.id, line.id)}
                            aria-label="刪除此行"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                          <input type="number" value={line.qtyDelta ?? ''}
                            onChange={e => patchLine(entry.id, line.id, { qtyDelta: e.target.value !== '' ? Number(e.target.value) : undefined })}
                            placeholder="數量 ±" style={{ ...inputSm, width: 64 }} />
                          <input type="number" value={line.price ?? ''}
                            onChange={e => patchLine(entry.id, line.id, { price: e.target.value !== '' ? Number(e.target.value) : undefined })}
                            placeholder="單價" style={{ ...inputSm, width: 64 }} />
                          <input value={line.note ?? ''}
                            onChange={e => patchLine(entry.id, line.id, { note: e.target.value || undefined })}
                            placeholder="備注" style={{ ...inputSm, flex: 1 }} />
                        </div>
                      </div>
                    ))}

                    <button onClick={() => addLineToEntry(entry.id)}
                      style={{ fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                      ＋ 新增一行
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New entry form */}
      {showNewForm && (
        <div style={{ border: '1px solid var(--color-primary)', borderRadius: 6, padding: 8, marginBottom: 8, background: '#eff6ff' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input type="date" value={draftDate}
              onChange={e => setDraftDate(e.target.value)}
              style={inputSm} />
            <input value={draftDesc}
              onChange={e => setDraftDesc(e.target.value)}
              placeholder="交易描述（必填）"
              style={{ ...inputSm, flex: 1 }}
              autoFocus />
          </div>

          {draftLines.map((line, idx) => (
            <div key={line.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select value={line.assetItemId}
                  onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, assetItemId: e.target.value } : l))}
                  style={{ ...inputSm, flex: 1 }}>
                  <option value="">選擇資產</option>
                  {assetItems.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
                <input type="number" value={line.amountDelta}
                  onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, amountDelta: e.target.value } : l))}
                  placeholder="金額 ±" style={{ ...inputSm, width: 72 }} />
                {draftLines.length > 1 && (
                  <button onClick={() => setDraftLines(prev => prev.filter((_, i) => i !== idx))}
                    aria-label="刪除此行"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                <input type="number" value={line.qtyDelta}
                  onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, qtyDelta: e.target.value } : l))}
                  placeholder="數量 ±" style={{ ...inputSm, width: 64 }} />
                <input type="number" value={line.price}
                  onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, price: e.target.value } : l))}
                  placeholder="單價" style={{ ...inputSm, width: 64 }} />
                <input value={line.note}
                  onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, note: e.target.value } : l))}
                  placeholder="備注" style={{ ...inputSm, flex: 1 }} />
              </div>
            </div>
          ))}

          <button
            onClick={() => setDraftLines(prev => [...prev, emptyDraftLine()])}
            style={{ fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginBottom: 8, display: 'block' }}>
            ＋ 新增一行
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={commitNewEntry} disabled={!draftDesc.trim()}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', background: draftDesc.trim() ? 'var(--color-primary)' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: 4, cursor: draftDesc.trim() ? 'pointer' : 'not-allowed' }}>
              新增交易
            </button>
            <button onClick={() => { setShowNewForm(false); setDraftDesc(''); setDraftDate(todayStr()); setDraftLines([emptyDraftLine()]) }}
              style={{ fontSize: 12, padding: '5px 10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* Add entry trigger */}
      {!showNewForm && (
        <button onClick={() => setShowNewForm(true)}
          style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', background: 'none', border: '1px dashed var(--color-primary)', borderRadius: 4, padding: '5px 0', cursor: 'pointer', width: '100%', opacity: 0.8 }}>
          ＋ 新增交易
        </button>
      )}
    </div>
  )
}

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ fontSize: 11, padding: '3px 8px', background: '#f1f5f9', borderRadius: 4 }}>
      <span style={{ color: 'var(--color-text-muted)', marginRight: 4 }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? 'var(--color-text-secondary)' }}>{value}</span>
    </div>
  )
}
