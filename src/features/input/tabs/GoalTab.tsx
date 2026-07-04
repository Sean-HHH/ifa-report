import type { ClientProfile, MajorExpense } from '../../../types/client'
import { Section, AddBtn, NumField, NumInput } from '../shared'

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

export function GoalTab({ c, patch }: Props) {
  const updateMajor = (i: number, p: Partial<MajorExpense>) =>
    patch({ majorExpenses: c.majorExpenses.map((item, idx) => idx === i ? { ...item, ...p } : item) })
  const addMajor = () =>
    patch({ majorExpenses: [...c.majorExpenses, { label: '重大支出', amount: 0, year: new Date().getFullYear() + 5 }] })
  const removeMajor = (i: number) =>
    patch({ majorExpenses: c.majorExpenses.filter((_, idx) => idx !== i) })

  return (
    <>
      <Section title="退休規劃">
        <NumField label="出生年份" value={c.birthYear} onChange={v => patch({ birthYear: v })} suffix="年" />
        <NumField label="目標退休年齡" value={c.retirementAge} onChange={v => patch({ retirementAge: v })} suffix="歲" />
        <NumField label="預計退休餘命" value={c.retirementLifespan} onChange={v => patch({ retirementLifespan: v })} suffix="年" />
        <NumField label="目標月退休現金流" value={c.targetMonthlyRetirementIncome} onChange={v => patch({ targetMonthlyRetirementIncome: v })} />
      </Section>
      <Section title="重大支出計劃">
        {c.majorExpenses.map((item, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:border-blue-300 outline-none"
              value={item.label} onChange={e => updateMajor(i, { label: e.target.value })} placeholder="項目" />
            <NumInput className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-28 focus:border-blue-300 outline-none"
              value={item.amount} onChange={e => updateMajor(i, { amount: Number(e.target.value) })} placeholder="金額" />
            <NumInput className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24 focus:border-blue-300 outline-none"
              value={item.year} onChange={e => updateMajor(i, { year: Number(e.target.value) })} placeholder="年份" />
            <button onClick={() => removeMajor(i)} aria-label="刪除此筆重大支出" className="text-slate-300 hover:text-red-400 transition-colors p-1 flex items-center" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        <AddBtn onClick={addMajor} label="新增重大支出" />
      </Section>
    </>
  )
}
