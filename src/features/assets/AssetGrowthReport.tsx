import { useMemo } from 'react'
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ReferenceDot, ResponsiveContainer,
} from 'recharts'
import type { ClientProfile } from '../../types/client'
import { calcAssetGrowth, convertCurrency, fmtAmount, fmtPct } from '../../utils/calculations'
import { RISK_RETURN, calcCurrentAge } from '../../types/client'
import type { FxRates } from '../fx/exchangeRate'
import { StatCard } from '../../shared/StatCard'
import { SectionTitle } from '../../shared/SectionTitle'
import { ChartTooltip } from '../../shared/chartUtils'
import { CHART_TICK_STYLE, CHART_GRID_COLOR } from '../../shared/chartConstants'

export function AssetGrowthReport({ client, rates: fxRates, reportCurrency }: { client: ClientProfile; rates: FxRates; reportCurrency: string }) {
  const yearsToRetirement = Math.max(client.retirementAge - calcCurrentAge(client.birthYear), 1)
  const data = useMemo(
    () => calcAssetGrowth(client, yearsToRetirement + 1, fxRates),
    [client, yearsToRetirement, fxRates],
  )
  const rates = RISK_RETURN[client.riskProfile]
  const displayRates = client.customReturnRate != null
    ? {
        conservative: client.customReturnRate * 0.8,
        base: client.customReturnRate,
        aggressive: client.customReturnRate * 1.2,
      }
    : rates
  const nw = useMemo(() => data[0]?.base ?? 0, [data])
  const rc = (n: number) => convertCurrency(n, 'TWD', reportCurrency, fxRates)
  const disp = (n: number) => fmtAmount(rc(n), reportCurrency)

  const warnings = useMemo(() => data.filter(d => d.liquidityWarning), [data])

  const lineData = data.map(d => ({
    label: `${d.year}/${d.age}歲`,
    積極情境: d.aggressive,
    基準情境: d.base,
    保守情境: d.conservative,
    累積本金: nw + d.contributed,
  }))

  const last = data[data.length - 1]

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">資產成長路徑</h2>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={`保守情境 (${fmtPct(displayRates.conservative * 100)})`} value={disp(last?.conservative ?? 0)} color="orange" />
        <StatCard label={`基準情境 (${fmtPct(displayRates.base * 100)})`} value={disp(last?.base ?? 0)} color="blue" />
        <StatCard label={`積極情境 (${fmtPct(displayRates.aggressive * 100)})`} value={disp(last?.aggressive ?? 0)} color="green" />
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
            <XAxis dataKey="label" tick={CHART_TICK_STYLE} interval="preserveStartEnd" />
            <YAxis tickFormatter={v => disp(Number(v))} tick={CHART_TICK_STYLE} width={72} />
            <Tooltip content={<ChartTooltip formatter={v => disp(v)} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            <Line type="monotone" dataKey="積極情境" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="基準情境" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="保守情境" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="累積本金" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            {warnings.map(w => (
              <ReferenceDot
                key={w.year}
                x={`${w.year}/${w.age}歲`}
                y={w.base}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
          <div className="text-sm text-slate-500 mb-1">退休年齡</div>
          <div className="text-2xl font-bold text-slate-800">{client.retirementAge} 歲</div>
          <div className="text-slate-400 text-xs mt-1">距今 {client.retirementAge - calcCurrentAge(client.birthYear)} 年</div>
        </div>
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
          <div className="text-sm text-slate-500 mb-1">每月定期投入</div>
          <div className="text-2xl font-bold text-slate-800">{disp(client.monthlyContribution)}</div>
          <div className="text-slate-400 text-xs mt-1">年化 {disp(client.monthlyContribution * 12)}</div>
        </div>
      </div>

      {/* 投影假設說明 */}
      <div className="text-xs text-slate-400 bg-white border border-slate-100 rounded-lg px-3 py-2 space-y-0.5">
        <div>投資組合（不含不動產）報酬率：{client.customReturnRate != null ? fmtPct(client.customReturnRate * 100) + '（自訂）' : `${fmtPct(rates.conservative * 100)} / ${fmtPct(rates.base * 100)} / ${fmtPct(rates.aggressive * 100)}（依風險偏好）`}</div>
        <div>不動產年化增值率：{fmtPct(((client.realEstateReturnRate ?? client.globalInflationRate) * 100))} · 通膨率：{fmtPct(client.globalInflationRate * 100)}</div>
      </div>

      {client.majorExpenses.length > 0 && (
        <div>
          <SectionTitle>重大支出時程</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">名稱</th>
                  <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide w-16">年份</th>
                  <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">金額</th>
                </tr>
              </thead>
              <tbody>
                {client.majorExpenses.map((e, i) => {
                  const yr = data.find(d => d.year === e.year)
                  const isWarning = yr?.liquidityWarning ?? false
                  return (
                    <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${isWarning ? 'bg-red-50/40' : ''}`}>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          {isWarning && <span className="text-red-500 text-xs shrink-0">⚠</span>}
                          <span className="font-medium text-slate-700">{e.label}</span>
                        </div>
                        {isWarning && (
                          <div className="text-xs text-red-500 mt-0.5">流動性不足警示</div>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-500 align-top whitespace-nowrap">
                        {e.year}{e.month ? ` / ${e.month}月` : ''}
                      </td>
                      <td className="py-2.5 text-right font-medium text-red-600 align-top">−{disp(e.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                <div className="text-red-600">需支出 {disp(w.warningExpense)}</div>
                <div className="text-slate-400">液態淨值約 {disp(w.liquidBase)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
