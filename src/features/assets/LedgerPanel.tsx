import { useState } from 'react'
import type { InvestmentItem, InvestmentCategory, LedgerEntry, LedgerLine, LedgerLineType, MajorExpense } from '../../types/client'
import { INVESTMENT_CATEGORY_LABELS } from '../../types/client'

function fmtWan(n: number) {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  return n.toLocaleString('zh-TW')
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const TRADEABLE = new Set(['stock', 'fund', 'bond', 'crypto'])

const LINE_TYPE_LABELS: Record<LedgerLineType, string> = {
  buy: '買入',
  sell: '賣出',
  dividend: '配息',
  fee: '費用',
  transfer: '轉帳',
  valuation: '估值',
}

interface Props {
  entries: LedgerEntry[]
  assetItems: InvestmentItem[]
  majorExpenses: MajorExpense[]
  snapshotId?: string
  openingAssets?: number
  closingAssets?: number
  onUpdate: (entries: LedgerEntry[]) => void
  onCommit: (updatedAssetItems: InvestmentItem[], updatedMajorExpenses: MajorExpense[]) => void
}

type DraftLine = {
  id: string
  type: LedgerLineType
  assetItemId: string
  amountDelta: string
  qtyDelta: string
  price: string
  note: string
}

interface NewAssetFormState {
  entryId: string | null
  lineId: string
  label: string
  category: InvestmentCategory
}

function emptyDraftLine(): DraftLine {
  return { id: crypto.randomUUID(), type: 'buy', assetItemId: '', amountDelta: '', qtyDelta: '', price: '', note: '' }
}

const inputSm: React.CSSProperties = {
  fontSize: 11, padding: '3px 6px',
  border: '1px solid var(--color-border)', borderRadius: 4,
  background: '#fff', outline: 'none',
  color: 'var(--color-text-secondary)',
}

export function LedgerPanel({ entries, assetItems, majorExpenses, snapshotId, openingAssets, closingAssets, onUpdate, onCommit }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showNewForm, setShowNewForm] = useState(false)
  const [draftDesc, setDraftDesc] = useState('')
  const [draftDate, setDraftDate] = useState(todayStr())
  const [draftLines, setDraftLines] = useState<DraftLine[]>([emptyDraftLine()])
  const [missingIds, setMissingIds] = useState<string[]>([])
  const [pendingNewAssets, setPendingNewAssets] = useState<InvestmentItem[]>([])
  const [newAssetForm, setNewAssetForm] = useState<NewAssetFormState | null>(null)

  const allAssets = [...assetItems, ...pendingNewAssets]

  const totalExplained = entries.flatMap(e => e.lines).reduce((s, l) => s + l.amountDelta, 0)
  const unexplained = closingAssets != null && openingAssets != null
    ? closingAssets - openingAssets - totalExplained
    : null

  const deleteEntry = (id: string) => {
    const entry = entries.find(e => e.id === id)
    const remaining = entries.filter(e => e.id !== id)
    if (entry) {
      const reversedItems = assetItems.map(item => {
        const delta = entry.lines
          .filter(l => l.assetItemId === item.id)
          .reduce((s, l) => s + l.amountDelta, 0)
        return delta !== 0 ? { ...item, amount: item.amount - delta } : item
      })
      onUpdate(remaining)
      onCommit(reversedItems, majorExpenses)
    } else {
      onUpdate(remaining)
    }
  }

  const patchEntry = (id: string, p: Partial<Omit<LedgerEntry, 'lines'>>) =>
    onUpdate(entries.map(e => e.id === id ? { ...e, ...p } : e))

  const patchLine = (entryId: string, lineId: string, p: Partial<LedgerLine>) =>
    onUpdate(entries.map(e =>
      e.id === entryId
        ? { ...e, lines: e.lines.map(l => l.id === lineId ? { ...l, ...p } : l) }
        : e
    ))

  const patchLineAuto = (entryId: string, lineId: string, p: Partial<LedgerLine>) => {
    const entry = entries.find(e => e.id === entryId)
    const line = entry?.lines.find(l => l.id === lineId)
    const patch = { ...p }
    if (line) {
      const merged = { ...line, ...patch }
      const qty = merged.qtyDelta
      const pr = merged.price
      if (qty != null && qty !== 0 && pr != null && pr !== 0) {
        patch.amountDelta = qty * pr
      }
    }
    patchLine(entryId, lineId, patch)
  }

  const addLineToEntry = (entryId: string) =>
    onUpdate(entries.map(e =>
      e.id === entryId
        ? { ...e, lines: [...e.lines, { id: crypto.randomUUID(), type: 'buy' as LedgerLineType, assetItemId: '', amountDelta: 0 }] }
        : e
    ))

  const removeLineFromEntry = (entryId: string, lineId: string) => {
    const entry = entries.find(e => e.id === entryId)
    const line = entry?.lines.find(l => l.id === lineId)
    const updatedEntries = entries.map(e =>
      e.id === entryId ? { ...e, lines: e.lines.filter(l => l.id !== lineId) } : e
    )
    if (line) {
      const reversedItems = assetItems.map(item =>
        item.id === line.assetItemId
          ? { ...item, amount: item.amount - line.amountDelta }
          : item
      )
      onUpdate(updatedEntries)
      onCommit(reversedItems, majorExpenses)
    } else {
      onUpdate(updatedEntries)
    }
  }

  const confirmNewAsset = () => {
    if (!newAssetForm || !newAssetForm.label.trim()) return
    const newItem: InvestmentItem = {
      id: crypto.randomUUID(),
      label: newAssetForm.label.trim(),
      category: newAssetForm.category,
      amount: 0,
    }
    setPendingNewAssets(prev => [...prev, newItem])
    if (newAssetForm.entryId === null) {
      setDraftLines(prev => prev.map(l => l.id === newAssetForm.lineId ? { ...l, assetItemId: newItem.id } : l))
    } else {
      patchLine(newAssetForm.entryId, newAssetForm.lineId, { assetItemId: newItem.id })
    }
    setNewAssetForm(null)
  }

  const commitNewEntry = () => {
    if (!draftDesc.trim()) return
    const lines: LedgerLine[] = draftLines
      .filter(l => l.assetItemId !== '' && l.amountDelta !== '')
      .map(l => {
        const qty = l.qtyDelta !== '' ? Number(l.qtyDelta) : undefined
        const price = l.price !== '' ? Number(l.price) : undefined
        const autoAmt = qty != null && qty !== 0 && price != null && price !== 0 ? qty * price : null
        return {
          id: l.id,
          type: l.type,
          assetItemId: l.assetItemId,
          amountDelta: autoAmt ?? Number(l.amountDelta),
          ...(qty != null ? { qtyDelta: qty } : {}),
          ...(price != null ? { price } : {}),
          ...(l.note !== '' ? { note: l.note } : {}),
        }
      })
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      description: draftDesc.trim(),
      date: draftDate,
      lines,
      ...(snapshotId != null ? { snapshotId } : {}),
    }
    onUpdate([...entries, entry])
    setDraftDesc('')
    setDraftDate(todayStr())
    setDraftLines([emptyDraftLine()])
    setShowNewForm(false)
    setNewAssetForm(null)
    setExpandedIds(prev => new Set([...prev, entry.id]))
  }

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const applyLedger = () => {
    const allLines = entries.flatMap(e => e.lines)
    const missing: string[] = []

    const updatedAssetItems: InvestmentItem[] = [
      ...assetItems.map(item => ({ ...item })),
      ...pendingNewAssets.map(a => ({ ...a })),
    ]
    for (const line of allLines) {
      const idx = updatedAssetItems.findIndex(a => a.id === line.assetItemId)
      if (idx === -1) {
        if (line.assetItemId) missing.push(line.assetItemId)
        continue
      }
      const item = updatedAssetItems[idx]
      const updatedItem: InvestmentItem = {
        ...item,
        amount: item.amount + line.amountDelta,
        ...(line.qtyDelta != null && item.units != null
          ? { units: (item.units ?? 0) + line.qtyDelta }
          : {}),
      }

      if (TRADEABLE.has(item.category) && line.qtyDelta != null && line.price != null) {
        if (line.qtyDelta > 0) {
          const oldUnits = item.units ?? 0
          const oldAvgCost = item.avgCost ?? item.unitPrice ?? 0
          const newUnits = oldUnits + line.qtyDelta
          if (newUnits > 0) {
            updatedItem.avgCost = (oldUnits * oldAvgCost + line.qtyDelta * line.price) / newUnits
          }
        }
      }

      updatedAssetItems[idx] = updatedItem
    }

    setMissingIds(missing)

    const actualClosing = updatedAssetItems.reduce((s, a) => s + a.amount, 0)
    const openingRef = openingAssets ?? 0
    const gap = actualClosing - (openingRef + totalExplained)

    const currentYear = new Date().getFullYear()
    const updatedMajorExpenses: MajorExpense[] = Math.abs(gap) > 1
      ? [...majorExpenses, { label: `待說明差額 ${todayStr()}`, amount: Math.abs(gap), year: currentYear }]
      : [...majorExpenses]

    onCommit(updatedAssetItems, updatedMajorExpenses)
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        本期交易記錄
      </div>

      {/* Reconciliation summary */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {openingAssets != null && <Chip label="期初" value={fmtWan(openingAssets)} />}
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

                    {entry.lines.map(line => {
                      const isAutoAmt = line.qtyDelta != null && line.qtyDelta !== 0 && line.price != null && line.price !== 0
                      const showMiniForm = newAssetForm?.entryId === entry.id && newAssetForm?.lineId === line.id
                      return (
                        <div key={line.id} style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <select
                              value={line.type ?? 'buy'}
                              onChange={e => patchLine(entry.id, line.id, { type: e.target.value as LedgerLineType })}
                              style={{ ...inputSm, width: 52, flexShrink: 0 }}>
                              {(Object.entries(LINE_TYPE_LABELS) as [LedgerLineType, string][]).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            <select
                              value={showMiniForm ? '__new__' : line.assetItemId}
                              onChange={e => {
                                if (e.target.value === '__new__') {
                                  setNewAssetForm({ entryId: entry.id, lineId: line.id, label: '', category: 'stock' })
                                } else {
                                  patchLine(entry.id, line.id, { assetItemId: e.target.value })
                                  setNewAssetForm(null)
                                }
                              }}
                              style={{ ...inputSm, flex: 1 }}>
                              <option value="">選擇資產</option>
                              {allAssets.map(a => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                              ))}
                              <option value="__new__">＋ 建立新資產</option>
                            </select>
                            {isAutoAmt ? (
                              <span style={{ fontSize: 11, padding: '3px 6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 4, color: '#0369a1', width: 72, textAlign: 'right', flexShrink: 0, display: 'inline-block' }}>
                                {fmtWan(line.qtyDelta! * line.price!)}
                              </span>
                            ) : (
                              <input type="number" value={line.amountDelta}
                                onChange={e => patchLine(entry.id, line.id, { amountDelta: Number(e.target.value) })}
                                placeholder="金額 ±" style={{ ...inputSm, width: 72 }} />
                            )}
                            <button onClick={() => removeLineFromEntry(entry.id, line.id)}
                              aria-label="刪除此行"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                            <input type="number" value={line.qtyDelta ?? ''}
                              onChange={e => patchLineAuto(entry.id, line.id, { qtyDelta: e.target.value !== '' ? Number(e.target.value) : undefined })}
                              placeholder="數量 ±" style={{ ...inputSm, width: 64 }} />
                            <input type="number" value={line.price ?? ''}
                              onChange={e => patchLineAuto(entry.id, line.id, { price: e.target.value !== '' ? Number(e.target.value) : undefined })}
                              placeholder="單價" style={{ ...inputSm, width: 64 }} />
                            <input value={line.note ?? ''}
                              onChange={e => patchLine(entry.id, line.id, { note: e.target.value || undefined })}
                              placeholder="備注" style={{ ...inputSm, flex: 1 }} />
                          </div>
                          {showMiniForm && (
                            <NewAssetMiniForm
                              form={newAssetForm!}
                              onChange={setNewAssetForm}
                              onConfirm={confirmNewAsset}
                              onCancel={() => setNewAssetForm(null)}
                            />
                          )}
                        </div>
                      )
                    })}

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

      {missingIds.length > 0 && (
        <div style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 4, padding: '4px 8px', marginBottom: 6 }}>
          {missingIds.length} 筆明細找不到對應資產（已刪除），已略過。
        </div>
      )}

      {entries.length > 0 && !showNewForm && (
        <button onClick={applyLedger}
          style={{ fontSize: 12, fontWeight: 600, width: '100%', padding: '6px 0', marginBottom: 6, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          確認並更新資產
        </button>
      )}

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

          {draftLines.map((line, idx) => {
            const qty = line.qtyDelta !== '' ? Number(line.qtyDelta) : null
            const price = line.price !== '' ? Number(line.price) : null
            const isAutoAmt = qty != null && qty !== 0 && price != null && price !== 0
            const showMiniForm = newAssetForm?.entryId === null && newAssetForm?.lineId === line.id
            return (
              <div key={line.id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <select
                    value={line.type}
                    onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, type: e.target.value as LedgerLineType } : l))}
                    style={{ ...inputSm, width: 52, flexShrink: 0 }}>
                    {(Object.entries(LINE_TYPE_LABELS) as [LedgerLineType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <select
                    value={showMiniForm ? '__new__' : line.assetItemId}
                    onChange={e => {
                      if (e.target.value === '__new__') {
                        setNewAssetForm({ entryId: null, lineId: line.id, label: '', category: 'stock' })
                      } else {
                        setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, assetItemId: e.target.value } : l))
                        setNewAssetForm(null)
                      }
                    }}
                    style={{ ...inputSm, flex: 1 }}>
                    <option value="">選擇資產</option>
                    {allAssets.map(a => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                    <option value="__new__">＋ 建立新資產</option>
                  </select>
                  {isAutoAmt ? (
                    <span style={{ fontSize: 11, padding: '3px 6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 4, color: '#0369a1', width: 72, textAlign: 'right', flexShrink: 0, display: 'inline-block' }}>
                      {fmtWan(qty! * price!)}
                    </span>
                  ) : (
                    <input type="number" value={line.amountDelta}
                      onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, amountDelta: e.target.value } : l))}
                      placeholder="金額 ±" style={{ ...inputSm, width: 72 }} />
                  )}
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
                    onChange={e => {
                      const newQty = e.target.value
                      setDraftLines(prev => prev.map((l, i) => {
                        if (i !== idx) return l
                        const q = newQty !== '' ? Number(newQty) : null
                        const p = l.price !== '' ? Number(l.price) : null
                        const autoAmt = q != null && q !== 0 && p != null && p !== 0 ? String(q * p) : l.amountDelta
                        return { ...l, qtyDelta: newQty, amountDelta: autoAmt }
                      }))
                    }}
                    placeholder="數量 ±" style={{ ...inputSm, width: 64 }} />
                  <input type="number" value={line.price}
                    onChange={e => {
                      const newPrice = e.target.value
                      setDraftLines(prev => prev.map((l, i) => {
                        if (i !== idx) return l
                        const q = l.qtyDelta !== '' ? Number(l.qtyDelta) : null
                        const p = newPrice !== '' ? Number(newPrice) : null
                        const autoAmt = q != null && q !== 0 && p != null && p !== 0 ? String(q * p) : l.amountDelta
                        return { ...l, price: newPrice, amountDelta: autoAmt }
                      }))
                    }}
                    placeholder="單價" style={{ ...inputSm, width: 64 }} />
                  <input value={line.note}
                    onChange={e => setDraftLines(prev => prev.map((l, i) => i === idx ? { ...l, note: e.target.value } : l))}
                    placeholder="備注" style={{ ...inputSm, flex: 1 }} />
                </div>
                {showMiniForm && (
                  <NewAssetMiniForm
                    form={newAssetForm!}
                    onChange={setNewAssetForm}
                    onConfirm={confirmNewAsset}
                    onCancel={() => setNewAssetForm(null)}
                  />
                )}
              </div>
            )
          })}

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
            <button onClick={() => { setShowNewForm(false); setDraftDesc(''); setDraftDate(todayStr()); setDraftLines([emptyDraftLine()]); setNewAssetForm(null) }}
              style={{ fontSize: 12, padding: '5px 10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              取消
            </button>
          </div>
        </div>
      )}

      {!showNewForm && (
        <button onClick={() => setShowNewForm(true)}
          style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', background: 'none', border: '1px dashed var(--color-primary)', borderRadius: 4, padding: '5px 0', cursor: 'pointer', width: '100%', opacity: 0.8 }}>
          ＋ 新增交易
        </button>
      )}
    </div>
  )
}

function NewAssetMiniForm({
  form,
  onChange,
  onConfirm,
  onCancel,
}: {
  form: NewAssetFormState
  onChange: (f: NewAssetFormState) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ border: '1px solid #bfdbfe', borderRadius: 4, padding: '6px 8px', marginTop: 4, background: '#eff6ff' }}>
      <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4 }}>建立新資產</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={form.label}
          onChange={e => onChange({ ...form, label: e.target.value })}
          placeholder="資產名稱"
          style={{ ...inputSm, flex: 1 }}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && form.label.trim()) onConfirm() }}
        />
        <select
          value={form.category}
          onChange={e => onChange({ ...form, category: e.target.value as InvestmentCategory })}
          style={inputSm}
        >
          {Object.entries(INVESTMENT_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <button
          onClick={onConfirm}
          disabled={!form.label.trim()}
          style={{ fontSize: 11, padding: '3px 10px', background: form.label.trim() ? 'var(--color-primary)' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: 4, cursor: form.label.trim() ? 'pointer' : 'not-allowed' }}
        >
          確認
        </button>
        <button
          onClick={onCancel}
          style={{ fontSize: 11, padding: '3px 8px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', color: 'var(--color-text-muted)' }}
        >
          取消
        </button>
      </div>
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
