import { useState } from 'react'
import type { ClientProfile, FinancialScenario, ScenarioOneTimeExpense, ScenarioRecurringExpense } from '../../../types/client'
import { AddBtn, Section } from '../shared'

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

const inputClass = 'w-full border border-slate-200 rounded-md bg-white px-3 py-2 text-sm text-slate-700 focus:border-lime-500'

function monthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function parseMonth(value: string): { year: number; month: number } | null {
  const [year, month] = value.split('-').map(Number)
  return year && month >= 1 && month <= 12 ? { year, month } : null
}

function MoneyField({ label, value, onChange, placeholder }: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      <input
        type="number"
        min={0}
        step={1000}
        className={inputClass}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
      />
    </label>
  )
}

export function ScenarioTab({ c, patch }: Props) {
  const scenarios = c.scenarios ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = scenarios.find(item => item.id === selectedId) ?? scenarios[0]

  const update = (id: string, change: Partial<FinancialScenario>) => {
    patch({ scenarios: scenarios.map(item => item.id === id ? { ...item, ...change } : item) })
  }

  const add = () => {
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const scenario: FinancialScenario = {
      id: crypto.randomUUID(),
      name: `情境 ${scenarios.length + 1}`,
      startYear: next.getFullYear(),
      startMonth: next.getMonth() + 1,
      monthlyIncome: null,
      monthlyExpenses: null,
      monthlyContribution: 0,
      recurringExpenses: [],
      oneTimeExpenses: [],
      safetyMonths: 6,
      projectionMonths: 36,
    }
    patch({ scenarios: [...scenarios, scenario] })
    setSelectedId(scenario.id)
  }

  const duplicate = () => {
    if (!selected) return
    const copy: FinancialScenario = {
      ...selected,
      id: crypto.randomUUID(),
      name: `${selected.name} 複本`,
      recurringExpenses: selected.recurringExpenses.map(item => ({ ...item, id: crypto.randomUUID() })),
      oneTimeExpenses: selected.oneTimeExpenses.map(item => ({ ...item, id: crypto.randomUUID() })),
    }
    patch({ scenarios: [...scenarios, copy] })
    setSelectedId(copy.id)
  }

  const remove = () => {
    if (!selected || !window.confirm(`刪除「${selected.name}」？`)) return
    patch({ scenarios: scenarios.filter(item => item.id !== selected.id) })
    setSelectedId(null)
  }

  const updateRecurring = (id: string, change: Partial<ScenarioRecurringExpense>) => {
    if (!selected) return
    update(selected.id, { recurringExpenses: selected.recurringExpenses.map(item => item.id === id ? { ...item, ...change } : item) })
  }

  const updateOneTime = (id: string, change: Partial<ScenarioOneTimeExpense>) => {
    if (!selected) return
    update(selected.id, { oneTimeExpenses: selected.oneTimeExpenses.map(item => item.id === id ? { ...item, ...change } : item) })
  }

  return (
    <Section title="未來現金流情境">
      <div className="text-xs text-slate-500 leading-5">
        每個情境都可自行命名與輸入。開始月份前沿用現有收支；開始後填固定月額會取代原收支明細，包含年終等非月收入。留空則沿用明細。期初現金依「資產」中的現金存款計算。
      </div>
      <div className="flex flex-wrap gap-2 py-2" role="group" aria-label="選擇情境">
        {scenarios.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            aria-pressed={selected?.id === item.id}
            className={`max-w-full truncate rounded-md border px-3 py-1.5 text-xs font-medium ${selected?.id === item.id
              ? 'border-lime-500 bg-lime-50 text-slate-900'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'}`}
          >
            {item.name || '未命名情境'}
          </button>
        ))}
      </div>
      <AddBtn onClick={add} label="新增情境" />

      {selected && (
        <div className="space-y-5 border-t border-slate-200 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0">
              <span className="block text-xs font-medium text-slate-500 mb-1">情境名稱</span>
              <input className={inputClass} value={selected.name} onChange={e => update(selected.id, { name: e.target.value })} placeholder="例如：半工半讀" />
            </label>
            <label className="block min-w-0">
              <span className="block text-xs font-medium text-slate-500 mb-1">轉換年月</span>
              <input type="month" className={inputClass} value={monthValue(selected.startYear, selected.startMonth)}
                onChange={e => {
                  const date = parseMonth(e.target.value)
                  if (date) update(selected.id, { startYear: date.year, startMonth: date.month })
                }} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MoneyField label="轉換後每月收入 (TWD)" value={selected.monthlyIncome}
              placeholder="留空沿用收入明細" onChange={value => update(selected.id, { monthlyIncome: value })} />
            <MoneyField label="轉換後每月支出 (TWD)" value={selected.monthlyExpenses}
              placeholder="留空沿用支出明細" onChange={value => update(selected.id, { monthlyExpenses: value })} />
            <MoneyField label="轉換後每月投資投入 (TWD)" value={selected.monthlyContribution}
              onChange={value => update(selected.id, { monthlyContribution: value ?? 0 })} />
            <label className="block min-w-0">
              <span className="block text-xs font-medium text-slate-500 mb-1">安全水位（月支出倍數，不含一次性）</span>
              <input type="number" min={0} max={24} step={1} className={inputClass} value={selected.safetyMonths}
                onChange={e => update(selected.id, { safetyMonths: Math.min(24, Math.max(0, Number(e.target.value))) })} />
            </label>
            <label className="block min-w-0">
              <span className="block text-xs font-medium text-slate-500 mb-1">推算期間（月）</span>
              <input type="number" min={1} max={60} step={1} className={inputClass} value={selected.projectionMonths || ''}
                onChange={e => update(selected.id, { projectionMonths: Math.min(60, Math.max(0, Number(e.target.value))) })}
                onBlur={() => selected.projectionMonths < 1 && update(selected.id, { projectionMonths: 36 })} />
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500">額外每月支出</div>
            {selected.recurringExpenses.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <input className={`${inputClass} min-w-0 flex-1`} value={item.label} placeholder="例如：皮拉提斯"
                  onChange={e => updateRecurring(item.id, { label: e.target.value })} />
                <input type="number" min={0} step={100} className={`${inputClass} w-28 shrink-0`} value={item.amount}
                  aria-label={`${item.label || '額外支出'}每月金額`} onChange={e => updateRecurring(item.id, { amount: Math.max(0, Number(e.target.value)) })} />
                <button type="button" className="px-1 text-slate-400 hover:text-red-600" aria-label={`刪除${item.label || '額外支出'}`}
                  onClick={() => update(selected.id, { recurringExpenses: selected.recurringExpenses.filter(row => row.id !== item.id) })}>×</button>
              </div>
            ))}
            <AddBtn onClick={() => update(selected.id, { recurringExpenses: [...selected.recurringExpenses, { id: crypto.randomUUID(), label: '', amount: 0 }] })} label="新增每月支出" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500">情境專屬一次性支出</div>
            {selected.oneTimeExpenses.map(item => (
              <div key={item.id} className="flex flex-wrap items-center gap-2">
                <input className={`${inputClass} min-w-[130px] flex-1`} value={item.label} placeholder="例如：學費"
                  onChange={e => updateOneTime(item.id, { label: e.target.value })} />
                <input type="month" className={`${inputClass} w-36`} value={monthValue(item.year, item.month)}
                  aria-label={`${item.label || '一次性支出'}年月`}
                  onChange={e => {
                    const date = parseMonth(e.target.value)
                    if (date) updateOneTime(item.id, date)
                  }} />
                <input type="number" min={0} step={1000} className={`${inputClass} w-28`} value={item.amount}
                  aria-label={`${item.label || '一次性支出'}金額`} onChange={e => updateOneTime(item.id, { amount: Math.max(0, Number(e.target.value)) })} />
                <button type="button" className="px-1 text-slate-400 hover:text-red-600" aria-label={`刪除${item.label || '一次性支出'}`}
                  onClick={() => update(selected.id, { oneTimeExpenses: selected.oneTimeExpenses.filter(row => row.id !== item.id) })}>×</button>
              </div>
            ))}
            <AddBtn onClick={() => update(selected.id, { oneTimeExpenses: [...selected.oneTimeExpenses, {
              id: crypto.randomUUID(), label: '', amount: 0, year: selected.startYear, month: selected.startMonth,
            }] })} label="新增一次性支出" />
            <div className="text-xs text-slate-400">「支出」頁既有重大支出也會計入；未填月份的重大支出估在 12 月。</div>
          </div>

          <div className="flex gap-4 border-t border-slate-200 pt-3">
            <button type="button" className="text-xs font-medium text-blue-700 hover:text-blue-900" onClick={duplicate}>複製情境</button>
            <button type="button" className="text-xs font-medium text-red-600 hover:text-red-800" onClick={remove}>刪除情境</button>
          </div>
        </div>
      )}
    </Section>
  )
}
