import { useEffect, useState } from 'react'
import type { AssetPeriodSnapshot } from './types/client'
import { exportToPDF } from './shared/pdfExport'
import { ShareModal } from './features/share/ShareModal'
import { ShareListModal } from './features/share/ShareListModal'
import { useClientStore } from './hooks/useClientStore'
import { useAppSettings } from './hooks/useAppSettings'
import { useAuth } from './features/auth/useAuth'
import { AuthGate } from './features/auth/AuthGate'
import { ClientManager } from './features/client/ClientManager'
import { InputForm } from './features/input/InputForm'
import { FxPanel } from './features/fx/FxPanel'
import { SnapshotPanel } from './features/assets/SnapshotPanel'
import { CashFlowReport } from './features/cashflow/CashFlowReport'
import { AssetReport } from './features/assets/AssetReport'
import { AssetGrowthReport } from './features/assets/AssetGrowthReport'
import { RetirementReport } from './features/retirement/RetirementReport'

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
  const auth = useAuth()
  const {
    clients,
    activeClient,
    createClient,
    updateClient,
    deleteClient,
    selectClient,
    saveClient,
    loading: dataLoading,
    saving,
    saveError,
    lastSavedAt,
    isDirty,
    hasUnsavedChanges,
  } = useClientStore()
  const { reportCurrency, setReportCurrency, effectiveRates, apiRates, manualRates, setManualRate, clearManualRates, loading: fxLoading, lastUpdated } = useAppSettings()
  const [reportTab, setReportTab] = useState<ReportTab>('cashflow')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [showFxPanel, setShowFxPanel] = useState(false)
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false)
  const [showShareListModal, setShowShareListModal] = useState(false)
  const [shareTargetSnapshot, setShareTargetSnapshot] = useState<AssetPeriodSnapshot | null>(null)

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleShareUpdate = (updated: AssetPeriodSnapshot) => {
    if (!activeClient) return
    updateClient({
      ...activeClient,
      assetSnapshots: activeClient.assetSnapshots.map(s =>
        s.id === updated.id ? updated : s
      ),
    })
    setShareTargetSnapshot(updated)
  }

  const handleExport = async () => {
    if (!activeClient) return
    setPrinting(true)
    await new Promise(r => setTimeout(r, 2000))  // 等 Recharts/Chart.js 動畫完成
    try {
      await exportToPDF(activeClient.name)
    } finally {
      setPrinting(false)
    }
  }

  const fxProps = { rates: effectiveRates, reportCurrency }

  if (auth.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>載入中…</div>
      </div>
    )
  }

  if (!auth.user) {
    return <AuthGate />
  }

  return (
    <>
    {showShareListModal && activeClient && (
      <ShareListModal
        client={activeClient}
        onClose={() => setShowShareListModal(false)}
        onManage={snap => setShareTargetSnapshot(snap)}
      />
    )}
    {shareTargetSnapshot && activeClient && (
      <ShareModal
        snapshot={shareTargetSnapshot}
        client={activeClient}
        onClose={() => setShareTargetSnapshot(null)}
        onUpdate={handleShareUpdate}
      />
    )}
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg)' }}>
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
            {/* Sync indicator */}
            {dataLoading && (
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                載入中…
              </span>
            )}

            {activeClient && (
              <>
                <span style={{
                  fontSize: 11,
                  color: saveError
                    ? 'var(--color-negative)'
                    : isDirty
                      ? 'var(--color-accent)'
                      : 'var(--color-text-muted)',
                  maxWidth: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }} title={saveError ?? undefined}>
                  {saveError
                    ?? (saving
                      ? '儲存中…'
                      : isDirty
                        ? '有未儲存的變更'
                        : lastSavedAt
                          ? `已儲存 ${lastSavedAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
                          : '已載入')}
                </span>
                <button
                  onClick={() => void saveClient(activeClient)}
                  disabled={saving || !isDirty}
                  style={{
                    fontSize: 12,
                    padding: '6px 14px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: saving || !isDirty ? 'var(--color-primary-muted)' : 'var(--color-primary)',
                    color: saving || !isDirty ? 'var(--color-text-muted)' : '#fff',
                    cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {saving ? '儲存中…' : '儲存'}
                </button>
              </>
            )}

            {/* FX rate indicator */}
            {fxLoading && (
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
                border: `1px solid ${showFxPanel ? 'var(--color-lime)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: showFxPanel ? 'var(--color-lime-bg)' : 'var(--color-surface)',
                color: showFxPanel ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer', fontWeight: showFxPanel ? 600 : 400,
              }}
            >
              匯率
            </button>

            {/* Snapshot panel toggle */}
            {activeClient && (
              <button
                onClick={() => setShowSnapshotPanel(v => !v)}
                style={{
                  fontSize: 12, padding: '5px 10px',
                  border: `1px solid ${showSnapshotPanel ? 'var(--color-lime)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: showSnapshotPanel ? 'var(--color-lime-bg)' : 'var(--color-surface)',
                  color: showSnapshotPanel ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer', fontWeight: showSnapshotPanel ? 600 : 400,
                }}
              >
                期間記錄
              </button>
            )}

            {activeClient && (
              <button onClick={() => setShowShareListModal(true)} style={{
                fontSize: 12, padding: '5px 10px',
                border: `1px solid ${showShareListModal ? 'var(--color-lime)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: showShareListModal ? 'var(--color-lime-bg)' : 'var(--color-surface)',
                color: showShareListModal ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer', fontWeight: showShareListModal ? 600 : 400,
              }}>
                分享管理
              </button>
            )}

            {activeClient && (
              <button onClick={handleExport} disabled={printing} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: printing ? 'var(--color-primary-muted)' : 'var(--color-primary)',
                color: printing ? 'var(--color-text-muted)' : '#fff',
                border: 'none', cursor: printing ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, padding: '7px 18px',
                borderRadius: 'var(--radius-md)', transition: 'background 0.15s',
                boxShadow: printing ? 'none' : '0 1px 4px rgba(0,0,0,0.18)',
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {printing ? '準備中...' : '匯出 PDF'}
              </button>
            )}

            <button onClick={auth.signOut} style={{
              fontSize: 12, padding: '5px 10px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}>
              登出
            </button>
          </div>
        </header>

        {/* Snapshot Panel (floating) */}
        {showSnapshotPanel && activeClient && (
          <SnapshotPanel
            client={activeClient}
            rates={effectiveRates}
            reportCurrency={reportCurrency}
            onUpdate={updateClient}
            onClose={() => setShowSnapshotPanel(false)}
            onShare={snap => setShareTargetSnapshot(snap)}
          />
        )}

        {/* FX Panel (floating) */}
        {showFxPanel && (
          <FxPanel
            apiRates={apiRates}
            manualRates={manualRates}
            onSetManualRate={setManualRate}
            onClearAll={clearManualRates}
            lastUpdated={lastUpdated}
            loading={fxLoading}
            onClose={() => setShowFxPanel(false)}
          />
        )}

        {!activeClient ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 80, height: 80, borderRadius: 20,
                background: 'var(--color-primary-muted)', marginBottom: 20,
              }}>
                <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>選擇或建立一位客戶開始規劃</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 24 }}>從左側客戶列表選擇，或建立新客戶</div>
              <button onClick={createClient} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: '9px 22px',
                borderRadius: 'var(--radius-md)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
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
                    color: reportTab === t ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    borderBottom: reportTab === t ? `3px solid var(--color-lime)` : '3px solid transparent',
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
    </>
  )
}
