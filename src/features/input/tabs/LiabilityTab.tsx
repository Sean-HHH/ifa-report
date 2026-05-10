import type { ClientProfile, LiabilityItem, LiabilityType } from '../../../types/client'
import { Section, AddBtn, NoteField } from '../shared'

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

export function LiabilityTab({ c, patch }: Props) {
  const totalLiab = c.liabilityItems.reduce((s, l) => s + l.amount, 0)

  const update = (i: number, p: Partial<LiabilityItem>) =>
    patch({ liabilityItems: c.liabilityItems.map((item, idx) => idx === i ? { ...item, ...p } : item) })
  const add = (type: LiabilityType) =>
    patch({ liabilityItems: [...c.liabilityItems, { label: '新負債', amount: 0, type }] })
  const remove = (i: number) => patch({ liabilityItems: c.liabilityItems.filter((_, idx) => idx !== i) })

  return (
    <Section title={`負債 · 總計 ${(totalLiab / 10000).toFixed(0)} 萬`}>
      {c.liabilityItems.map((item, i) => (
        <div key={i} className={`mb-3 rounded-xl p-3 ${item.type === 'long_term' ? 'bg-red-50' : 'bg-orange-50'}`}>
          <div className="flex gap-2 items-center flex-wrap">
            <select
              className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-blue-300 outline-none"
              value={item.type}
              onChange={e => update(i, { type: e.target.value as LiabilityType })}>
              <option value="long_term">長期負債</option>
              <option value="current">流動負債</option>
            </select>
            <input className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
              value={item.label} onChange={e => update(i, { label: e.target.value })} placeholder="如：房貸、信用卡費" />
            <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
              value={item.amount} onChange={e => update(i, { amount: Number(e.target.value) })} />
            <button onClick={() => remove(i)} aria-label="刪除此筆負債" className="text-slate-300 hover:text-red-400 transition-colors p-1 flex items-center" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <NoteField value={item.note} onChange={v => update(i, { note: v })} />
        </div>
      ))}
      <AddBtn onClick={() => add('long_term')} label="新增負債項目" />
    </Section>
  )
}
