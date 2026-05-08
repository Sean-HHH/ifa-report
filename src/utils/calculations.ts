import type { ClientProfile } from '../types/client'
import { RISK_RETURN } from '../types/client'
import type { IncomeType, ExpenseCategory } from '../types/client'

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
  const totalIncome = c.incomes.reduce((s, i) => s + i.amount, 0)

  const incomeByType: Record<IncomeType, number> = { fixed: 0, variable: 0, one_time: 0 }
  c.incomes.forEach(i => { incomeByType[i.type] += i.amount })

  const expenseByCategory: Record<ExpenseCategory, number> = {
    survival: 0, responsibility: 0, quality: 0, growth: 0, hidden: 0, one_time: 0,
  }
  c.expenses.forEach(e => { expenseByCategory[e.category] += e.amount })

  const totalExpenses = c.expenses.reduce((s, e) => s + e.amount, 0)
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
