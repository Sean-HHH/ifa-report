import type { ClientProfile } from '../../types/client'
import { RISK_RETURN, calcCurrentAge } from '../../types/client'
import { calcAssetGrowth, type GrowthYear } from '../assets/calc'

export interface RetirementResult {
  yearsToRetirement: number
  targetEndAge: number            // retirementAge + retirementLifespan
  projectedAssetBase: number      // 投影資產（液態+不動產）+ 一次性退休金
  projectedLiquidBase: number     // 退休時液態資產（不含不動產）
  retirementLumpSum: number
  monthlyPension: number
  netMonthlyNeeded_today: number      // 目標月現金流 − 月退年金（今日幣值）
  netMonthlyNeeded_retirement: number // 通膨調整至退休時的月缺口
  targetAsset: number             // 需自籌退休資產（依提領率）
  withdrawalRate: number
  gap: number
  requiredMonthlySavings: number
  suggestedWithdrawalRate: number
  withdrawalYears: GrowthYear[]
}

export function calcRetirement(c: ClientProfile): RetirementResult {
  const rates = RISK_RETURN[c.riskProfile]
  const baseRate = c.customReturnRate !== null ? c.customReturnRate : rates.base
  const currentAge = calcCurrentAge(c.birthYear)
  const yearsToRetirement = Math.max(0, c.retirementAge - currentAge)
  const targetEndAge = c.retirementAge + c.retirementLifespan

  const withdrawalRate = c.withdrawalRate ?? 0.04
  const lumpSum = c.retirementLumpSum ?? 0
  const monthlyPension = c.monthlyPension ?? 0

  // 投影延伸到退休年（若超過 30 年）
  const projectionYears = Math.max(30, yearsToRetirement + 1)
  const growth = calcAssetGrowth(c, projectionYears)

  const retirementYearData = growth.find(d => d.age === c.retirementAge) ?? growth[growth.length - 1]
  const projectedLiquidBase = retirementYearData.liquidBase
  const projectedAssetBase = retirementYearData.base + lumpSum

  // 月缺口：今日幣值 → 退休時名目值
  const netMonthlyNeeded_today = Math.max(0, c.targetMonthlyRetirementIncome - monthlyPension)
  const netMonthlyNeeded_retirement = netMonthlyNeeded_today *
    Math.pow(1 + c.globalInflationRate, yearsToRetirement)

  // 目標退休資產（名目，與 projectedAssetBase 同一時間點）
  const targetAsset = netMonthlyNeeded_retirement * 12 / withdrawalRate
  const gap = targetAsset - projectedAssetBase

  // 補足缺口所需月儲蓄（年金公式）
  const r = baseRate / 12
  const n = yearsToRetirement * 12
  const requiredMonthlySavings = gap > 0 && n > 0
    ? (gap * r) / (Math.pow(1 + r, n) - 1)
    : 0

  const suggestedWithdrawalRate = projectedAssetBase > 0
    ? (netMonthlyNeeded_retirement * 12) / projectedAssetBase
    : 0

  // 退休後提領模擬（通膨滾動月提領額）
  const postRetirementRate = Math.max(baseRate - 0.01, 0.02)
  const withdrawalYears: GrowthYear[] = []
  let remaining = projectedAssetBase
  let monthlyWithdraw = netMonthlyNeeded_retirement

  for (let y = 0; y <= c.retirementLifespan; y++) {
    withdrawalYears.push({
      year: new Date().getFullYear() + yearsToRetirement + y,
      age: c.retirementAge + y,
      conservative: remaining, base: remaining, aggressive: remaining, contributed: 0,
      liquidBase: remaining, realEstateValue: 0, liquidityWarning: false, warningExpense: 0,
    })
    remaining = remaining * (1 + postRetirementRate) - monthlyWithdraw * 12
    if (remaining < 0) remaining = 0
    monthlyWithdraw *= (1 + c.globalInflationRate)
  }

  return {
    yearsToRetirement,
    targetEndAge,
    projectedAssetBase,
    projectedLiquidBase,
    retirementLumpSum: lumpSum,
    monthlyPension,
    netMonthlyNeeded_today,
    netMonthlyNeeded_retirement,
    targetAsset,
    withdrawalRate,
    gap,
    requiredMonthlySavings,
    suggestedWithdrawalRate,
    withdrawalYears,
  }
}
