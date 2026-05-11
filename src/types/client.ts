export type IncomeType = 'fixed' | 'variable' | 'one_time'

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  fixed: '固定',
  variable: '變動',
  one_time: '一次性',
}

export type PayFrequency = 'monthly' | 'quarterly' | 'annual'

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  monthly: '月',
  quarterly: '季',
  annual: '年',
}

export interface IncomeItem {
  label: string
  amount: number        // 每次發生金額（monthly=月額，quarterly=季額，annual=年額）
  type: IncomeType
  frequency?: PayFrequency  // 預設 'monthly'
  payMonths?: number[]      // 發生月份 1-12；monthly 時忽略
  growthRate?: number       // 年成長率，如 0.05 = 5%
  note?: string
}

export type ExpenseCategory = 'survival' | 'responsibility' | 'quality' | 'growth' | 'hidden' | 'one_time'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  survival: '生存',
  responsibility: '責任',
  quality: '生活品質',
  growth: '成長',
  hidden: '隱性',
  one_time: '一次性',
}

export interface ExpenseItem {
  label: string
  amount: number        // 每次發生金額
  category: ExpenseCategory
  frequency?: PayFrequency  // 預設 'monthly'
  payMonths?: number[]
  note?: string
}

export type InvestmentCategory =
  | 'cash' | 'real_estate'
  | 'insurance' | 'stock' | 'fund' | 'bond' | 'crypto' | 'other'

export const INVESTMENT_CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  cash: '現金存款',
  real_estate: '不動產',
  insurance: '保險',
  stock: '股票',
  fund: '基金',
  bond: '債券',
  crypto: '加密貨幣',
  other: '其他',
}

export type AssetCurrency = 'TWD' | 'USD' | 'JPY' | 'EUR' | 'GBP' | 'HKD' | 'USDT' | 'other'

export const ASSET_CURRENCY_LABELS: Record<AssetCurrency, string> = {
  TWD: 'TWD', USD: 'USD', JPY: 'JPY',
  EUR: 'EUR', GBP: 'GBP', HKD: 'HKD',
  USDT: 'USDT', other: '其他',
}

export type AssetPurpose = 'emergency' | 'growth' | 'income' | 'protection'

export const ASSET_PURPOSE_LABELS: Record<AssetPurpose, string> = {
  emergency: '生活備用金', growth: '長期成長',
  income: '收益型', protection: '積極型',
}

export interface LedgerLine {
  id: string
  assetItemId: string
  amountDelta: number
  qtyDelta?: number
  price?: number
  note?: string
}

export interface LedgerEntry {
  id: string
  description: string
  date: string
  lines: LedgerLine[]
}

export interface AssetPeriodSnapshot {
  id: string
  periodLabel: string
  snapshotDate: string
  openingAssets: number
  netContribution: number
  dividendIncome: number
  fxImpact: number
  fees: number
  assetItems?: InvestmentItem[]
  ledgerEntries?: LedgerEntry[]
  closingAssets?: number
  openingAssetItems?: InvestmentItem[]
}

export interface InvestmentItem {
  id: string
  label: string
  amount: number
  category: InvestmentCategory
  currency?: AssetCurrency
  institution?: string
  purpose?: AssetPurpose
  note?: string
  ticker?: string
  unitPrice?: number
  units?: number
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

  // 基本資料
  occupation?: string
  consultationFocus?: string
  consultationAdvice?: string[]

  // 基本財務狀況
  incomes: IncomeItem[]
  expenses: ExpenseItem[]
  assetItems: InvestmentItem[]
  liabilityItems: LiabilityItem[]

  // 投資偏好
  riskProfile: RiskProfile
  customReturnRate: number | null
  monthlyContribution: number
  useInvestibleCashFlow: boolean  // true = 定期投入連動可投資現金流
  globalInflationRate: number  // 全局通膨率，影響支出 projection，預設 0.02
  targetAllocation: Partial<Record<InvestmentCategory, number>>  // 各類別目標 %（0-100）
  toleranceBand: number   // 容許偏離 %，預設 5
  assetSnapshots: AssetPeriodSnapshot[]  // Layer 2 快照列表（最新在前）

  // 人生目標
  birthYear: number
  retirementAge: number
  retirementLifespan: number
  targetMonthlyRetirementIncome: number
  majorExpenses: MajorExpense[]
}

export function calcCurrentAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear
}

export interface VisibleModules {
  basicInfo: boolean
  cashflow: boolean
  assets: boolean
  assetGrowth: boolean
  retirement: boolean
}

export interface SharedSnapshot {
  id: string
  snapshot_data: ClientProfile
  visible_modules: VisibleModules
  password_hash: string
  created_at: string
  expires_at?: string | null
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
    occupation: '',
    consultationFocus: '',
    consultationAdvice: [],
    incomes: [
      { label: '薪資收入', amount: 80000, type: 'fixed' },
    ],
    expenses: [
      { label: '房租/房貸', amount: 20000, category: 'survival' },
      { label: '保費', amount: 5000, category: 'responsibility', note: '年繳 60,000，此為月均攤' },
      { label: '飲食', amount: 12000, category: 'survival' },
      { label: '交通', amount: 5000, category: 'survival' },
      { label: '娛樂', amount: 5000, category: 'quality' },
    ],
    assetItems: [
      { id: crypto.randomUUID(), label: '活存', amount: 500000, category: 'cash' },
      { id: crypto.randomUUID(), label: '台股 ETF', amount: 200000, category: 'stock' },
    ],
    liabilityItems: [],
    riskProfile: 'moderate',
    customReturnRate: null,
    monthlyContribution: 10000,
    useInvestibleCashFlow: false,
    globalInflationRate: 0.02,
    targetAllocation: {},
    toleranceBand: 5,
    assetSnapshots: [],
    birthYear: new Date().getFullYear() - 35,
    retirementAge: 60,
    retirementLifespan: 30,
    targetMonthlyRetirementIncome: 50000,
    majorExpenses: [],
  }
}
