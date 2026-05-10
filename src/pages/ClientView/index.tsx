import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { ClientProfile, VisibleModules } from '../../types/client'
import { PasswordGate } from './PasswordGate'

type LoadState = 'loading' | 'not_found' | 'pending_password' | 'verified'

export function ClientViewPage() {
  const { id } = useParams<{ id: string }>()
  const [loadState, setLoadState] = useState<LoadState>(() => (id ? 'loading' : 'not_found'))
  const [passwordHash, setPasswordHash] = useState('')
  const [snapshotData, setSnapshotData] = useState<ClientProfile | null>(null)
  const [visibleModules, setVisibleModules] = useState<VisibleModules | null>(null)

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

  // verified — placeholder until TASK-017/018
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif" }}>
      <div style={{ textAlign: 'center', color: 'var(--color-text-primary)', fontSize: 15 }}>
        已驗證，快照載入中…
        {snapshotData && visibleModules && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            客戶：{snapshotData.name}
          </div>
        )}
      </div>
    </div>
  )
}
