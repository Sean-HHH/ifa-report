import type { ClientProfile, InvestmentItem } from '../types/client'
import { RISK_RETURN, INVESTMENT_CATEGORY_LABELS } from '../types/client'
import type { IncomeType, ExpenseCategory, PayFrequency, InvestmentCategory } from '../types/client'
import type { FxRates } from '../services/exchangeRate'

// ── 頻率換算 ─────────────────────────────────────────────────

function toMonthlyEquiv(amount: number, freq: PayFrequency = 'monthly'): number {
  if (freq === 'quarterly') return (amount * 4) / 12
  if (freq === 'annual') return amount / 12
  return amount
}

// ── 收支分析 ────────────────────────────────────────────────

export interface CashFlowResult {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number          // 帳面：所有收入 − 所有支出
  trueNetCashFlow: number      // 真實：固定收入 − (生存+責任)
  investibleCashFlow: number   // 可投資：固定收入 − (生存+責任+生活品質+成長)
  savingsRate: number
  annualSavings: number
  incomeByType: Record<IncomeType, number>
  expenseByCategory: Record<ExpenseCategory, number>
  incomeStabilityRatio: number  // 固定收入 / 總收入
  fixedExpenseRatio: number     // (生存+責任) / 總收入
  hiddenExpenseRatio: number    // 隱性支出 / 總支出
}

export function calcCashFlow(c: ClientProfile): CashFlowResult {
  const totalIncome = c.incomes.reduce((s, i) => s + toMonthlyEquiv(i.amount, i.frequency), 0)

  const incomeByType: Record<IncomeType, number> = { fixed: 0, variable: 0, one_time: 0 }
  c.incomes.forEach(i => { incomeByType[i.type] += toMonthlyEquiv(i.amount, i.frequency) })

  const expenseByCategory: Record<ExpenseCategory, number> = {
    survival: 0, responsibility: 0, quality: 0, growth: 0, hidden: 0, one_time: 0,
  }
  c.expenses.forEach(e => { expenseByCategory[e.category] += toMonthlyEquiv(e.amount, e.frequency) })

  const totalExpenses = c.expenses.reduce((s, e) => s + toMonthlyEquiv(e.amount, e.frequency), 0)
  const netCashFlow = totalIncome - totalExpenses

  const fixedIncome = incomeByType.fixed
  const trueNetCashFlow = fixedIncome - expenseByCategory.survival - expenseByCategory.responsibility
  const investibleCashFlow = trueNetCashFlow - expenseByCategory.quality - expenseByCategory.growth

  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0
  const incomeStabilityRatio = totalIncome > 0 ? (fixedIncome / totalIncome) * 100 : 0
  const fixedExpenseRatio = totalIncome > 0
    ? ((expenseByCategory.survival + expenseByCategory.responsibility) / totalIncome) * 100 : 0
  const hiddenExpenseRatio = totalExpenses > 0
    ? (expenseByCategory.hidden / totalExpenses) * 100 : 0

  return {
    totalIncome, totalExpenses, netCashFlow, trueNetCashFlow, investibleCashFlow,
    savingsRate, annualSavings: netCashFlow * 12,
    incomeByType, expenseByCategory,
    incomeStabilityRatio, fixedExpenseRatio, hiddenExpenseRatio,
  }
}

// ── 5年現金流 Projection ─────────────────────────────────────

export interface CashFlowProjectionYear {
  year: number
  totalIncome: number
  totalExpenses: number
  net: number        // 帳面現金流
  true_: number      // 真實現金流
  investible: number // 可投資現金流
}

export function calcCashFlowProjection(c: ClientProfile, years = 5): CashFlowProjectionYear[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: years + 1 }, (_, y) => {
    const incomes = c.incomes.map(i => ({
      ...i,
      amount: i.amount * Math.pow(1 + (i.growthRate ?? 0), y),
    }))
    const expenses = c.expenses.map(e => ({
      ...e,
      amount: e.amount * Math.pow(1 + c.globalInflationRate, y),
    }))
    const cf = calcCashFlow({ ...c, incomes, expenses })
    return {
      year: currentYear + y,
      totalIncome: cf.totalIncome,
      totalExpenses: cf.totalExpenses,
      net: cf.netCashFlow,
      true_: cf.trueNetCashFlow,
      investible: cf.investibleCashFlow,
    }
  })
}

// ── 現金流時序分析 ───────────────────────────────────────────

export interface MonthlyMonth {
  month: number
  income: number
  expense: number
  net: number
  isCrunch: boolean  // net < 0
}

export interface MonthlyTimelineResult {
  months: MonthlyMonth[]
  crunchMonths: number[]
  needsBridging: boolean
  worstMonth: { month: number; deficit: number } | null
  bestMonth: { month: number; surplus: number } | null
  incomeSpread: number  // max月收入 - min月收入，衡量收入集中度
}

function resolvePayMonths(freq: PayFrequency, payMonths?: number[]): number[] | null {
  if (freq === 'monthly') return null  // 每個月都有
  if (payMonths && payMonths.length > 0) return payMonths
  return freq === 'quarterly' ? [3, 6, 9, 12] : [12]
}

export function calcMonthlyTimeline(c: ClientProfile): MonthlyTimelineResult {
  const months: MonthlyMonth[] = []

  for (let m = 1; m <= 12; m++) {
    let income = 0
    let expense = 0

    for (const item of c.incomes) {
      const freq = item.frequency ?? 'monthly'
      const pay = resolvePayMonths(freq, item.payMonths)
      if (pay === null || pay.includes(m)) income += item.amount
    }

    for (const item of c.expenses) {
      const freq = item.frequency ?? 'monthly'
      const pay = resolvePayMonths(freq, item.payMonths)
      if (pay === null || pay.includes(m)) expense += item.amount
    }

    const net = income - expense
    months.push({ month: m, income, expense, net, isCrunch: net < 0 })
  }

  const crunchMonths = months.filter(m => m.isCrunch).map(m => m.month)
  const nets = months.map(m => m.net)
  const minNet = Math.min(...nets)
  const maxNet = Math.max(...nets)

  const worstMonth = minNet < 0
    ? { month: months.find(m => m.net === minNet)!.month, deficit: Math.abs(minNet) }
    : null
  const bestMonth = { month: months.find(m => m.net === maxNet)!.month, surplus: maxNet }

  const incomes = months.map(m => m.income)
  const incomeSpread = Math.max(...incomes) - Math.min(...incomes)

  return { months, crunchMonths, needsBridging: crunchMonths.length > 0, worstMonth, bestMonth, incomeSpread }
}

// ── 資產 / 負債 ──────────────────────────────────────────────

export function totalAssets(c: ClientProfile): number {
  return c.assetItems.reduce((s, i) => s + i.amount, 0)
}

export function totalLiabilities(c: ClientProfile): number {
  return c.liabilityItems.reduce((s, i) => s + i.amount, 0)
}

export function netWorth(c: ClientProfile): number {
  return totalAssets(c) - totalLiabilities(c)
}

// ── 多幣別換算 ────────────────────────────────────────────────

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: FxRates): number {
  if (fromCurrency === toCurrency) return amount
  const toTWD = rates[fromCurrency] ?? 1
  if (toCurrency === 'TWD') return amount * toTWD
  const fromTWD = rates[toCurrency] ?? 1
  return (amount * toTWD) / fromTWD
}

export function totalAssetsConverted(c: ClientProfile, rates: FxRates, reportCurrency: string): number {
  return c.assetItems.reduce((s, item) =>
    s + convertCurrency(item.amount, item.currency ?? 'TWD', reportCurrency, rates), 0)
}

export function totalLiabilitiesConverted(c: ClientProfile, rates: FxRates, reportCurrency: string): number {
  return c.liabilityItems.reduce((s, item) =>
    s + convertCurrency(item.amount, 'TWD', reportCurrency, rates), 0)
}

export function netWorthConverted(c: ClientProfile, rates: FxRates, reportCurrency: string): number {
  return totalAssetsConverted(c, rates, reportCurrency) - totalLiabilitiesConverted(c, rates, reportCurrency)
}

// ── 資產成長路徑 ─────────────────────────────────────────────

export interface GrowthYear {
  year: number
  age: number
  conservative: number
  base: number
  aggressive: number
  contributed: number
}

export function calcAssetGrowth(c: ClientProfile): GrowthYear[] {
  const rates = RISK_RETURN[c.riskProfile]
  const effectiveRates = {
    conservative: c.customReturnRate !== null ? c.customReturnRate * 0.8 : rates.conservative,
    base: c.customReturnRate !== null ? c.customReturnRate : rates.base,
    aggressive: c.customReturnRate !== null ? c.customReturnRate * 1.2 : rates.aggressive,
  }

  const nw = netWorth(c)
  const years = c.retirementAge - c.currentAge
  const monthly = c.monthlyContribution
  const result: GrowthYear[] = []

  let cv = nw, bv = nw, av = nw, contributed = 0

  for (let y = 0; y <= years; y++) {
    const targetYear = new Date().getFullYear() + y
    const majorOut = c.majorExpenses
      .filter(e => e.year === targetYear)
      .reduce((s, e) => s + e.amount, 0)

    result.push({ year: targetYear, age: c.currentAge + y, conservative: cv, base: bv, aggressive: av, contributed })

    cv = (cv - majorOut) * (1 + effectiveRates.conservative) + monthly * 12
    bv = (bv - majorOut) * (1 + effectiveRates.base) + monthly * 12
    av = (av - majorOut) * (1 + effectiveRates.aggressive) + monthly * 12
    contributed += monthly * 12
  }

  return result
}

// ── 退休規劃 ─────────────────────────────────────────────────

export interface RetirementResult {
  yearsToRetirement: number
  projectedAssetBase: number
  targetAsset: number
  gap: number
  requiredMonthlySavings: number
  suggestedWithdrawalRate: number
  withdrawalYears: GrowthYear[]
}

export function calcRetirement(c: ClientProfile): RetirementResult {
  const rates = RISK_RETURN[c.riskProfile]
  const baseRate = c.customReturnRate !== null ? c.customReturnRate : rates.base
  const yearsToRetirement = c.retirementAge - c.currentAge

  const growth = calcAssetGrowth(c)
  const projectedAssetBase = growth[growth.length - 1]?.base ?? 0

  const targetAsset = c.targetMonthlyRetirementIncome * 12 * 25
  const gap = targetAsset - projectedAssetBase

  const r = baseRate / 12
  const n = yearsToRetirement * 12
  const requiredMonthlySavings = gap > 0 && n > 0
    ? (gap * r) / (Math.pow(1 + r, n) - 1)
    : 0

  const suggestedWithdrawalRate = projectedAssetBase > 0
    ? (c.targetMonthlyRetirementIncome * 12) / projectedAssetBase
    : 0

  const withdrawalYears: GrowthYear[] = []
  let remaining = projectedAssetBase
  const monthlyWithdraw = c.targetMonthlyRetirementIncome
  const postRetirementRate = Math.max(baseRate - 0.01, 0.02)

  for (let y = 0; y <= 30; y++) {
    withdrawalYears.push({
      year: new Date().getFullYear() + yearsToRetirement + y,
      age: c.retirementAge + y,
      conservative: remaining, base: remaining, aggressive: remaining, contributed: 0,
    })
    remaining = remaining * (1 + postRetirementRate) - monthlyWithdraw * 12
    if (remaining < 0) remaining = 0
  }

  return { yearsToRetirement, projectedAssetBase, targetAsset, gap, requiredMonthlySavings, suggestedWithdrawalRate, withdrawalYears }
}

// ── 資產分配分析 ─────────────────────────────────────────────

export interface AssetAllocationResult {
  byCategory: Partial<Record<InvestmentCategory, { amount: number; pct: number }>>
  byCurrency: Record<string, { amount: number; pct: number }>
  byPurpose: Record<string, { amount: number; pct: number }>
  topHolding: { label: string; amount: number; pct: number } | null
  isConcentrated: boolean
}

export function calcAssetAllocation(c: ClientProfile, rates?: FxRates, reportCurrency?: string): AssetAllocationResult {
  const rc = reportCurrency ?? 'TWD'
  const fx = rates ?? { TWD: 1 }
  const total = rates ? totalAssetsConverted(c, fx, rc) : totalAssets(c)
  if (total === 0) {
    return { byCategory: {}, byCurrency: {}, byPurpose: {}, topHolding: null, isConcentrated: false }
  }

  const byCategory: Partial<Record<InvestmentCategory, { amount: number; pct: number }>> = {}
  const byCurrency: Record<string, { amount: number; pct: number }> = {}
  const byPurpose: Record<string, { amount: number; pct: number }> = {}

  for (const item of c.assetItems) {
    const converted = rates ? convertCurrency(item.amount, item.currency ?? 'TWD', rc, fx) : item.amount

    const cat = item.category
    byCategory[cat] = { amount: (byCategory[cat]?.amount ?? 0) + converted, pct: 0 }

    const cur = item.currency ?? 'TWD'
    byCurrency[cur] = { amount: (byCurrency[cur]?.amount ?? 0) + converted, pct: 0 }

    const pur = item.purpose ?? 'growth'
    byPurpose[pur] = { amount: (byPurpose[pur]?.amount ?? 0) + converted, pct: 0 }
  }

  for (const k of Object.keys(byCategory) as InvestmentCategory[]) {
    byCategory[k]!.pct = (byCategory[k]!.amount / total) * 100
  }
  for (const k of Object.keys(byCurrency)) {
    byCurrency[k].pct = (byCurrency[k].amount / total) * 100
  }
  for (const k of Object.keys(byPurpose)) {
    byPurpose[k].pct = (byPurpose[k].amount / total) * 100
  }

  const topItem = c.assetItems.reduce<typeof c.assetItems[0] | null>(
    (best, item) => (!best || item.amount > best.amount ? item : best), null
  )
  const topConverted = topItem ? (rates ? convertCurrency(topItem.amount, topItem.currency ?? 'TWD', rc, fx) : topItem.amount) : 0
  const topHolding = topItem
    ? { label: topItem.label, amount: topConverted, pct: (topConverted / total) * 100 }
    : null

  return { byCategory, byCurrency, byPurpose, topHolding, isConcentrated: (topHolding?.pct ?? 0) > 30 }
}

// ── 資產期間變化 ─────────────────────────────────────────────

export interface AssetPeriodChangeResult {
  periodLabel: string
  openingAssets: number
  netContribution: number
  investmentGain: number
  dividendIncome: number
  fxImpact: number
  fees: number
  closingAssets: number
  totalChange: number
  totalChangePct: number
}

export function calcAssetPeriodChange(c: ClientProfile): AssetPeriodChangeResult | null {
  const snap = c.assetSnapshots?.[0]
  if (!snap) return null
  const { periodLabel, openingAssets, netContribution, dividendIncome, fxImpact, fees } = snap
  const closingAssets = totalAssets(c)
  const investmentGain = closingAssets - openingAssets - netContribution - dividendIncome - fxImpact + fees
  const totalChange = closingAssets - openingAssets
  const totalChangePct = openingAssets > 0 ? (totalChange / openingAssets) * 100 : 0
  return { periodLabel, openingAssets, netContribution, investmentGain, dividendIncome, fxImpact, fees, closingAssets, totalChange, totalChangePct }
}

export function calcCategoryBreakdown(
  items: InvestmentItem[]
): Partial<Record<InvestmentCategory, { amount: number; pct: number }>> {
  const total = items.reduce((s, i) => s + i.amount, 0)
  const sums: Partial<Record<InvestmentCategory, number>> = {}
  for (const item of items) {
    sums[item.category] = (sums[item.category] ?? 0) + item.amount
  }
  const result: Partial<Record<InvestmentCategory, { amount: number; pct: number }>> = {}
  for (const [cat, amount] of Object.entries(sums) as [InvestmentCategory, number][]) {
    result[cat] = { amount, pct: total > 0 ? (amount / total) * 100 : 0 }
  }
  return result
}

export function calcSnapshotComparison(
  from: import('../types/client').AssetPeriodSnapshot,
  to: import('../types/client').AssetPeriodSnapshot,
): AssetPeriodChangeResult {
  const { openingAssets } = from
  const closingAssets = to.openingAssets
  const { netContribution, dividendIncome, fxImpact, fees } = to
  const investmentGain = closingAssets - openingAssets - netContribution - dividendIncome - fxImpact + fees
  const totalChange = closingAssets - openingAssets
  const totalChangePct = openingAssets > 0 ? (totalChange / openingAssets) * 100 : 0
  const periodLabel = `${from.periodLabel} → ${to.periodLabel}`
  return { periodLabel, openingAssets, netContribution, investmentGain, dividendIncome, fxImpact, fees, closingAssets, totalChange, totalChangePct }
}

// ── 配置偏離分析 ─────────────────────────────────────────────

export interface AssetDeviationItem {
  category: InvestmentCategory
  label: string
  targetPct: number
  actualPct: number
  deviation: number
  deviationAmount: number
  withinTolerance: boolean
  action: 'overweight' | 'underweight' | 'ok'
}

export interface AssetDeviationResult {
  items: AssetDeviationItem[]
  hasTargets: boolean
  needsRebalance: boolean
  rebalancePriority: AssetDeviationItem[]
}

export function calcAssetDeviation(c: ClientProfile): AssetDeviationResult {
  const targets = c.targetAllocation
  const hasTargets = Object.keys(targets).length > 0
  if (!hasTargets) return { items: [], hasTargets: false, needsRebalance: false, rebalancePriority: [] }

  const total = totalAssets(c)
  const alloc = calcAssetAllocation(c)

  const categories = Object.keys(targets) as InvestmentCategory[]
  const items: AssetDeviationItem[] = categories.map(cat => {
    const targetPct = targets[cat] ?? 0
    const actualPct = alloc.byCategory[cat]?.pct ?? 0
    const deviation = actualPct - targetPct
    const deviationAmount = (deviation / 100) * total
    const withinTolerance = Math.abs(deviation) <= c.toleranceBand
    const action = withinTolerance ? 'ok' : deviation > 0 ? 'overweight' : 'underweight'
    return { category: cat, label: INVESTMENT_CATEGORY_LABELS[cat], targetPct, actualPct, deviation, deviationAmount, withinTolerance, action }
  })

  const needsRebalance = items.some(item => !item.withinTolerance)
  const rebalancePriority = items
    .filter(item => !item.withinTolerance)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))

  return { items, hasTargets: true, needsRebalance, rebalancePriority }
}

// ── 格式化工具 ────────────────────────────────────────────────

export function fmtNTD(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
    if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  }
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n)
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

export function fmtAmount(n: number, currency: string, compact = false): string {
  if (currency === 'TWD') return fmtNTD(n, compact)
  if (currency === 'USDT') {
    if (compact && Math.abs(n) >= 1000) return `USDT ${(n / 1000).toFixed(1)}K`
    return `USDT ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
  }
  if (currency === 'other') return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(n)
  // USD / JPY / EUR / GBP / HKD
  const isoMap: Record<string, string> = { USD: 'USD', JPY: 'JPY', EUR: 'EUR', GBP: 'GBP', HKD: 'HKD' }
  const iso = isoMap[currency]
  if (!iso) return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
  if (compact) {
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${iso} ${(n / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${iso} ${(n / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: iso, maximumFractionDigits: 0 }).format(n)
}
