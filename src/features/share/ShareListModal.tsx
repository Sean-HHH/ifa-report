import type { ClientProfile, AssetPeriodSnapshot } from '../../types/client'

interface Props {
  client: ClientProfile
  onClose: () => void
  onManage: (snapshot: AssetPeriodSnapshot) => void
}

export function ShareListModal({ client, onClose, onManage }: Props) {
  const snapshots = client.assetSnapshots ?? []

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: 480, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          分享管理
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          每個期間快照可建立一個分享連結給客戶查看
        </div>

        {snapshots.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '32px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              尚未建立期間快照
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              請先在「期間記錄」建立快照，再進行分享
            </div>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16 }}>
            {snapshots.map(s => {
              const isShared = !!s.shareId
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 4px',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                      {s.periodLabel !== s.snapshotDate ? s.periodLabel : s.snapshotDate}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {s.snapshotDate}
                      {s.closingAssets != null && (
                        <span style={{ marginLeft: 8 }}>
                          期末 {(s.closingAssets / 10000).toFixed(0)} 萬
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 99,
                      background: isShared ? '#dcfce7' : '#f1f5f9',
                      color: isShared ? '#16a34a' : '#94a3b8',
                    }}>
                      {isShared ? '已分享' : '未分享'}
                    </span>
                    <button
                      onClick={() => { onManage(s); onClose() }}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: '5px 12px',
                        border: `1px solid ${isShared ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: isShared ? 'rgba(37,99,235,0.06)' : 'var(--color-surface)',
                        color: isShared ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {isShared ? '管理連結' : '建立連結'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', fontSize: 13,
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer',
          }}>
            關閉
          </button>
        </div>
      </div>
    </div>
  )
}
