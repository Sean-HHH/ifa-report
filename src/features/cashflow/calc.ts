import type { ClientProfile, FinancialScenario } from '../../types/client'
import type { IncomeType, ExpenseCategory, PayFrequency } from '../../types/client'
import type { FxRates } from '../fx/exchangeRate'
import { convertCurrency } from '../assets/calc'

function toMonthlyEquiv(amount: number, freq: PayFrequency = 'monthly'): number {
  if (freq === 'quarterly') return (amount * 4) / 12
  if (freq === 'annual') return amount / 12
  return amount
}

export interface CashFlowResult {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  trueNetCashFlow: number
  investibleCashFlow: number
  savingsRate: number
  annualSavings: number
  incomeByType: Record<IncomeType, number>
  expenseByCategory: Record<ExpenseCategory, number>
  incomeStabilityRatio: number
  fixedExpenseRatio: number
  hiddenExpenseRatio: number
}

export function calcCashFlow(c: ClientProfile): CashFlowResult {
  const totalIncome = c.incomes.reduce((s, i) => s + toMonthlyEquiv(i.amount, i.frequency), 0)

  const incomeByType: Record<IncomeType, number> = { fixed: 0, variable: 0, one_time: 0 }
  c.incomes.forEach(i => { incomeByType[i.type] += toMonthlyEquiv(i.amount, i.frequency) })

  const expenseByCategory: Record<ExpenseCategory, number> = {
    survival: 0, responsibility: 0, quality: 0, growth: 0, hidden: 0, one_time: 0,
  }
  c.expenses.forEach(e => { expenseByCategory[e.category] += toMonthlyEquiv(e.amount, e.frequency) })

  const totalExpenses = c.expenses.reduce((s, e) => s + toMonthlyEquiv(e.amount, e.frequency), 0)
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

export interface CashFlowProjectionYear {
  year: number
  totalIncome: number
  totalExpenses: number
  net: number
  true_: number
  investible: number
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

export interface MonthlyMonth {
  month: number
  income: number
  expense: number
  net: number
  isCrunch: boolean
  isPast: boolean  // month < planStartMonth
}

export interface MonthlyTimelineResult {
  months: MonthlyMonth[]
  crunchMonths: number[]
  needsBridging: boolean
  worstMonth: { month: number; deficit: number } | null
  bestMonth: { month: number; surplus: number } | null
  incomeSpread: number
}

function resolvePayMonths(freq: PayFrequency, payMonths?: number[]): number[] | null {
  if (freq === 'monthly') return null
  if (payMonths && payMonths.length > 0) return payMonths
  return freq === 'quarterly' ? [3, 6, 9, 12] : [12]
}

export function calcMonthlyTimeline(c: ClientProfile): MonthlyTimelineResult {
  const months: MonthlyMonth[] = []
  const startMonth = c.planStartMonth ?? 1

  for (let m = 1; m <= 12; m++) {
    let income = 0
    let expense = 0

    for (const item of c.incomes) {
      const freq = item.frequency ?? 'monthly'
      const pay = resolvePayMonths(freq, item.payMonths)
      if (pay === null || pay.includes(m)) income += item.amount
    }

    for (const item of c.expenses) {
      const freq = item.frequency ?? 'monthly'
      const pay = resolvePayMonths(freq, item.payMonths)
      if (pay === null || pay.includes(m)) expense += item.amount
    }

    const net = income - expense
    months.push({ month: m, income, expense, net, isCrunch: net < 0, isPast: m < startMonth })
  }

  const crunchMonths = months.filter(m => m.isCrunch).map(m => m.month)
  const nets = months.map(m => m.net)
  const minNet = Math.min(...nets)
  const maxNet = Math.max(...nets)

  const worstMonth = minNet < 0
    ? { month: months.find(m => m.net === minNet)!.month, deficit: Math.abs(minNet) }
    : null
  const bestMonth = { month: months.find(m => m.net === maxNet)!.month, surplus: maxNet }

  const incomes = months.map(m => m.income)
  const incomeSpread = Math.max(...incomes) - Math.min(...incomes)

  return { months, crunchMonths, needsBridging: crunchMonths.length > 0, worstMonth, bestMonth, incomeSpread }
}

export interface RemainingYearResult {
  remainingMonths: number
  remainingTotalIncome: number
  remainingTotalExpenses: number
  remainingNetTotal: number
  alreadyOccurredIncomes: string[]
  alreadyOccurredExpenses: string[]
}

export function calcRemainingYearCashFlow(c: ClientProfile): RemainingYearResult {
  const startMonth = c.planStartMonth ?? 1
  const remainingMonths = 13 - startMonth

  let remainingTotalIncome = 0
  const alreadyOccurredIncomes: string[] = []

  for (const item of c.incomes) {
    const freq = item.frequency ?? 'monthly'
    if (freq === 'monthly') {
      remainingTotalIncome += item.amount * remainingMonths
    } else {
      const pay = resolvePayMonths(freq, item.payMonths)!
      const future = pay.filter(m => m >= startMonth)
      if (future.length === 0) {
        alreadyOccurredIncomes.push(item.label)
      } else {
        remainingTotalIncome += item.amount * future.length
      }
    }
  }

  let remainingTotalExpenses = 0
  const alreadyOccurredExpenses: string[] = []

  for (const item of c.expenses) {
    const freq = item.frequency ?? 'monthly'
    if (freq === 'monthly') {
      remainingTotalExpenses += item.amount * remainingMonths
    } else {
      const pay = resolvePayMonths(freq, item.payMonths)!
      const future = pay.filter(m => m >= startMonth)
      if (future.length === 0) {
        alreadyOccurredExpenses.push(item.label)
      } else {
        remainingTotalExpenses += item.amount * future.length
      }
    }
  }

  return {
    remainingMonths,
    remainingTotalIncome,
    remainingTotalExpenses,
    remainingNetTotal: remainingTotalIncome - remainingTotalExpenses,
    alreadyOccurredIncomes,
    alreadyOccurredExpenses,
  }
}

export interface RunwayDate {
  year: number
  month: number
}

export interface RunwayMonth extends RunwayDate {
  openingCash: number
  income: number
  expenses: number
  majorExpenses: number
  contribution: number
  closingCash: number
  isScenarioActive: boolean
}

export interface RunwayResult {
  months: RunwayMonth[]
  startingCash: number
  cashAtTransition: number | null
  safetyFloor: number
  firstBelowSafety: RunwayDate | null
  firstDepleted: RunwayDate | null
  monthsUntilDepletion: number | null
  minimumMonthlyIncome: number | null
  transitionIndex: number
}

function monthOffset(date: RunwayDate): number {
  return date.year * 12 + date.month - 1
}

function monthAt(start: RunwayDate, offset: number): RunwayDate {
  const index = monthOffset(start) + offset
  return { year: Math.floor(index / 12), month: index % 12 + 1 }
}

function occursInMonth(frequency: PayFrequency = 'monthly', payMonths: number[] | undefined, month: number): boolean {
  const months = resolvePayMonths(frequency, payMonths)
  return months === null || months.includes(month)
}

export function calcRunway(
  client: ClientProfile,
  scenario: FinancialScenario,
  rates: FxRates,
  projectionStart: RunwayDate = monthAt({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, 1),
): RunwayResult {
  const projectionMonths = Math.min(60, Math.max(1, Math.trunc(scenario.projectionMonths || 36)))
  const transition = monthOffset({ year: scenario.startYear, month: scenario.startMonth })
  const firstMonth = monthOffset(projectionStart)
  const transitionIndex = Math.max(0, transition - firstMonth)
  const hasTransition = transitionIndex < projectionMonths
  const recurring = (scenario.recurringExpenses ?? []).reduce((sum, item) => sum + Math.max(0, item.amount), 0)
  const inflation = client.globalInflationRate ?? 0.02
  const yearAtTransition = Math.max(projectionStart.year, scenario.startYear)
  const transitionExpenseAverage = client.expenses.reduce((sum, item) =>
    sum + toMonthlyEquiv(item.amount, item.frequency) * Math.pow(1 + inflation, yearAtTransition - projectionStart.year), 0)
  const safetyFloor = Math.max(0, (scenario.monthlyExpenses ?? transitionExpenseAverage) + recurring)
    * Math.max(0, scenario.safetyMonths)
  const startingCash = client.assetItems
    .filter(item => item.category === 'cash')
    .reduce((sum, item) => sum + convertCurrency(item.amount, item.currency ?? 'TWD', 'TWD', rates), 0)
  const baselineContribution = client.useInvestibleCashFlow
    ? Math.max(0, calcCashFlow(client).investibleCashFlow)
    : Math.max(0, client.monthlyContribution)

  const months: RunwayMonth[] = []
  let cash = startingCash
  let firstBelowSafety: RunwayDate | null = cash < safetyFloor ? projectionStart : null
  let firstDepleted: RunwayDate | null = cash <= 0 ? projectionStart : null

  for (let index = 0; index < projectionMonths; index++) {
    const date = monthAt(projectionStart, index)
    const active = monthOffset(date) >= transition
    const yearOffset = date.year - projectionStart.year
    const itemizedIncome = client.incomes.reduce((sum, item) =>
      sum + (occursInMonth(item.frequency, item.payMonths, date.month)
        ? item.amount * Math.pow(1 + (item.growthRate ?? 0), yearOffset) : 0), 0)
    const itemizedExpenses = client.expenses.reduce((sum, item) =>
      sum + (occursInMonth(item.frequency, item.payMonths, date.month)
        ? item.amount * Math.pow(1 + inflation, yearOffset) : 0), 0)
    const income = Math.max(0, active ? (scenario.monthlyIncome ?? itemizedIncome) : itemizedIncome)
    const expenses = Math.max(0, active ? (scenario.monthlyExpenses ?? itemizedExpenses) + recurring : itemizedExpenses)
    const planned = client.majorExpenses
      .filter(item => item.year === date.year && (item.month ?? 12) === date.month)
      .reduce((sum, item) => sum + Math.max(0, item.amount), 0)
    const scenarioExpenses = active
      ? (scenario.oneTimeExpenses ?? [])
        .filter(item => item.year === date.year && item.month === date.month)
        .reduce((sum, item) => sum + Math.max(0, item.amount), 0)
      : 0
    const majorExpenses = planned + scenarioExpenses
    const contribution = active ? Math.max(0, scenario.monthlyContribution) : baselineContribution
    const openingCash = cash
    cash += income - expenses - majorExpenses - contribution
    months.push({ ...date, openingCash, income, expenses, majorExpenses, contribution, closingCash: cash, isScenarioActive: active })
    if (!firstBelowSafety && cash < safetyFloor) firstBelowSafety = date
    if (!firstDepleted && cash <= 0) firstDepleted = date
  }

  let minimumMonthlyIncome: number | null = null
  const breachedBeforeTransition = hasTransition && (
    months[transitionIndex].openingCash < safetyFloor ||
    (firstBelowSafety !== null && monthOffset(firstBelowSafety) < transition)
  )
  if (hasTransition && !breachedBeforeTransition) {
    let noIncomeCash = months[transitionIndex].openingCash
    let needed = 0
    for (let index = transitionIndex; index < months.length; index++) {
      const month = months[index]
      noIncomeCash -= month.expenses + month.majorExpenses + month.contribution
      needed = Math.max(needed, (safetyFloor - noIncomeCash) / (index - transitionIndex + 1))
    }
    minimumMonthlyIncome = Math.ceil(needed)
  }

  const depletedIndex = firstDepleted
    ? Math.max(0, monthOffset(firstDepleted) - firstMonth)
    : -1

  return {
    months,
    startingCash,
    cashAtTransition: hasTransition ? months[transitionIndex].openingCash : null,
    safetyFloor,
    firstBelowSafety,
    firstDepleted,
    monthsUntilDepletion: depletedIndex < 0 ? null : Math.max(0, depletedIndex - transitionIndex),
    minimumMonthlyIncome,
    transitionIndex: hasTransition ? transitionIndex : -1,
  }
}
