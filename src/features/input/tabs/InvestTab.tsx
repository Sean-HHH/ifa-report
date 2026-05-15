import type { ClientProfile, RiskProfile, InvestmentCategory } from '../../../types/client'
import { INVESTMENT_CATEGORY_LABELS, RISK_RETURN } from '../../../types/client'
import { calcCashFlow, fmtPct, totalAssetsConverted } from '../../../utils/calculations'
import type { FxRates } from '../../fx/exchangeRate'
import { Section, NumField } from '../shared'

const riskLabels: Record<RiskProfile, string> = {
  conservative: '保守',
  moderate: '穩健',
  aggressive: '積極',
}

const ACTIVE_BTN: React.CSSProperties = {
  background: 'var(--color-lime)',
  color: 'var(--color-text-primary)',
  borderColor: 'var(--color-lime)',
}

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
  rates?: FxRates
}

function fmtWan(n: number) {
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  return n.toLocaleString('zh-TW')
}

export function InvestTab({ c, patch, rates }: Props) {
  return (
    <>
      <Section title="風險承受度">
        <div className="grid grid-cols-3 gap-2">
          {(['conservative', 'moderate', 'aggressive'] as RiskProfile[]).map(r => {
            const rr = RISK_RETURN[r]
            const isSelected = c.riskProfile === r
            return (
              <button key={r} onClick={() => patch({ riskProfile: r })}
                style={isSelected ? ACTIVE_BTN : {}}
                className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all flex flex-col items-center gap-0.5 ${
                  isSelected ? '' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}>
                <span>{riskLabels[r]}</span>
                <span className={`text-xs font-normal ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                  {fmtPct(rr.conservative * 100)}/{fmtPct(rr.base * 100)}/{fmtPct(rr.aggressive * 100)}
                </span>
                {isSelected && c.customReturnRate !== null && (
                  <span className="text-xs text-slate-500">自定 {fmtPct(c.customReturnRate * 100)}</span>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="報酬率設定">
        <div className="flex items-center gap-3 mb-3">
          <label className="text-sm text-slate-500 w-32">投資組合報酬率</label>
          <input
            type="number"
            className="border border-slate-200 rounded-lg px-3 py-2 w-28 text-sm outline-none"
            placeholder="留空自動"
            value={c.customReturnRate !== null ? (c.customReturnRate * 100).toFixed(1) : ''}
            onChange={e => patch({ customReturnRate: e.target.value ? Number(e.target.value) / 100 : null })}
          />
          <span className="text-sm text-slate-400">%（空白 = 依風險預設）</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500 w-32">不動產年化增值</label>
          <input
            type="number"
            step="0.1"
            className="border border-slate-200 rounded-lg px-3 py-2 w-28 text-sm outline-none"
            placeholder={((c.globalInflationRate ?? 0.02) * 100).toFixed(1)}
            value={c.realEstateReturnRate !== undefined ? (c.realEstateReturnRate * 100).toFixed(1) : ''}
            onChange={e => patch({ realEstateReturnRate: e.target.value ? Number(e.target.value) / 100 : c.globalInflationRate })}
          />
          <span className="text-sm text-slate-400">%（空白 = 同通膨率）</span>
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
                  style={!usingCf ? ACTIVE_BTN : {}}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${!usingCf ? '' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  自定金額
                </button>
                <button
                  onClick={() => patch({ useInvestibleCashFlow: true, monthlyContribution: effectiveContribution })}
                  style={usingCf ? ACTIVE_BTN : {}}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${usingCf ? '' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  使用可投資現金流
                </button>
              </div>
              <NumField label="每月定期投入" value={displayValue} onChange={v => patch({ monthlyContribution: v })} disabled={usingCf} />
              {usingCf && cf.investibleCashFlow < 0 && (
                <div className="text-xs text-slate-400 mt-1 ml-1">可投資現金流為負，建議先優化收支</div>
              )}
              {ratio && (
                <div className="text-xs text-slate-400 mt-1 ml-1">
                  = 可投資現金流的 <span className="font-medium" style={{ color: 'var(--color-lime-hover)' }}>{ratio}</span>
                </div>
              )}
            </div>
          )
        })()}
      </Section>

      <Section title="目標配置">
        {(() => {
          const totalTWD = totalAssetsConverted(c, rates ?? { TWD: 1 }, 'TWD')
          const allocTotal = Object.values(c.targetAllocation).reduce((s, v) => s + (v ?? 0), 0)
          const isOver = allocTotal > 100

          return (
            <>
              {totalTWD > 0 && (
                <div className="text-xs text-slate-400 mb-2">
                  總資產（折合台幣）：<span className="font-medium text-slate-600">{fmtWan(totalTWD)}</span>
                  <span className="ml-1 text-slate-300">— 各比例對應金額依此估算</span>
                </div>
              )}
              <div className="space-y-1.5">
                {(Object.keys(INVESTMENT_CATEGORY_LABELS) as InvestmentCategory[]).map(cat => {
                  const val = c.targetAllocation[cat]
                  const estAmount = val !== undefined && val > 0 && totalTWD > 0
                    ? val / 100 * totalTWD
                    : null
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <label className="text-sm text-slate-500 w-24 shrink-0">{INVESTMENT_CATEGORY_LABELS[cat]}</label>
                      <input
                        type="number"
                        min={0} max={100} step={1}
                        placeholder="–"
                        className="border rounded-lg px-3 py-1.5 w-20 text-sm outline-none"
                        style={{ borderColor: isOver && val ? '#fca5a5' : undefined }}
                        value={val !== undefined ? val : ''}
                        onChange={e => {
                          const next = { ...c.targetAllocation }
                          if (e.target.value === '') { delete next[cat] } else { next[cat] = Number(e.target.value) }
                          patch({ targetAllocation: next })
                        }}
                      />
                      <span className="text-xs text-slate-400">%</span>
                      {estAmount !== null && (
                        <span className="text-xs text-slate-400">≈ <span className="font-medium text-slate-600">{fmtWan(estAmount)}</span></span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-2">
                {allocTotal === 0 && (
                  <div className="text-xs text-slate-400">尚未設定目標配置</div>
                )}
                {isOver && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                    <span>⚠</span>
                    <span>合計 {allocTotal}%，超過 100%，請調整（超出 {allocTotal - 100}%）</span>
                  </div>
                )}
                {!isOver && allocTotal > 0 && (
                  <div className="text-xs text-emerald-600">已配置 {allocTotal}%，剩餘 {100 - allocTotal}%</div>
                )}
              </div>
            </>
          )
        })()}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
          <label className="text-sm text-slate-500 w-24 shrink-0">容許偏離</label>
          <input
            type="number"
            min={0} max={50} step={1}
            className="border border-slate-200 rounded-lg px-3 py-1.5 w-20 text-sm outline-none"
            value={c.toleranceBand}
            onChange={e => patch({ toleranceBand: Number(e.target.value) })}
          />
          <span className="text-xs text-slate-400">%（超過此幅度才建議再平衡）</span>
        </div>
      </Section>
    </>
  )
}
