import type { ClientProfile, ExpenseItem, ExpenseCategory, PayFrequency } from '../../../types/client'
import { EXPENSE_CATEGORY_LABELS, PAY_FREQUENCY_LABELS } from '../../../types/client'
import { Section, AddBtn, NoteField } from '../shared'
import { quarterlyMonths, quarterlyAnchor, handleFrequencyChange } from '../utils'

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

export function ExpenseTab({ c, patch }: Props) {
  const update = (i: number, p: Partial<ExpenseItem>) =>
    patch({ expenses: c.expenses.map((item, idx) => idx === i ? { ...item, ...p } : item) })
  const add = () => patch({ expenses: [...c.expenses, { label: '新項目', amount: 0, category: 'survival' }] })
  const remove = (i: number) => patch({ expenses: c.expenses.filter((_, idx) => idx !== i) })

  return (
    <>
      <Section title="支出項目">
        {c.expenses.map((item, i) => (
          <div key={i} className="mb-3 bg-slate-50 rounded-xl p-3">
            <div className="flex gap-2 items-center">
              <select
                className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs focus:border-blue-300 outline-none shrink-0"
                value={item.category}
                onChange={e => update(i, { category: e.target.value as ExpenseCategory })}>
                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(cat => (
                  <option key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                value={item.label} onChange={e => update(i, { label: e.target.value })} />
              <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                value={item.amount} onChange={e => update(i, { amount: Number(e.target.value) })} />
              <button onClick={() => remove(i)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-400">頻率</span>
              <select
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                value={item.frequency ?? 'monthly'}
                onChange={e => update(i, handleFrequencyChange(e.target.value as PayFrequency))}>
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
                    onChange={e => update(i, { payMonths: quarterlyMonths(Number(e.target.value)) })}>
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
                    onChange={e => update(i, { payMonths: [Number(e.target.value)] })}>
                    {Array.from({ length: 12 }, (_, idx) => (
                      <option key={idx + 1} value={idx + 1}>{idx + 1}月</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <NoteField value={item.note} onChange={v => update(i, { note: v })} />
          </div>
        ))}
        <AddBtn onClick={add} label="新增支出" />
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
    </>
  )
}
