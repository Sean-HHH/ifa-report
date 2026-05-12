import { describe, it, expect } from 'vitest'
import {
  calcCashFlow, calcAssetGrowth, calcRetirement, calcCashFlowProjection,
  calcMonthlyTimeline,
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
    assetItems: [{ id: 'a1', label: '現金', amount: 1000000, category: 'cash' }],
    liabilityItems: [],
    riskProfile: 'moderate',
    customReturnRate: null,
    monthlyContribution: 10000,
    useInvestibleCashFlow: false,
    globalInflationRate: 0.02,
    targetAllocation: {},
    toleranceBand: 5,
    assetSnapshots: [],
    ledgerEntries: [],
    birthYear: new Date().getFullYear() - 35,
    retirementAge: 60,
    retirementLifespan: 30,
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
        { id: 'a1', label: '現金', amount: 500000, category: 'cash' },
        { id: 'a2', label: '股票', amount: 200000, category: 'stock' },
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
      assetItems: [{ id: 'a1', label: '現金', amount: 2000000, category: 'cash' }],
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

  it('固定回傳 30 筆資料', () => {
    const c = makeClient({ birthYear: new Date().getFullYear() - 35, retirementAge: 60 })
    expect(calcAssetGrowth(c)).toHaveLength(30)
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
      assetItems: [{ id: 'a1', label: '現金', amount: 100_000_000, category: 'cash' }],
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

// ── calcCashFlowProjection ────────────────────────────────────

describe('calcCashFlowProjection', () => {
  it('預設回傳 6 個點（年 0–5）', () => {
    expect(calcCashFlowProjection(makeClient())).toHaveLength(6)
  })

  it('year 0 的數字與 calcCashFlow 一致', () => {
    const c = makeClient()
    const cf = calcCashFlow(c)
    const proj = calcCashFlowProjection(c)
    expect(proj[0].net).toBeCloseTo(cf.netCashFlow)
    expect(proj[0].true_).toBeCloseTo(cf.trueNetCashFlow)
    expect(proj[0].investible).toBeCloseTo(cf.investibleCashFlow)
  })

  it('收入 growthRate 5% → 第 5 年收入 ≈ 原×1.05⁵', () => {
    const c = makeClient({
      incomes: [{ label: '薪資', amount: 60000, type: 'fixed', growthRate: 0.05 }],
    })
    const proj = calcCashFlowProjection(c)
    const expected = 60000 * Math.pow(1.05, 5)
    expect(proj[5].totalIncome).toBeCloseTo(expected, 0)
  })

  it('通膨 2% → 第 5 年支出 ≈ 原×1.02⁵', () => {
    const c = makeClient({
      expenses: [{ label: '房租', amount: 20000, category: 'survival' }],
      globalInflationRate: 0.02,
    })
    const proj = calcCashFlowProjection(c)
    const expected = 20000 * Math.pow(1.02, 5)
    expect(proj[5].totalExpenses).toBeCloseTo(expected, 0)
  })

  it('無成長率時收入每年持平', () => {
    const c = makeClient({
      incomes: [{ label: '薪資', amount: 80000, type: 'fixed' }],
      globalInflationRate: 0,
    })
    const proj = calcCashFlowProjection(c)
    proj.forEach(p => expect(p.totalIncome).toBeCloseTo(80000))
  })
})

// ── calcMonthlyTimeline ──────────────────────────────────────

describe('calcMonthlyTimeline', () => {
  it('全月度收支：12 個月金額完全相同', () => {
    const c = makeClient({
      incomes: [{ label: '薪資', amount: 80000, type: 'fixed', frequency: 'monthly' }],
      expenses: [{ label: '房租', amount: 30000, category: 'survival', frequency: 'monthly' }],
    })
    const tl = calcMonthlyTimeline(c)
    expect(tl.months).toHaveLength(12)
    tl.months.forEach(m => {
      expect(m.income).toBe(80000)
      expect(m.expense).toBe(30000)
      expect(m.net).toBe(50000)
      expect(m.isCrunch).toBe(false)
    })
    expect(tl.needsBridging).toBe(false)
    expect(tl.incomeSpread).toBe(0)
  })

  it('年底獎金（annual, 12月）只在 12 月出現', () => {
    const c = makeClient({
      incomes: [
        { label: '薪資', amount: 60000, type: 'fixed', frequency: 'monthly' },
        { label: '年終', amount: 120000, type: 'one_time', frequency: 'annual', payMonths: [12] },
      ],
      expenses: [{ label: '房租', amount: 20000, category: 'survival', frequency: 'monthly' }],
    })
    const tl = calcMonthlyTimeline(c)
    const dec = tl.months.find(m => m.month === 12)!
    const jan = tl.months.find(m => m.month === 1)!
    expect(dec.income).toBe(60000 + 120000)
    expect(jan.income).toBe(60000)
    expect(tl.incomeSpread).toBe(120000)
    expect(tl.needsBridging).toBe(false)
  })

  it('季度收入（quarterly, payMonths [3,6,9,12]）在 4 個月出現', () => {
    const c = makeClient({
      incomes: [
        { label: '季獎', amount: 30000, type: 'variable', frequency: 'quarterly', payMonths: [3, 6, 9, 12] },
      ],
      expenses: [],
    })
    const tl = calcMonthlyTimeline(c)
    const withIncome = tl.months.filter(m => m.income > 0)
    expect(withIncome).toHaveLength(4)
    withIncome.forEach(m => expect(m.income).toBe(30000))
    const noIncome = tl.months.filter(m => m.income === 0)
    expect(noIncome).toHaveLength(8)
  })

  it('現金流缺口：crunchMonths 正確，needsBridging = true', () => {
    const c = makeClient({
      incomes: [{ label: '薪資', amount: 50000, type: 'fixed', frequency: 'monthly' }],
      expenses: [
        { label: '日常', amount: 30000, category: 'survival', frequency: 'monthly' },
        { label: '保費', amount: 60000, category: 'responsibility', frequency: 'annual', payMonths: [3] },
      ],
    })
    const tl = calcMonthlyTimeline(c)
    expect(tl.needsBridging).toBe(true)
    expect(tl.crunchMonths).toContain(3)
    const march = tl.months.find(m => m.month === 3)!
    // 3月: income 50000, expense 30000+60000=90000, net=-40000
    expect(march.net).toBe(-40000)
    expect(march.isCrunch).toBe(true)
    expect(tl.worstMonth).toEqual({ month: 3, deficit: 40000 })
  })

  it('frequency 預設（undefined）等同 monthly', () => {
    const c = makeClient({
      incomes: [{ label: '薪資', amount: 80000, type: 'fixed' }],
      expenses: [{ label: '房租', amount: 20000, category: 'survival' }],
    })
    const tl = calcMonthlyTimeline(c)
    tl.months.forEach(m => {
      expect(m.income).toBe(80000)
      expect(m.expense).toBe(20000)
    })
    expect(tl.needsBridging).toBe(false)
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
        { id: 'a1', label: '現金', amount: 2000000, category: 'cash' },
        { id: 'a2', label: '股票', amount: 500000, category: 'stock' },
      ],
      liabilityItems: [{ label: '房貸', amount: 3000000, type: 'long_term' }],
      riskProfile: 'moderate',
      monthlyContribution: 20000,
      birthYear: new Date().getFullYear() - 35,
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
