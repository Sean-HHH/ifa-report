import { useState } from 'react'
import type {
  ClientProfile, IncomeItem, ExpenseItem,
  InvestmentItem, InvestmentCategory, LiabilityItem, LiabilityType, MajorExpense, RiskProfile,
  IncomeType, ExpenseCategory, PayFrequency, AssetCurrency, AssetPurpose,
} from '../../types/client'
import {
  INVESTMENT_CATEGORY_LABELS, INCOME_TYPE_LABELS, EXPENSE_CATEGORY_LABELS, PAY_FREQUENCY_LABELS,
  ASSET_CURRENCY_LABELS, ASSET_PURPOSE_LABELS, RISK_RETURN,
} from '../../types/client'
import { calcCashFlow, convertCurrency, fmtAmount, fmtPct } from '../../utils/calculations'
import type { FxRates } from '../../services/exchangeRate'

interface Props {
  client: ClientProfile
  onChange: (c: ClientProfile) => void
  rates?: FxRates
}

const riskLabels: Record<RiskProfile, string> = {
  conservative: '保守',
  moderate: '穩健',
  aggressive: '積極',
}

// ── 頻率輔助 ────────────────────────────────────────────────

function quarterlyMonths(anchor: number): number[] {
  return [anchor, anchor + 3, anchor + 6, anchor + 9]
}

function quarterlyAnchor(payMonths?: number[]): number {
  return payMonths?.[0] ?? 3
}

function handleFrequencyChange(freq: PayFrequency): { frequency: PayFrequency; payMonths?: number[] } {
  if (freq === 'quarterly') return { frequency: freq, payMonths: quarterlyMonths(3) }
  if (freq === 'annual') return { frequency: freq, payMonths: [12] }
  return { frequency: freq, payMonths: undefined }
}

// ── 備注展開元件 ────────────────────────────────────────────

function NoteField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value)
  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs text-slate-400 hover:text-blue-400 transition-colors mt-0.5 flex items-center gap-1">
          <span>+</span> 備注
        </button>
      ) : (
        <div className="flex items-start gap-1 mt-1">
          <span className="text-slate-300 text-xs mt-2">📝</span>
          <textarea
            rows={2}
            placeholder="備注（如：年繳 60,000，此為月均攤）"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 focus:border-blue-300 outline-none resize-none"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
          <button onClick={() => { onChange(''); setOpen(false) }}
            className="text-slate-300 hover:text-red-400 text-xs mt-1">✕</button>
        </div>
      )}
    </div>
  )
}

// ── 主元件 ─────────────────────────────────────────────────

export function InputForm({ client: c, onChange, rates }: Props) {
  const [tab, setTab] = useState<'finance' | 'invest' | 'goals'>('finance')

  const patch = (partial: Partial<ClientProfile>) => onChange({ ...c, ...partial })

  // Income
  const updateIncome = (i: number, patch2: Partial<IncomeItem>) =>
    patch({ incomes: c.incomes.map((item, idx) => idx === i ? { ...item, ...patch2 } : item) })
  const addIncome = () => patch({ incomes: [...c.incomes, { label: '其他收入', amount: 0, type: 'fixed' }] })
  const removeIncome = (i: number) => patch({ incomes: c.incomes.filter((_, idx) => idx !== i) })

  // Expense
  const updateExpense = (i: number, patch2: Partial<ExpenseItem>) =>
    patch({ expenses: c.expenses.map((item, idx) => idx === i ? { ...item, ...patch2 } : item) })
  const addExpense = () =>
    patch({ expenses: [...c.expenses, { label: '新項目', amount: 0, category: 'survival' }] })
  const removeExpense = (i: number) => patch({ expenses: c.expenses.filter((_, idx) => idx !== i) })

  // Asset
  const TRADEABLE = new Set<InvestmentCategory>(['stock', 'fund', 'bond', 'crypto'])

  const updateAsset = (i: number, patch2: Partial<InvestmentItem>) =>
    patch({ assetItems: c.assetItems.map((item, idx) => idx === i ? { ...item, ...patch2 } : item) })
  const addAsset = () =>
    patch({ assetItems: [...c.assetItems, { label: '新項目', amount: 0, category: 'cash' }] })
  const removeAsset = (i: number) => patch({ assetItems: c.assetItems.filter((_, idx) => idx !== i) })

  const handleTradeableField = (i: number, field: 'unitPrice' | 'units', value: number) => {
    const item = c.assetItems[i]
    const unitPrice = field === 'unitPrice' ? value : (item.unitPrice ?? 0)
    const units     = field === 'units'     ? value : (item.units     ?? 0)
    updateAsset(i, {
      [field]: value,
      amount: unitPrice > 0 && units > 0 ? unitPrice * units : item.amount,
    })
  }

  // Liability
  const updateLiability = (i: number, patch2: Partial<LiabilityItem>) =>
    patch({ liabilityItems: c.liabilityItems.map((item, idx) => idx === i ? { ...item, ...patch2 } : item) })
  const addLiability = (type: LiabilityType) =>
    patch({ liabilityItems: [...c.liabilityItems, { label: '新負債', amount: 0, type }] })
  const removeLiability = (i: number) => patch({ liabilityItems: c.liabilityItems.filter((_, idx) => idx !== i) })

  // Major expenses
  const updateMajor = (i: number, patch2: Partial<MajorExpense>) =>
    patch({ majorExpenses: c.majorExpenses.map((item, idx) => idx === i ? { ...item, ...patch2 } : item) })
  const addMajor = () =>
    patch({ majorExpenses: [...c.majorExpenses, { label: '重大支出', amount: 0, year: new Date().getFullYear() + 5 }] })
  const removeMajor = (i: number) => patch({ majorExpenses: c.majorExpenses.filter((_, idx) => idx !== i) })

  const totalLiab = c.liabilityItems.reduce((s, l) => s + l.amount, 0)
  const totalAssets = c.assetItems.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      {/* Name */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <input
          className="text-xl font-semibold text-slate-800 bg-transparent border-b-2 border-transparent focus:border-blue-300 outline-none w-full pb-1 transition-colors"
          value={c.name}
          onChange={e => patch({ name: e.target.value })}
          placeholder="客戶姓名"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {(['finance', 'invest', 'goals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t ? 'text-blue-600 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-600'
            }`}>
            {t === 'finance' ? '財務狀況' : t === 'invest' ? '投資偏好' : '人生目標'}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-6">
        {/* ── 財務狀況 ── */}
        {tab === 'finance' && (
          <>
            <Section title="收入項目">
              {c.incomes.map((item, i) => (
                <div key={i} className="mb-3 bg-slate-50 rounded-xl p-3">
                  <div className="flex gap-2 items-center">
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs focus:border-blue-300 outline-none shrink-0"
                      value={item.type}
                      onChange={e => updateIncome(i, { type: e.target.value as IncomeType })}>
                      {(Object.keys(INCOME_TYPE_LABELS) as IncomeType[]).map(t => (
                        <option key={t} value={t}>{INCOME_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                      value={item.label} onChange={e => updateIncome(i, { label: e.target.value })} placeholder="收入名稱" />
                    <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                      value={item.amount} onChange={e => updateIncome(i, { amount: Number(e.target.value) })} />
                    <button onClick={() => removeIncome(i)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">頻率</span>
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                      value={item.frequency ?? 'monthly'}
                      onChange={e => updateIncome(i, handleFrequencyChange(e.target.value as PayFrequency))}>
                      {(Object.keys(PAY_FREQUENCY_LABELS) as PayFrequency[]).map(f => (
                        <option key={f} value={f}>{PAY_FREQUENCY_LABELS[f]}</option>
                      ))}
                    </select>
                    {(item.frequency === 'quarterly') && (
                      <>
                        <span className="text-xs text-slate-400">發生月</span>
                        <select
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                          value={quarterlyAnchor(item.payMonths)}
                          onChange={e => updateIncome(i, { payMonths: quarterlyMonths(Number(e.target.value)) })}>
                          <option value={1}>1/4/7/10月</option>
                          <option value={2}>2/5/8/11月</option>
                          <option value={3}>3/6/9/12月</option>
                        </select>
                      </>
                    )}
                    {(item.frequency === 'annual') && (
                      <>
                        <span className="text-xs text-slate-400">發生月</span>
                        <select
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                          value={item.payMonths?.[0] ?? 12}
                          onChange={e => updateIncome(i, { payMonths: [Number(e.target.value)] })}>
                          {Array.from({ length: 12 }, (_, idx) => (
                            <option key={idx + 1} value={idx + 1}>{idx + 1}月</option>
                          ))}
                        </select>
                      </>
                    )}
                    <span className="text-xs text-slate-400 ml-1">年成長率</span>
                    <input
                      type="number"
                      placeholder="–"
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                      value={item.growthRate !== undefined ? (item.growthRate * 100).toFixed(1) : ''}
                      onChange={e => updateIncome(i, {
                        growthRate: e.target.value !== '' ? Number(e.target.value) / 100 : undefined,
                      })}
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <NoteField value={item.note} onChange={v => updateIncome(i, { note: v })} />
                </div>
              ))}
              <AddBtn onClick={addIncome} label="新增收入" />
            </Section>

            <Section title="支出項目">
              {c.expenses.map((item, i) => (
                <div key={i} className="mb-3 bg-slate-50 rounded-xl p-3">
                  <div className="flex gap-2 items-center">
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs focus:border-blue-300 outline-none shrink-0"
                      value={item.category}
                      onChange={e => updateExpense(i, { category: e.target.value as ExpenseCategory })}>
                      {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(cat => (
                        <option key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat]}</option>
                      ))}
                    </select>
                    <input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                      value={item.label} onChange={e => updateExpense(i, { label: e.target.value })} />
                    <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                      value={item.amount} onChange={e => updateExpense(i, { amount: Number(e.target.value) })} />
                    <button onClick={() => removeExpense(i)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">頻率</span>
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                      value={item.frequency ?? 'monthly'}
                      onChange={e => updateExpense(i, handleFrequencyChange(e.target.value as PayFrequency))}>
                      {(Object.keys(PAY_FREQUENCY_LABELS) as PayFrequency[]).map(f => (
                        <option key={f} value={f}>{PAY_FREQUENCY_LABELS[f]}</option>
                      ))}
                    </select>
                    {(item.frequency === 'quarterly') && (
                      <>
                        <span className="text-xs text-slate-400">發生月</span>
                        <select
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                          value={quarterlyAnchor(item.payMonths)}
                          onChange={e => updateExpense(i, { payMonths: quarterlyMonths(Number(e.target.value)) })}>
                          <option value={1}>1/4/7/10月</option>
                          <option value={2}>2/5/8/11月</option>
                          <option value={3}>3/6/9/12月</option>
                        </select>
                      </>
                    )}
                    {(item.frequency === 'annual') && (
                      <>
                        <span className="text-xs text-slate-400">發生月</span>
                        <select
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                          value={item.payMonths?.[0] ?? 12}
                          onChange={e => updateExpense(i, { payMonths: [Number(e.target.value)] })}>
                          {Array.from({ length: 12 }, (_, idx) => (
                            <option key={idx + 1} value={idx + 1}>{idx + 1}月</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                  <NoteField value={item.note} onChange={v => updateExpense(i, { note: v })} />
                </div>
              ))}
              <AddBtn onClick={addExpense} label="新增支出" />
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                <label className="text-xs text-slate-400 w-28 shrink-0">支出通膨預估率</label>
                <input
                  type="number"
                  step="0.1"
                  className="border border-slate-200 rounded-lg px-3 py-1.5 w-24 text-sm focus:border-blue-300 outline-none"
                  value={(c.globalInflationRate * 100).toFixed(1)}
                  onChange={e => patch({ globalInflationRate: Number(e.target.value) / 100 })}
                />
                <span className="text-xs text-slate-400">%（5 年 projection 適用）</span>
              </div>
            </Section>

            <Section title={`資產組合 · 總計 ${(totalAssets / 10000).toFixed(0)} 萬`}>
              {c.assetItems.map((item, i) => {
                const isTradeable = TRADEABLE.has(item.category)
                return (
                  <div key={i} className="mb-3 bg-slate-50 rounded-xl p-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <select
                        className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-blue-300 outline-none"
                        value={item.category}
                        onChange={e => updateAsset(i, { category: e.target.value as InvestmentCategory })}>
                        {(Object.keys(INVESTMENT_CATEGORY_LABELS) as InvestmentCategory[]).map(cat => (
                          <option key={cat} value={cat}>{INVESTMENT_CATEGORY_LABELS[cat]}</option>
                        ))}
                      </select>
                      <input className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                        value={item.label} onChange={e => updateAsset(i, { label: e.target.value })}
                        placeholder={isTradeable ? '標的名稱 / 代碼' : '項目名稱'} />
                      {!isTradeable && (
                        <div className="flex flex-col">
                          <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                            value={item.amount}
                            placeholder={`金額（${item.currency ?? 'TWD'}）`}
                            onChange={e => updateAsset(i, { amount: Number(e.target.value) })} />
                          {item.currency && item.currency !== 'TWD' && rates && item.amount > 0 && (
                            <span className="text-xs text-slate-400 mt-0.5 text-right">
                              ≈ {fmtAmount(convertCurrency(item.amount, item.currency, 'TWD', rates), 'TWD', true)} TWD
                            </span>
                          )}
                        </div>
                      )}
                      <button onClick={() => removeAsset(i)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
                    </div>
                    {isTradeable && (
                      <div className="flex flex-wrap gap-2 items-center mt-1.5">
                        <input type="number" min={0} step="any"
                          className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm focus:border-blue-300 outline-none"
                          value={item.unitPrice ?? ''}
                          onChange={e => handleTradeableField(i, 'unitPrice', Number(e.target.value))}
                          placeholder={`單位價（${item.currency ?? 'TWD'}）`} />
                        <span className="text-xs text-slate-400">×</span>
                        <input type="number" min={0} step="any"
                          className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm focus:border-blue-300 outline-none"
                          value={item.units ?? ''}
                          onChange={e => handleTradeableField(i, 'units', Number(e.target.value))}
                          placeholder="股數 / 單位" />
                        <span className="text-xs text-slate-400">=</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-600">
                            {fmtAmount(item.amount, item.currency ?? 'TWD')}
                          </span>
                          {item.currency && item.currency !== 'TWD' && rates && item.amount > 0 && (
                            <span className="text-xs text-slate-400">
                              ≈ {fmtAmount(convertCurrency(item.amount, item.currency, 'TWD', rates), 'TWD', true)} TWD
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <select
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                        value={item.currency ?? 'TWD'}
                        onChange={e => updateAsset(i, { currency: e.target.value as AssetCurrency })}>
                        {(Object.keys(ASSET_CURRENCY_LABELS) as AssetCurrency[]).map(cur => (
                          <option key={cur} value={cur}>{ASSET_CURRENCY_LABELS[cur]}</option>
                        ))}
                      </select>
                      <input
                        className="flex-1 min-w-[100px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                        value={item.institution ?? ''}
                        onChange={e => updateAsset(i, { institution: e.target.value })}
                        placeholder="帳戶 / 機構（選填）" />
                      <select
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                        value={item.purpose ?? 'growth'}
                        onChange={e => updateAsset(i, { purpose: e.target.value as AssetPurpose })}>
                        {(Object.keys(ASSET_PURPOSE_LABELS) as AssetPurpose[]).map(p => (
                          <option key={p} value={p}>{ASSET_PURPOSE_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>
                    <NoteField value={item.note} onChange={v => updateAsset(i, { note: v })} />
                  </div>
                )
              })}
              <AddBtn onClick={addAsset} label="新增資產項目" />
            </Section>

            <Section title={`負債 · 總計 ${(totalLiab / 10000).toFixed(0)} 萬`}>
              {c.liabilityItems.map((item, i) => (
                <div key={i} className={`mb-3 rounded-xl p-3 ${item.type === 'long_term' ? 'bg-red-50' : 'bg-orange-50'}`}>
                  <div className="flex gap-2 items-center flex-wrap">
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-blue-300 outline-none"
                      value={item.type}
                      onChange={e => updateLiability(i, { type: e.target.value as LiabilityType })}>
                      <option value="long_term">長期負債</option>
                      <option value="current">流動負債</option>
                    </select>
                    <input className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                      value={item.label} onChange={e => updateLiability(i, { label: e.target.value })} placeholder="如：房貸、信用卡費" />
                    <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                      value={item.amount} onChange={e => updateLiability(i, { amount: Number(e.target.value) })} />
                    <button onClick={() => removeLiability(i)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
                  </div>
                  <NoteField value={item.note} onChange={v => updateLiability(i, { note: v })} />
                </div>
              ))}
              <AddBtn onClick={() => addLiability('long_term')} label="新增負債項目" />
            </Section>
          </>
        )}

        {/* ── 投資偏好 ── */}
        {tab === 'invest' && (
          <>
            <Section title="風險承受度">
              <div className="grid grid-cols-3 gap-2">
                {(['conservative', 'moderate', 'aggressive'] as RiskProfile[]).map(r => {
                  const rr = RISK_RETURN[r]
                  const isSelected = c.riskProfile === r
                  return (
                    <button key={r} onClick={() => patch({ riskProfile: r })}
                      className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}>
                      <span>{riskLabels[r]}</span>
                      <span className={`text-xs font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {fmtPct(rr.conservative * 100)}/{fmtPct(rr.base * 100)}/{fmtPct(rr.aggressive * 100)}
                      </span>
                      {isSelected && c.customReturnRate !== null && (
                        <span className="text-xs text-blue-200">自定 {fmtPct(c.customReturnRate * 100)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Section>
            <Section title="報酬率設定">
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500 w-32">預期年化報酬率</label>
                <input
                  type="number"
                  className="border border-slate-200 rounded-lg px-3 py-2 w-28 text-sm focus:border-blue-300 outline-none"
                  placeholder="留空自動"
                  value={c.customReturnRate !== null ? (c.customReturnRate * 100).toFixed(1) : ''}
                  onChange={e => patch({ customReturnRate: e.target.value ? Number(e.target.value) / 100 : null })}
                />
                <span className="text-sm text-slate-400">%（空白 = 依風險預設）</span>
              </div>
            </Section>
            <Section title="定期投入">
              {(() => {
                const cf = calcCashFlow(c)
                const effectiveContribution = Math.max(0, cf.investibleCashFlow)
                const usingCf = c.useInvestibleCashFlow
                const displayValue = usingCf ? effectiveContribution : c.monthlyContribution
                const ratio = !usingCf && cf.investibleCashFlow > 0
                  ? fmtPct(c.monthlyContribution / cf.investibleCashFlow * 100)
                  : null
                return (
                  <div>
                    <div className="flex gap-1 mb-2">
                      <button
                        onClick={() => patch({ useInvestibleCashFlow: false })}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${!usingCf ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                        自定金額
                      </button>
                      <button
                        onClick={() => patch({ useInvestibleCashFlow: true, monthlyContribution: effectiveContribution })}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${usingCf ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                        使用可投資現金流
                      </button>
                    </div>
                    <NumField label="每月定期投入" value={displayValue} onChange={v => patch({ monthlyContribution: v })} disabled={usingCf} />
                    {usingCf && cf.investibleCashFlow < 0 && (
                      <div className="text-xs text-slate-400 mt-1 ml-1">可投資現金流為負，建議先優化收支</div>
                    )}
                    {ratio && (
                      <div className="text-xs text-slate-400 mt-1 ml-1">
                        = 可投資現金流的 <span className="text-blue-500 font-medium">{ratio}</span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </Section>
            <Section title="目標配置">
              <div className="space-y-1.5">
                {(Object.keys(INVESTMENT_CATEGORY_LABELS) as InvestmentCategory[]).map(cat => {
                  const val = c.targetAllocation[cat]
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <label className="text-sm text-slate-500 w-24 shrink-0">{INVESTMENT_CATEGORY_LABELS[cat]}</label>
                      <input
                        type="number"
                        min={0} max={100} step={1}
                        placeholder="–"
                        className="border border-slate-200 rounded-lg px-3 py-1.5 w-20 text-sm focus:border-blue-300 outline-none"
                        value={val !== undefined ? val : ''}
                        onChange={e => {
                          const next = { ...c.targetAllocation }
                          if (e.target.value === '') { delete next[cat] } else { next[cat] = Number(e.target.value) }
                          patch({ targetAllocation: next })
                        }}
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  )
                })}
              </div>
              {(() => {
                const total = Object.values(c.targetAllocation).reduce((s, v) => s + (v ?? 0), 0)
                if (total === 0) return <div className="text-xs text-slate-400 mt-2">尚未設定目標配置</div>
                if (total > 100) return <div className="text-xs text-red-500 font-medium mt-2">已超配 {total - 100}%，請調整</div>
                return <div className="text-xs text-emerald-600 mt-2">已配置 {total}%，剩餘 {100 - total}%</div>
              })()}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                <label className="text-sm text-slate-500 w-24 shrink-0">容許偏離</label>
                <input
                  type="number"
                  min={0} max={50} step={1}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 w-20 text-sm focus:border-blue-300 outline-none"
                  value={c.toleranceBand}
                  onChange={e => patch({ toleranceBand: Number(e.target.value) })}
                />
                <span className="text-xs text-slate-400">%（超過此幅度才建議再平衡）</span>
              </div>
            </Section>
          </>
        )}

        {/* ── 人生目標 ── */}
        {tab === 'goals' && (
          <>
            <Section title="退休規劃">
              <NumField label="目前年齡" value={c.currentAge} onChange={v => patch({ currentAge: v })} suffix="歲" />
              <NumField label="目標退休年齡" value={c.retirementAge} onChange={v => patch({ retirementAge: v })} suffix="歲" />
              <NumField label="目標月退休現金流" value={c.targetMonthlyRetirementIncome} onChange={v => patch({ targetMonthlyRetirementIncome: v })} />
            </Section>
            <Section title="重大支出計劃">
              {c.majorExpenses.map((item, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:border-blue-300 outline-none"
                    value={item.label} onChange={e => updateMajor(i, { label: e.target.value })} placeholder="項目" />
                  <input type="number" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-28 focus:border-blue-300 outline-none"
                    value={item.amount} onChange={e => updateMajor(i, { amount: Number(e.target.value) })} placeholder="金額" />
                  <input type="number" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24 focus:border-blue-300 outline-none"
                    value={item.year} onChange={e => updateMajor(i, { year: Number(e.target.value) })} placeholder="年份" />
                  <button onClick={() => removeMajor(i)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
                </div>
              ))}
              <AddBtn onClick={addMajor} label="新增重大支出" />
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

// ── 小元件 ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )
}

function NumField({ label, value, onChange, suffix, disabled }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <label className="text-sm text-slate-500 w-36 shrink-0">{label}</label>
      <input type="number" className={`border rounded-lg px-3 py-2 text-sm w-36 outline-none transition-colors ${disabled ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-blue-300'}`}
        value={value} onChange={e => !disabled && onChange(Number(e.target.value))} disabled={disabled} />
      {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
    </div>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="text-sm text-blue-400 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors">
      + {label}
    </button>
  )
}

