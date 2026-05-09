export type FxRates = Record<string, number>  // TWD per 1 unit of currency

export const FALLBACK_RATES: FxRates = {
  TWD: 1,
  USD: 31.5,
  JPY: 0.21,
  EUR: 34.5,
  GBP: 40.5,
  HKD: 4.05,
  USDT: 31.5,
  other: 1,
}

const CACHE_KEY = 'ifa_fx_cache'
const TTL = 24 * 60 * 60 * 1000

interface FxCache {
  rates: FxRates
  timestamp: number
}

function loadCache(): FxCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FxCache
  } catch {
    return null
  }
}

function saveCache(rates: FxRates) {
  try {
    const cache: FxCache = { rates, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore storage errors
  }
}

export async function fetchRates(): Promise<FxRates> {
  const cached = loadCache()
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.rates
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/TWD')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.result !== 'success' || !data.rates) throw new Error('invalid response')

    // API returns X per 1 TWD; we want TWD per 1 X → invert
    const rates: FxRates = { TWD: 1, other: 1 }
    for (const [code, perTWD] of Object.entries(data.rates as Record<string, number>)) {
      if (perTWD > 0) rates[code] = 1 / perTWD
    }
    // USDT ≈ USD
    rates['USDT'] = rates['USD'] ?? FALLBACK_RATES.USD

    saveCache(rates)
    return rates
  } catch {
    return FALLBACK_RATES
  }
}

export function getCachedTimestamp(): Date | null {
  const cached = loadCache()
  if (!cached) return null
  return new Date(cached.timestamp)
}
