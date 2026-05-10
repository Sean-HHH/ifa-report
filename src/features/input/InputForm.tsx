import { useState } from 'react'
import type { ClientProfile } from '../../types/client'
import type { FxRates } from '../fx/exchangeRate'
import { BasicTab } from './tabs/BasicTab'
import { IncomeTab } from './tabs/IncomeTab'
import { ExpenseTab } from './tabs/ExpenseTab'
import { AssetTab } from './tabs/AssetTab'
import { LiabilityTab } from './tabs/LiabilityTab'
import { InvestTab } from './tabs/InvestTab'
import { MajorExpenseTab } from './tabs/MajorExpenseTab'
import { RetirementTab } from './tabs/RetirementTab'

type TabId = 'basic' | 'cashflow' | 'assets' | 'invest' | 'major' | 'retirement'

const TAB_LABELS: Record<TabId, string> = {
  basic: '基本',
  cashflow: '收支',
  assets: '資產',
  invest: '投資',
  major: '支出',
  retirement: '退休',
}

const TABS = Object.keys(TAB_LABELS) as TabId[]

interface Props {
  client: ClientProfile
  onChange: (c: ClientProfile) => void
  rates?: FxRates
}

export function InputForm({ client: c, onChange, rates }: Props) {
  const [tab, setTab] = useState<TabId>('basic')

  const patch = (partial: Partial<ClientProfile>) => onChange({ ...c, ...partial })

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
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === t ? 'border-b-2 border-blue-800 text-blue-800' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-6">
        {tab === 'basic'       && <BasicTab c={c} patch={patch} />}
        {tab === 'cashflow'    && <><IncomeTab c={c} patch={patch} /><ExpenseTab c={c} patch={patch} /></>}
        {tab === 'assets'      && <><AssetTab c={c} patch={patch} rates={rates} /><LiabilityTab c={c} patch={patch} /></>}
        {tab === 'invest'      && <InvestTab c={c} patch={patch} />}
        {tab === 'major'       && <MajorExpenseTab c={c} patch={patch} />}
        {tab === 'retirement'  && <RetirementTab c={c} patch={patch} />}
      </div>
    </div>
  )
}
