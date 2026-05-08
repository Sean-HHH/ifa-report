import { useMemo, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { ClientProfile } from '../../types/client'
import { INVESTMENT_CATEGORY_LABELS } from '../../types/client'
import { totalAssets, totalLiabilities, netWorth, fmtNTD } from '../../utils/calculations'
import { StatCard } from './StatCard'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f43f5e']

function NoteTag({ note }: { note?: string }) {
  const [show, setShow] = useState(false)
  if (!note) return null
  return (
    <div className="relative inline-block">
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded cursor-help">
        📝
      </button>
      {show && (
        <div className="absolute left-0 top-6 z-10 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 w-56 shadow-lg whitespace-pre-wrap">
          {note}
        </div>
      )}
    </div>
  )
}

export function AssetReport({ client }: { client: ClientProfile }) {
  const nw = useMemo(() => netWorth(client), [client])
  const totalInv = useMemo(() => totalAssets(client), [client])
  const totalLiab = useMemo(() => totalLiabilities(client), [client])

  const invByCategory: Record<string, number> = {}
  client.assetItems.forEach(item => {
    const cat = INVESTMENT_CATEGORY_LABELS[item.category]
    invByCategory[cat] = (invByCategory[cat] ?? 0) + item.amount
  })
  const invPieData = {
    labels: Object.keys(invByCategory),
    datasets: [{ data: Object.values(invByCategory), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }],
  }

  const longTermLiab = client.liabilityItems.filter(l => l.type === 'long_term')
  const currentLiab = client.liabilityItems.filter(l => l.type === 'current')

  return (
    <div className="report-page space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800">資產組合</h2>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="淨資產" value={fmtNTD(nw, true)} color={nw >= 0 ? 'blue' : 'red'} />
        <StatCard label="總資產" value={fmtNTD(totalInv, true)} color="green" />
        <StatCard label="總負債" value={fmtNTD(totalLiab, true)} color={totalLiab > 0 ? 'red' : 'green'} />
      </div>

      {/* 資產組合 */}
      {client.assetItems.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">資產組合明細 · 總計 {fmtNTD(totalInv, true)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-52 flex items-center justify-center">
              <Pie data={invPieData} options={{ responsive: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }} />
            </div>
            <div className="space-y-1">
              {client.assetItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded shrink-0">
                      {INVESTMENT_CATEGORY_LABELS[item.category]}
                    </span>
                    <span className="text-slate-700 truncate">{item.label}</span>
                    <NoteTag note={item.note} />
                  </div>
                  <span className="font-medium text-emerald-700 shrink-0 ml-2">{fmtNTD(item.amount, true)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400 text-center py-6">尚未輸入資產資料</div>
      )}

      {/* 負債明細 */}
      {client.liabilityItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">負債明細 · 總計 {fmtNTD(totalLiab, true)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {longTermLiab.length > 0 && (
              <div>
                <div className="text-xs font-medium text-red-400 mb-1">長期負債</div>
                {longTermLiab.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-700">{item.label}</span>
                      <NoteTag note={item.note} />
                    </div>
                    <span className="font-medium text-red-700">{fmtNTD(item.amount, true)}</span>
                  </div>
                ))}
              </div>
            )}
            {currentLiab.length > 0 && (
              <div>
                <div className="text-xs font-medium text-orange-400 mb-1">流動負債</div>
                {currentLiab.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-700">{item.label}</span>
                      <NoteTag note={item.note} />
                    </div>
                    <span className="font-medium text-orange-700">{fmtNTD(item.amount, true)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
