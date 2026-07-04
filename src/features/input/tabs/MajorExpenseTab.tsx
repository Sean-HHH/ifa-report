import type { ClientProfile, MajorExpense } from '../../../types/client'
import { Section, AddBtn, NumInput } from '../shared'

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

function XIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function MajorExpenseTab({ c, patch }: Props) {
  const update = (i: number, p: Partial<MajorExpense>) =>
    patch({ majorExpenses: c.majorExpenses.map((item, idx) => idx === i ? { ...item, ...p } : item) })
  const add = () =>
    patch({ majorExpenses: [...c.majorExpenses, { label: '重大支出', amount: 0, year: new Date().getFullYear() + 5 }] })
  const remove = (i: number) =>
    patch({ majorExpenses: c.majorExpenses.filter((_, idx) => idx !== i) })

  return (
    <Section title="重大支出計劃">
      <div className="text-xs text-slate-500 mb-3">
        購屋、子女教育、婚禮等預期一次性大額支出，將反映於資產成長路徑與退休缺口計算。
      </div>
      {c.majorExpenses.map((item, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <input
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:border-blue-300 outline-none"
            value={item.label}
            onChange={e => update(i, { label: e.target.value })}
            placeholder="項目名稱"
          />
          <NumInput
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-28 focus:border-blue-300 outline-none"
            value={item.amount}
            onChange={e => update(i, { amount: Number(e.target.value) })}
            placeholder="金額"
          />
          <NumInput
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24 focus:border-blue-300 outline-none"
            value={item.year}
            onChange={e => update(i, { year: Number(e.target.value) })}
            placeholder="年份"
          />
          <select
            className="border border-slate-200 rounded-lg px-2 py-2 text-sm w-24 focus:border-blue-300 outline-none text-slate-500"
            value={item.month ?? ''}
            onChange={e => update(i, { month: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">月份（選填）</option>
            {Array.from({ length: 12 }, (_, idx) => (
              <option key={idx + 1} value={idx + 1}>{idx + 1} 月</option>
            ))}
          </select>
          <button
            onClick={() => remove(i)}
            aria-label="刪除此筆重大支出"
            className="text-slate-300 hover:text-red-400 transition-colors p-1 flex items-center"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <XIcon />
          </button>
        </div>
      ))}
      {c.majorExpenses.length === 0 && (
        <div className="text-sm text-slate-400 py-2">尚未新增重大支出計劃</div>
      )}
      <AddBtn onClick={add} label="新增重大支出" />
    </Section>
  )
}
