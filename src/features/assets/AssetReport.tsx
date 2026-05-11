import { useMemo, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { AssetPeriodSnapshot, ClientProfile, InvestmentCategory, InvestmentItem } from '../../types/client'
import {
  INVESTMENT_CATEGORY_LABELS, ASSET_CURRENCY_LABELS, ASSET_PURPOSE_LABELS,
} from '../../types/client'
import {
  totalLiabilities, netWorthConverted, totalAssetsConverted, totalLiabilitiesConverted,
  convertCurrency, fmtAmount, fmtPct,
  calcAssetAllocation, calcAssetDeviation, calcCategoryBreakdown,
} from '../../utils/calculations'
import type { FxRates } from '../fx/exchangeRate'
import { StatCard } from '../../shared/StatCard'

ChartJS.register(ArcElement, Tooltip, Legend)

const CAT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f43f5e', '#a78bfa']
const CUR_COLORS = ['#0ea5e9', '#f97316', '#ec4899', '#14b8a6', '#8b5cf6', '#eab308', '#64748b', '#22c55e']
const PUR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']

const PIE_OPTS = {
  responsive: true,
  plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 10 }, padding: 6 } } },
}

interface FxProps { rates: FxRates; reportCurrency: string }

function NoteTag({ note }: { note?: string }) {
  const [show, setShow] = useState(false)
  if (!note) return null
  return (
    <div className="relative inline-block">
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded cursor-help inline-flex items-center gap-0.5">
        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        備注
      </button>
      {show && (
        <div className="absolute left-0 top-6 z-10 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 w-56 shadow-lg whitespace-pre-wrap">
          {note}
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-700 mb-3">{children}</h3>
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-slate-200 rounded-xl py-6 text-center text-xs text-slate-500">
      {text}
    </div>
  )
}

// ── Layer 1: 資產現況 ─────────────────────────────────────────

function Layer1({ client, rates, reportCurrency }: { client: ClientProfile } & FxProps) {
  const nw = useMemo(() => netWorthConverted(client, rates, reportCurrency), [client, rates, reportCurrency])
  const totalInv = useMemo(() => totalAssetsConverted(client, rates, reportCurrency), [client, rates, reportCurrency])
  const totalLiab = useMemo(() => totalLiabilitiesConverted(client, rates, reportCurrency), [client, rates, reportCurrency])
  const alloc = useMemo(() => calcAssetAllocation(client, rates, reportCurrency), [client, rates, reportCurrency])

  const disp = (n: number, compact = false) => fmtAmount(n, reportCurrency, compact)
  const dispItem = (amount: number, currency: string) =>
    fmtAmount(convertCurrency(amount, currency, reportCurrency, rates), reportCurrency, true)

  const catPie = {
    labels: (Object.keys(alloc.byCategory) as InvestmentCategory[]).map(k => INVESTMENT_CATEGORY_LABELS[k]),
    datasets: [{ data: Object.values(alloc.byCategory).map(v => v.amount), backgroundColor: CAT_COLORS, borderWidth: 2, borderColor: '#fff' }],
  }
  const curKeys = Object.keys(alloc.byCurrency)
  const curPie = {
    labels: curKeys.map(k => ASSET_CURRENCY_LABELS[k as keyof typeof ASSET_CURRENCY_LABELS] ?? k),
    datasets: [{ data: curKeys.map(k => alloc.byCurrency[k].amount), backgroundColor: CUR_COLORS, borderWidth: 2, borderColor: '#fff' }],
  }
  const purKeys = Object.keys(alloc.byPurpose)
  const purPie = {
    labels: purKeys.map(k => ASSET_PURPOSE_LABELS[k as keyof typeof ASSET_PURPOSE_LABELS] ?? k),
    datasets: [{ data: purKeys.map(k => alloc.byPurpose[k].amount), backgroundColor: PUR_COLORS, borderWidth: 2, borderColor: '#fff' }],
  }

  const longTermLiab = client.liabilityItems.filter(l => l.type === 'long_term')
  const currentLiab = client.liabilityItems.filter(l => l.type === 'current')
  const rawTotalLiab = totalLiabilities(client)

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="淨資產" value={disp(nw, true)} color={nw >= 0 ? 'blue' : 'red'} />
        <StatCard label="總資產" value={disp(totalInv, true)} color="green" />
        <StatCard label="總負債" value={disp(totalLiab, true)} color={totalLiab > 0 ? 'red' : 'green'} />
        <div className={`rounded-xl p-3 border ${alloc.isConcentrated ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="text-xs text-slate-500 mb-1">最大單一持倉</div>
          {alloc.topHolding ? (
            <>
              <div className="text-base font-bold text-slate-700">{fmtPct(alloc.topHolding.pct)}</div>
              <div className="text-xs text-slate-500 truncate">{alloc.topHolding.label}</div>
              {alloc.isConcentrated && (
                <div className="text-xs text-amber-600 font-medium mt-0.5">⚠ 集中度偏高</div>
              )}
            </>
          ) : (
            <div className="text-base font-bold text-slate-300">–</div>
          )}
        </div>
      </div>

      {/* 三張圓餅圖 */}
      {client.assetItems.length > 0 ? (
        <div>
          <SectionTitle>資產分布 · 總計 {disp(totalInv, true)}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-center text-slate-500 mb-2 font-medium">資產類別</div>
              <div className="h-44"><Pie data={catPie} options={PIE_OPTS} /></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-center text-slate-500 mb-2 font-medium">幣別分布</div>
              <div className="h-44"><Pie data={curPie} options={PIE_OPTS} /></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-center text-slate-500 mb-2 font-medium">資產用途</div>
              <div className="h-44"><Pie data={purPie} options={PIE_OPTS} /></div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyHint text="尚未輸入資產資料" />
      )}

      {/* 資產明細 */}
      {client.assetItems.length > 0 && (
        <div>
          <SectionTitle>資產明細</SectionTitle>
          <div className="space-y-1">
            {client.assetItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded shrink-0">
                    {INVESTMENT_CATEGORY_LABELS[item.category]}
                  </span>
                  {item.currency && item.currency !== 'TWD' && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded shrink-0">
                      {item.currency}
                    </span>
                  )}
                  {item.institution && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                      {item.institution}
                    </span>
                  )}
                  <span className="text-slate-700 truncate">{item.label}</span>
                  <NoteTag note={item.note} />
                </div>
                <div className="flex flex-col items-end ml-2 shrink-0">
                  <span className="font-medium text-emerald-700">
                    {dispItem(item.amount, item.currency ?? 'TWD')}
                  </span>
                  {item.currency && item.currency !== 'TWD' && item.currency !== reportCurrency && (
                    <span className="text-xs text-slate-500">
                      {fmtAmount(item.amount, item.currency, true)} 原幣
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 負債明細 */}
      {client.liabilityItems.length > 0 && (
        <div>
          <SectionTitle>負債明細 · 總計 {disp(totalLiab, true)}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {longTermLiab.length > 0 && (
              <div>
                <div className="text-xs font-medium text-red-400 mb-1">長期負債</div>
                {longTermLiab.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-700">{item.label}</span>
                      <NoteTag note={item.note} />
                    </div>
                    <span className="font-medium text-red-700">{disp(convertCurrency(item.amount, 'TWD', reportCurrency, rates), true)}</span>
                  </div>
                ))}
              </div>
            )}
            {currentLiab.length > 0 && (
              <div>
                <div className="text-xs font-medium text-orange-400 mb-1">流動負債</div>
                {currentLiab.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-700">{item.label}</span>
                      <NoteTag note={item.note} />
                    </div>
                    <span className="font-medium text-orange-700">{disp(convertCurrency(item.amount, 'TWD', reportCurrency, rates), true)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {rawTotalLiab > 0 && <div className="sr-only">{rawTotalLiab}</div>}
        </div>
      )}
    </div>
  )
}

function fmtWan(n: number) {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  return n.toLocaleString('zh-TW')
}

function LedgerHistory({ activeSnap, bTotal, currentItems }: {
  activeSnap: AssetPeriodSnapshot | undefined
  bTotal: number
  currentItems: InvestmentItem[]
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const ledger = activeSnap?.ledgerEntries ?? []
  const snapItems = activeSnap?.assetItems ?? []
  const itemMap = new Map<string, string>([
    ...currentItems.map(i => [i.id, i.label] as [string, string]),
    ...snapItems.map(i => [i.id, i.label] as [string, string]),
  ])
  const totalDeltaLedger = ledger.reduce(
    (s, e) => s + e.lines.reduce((ls, l) => ls + l.amountDelta, 0), 0
  )
  const opening = activeSnap?.openingAssets ?? 0
  const closing = activeSnap?.closingAssets ?? bTotal
  const gap = closing - opening - totalDeltaLedger

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  return (
    <div className="pt-2 border-t border-slate-100">
      <div className="text-xs font-semibold text-slate-500 tracking-wide mb-3">本期交易明細</div>

      {/* Reconciliation summary */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs bg-slate-50 rounded-lg px-3 py-2 mb-3">
        <span className="text-slate-500">期初 <span className="font-medium text-slate-700">{fmtWan(opening)}</span></span>
        <span className="text-slate-300">+</span>
        <span className="text-slate-500">
          交易合計
          <span className={`font-medium ml-1 ${totalDeltaLedger >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {totalDeltaLedger >= 0 ? '+' : ''}{fmtWan(totalDeltaLedger)}
          </span>
        </span>
        <span className="text-slate-300">→</span>
        <span className="text-slate-500">期末 <span className="font-medium text-slate-700">{fmtWan(closing)}</span></span>
        {Math.abs(gap) > 1 && (
          <span className="text-orange-500 font-medium">差額 {gap >= 0 ? '+' : ''}{fmtWan(gap)}</span>
        )}
      </div>

      {/* Entry list */}
      {ledger.length === 0 ? (
        <div className="text-xs text-slate-400">本期尚無交易記錄</div>
      ) : (
        <div className="space-y-1">
          {ledger.map(entry => {
            const entrySum = entry.lines.reduce((s, l) => s + l.amountDelta, 0)
            const isExpanded = expanded.has(entry.id)
            return (
              <div key={entry.id} className="rounded-lg border border-slate-100 overflow-hidden">
                <button
                  onClick={() => toggle(entry.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-slate-400 shrink-0">{entry.date}</span>
                  <span className="text-slate-700 flex-1">{entry.description}</span>
                  <span className={`font-medium shrink-0 ${entrySum >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {entrySum >= 0 ? '+' : ''}{fmtWan(entrySum)}
                  </span>
                  <span className="text-slate-300 ml-1">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 space-y-1.5">
                    {entry.lines.map((line, li) => {
                      const assetLabel = itemMap.get(line.assetItemId) ?? '已刪除資產'
                      return (
                        <div key={li} className="flex items-start gap-2 text-xs">
                          <span className="text-slate-500 flex-1">{assetLabel}</span>
                          {line.qtyDelta != null && (
                            <span className="text-slate-400">{line.qtyDelta >= 0 ? '+' : ''}{line.qtyDelta} 股</span>
                          )}
                          {line.price != null && (
                            <span className="text-slate-400">@ {fmtWan(line.price)}</span>
                          )}
                          <span className={`font-medium shrink-0 ${line.amountDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {line.amountDelta >= 0 ? '+' : ''}{fmtWan(line.amountDelta)}
                          </span>
                          {line.note && <span className="text-slate-400">（{line.note}）</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Layer 2: 資產變化 ─────────────────────────────────────────

function Layer2({ client }: { client: ClientProfile }) {
  const snapshots = useMemo(() => client.assetSnapshots ?? [], [client.assetSnapshots])
  const [fromId, setFromId] = useState<string>(() => (client.assetSnapshots ?? [])[((client.assetSnapshots ?? []).length - 1)]?.id ?? '')
  const [toId, setToId] = useState<string>(() => (client.assetSnapshots ?? [])[0]?.id ?? '')

  const fromSnap = snapshots.find(s => s.id === fromId) ?? snapshots[snapshots.length - 1]
  const toSnap   = snapshots.find(s => s.id === toId)   ?? snapshots[0]

  // Resolve A / B items and totals
  const aItems = useMemo(() => {
    if (snapshots.length === 0) return null
    if (snapshots.length === 1) return snapshots[0].assetItems ?? null
    return fromSnap?.assetItems ?? null
  }, [snapshots, fromSnap])

  const bItems = useMemo(() => {
    if (snapshots.length === 0) return null
    if (snapshots.length === 1) return client.assetItems
    return toSnap?.assetItems ?? null
  }, [snapshots, toSnap, client.assetItems])

  const aTotal = useMemo(() => {
    if (snapshots.length === 0) return 0
    if (snapshots.length === 1) return snapshots[0].openingAssets
    return fromSnap?.openingAssets ?? 0
  }, [snapshots, fromSnap])

  const bTotal = useMemo(() => {
    if (snapshots.length === 0) return 0
    if (snapshots.length === 1) return client.assetItems.reduce((s, i) => s + i.amount, 0)
    return toSnap?.openingAssets ?? 0
  }, [snapshots, toSnap, client.assetItems])

  const aBreakdown = useMemo(() => aItems ? calcCategoryBreakdown(aItems) : null, [aItems])
  const bBreakdown = useMemo(() => bItems ? calcCategoryBreakdown(bItems) : null, [bItems])

  const aLabel = snapshots.length === 0 ? '' : snapshots.length === 1 ? snapshots[0].periodLabel : (fromSnap?.periodLabel ?? '')
  const bLabel = snapshots.length === 1 ? '目前' : (toSnap?.periodLabel ?? '')

  if (snapshots.length === 0) {
    return <EmptyHint text="尚未建立快照 · 點選右上角「快照」按鈕開始記錄" />
  }

  const totalDelta   = bTotal - aTotal
  const totalDeltaPct = aTotal > 0 ? (totalDelta / aTotal) * 100 : 0
  const deltaColor   = totalDelta >= 0 ? 'text-emerald-600' : 'text-red-500'

  // Category rows: union of A+B categories, sorted by |delta pct| desc
  const allCats = Array.from(new Set([
    ...Object.keys(aBreakdown ?? {}),
    ...Object.keys(bBreakdown ?? {}),
  ])) as InvestmentCategory[]

  const catRows = allCats.map(cat => {
    const aPct = aBreakdown?.[cat]?.pct ?? 0
    const bPct = bBreakdown?.[cat]?.pct ?? 0
    return { cat, aPct, bPct, delta: bPct - aPct }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return (
    <div className="space-y-4">
      {/* Snapshot selector (≥ 2 snapshots) */}
      {snapshots.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>比較起點</span>
          <select value={fromId} onChange={e => setFromId(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 text-xs focus:border-blue-300 outline-none bg-white">
            {snapshots.map(s => <option key={s.id} value={s.id}>{s.periodLabel} ({s.snapshotDate})</option>)}
          </select>
          <span>→ 比較終點</span>
          <select value={toId} onChange={e => setToId(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 text-xs focus:border-blue-300 outline-none bg-white">
            {snapshots.map(s => <option key={s.id} value={s.id}>{s.periodLabel} ({s.snapshotDate})</option>)}
          </select>
        </div>
      )}

      {/* Header */}
      <div className="text-xs font-semibold text-slate-500 tracking-wide">
        {aLabel} → {bLabel}
      </div>

      {/* Total assets */}
      <div className="bg-slate-50 rounded-xl px-4 py-3">
        <div className="text-xs text-slate-500 mb-1">總資產</div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm text-slate-500">{fmtWan(aTotal)}</span>
          <span className="text-slate-300 text-xs">→</span>
          <span className="text-base font-semibold text-slate-800">{fmtWan(bTotal)}</span>
          <span className={`text-sm font-semibold ${deltaColor}`}>
            {totalDelta >= 0 ? '+' : ''}{fmtWan(totalDelta)}（{totalDeltaPct >= 0 ? '+' : ''}{fmtPct(totalDeltaPct)}）
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      {(aBreakdown || bBreakdown) ? (
        <div>
          <div className="text-xs text-slate-500 mb-2">類別配置</div>
          <div className="space-y-1.5">
            {catRows.map(({ cat, aPct, bPct, delta }) => {
              const isUp   = delta > 0.05
              const isDown = delta < -0.05
              const deltaText = Math.abs(delta) < 0.05
                ? '持平'
                : `${delta > 0 ? '▲' : '▼'}${fmtPct(Math.abs(delta))}`
              const deltaColor = isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-slate-400'
              return (
                <div key={cat} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-slate-500 text-xs shrink-0">{INVESTMENT_CATEGORY_LABELS[cat]}</span>
                  <span className="text-slate-500 text-xs w-10 text-right">{fmtPct(aPct)}</span>
                  <span className="text-slate-300 text-xs">→</span>
                  <span className="text-slate-700 text-xs w-10 text-right">{fmtPct(bPct)}</span>
                  <span className={`text-xs font-medium ml-1 ${deltaColor}`}>{deltaText}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500">無歷史配置資料（舊快照不含明細）</div>
      )}

      <LedgerHistory
        activeSnap={snapshots.length === 1 ? snapshots[0] : toSnap}
        bTotal={bTotal}
        currentItems={client.assetItems}
      />
    </div>
  )
}

// ── Layer 3: 配置偏離 ─────────────────────────────────────────

function Layer3({ client, rates, reportCurrency }: { client: ClientProfile } & FxProps) {
  const deviation = useMemo(() => calcAssetDeviation(client), [client])
  const rc = (n: number) => convertCurrency(n, 'TWD', reportCurrency, rates)
  const disp = (n: number, compact = false) => fmtAmount(rc(n), reportCurrency, compact)

  if (!deviation.hasTargets) {
    return (
      <EmptyHint text="尚未設定目標配置 · 請在「投資偏好」→「目標配置」設定各類別目標百分比" />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <span>容許區間：±{client.toleranceBand}%</span>
        {deviation.needsRebalance && (
          <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded font-medium">建議再平衡</span>
        )}
      </div>

      {/* 偏離表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-600 border-b border-slate-100">
              <th className="text-left pb-2 pl-2">資產類別</th>
              <th className="text-right pb-2">目標%</th>
              <th className="text-right pb-2">實際%</th>
              <th className="text-right pb-2">偏離%</th>
              <th className="text-right pb-2 pr-2">金額差</th>
              <th className="text-right pb-2 pr-2">狀態</th>
            </tr>
          </thead>
          <tbody>
            {deviation.items.map((item, i) => (
              <tr key={i} className={`border-b border-slate-50 ${!item.withinTolerance ? 'bg-amber-50' : ''}`}>
                <td className="py-2 pl-2 font-medium text-slate-700">{item.label}</td>
                <td className="text-right text-slate-500">{fmtPct(item.targetPct)}</td>
                <td className="text-right text-slate-600">{fmtPct(item.actualPct)}</td>
                <td className={`text-right font-medium ${item.deviation > 0 ? 'text-orange-500' : item.deviation < 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                  {item.deviation >= 0 ? '+' : ''}{fmtPct(item.deviation)}
                </td>
                <td className={`text-right pr-2 ${item.deviationAmount > 0 ? 'text-orange-500' : item.deviationAmount < 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                  {item.deviationAmount >= 0 ? '+' : ''}{disp(item.deviationAmount, true)}
                </td>
                <td className="text-right pr-2">
                  {item.action === 'ok' && <span className="text-xs text-emerald-500">✓ 容許內</span>}
                  {item.action === 'overweight' && <span className="text-xs text-amber-600 font-medium">⚠ 超配</span>}
                  {item.action === 'underweight' && <span className="text-xs text-blue-500 font-medium">↑ 低配</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 再平衡建議 */}
      {deviation.needsRebalance && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1">
          <div className="text-xs font-semibold text-amber-700 mb-2">建議再平衡項目</div>
          {deviation.rebalancePriority.map((item, i) => (
            <div key={i} className="flex justify-between text-xs text-amber-700">
              <span>{item.label}</span>
              <span>
                {item.action === 'overweight' ? '減持' : '增持'}{' '}
                {disp(Math.abs(item.deviationAmount), true)}（偏離 {Math.abs(item.deviation).toFixed(1)}%）
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 主元件 ───────────────────────────────────────────────────

export function AssetReport({ client, rates, reportCurrency }: { client: ClientProfile } & FxProps) {
  const [activeLayer, setActiveLayer] = useState<1 | 2 | 3>(1)

  const layers: { id: 1 | 2 | 3; label: string }[] = [
    { id: 1, label: '資產現況' },
    { id: 2, label: '資產變化' },
    { id: 3, label: '配置偏離' },
  ]

  return (
    <div className="report-page space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">資產組合</h2>

      {/* Layer 切換 */}
      <div className="flex gap-2">
        {layers.map(l => (
          <button key={l.id} onClick={() => setActiveLayer(l.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeLayer === l.id
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            {l.label}
          </button>
        ))}
      </div>

      {activeLayer === 1 && <Layer1 client={client} rates={rates} reportCurrency={reportCurrency} />}
      {activeLayer === 2 && <Layer2 client={client} />}
      {activeLayer === 3 && <Layer3 client={client} rates={rates} reportCurrency={reportCurrency} />}
    </div>
  )
}
