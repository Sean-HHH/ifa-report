import { useState, useCallback } from 'react'
import type { ClientProfile } from '../types/client'
import { newClient } from '../types/client'

const STORAGE_KEY = 'ifa_clients'
const ACTIVE_KEY = 'ifa_active_client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(raw: any): ClientProfile {
  // v1 → v2: investments 數字 → investmentItems 陣列
  // v2 → v3: investmentItems + cash/property → assetItems
  let assetItems = raw.assetItems
  if (!Array.isArray(assetItems)) {
    assetItems = []
    if (raw.cash) assetItems.push({ label: '現金存款', amount: raw.cash, category: 'cash' })
    if (raw.property) assetItems.push({ label: '不動產', amount: raw.property, category: 'real_estate' })
    if (Array.isArray(raw.investmentItems)) {
      assetItems = [...assetItems, ...raw.investmentItems]
    } else if (raw.investments) {
      assetItems.push({ label: '投資組合', amount: raw.investments, category: 'stock' })
    }
  }

  // v3 → v4: income 加 type；expense.type → expense.category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incomes = (raw.incomes ?? []).map((i: any) => ({
    ...i,
    type: i.type ?? 'fixed',
    // v4 → v5: 加 frequency（預設 monthly，amount 語意不變）
    frequency: i.frequency ?? 'monthly',
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expenses = (raw.expenses ?? []).map((e: any) => {
    const base = e.category !== undefined ? e : {
      label: e.label,
      amount: e.amount,
      note: e.note,
      category: e.type === 'fixed' ? 'survival' : 'quality',
    }
    return { ...base, frequency: base.frequency ?? 'monthly' }
  })

  // v5 → v6: assetItems 加 currency/institution/purpose；加 targetAllocation/toleranceBand/assetSnapshot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migratedAssetItems = assetItems.map((item: any) => {
    const base = {
      currency: 'TWD',
      institution: '',
      purpose: 'growth',
      ...item,
    }
    // v6 → v7: amount was stored as TWD equivalent regardless of currency label.
    // Reset currency to 'TWD' so existing amounts remain numerically correct.
    if (!raw.__schemaVersion || raw.__schemaVersion < 7) {
      base.currency = 'TWD'
    }
    return base
  })

  return {
    ...raw,
    __schemaVersion: 7,
    assetItems: migratedAssetItems,
    liabilityItems: Array.isArray(raw.liabilityItems)
      ? raw.liabilityItems
      : (raw.liabilities ? [{ label: '負債', amount: raw.liabilities, type: 'long_term' }] : []),
    incomes,
    expenses,
    globalInflationRate: raw.globalInflationRate ?? 0.02,
    targetAllocation: raw.targetAllocation ?? {},
    toleranceBand: raw.toleranceBand ?? 5,
    assetSnapshot: raw.assetSnapshot ?? null,
  }
}

function load(): ClientProfile[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.map(migrate) : []
  } catch {
    return []
  }
}

function save(clients: ClientProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
}

export function useClientStore() {
  const [clients, setClients] = useState<ClientProfile[]>(load)
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY)
  )

  const activeClient = clients.find(c => c.id === activeId) ?? null

  const createClient = useCallback(() => {
    const c = newClient()
    setClients(prev => {
      const next = [...prev, c]
      save(next)
      return next
    })
    setActiveId(c.id)
    localStorage.setItem(ACTIVE_KEY, c.id)
    return c
  }, [])

  const updateClient = useCallback((updated: ClientProfile) => {
    const patched = { ...updated, updatedAt: new Date().toISOString() }
    setClients(prev => {
      const next = prev.map(c => c.id === patched.id ? patched : c)
      save(next)
      return next
    })
  }, [])

  const deleteClient = useCallback((id: string) => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id)
      save(next)
      return next
    })
    if (activeId === id) {
      setActiveId(null)
      localStorage.removeItem(ACTIVE_KEY)
    }
  }, [activeId])

  const selectClient = useCallback((id: string) => {
    setActiveId(id)
    localStorage.setItem(ACTIVE_KEY, id)
  }, [])

  return { clients, activeClient, createClient, updateClient, deleteClient, selectClient }
}
