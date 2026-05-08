interface Props {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
}

export function StatCard({ label, value, sub, color = 'blue' }: Props) {
  return (
    <div className={`rounded-xl p-4 border ${colorMap[color]}`}>
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  )
}
