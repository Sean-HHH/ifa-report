# TASK-020 — 資產分類帳：LedgerPanel UI

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
建立資產變動追蹤（Ledger）機制，讓每次資產更新有交易記錄支撐，並能與實際資產變化鉤稽。

**Branch 名稱**
`task/TASK-020-ledger-panel-ui`

**背景**
TASK-019 完成型別基礎後，需要一個輸入介面讓 IFA 在建立「期間記錄」時，能輸入說明本期資產變化的交易明細（ledger entries）。此 UI 也需要顯示鉤稽結果（已說明金額 vs. 實際變化）。

**Objective（成功定義）**
新建 `LedgerPanel.tsx`，整合進 `SnapshotPanel.tsx`，讓使用者在建立/查看期間記錄時可輸入交易明細，並即時看到鉤稽狀態。UI 文字「快照」更名為「期間記錄」。

**要求（Scope）**

**1. 新建 `src/features/assets/LedgerPanel.tsx`**

Props：
```ts
{
  snapshot: AssetPeriodSnapshot      // 當前期間記錄
  assetItems: InvestmentItem[]       // 目前持有資產（供下拉選擇）
  onUpdate: (s: AssetPeriodSnapshot) => void
}
```

功能區塊（由上到下）：
- **鉤稽摘要列**（Header bar）：
  - 「期初總資產」：`snapshot.openingAssets`（fmtWan 格式）
  - 「已記錄交易合計」：Σ(所有 LedgerLine.amountDelta)，正為綠色，負為紅色
  - 「未解釋差額」：若 closingAssets 有值，顯示 closingAssets - openingAssets - Σ(amountDelta)；否則顯示 —
- **交易列表**（LedgerEntry[]）：
  - 每筆 LedgerEntry 顯示：日期、描述、± 合計金額、展開/收合
  - 展開後顯示 LedgerLine 明細
  - 每行：選擇資產（`<select>` from assetItems）、amountDelta（number input）、qtyDelta（選填）、price（選填）、note（選填）、刪除按鈕
  - 刪除 LedgerEntry 的按鈕
- **新增交易按鈕**：展開一個空的新 LedgerEntry 表單
  - 輸入 description、date
  - 至少一行 LedgerLine
  - 「新增一行」按鈕
- **空狀態**：「尚未記錄任何交易，點擊下方新增」

**2. 更新 `src/features/assets/SnapshotPanel.tsx`**
- 在每個 snapshot 的展開區塊加入 `LedgerPanel`（取代原本只有 periodLabel 的 SnapField）
- UI 文字：「快照管理」→「期間記錄管理」、「建立快照」→「建立期間記錄」

**3. 更新 `src/App.tsx`**
- header 按鈕文字：「快照」→「期間記錄」

**不做什麼（Non-goals）**
- 不實作「確認並更新資產」邏輯（套用 amountDelta 到 assetItems）→ TASK-021
- 不修改 `AssetReport.tsx`
- 不做 LedgerEntry 的 persist（onUpdate 傳回 snapshot，儲存由 SnapshotPanel 負責）

**作業檔案（實作範圍）**
- `src/features/assets/LedgerPanel.tsx`（新建）
- `src/features/assets/SnapshotPanel.tsx`（整合 LedgerPanel + 文字更名）
- `src/App.tsx`（文字更名）

**Test Expectation（如何測試）**
1. 開啟期間記錄管理（點 header「期間記錄」按鈕）
2. 建立一筆期間記錄 → 展開 → 看到 LedgerPanel
3. 新增交易：description="賣出台積電 100 股"，date=今天
   - LedgerLine 1：選台積電資產，amountDelta=-50000，qtyDelta=-100，price=500
   - LedgerLine 2：選活存資產，amountDelta=+50000
4. 鉤稽摘要列應顯示：已記錄合計 = 0（兩行相抵）
5. 再新增一筆 amountDelta=+5000（股利）→ 合計 = +5000

**驗收重點**
1. LedgerEntry 可新增、刪除；LedgerLine 可新增、刪除
2. 鉤稽合計即時更新（React state）
3. 資產下拉列出所有 `assetItems`（顯示 label + category）
4. UI 文字「快照」已全部改為「期間記錄」

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
純 UI task，不含資產套用邏輯。onUpdate 傳回修改後的 snapshot，SnapshotPanel 負責存回 ClientProfile。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/features/assets/LedgerPanel.tsx` | 新建 |
| `src/features/assets/SnapshotPanel.tsx` | 整合 LedgerPanel、UI 文字更名 |
| `src/App.tsx` | header 按鈕文字更名 |

**平行相容性**
可與以下 TASK 同時執行：TASK-022（作業檔案不重疊）
需等以下 TASK 完成後才能開始：TASK-019（需要 LedgerEntry、InvestmentItem.id 型別）

**新增/刪除依賴**
否

**預期風險**
1. SnapshotPanel 目前展開區塊只有 periodLabel 編輯；整合 LedgerPanel 後高度會增加，需確認浮動 panel 的 maxHeight 不截斷內容
2. 資產下拉選單若 assetItems 為空（新客戶）需有 empty state

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] LedgerPanel 顯示鉤稽摘要（期初總資產、已記錄合計、未解釋差額）
- [ ] 可新增 LedgerEntry（description + date）
- [ ] 可在 LedgerEntry 下新增多行 LedgerLine（select 資產 + amountDelta）
- [ ] 可刪除 LedgerEntry 和 LedgerLine
- [ ] 鉤稽合計 Σ(amountDelta) 即時計算顯示
- [ ] `SnapshotPanel` UI 文字「快照」全部改為「期間記錄」
- [ ] `App.tsx` header 按鈕文字改為「期間記錄」

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] 未實作資產套用邏輯（保留給 TASK-021）
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
