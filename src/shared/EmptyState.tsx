export function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-slate-200 rounded-xl py-8 text-center text-xs text-slate-400">
      {text}
    </div>
  )
}
