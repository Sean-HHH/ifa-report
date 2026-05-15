import type { ClientProfile, InvestmentItem, InvestmentCategory, AssetCurrency, AssetPurpose } from '../../../types/client'
import { INVESTMENT_CATEGORY_LABELS, ASSET_CURRENCY_LABELS, ASSET_PURPOSE_LABELS } from '../../../types/client'
import { convertCurrency, fmtAmount } from '../../../utils/calculations'
import type { FxRates } from '../../fx/exchangeRate'
import { Section, AddBtn, NoteField } from '../shared'

const TRADEABLE = new Set<InvestmentCategory>(['stock', 'fund', 'bond', 'crypto'])

interface Props {
  c: ClientProfile
  patch: (partial: Partial<ClientProfile>) => void
  rates?: FxRates
}

export function AssetTab({ c, patch, rates }: Props) {
  const totalAssetsRaw = rates
    ? c.assetItems.reduce((s, i) => s + convertCurrency(i.amount, i.currency ?? 'TWD', 'TWD', rates), 0)
    : c.assetItems.reduce((s, i) => s + i.amount, 0)

  const update = (i: number, p: Partial<InvestmentItem>) =>
    patch({ assetItems: c.assetItems.map((item, idx) => idx === i ? { ...item, ...p } : item) })
  const add = () => patch({ assetItems: [...c.assetItems, { id: crypto.randomUUID(), label: '新項目', amount: 0, category: 'cash', purpose: 'emergency' }] })
  const remove = (i: number) => patch({ assetItems: c.assetItems.filter((_, idx) => idx !== i) })

  const handleCategoryChange = (i: number, cat: InvestmentCategory) => {
    const item = c.assetItems[i]
    const purpose: AssetPurpose = cat === 'cash'
      ? 'emergency'
      : (item.purpose === 'emergency' ? 'growth' : (item.purpose ?? 'growth'))
    update(i, { category: cat, purpose })
  }

  const handleTradeableField = (i: number, field: 'unitPrice' | 'units', value: number) => {
    const item = c.assetItems[i]
    const unitPrice = field === 'unitPrice' ? value : (item.unitPrice ?? 0)
    const units     = field === 'units'     ? value : (item.units     ?? 0)
    update(i, {
      [field]: value,
      amount: unitPrice > 0 && units > 0 ? unitPrice * units : item.amount,
    })
  }

  return (
    <Section title={`資產組合 · 總計 ${(totalAssetsRaw / 10000).toFixed(0)} 萬`}>
      {c.assetItems.map((item, i) => {
        const isTradeable = TRADEABLE.has(item.category)
        return (
          <div key={i} className="mb-3 bg-slate-50 rounded-xl p-3">
            <div className="flex gap-2 items-center flex-wrap">
              <select
                className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-blue-300 outline-none"
                value={item.category}
                onChange={e => handleCategoryChange(i, e.target.value as InvestmentCategory)}>
                {(Object.keys(INVESTMENT_CATEGORY_LABELS) as InvestmentCategory[]).map(cat => (
                  <option key={cat} value={cat}>{INVESTMENT_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <input className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                value={item.label} onChange={e => update(i, { label: e.target.value })}
                placeholder={isTradeable ? '標的名稱 / 代碼' : '項目名稱'} />
              {!isTradeable && (
                <div className="flex flex-col">
                  <input type="number" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-300 outline-none"
                    value={item.amount}
                    placeholder={`金額（${item.currency ?? 'TWD'}）`}
                    onChange={e => update(i, { amount: Number(e.target.value) })} />
                  {item.currency && item.currency !== 'TWD' && rates && item.amount > 0 && (
                    <span className="text-xs text-slate-400 mt-0.5 text-right">
                      ≈ {fmtAmount(convertCurrency(item.amount, item.currency, 'TWD', rates), 'TWD', true)} TWD
                    </span>
                  )}
                </div>
              )}
              <button onClick={() => remove(i)} aria-label="刪除此項資產" className="text-slate-300 hover:text-red-400 transition-colors p-1 flex items-center" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {isTradeable && (
              <div className="flex flex-wrap gap-2 items-center mt-1.5">
                <input type="number" min={0} step="any"
                  className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm focus:border-blue-300 outline-none"
                  value={item.unitPrice ?? ''}
                  onChange={e => handleTradeableField(i, 'unitPrice', Number(e.target.value))}
                  placeholder={`每股單價（${item.currency ?? 'TWD'}）`} />
                <span className="text-xs text-slate-400">×</span>
                <input type="number" min={0} step="any"
                  className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm focus:border-blue-300 outline-none"
                  value={item.units ?? ''}
                  onChange={e => handleTradeableField(i, 'units', Number(e.target.value))}
                  placeholder="持有股數 / 張數" />
                <span className="text-xs text-slate-400">=</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-600">
                    {fmtAmount(item.amount, item.currency ?? 'TWD')}
                  </span>
                  {item.currency && item.currency !== 'TWD' && rates && item.amount > 0 && (
                    <span className="text-xs text-slate-400">
                      ≈ {fmtAmount(convertCurrency(item.amount, item.currency, 'TWD', rates), 'TWD', true)} TWD
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-1.5">
              <select
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                value={item.currency ?? 'TWD'}
                onChange={e => update(i, { currency: e.target.value as AssetCurrency })}>
                {(Object.keys(ASSET_CURRENCY_LABELS) as AssetCurrency[]).map(cur => (
                  <option key={cur} value={cur}>{ASSET_CURRENCY_LABELS[cur]}</option>
                ))}
              </select>
              <input
                className="flex-1 min-w-[100px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                value={item.institution ?? ''}
                onChange={e => update(i, { institution: e.target.value })}
                placeholder="帳戶 / 機構（選填）" />
              {item.category === 'cash' ? (
                <span className="bg-white border border-slate-100 rounded-lg px-2 py-1 text-xs text-slate-400">
                  生活備用金
                </span>
              ) : (
                <select
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-blue-300 outline-none"
                  value={item.purpose ?? 'growth'}
                  onChange={e => update(i, { purpose: e.target.value as AssetPurpose })}>
                  {(Object.keys(ASSET_PURPOSE_LABELS) as AssetPurpose[]).map(p => (
                    <option key={p} value={p}>{ASSET_PURPOSE_LABELS[p]}</option>
                  ))}
                </select>
              )}
            </div>
            <NoteField value={item.note} onChange={v => update(i, { note: v })} />
          </div>
        )
      })}
      <AddBtn onClick={add} label="新增資產項目" />
    </Section>
  )
}
