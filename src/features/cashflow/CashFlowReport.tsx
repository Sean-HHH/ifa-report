import { useMemo, useState } from 'react'
import {
  BarChart, Bar, Cell, Line, LineChart, ComposedChart,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { ClientProfile, FinancialScenario } from '../../types/client'
import { INCOME_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from '../../types/client'
import type { IncomeType, ExpenseCategory } from '../../types/client'
import { calcCashFlow, calcCashFlowProjection, calcMonthlyTimeline, calcRemainingYearCashFlow, calcRunway, convertCurrency, fmtAmount, fmtPct } from '../../utils/calculations'
import type { RunwayDate, RunwayResult } from './calc'
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
  const disp = (n: number) => fmtAmount(rc(n), reportCurrency)

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
              <div className="text-base font-bold text-slate-700">{disp(remaining.remainingTotalIncome)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="text-xs text-slate-400 mb-1">剩餘支出合計</div>
              <div className="text-base font-bold text-slate-700">{disp(remaining.remainingTotalExpenses)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="text-xs text-slate-400 mb-1">剩餘淨現金流</div>
              <div className={`text-base font-bold ${remaining.remainingNetTotal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {disp(remaining.remainingNetTotal)}
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
              <YAxis tickFormatter={v => disp(Number(v))} tick={CHART_TICK_STYLE} width={72} />
              <Tooltip content={<ChartTooltip formatter={v => disp(v)} />} />
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
                  <td className="text-right py-1.5 pr-3">{disp(p.totalIncome)}</td>
                  <td className="text-right py-1.5 pr-3 text-blue-600">{disp(p.net)}</td>
                  <td className="text-right py-1.5 pr-3 text-emerald-600">{disp(p.true_)}</td>
                  <td className="text-right py-1.5 text-violet-600">{disp(p.investible)}</td>
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
                    {disp(item.amount)}
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
                    {disp(e.amount)}
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
                {timeline.worstMonth.month}月（−{disp(timeline.worstMonth.deficit)}）
              </span>
            </div>
          )}
          {timeline.incomeSpread > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-2 text-sm shadow-sm">
              <span className="text-slate-400 text-xs">收入波動幅度</span>
              <span className="text-amber-600 font-medium text-xs">{disp(timeline.incomeSpread)}</span>
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
              <YAxis tickFormatter={v => disp(Number(v))} tick={CHART_TICK_STYLE} width={72} />
              <Tooltip content={<ChartTooltip formatter={v => disp(v)} />} />
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

type ScenarioProjection = { scenario: FinancialScenario; result: RunwayResult }

function dateLabel(date: RunwayDate | null): string {
  return date ? `${date.year}/${String(date.month).padStart(2, '0')}` : '推算期內未發生'
}

function RunwayOverview({ projections, selectedId, onSelect, printAll, disp, projectionStart }: {
  projections: ScenarioProjection[]
  selectedId: string
  onSelect: (id: string) => void
  printAll: boolean
  disp: (amount: number) => string
  projectionStart: RunwayDate
}) {
  return (
    <>
      <h2 className="text-lg font-bold text-slate-800">現金水位推算</h2>
      <p className="text-xs text-slate-500 leading-5">
        自資料基準的下一個完整月份（{dateLabel(projectionStart)}）推算。從現金存款起算；應收款、股票與其他資產不計入起始現金。定期投資視為現金流出，未計入投資報酬或資產出售。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">情境</th>
              <th className="py-2 pr-3 font-medium">轉換年月</th>
              <th className="py-2 pr-3 font-medium">轉換前現金</th>
              <th className="py-2 pr-3 font-medium">低於安全水位</th>
              <th className="py-2 font-medium">現金用盡</th>
            </tr>
          </thead>
          <tbody>
            {projections.map(({ scenario, result }) => (
              <tr key={scenario.id} className={`border-b border-slate-100 ${!printAll && selectedId === scenario.id ? 'bg-lime-50' : ''}`}>
                <td className="py-2 pr-3 font-medium text-slate-800">
                  {printAll ? scenario.name : (
                    <button type="button" onClick={() => onSelect(scenario.id)} className="text-left text-blue-700 hover:underline">
                      {scenario.name || '未命名情境'}
                    </button>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-600">{dateLabel({ year: scenario.startYear, month: scenario.startMonth })}</td>
                <td className="py-2 pr-3 text-slate-600">{result.cashAtTransition === null ? '超出推算期' : disp(result.cashAtTransition)}</td>
                <td className={`py-2 pr-3 ${result.firstBelowSafety ? 'text-amber-700' : 'text-slate-500'}`}>{dateLabel(result.firstBelowSafety)}</td>
                <td className={`py-2 ${result.firstDepleted ? 'text-red-700' : 'text-slate-500'}`}>{dateLabel(result.firstDepleted)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function RunwayDetail({ scenario, result, rates, reportCurrency }: ScenarioProjection & FxProps) {
  const rc = (amount: number) => convertCurrency(amount, 'TWD', reportCurrency, rates)
  const disp = (amount: number) => fmtAmount(rc(amount), reportCurrency)
  const chartData = result.months.map(month => ({
    label: `${String(month.year).slice(-2)}/${String(month.month).padStart(2, '0')}`,
    現金水位: rc(month.closingCash),
  }))
  const safetyLine = rc(result.safetyFloor)
  const runwayText = result.monthsUntilDepletion === null
    ? `超過 ${result.months.length} 個月`
    : `${result.monthsUntilDepletion} 個完整月`
  const depletedBeforeTransition = result.firstDepleted &&
    result.firstDepleted.year * 12 + result.firstDepleted.month < scenario.startYear * 12 + scenario.startMonth

  return (
    <div className="space-y-5">
      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-base font-semibold text-slate-800">{scenario.name || '未命名情境'}</h3>
        <p className="text-xs text-slate-500 mt-1">
          {dateLabel({ year: scenario.startYear, month: scenario.startMonth })} 起：月收入 {scenario.monthlyIncome === null ? '沿用收入明細' : disp(scenario.monthlyIncome)}，
          月支出 {scenario.monthlyExpenses === null ? '沿用支出明細' : disp(scenario.monthlyExpenses)}，
          額外月支出 {disp(scenario.recurringExpenses.reduce((sum, item) => sum + item.amount, 0))}，
          每月投資投入 {disp(scenario.monthlyContribution)}。
        </p>
        {scenario.recurringExpenses.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            額外支出：{scenario.recurringExpenses.map(item => `${item.label || '未命名'} ${disp(item.amount)}`).join('、')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="起始現金存款" value={disp(result.startingCash)} />
        <StatCard label={`安全水位 · ${scenario.safetyMonths} 個月`} value={disp(result.safetyFloor)} color="orange" />
        <StatCard label="轉換後可撐" value={result.transitionIndex < 0 ? '超出推算期' : depletedBeforeTransition ? '轉換前已用盡' : runwayText}
          color={result.firstDepleted ? 'red' : 'green'} />
        <StatCard label="維持安全水位所需月收入" value={result.minimumMonthlyIncome === null ? '無法估算' : disp(result.minimumMonthlyIncome)}
          sub={result.minimumMonthlyIncome === null ? '轉換前已跌破安全水位，或轉換月超出推算期' : '從轉換月起，每月固定收入的最低估計'}
          color="blue" />
      </div>

      <div className="text-xs text-slate-500">
        首次低於安全水位：<span className="font-semibold text-amber-700">{dateLabel(result.firstBelowSafety)}</span>
        <span className="mx-2 text-slate-300">|</span>
        現金用盡：<span className="font-semibold text-red-700">{dateLabel(result.firstDepleted)}</span>
      </div>

      <div className="h-64" role="img" aria-label={`${scenario.name}逐月現金水位圖`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
            <XAxis dataKey="label" tick={CHART_TICK_STYLE} minTickGap={24} />
            <YAxis tick={CHART_TICK_STYLE} width={68} tickFormatter={value => fmtAmount(Number(value), reportCurrency)} />
            <Tooltip content={<ChartTooltip formatter={value => fmtAmount(value, reportCurrency)} />} />
            <ReferenceLine y={safetyLine} stroke="#D97706" strokeDasharray="4 4" />
            <ReferenceLine y={0} stroke="#DC2626" />
            <Line type="monotone" dataKey="現金水位" stroke="#1E40AF" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="py-2 pr-2 text-left font-medium">月份</th>
              <th className="py-2 pr-2 font-medium">月初</th>
              <th className="py-2 pr-2 font-medium">收入</th>
              <th className="py-2 pr-2 font-medium">生活支出</th>
              <th className="py-2 pr-2 font-medium">一次性支出</th>
              <th className="py-2 pr-2 font-medium">投資投入</th>
              <th className="py-2 font-medium">月末</th>
            </tr>
          </thead>
          <tbody>
            {result.months.map(month => (
              <tr key={`${month.year}-${month.month}`} className={`border-b border-slate-100 text-right ${month.closingCash < result.safetyFloor ? 'bg-amber-50/60' : ''}`}>
                <td className="py-1.5 pr-2 text-left font-medium text-slate-700">
                  {dateLabel(month)}{month.isScenarioActive && month.year === scenario.startYear && month.month === scenario.startMonth ? ' · 轉換' : ''}
                </td>
                <td className="py-1.5 pr-2 text-slate-500">{disp(month.openingCash)}</td>
                <td className="py-1.5 pr-2 text-emerald-700">{disp(month.income)}</td>
                <td className="py-1.5 pr-2 text-slate-600">{disp(month.expenses)}</td>
                <td className="py-1.5 pr-2 text-slate-600">{month.majorExpenses ? disp(month.majorExpenses) : '—'}</td>
                <td className="py-1.5 pr-2 text-slate-600">{month.contribution ? disp(month.contribution) : '—'}</td>
                <td className={`py-1.5 font-semibold ${month.closingCash <= 0 ? 'text-red-700' : 'text-slate-800'}`}>{disp(month.closingCash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">基礎收支依設定的發生月份與年成長率推算；未填月份的重大支出於 12 月估列。情境固定月額不另加通膨。</p>
    </div>
  )
}

export function RunwayReport({ client, rates, reportCurrency, asOf, printAll = false }: {
  client: ClientProfile
  asOf?: RunwayDate
  printAll?: boolean
} & FxProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const now = new Date()
  const firstFullMonth = new Date(asOf?.year ?? now.getFullYear(), asOf?.month ?? now.getMonth() + 1, 1)
  const startYear = firstFullMonth.getFullYear()
  const startMonth = firstFullMonth.getMonth() + 1
  const projections = useMemo(() => (client.scenarios ?? []).map(scenario => ({
    scenario,
    result: calcRunway(client, scenario, rates, { year: startYear, month: startMonth }),
  })), [client, rates, startYear, startMonth])
  const selected = projections.find(item => item.scenario.id === selectedId) ?? projections[0]
  const disp = (amount: number) => fmtAmount(convertCurrency(amount, 'TWD', reportCurrency, rates), reportCurrency)

  if (projections.length === 0) {
    return (
      <div className="report-page bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">現金水位推算</h2>
        <p className="text-sm text-slate-500 mt-3">尚未建立情境。請從左側「情境」新增。</p>
      </div>
    )
  }

  const overview = <RunwayOverview projections={projections} selectedId={selected.scenario.id} onSelect={setSelectedId} printAll={printAll} disp={disp} projectionStart={{ year: startYear, month: startMonth }} />

  if (printAll) {
    return (
      <>
        <div className="report-page space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">{overview}</div>
        {projections.map(item => (
          <div key={item.scenario.id} className="report-page bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <RunwayDetail {...item} rates={rates} reportCurrency={reportCurrency} />
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="report-page space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      {overview}
      <RunwayDetail {...selected} rates={rates} reportCurrency={reportCurrency} />
    </div>
  )
}
