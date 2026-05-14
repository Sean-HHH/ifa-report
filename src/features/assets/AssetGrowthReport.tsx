import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import type { ClientProfile } from '../../types/client'
import { calcAssetGrowth, convertCurrency, fmtAmount, fmtPct, netWorth } from '../../utils/calculations'
import { RISK_RETURN, calcCurrentAge } from '../../types/client'
import type { FxRates } from '../fx/exchangeRate'
import { StatCard } from '../../shared/StatCard'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export function AssetGrowthReport({ client, rates: fxRates, reportCurrency }: { client: ClientProfile; rates: FxRates; reportCurrency: string }) {
  const data = useMemo(() => calcAssetGrowth(client), [client])
  const rates = RISK_RETURN[client.riskProfile]
  const nw = useMemo(() => netWorth(client), [client])
  const rc = (n: number) => convertCurrency(n, 'TWD', reportCurrency, fxRates)
  const disp = (n: number, compact = false) => fmtAmount(rc(n), reportCurrency, compact)

  const warnings = useMemo(() => data.filter(d => d.liquidityWarning), [data])

  const labels = data.map(d => `${d.year} / ${d.age}歲`)
  const contributed = data.map(d => nw + d.contributed)

  // 警示年份在圖上打紅點（基準情境線上）
  const warningPoints = data.map(d => d.liquidityWarning ? d.base : NaN)

  const chartData = {
    labels,
    datasets: [
      {
        label: '積極情境',
        data: data.map(d => d.aggressive),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
      },
      {
        label: '基準情境',
        data: data.map(d => d.base),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth: 2.5,
        tension: 0.3,
        fill: '-1',
      },
      {
        label: '保守情境',
        data: data.map(d => d.conservative),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
      },
      {
        label: '累積本金',
        data: contributed,
        borderColor: '#cbd5e1',
        backgroundColor: 'rgba(203,213,225,0.15)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        tension: 0.3,
        fill: 'origin',
      },
      ...(warnings.length > 0 ? [{
        label: '流動性警示',
        data: warningPoints,
        borderColor: 'transparent',
        backgroundColor: '#ef4444',
        borderWidth: 0,
        pointRadius: 7,
        pointHoverRadius: 9,
        tension: 0,
        fill: false,
        showLine: false,
      }] : []),
    ],
  }

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }, parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${disp(ctx.parsed.y, true)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v: number | string) => disp(Number(v), true) },
      },
    },
  }

  const last = data[data.length - 1]

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">資產成長路徑</h2>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={`保守情境 (${fmtPct(rates.conservative * 100)})`} value={disp(last?.conservative ?? 0, true)} color="orange" />
        <StatCard label={`基準情境 (${fmtPct(rates.base * 100)})`} value={disp(last?.base ?? 0, true)} color="blue" />
        <StatCard label={`積極情境 (${fmtPct(rates.aggressive * 100)})`} value={disp(last?.aggressive ?? 0, true)} color="green" />
      </div>

      <div className="h-80">
        <Line data={chartData} options={options as never} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-sm text-slate-500 mb-1">退休年齡</div>
          <div className="text-2xl font-bold text-slate-800">{client.retirementAge} 歲</div>
          <div className="text-slate-500 text-xs mt-1">距今 {client.retirementAge - calcCurrentAge(client.birthYear)} 年</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-sm text-slate-500 mb-1">每月定期投入</div>
          <div className="text-2xl font-bold text-slate-800">{disp(client.monthlyContribution, true)}</div>
          <div className="text-slate-500 text-xs mt-1">年化 {disp(client.monthlyContribution * 12, true)}</div>
        </div>
      </div>

      {/* 投影假設說明 */}
      <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 space-y-0.5">
        <div>投資組合（不含不動產）報酬率：{client.customReturnRate != null ? fmtPct(client.customReturnRate * 100) + '（自訂）' : `${fmtPct(rates.conservative * 100)} / ${fmtPct(rates.base * 100)} / ${fmtPct(rates.aggressive * 100)}（依風險偏好）`}</div>
        <div>不動產年化增值率：{fmtPct(((client.realEstateReturnRate ?? client.globalInflationRate) * 100))}　·　通膨率：{fmtPct(client.globalInflationRate * 100)}</div>
      </div>

      {client.majorExpenses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">重大支出時程</h3>
          <div className="space-y-1">
            {client.majorExpenses.map((e, i) => {
              const yr = data.find(d => d.year === e.year)
              const isWarning = yr?.liquidityWarning ?? false
              return (
                <div key={i} className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${isWarning ? 'bg-red-100 border border-red-200' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    {isWarning && <span className="text-red-500 font-bold text-xs">⚠</span>}
                    <span className="text-red-700">{e.label}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500">{e.year} 年</span>
                    <span className="font-medium text-red-700">-{disp(e.amount, true)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 流動性警示區塊 */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <span>⚠ 流動性不足警示</span>
          </div>
          <div className="text-xs text-red-600 leading-relaxed">
            以下年度的重大支出超過預估液態資產（流動現金 + 投資，不含不動產）。即使總資產帳面足夠，實際執行仍需出售不動產或調整支出計畫。
          </div>
          {warnings.map(w => (
            <div key={w.year} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-red-100">
              <span className="text-red-700 font-medium">{w.year} 年（{w.age} 歲）</span>
              <div className="text-right text-xs">
                <div className="text-red-600">需支出 {disp(w.warningExpense, true)}</div>
                <div className="text-slate-400">液態淨值約 {disp(w.liquidBase, true)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
