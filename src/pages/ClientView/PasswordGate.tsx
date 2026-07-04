import { useState } from 'react'

interface PasswordGateProps {
  onVerify: (password: string) => Promise<boolean>
}

export function PasswordGate({ onVerify }: PasswordGateProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input) return
    setLoading(true)
    setError(false)
    try {
      const verified = await onVerify(input)
      setError(!verified)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif",
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 360,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--color-primary-muted)', marginBottom: 14,
          }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            輸入存取密碼
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            此報告受密碼保護
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="請輸入密碼"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 15,
              border: `1px solid ${error ? 'var(--color-danger, #dc2626)' : 'var(--color-border)'}`,
              borderRadius: 8,
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 8,
            }}
          />
          {error && (
            <div style={{ fontSize: 13, color: 'var(--color-danger, #dc2626)', marginBottom: 8 }}>
              密碼錯誤、連結無效或已過期
            </div>
          )}
          <button
            type="submit"
            disabled={!input || loading}
            style={{
              width: '100%',
              padding: '10px',
              background: (!input || loading) ? 'var(--color-primary-muted)' : 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: (!input || loading) ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              marginTop: 4,
            }}
          >
            {loading ? '驗證中…' : '進入報告'}
          </button>
        </form>
      </div>
    </div>
  )
}
