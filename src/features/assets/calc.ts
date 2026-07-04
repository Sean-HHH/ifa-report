import type { ClientProfile, InvestmentItem, InvestmentCategory, AssetPeriodSnapshot, LedgerEntry } from '../../types/client'
import { RISK_RETURN, INVESTMENT_CATEGORY_LABELS, calcCurrentAge } from '../../types/client'
import type { FxRates } from '../fx/exchangeRate'

export function totalAssets(c: ClientProfile): number {
  return c.assetItems.reduce((s, i) => s + i.amount, 0)
}

export function totalLiabilities(c: ClientProfile): number {
  return c.liabilityItems.reduce((s, i) => s + i.amount, 0)
}

export function netWorth(c: ClientProfile): number {
  return totalAssets(c) - totalLiabilities(c)
}

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

export interface GrowthYear {
  year: number
  age: number
  conservative: number   // 總資產（液態 + 不動產）保守情境
  base: number           // 總資產基準情境
  aggressive: number     // 總資產積極情境
  contributed: number
  liquidBase: number     // 液態資產淨值（基準情境），不含不動產
  realEstateValue: number
  liquidityWarning: boolean   // 該年重大支出超過液態資產
  warningExpense: number      // 觸發警示的支出金額
}

export function calcAssetGrowth(c: ClientProfile, years = 30): GrowthYear[] {
  const rates = RISK_RETURN[c.riskProfile]
  const effectiveRates = {
    conservative: c.customReturnRate !== null ? c.customReturnRate * 0.8 : rates.conservative,
    base: c.customReturnRate !== null ? c.customReturnRate : rates.base,
    aggressive: c.customReturnRate !== null ? c.customReturnRate * 1.2 : rates.aggressive,
  }
  const reRate = c.realEstateReturnRate ?? c.globalInflationRate ?? 0.02

  const currentAge = calcCurrentAge(c.birthYear)
  const currentYear = c.planStartYear ?? new Date().getFullYear()
  const planStartMonth = c.planStartMonth ?? 1
  const isPartialYear = planStartMonth > 1
  const remainingMonths = 13 - planStartMonth  // 12 when full year
  const monthly = c.monthlyContribution

  // 拆分液態池 vs 不動產池
  const reGross = c.assetItems
    .filter(i => i.category === 'real_estate')
    .reduce((s, i) => s + i.amount, 0)
  const liquidAssets = totalAssets(c) - reGross
  const liabs = totalLiabilities(c)

  // 液態淨值（可為負，若貸款 > 流動資產）
  let lcv = liquidAssets - liabs
  let lbv = liquidAssets - liabs
  let lav = liquidAssets - liabs
  let re = reGross
  let contributed = 0

  const result: GrowthYear[] = []

  for (let y = 0; y < years; y++) {
    const targetYear = currentYear + y

    // 重大支出過濾：若為今年（y=0）且指定月份已過，不扣
    const majorOut = c.majorExpenses
      .filter(e => {
        if (e.year !== targetYear) return false
        if (y === 0 && isPartialYear && e.month !== undefined && e.month < planStartMonth) return false
        return true
      })
      .reduce((s, e) => s + e.amount * Math.pow(1 + c.globalInflationRate, y), 0)

    // 流動性警示：基準情境的液態淨值不足以支付重大支出
    const liquidityWarning = majorOut > 0 && lbv < majorOut

    result.push({
      year: targetYear,
      age: currentAge + y,
      conservative: lcv + re,
      base: lbv + re,
      aggressive: lav + re,
      contributed,
      liquidBase: lbv,
      realEstateValue: re,
      liquidityWarning,
      warningExpense: liquidityWarning ? majorOut : 0,
    })

    // year 0 部分年度：報酬率與投入月數依剩餘月份折算
    const yearFraction = y === 0 && isPartialYear ? remainingMonths / 12 : 1
    const yearMonths = y === 0 && isPartialYear ? remainingMonths : 12
    const yr = y === 0 && isPartialYear ? {
      conservative: Math.pow(1 + effectiveRates.conservative, yearFraction) - 1,
      base:         Math.pow(1 + effectiveRates.base, yearFraction) - 1,
      aggressive:   Math.pow(1 + effectiveRates.aggressive, yearFraction) - 1,
    } : effectiveRates

    lcv = (lcv - majorOut) * (1 + yr.conservative) + monthly * yearMonths
    lbv = (lbv - majorOut) * (1 + yr.base) + monthly * yearMonths
    lav = (lav - majorOut) * (1 + yr.aggressive) + monthly * yearMonths
    re = re * (Math.pow(1 + reRate, yearFraction))
    contributed += monthly * yearMonths
  }

  return result
}

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

    const pur = item.category === 'cash' ? 'emergency' : (item.purpose ?? 'growth')
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
  from: import('../../types/client').AssetPeriodSnapshot,
  to: import('../../types/client').AssetPeriodSnapshot,
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

export interface PeriodPnL {
  snapshotId: string
  periodLabel: string
  openingAssets: number
  closingAssets: number
  netContribution: number
  dividendIncome: number
  fees: number
  marketGain: number
  totalReturn: number
  returnPct: number
}

export function calcPeriodPnL(
  snapshot: AssetPeriodSnapshot,
  ledgerEntries: LedgerEntry[],
): PeriodPnL {
  const closing = snapshot.closingAssets ?? snapshot.openingAssets
  const relevant = ledgerEntries.filter(e => e.snapshotId === snapshot.id)

  let netContribution = 0
  let dividendIncome = 0
  let fees = 0

  for (const entry of relevant) {
    for (const line of entry.lines) {
      const t = line.type ?? 'buy'
      if (t === 'buy' || t === 'sell' || t === 'transfer') {
        netContribution += line.amountDelta
      } else if (t === 'dividend') {
        dividendIncome += line.amountDelta
      } else if (t === 'fee') {
        fees += line.amountDelta
      }
    }
  }

  const totalReturn = closing - snapshot.openingAssets
  const marketGain = totalReturn - netContribution - dividendIncome - fees
  const returnPct = snapshot.openingAssets > 0 ? (totalReturn / snapshot.openingAssets) * 100 : 0

  return {
    snapshotId: snapshot.id,
    periodLabel: snapshot.periodLabel,
    openingAssets: snapshot.openingAssets,
    closingAssets: closing,
    netContribution,
    dividendIncome,
    fees,
    marketGain,
    totalReturn,
    returnPct,
  }
}

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
