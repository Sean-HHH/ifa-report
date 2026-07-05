import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { ClientProfile, VisibleModules } from '../../types/client'
import { useAppSettings } from '../../hooks/useAppSettings'
import { PasswordGate } from './PasswordGate'
import { BasicInfoPage } from './BasicInfoPage'
import { CashFlowReport } from '../../features/cashflow/CashFlowReport'
import { AssetReport } from '../../features/assets/AssetReport'
import { AssetGrowthReport } from '../../features/assets/AssetGrowthReport'
import { RetirementReport } from '../../features/retirement/RetirementReport'

type LoadState = 'not_found' | 'pending_password' | 'verified'
type Tab = 'basic' | 'cashflow' | 'assets' | 'assetGrowth' | 'retirement'

const CHART_TABS: { key: Exclude<Tab, 'basic'>; label: string; moduleKey: keyof VisibleModules }[] = [
  { key: 'cashflow',    label: '收支分析', moduleKey: 'cashflow' },
  { key: 'assets',     label: '資產組合', moduleKey: 'assets' },
  { key: 'assetGrowth', label: '資產成長', moduleKey: 'assetGrowth' },
  { key: 'retirement', label: '退休規劃', moduleKey: 'retirement' },
]

interface VerifiedSnapshot {
  snapshot_data: ClientProfile
  visible_modules: VisibleModules
}

export function ClientViewPage() {
  const { id } = useParams<{ id: string }>()
  const { effectiveRates } = useAppSettings()
  const [loadState, setLoadState] = useState<LoadState>(() => (id ? 'pending_password' : 'not_found'))
  const [snapshotData, setSnapshotData] = useState<ClientProfile | null>(null)
  const [visibleModules, setVisibleModules] = useState<VisibleModules | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('basic')

  const handleVerify = async (password: string): Promise<boolean> => {
    if (!id) return false
    const { data, error } = await supabase.rpc('verify_shared_snapshot', {
      p_id: id,
      p_password: password,
    })
    if (error || !Array.isArray(data) || data.length !== 1) return false

    const verified = data[0] as VerifiedSnapshot
    setSnapshotData(verified.snapshot_data)
    setVisibleModules(verified.visible_modules)
    if (verified.visible_modules.basicInfo) {
      setActiveTab('basic')
    } else {
      const first = CHART_TABS.find(tab => verified.visible_modules[tab.moduleKey])
      if (first) setActiveTab(first.key)
    }
    setLoadState('verified')
    return true
  }

  if (loadState === 'not_found') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif" }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 15 }}>
          連結無效或已過期
        </div>
      </div>
    )
  }

  if (loadState === 'pending_password') {
    return <PasswordGate onVerify={handleVerify} />
  }

  // Build available tab list from visibleModules
  const allTabs: { key: Tab; label: string }[] = []
  if (visibleModules?.basicInfo) allTabs.push({ key: 'basic', label: '基本資料' })
  for (const t of CHART_TABS) {
    if (visibleModules?.[t.moduleKey]) allTabs.push({ key: t.key, label: t.label })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif" }}>
      <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 24px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>{snapshotData?.name ?? ''} 的財務規劃報告</div>
      </header>

      {allTabs.length > 1 && (
        <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 0 }}>
          {allTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: activeTab === key ? 600 : 400,
                color: activeTab === key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === key ? '2px solid var(--color-lime)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {snapshotData && visibleModules && (
        <>
          {activeTab === 'basic' && visibleModules.basicInfo && (
            <BasicInfoPage client={snapshotData} />
          )}
          {activeTab !== 'basic' && (
            <div style={{ padding: '24px 24px 48px' }}>
              {activeTab === 'cashflow' && visibleModules.cashflow && (
                <CashFlowReport client={snapshotData} rates={effectiveRates} reportCurrency="TWD" />
              )}
              {activeTab === 'assets' && visibleModules.assets && (
                <AssetReport client={snapshotData} rates={effectiveRates} reportCurrency="TWD" />
              )}
              {activeTab === 'assetGrowth' && visibleModules.assetGrowth && (
                <AssetGrowthReport client={snapshotData} rates={effectiveRates} reportCurrency="TWD" />
              )}
              {activeTab === 'retirement' && visibleModules.retirement && (
                <RetirementReport client={snapshotData} rates={effectiveRates} reportCurrency="TWD" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
