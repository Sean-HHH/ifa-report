import { useState, useEffect, useCallback } from 'react'
import { fetchRates, FALLBACK_RATES, getCachedTimestamp } from './exchangeRate'
import type { FxRates } from './exchangeRate'

const RC_KEY = 'ifa_report_currency'
const MR_KEY = 'ifa_manual_rates'

function loadReportCurrency(): string {
  return localStorage.getItem(RC_KEY) ?? 'TWD'
}

function loadManualRates(): Partial<FxRates> {
  try {
    return JSON.parse(localStorage.getItem(MR_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function useAppSettings() {
  const [reportCurrency, setReportCurrencyState] = useState<string>(loadReportCurrency)
  const [manualRates, setManualRatesState] = useState<Partial<FxRates>>(loadManualRates)
  const [apiRates, setApiRates] = useState<FxRates>(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(getCachedTimestamp)

  useEffect(() => {
    fetchRates().then(rates => {
      setApiRates(rates)
      setLastUpdated(getCachedTimestamp())
      setLoading(false)
    })
  }, [])

  const effectiveRates: FxRates = {
    ...apiRates,
    ...Object.fromEntries(
      Object.entries(manualRates).filter(([, v]) => v !== undefined) as [string, number][]
    ),
  }

  const setReportCurrency = useCallback((currency: string) => {
    setReportCurrencyState(currency)
    localStorage.setItem(RC_KEY, currency)
  }, [])

  const setManualRate = useCallback((currency: string, value: number | null) => {
    setManualRatesState(prev => {
      const next = { ...prev }
      if (value === null) {
        delete next[currency]
      } else {
        next[currency] = value
      }
      localStorage.setItem(MR_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearManualRates = useCallback(() => {
    setManualRatesState({})
    localStorage.removeItem(MR_KEY)
  }, [])

  return {
    reportCurrency,
    setReportCurrency,
    effectiveRates,
    apiRates,
    manualRates,
    setManualRate,
    clearManualRates,
    loading,
    lastUpdated,
  }
}
