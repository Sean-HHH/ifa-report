export function fmtNTD(n: number): string {
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n)
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

export function fmtAmount(n: number, currency: string): string {
  if (currency === 'TWD') return fmtNTD(n)
  if (currency === 'USDT') {
    return `USDT ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
  }
  if (currency === 'other') return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(n)
  const isoMap: Record<string, string> = { USD: 'USD', JPY: 'JPY', EUR: 'EUR', GBP: 'GBP', HKD: 'HKD' }
  const iso = isoMap[currency]
  if (!iso) return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: iso, maximumFractionDigits: 0 }).format(n)
}
