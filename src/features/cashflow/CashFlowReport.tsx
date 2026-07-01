import { useMemo } from 'react'
import {
  BarChart, Bar, Cell, Line, ComposedChart,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { ClientProfile } from '../../types/client'
import { INCOME_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from '../../types/client'
import type { IncomeType, ExpenseCategory } from '../../types/client'
import { calcCashFlow, calcCashFlowProjection, calcMonthlyTimeline, calcRemainingYearCashFlow, convertCurrency, fmtAmount, fmtPct } from '../../utils/calculations'
import type { FxRates } from '../fx/exchangeRate'
import { StatCard } from '../../shared/StatCard'
import { SectionTitle } from '../../shared/SectionTitle'
import { ChartTooltip } from '../../shared/chartUtils'
import { CHART_TICK_STYLE, CHART_GRID_COLOR } from '../../shared/chartConstants'

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

interface FxProps { rates: FxRates; reportCurrency: string }

export function CashFlowReport({ client, rates, reportCurrency }: { client: ClientProfile } & FxProps) {
  const cf = useMemo(() => calcCashFlow(client), [client])
  const projection = useMemo(() => calcCashFlowProjection(client), [client])
  const timeline = useMemo(() => calcMonthlyTimeline(client), [client])
  const planStartMonth = client.planStartMonth ?? 1
  const isPartialYear = planStartMonth > 1
  const remaining = useMemo(
    () => isPartialYear ? calcRemainingYearCashFlow(client) : null,
    [client, isPartialYear]
  )

  // All income/expense are TWD; convert for display
  const rc = (n: number) => convertCurrency(n, 'TWD', reportCurrency, rates)
  const disp = (n: number, compact = false) => fmtAmount(rc(n), reportCurrency, compact)

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
    if (i === 0) return '#a3e635'                          // 固定收入 — lime
    if (i === 3) return cf.trueNetCashFlow >= 0 ? '#10b981' : '#ef4444'   // 真實
    if (i === 6) return cf.investibleCashFlow >= 0 ? '#8b5cf6' : '#ef4444' // 可投資
    return '#f59e0b'                                        // 扣除項 — orange
  })

  const waterfallData = waterfallLabels.map((label, i) => ({
    label,
    value: waterfallValues[i],
    color: waterfallColors[i],
  }))

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">收支分析</h2>

      {/* KPI：三種現金流 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="帳面現金流"
          value={disp(cf.netCashFlow)}
          color={cf.netCashFlow >= 0 ? 'blue' : 'red'}
        />
        <StatCard
          label="真實現金流"
          value={disp(cf.trueNetCashFlow)}
          color={cf.trueNetCashFlow >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="可投資現金流"
          value={disp(cf.investibleCashFlow)}
          color={cf.investibleCashFlow >= 0 ? 'purple' : 'red'}
        />
      </div>

      {/* 今年剩餘期間（規劃起點 > 1 月時顯示） */}
      {isPartialYear && remaining && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-amber-700">
            今年剩餘期間（{planStartMonth} 月 – 12 月，共 {remaining.remainingMonths} 個月）
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="text-xs text-slate-400 mb-1">剩餘收入合計</div>
              <div className="text-base font-bold text-slate-700">{disp(remaining.remainingTotalIncome, true)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="text-xs text-slate-400 mb-1">剩餘支出合計</div>
              <div className="text-base font-bold text-slate-700">{disp(remaining.remainingTotalExpenses, true)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="text-xs text-slate-400 mb-1">剩餘淨現金流</div>
              <div className={`text-base font-bold ${remaining.remainingNetTotal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {disp(remaining.remainingNetTotal, true)}
              </div>
            </div>
          </div>
          {(remaining.alreadyOccurredExpenses.length > 0 || remaining.alreadyOccurredIncomes.length > 0) && (
            <div className="text-xs text-amber-700 space-y-1">
              {remaining.alreadyOccurredExpenses.length > 0 && (
                <div>
                  <span className="font-medium">今年已發生支出（不計入上方）：</span>
                  {remaining.alreadyOccurredExpenses.join('、')}
                </div>
              )}
              {remaining.alreadyOccurredIncomes.length > 0 && (
                <div>
                  <span className="font-medium">今年已發生收入（不計入上方）：</span>
                  {remaining.alreadyOccurredIncomes.join('、')}
                </div>
              )}
              <div className="text-slate-500">若上半年收入已計入資產餘額，請確認資產欄位無重複。</div>
            </div>
          )}
        </div>
      )}

      {/* 三流瀑布圖 */}
      <div>
        <SectionTitle>逐層扣除：固定收入 → 真實現金流 → 可投資現金流</SectionTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
              <XAxis dataKey="label" tick={CHART_TICK_STYLE} />
              <YAxis tickFormatter={v => disp(Number(v), true)} tick={CHART_TICK_STYLE} width={72} />
              <Tooltip content={<ChartTooltip formatter={v => disp(v, true)} />} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
              <Bar dataKey="value" name="金額" radius={[4, 4, 0, 0]} maxBarSize={52}>
                {waterfallData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 財務健康指標 */}
      <div>
        <SectionTitle>財務健康指標</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
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
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 mb-1">固定支出比</div>
            <div className="text-lg font-bold text-slate-700">
              {fmtPct(cf.fixedExpenseRatio)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">生存＋責任 ÷ 總收入</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 mb-1">低意識支出比</div>
            <div className="text-lg font-bold text-slate-700">
              {fmtPct(cf.hiddenExpenseRatio)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">隱性支出 ÷ 總支出</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 mb-1">月投入比</div>
            <div className="text-lg font-bold" style={{ color: 'var(--color-lime-hover)' }}>
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
        <SectionTitle>5年現金流趨勢（通膨 {fmtPct(client.globalInflationRate * 100)}）</SectionTitle>
        {/* 年度表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-1.5 pr-3 font-semibold text-slate-600">年份</th>
                <th className="text-right py-1.5 pr-3 font-semibold text-slate-600">總收入</th>
                <th className="text-right py-1.5 pr-3 font-semibold text-blue-400">帳面</th>
                <th className="text-right py-1.5 pr-3 font-semibold text-emerald-500">真實</th>
                <th className="text-right py-1.5 font-semibold text-violet-500">可投資</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((p, i) => (
                <tr key={p.year} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                  <td className="py-1.5 pr-3 font-medium">{p.year}{i === 0 ? ' (現在)' : ''}</td>
                  <td className="text-right py-1.5 pr-3">{disp(p.totalIncome, true)}</td>
                  <td className="text-right py-1.5 pr-3 text-blue-600">{disp(p.net, true)}</td>
                  <td className="text-right py-1.5 pr-3 text-emerald-600">{disp(p.true_, true)}</td>
                  <td className="text-right py-1.5 text-violet-600">{disp(p.investible, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 收入明細 */}
      <div>
        <SectionTitle>收入明細</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">名稱</th>
                <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">金額</th>
              </tr>
            </thead>
            <tbody>
              {client.incomes.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="font-medium text-slate-700">{item.label}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${INCOME_TYPE_COLORS[item.type]}`}>
                        {INCOME_TYPE_LABELS[item.type]}
                      </span>
                      {item.growthRate !== undefined && (
                        <span className="text-xs text-emerald-600">+{fmtPct(item.growthRate * 100)}/年</span>
                      )}
                      {item.note && (
                        <span className="text-xs text-slate-400">{item.note}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-700 whitespace-nowrap align-top">
                    {disp(item.amount, true)}
                    {item.frequency && item.frequency !== 'monthly' && (
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        /{item.frequency === 'quarterly' ? '季' : '年'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 支出明細 */}
      <div>
        <SectionTitle>支出明細</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">名稱</th>
                <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">金額</th>
              </tr>
            </thead>
            <tbody>
              {client.expenses.map((e, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="font-medium text-slate-700">{e.label}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${EXPENSE_CAT_COLORS[e.category]}`}>
                        {EXPENSE_CATEGORY_LABELS[e.category]}
                      </span>
                      {e.note && (
                        <span className="text-xs text-slate-400">{e.note}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-700 whitespace-nowrap align-top">
                    {disp(e.amount, true)}
                    {e.frequency && e.frequency !== 'monthly' && (
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        /{e.frequency === 'quarterly' ? '季' : '年'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 現金流時序分析 */}
      <div>
        <SectionTitle>現金流時序分析</SectionTitle>

        {/* KPI 摘要列 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-2 text-sm shadow-sm">
            <span className="text-slate-400 text-xs">低谷月份</span>
            {timeline.crunchMonths.length === 0
              ? <span className="text-emerald-600 font-medium text-xs">無</span>
              : <span className="text-red-600 font-medium text-xs">{timeline.crunchMonths.map(m => `${m}月`).join('、')}</span>
            }
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-2 text-sm shadow-sm">
            <span className="text-slate-400 text-xs">需要周轉</span>
            {timeline.needsBridging
              ? <span className="text-red-600 font-medium text-xs">⚠ 是（{timeline.crunchMonths.length} 個月）</span>
              : <span className="text-emerald-600 font-medium text-xs">✓ 不需要</span>
            }
          </div>
          {timeline.worstMonth && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-2 text-sm shadow-sm">
              <span className="text-slate-400 text-xs">最大缺口</span>
              <span className="text-red-600 font-medium text-xs">
                {timeline.worstMonth.month}月（−{disp(timeline.worstMonth.deficit, true)}）
              </span>
            </div>
          )}
          {timeline.incomeSpread > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-2 text-sm shadow-sm">
              <span className="text-slate-400 text-xs">收入波動幅度</span>
              <span className="text-amber-600 font-medium text-xs">{disp(timeline.incomeSpread, true)}</span>
            </div>
          )}
        </div>

        {/* 12個月混合圖表 */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeline.months.map(m => ({
                month: `${m.month}月`,
                月收入: m.income,
                月支出: m.expense,
                淨現金流: m.net,
                isCrunch: m.isCrunch,
                isPast: m.isPast,
              }))}
              margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
              <XAxis dataKey="month" tick={CHART_TICK_STYLE} />
              <YAxis tickFormatter={v => disp(Number(v), true)} tick={CHART_TICK_STYLE} width={72} />
              <Tooltip content={<ChartTooltip formatter={v => disp(v, true)} />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
              <Bar dataKey="月收入" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {timeline.months.map((m, i) => (
                  <Cell key={i} fill={m.isPast ? 'rgba(148,163,184,0.35)' : 'rgba(16,185,129,0.7)'} />
                ))}
              </Bar>
              <Bar dataKey="月支出" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {timeline.months.map((m, i) => (
                  <Cell key={i} fill={m.isPast ? 'rgba(148,163,184,0.25)' : m.isCrunch ? 'rgba(239,68,68,0.8)' : 'rgba(251,191,36,0.7)'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="淨現金流" stroke="#3b82f6" dot={{ r: 3 }} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
