# TASK-018 — 客戶端：互動圖表頁

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
客戶端模式功能：客戶可以直接在網頁上查看互動圖表；IFA 可設定客戶可看到哪些模塊。

**Branch 名稱**
`task/TASK-018-client-charts`

**背景**
客戶端 view 的核心價值在於互動圖表。需複用 IFA 端已有的 Report 元件（AssetGrowthReport、RetirementReport、CashFlowReport），以唯讀方式嵌入客戶端頁面，並依 `visible_modules` 設定決定顯示哪些。

**Objective（成功定義）**
客戶在 Client View 可看到 IFA 開放的互動圖表，圖表可 hover 查看數值，但不能編輯資料。

**要求（Scope）**
1. 新增 `src/pages/ClientView/ChartsPage.tsx`，接受 `ClientProfile` 與 `VisibleModules` 作為 props：
   - 依 `visible_modules.assetGrowth` 顯示 `AssetGrowthReport`
   - 依 `visible_modules.retirement` 顯示 `RetirementReport`
   - 依 `visible_modules.cashflow` 顯示 `CashFlowReport`
2. 傳入 Report 元件的 `client` prop 來自快照資料（`ClientProfile`），不可掛任何 `patch` callback
3. `src/pages/ClientView/index.tsx` 整合 ChartsPage，組成完整的 tab 導覽（基本資料 / 圖表）

**不做什麼（Non-goals）**
- 不修改任何現有 Report 元件（零改動原則）
- 不實作 FX 匯率查詢（使用預設 TWD，或傳入空 rates）
- 不實作 PDF 匯出

**作業檔案（實作範圍）**
- `src/pages/ClientView/ChartsPage.tsx`（新增）
- `src/pages/ClientView/index.tsx`（整合 ChartsPage + tab 導覽）

**Test Expectation（如何測試）**
1. 以正確密碼進入 Client View
2. 切換到「圖表」tab → 看到 IFA 開放的圖表
3. Hover 圖表上的資料點 → tooltip 顯示數值
4. 切換回「基本資料」tab → 可正常切換
5. 邊界案例：IFA 只開放一個模塊時，只顯示該模塊

**驗收重點**
1. 圖表根據 visible_modules 正確顯示 / 隱藏
2. 圖表 hover 互動正常（Chart.js tooltip）
3. tab 導覽在「基本資料」與「圖表」之間切換正常
4. 所有圖表使用快照資料，不依賴 localStorage

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
這個 task 的核心是「複用不修改」：直接引用現有 Report 元件，只組裝容器與控制可見性。ChartsPage 是 Client View 的最後一塊拼圖。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/pages/ClientView/ChartsPage.tsx` | 新增（圖表容器，依 visible_modules 渲染） |
| `src/pages/ClientView/index.tsx` | 整合 ChartsPage + tab 導覽 |

**平行相容性**
可與以下 TASK 同時執行：TASK-017（作業檔案無交集）
需等以下 TASK 完成後才能開始：TASK-016

**新增/刪除依賴**
否

**預期風險**
1. 現有 Report 元件（AssetGrowthReport 等）props 可能包含 IFA 專用的 `patch` 或 `onEdit` 等 handler，需確認這些 props 是 optional，否則要用空 no-op function 填入
2. FX rates 若為 required prop，需傳入 `{ TWD: 1 }` 作為預設值

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] `visible_modules.assetGrowth === true` → AssetGrowthReport 顯示
- [ ] `visible_modules.retirement === true` → RetirementReport 顯示
- [ ] `visible_modules.cashflow === true` → CashFlowReport 顯示
- [ ] 圖表 hover tooltip 正常
- [ ] tab 切換「基本資料」↔「圖表」正常
- [ ] 所有模塊均關閉時，顯示「IFA 尚未開放任何圖表」提示

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] 未修改任何現有 Report 元件
- [ ] localStorage key 未改動

---

## [SECTION 4] Generator 執行記錄（Step 4）

<!-- Generator 填寫 -->

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
