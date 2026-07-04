import { useState, useCallback, useRef, useEffect } from 'react'
import type { ClientProfile } from '../../types/client'
import { newClient } from '../../types/client'
import { supabase } from '../../lib/supabase'

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

  // v7 → v8: assetSnapshot (single | null) → assetSnapshots (array)
  let assetSnapshots: unknown[] = []
  if (Array.isArray(raw.assetSnapshots)) {
    assetSnapshots = raw.assetSnapshots.map((s: Record<string, unknown>) => ({
      ...s,
      id: s.id ?? String(Date.now()),
    }))
  } else if (raw.assetSnapshot) {
    assetSnapshots = [{ id: String(Date.now()), ...raw.assetSnapshot }]
  }

  // v9 → v10: currentAge → birthYear; add retirementLifespan
  const currentYear = new Date().getFullYear()
  const birthYear = raw.birthYear ?? (currentYear - (raw.currentAge ?? 35))
  const retirementLifespan = raw.retirementLifespan ?? 30

  // v10 → v11: InvestmentItem 補 id；AssetPeriodSnapshot 補 ledgerEntries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v11AssetItems = migratedAssetItems.map((item: any) => ({
    id: item.id ?? crypto.randomUUID(),
    ...item,
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v11Snapshots = (assetSnapshots as any[]).map((s: any) => ({
    ledgerEntries: [],
    ...s,
  }))

  // v11 → v12: 頂層 ledgerEntries（若舊資料不存在，從各快照遷移並帶入 snapshotId）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let topLedgerEntries: any[]
  if (Array.isArray(raw.ledgerEntries)) {
    topLedgerEntries = raw.ledgerEntries
  } else {
    topLedgerEntries = []
    for (const snap of v11Snapshots as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const entry of snap.ledgerEntries ?? []) {
        topLedgerEntries.push({ ...entry, snapshotId: snap.id })
      }
    }
  }

  // v12 → v13: LiabilityItem 補 annualInterestRate（optional，舊資料無此欄位保持 undefined）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawLiabilities: any[] = Array.isArray(raw.liabilityItems)
    ? raw.liabilityItems
    : (raw.liabilities ? [{ label: '負債', amount: raw.liabilities, type: 'long_term' }] : [])

  // v13 → v14: LedgerLine 補 type（舊資料預設 'buy'）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v14LedgerEntries = (topLedgerEntries as any[]).map((entry: any) => ({
    ...entry,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines: (entry.lines ?? []).map((line: any) => ({
      ...line,
      type: line.type ?? 'buy',
    })),
  }))

  // v14 → v15: AssetPurpose 'protection' 改名為 'aggressive'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v15AssetItems = v11AssetItems.map((item: any) => ({
    ...item,
    purpose: item.purpose === 'protection' ? 'aggressive' : item.purpose,
  }))

  return {
    ...raw,
    __schemaVersion: 15,
    assetItems: v15AssetItems,
    liabilityItems: rawLiabilities,
    incomes,
    expenses,
    globalInflationRate: raw.globalInflationRate ?? 0.02,
    targetAllocation: raw.targetAllocation ?? {},
    toleranceBand: raw.toleranceBand ?? 5,
    assetSnapshots: v11Snapshots,
    ledgerEntries: v14LedgerEntries,
    useInvestibleCashFlow: raw.useInvestibleCashFlow ?? false,
    birthYear,
    retirementLifespan,
  }
}

export function useClientStore() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY)
  )
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const userIdRef = useRef<string | null>(null)
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const syncCountRef = useRef(0)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        userIdRef.current = session.user.id
        setLoading(true)
        const { data, error } = await supabase
          .from('ifa_clients')
          .select('*')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
        if (!error && data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setClients((data as any[]).map((row: { data: unknown }) => migrate(row.data)))
        }
        setLoading(false)
      } else {
        userIdRef.current = null
        setClients([])
        setActiveId(null)
        localStorage.removeItem(ACTIVE_KEY)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const activeClient = clients.find(c => c.id === activeId) ?? null

  const scheduleSave = useCallback((profile: ClientProfile) => {
    const uid = userIdRef.current
    if (!uid) return
    const existing = saveTimersRef.current.get(profile.id)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(async () => {
      saveTimersRef.current.delete(profile.id)
      syncCountRef.current += 1
      setSyncing(true)
      await supabase.from('ifa_clients').upsert({
        id: profile.id,
        user_id: uid,
        name: profile.name,
        data: profile,
        updated_at: new Date().toISOString(),
      })
      syncCountRef.current -= 1
      if (syncCountRef.current === 0) setSyncing(false)
    }, 2000)
    saveTimersRef.current.set(profile.id, timer)
  }, [])

  const createClient = useCallback(() => {
    const uid = userIdRef.current
    if (!uid) return null
    const c = newClient()
    setClients(prev => [...prev, c])
    setActiveId(c.id)
    localStorage.setItem(ACTIVE_KEY, c.id)
    supabase.from('ifa_clients').insert({
      id: c.id,
      user_id: uid,
      name: c.name,
      data: c,
    })
    return c
  }, [])

  const updateClient = useCallback((updated: ClientProfile) => {
    const patched = { ...updated, updatedAt: new Date().toISOString() }
    setClients(prev => prev.map(c => c.id === patched.id ? patched : c))
    scheduleSave(patched)
  }, [scheduleSave])

  const deleteClient = useCallback((id: string) => {
    const timer = saveTimersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      saveTimersRef.current.delete(id)
    }
    setClients(prev => prev.filter(c => c.id !== id))
    setActiveId(prev => {
      if (prev === id) {
        localStorage.removeItem(ACTIVE_KEY)
        return null
      }
      return prev
    })
    const uid = userIdRef.current
    if (uid) {
      supabase.from('ifa_clients').delete().eq('id', id).eq('user_id', uid)
    }
  }, [])

  const selectClient = useCallback((id: string) => {
    setActiveId(id)
    localStorage.setItem(ACTIVE_KEY, id)
  }, [])

  return { clients, activeClient, createClient, updateClient, deleteClient, selectClient, loading, syncing }
}
