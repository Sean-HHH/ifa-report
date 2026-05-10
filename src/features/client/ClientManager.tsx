import type { ClientProfile } from '../../types/client'

interface Props {
  clients: ClientProfile[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

function XIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function ClientManager({ clients, activeId, onSelect, onCreate, onDelete }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {clients.map(c => (
        <div
          key={c.id}
          onClick={() => onSelect(c.id)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
            transition: 'background 0.15s',
            background: c.id === activeId ? 'var(--color-sidebar-active)' : 'transparent',
            border: c.id === activeId ? '1px solid rgba(99,131,235,0.3)' : '1px solid transparent',
          }}
          onMouseEnter={e => {
            if (c.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-sidebar-hover)'
          }}
          onMouseLeave={e => {
            if (c.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 500, fontSize: 13,
              color: c.id === activeId ? 'var(--color-sidebar-text)' : 'var(--color-sidebar-text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{c.name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-sidebar-text-muted)', marginTop: 2 }}>
              {new Date(c.updatedAt).toLocaleDateString('zh-TW')}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(c.id) }}
            aria-label="刪除客戶"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-sidebar-text-muted)', padding: 4, borderRadius: 4,
              display: 'flex', alignItems: 'center', flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#f87171'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-sidebar-text-muted)'}
          >
            <XIcon />
          </button>
        </div>
      ))}
      <button
        onClick={onCreate}
        style={{
          marginTop: 4, padding: '9px 12px',
          borderRadius: 8, border: '1px dashed rgba(148,163,184,0.35)',
          background: 'transparent', color: 'var(--color-sidebar-text-muted)',
          fontSize: 13, cursor: 'pointer', textAlign: 'left',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.borderColor = 'rgba(99,131,235,0.5)'
          btn.style.color = 'var(--color-sidebar-text)'
        }}
        onMouseLeave={e => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.borderColor = 'rgba(148,163,184,0.35)'
          btn.style.color = 'var(--color-sidebar-text-muted)'
        }}
      >
        + 新增客戶
      </button>
    </div>
  )
}
