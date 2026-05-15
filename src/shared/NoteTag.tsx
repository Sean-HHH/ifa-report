import { useState } from 'react'

export function NoteTag({ note }: { note?: string }) {
  const [show, setShow] = useState(false)
  if (!note) return null
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded cursor-help inline-flex items-center gap-0.5"
      >
        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        備注
      </button>
      {show && (
        <div className="absolute left-0 top-6 z-10 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 w-56 shadow-lg whitespace-pre-wrap">
          {note}
        </div>
      )}
    </div>
  )
}
