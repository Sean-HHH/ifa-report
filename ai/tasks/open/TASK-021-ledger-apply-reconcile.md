# TASK-021 — 資產分類帳：套用邏輯 + 差額 MajorExpense

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
建立資產變動追蹤（Ledger）機制，讓每次資產更新有交易記錄支撐，並能與實際資產變化鉤稽。

**Branch 名稱**
`task/TASK-021-ledger-apply-reconcile`

**背景**
TASK-020 完成 LedgerPanel 的輸入 UI 後，需要實作「確認並更新資產」按鈕的核心邏輯：將 ledger entries 套用到 assetItems（更新 amount / units），並在有未解釋差額時自動建立 MajorExpense。

**Objective（成功定義）**
點擊「確認並更新資產」後，assetItems 的 amount / units 依 ledger lines 更新；若有差額，`majorExpenses` 自動新增一筆標籤為「待說明差額 YYYY-MM-DD」的記錄；期間記錄標記 closingAssets 並封存。

**要求（Scope）**

**1. `LedgerPanel.tsx` 加入「確認並更新資產」按鈕與邏輯**

按鈕顯示條件：LedgerEntries > 0

點擊後執行以下步驟（順序重要）：
1. 計算 `Σ(all LedgerLine.amountDelta)` = `totalExplained`
2. 計算 `closingAssets = snapshot.openingAssets + totalExplained`（預估）
3. 對每條 `LedgerLine`，找到 `assetItems.find(a => a.id === line.assetItemId)`：
   - `item.amount += line.amountDelta`
   - 若 `line.qtyDelta` 有值且 item 有 `units`：`item.units += line.qtyDelta`
   - 若找不到對應 item：跳過，在 UI 顯示警告（不 block 流程）
4. 計算 `gap = actualClosing - closingAssets`（actualClosing = 套用後新的 totalAssets）
   - `gap !== 0`（閾值：|gap| > 1）：自動在 `client.majorExpenses` 新增：
     ```ts
     { label: `待說明差額 ${today()}`, amount: Math.abs(gap), year: currentYear }
     ```
5. 更新 snapshot：`closingAssets = actualClosing`，`openingAssetItems = snapshot.assetItems`（期初快照）
6. 呼叫 `onCommit(updatedAssetItems, updatedMajorExpenses, updatedSnapshot)` 由上層處理 persistence

**2. `SnapshotPanel.tsx` 處理 `onCommit` callback**
- 接收 `(updatedAssetItems, updatedMajorExpenses, updatedSnapshot)`
- 更新 `client.assetItems`、`client.majorExpenses`、對應的 `assetSnapshots` entry
- 呼叫 `onUpdate(newClient)` 觸發 localStorage 儲存

**不做什麼（Non-goals）**
- 不修改 AssetReport
- 不做 undo/redo
- 不驗證 LedgerLine 的 amountDelta 是否超過持倉現值（只套用，不阻擋）

**作業檔案（實作範圍）**
- `src/features/assets/LedgerPanel.tsx`（加入套用邏輯 + onCommit）
- `src/features/assets/SnapshotPanel.tsx`（處理 onCommit）

**Test Expectation（如何測試）**
1. 建立期間記錄，記錄一筆交易：
   - LedgerLine 1：活存 -50000（amountDelta=-50000）
   - LedgerLine 2：台股 ETF +48000（amountDelta=+48000）
   - 差額 = -2000（手續費）
2. 點擊「確認並更新資產」
3. 確認：活存 amount 減少 50000、台股 ETF amount 增加 48000
4. 確認：「支出」Tab 的重大支出出現「待說明差額 YYYY-MM-DD，金額 2000」
5. 再測：兩行完全抵消（差額 = 0）→ 不產生 MajorExpense

**驗收重點**
1. assetItems amount/units 正確套用 ledger 變化
2. 差額 > 1 → 自動建立 MajorExpense
3. 差額 ≤ 1 → 不建立 MajorExpense
4. assetItemId 找不到時不 crash，有 console warning

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
邏輯 task，在 TASK-020 的 UI 基礎上加「確認」按鈕的執行邏輯，並透過 callback 讓上層 SnapshotPanel 統一處理 persistence。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/features/assets/LedgerPanel.tsx` | 加入套用計算邏輯、`onCommit` callback props |
| `src/features/assets/SnapshotPanel.tsx` | 處理 `onCommit`，更新 client 並呼叫 `onUpdate` |

**平行相容性**
可與以下 TASK 同時執行：TASK-022（作業檔案不重疊）
需等以下 TASK 完成後才能開始：TASK-020（需要 LedgerPanel 元件基礎）

**新增/刪除依賴**
否

**預期風險**
1. `client.assetItems` 的 immutable 更新需用 `map` 不可 mutate（React state）
2. `today()` 函數已存在於 `SnapshotPanel.tsx`（line 17），可複用

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] 套用後 `assetItems[i].amount` 正確增減
- [ ] 套用後 `assetItems[i].units` 正確增減（若 LedgerLine 有 qtyDelta）
- [ ] 差額 > 1：`client.majorExpenses` 自動新增一筆
- [ ] 差額 ≤ 1：不新增 MajorExpense
- [ ] `snapshot.closingAssets` 更新為套用後的實際總資產
- [ ] 找不到 assetItemId：不 crash，UI 顯示警告文字

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] 不 mutate state 直接修改，用 immutable pattern
- [ ] localStorage key 未改動

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
