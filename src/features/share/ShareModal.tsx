import { useState } from 'react'
import type { ClientProfile, VisibleModules, AssetPeriodSnapshot } from '../../types/client'
import { supabase } from '../../lib/supabase'

interface Props {
  snapshot: AssetPeriodSnapshot
  client: ClientProfile
  onClose: () => void
  onUpdate: (updated: AssetPeriodSnapshot) => void
}

const MODULE_LABELS: { key: keyof VisibleModules; label: string }[] = [
  { key: 'basicInfo',   label: '基本資料' },
  { key: 'cashflow',    label: '收支分析' },
  { key: 'assets',      label: '資產組合' },
  { key: 'assetGrowth', label: '資產成長' },
  { key: 'retirement',  label: '退休規劃' },
]

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function buildSnapshotData(client: ClientProfile, snapshot: AssetPeriodSnapshot): ClientProfile {
  return {
    ...client,
    assetItems: snapshot.assetItems ?? client.assetItems,
    assetSnapshots: [snapshot],
    ledgerEntries: client.ledgerEntries.filter(e => e.snapshotId === snapshot.id),
  }
}

function shareUrl(id: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/c/${id}`
}

export function ShareModal({ snapshot, client, onClose, onUpdate }: Props) {
  const isShared = !!snapshot.shareId

  const [view, setView] = useState<'manage' | 'update'>(isShared ? 'manage' : 'manage')
  const [password, setPassword] = useState('')
  const [modules, setModules] = useState<VisibleModules>({
    basicInfo: true, cashflow: true, assets: true, assetGrowth: true, retirement: true,
  })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revokeConfirm, setRevokeConfirm] = useState(false)

  const toggleModule = (key: keyof VisibleModules) =>
    setModules(prev => ({ ...prev, [key]: !prev[key] }))

  const handleCreate = async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const password_hash = await sha256(password)
      const { data, error: dbError } = await supabase
        .from('shared_snapshots')
        .insert({
          snapshot_data: buildSnapshotData(client, snapshot),
          visible_modules: modules,
          password_hash,
        })
        .select('id')
        .single()
      if (dbError || !data) throw dbError ?? new Error('insert failed')
      onUpdate({ ...snapshot, shareId: data.id })
    } catch (err) {
      setError(`分享失敗：${err instanceof Error ? err.message : JSON.stringify(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!snapshot.shareId) return
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        snapshot_data: buildSnapshotData(client, snapshot),
        visible_modules: modules,
      }
      if (password) payload.password_hash = await sha256(password)
      const { error: dbError } = await supabase
        .from('shared_snapshots')
        .update(payload)
        .eq('id', snapshot.shareId)
      if (dbError) throw dbError
      setView('manage')
      setPassword('')
    } catch (err) {
      setError(`更新失敗：${err instanceof Error ? err.message : JSON.stringify(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!snapshot.shareId) return
    setLoading(true)
    setError(null)
    try {
      const { error: dbError } = await supabase
        .from('shared_snapshots')
        .delete()
        .eq('id', snapshot.shareId)
      if (dbError) throw dbError
      onUpdate({ ...snapshot, shareId: undefined })
    } catch (err) {
      setError(`撤銷失敗：${err instanceof Error ? err.message : JSON.stringify(err)}`)
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!snapshot.shareId) return
    navigator.clipboard.writeText(shareUrl(snapshot.shareId))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const title = isShared
    ? `分享管理 · ${snapshot.periodLabel}`
    : `建立分享連結 · ${snapshot.periodLabel}`

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 20 }}>
          {title}
        </div>

        {/* ── 已分享：管理態 ── */}
        {isShared && view === 'manage' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              分享連結
            </div>
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              fontSize: 12, color: 'var(--color-text-primary)',
              wordBreak: 'break-all', marginBottom: 16,
            }}>
              {shareUrl(snapshot.shareId!)}
            </div>

            {error && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

            {revokeConfirm ? (
              <div style={{ background: '#fff5f5', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 10 }}>
                  撤銷後連結立即失效，客戶將無法再查看。確定撤銷？
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleRevoke}
                    disabled={loading}
                    style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  >
                    {loading ? '撤銷中…' : '確認撤銷'}
                  </button>
                  <button
                    onClick={() => setRevokeConfirm(false)}
                    style={{ padding: '6px 14px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <button onClick={handleCopy} style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  background: copied ? '#10b981' : 'var(--color-primary)',
                  color: '#fff', cursor: 'pointer', transition: 'background 0.2s',
                }}>
                  {copied ? '已複製 ✓' : '複製連結'}
                </button>
                <button onClick={() => { setView('update'); setPassword('') }} style={{
                  padding: '8px 16px', fontSize: 13,
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer',
                }}>
                  更新設定
                </button>
                <button onClick={() => setRevokeConfirm(true)} style={{
                  padding: '8px 16px', fontSize: 13,
                  border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)',
                  background: '#fff5f5', color: '#ef4444', cursor: 'pointer',
                }}>
                  撤銷連結
                </button>
                <button onClick={onClose} style={{
                  marginLeft: 'auto', padding: '8px 16px', fontSize: 13,
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)', color: 'var(--color-text-muted)', cursor: 'pointer',
                }}>
                  關閉
                </button>
              </div>
            )}
          </>
        )}

        {/* ── 建立 / 更新設定 ── */}
        {(!isShared || view === 'update') && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                {isShared ? '新密碼（留空則不更改）' : '設定連結密碼'}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isShared ? '留空表示不更改密碼' : '請輸入密碼'}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px', fontSize: 14, outline: 'none',
                  color: 'var(--color-text-primary)', background: 'var(--color-bg)',
                }}
              />
              {!isShared && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  建議使用隨機密碼，勿使用個人重要密碼。
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                客戶可查看的模塊
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MODULE_LABELS.map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--color-text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={modules[key]}
                      onChange={() => toggleModule(key)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {error && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => isShared ? setView('manage') : onClose()}
                style={{
                  padding: '8px 18px', fontSize: 13, border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)', cursor: 'pointer',
                }}
              >
                {isShared ? '返回' : '取消'}
              </button>
              <button
                onClick={isShared ? handleUpdate : handleCreate}
                disabled={(!isShared && !password) || loading}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  background: ((!isShared && !password) || loading) ? 'var(--color-primary-muted)' : 'var(--color-primary)',
                  color: '#fff', cursor: ((!isShared && !password) || loading) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '處理中…' : isShared ? '確認更新' : '產生連結'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
