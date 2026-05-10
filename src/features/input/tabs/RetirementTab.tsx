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
      <NumField
        label="目標月退休現金流"
        value={c.targetMonthlyRetirementIncome}
        onChange={v => patch({ targetMonthlyRetirementIncome: v })}
        suffix="元"
      />
    </Section>
  )
}
