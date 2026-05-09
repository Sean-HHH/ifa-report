import { useState } from 'react'

export function NoteField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value)
  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs text-slate-400 hover:text-blue-400 transition-colors mt-0.5 flex items-center gap-1">
          <span>+</span> 備注
        </button>
      ) : (
        <div className="flex items-start gap-1 mt-1">
          <span className="text-slate-300 text-xs mt-2">📝</span>
          <textarea
            rows={2}
            placeholder="備注（如：年繳 60,000，此為月均攤）"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 focus:border-blue-300 outline-none resize-none"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
          <button onClick={() => { onChange(''); setOpen(false) }}
            className="text-slate-300 hover:text-red-400 text-xs mt-1">✕</button>
        </div>
      )}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )
}

export function NumField({ label, value, onChange, suffix, disabled }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <label className="text-sm text-slate-500 w-36 shrink-0">{label}</label>
      <input type="number" className={`border rounded-lg px-3 py-2 text-sm w-36 outline-none transition-colors ${disabled ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-blue-300'}`}
        value={value} onChange={e => !disabled && onChange(Number(e.target.value))} disabled={disabled} />
      {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
    </div>
  )
}

export function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="text-sm text-blue-400 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors">
      + {label}
    </button>
  )
}
