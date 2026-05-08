import { useMemo, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { ClientProfile, InvestmentCategory } from '../../types/client'
import {
  INVESTMENT_CATEGORY_LABELS, ASSET_CURRENCY_LABELS, ASSET_PURPOSE_LABELS,
} from '../../types/client'
import {
  totalAssets, totalLiabilities, netWorth, fmtNTD, fmtPct,
  calcAssetAllocation, calcAssetPeriodChange, calcAssetDeviation,
} from '../../utils/calculations'
import { StatCard } from './StatCard'

ChartJS.register(ArcElement, Tooltip, Legend)

const CAT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f43f5e', '#a78bfa']
const CUR_COLORS = ['#0ea5e9', '#f97316', '#ec4899', '#14b8a6', '#8b5cf6', '#eab308', '#64748b', '#22c55e']
const PUR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']

const PIE_OPTS = {
  responsive: true,
  plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 10 }, padding: 6 } } },
}

function NoteTag({ note }: { note?: string }) {
  const [show, setShow] = useState(false)
  if (!note) return null
  return (
    <div className="relative inline-block">
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded cursor-help">
        📝
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
  return <h3 className="text-sm font-semibold text-slate-500 mb-3">{children}</h3>
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-slate-200 rounded-xl py-6 text-center text-xs text-slate-400">
      {text}
    </div>
  )
}

// ── Layer 1: 資產現況 ─────────────────────────────────────────

function Layer1({ client }: { client: ClientProfile }) {
  const nw = useMemo(() => netWorth(client), [client])
  const totalInv = useMemo(() => totalAssets(client), [client])
  const totalLiab = useMemo(() => totalLiabilities(client), [client])
  const alloc = useMemo(() => calcAssetAllocation(client), [client])

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

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="淨資產" value={fmtNTD(nw, true)} color={nw >= 0 ? 'blue' : 'red'} />
        <StatCard label="總資產" value={fmtNTD(totalInv, true)} color="green" />
        <StatCard label="總負債" value={fmtNTD(totalLiab, true)} color={totalLiab > 0 ? 'red' : 'green'} />
        <div className={`rounded-xl p-3 border ${alloc.isConcentrated ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="text-xs text-slate-400 mb-1">最大單一持倉</div>
          {alloc.topHolding ? (
            <>
              <div className="text-base font-bold text-slate-700">{fmtPct(alloc.topHolding.pct)}</div>
              <div className="text-xs text-slate-400 truncate">{alloc.topHolding.label}</div>
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
          <SectionTitle>資產分布 · 總計 {fmtNTD(totalInv, true)}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-center text-slate-400 mb-2 font-medium">資產類別</div>
              <div className="h-44"><Pie data={catPie} options={PIE_OPTS} /></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-center text-slate-400 mb-2 font-medium">幣別分布</div>
              <div className="h-44"><Pie data={curPie} options={PIE_OPTS} /></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-center text-slate-400 mb-2 font-medium">資產用途</div>
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
                <span className="font-medium text-emerald-700 shrink-0 ml-2">{fmtNTD(item.amount, true)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 負債明細 */}
      {client.liabilityItems.length > 0 && (
        <div>
          <SectionTitle>負債明細 · 總計 {fmtNTD(totalLiab, true)}</SectionTitle>
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
                    <span className="font-medium text-red-700">{fmtNTD(item.amount, true)}</span>
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
                    <span className="font-medium text-orange-700">{fmtNTD(item.amount, true)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Layer 2: 資產變化 ─────────────────────────────────────────

function WaterfallRow({
  label, amount, isTotal = false, isSubtract = false,
}: { label: string; amount: number; isTotal?: boolean; isSubtract?: boolean }) {
  const effectiveAmount = isSubtract ? -amount : amount
  const isPositive = effectiveAmount >= 0
  const colorClass = isTotal
    ? 'font-bold text-slate-800'
    : isPositive ? 'text-emerald-600' : 'text-red-500'
  const prefix = isTotal ? '' : isPositive ? '+ ' : '– '
  const displayAmount = isTotal ? fmtNTD(amount, true) : fmtNTD(Math.abs(effectiveAmount), true)

  return (
    <div className={`flex justify-between py-1.5 px-3 rounded text-sm ${isTotal ? 'bg-slate-100 mt-1' : ''}`}>
      <span className={isTotal ? 'font-semibold text-slate-700' : 'text-slate-500'}>{label}</span>
      <span className={colorClass}>{prefix}{displayAmount}</span>
    </div>
  )
}

function Layer2({ client }: { client: ClientProfile }) {
  const change = useMemo(() => calcAssetPeriodChange(client), [client])

  if (!change) {
    return (
      <EmptyHint text="尚未設定期初快照 · 請在「財務狀況」→「期間比較」填入資料，即可顯示本期資產變化拆解" />
    )
  }

  const changePctText = `${change.totalChangePct >= 0 ? '+' : ''}${fmtPct(change.totalChangePct)}`

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 mb-3">期間：{change.periodLabel}</div>
      <WaterfallRow label="期初總資產" amount={change.openingAssets} isTotal />
      <div className="pl-2 space-y-0.5 border-l-2 border-slate-200 ml-3 py-1">
        <WaterfallRow label="淨投入" amount={change.netContribution} />
        <WaterfallRow label="投資損益" amount={change.investmentGain} />
        <WaterfallRow label="配息 / 利息" amount={change.dividendIncome} />
        <WaterfallRow label="匯率影響" amount={change.fxImpact} />
        <WaterfallRow label="費用 / 稅務" amount={change.fees} isSubtract />
      </div>
      <WaterfallRow label="期末總資產" amount={change.closingAssets} isTotal />
      <div className="flex justify-between px-3 pt-1 text-xs text-slate-400">
        <span>本期總變動</span>
        <span className={change.totalChange >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
          {change.totalChange >= 0 ? '+' : ''}{fmtNTD(change.totalChange, true)} （{changePctText}）
        </span>
      </div>
    </div>
  )
}

// ── Layer 3: 配置偏離 ─────────────────────────────────────────

function Layer3({ client }: { client: ClientProfile }) {
  const deviation = useMemo(() => calcAssetDeviation(client), [client])

  if (!deviation.hasTargets) {
    return (
      <EmptyHint text="尚未設定目標配置 · 請在「投資偏好」→「目標配置」設定各類別目標百分比" />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
        <span>容許區間：±{client.toleranceBand}%</span>
        {deviation.needsRebalance && (
          <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded font-medium">建議再平衡</span>
        )}
      </div>

      {/* 偏離表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
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
                <td className="text-right text-slate-400">{fmtPct(item.targetPct)}</td>
                <td className="text-right text-slate-600">{fmtPct(item.actualPct)}</td>
                <td className={`text-right font-medium ${item.deviation > 0 ? 'text-orange-500' : item.deviation < 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                  {item.deviation >= 0 ? '+' : ''}{fmtPct(item.deviation)}
                </td>
                <td className={`text-right pr-2 ${item.deviationAmount > 0 ? 'text-orange-500' : item.deviationAmount < 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                  {item.deviationAmount >= 0 ? '+' : ''}{fmtNTD(item.deviationAmount, true)}
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
                {fmtNTD(Math.abs(item.deviationAmount), true)}（偏離 {Math.abs(item.deviation).toFixed(1)}%）
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 主元件 ───────────────────────────────────────────────────

export function AssetReport({ client }: { client: ClientProfile }) {
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

      {activeLayer === 1 && <Layer1 client={client} />}
      {activeLayer === 2 && <Layer2 client={client} />}
      {activeLayer === 3 && <Layer3 client={client} />}
    </div>
  )
}
