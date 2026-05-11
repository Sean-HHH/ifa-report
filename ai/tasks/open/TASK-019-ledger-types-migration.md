# TASK-019 — 資產分類帳：型別定義 + Schema Migration

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
建立資產變動追蹤（Ledger）機制，讓每次資產更新有交易記錄支撐，並能與實際資產變化鉤稽。

**Branch 名稱**
`task/TASK-019-ledger-types-migration`

**背景**
目前 `InvestmentItem` 無 `id` 欄位，無法讓 ledger line 指向特定持倉。`AssetPeriodSnapshot` 只記錄時間點數字，不儲存交易明細。這個 task 建立所有後續 task 需要的型別基礎，並完成 schema migration。

**Objective（成功定義）**
`types/client.ts` 新增 `LedgerLine`、`LedgerEntry` 型別；`InvestmentItem` 加 `id`；`AssetPeriodSnapshot` 加 ledger 相關欄位；schema migration v11 自動補齊舊資料。

**要求（Scope）**
1. `InvestmentItem` 加 `id: string`（UUID）
2. 新增 `LedgerLine` interface：
   - `id: string`
   - `assetItemId: string`（對應 InvestmentItem.id）
   - `amountDelta: number`（TWD 金額變化；負=減少）
   - `qtyDelta?: number`（數量變化；負=賣出）
   - `price?: number`（每單位成交價，選填）
   - `note?: string`
3. 新增 `LedgerEntry` interface：
   - `id: string`
   - `description: string`
   - `date: string`（ISO date）
   - `lines: LedgerLine[]`
4. `AssetPeriodSnapshot` 新增選用欄位（backward-compatible）：
   - `ledgerEntries?: LedgerEntry[]`
   - `closingAssets?: number`
   - `openingAssetItems?: InvestmentItem[]`
5. `useClientStore.ts` migration v10 → v11：
   - 為每個 `assetItems[i]` 補 `id`（若無）：`crypto.randomUUID()`
   - 為每個 `assetSnapshots[i]` 補 `ledgerEntries: []`（若無）
   - `__schemaVersion` 更新為 11

**不做什麼（Non-goals）**
- 不建立任何 UI
- 不修改 `AssetReport.tsx` 或 `SnapshotPanel.tsx`
- 不改動 `AssetPeriodSnapshot` 現有欄位（只加，不改）

**作業檔案（實作範圍）**
- `src/types/client.ts`
- `src/hooks/useClientStore.ts`

**Test Expectation（如何測試）**
1. `npx tsc --noEmit` → 0 errors
2. `npm run test` → 通過（若有 migration 相關測試）
3. 開啟 DevTools console → localStorage `ifa_clients` → 每個 client 的 `assetItems[i].id` 應有值
4. 每個 `assetSnapshots[i].ledgerEntries` 應為空陣列 `[]`
5. `__schemaVersion` 應為 11

**驗收重點**
1. `InvestmentItem.id` 在 migration 後自動補齊，現有資料不遺失
2. `LedgerLine`、`LedgerEntry` 型別可正確 import 使用
3. `AssetPeriodSnapshot.ledgerEntries` 預設為 `[]`，不影響現有快照比對邏輯

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
純型別 + migration task，不碰 UI，目的是讓後續 task 有可靠的型別基礎。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/types/client.ts` | 加 `id` 到 `InvestmentItem`；加 `LedgerLine`、`LedgerEntry`；擴充 `AssetPeriodSnapshot` |
| `src/hooks/useClientStore.ts` | migration v10 → v11：補 id、補空 ledgerEntries |

**平行相容性**
可與以下 TASK 同時執行：無（此為所有 ledger task 的前置）
需等以下 TASK 完成後才能開始：無

**新增/刪除依賴**
否

**預期風險**
1. `AssetTab.tsx` 建立新 `InvestmentItem` 時未帶 `id`，需確認 `add()` 函數有補 `crypto.randomUUID()`
2. `AssetPeriodSnapshot.assetItems` 已存在（舊語意），新增 `openingAssetItems` 不可 breaking

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] `InvestmentItem` 型別包含 `id: string`
- [ ] `LedgerLine`、`LedgerEntry` 可從 `types/client.ts` import
- [ ] `AssetPeriodSnapshot` 包含 `ledgerEntries?: LedgerEntry[]`、`closingAssets?: number`、`openingAssetItems?: InvestmentItem[]`
- [ ] Migration v11：現有 `assetItems[i]` 若無 `id` 自動補 UUID
- [ ] Migration v11：現有 `assetSnapshots[i]` 若無 `ledgerEntries` 自動補 `[]`
- [ ] `AssetTab.tsx` 新增資產時帶入 `id: crypto.randomUUID()`
- [ ] `newClient()` 的預設 `assetItems` 包含 `id`

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] localStorage key 未改動（仍為 `ifa_clients`）
- [ ] `AssetPeriodSnapshot` 現有欄位未異動

---

## [SECTION 4] Generator 執行記錄（Step 4）

**已修改的檔案**
- （待填）

**設計決策**
（待填）

---

## [SECTION 5] Evaluator Review（Step 5）

**邏輯審查**
| AC 項目 | 結果 |
|---------|------|
| ... | 待審 |

**結論**
待審

---

## [SECTION 6] Harness 測試結果（Step 7）

```
[等待執行]
```

---

## [SECTION 7] Human Decision（Step 8）

**決定**
pending

**備註**

**Commit**
`—`
