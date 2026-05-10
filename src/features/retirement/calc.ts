import type { ClientProfile } from '../../types/client'
import { RISK_RETURN, calcCurrentAge } from '../../types/client'
import { calcAssetGrowth, type GrowthYear } from '../assets/calc'

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
  const currentAge = calcCurrentAge(c.birthYear)
  const yearsToRetirement = c.retirementAge - currentAge

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

  for (let y = 0; y <= c.retirementLifespan; y++) {
    withdrawalYears.push({
      year: new Date().getFullYear() + yearsToRetirement + y,
      age: currentAge + yearsToRetirement + y,
      conservative: remaining, base: remaining, aggressive: remaining, contributed: 0,
    })
    remaining = remaining * (1 + postRetirementRate) - monthlyWithdraw * 12
    if (remaining < 0) remaining = 0
  }

  return { yearsToRetirement, projectedAssetBase, targetAsset, gap, requiredMonthlySavings, suggestedWithdrawalRate, withdrawalYears }
}
