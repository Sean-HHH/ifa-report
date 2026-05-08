import { useMemo } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import type { ClientProfile } from '../../types/client'
import { calcRetirement, fmtNTD, fmtPct } from '../../utils/calculations'
import { StatCard } from './StatCard'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export function RetirementReport({ client }: { client: ClientProfile }) {
  const r = useMemo(() => calcRetirement(client), [client])
  const isOnTrack = r.gap <= 0

  const gapData = {
    labels: ['目標退休金', '預計累積'],
    datasets: [{
      label: '金額',
      data: [r.targetAsset, r.projectedAssetBase],
      backgroundColor: ['#ef4444', r.projectedAssetBase >= r.targetAsset ? '#10b981' : '#3b82f6'],
      borderRadius: 8,
    }],
  }

  const withdrawLabels = r.withdrawalYears.map(d => `${d.age}歲`)
  const withdrawData = {
    labels: withdrawLabels,
    datasets: [{
      label: '退休資產',
      data: r.withdrawalYears.map(d => Math.max(d.base, 0)),
      borderColor: r.withdrawalYears[r.withdrawalYears.length - 1]?.base <= 0 ? '#ef4444' : '#10b981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderWidth: 2,
      tension: 0.3,
      fill: 'origin',
    }],
  }

  const axisOpts = {
    y: { ticks: { callback: (v: number | string) => fmtNTD(Number(v), true) } },
  }

  const depleted = r.withdrawalYears.findIndex(d => d.base <= 0)
  const depletedAge = depleted >= 0 ? r.withdrawalYears[depleted].age : null

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">退休規劃</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="距退休年數" value={`${r.yearsToRetirement} 年`} color="blue" />
        <StatCard label="退休缺口" value={r.gap > 0 ? fmtNTD(r.gap, true) : '已達標 ✓'}
          sub={isOnTrack ? undefined : '需補足金額'}
          color={isOnTrack ? 'green' : 'red'} />
        <StatCard label="需額外月儲蓄" value={r.requiredMonthlySavings > 0 ? fmtNTD(r.requiredMonthlySavings, true) : '不需額外'}
          color={r.requiredMonthlySavings > 0 ? 'orange' : 'green'} />
        <StatCard label="建議提領率" value={fmtPct(r.suggestedWithdrawalRate * 100)}
          sub={r.suggestedWithdrawalRate > 0.05 ? '偏高，建議 < 5%' : '健康範圍'}
          color={r.suggestedWithdrawalRate > 0.05 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">目標 vs 預計退休資產</h3>
          <div className="h-56">
            <Bar data={gapData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: axisOpts as never }} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">退休後提領模擬（30年）</h3>
          <div className="h-56">
            <Line data={withdrawData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: axisOpts as never }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-slate-500 mb-1">目標月退休現金流</div>
          <div className="text-xl font-bold text-slate-800">{fmtNTD(client.targetMonthlyRetirementIncome, true)}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-slate-500 mb-1">所需退休資金（25×）</div>
          <div className="text-xl font-bold text-slate-800">{fmtNTD(r.targetAsset, true)}</div>
        </div>
        <div className={`rounded-xl p-4 ${depletedAge ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <div className={`mb-1 ${depletedAge ? 'text-red-500' : 'text-emerald-500'}`}>資產耗盡時間</div>
          <div className={`text-xl font-bold ${depletedAge ? 'text-red-700' : 'text-emerald-700'}`}>
            {depletedAge ? `${depletedAge} 歲` : '30年後仍有餘'}
          </div>
        </div>
      </div>

      {!isOnTrack && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-700 mb-1">建議行動</div>
          <ul className="text-sm text-amber-600 space-y-1 list-disc list-inside">
            <li>每月額外儲蓄 {fmtNTD(r.requiredMonthlySavings, true)} 可填補缺口</li>
            <li>考慮提高投資組合的風險配置以爭取更高報酬</li>
            <li>延後退休年齡或降低月退休現金流目標亦可縮小缺口</li>
          </ul>
        </div>
      )}
    </div>
  )
}
