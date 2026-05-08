import { useMemo, useState } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js'
import type { ClientProfile } from '../../types/client'
import { calcCashFlow, fmtNTD, fmtPct } from '../../utils/calculations'
import { StatCard } from './StatCard'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f43f5e']

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

  const incomeData = {
    labels: client.incomes.map(i => i.label),
    datasets: [{
      data: client.incomes.map(i => i.amount),
      backgroundColor: COLORS,
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const expenseCats = [
    ...client.expenses.filter(e => e.type === 'fixed'),
    ...client.expenses.filter(e => e.type === 'variable'),
  ]

  const waterfallLabels = ['月收入', ...expenseCats.map(e => e.label), '淨結餘']
  const waterfallValues = [cf.totalIncome, ...expenseCats.map(e => -e.amount), cf.netCashFlow]

  const barData = {
    labels: waterfallLabels,
    datasets: [{
      label: '金額',
      data: waterfallValues,
      backgroundColor: waterfallValues.map((v, i) => {
        if (i === 0) return '#3b82f6'
        if (i === waterfallValues.length - 1) return v >= 0 ? '#10b981' : '#ef4444'
        return '#f1a500'
      }),
      borderRadius: 6,
    }],
  }

  const barOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (v: number | string) => fmtNTD(Number(v), true) } } },
  }

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">收支分析</h2>

      {/* 指標卡 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="儲蓄率" value={fmtPct(cf.savingsRate)} color={cf.savingsRate >= 20 ? 'green' : 'orange'} />
        <StatCard label="月淨現金流" value={fmtNTD(cf.netCashFlow, true)} color={cf.netCashFlow >= 0 ? 'blue' : 'red'} />
        <StatCard label="年化儲蓄" value={fmtNTD(cf.annualSavings, true)} color="purple" />
      </div>

      {/* 圖表：收入圓餅 + 瀑布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">收入來源分佈</h3>
          <div className="h-52 flex items-center justify-center">
            <Pie data={incomeData} options={{ responsive: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">月現金流瀑布</h3>
          <div className="h-52">
            <Bar data={barData} options={barOpts as never} />
          </div>
        </div>
      </div>

      {/* 收入明細 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">收入明細</h3>
        <div className="space-y-1">
          {client.incomes.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
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
          {expenseCats.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{e.label}</span>
                <NoteTag note={e.note} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${e.type === 'fixed' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                  {e.type === 'fixed' ? '固定' : '變動'}
                </span>
                <span className="font-medium text-slate-700">{fmtNTD(e.amount, true)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
