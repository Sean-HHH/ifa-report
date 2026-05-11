# TASK-023 — 期間記錄：Inline 新增資產 + 金額自動計算

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
LedgerPanel 新增交易時，使用者可能買進現有持股以外的資產；且填入數量與單價後，金額欄位應自動計算，不需手動輸入。

**Branch 名稱**
`task/TASK-023-ledger-inline-new-asset-and-auto-amount`

**背景**
目前 LedgerPanel 的 LedgerLine 資產選單只列出現有 `assetItems`，無法處理「買進新標的」的場景。此外，`amountDelta` 目前是純手動輸入，當使用者同時填入 `qtyDelta`（數量）與 `price`（單價）時，應自動推算金額，避免手動計算錯誤。

**Objective（成功定義）**
1. 資產選單新增「＋ 建立新資產」選項，使用者可 inline 輸入名稱與類別，新資產在 commit 時一併寫入 assetItems
2. 同一筆 LedgerLine 填入 qtyDelta 與 price 後，amountDelta 自動計算為 `qtyDelta × price`，改為唯讀顯示

**要求（Scope）**

**1. Inline 新增資產**

資產 `<select>` 最後加一個選項：
```html
<option value="__new__">＋ 建立新資產</option>
```

選到 `__new__` 後，在該行下方展開 mini-form：
- `label`（text input，必填，placeholder「資產名稱」）
- `category`（select，列出所有 `InvestmentCategory`）
- 確認後產生 UUID，存入 LedgerPanel local state `pendingNewAssets: InvestmentItem[]`（amount = 0）
- 新資產加入後，select 顯示該資產名稱（id 為新 UUID），同一 panel session 內其他 line 的 select 也可見

`applyLedger()` 執行時：
- 先將 `pendingNewAssets` 合併進 `assetItems`（append，不影響現有順序）
- 再執行 delta 套用（現有邏輯不變）
- `onCommit` 的 `updatedAssetItems` 已包含新資產，上層無需改動

取消整筆 entry 或關閉 panel：`pendingNewAssets` 丟棄（local state 不 persist）

**2. amountDelta 自動計算**

適用範圍：existing entry 展開編輯 + draft 新增表單，兩處都要。

邏輯：
- 同一行 `qtyDelta` 和 `price` 都有值（非空、非 0）→ `amountDelta = qtyDelta × price`，以唯讀文字顯示，不再是 input
- 其中一個清空或為 0 → amountDelta 恢復為可編輯 input
- 使用者在 amountDelta input 輸入值後清空 qtyDelta 或 price → amountDelta 保留使用者輸入的值

實作方式：
- `amountDelta` 欄位改為 computed：`const computedAmount = (qtyDelta && price) ? qtyDelta * price : null`
- 若 `computedAmount !== null`：顯示 `<span>` 帶計算結果，不可編輯（背景色 #f0f9ff 或類似提示）
- 若 `computedAmount === null`：顯示原有 number input

**不做什麼（Non-goals）**
- 不修改 `SnapshotPanel.tsx`（onCommit signature 不變）
- 不修改 `types/client.ts`（不加新型別）
- 不提供「全域新增」按鈕（只限 LedgerPanel inline）
- 新資產不帶 unitPrice/units（只有 label、category、amount=0）

**作業檔案（實作範圍）**
- `src/features/assets/LedgerPanel.tsx`

**Test Expectation（如何測試）**
1. 開啟期間記錄 → 新增交易
2. 資產 select 選「＋ 建立新資產」→ 輸入「美股 ETF」/ 類別「基金」→ 確認
3. 確認新資產出現在 select（已選中），其他 line 的 select 也能看到「美股 ETF」
4. 輸入 qtyDelta = 10，price = 5000 → amountDelta 自動顯示 50000（唯讀）
5. 清空 price → amountDelta 恢復為 input
6. 點「確認並更新資產」→ 確認 assetItems 多出「美股 ETF」（amount = 50000）
7. 取消 entry 後重新開 panel → 「美股 ETF」消失（pendingNewAssets 未 persist）

**驗收重點**
1. 新資產 inline 建立後在同一 session 內的 select 可見
2. commit 後新資產正確寫入 assetItems（amount 為套用後結果）
3. qtyDelta × price 自動計算正確，兩者缺一則恢復手動輸入
4. 不影響現有 entry 的編輯與刪除功能

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
兩個獨立小功能，但都在 LedgerPanel.tsx 同一檔案，合為一個 task 更合理（不值得分 worktree）。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/features/assets/LedgerPanel.tsx` | pendingNewAssets state、select __new__ 選項、inline mini-form、amountDelta computed 邏輯 |

**平行相容性**
無其他 open task，可直接執行。

**新增/刪除依賴**
否

**預期風險**
1. Draft form 和 existing entry edit 兩處都需要相同的 computed amount 邏輯，注意不要重複寫
2. `pendingNewAssets` 在 LedgerPanel unmount 時自動丟棄（React local state 特性），符合需求，無需額外處理

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] 資產 select 有「＋ 建立新資產」選項
- [ ] 選後顯示 inline mini-form（label + category），確認後新資產出現在 select
- [ ] 同一 LedgerPanel session 內所有 line select 都能看到 pendingNewAssets
- [ ] commit 後 updatedAssetItems 包含新資產（amount 為套用後結果）
- [ ] qtyDelta 和 price 都有值 → amountDelta 唯讀顯示計算結果
- [ ] 其中一個清空 → amountDelta 恢復 input
- [ ] 兩處（draft form + existing entry edit）都適用 computed amount

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] 未修改 SnapshotPanel.tsx 或 types/client.ts
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
