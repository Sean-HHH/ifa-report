import type { ClientProfile, RiskProfile, InvestmentCategory } from '../../../types/client'
import { INVESTMENT_CATEGORY_LABELS, RISK_RETURN } from '../../../types/client'
import { calcCashFlow, fmtPct } from '../../../utils/calculations'
import { Section, NumField } from '../shared'

const riskLabels: Record<RiskProfile, string> = {
  conservative: '保守',
  moderate: '穩健',
  aggressive: '積極',
}

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
}

export function InvestTab({ c, patch }: Props) {
  return (
    <>
      <Section title="風險承受度">
        <div className="grid grid-cols-3 gap-2">
          {(['conservative', 'moderate', 'aggressive'] as RiskProfile[]).map(r => {
            const rr = RISK_RETURN[r]
            const isSelected = c.riskProfile === r
            return (
              <button key={r} onClick={() => patch({ riskProfile: r })}
                className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}>
                <span>{riskLabels[r]}</span>
                <span className={`text-xs font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {fmtPct(rr.conservative * 100)}/{fmtPct(rr.base * 100)}/{fmtPct(rr.aggressive * 100)}
                </span>
                {isSelected && c.customReturnRate !== null && (
                  <span className="text-xs text-blue-200">自定 {fmtPct(c.customReturnRate * 100)}</span>
                )}
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="報酬率設定">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500 w-32">預期年化報酬率</label>
          <input
            type="number"
            className="border border-slate-200 rounded-lg px-3 py-2 w-28 text-sm focus:border-blue-300 outline-none"
            placeholder="留空自動"
            value={c.customReturnRate !== null ? (c.customReturnRate * 100).toFixed(1) : ''}
            onChange={e => patch({ customReturnRate: e.target.value ? Number(e.target.value) / 100 : null })}
          />
          <span className="text-sm text-slate-400">%（空白 = 依風險預設）</span>
        </div>
      </Section>
      <Section title="定期投入">
        {(() => {
          const cf = calcCashFlow(c)
          const effectiveContribution = Math.max(0, cf.investibleCashFlow)
          const usingCf = c.useInvestibleCashFlow
          const displayValue = usingCf ? effectiveContribution : c.monthlyContribution
          const ratio = !usingCf && cf.investibleCashFlow > 0
            ? fmtPct(c.monthlyContribution / cf.investibleCashFlow * 100)
            : null
          return (
            <div>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => patch({ useInvestibleCashFlow: false })}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${!usingCf ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                  自定金額
                </button>
                <button
                  onClick={() => patch({ useInvestibleCashFlow: true, monthlyContribution: effectiveContribution })}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${usingCf ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                  使用可投資現金流
                </button>
              </div>
              <NumField label="每月定期投入" value={displayValue} onChange={v => patch({ monthlyContribution: v })} disabled={usingCf} />
              {usingCf && cf.investibleCashFlow < 0 && (
                <div className="text-xs text-slate-400 mt-1 ml-1">可投資現金流為負，建議先優化收支</div>
              )}
              {ratio && (
                <div className="text-xs text-slate-400 mt-1 ml-1">
                  = 可投資現金流的 <span className="text-blue-500 font-medium">{ratio}</span>
                </div>
              )}
            </div>
          )
        })()}
      </Section>
      <Section title="目標配置">
        <div className="space-y-1.5">
          {(Object.keys(INVESTMENT_CATEGORY_LABELS) as InvestmentCategory[]).map(cat => {
            const val = c.targetAllocation[cat]
            return (
              <div key={cat} className="flex items-center gap-3">
                <label className="text-sm text-slate-500 w-24 shrink-0">{INVESTMENT_CATEGORY_LABELS[cat]}</label>
                <input
                  type="number"
                  min={0} max={100} step={1}
                  placeholder="–"
                  className="border border-slate-200 rounded-lg px-3 py-1.5 w-20 text-sm focus:border-blue-300 outline-none"
                  value={val !== undefined ? val : ''}
                  onChange={e => {
                    const next = { ...c.targetAllocation }
                    if (e.target.value === '') { delete next[cat] } else { next[cat] = Number(e.target.value) }
                    patch({ targetAllocation: next })
                  }}
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            )
          })}
        </div>
        {(() => {
          const total = Object.values(c.targetAllocation).reduce((s, v) => s + (v ?? 0), 0)
          if (total === 0) return <div className="text-xs text-slate-400 mt-2">尚未設定目標配置</div>
          if (total > 100) return <div className="text-xs text-red-500 font-medium mt-2">已超配 {total - 100}%，請調整</div>
          return <div className="text-xs text-emerald-600 mt-2">已配置 {total}%，剩餘 {100 - total}%</div>
        })()}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
          <label className="text-sm text-slate-500 w-24 shrink-0">容許偏離</label>
          <input
            type="number"
            min={0} max={50} step={1}
            className="border border-slate-200 rounded-lg px-3 py-1.5 w-20 text-sm focus:border-blue-300 outline-none"
            value={c.toleranceBand}
            onChange={e => patch({ toleranceBand: Number(e.target.value) })}
          />
          <span className="text-xs text-slate-400">%（超過此幅度才建議再平衡）</span>
        </div>
      </Section>
    </>
  )
}
