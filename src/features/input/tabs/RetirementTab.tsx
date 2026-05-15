import type { ClientProfile } from '../../../types/client'
import { Section, NumField } from '../shared'
import { calcCurrentAge } from '../../../types/client'

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

export function RetirementTab({ c, patch }: Props) {
  const currentAge = calcCurrentAge(c.birthYear)
  const yearsToRetirement = c.retirementAge - currentAge

  return (
    <>
      <Section title="退休規劃">
        <NumField
          label="目標退休年齡"
          value={c.retirementAge}
          onChange={v => patch({ retirementAge: v })}
          suffix="歲"
        />
        <div className="text-xs text-slate-500 -mt-1 mb-2 ml-[156px]">
          距今 {yearsToRetirement > 0 ? yearsToRetirement : 0} 年（現齡 {currentAge} 歲）
        </div>
        <NumField
          label="預計退休餘命"
          value={c.retirementLifespan}
          onChange={v => patch({ retirementLifespan: v })}
          suffix="年"
        />
        <div className="text-xs text-slate-500 -mt-1 mb-2 ml-[156px]">
          目標壽命 {c.retirementAge + c.retirementLifespan} 歲
        </div>
        <NumField
          label="目標月退休現金流"
          value={c.targetMonthlyRetirementIncome}
          onChange={v => patch({ targetMonthlyRetirementIncome: v })}
          suffix="元"
        />
      </Section>

      <Section title="退休收入來源">
        <NumField
          label="一次性退休金"
          value={c.retirementLumpSum ?? 0}
          onChange={v => patch({ retirementLumpSum: v })}
          suffix="元"
        />
        <div className="text-xs text-slate-500 -mt-1 mb-2 ml-[156px]">
          勞退一次領、資遣費等，填退休時預估金額
        </div>
        <NumField
          label="月退休年金"
          value={c.monthlyPension ?? 0}
          onChange={v => patch({ monthlyPension: v })}
          suffix="元/月"
        />
        <div className="text-xs text-slate-500 -mt-1 mb-2 ml-[156px]">
          勞保月退、公務員退休金等，填今日幣值
        </div>
      </Section>

      <Section title="提領策略">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500 w-32 shrink-0">安全提領率</label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="20"
            className="border border-slate-200 rounded-lg px-3 py-2 w-24 text-sm focus:border-blue-300 outline-none"
            value={((c.withdrawalRate ?? 0.04) * 100).toFixed(1)}
            onChange={e => patch({ withdrawalRate: Number(e.target.value) / 100 })}
          />
          <span className="text-sm text-slate-400">%（建議 3–5%）</span>
        </div>
        <div className="text-xs text-slate-500 mt-1 ml-[156px]">
          每年可從退休資產提領的比例，4% 為常見基準（三十年法則）
        </div>
      </Section>
    </>
  )
}
