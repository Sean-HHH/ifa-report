# TASK-022 — 資產分類帳：AssetReport Layer 2 歷史顯示

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
建立資產變動追蹤（Ledger）機制，讓每次資產更新有交易記錄支撐，並能與實際資產變化鉤稽。

**Branch 名稱**
`task/TASK-022-ledger-history-report`

**背景**
TASK-019 完成型別定義後，`AssetPeriodSnapshot` 已有 `ledgerEntries[]`。`AssetReport.tsx` 的 Layer 2「資產變化」區塊目前只顯示類別分布變化（A% → B%），尚未展示交易明細。這個 task 在 Layer 2 加入 ledger 歷史顯示，讓 IFA 能在報表中看到本期的完整交易記錄。

**Objective（成功定義）**
AssetReport Layer 2 在已選期間有 ledgerEntries 時，顯示交易清單與鉤稽摘要（期初 → 交易合計 → 期末 → 差額）。

**要求（Scope）**

在 `AssetReport.tsx` Layer 2（資產變化）區塊，現有類別比對表格**下方**新增：

**交易明細區塊**（條件顯示：`toSnap?.ledgerEntries?.length > 0`）

1. **區塊標題**：「本期交易明細」

2. **鉤稽摘要列**（一行 flex）：
   - 期初：`fmtWan(toSnap.openingAssets)`
   - 交易合計：`Σ(ledgerEntries[].lines[].amountDelta)`（正/負 color coding）
   - 期末：`fmtWan(toSnap.closingAssets ?? bTotal)`
   - 差額（若有）：`closingAssets - openingAssets - Σ(amountDelta)`，差額非 0 顯示橘色警示

3. **交易列表**（LedgerEntry[]，由上到下）：
   - 每筆 entry：日期（`entry.date`）、描述（`entry.description`）、± 合計（Σ lines.amountDelta）
   - 展開後顯示各 LedgerLine：資產名稱（從 `assetItems` 查 id）、amountDelta、qtyDelta（若有）、price（若有）、note（若有）
   - 若 `assetItemId` 找不到對應項目：顯示「已刪除資產」

4. **空狀態**（`toSnap.ledgerEntries.length === 0`）：
   - 「本期尚無交易記錄」（text-slate-400）

**不做什麼（Non-goals）**
- 不在報表中提供編輯功能（純唯讀）
- 不修改 Layer 1 或 Layer 3
- 不修改 SnapshotPanel 或 LedgerPanel
- Layer 2 的「fromSnap → toSnap」類別比對表格保留，ledger 區塊只是**追加**在下方

**作業檔案（實作範圍）**
- `src/features/assets/AssetReport.tsx`

**Test Expectation（如何測試）**
1. 完成 TASK-021，建立一筆有交易記錄的期間記錄
2. 切到 AssetReport → Layer 2「資產變化」
3. 確認類別比對表格正常顯示（不破壞現有功能）
4. 確認下方出現「本期交易明細」區塊
5. 鉤稽摘要：期初、合計、期末數字正確
6. 展開每筆 entry → 明細行顯示正確

**驗收重點**
1. Layer 2 現有類別比對功能不受影響
2. 有 ledgerEntries 時正確顯示交易清單
3. 無 ledgerEntries 時顯示空狀態訊息
4. assetItemId 找不到時顯示「已刪除資產」而非 crash

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
唯讀報表 task，只在 `AssetReport.tsx` Layer 2 追加展示 ledger 歷史，不觸碰 SnapshotPanel 或 LedgerPanel。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/features/assets/AssetReport.tsx` | Layer 2 下方新增 ledger 歷史顯示區塊 |

**平行相容性**
可與以下 TASK 同時執行：TASK-020、TASK-021（作業檔案不重疊）
需等以下 TASK 完成後才能開始：TASK-019（需要 LedgerEntry 型別）

**新增/刪除依賴**
否

**預期風險**
1. `toSnap.ledgerEntries` 可能為 undefined（舊快照）；需 optional chaining 防護
2. 顯示 LedgerLine 的資產名稱需從 `assetItems` 查詢；若快照建立後該資產被刪除，需 fallback 文字

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] Layer 2 現有類別比對表格正常運作（不 regression）
- [ ] `ledgerEntries.length > 0`：顯示「本期交易明細」區塊
- [ ] `ledgerEntries.length === 0` 或 undefined：顯示空狀態文字
- [ ] 鉤稽摘要：期初、交易合計、期末數字正確
- [ ] 差額非 0：橘色警示顯示
- [ ] 每筆 LedgerEntry 顯示日期、描述、± 合計
- [ ] LedgerLine 顯示資產名稱（或「已刪除資產」）、amountDelta

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] 未修改 Layer 1、Layer 3
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
