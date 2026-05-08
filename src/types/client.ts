export interface IncomeItem {
  label: string
  amount: number
  note?: string
}

export interface ExpenseItem {
  label: string
  amount: number
  type: 'fixed' | 'variable'
  note?: string
}

export type InvestmentCategory =
  | 'cash' | 'real_estate'
  | 'insurance' | 'stock' | 'fund' | 'deposit' | 'bond' | 'crypto' | 'other'

export const INVESTMENT_CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  cash: '現金存款',
  real_estate: '不動產',
  insurance: '保險',
  stock: '股票',
  fund: '基金',
  deposit: '定存',
  bond: '債券',
  crypto: '加密貨幣',
  other: '其他',
}

export interface InvestmentItem {
  label: string
  amount: number
  category: InvestmentCategory
  note?: string
}

export type LiabilityType = 'long_term' | 'current'

export interface LiabilityItem {
  label: string
  amount: number
  type: LiabilityType
  note?: string
}

export interface MajorExpense {
  label: string
  amount: number
  year: number
}

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'

export interface ClientProfile {
  id: string
  name: string
  updatedAt: string

  // 基本財務狀況
  incomes: IncomeItem[]
  expenses: ExpenseItem[]
  assetItems: InvestmentItem[]   // 全資產（含現金、不動產、投資等）
  liabilityItems: LiabilityItem[]

  // 投資偏好
  riskProfile: RiskProfile
  customReturnRate: number | null
  monthlyContribution: number

  // 人生目標
  currentAge: number
  retirementAge: number
  targetMonthlyRetirementIncome: number
  majorExpenses: MajorExpense[]
}

export const RISK_RETURN: Record<RiskProfile, { conservative: number; base: number; aggressive: number }> = {
  conservative: { conservative: 0.03, base: 0.05, aggressive: 0.07 },
  moderate:     { conservative: 0.04, base: 0.07, aggressive: 0.10 },
  aggressive:   { conservative: 0.05, base: 0.09, aggressive: 0.13 },
}

export function newClient(): ClientProfile {
  return {
    id: crypto.randomUUID(),
    name: '新客戶',
    updatedAt: new Date().toISOString(),
    incomes: [{ label: '薪資收入', amount: 80000 }],
    expenses: [
      { label: '房租/房貸', amount: 20000, type: 'fixed' },
      { label: '保費', amount: 5000, type: 'fixed', note: '年繳 60,000，此為月均攤' },
      { label: '飲食', amount: 12000, type: 'variable' },
      { label: '交通', amount: 5000, type: 'variable' },
      { label: '娛樂', amount: 5000, type: 'variable' },
    ],
    assetItems: [
      { label: '活存 / 定存', amount: 500000, category: 'cash' },
      { label: '台股 ETF', amount: 200000, category: 'stock' },
      { label: '定存', amount: 100000, category: 'deposit' },
    ],
    liabilityItems: [],
    riskProfile: 'moderate',
    customReturnRate: null,
    monthlyContribution: 10000,
    currentAge: 35,
    retirementAge: 60,
    targetMonthlyRetirementIncome: 50000,
    majorExpenses: [],
  }
}
