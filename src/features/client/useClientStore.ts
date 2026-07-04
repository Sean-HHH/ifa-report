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
  const [dirtyClientIds, setDirtyClientIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const userIdRef = useRef<string | null>(null)
  const editVersionsRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const loadClients = async (userId: string) => {
      const { data, error } = await supabase
        .from('ifa_clients')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (userIdRef.current !== userId) return
      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setClients((data as any[]).map((row: { data: unknown }) => migrate(row.data)))
        setDirtyClientIds(new Set())
        setSaveError(null)
      } else if (error) {
        setSaveError(`讀取客戶資料失敗：${error.message}`)
      }
      setLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const isFirstLoad = userIdRef.current !== session.user.id
        userIdRef.current = session.user.id
        if (isFirstLoad) {
          setLoading(true)
          void loadClients(session.user.id)
        }
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

  const saveClient = useCallback(async (profile: ClientProfile) => {
    const uid = userIdRef.current
    if (!uid) {
      setSaveError('尚未登入，無法儲存客戶資料。')
      return false
    }

    setSaving(true)
    setSaveError(null)
    const editVersion = editVersionsRef.current.get(profile.id) ?? 0
    const profileToSave = { ...profile, updatedAt: new Date().toISOString() }
    const { error } = await supabase.from('ifa_clients').upsert({
      id: profile.id,
      user_id: uid,
      name: profileToSave.name,
      data: profileToSave,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    if (error) {
      setSaveError(`儲存失敗：${error.message}`)
      return false
    }

    setClients(prev => prev.map(client =>
      client.id === profile.id && client.updatedAt === profile.updatedAt ? profileToSave : client
    ))
    setDirtyClientIds(prev => {
      if ((editVersionsRef.current.get(profile.id) ?? 0) !== editVersion) return prev
      const next = new Set(prev)
      next.delete(profile.id)
      return next
    })
    setLastSavedAt(new Date())
    return true
  }, [])

  const createClient = useCallback(() => {
    const uid = userIdRef.current
    if (!uid) return null
    const c = newClient()
    setClients(prev => [...prev, c])
    editVersionsRef.current.set(c.id, 0)
    setDirtyClientIds(prev => new Set(prev).add(c.id))
    setSaveError(null)
    setActiveId(c.id)
    localStorage.setItem(ACTIVE_KEY, c.id)
    return c
  }, [])

  const updateClient = useCallback((updated: ClientProfile) => {
    const patched = { ...updated, updatedAt: new Date().toISOString() }
    setClients(prev => prev.map(c => c.id === patched.id ? patched : c))
    editVersionsRef.current.set(patched.id, (editVersionsRef.current.get(patched.id) ?? 0) + 1)
    setDirtyClientIds(prev => new Set(prev).add(patched.id))
    setSaveError(null)
  }, [])

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    editVersionsRef.current.delete(id)
    setDirtyClientIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setActiveId(prev => {
      if (prev === id) {
        localStorage.removeItem(ACTIVE_KEY)
        return null
      }
      return prev
    })
    const uid = userIdRef.current
    if (uid) {
      supabase.from('ifa_clients').delete()
        .eq('id', id)
        .eq('user_id', uid)
        .then(({ error }) => { if (error) console.error('delete failed:', error) })
    }
  }, [])

  const selectClient = useCallback((id: string) => {
    setActiveId(id)
    localStorage.setItem(ACTIVE_KEY, id)
  }, [])

  return {
    clients,
    activeClient,
    createClient,
    updateClient,
    deleteClient,
    selectClient,
    saveClient,
    loading,
    saving,
    saveError,
    lastSavedAt,
    isDirty: activeClient ? dirtyClientIds.has(activeClient.id) : false,
    hasUnsavedChanges: dirtyClientIds.size > 0,
  }
}
