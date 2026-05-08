import { useMemo, useState } from 'react'
import { Bar, Line, Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
  PointElement, LineElement,
} from 'chart.js'
import type { ClientProfile } from '../../types/client'
import { INCOME_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from '../../types/client'
import type { IncomeType, ExpenseCategory } from '../../types/client'
import { calcCashFlow, calcCashFlowProjection, calcMonthlyTimeline, fmtNTD, fmtPct } from '../../utils/calculations'
import { StatCard } from './StatCard'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement)

const INCOME_TYPE_COLORS: Record<IncomeType, string> = {
  fixed: 'bg-blue-100 text-blue-700',
  variable: 'bg-orange-100 text-orange-700',
  one_time: 'bg-slate-100 text-slate-600',
}

const EXPENSE_CAT_COLORS: Record<ExpenseCategory, string> = {
  survival:       'bg-red-100 text-red-700',
  responsibility: 'bg-orange-100 text-orange-700',
  quality:        'bg-violet-100 text-violet-700',
  growth:         'bg-emerald-100 text-emerald-700',
  hidden:         'bg-slate-100 text-slate-600',
  one_time:       'bg-amber-100 text-amber-700',
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

export function CashFlowReport({ client }: { client: ClientProfile }) {
  const cf = useMemo(() => calcCashFlow(client), [client])
  const projection = useMemo(() => calcCashFlowProjection(client), [client])
  const timeline = useMemo(() => calcMonthlyTimeline(client), [client])

  const { expenseByCategory: ec, incomeByType: it } = cf

  // 三流瀑布圖：固定收入 → 生存 → 責任 → [真實] → 生活品質 → 成長 → [可投資]
  const waterfallLabels = [
    '固定收入',
    '生存支出', '責任支出',
    '真實現金流',
    '生活品質', '成長支出',
    '可投資現金流',
  ]
  const waterfallValues = [
    it.fixed,
    -ec.survival,
    -ec.responsibility,
    cf.trueNetCashFlow,
    -ec.quality,
    -ec.growth,
    cf.investibleCashFlow,
  ]
  const waterfallColors = waterfallValues.map((_, i) => {
    if (i === 0) return '#3b82f6'                          // 固定收入 — blue
    if (i === 3) return cf.trueNetCashFlow >= 0 ? '#10b981' : '#ef4444'   // 真實
    if (i === 6) return cf.investibleCashFlow >= 0 ? '#8b5cf6' : '#ef4444' // 可投資
    return '#f59e0b'                                        // 扣除項 — orange
  })

  const barData = {
    labels: waterfallLabels,
    datasets: [{
      label: '金額',
      data: waterfallValues,
      backgroundColor: waterfallColors,
      borderRadius: 6,
    }],
  }

  const barOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: (v: number | string) => fmtNTD(Number(v), true) } },
    },
  }

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">收支分析</h2>

      {/* KPI：三種現金流 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="帳面現金流"
          value={fmtNTD(cf.netCashFlow, true)}
          color={cf.netCashFlow >= 0 ? 'blue' : 'red'}
        />
        <StatCard
          label="真實現金流"
          value={fmtNTD(cf.trueNetCashFlow, true)}
          color={cf.trueNetCashFlow >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="可投資現金流"
          value={fmtNTD(cf.investibleCashFlow, true)}
          color={cf.investibleCashFlow >= 0 ? 'purple' : 'red'}
        />
      </div>

      {/* 三流瀑布圖 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-3">
          逐層扣除：固定收入 → 真實現金流 → 可投資現金流
        </h3>
        <div className="h-64">
          <Bar data={barData} options={barOpts as never} />
        </div>
      </div>

      {/* 財務健康指標 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-3">財務健康指標</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-1">收入穩定性</div>
            <div className={`text-lg font-bold ${
              cf.incomeStabilityRatio >= 70 ? 'text-emerald-600'
              : cf.incomeStabilityRatio >= 40 ? 'text-amber-500'
              : 'text-red-500'
            }`}>
              {fmtPct(cf.incomeStabilityRatio)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">固定收入佔比</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-1">固定支出比</div>
            <div className="text-lg font-bold text-slate-700">
              {fmtPct(cf.fixedExpenseRatio)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">生存＋責任 ÷ 總收入</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-1">低意識支出比</div>
            <div className="text-lg font-bold text-slate-700">
              {fmtPct(cf.hiddenExpenseRatio)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">隱性支出 ÷ 總支出</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-1">月投入比</div>
            <div className="text-lg font-bold text-blue-600">
              {cf.investibleCashFlow > 0
                ? fmtPct(client.monthlyContribution / cf.investibleCashFlow * 100)
                : '–'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">月定期投入 ÷ 可投資</div>
          </div>
        </div>
      </div>

      {/* 5年現金流 Projection */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-3">
          5年現金流趨勢（通膨 {fmtPct(client.globalInflationRate * 100)}）
        </h3>
        <div className="h-56 mb-4">
          <Line
            data={{
              labels: projection.map(p => String(p.year)),
              datasets: [
                {
                  label: '帳面',
                  data: projection.map(p => p.net),
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59,130,246,0.08)',
                  tension: 0.3,
                  pointRadius: 3,
                },
                {
                  label: '真實',
                  data: projection.map(p => p.true_),
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  tension: 0.3,
                  pointRadius: 3,
                },
                {
                  label: '可投資',
                  data: projection.map(p => p.investible),
                  borderColor: '#8b5cf6',
                  backgroundColor: 'rgba(139,92,246,0.08)',
                  tension: 0.3,
                  pointRadius: 3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
              scales: { y: { ticks: { callback: (v: number | string) => fmtNTD(Number(v), true) } } },
            } as never}
          />
        </div>
        {/* 年度表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-1.5 pr-3 font-semibold text-slate-400">年份</th>
                <th className="text-right py-1.5 pr-3 font-semibold text-slate-400">總收入</th>
                <th className="text-right py-1.5 pr-3 font-semibold text-blue-400">帳面</th>
                <th className="text-right py-1.5 pr-3 font-semibold text-emerald-500">真實</th>
                <th className="text-right py-1.5 font-semibold text-violet-500">可投資</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((p, i) => (
                <tr key={p.year} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                  <td className="py-1.5 pr-3 font-medium">{p.year}{i === 0 ? ' (現在)' : ''}</td>
                  <td className="text-right py-1.5 pr-3">{fmtNTD(p.totalIncome, true)}</td>
                  <td className="text-right py-1.5 pr-3 text-blue-600">{fmtNTD(p.net, true)}</td>
                  <td className="text-right py-1.5 pr-3 text-emerald-600">{fmtNTD(p.true_, true)}</td>
                  <td className="text-right py-1.5 text-violet-600">{fmtNTD(p.investible, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 收入明細 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">收入明細</h3>
        <div className="space-y-1">
          {client.incomes.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${INCOME_TYPE_COLORS[item.type]}`}>
                  {INCOME_TYPE_LABELS[item.type]}
                </span>
                <span className="text-slate-700">{item.label}</span>
                {item.growthRate !== undefined && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    +{fmtPct(item.growthRate * 100)}/年
                  </span>
                )}
                <NoteTag note={item.note} />
              </div>
              <span className="font-medium text-blue-700">
                {fmtNTD(item.amount, true)}
                {item.frequency && item.frequency !== 'monthly' && (
                  <span className="text-xs text-violet-500 font-normal ml-1">
                    /{item.frequency === 'quarterly' ? '季' : '年'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 支出明細 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">支出明細</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {client.expenses.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${EXPENSE_CAT_COLORS[e.category]}`}>
                  {EXPENSE_CATEGORY_LABELS[e.category]}
                </span>
                <span className="text-slate-600">{e.label}</span>
                <NoteTag note={e.note} />
              </div>
              <span className="font-medium text-slate-700">
                {fmtNTD(e.amount, true)}
                {e.frequency && e.frequency !== 'monthly' && (
                  <span className="text-xs text-orange-400 font-normal ml-1">
                    /{e.frequency === 'quarterly' ? '季' : '年'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 現金流時序分析 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-3">現金流時序分析</h3>

        {/* KPI 摘要列 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 text-sm">
            <span className="text-slate-400 text-xs">低谷月份</span>
            {timeline.crunchMonths.length === 0
              ? <span className="text-emerald-600 font-medium text-xs">無</span>
              : <span className="text-red-600 font-medium text-xs">{timeline.crunchMonths.map(m => `${m}月`).join('、')}</span>
            }
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 text-sm">
            <span className="text-slate-400 text-xs">需要周轉</span>
            {timeline.needsBridging
              ? <span className="text-red-600 font-medium text-xs">⚠ 是（{timeline.crunchMonths.length} 個月）</span>
              : <span className="text-emerald-600 font-medium text-xs">✓ 不需要</span>
            }
          </div>
          {timeline.worstMonth && (
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 text-sm">
              <span className="text-slate-400 text-xs">最大缺口</span>
              <span className="text-red-600 font-medium text-xs">
                {timeline.worstMonth.month}月（−{fmtNTD(timeline.worstMonth.deficit, true)}）
              </span>
            </div>
          )}
          {timeline.incomeSpread > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 text-sm">
              <span className="text-slate-400 text-xs">收入波動幅度</span>
              <span className="text-amber-600 font-medium text-xs">{fmtNTD(timeline.incomeSpread, true)}</span>
            </div>
          )}
        </div>

        {/* 12個月混合圖表 */}
        <div className="h-64">
          <Chart
            type="bar"
            data={{
              labels: timeline.months.map(m => `${m.month}月`),
              datasets: [
                {
                  type: 'bar' as const,
                  label: '月收入',
                  data: timeline.months.map(m => m.income),
                  backgroundColor: 'rgba(16,185,129,0.65)',
                  borderRadius: 4,
                  order: 2,
                },
                {
                  type: 'bar' as const,
                  label: '月支出',
                  data: timeline.months.map(m => m.expense),
                  backgroundColor: timeline.months.map(m =>
                    m.isCrunch ? 'rgba(239,68,68,0.8)' : 'rgba(251,191,36,0.65)'
                  ),
                  borderRadius: 4,
                  order: 2,
                },
                {
                  type: 'line' as const,
                  label: '淨現金流',
                  data: timeline.months.map(m => m.net),
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59,130,246,0.08)',
                  tension: 0.3,
                  pointRadius: 4,
                  pointBackgroundColor: timeline.months.map(m => m.isCrunch ? '#ef4444' : '#3b82f6'),
                  borderWidth: 2,
                  fill: false,
                  order: 1,
                },
              ],
            } as never}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { font: { size: 11 } } },
              },
              scales: {
                y: { ticks: { callback: (v: number | string) => fmtNTD(Number(v), true) } },
              },
            } as never}
          />
        </div>
      </div>
    </div>
  )
}
