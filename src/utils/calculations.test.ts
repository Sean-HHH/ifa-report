import { describe, it, expect } from 'vitest'
import {
  calcCashFlow, calcAssetGrowth, calcRetirement,
  totalAssets, totalLiabilities, netWorth,
  fmtNTD, fmtPct,
} from './calculations'
import type { ClientProfile } from '../types/client'

// ── Fixture ──────────────────────────────────────────────────

function makeClient(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    id: 'test-001',
    name: '測試客戶',
    updatedAt: new Date().toISOString(),
    incomes: [{ label: '薪資', amount: 80000, type: 'fixed' }],
    expenses: [
      { label: '房租', amount: 20000, category: 'survival' },
      { label: '飲食', amount: 10000, category: 'survival' },
    ],
    assetItems: [{ label: '現金', amount: 1000000, category: 'cash' }],
    liabilityItems: [],
    riskProfile: 'moderate',
    customReturnRate: null,
    monthlyContribution: 10000,
    currentAge: 35,
    retirementAge: 60,
    targetMonthlyRetirementIncome: 50000,
    majorExpenses: [],
    ...overrides,
  }
}

// ── calcCashFlow ─────────────────────────────────────────────

describe('calcCashFlow', () => {
  it('帳面現金流 = 總收入 - 總支出', () => {
    const result = calcCashFlow(makeClient())
    expect(result.totalIncome).toBe(80000)
    expect(result.totalExpenses).toBe(30000)
    expect(result.netCashFlow).toBe(50000)
  })

  it('incomeByType 按 type 正確分組', () => {
    const c = makeClient({
      incomes: [
        { label: '薪資', amount: 60000, type: 'fixed' },
        { label: '接案', amount: 20000, type: 'variable' },
        { label: '年終', amount: 10000, type: 'one_time' },
      ],
    })
    const result = calcCashFlow(c)
    expect(result.incomeByType.fixed).toBe(60000)
    expect(result.incomeByType.variable).toBe(20000)
    expect(result.incomeByType.one_time).toBe(10000)
  })

  it('expenseByCategory 按 category 正確分組', () => {
    const c = makeClient({
      expenses: [
        { label: '房租', amount: 20000, category: 'survival' },
        { label: '保費', amount: 5000, category: 'responsibility' },
        { label: '旅遊', amount: 8000, category: 'quality' },
        { label: '課程', amount: 3000, category: 'growth' },
      ],
    })
    const result = calcCashFlow(c)
    expect(result.expenseByCategory.survival).toBe(20000)
    expect(result.expenseByCategory.responsibility).toBe(5000)
    expect(result.expenseByCategory.quality).toBe(8000)
    expect(result.expenseByCategory.growth).toBe(3000)
  })

  it('真實現金流 = 固定收入 − (生存+責任)', () => {
    const c = makeClient({
      incomes: [
        { label: '薪資', amount: 60000, type: 'fixed' },
        { label: '接案', amount: 20000, type: 'variable' },
      ],
      expenses: [
        { label: '房租', amount: 15000, category: 'survival' },
        { label: '保費', amount: 5000, category: 'responsibility' },
        { label: '旅遊', amount: 10000, category: 'quality' },
      ],
    })
    const result = calcCashFlow(c)
    // 真實 = 60,000 - 15,000 - 5,000 = 40,000
    expect(result.trueNetCashFlow).toBe(40000)
  })

  it('可投資現金流 = 固定收入 − (生存+責任+生活品質+成長)', () => {
    const c = makeClient({
      incomes: [{ label: '薪資', amount: 60000, type: 'fixed' }],
      expenses: [
        { label: '房租', amount: 15000, category: 'survival' },
        { label: '保費', amount: 5000, category: 'responsibility' },
        { label: '旅遊', amount: 8000, category: 'quality' },
        { label: '課程', amount: 2000, category: 'growth' },
        { label: '訂閱', amount: 1000, category: 'hidden' },
      ],
    })
    const result = calcCashFlow(c)
    // 可投資 = 60,000 - 15,000 - 5,000 - 8,000 - 2,000 = 30,000 (hidden 不扣)
    expect(result.investibleCashFlow).toBe(30000)
  })

  it('儲蓄率 = 帳面淨現金流 / 總收入', () => {
    const result = calcCashFlow(makeClient())
    expect(result.savingsRate).toBeCloseTo(62.5)
  })

  it('年度儲蓄 = 帳面月淨現金流 × 12', () => {
    const result = calcCashFlow(makeClient())
    expect(result.annualSavings).toBe(50000 * 12)
  })

  it('收入為零時儲蓄率為 0（不除以零）', () => {
    const result = calcCashFlow(makeClient({ incomes: [] }))
    expect(result.totalIncome).toBe(0)
    expect(result.savingsRate).toBe(0)
  })

  it('無收支時各現金流均為 0', () => {
    const result = calcCashFlow(makeClient({ incomes: [], expenses: [] }))
    expect(result.netCashFlow).toBe(0)
    expect(result.trueNetCashFlow).toBe(0)
    expect(result.investibleCashFlow).toBe(0)
  })
})

// ── totalAssets / totalLiabilities / netWorth ────────────────

describe('資產負債', () => {
  it('totalAssets 加總所有資產', () => {
    const c = makeClient({
      assetItems: [
        { label: '現金', amount: 500000, category: 'cash' },
        { label: '股票', amount: 200000, category: 'stock' },
      ],
    })
    expect(totalAssets(c)).toBe(700000)
  })

  it('totalLiabilities 加總所有負債', () => {
    const c = makeClient({
      liabilityItems: [
        { label: '房貸', amount: 5000000, type: 'long_term' },
        { label: '信用卡', amount: 50000, type: 'current' },
      ],
    })
    expect(totalLiabilities(c)).toBe(5050000)
  })

  it('netWorth = 總資產 - 總負債', () => {
    const c = makeClient({
      assetItems: [{ label: '現金', amount: 2000000, category: 'cash' }],
      liabilityItems: [{ label: '房貸', amount: 1000000, type: 'long_term' }],
    })
    expect(netWorth(c)).toBe(1000000)
  })

  it('無負債時 netWorth = totalAssets', () => {
    const c = makeClient({ liabilityItems: [] })
    expect(netWorth(c)).toBe(totalAssets(c))
  })
})

// ── calcAssetGrowth ──────────────────────────────────────────

describe('calcAssetGrowth', () => {
  it('三情境：保守 ≤ 基準 ≤ 積極', () => {
    const growth = calcAssetGrowth(makeClient())
    const last = growth[growth.length - 1]
    expect(last.conservative).toBeLessThanOrEqual(last.base)
    expect(last.base).toBeLessThanOrEqual(last.aggressive)
  })

  it('第一年起點 = netWorth', () => {
    const c = makeClient()
    const growth = calcAssetGrowth(c)
    const nw = netWorth(c)
    expect(growth[0].conservative).toBe(nw)
    expect(growth[0].base).toBe(nw)
    expect(growth[0].aggressive).toBe(nw)
  })

  it('年數 = retirementAge - currentAge + 1', () => {
    const c = makeClient({ currentAge: 35, retirementAge: 60 })
    expect(calcAssetGrowth(c)).toHaveLength(26)
  })

  it('customReturnRate 會覆蓋 riskProfile 預設值', () => {
    const withDefault = calcAssetGrowth(makeClient())
    const withCustom = calcAssetGrowth(makeClient({ customReturnRate: 0.12 }))
    const last = (g: ReturnType<typeof calcAssetGrowth>) => g[g.length - 1]
    expect(last(withCustom).base).toBeGreaterThan(last(withDefault).base)
  })
})

// ── calcRetirement ───────────────────────────────────────────

describe('calcRetirement', () => {
  it('targetAsset = monthlyIncome × 12 × 25（25 倍法則）', () => {
    const c = makeClient({ targetMonthlyRetirementIncome: 50000 })
    const r = calcRetirement(c)
    expect(r.targetAsset).toBe(50000 * 12 * 25)
  })

  it('gap = targetAsset - projectedAssetBase', () => {
    const r = calcRetirement(makeClient())
    expect(r.gap).toBeCloseTo(r.targetAsset - r.projectedAssetBase, 0)
  })

  it('充足資產時 requiredMonthlySavings = 0', () => {
    const c = makeClient({
      assetItems: [{ label: '現金', amount: 100_000_000, category: 'cash' }],
      targetMonthlyRetirementIncome: 10000,
    })
    const r = calcRetirement(c)
    expect(r.requiredMonthlySavings).toBe(0)
  })

  it('提款曲線長度 = 31 年（含退休當年）', () => {
    const r = calcRetirement(makeClient())
    expect(r.withdrawalYears).toHaveLength(31)
  })

  it('提款曲線資產不為負數', () => {
    const r = calcRetirement(makeClient())
    r.withdrawalYears.forEach(y => {
      expect(y.base).toBeGreaterThanOrEqual(0)
    })
  })
})

// ── fmtNTD ───────────────────────────────────────────────────

describe('fmtNTD', () => {
  it('compact=false 輸出完整貨幣格式', () => {
    expect(fmtNTD(100000)).toContain('100,000')
  })

  it('compact=true, ≥ 1 億 → 顯示「億」', () => {
    expect(fmtNTD(150000000, true)).toBe('1.5 億')
  })

  it('compact=true, ≥ 1 萬 → 顯示「萬」', () => {
    expect(fmtNTD(80000, true)).toBe('8 萬')
  })

  it('compact=true, < 1 萬 → 完整數字', () => {
    const result = fmtNTD(5000, true)
    expect(result).toContain('5,000')
  })

  it('負數 compact 顯示正確', () => {
    expect(fmtNTD(-20000, true)).toBe('-2 萬')
  })
})

// ── fmtPct ───────────────────────────────────────────────────

describe('fmtPct', () => {
  it('顯示一位小數 + %', () => {
    expect(fmtPct(62.5)).toBe('62.5%')
  })

  it('整數補 .0', () => {
    expect(fmtPct(10)).toBe('10.0%')
  })
})

// ── E2E Critical Path ─────────────────────────────────────────

describe('E2E: 完整客戶財務規劃流程', () => {
  it('收支 → 資產 → 退休：資料流一致', () => {
    const client = makeClient({
      incomes: [
        { label: '薪資', amount: 100000, type: 'fixed' },
      ],
      expenses: [
        { label: '房租', amount: 25000, category: 'survival' },
        { label: '生活', amount: 20000, category: 'quality' },
      ],
      assetItems: [
        { label: '現金', amount: 2000000, category: 'cash' },
        { label: '股票', amount: 500000, category: 'stock' },
      ],
      liabilityItems: [{ label: '房貸', amount: 3000000, type: 'long_term' }],
      riskProfile: 'moderate',
      monthlyContribution: 20000,
      currentAge: 35,
      retirementAge: 65,
      targetMonthlyRetirementIncome: 60000,
    })

    const cf = calcCashFlow(client)
    const nw = netWorth(client)
    const retirement = calcRetirement(client)

    expect(cf.netCashFlow).toBeGreaterThan(0)
    expect(nw).toBe(2000000 + 500000 - 3000000)
    expect(retirement.targetAsset).toBe(60000 * 12 * 25)
    expect(retirement.yearsToRetirement).toBe(30)
    expect(retirement.withdrawalYears[0].base).toBeCloseTo(retirement.projectedAssetBase, 0)

    // 三種現金流：帳面 > 真實 ≥ 可投資（此例固定收入100K，生存25K，責任0，品質20K）
    // 真實 = 100,000 - 25,000 - 0 = 75,000
    // 可投資 = 75,000 - 20,000 - 0 = 55,000
    expect(cf.trueNetCashFlow).toBe(75000)
    expect(cf.investibleCashFlow).toBe(55000)
  })
})
