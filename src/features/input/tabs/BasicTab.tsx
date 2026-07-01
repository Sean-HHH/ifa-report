import type { ClientProfile } from '../../../types/client'
import { Section, AddBtn } from '../shared'
import { calcCurrentAge } from '../../../types/client'

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

export function BasicTab({ c, patch }: Props) {
  const advice = c.consultationAdvice ?? []

  const addAdvice = () => patch({ consultationAdvice: [...advice, ''] })
  const updateAdvice = (i: number, v: string) => {
    const next = [...advice]
    next[i] = v
    patch({ consultationAdvice: next })
  }
  const removeAdvice = (i: number) =>
    patch({ consultationAdvice: advice.filter((_, idx) => idx !== i) })

  return (
    <>
      <Section title="基本資訊">
        <div className="flex items-center gap-3 mb-2">
          <label className="text-sm text-slate-500 w-28 shrink-0">出生年份</label>
          <input
            type="number"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-36 focus:border-blue-300 outline-none"
            value={c.birthYear}
            onChange={e => patch({ birthYear: Number(e.target.value) })}
          />
          <span className="text-sm text-slate-400">年（{calcCurrentAge(c.birthYear)} 歲）</span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <label className="text-sm text-slate-500 w-28 shrink-0">職業</label>
          <input
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
            value={c.occupation ?? ''}
            onChange={e => patch({ occupation: e.target.value })}
            placeholder="如：軟體工程師、自由業"
          />
        </div>
        <div className="flex items-center gap-3 mb-1">
          <label className="text-sm text-slate-500 w-28 shrink-0">規劃起點</label>
          <input
            type="number"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24 focus:border-blue-300 outline-none"
            value={c.planStartYear ?? new Date().getFullYear()}
            onChange={e => patch({ planStartYear: Number(e.target.value) })}
          />
          <span className="text-sm text-slate-400">年</span>
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
            value={c.planStartMonth ?? 1}
            onChange={e => patch({ planStartMonth: Number(e.target.value) })}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} 月</option>
            ))}
          </select>
          {(c.planStartMonth ?? 1) > 1 && (
            <span className="text-xs text-amber-600 font-medium">
              今年剩餘 {13 - (c.planStartMonth ?? 1)} 個月
            </span>
          )}
        </div>
        <div className="mb-2 pl-28">
          <span className="text-xs text-slate-400">從年中開始合作時設定，報告將同時顯示今年剩餘期間的預測</span>
        </div>
      </Section>

      <Section title="諮詢重點">
        <textarea
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-300 outline-none resize-none"
          placeholder="客戶主要的財務擔憂或諮詢目的"
          value={c.consultationFocus ?? ''}
          onChange={e => patch({ consultationFocus: e.target.value })}
        />
      </Section>

      <Section title="諮詢建議">
        {advice.map((item, i) => (
          <div key={i} className="flex gap-2 items-start mb-2">
            <span className="text-xs text-slate-400 mt-2.5 shrink-0 w-5">{i + 1}.</span>
            <textarea
              rows={2}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-300 outline-none resize-none"
              value={item}
              onChange={e => updateAdvice(i, e.target.value)}
              placeholder="輸入建議內容"
            />
            <button
              onClick={() => removeAdvice(i)}
              aria-label="刪除此條建議"
              className="text-slate-300 hover:text-red-400 transition-colors mt-1.5 flex items-center"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <XIcon />
            </button>
          </div>
        ))}
        {advice.length === 0 && (
          <div className="text-sm text-slate-400 py-1">尚未新增諮詢建議</div>
        )}
        <AddBtn onClick={addAdvice} label="新增建議" />
      </Section>
    </>
  )
}
