import { useState } from 'react'

function NoteIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function NoteField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value)
  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors mt-0.5 flex items-center gap-1">
          <span>+</span> 備注
        </button>
      ) : (
        <div className="flex items-start gap-1 mt-1">
          <span className="text-slate-300 flex items-center mt-2">
            <NoteIcon />
          </span>
          <textarea
            rows={2}
            placeholder="備注（如：年繳 60,000，此為月均攤）"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 focus:border-blue-400 outline-none resize-none"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
          <button onClick={() => { onChange(''); setOpen(false) }}
            aria-label="移除備注"
            className="text-slate-300 hover:text-red-400 transition-colors mt-1 flex items-center"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            <XIcon />
          </button>
        </div>
      )}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )
}

export function NumInput({ value, onFocus, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> & { value?: number }) {
  return (
    <input
      type="number"
      value={value || ''}
      onFocus={e => { e.target.select(); onFocus?.(e) }}
      {...rest}
    />
  )
}

export function NumField({ label, value, onChange, suffix, disabled }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <label className="text-sm text-slate-500 w-36 shrink-0">{label}</label>
      <input type="number" className={`border rounded-lg px-3 py-2 text-sm w-36 outline-none transition-colors ${disabled ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-blue-400'}`}
        value={value || ''} onFocus={e => e.target.select()} onChange={e => !disabled && onChange(Number(e.target.value))} disabled={disabled} />
      {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
    </div>
  )
}

export function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="text-sm text-blue-700 hover:text-blue-900 flex items-center gap-1 mt-1 transition-colors font-medium">
      + {label}
    </button>
  )
}
