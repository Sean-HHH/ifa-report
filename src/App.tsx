import { useState } from 'react'
import { useClientStore } from './hooks/useClientStore'
import { ClientManager } from './components/ClientManager/ClientManager'
import { InputForm } from './components/InputForm/InputForm'
import { CashFlowReport } from './components/reports/CashFlowReport'
import { AssetReport } from './components/reports/AssetReport'
import { AssetGrowthReport } from './components/reports/AssetGrowthReport'
import { RetirementReport } from './components/reports/RetirementReport'

type ReportTab = 'cashflow' | 'assets' | 'growth' | 'retirement'

const tabLabels: Record<ReportTab, string> = {
  cashflow: '收支分析',
  assets: '資產組合',
  growth: '資產成長',
  retirement: '退休規劃',
}

export default function App() {
  const { clients, activeClient, createClient, updateClient, deleteClient, selectClient } = useClientStore()
  const [reportTab, setReportTab] = useState<ReportTab>('cashflow')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [printing, setPrinting] = useState(false)

  const handleExport = async () => {
    if (!activeClient) return
    setPrinting(true)
    // 等 React 渲染全部 4 個報表、Chart.js 畫完
    await new Promise(r => setTimeout(r, 600))
    window.print()
    setPrinting(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif" }}>
      {/* Sidebar — 列印時隱藏 */}
      <aside data-print-hide style={{
        width: sidebarOpen ? 256 : 0,
        overflow: 'hidden',
        transition: 'width 0.2s',
        flexShrink: 0,
      }}>
        <div style={{ width: 256, height: '100%', background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 18 }}>IFA Report</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>財務規劃系統</div>
          </div>
          <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>客戶列表</div>
            <ClientManager
              clients={clients}
              activeId={activeClient?.id ?? null}
              onSelect={selectClient}
              onCreate={createClient}
              onDelete={deleteClient}
            />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header — 列印時隱藏 */}
        <header data-print-hide style={{ height: 56, background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span style={{ fontWeight: 600, color: '#334155' }}>{activeClient?.name ?? 'IFA Report'}</span>
          {activeClient && (
            <button onClick={handleExport} disabled={printing} style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              background: printing ? '#93c5fd' : '#3b82f6', color: '#fff',
              border: 'none', cursor: printing ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, padding: '6px 16px', borderRadius: 8, transition: 'background 0.15s',
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {printing ? '準備中...' : '匯出 PDF'}
            </button>
          )}
        </header>

        {!activeClient ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
              <div style={{ color: '#475569', fontWeight: 500, marginBottom: 8 }}>選擇或建立一位客戶開始規劃</div>
              <button onClick={createClient} style={{
                marginTop: 12, background: '#3b82f6', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '8px 20px', borderRadius: 8,
              }}>
                建立第一位客戶
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Input panel — 列印時隱藏 */}
            <div data-print-hide style={{ width: 480, flexShrink: 0, overflowY: 'auto', padding: 16, background: '#f8fafc', borderRight: '1px solid #f1f5f9' }}>
              <InputForm client={activeClient} onChange={updateClient} />
            </div>

            {/* Report panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Tab bar — 列印時隱藏 */}
              <div data-print-hide style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff', padding: '0 16px', flexShrink: 0 }}>
                {(Object.keys(tabLabels) as ReportTab[]).map(t => (
                  <button key={t} onClick={() => setReportTab(t)} style={{
                    padding: '12px 20px', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
                    color: reportTab === t ? '#3b82f6' : '#94a3b8',
                    borderBottom: reportTab === t ? '2px solid #3b82f6' : '2px solid transparent',
                    transition: 'color 0.15s',
                  }}>
                    {tabLabels[t]}
                  </button>
                ))}
              </div>

              {/* Report content */}
              <div data-print-content style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {printing ? (
                  // 列印模式：同時渲染全部 4 頁，讓瀏覽器列印引擎各自分頁
                  <>
                    <CashFlowReport client={activeClient} />
                    <AssetReport client={activeClient} />
                    <AssetGrowthReport client={activeClient} />
                    <RetirementReport client={activeClient} />
                  </>
                ) : (
                  // 一般模式：只渲染當前 tab
                  <>
                    {reportTab === 'cashflow' && <CashFlowReport client={activeClient} />}
                    {reportTab === 'assets' && <AssetReport client={activeClient} />}
                    {reportTab === 'growth' && <AssetGrowthReport client={activeClient} />}
                    {reportTab === 'retirement' && <RetirementReport client={activeClient} />}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
