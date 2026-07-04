import type { ClientProfile } from '../../types/client'
import { RISK_RETURN, calcCurrentAge } from '../../types/client'
import { calcAssetGrowth, type GrowthYear } from '../assets/calc'
import type { FxRates } from '../fx/exchangeRate'

export interface RetirementResult {
  yearsToRetirement: number
  targetEndAge: number            // retirementAge + retirementLifespan
  projectedAssetBase: number      // 總資產（流動+不動產+一次性退休金），供顯示用
  projectedLiquidBase: number     // 退休時流動資產（不含不動產）
  projectedRealEstateBase: number // 退休時不動產估值
  projectedUsableBase: number     // 實際可用於退休提領（流動+一次性退休金，不含不動產）
  retirementLumpSum: number
  monthlyPension: number
  netMonthlyNeeded_today: number      // 目標月現金流 − 月退年金（今日幣值，供參考）
  netMonthlyNeeded_retirement: number // 退休時名目月缺口（第 1 年）
  netMonthlyNeeded_finalYear: number  // 退休末年月缺口（通膨累積至第 retirementLifespan 年）
  targetAsset: number             // 需自籌退休資產（成長型年金現值法 + 退休期重大支出現值）
  targetAssetSWR: number          // 參考用：依安全提領率估算的目標資產
  withdrawalRate: number
  gap: number                     // targetAsset − projectedUsableBase
  requiredMonthlySavings: number
  suggestedWithdrawalRate: number
  withdrawalYears: GrowthYear[]
}

export function calcRetirement(c: ClientProfile, fxRates?: FxRates): RetirementResult {
  const rates = RISK_RETURN[c.riskProfile]
  const baseRate = c.customReturnRate !== null ? c.customReturnRate : rates.base
  const currentAge = calcCurrentAge(c.birthYear)
  const yearsToRetirement = Math.max(0, c.retirementAge - currentAge)
  const targetEndAge = c.retirementAge + c.retirementLifespan
  const currentYear = new Date().getFullYear()
  const retirementStartYear = currentYear + yearsToRetirement

  const withdrawalRate = c.withdrawalRate ?? 0.04
  const lumpSum = c.retirementLumpSum ?? 0
  const monthlyPension = c.monthlyPension ?? 0
  const g = c.globalInflationRate
  const lifespan = c.retirementLifespan

  // 投影延伸到退休年（若超過 30 年）
  const projectionYears = Math.max(30, yearsToRetirement + 1)
  const growth = calcAssetGrowth(c, projectionYears, fxRates)

  const retirementYearData = growth.find(d => d.age === c.retirementAge) ?? growth[growth.length - 1]
  const projectedLiquidBase = retirementYearData.liquidBase
  const projectedRealEstateBase = retirementYearData.realEstateValue
  const projectedAssetBase = retirementYearData.base + lumpSum
  const projectedUsableBase = projectedLiquidBase + lumpSum

  // 月缺口：保守假設 — 年金不隨通膨調升，固定名目值
  const netMonthlyNeeded_today = Math.max(0, c.targetMonthlyRetirementIncome - monthlyPension)
  const grossMonthlyNeeded_retirement = c.targetMonthlyRetirementIncome *
    Math.pow(1 + g, yearsToRetirement)
  const netMonthlyNeeded_retirement = Math.max(0, grossMonthlyNeeded_retirement - monthlyPension)
  const netMonthlyNeeded_finalYear = netMonthlyNeeded_retirement *
    Math.pow(1 + g, lifespan)

  // 退休後報酬率
  const postRetirementRate = Math.max(baseRate - 0.01, 0.02)
  const rr = postRetirementRate

  // 目標退休資產 — 成長型年金現值法（通膨逐年調升的提領額折現至退休日）
  // PV = PMT × [1 − ((1+g)/(1+r))^n] / (r − g)  （r ≠ g 時）
  const annualSpend = netMonthlyNeeded_retirement * 12
  const pvRegular = Math.abs(rr - g) < 1e-9
    ? annualSpend * lifespan / (1 + rr)
    : annualSpend * (1 - Math.pow((1 + g) / (1 + rr), lifespan)) / (rr - g)

  // 退休期重大支出現值（折現至退休日）
  const pvMajor = c.majorExpenses
    .filter(e => e.year >= retirementStartYear && e.year < retirementStartYear + lifespan)
    .reduce((s, e) => {
      const yearsIn = e.year - retirementStartYear
      const nominal = e.amount * Math.pow(1 + g, yearsToRetirement + yearsIn)
      return s + nominal / Math.pow(1 + rr, yearsIn)
    }, 0)

  const targetAsset = pvRegular + pvMajor
  const targetAssetSWR = annualSpend / withdrawalRate  // 參考：SWR 法
  const gap = targetAsset - projectedUsableBase

  // 補足缺口所需月儲蓄（年金公式）
  const r = baseRate / 12
  const n = yearsToRetirement * 12
  const requiredMonthlySavings = gap > 0 && n > 0
    ? (gap * r) / (Math.pow(1 + r, n) - 1)
    : 0

  const suggestedWithdrawalRate = projectedUsableBase > 0
    ? annualSpend / projectedUsableBase
    : 0

  // 退休後提領模擬（含退休期重大支出）
  const withdrawalYears: GrowthYear[] = []
  let remaining = projectedUsableBase
  let monthlyWithdraw = netMonthlyNeeded_retirement

  for (let y = 0; y <= lifespan; y++) {
    const retirementYear = retirementStartYear + y
    const majorOut = c.majorExpenses
      .filter(e => e.year === retirementYear)
      .reduce((s, e) => s + e.amount * Math.pow(1 + g, yearsToRetirement + y), 0)

    const annualWithdraw = monthlyWithdraw * 12
    const liquidityWarning = majorOut > 0 && remaining < annualWithdraw + majorOut

    withdrawalYears.push({
      year: retirementYear,
      age: c.retirementAge + y,
      conservative: remaining, base: remaining, aggressive: remaining, contributed: 0,
      liquidBase: remaining, realEstateValue: 0,
      liquidityWarning,
      warningExpense: majorOut,
    })

    remaining = Math.max(0, remaining * (1 + rr) - annualWithdraw - majorOut)
    monthlyWithdraw *= (1 + g)
  }

  return {
    yearsToRetirement,
    targetEndAge,
    projectedAssetBase,
    projectedLiquidBase,
    projectedRealEstateBase,
    projectedUsableBase,
    retirementLumpSum: lumpSum,
    monthlyPension,
    netMonthlyNeeded_today,
    netMonthlyNeeded_retirement,
    netMonthlyNeeded_finalYear,
    targetAsset,
    targetAssetSWR,
    withdrawalRate,
    gap,
    requiredMonthlySavings,
    suggestedWithdrawalRate,
    withdrawalYears,
  }
}
