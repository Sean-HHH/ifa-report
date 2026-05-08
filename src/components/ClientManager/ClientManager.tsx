import type { ClientProfile } from '../../types/client'

interface Props {
  clients: ClientProfile[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export function ClientManager({ clients, activeId, onSelect, onCreate, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {clients.map(c => (
        <div
          key={c.id}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
            c.id === activeId
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
          }`}
          onClick={() => onSelect(c.id)}
        >
          <div>
            <div className="font-medium text-sm">{c.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {new Date(c.updatedAt).toLocaleDateString('zh-TW')}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(c.id) }}
            className="text-slate-300 hover:text-red-400 transition-colors text-sm px-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={onCreate}
        className="mt-2 p-3 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-blue-300 hover:text-blue-400 transition-all"
      >
        + 新增客戶
      </button>
    </div>
  )
}
