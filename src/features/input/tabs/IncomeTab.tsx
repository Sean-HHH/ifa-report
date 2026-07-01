import type { ClientProfile, IncomeItem, IncomeType, PayFrequency } from '../../../types/client'
import { INCOME_TYPE_LABELS, PAY_FREQUENCY_LABELS } from '../../../types/client'
import { Section, AddBtn, NoteField } from '../shared'
import { handleFrequencyChange } from '../utils'

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

export function IncomeTab({ c, patch }: Props) {
  const update = (i: number, p: Partial<IncomeItem>) =>
    patch({ incomes: c.incomes.map((item, idx) => idx === i ? { ...item, ...p } : item) })
  const add = () => patch({ incomes: [...c.incomes, { label: '其他收入', amount: 0, type: 'fixed' }] })
  const remove = (i: number) => patch({ incomes: c.incomes.filter((_, idx) => idx !== i) })

  return (
    <Section title="收入項目">
      {c.incomes.map((item, i) => (
        <div key={i} className="mb-3 bg-slate-50 rounded-xl p-3">
          <div className="flex gap-2 items-center">
            <select
              className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs focus:border-blue-300 outline-none shrink-0"
              value={item.type}
              onChange={e => update(i, { type: e.target.value as IncomeType })}>
              {(Object.keys(INCOME_TYPE_LABELS) as IncomeType[]).map(t => (
                <option key={t} value={t}>{INCOME_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
              value={item.label} onChange={e => update(i, { label: e.target.value })} placeholder="收入名稱" />
            <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
              value={item.amount} onChange={e => update(i, { amount: Number(e.target.value) })} />
            <button onClick={() => remove(i)} aria-label="刪除此筆收入" className="text-slate-300 hover:text-red-400 transition-colors p-1 flex items-center" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
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
                {[0, 1, 2, 3].map(idx => (
                  <select
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs focus:border-blue-300 outline-none"
                    value={(item.payMonths ?? [3, 6, 9, 12])[idx]}
                    onChange={e => {
                      const months = [...(item.payMonths ?? [3, 6, 9, 12])]
                      months[idx] = Number(e.target.value)
                      update(i, { payMonths: months })
                    }}>
                    {Array.from({ length: 12 }, (_, m) => (
                      <option key={m + 1} value={m + 1}>{m + 1}月</option>
                    ))}
                  </select>
                ))}
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
            <span className="text-xs text-slate-400 ml-1">年成長率</span>
            <input
              type="number"
              placeholder="–"
              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
              value={item.growthRate !== undefined ? (item.growthRate * 100).toFixed(1) : ''}
              onChange={e => update(i, {
                growthRate: e.target.value !== '' ? Number(e.target.value) / 100 : undefined,
              })}
            />
            <span className="text-xs text-slate-400">%</span>
          </div>
          <NoteField value={item.note} onChange={v => update(i, { note: v })} />
        </div>
      ))}
      <AddBtn onClick={add} label="新增收入" />
    </Section>
  )
}
