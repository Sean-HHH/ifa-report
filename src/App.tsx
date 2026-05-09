import { useState } from 'react'
import { useClientStore } from './hooks/useClientStore'
import { useAppSettings } from './hooks/useAppSettings'
import { ClientManager } from './components/ClientManager/ClientManager'
import { InputForm } from './components/InputForm/InputForm'
import { FxPanel } from './components/FxPanel'
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

const RC_OPTIONS = [
  { value: 'TWD', label: 'TWD' },
  { value: 'USD', label: 'USD' },
  { value: 'JPY', label: 'JPY' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'HKD', label: 'HKD' },
]

export default function App() {
  const { clients, activeClient, createClient, updateClient, deleteClient, selectClient } = useClientStore()
  const { reportCurrency, setReportCurrency, effectiveRates, apiRates, manualRates, setManualRate, clearManualRates, loading, lastUpdated } = useAppSettings()
  const [reportTab, setReportTab] = useState<ReportTab>('cashflow')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [showFxPanel, setShowFxPanel] = useState(false)

  const handleExport = async () => {
    if (!activeClient) return
    setPrinting(true)
    await new Promise(r => setTimeout(r, 600))
    window.print()
    setPrinting(false)
  }

  const fxProps = { rates: effectiveRates, reportCurrency }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg)', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif" }}>
      {/* Sidebar — 列印時隱藏 */}
      <aside data-print-hide style={{
        width: sidebarOpen ? 256 : 0,
        overflow: 'hidden',
        transition: 'width 0.2s',
        flexShrink: 0,
      }}>
        <div style={{ width: 256, height: '100%', background: 'var(--color-sidebar-bg)', borderRight: `1px solid var(--color-sidebar-border)`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 16px', borderBottom: `1px solid var(--color-sidebar-border)` }}>
            <div style={{ color: 'var(--color-sidebar-text)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>IFA Report</div>
            <div style={{ color: 'var(--color-sidebar-text-muted)', fontSize: 12, marginTop: 2 }}>財務規劃系統</div>
          </div>
          <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-sidebar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, paddingLeft: 8 }}>客戶列表</div>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Header — 列印時隱藏 */}
        <header data-print-hide style={{ height: 56, background: 'var(--color-surface)', borderBottom: `1px solid var(--color-border)`, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 100 }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, borderRadius: 'var(--radius-sm)', transition: 'color 0.15s' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{activeClient?.name ?? 'IFA Report'}</span>

          {/* Right side controls */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* FX rate indicator */}
            {loading && (
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>匯率載入中…</span>
            )}

            {/* Report currency selector */}
            <select
              value={reportCurrency}
              onChange={e => setReportCurrency(e.target.value)}
              style={{
                fontSize: 13, fontWeight: 500, padding: '5px 8px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {RC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* FX panel toggle */}
            <button
              onClick={() => setShowFxPanel(v => !v)}
              style={{
                fontSize: 12, padding: '5px 10px',
                border: `1px solid ${showFxPanel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: showFxPanel ? 'rgba(37,99,235,0.06)' : 'var(--color-surface)',
                color: showFxPanel ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              匯率
            </button>

            {activeClient && (
              <button onClick={handleExport} disabled={printing} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: printing ? 'var(--color-primary-muted)' : 'var(--color-primary)',
                color: '#fff',
                border: 'none', cursor: printing ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, padding: '7px 18px',
                borderRadius: 'var(--radius-md)', transition: 'background 0.15s',
                boxShadow: printing ? 'none' : '0 1px 4px rgba(37,99,235,0.3)',
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {printing ? '準備中...' : '匯出 PDF'}
              </button>
            )}
          </div>
        </header>

        {/* FX Panel (floating) */}
        {showFxPanel && (
          <FxPanel
            apiRates={apiRates}
            manualRates={manualRates}
            onSetManualRate={setManualRate}
            onClearAll={clearManualRates}
            lastUpdated={lastUpdated}
            loading={loading}
            onClose={() => setShowFxPanel(false)}
          />
        )}

        {!activeClient ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 8 }}>選擇或建立一位客戶開始規劃</div>
              <button onClick={createClient} style={{
                marginTop: 12, background: 'var(--color-primary)', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: '9px 22px',
                borderRadius: 'var(--radius-md)', boxShadow: '0 1px 4px rgba(37,99,235,0.3)',
              }}>
                建立第一位客戶
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Input panel — 列印時隱藏 */}
            <div data-print-hide style={{ width: 480, flexShrink: 0, overflowY: 'auto', padding: 16, background: 'var(--color-bg)', borderRight: `1px solid var(--color-border)` }}>
              <InputForm client={activeClient} onChange={updateClient} rates={effectiveRates} />
            </div>

            {/* Report panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Tab bar — 列印時隱藏 */}
              <div data-print-hide style={{ display: 'flex', borderBottom: `1px solid var(--color-border)`, background: 'var(--color-surface)', padding: '0 16px', flexShrink: 0 }}>
                {(Object.keys(tabLabels) as ReportTab[]).map(t => (
                  <button key={t} onClick={() => setReportTab(t)} style={{
                    padding: '12px 20px', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
                    color: reportTab === t ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: reportTab === t ? '3px solid var(--color-primary)' : '3px solid transparent',
                    transition: 'color 0.15s',
                    marginBottom: -1,
                  }}>
                    {tabLabels[t]}
                  </button>
                ))}
              </div>

              {/* Report content */}
              <div data-print-content style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {printing ? (
                  <>
                    <CashFlowReport client={activeClient} {...fxProps} />
                    <AssetReport client={activeClient} {...fxProps} />
                    <AssetGrowthReport client={activeClient} {...fxProps} />
                    <RetirementReport client={activeClient} {...fxProps} />
                  </>
                ) : (
                  <>
                    {reportTab === 'cashflow' && <CashFlowReport client={activeClient} {...fxProps} />}
                    {reportTab === 'assets' && <AssetReport client={activeClient} {...fxProps} />}
                    {reportTab === 'growth' && <AssetGrowthReport client={activeClient} {...fxProps} />}
                    {reportTab === 'retirement' && <RetirementReport client={activeClient} {...fxProps} />}
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
