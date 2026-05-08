import type { ClientProfile } from '../types/client'
import { RISK_RETURN } from '../types/client'

// ── 收支分析 ────────────────────────────────────────────────

export interface CashFlowResult {
  totalIncome: number
  totalFixed: number
  totalVariable: number
  totalExpenses: number
  netCashFlow: number
  savingsRate: number
  annualSavings: number
}

export function calcCashFlow(c: ClientProfile): CashFlowResult {
  const totalIncome = c.incomes.reduce((s, i) => s + i.amount, 0)
  const totalFixed = c.expenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const totalVariable = c.expenses.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)
  const totalExpenses = totalFixed + totalVariable
  const netCashFlow = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0
  return { totalIncome, totalFixed, totalVariable, totalExpenses, netCashFlow, savingsRate, annualSavings: netCashFlow * 12 }
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
