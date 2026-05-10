import { useState } from 'react'
import type { ClientProfile, VisibleModules } from '../../types/client'
import { supabase } from '../../lib/supabase'

interface Props {
  client: ClientProfile
  onClose: () => void
}

const MODULE_LABELS: { key: keyof VisibleModules; label: string }[] = [
  { key: 'basicInfo',    label: '基本資料' },
  { key: 'assetGrowth',  label: '資產成長圖' },
  { key: 'retirement',   label: '退休規劃' },
  { key: 'cashflow',     label: '現金流分析' },
]

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function ShareModal({ client, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [modules, setModules] = useState<VisibleModules>({
    basicInfo: true, assetGrowth: true, retirement: true, cashflow: true,
  })
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleModule = (key: keyof VisibleModules) =>
    setModules(prev => ({ ...prev, [key]: !prev[key] }))

  const handleShare = async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const password_hash = await sha256(password)
      const { data, error: dbError } = await supabase
        .from('shared_snapshots')
        .insert({
          snapshot_data: client,
          visible_modules: modules,
          password_hash,
        })
        .select('id')
        .single()

      if (dbError || !data) throw dbError ?? new Error('insert failed')

      const base = `${window.location.origin}${window.location.pathname}`
      setLink(`${base}#/c/${data.id}`)
    } catch {
      setError('分享失敗，請確認 Supabase 設定是否正確。')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 20 }}>
          分享客戶報告
        </div>

        {!link ? (
          <>
            {/* 密碼 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                設定連結密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px', fontSize: 14, outline: 'none',
                  color: 'var(--color-text-primary)', background: 'var(--color-bg)',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                建議使用隨機密碼，勿使用個人重要密碼。
              </div>
            </div>

            {/* 可見模塊 */}
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

            {error && (
              <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>
            )}

            {/* 操作按鈕 */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '8px 18px', fontSize: 13, border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}>
                取消
              </button>
              <button
                onClick={handleShare}
                disabled={!password || loading}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  background: !password || loading ? 'var(--color-primary-muted)' : 'var(--color-primary)',
                  color: '#fff', cursor: !password || loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '產生中…' : '產生連結'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              連結已產生，分享給客戶：
            </div>
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              fontSize: 12, color: 'var(--color-text-primary)',
              wordBreak: 'break-all', marginBottom: 16,
            }}>
              {link}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '8px 18px', fontSize: 13, border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}>
                關閉
              </button>
              <button onClick={handleCopy} style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 600,
                border: 'none', borderRadius: 'var(--radius-sm)',
                background: copied ? '#10b981' : 'var(--color-primary)',
                color: '#fff', cursor: 'pointer', transition: 'background 0.2s',
              }}>
                {copied ? '已複製 ✓' : '複製連結'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
