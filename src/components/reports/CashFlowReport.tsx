import { useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js'
import type { ClientProfile } from '../../types/client'
import { INCOME_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from '../../types/client'
import type { IncomeType, ExpenseCategory } from '../../types/client'
import { calcCashFlow, fmtNTD } from '../../utils/calculations'
import { StatCard } from './StatCard'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

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
                <NoteTag note={item.note} />
              </div>
              <span className="font-medium text-blue-700">{fmtNTD(item.amount, true)}</span>
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
              <span className="font-medium text-slate-700">{fmtNTD(e.amount, true)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
