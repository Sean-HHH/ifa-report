import { useMemo } from 'react'
import {
  BarChart, Bar, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Cell,
  ResponsiveContainer,
} from 'recharts'
import type { ClientProfile } from '../../types/client'
import { RISK_RETURN } from '../../types/client'
import { calcRetirement, convertCurrency, fmtAmount, fmtPct } from '../../utils/calculations'
import type { FxRates } from '../fx/exchangeRate'
import { StatCard } from '../../shared/StatCard'
import { SectionTitle } from '../../shared/SectionTitle'
import { ChartTooltip } from '../../shared/chartUtils'
import { CHART_TICK_STYLE, CHART_GRID_COLOR } from '../../shared/chartConstants'

export function RetirementReport({ client, rates, reportCurrency }: { client: ClientProfile; rates: FxRates; reportCurrency: string }) {
  const rc = (n: number) => convertCurrency(n, 'TWD', reportCurrency, rates)
  const disp = (n: number, compact = false) => fmtAmount(rc(n), reportCurrency, compact)
  const r = useMemo(() => calcRetirement(client), [client])
  const isOnTrack = r.gap <= 0

  const gapBarData = [
    { name: '目標退休資產', value: r.targetAsset, fill: '#ef4444' },
    { name: '可提領資產', value: r.projectedUsableBase, fill: r.projectedUsableBase >= r.targetAsset ? '#10b981' : '#3b82f6' },
  ]

  const lastBase = r.withdrawalYears[r.withdrawalYears.length - 1]?.liquidBase ?? 0
  const withdrawLineData = r.withdrawalYears.map(d => ({
    age: `${d.age}歲`,
    流動資產: Math.max(d.liquidBase, 0),
  }))
  const withdrawLineColor = lastBase <= 0 ? '#ef4444' : '#10b981'
  const withdrawFill = lastBase <= 0 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.08)'

  const depleted = r.withdrawalYears.findIndex(d => d.liquidBase <= 0)
  const depletedAge = depleted >= 0 ? r.withdrawalYears[depleted].age : null
  const survives = depletedAge === null || depletedAge >= r.targetEndAge

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">退休規劃</h2>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="距退休年數" value={`${r.yearsToRetirement} 年`} color="blue" />
        <StatCard
          label="退休缺口"
          value={r.gap > 0 ? disp(r.gap, true) : '已達標 ✓'}
          sub={isOnTrack ? undefined : '需補足金額（名目值）'}
          color={isOnTrack ? 'green' : 'red'}
        />
        <StatCard
          label="需額外月儲蓄"
          value={r.requiredMonthlySavings > 0 ? disp(r.requiredMonthlySavings) : '不需額外'}
          color={r.requiredMonthlySavings > 0 ? 'orange' : 'green'}
        />
        <StatCard
          label="建議提領率"
          value={fmtPct(r.suggestedWithdrawalRate * 100)}
          sub={r.suggestedWithdrawalRate > 0.05 ? '偏高，建議 < 5%' : '健康範圍'}
          color={r.suggestedWithdrawalRate > 0.05 ? 'red' : 'green'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SectionTitle>目標 vs 預計退休資產</SectionTitle>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapBarData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                <YAxis tickFormatter={v => disp(Number(v), true)} tick={CHART_TICK_STYLE} width={72} />
                <Tooltip content={<ChartTooltip formatter={v => disp(v, true)} />} />
                <Bar dataKey="value" name="金額" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {gapBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SectionTitle>退休後提領模擬（至 {r.targetEndAge} 歲）</SectionTitle>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={withdrawLineData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                <XAxis dataKey="age" tick={CHART_TICK_STYLE} interval="preserveStartEnd" />
                <YAxis tickFormatter={v => disp(Number(v), true)} tick={CHART_TICK_STYLE} width={72} />
                <Tooltip content={<ChartTooltip formatter={v => disp(v, true)} />} />
                <Area type="monotone" dataKey="流動資產" stroke={withdrawLineColor} fill={withdrawFill} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        {/* 退休資產構成 */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-600">退休時資產來源</div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>流動資產</span>
            <span className="font-medium text-slate-700">{disp(r.projectedLiquidBase, true)}</span>
          </div>
          {r.retirementLumpSum > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>一次性退休金</span>
              <span className="font-medium text-emerald-600">+{disp(r.retirementLumpSum, true)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-semibold border-t border-slate-200 pt-2">
            <span>可用於提領小計</span>
            <span className="text-slate-800">{disp(r.projectedUsableBase, true)}</span>
          </div>
          {r.projectedRealEstateBase > 0 && (
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>不動產（不計入缺口）</span>
              <span>{disp(r.projectedRealEstateBase, true)}</span>
            </div>
          )}
        </div>

        {/* 月現金流拆解 */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-600">月現金流拆解</div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>目標月現金流（今日值）</span>
            <span className="font-medium text-slate-700">{disp(client.targetMonthlyRetirementIncome)}</span>
          </div>
          {r.monthlyPension > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>月退年金（名目固定）</span>
              <span className="font-medium text-emerald-600">−{disp(r.monthlyPension)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-slate-500">
            <span>需自籌概估（今日參考）</span>
            <span className="font-medium text-slate-700">{disp(r.netMonthlyNeeded_today)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold border-t border-slate-200 pt-2">
            <span>退休時需自籌（名目，第 1 年）</span>
            <span className="text-slate-800">{disp(r.netMonthlyNeeded_retirement)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>退休末年需自籌（第 {client.retirementLifespan} 年，通膨調整後）</span>
            <span className="font-medium text-slate-700">{disp(r.netMonthlyNeeded_finalYear)}</span>
          </div>
          {r.netMonthlyNeeded_finalYear > r.netMonthlyNeeded_retirement && (
            <div className="flex justify-between text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              <span>通膨累積差距</span>
              <span className="font-medium">+{disp(r.netMonthlyNeeded_finalYear - r.netMonthlyNeeded_retirement)}</span>
            </div>
          )}
        </div>

        {/* 提領策略 & 壽命 */}
        <div className={`rounded-xl p-4 space-y-2 ${survives ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className={`text-sm font-semibold ${survives ? 'text-emerald-700' : 'text-red-700'}`}>
            資金存活評估
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>目標壽命</span>
            <span className="font-medium">{r.targetEndAge} 歲</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>所需退休資金（年金法）</span>
            <span className="font-medium">{disp(r.targetAsset, true)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>SWR 參考（{fmtPct(r.withdrawalRate * 100)} 法則）</span>
            <span>{disp(r.targetAssetSWR, true)}</span>
          </div>
          <div className={`flex justify-between text-xs font-semibold border-t pt-2 ${survives ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
            <span>流動資金耗盡時間</span>
            <span>{depletedAge ? `${depletedAge} 歲` : `${r.targetEndAge} 歲後仍有餘`}</span>
          </div>
        </div>
      </div>

      {/* 假設說明 */}
      <div className="text-xs text-slate-400 bg-white border border-slate-100 rounded-lg px-3 py-2 space-y-0.5">
        <div>退休後報酬率：{fmtPct(Math.max((client.customReturnRate ?? RISK_RETURN[client.riskProfile].base) - 0.01, 0.02) * 100)}（投資報酬率 −1%，最低 2%） · 通膨率：{fmtPct(client.globalInflationRate * 100)}</div>
        <div>月提領額每年依通膨調升 · 月退年金假設名目固定（不隨通膨調升） · 不動產不計入退休提領</div>
      </div>

      {/* 建議行動 */}
      {!isOnTrack && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-700 mb-1">建議行動</div>
          <ul className="text-sm text-amber-600 space-y-1 list-disc list-inside">
            <li>每月額外儲蓄 {disp(r.requiredMonthlySavings, true)} 可填補缺口</li>
            <li>考慮提高投資組合的風險配置以爭取更高報酬</li>
            <li>延後退休年齡或降低月退休現金流目標亦可縮小缺口</li>
            {r.monthlyPension === 0 && <li>若有勞保月退或其他年金收入，填入後可降低需自籌金額</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
