export function fmtNTD(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 億`
    if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  }
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n)
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

export function fmtAmount(n: number, currency: string, compact = false): string {
  if (currency === 'TWD') return fmtNTD(n, compact)
  if (currency === 'USDT') {
    if (compact && Math.abs(n) >= 1000) return `USDT ${(n / 1000).toFixed(1)}K`
    return `USDT ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
  }
  if (currency === 'other') return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(n)
  const isoMap: Record<string, string> = { USD: 'USD', JPY: 'JPY', EUR: 'EUR', GBP: 'GBP', HKD: 'HKD' }
  const iso = isoMap[currency]
  if (!iso) return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
  if (compact) {
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${iso} ${(n / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${iso} ${(n / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: iso, maximumFractionDigits: 0 }).format(n)
}
