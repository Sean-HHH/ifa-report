import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { ClientProfile, VisibleModules } from '../../types/client'
import { PasswordGate } from './PasswordGate'
import { BasicInfoPage } from './BasicInfoPage'
import { ChartsPage } from './ChartsPage'

type LoadState = 'loading' | 'not_found' | 'pending_password' | 'verified'
type Tab = 'basic' | 'charts'

export function ClientViewPage() {
  const { id } = useParams<{ id: string }>()
  const [loadState, setLoadState] = useState<LoadState>(() => (id ? 'loading' : 'not_found'))
  const [passwordHash, setPasswordHash] = useState('')
  const [snapshotData, setSnapshotData] = useState<ClientProfile | null>(null)
  const [visibleModules, setVisibleModules] = useState<VisibleModules | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('basic')

  useEffect(() => {
    if (!id) return
    supabase
      .from('shared_snapshots')
      .select('snapshot_data, visible_modules, password_hash')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoadState('not_found')
          return
        }
        setPasswordHash(data.password_hash)
        setSnapshotData(data.snapshot_data as ClientProfile)
        setVisibleModules(data.visible_modules as VisibleModules)
        setLoadState('pending_password')
      })
  }, [id])

  if (loadState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif" }}>
        載入中…
      </div>
    )
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
    return (
      <PasswordGate
        passwordHash={passwordHash}
        onSuccess={() => setLoadState('verified')}
      />
    )
  }

  const hasCharts = !!(visibleModules?.cashflow || visibleModules?.assets || visibleModules?.assetGrowth || visibleModules?.retirement)

  // verified
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif" }}>
      <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 24px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>{snapshotData?.name ?? ''} 的財務規劃報告</div>
      </header>
      {visibleModules?.basicInfo && hasCharts && (
        <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 0 }}>
          {([['basic', '基本資料'], ['charts', '圖表分析']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: activeTab === key ? 600 : 400,
                color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: activeTab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: 2,
                borderBottomColor: activeTab === key ? 'var(--color-primary)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {snapshotData && visibleModules && (
        <>
          {(activeTab === 'basic' || !hasCharts) && visibleModules.basicInfo && (
            <BasicInfoPage client={snapshotData} />
          )}
          {(activeTab === 'charts' || !visibleModules.basicInfo) && hasCharts && (
            <ChartsPage client={snapshotData} visibleModules={visibleModules} />
          )}
        </>
      )}
    </div>
  )
}
