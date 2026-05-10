# TASK-003 — 收支分類重設計 + 三層現金流

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
原本的收入/支出只有簡單的 fixed/variable 二分法，無法反映 IFA 真實的財務規劃需求。需要更細緻的分類架構，並導入「三層現金流」概念。

**Objective（成功定義）**
IFA 可以在收支分析報表上直接看到三層現金流（固定收入→真實淨額→可投資現金流），並對支出做 6 類分類管理。

**要求（Scope）**
- `IncomeItem`：新增 type（fixed / variable / one_time）
- `ExpenseItem`：type 改為 category（6 類：survival / responsibility / quality / growth / hidden / one_time）
- `calcCashFlow`：新增 `trueNetCashFlow`（固定收入 - survival - responsibility）與 `investibleCashFlow`（true - quality - growth）、`incomeByType`、`expenseByCategory` 分類彙總
- `useClientStore`：v3→v4 silent migration（fixed→survival, variable→quality）
- `InputForm`：合併支出區塊，每列加 type/category dropdown
- `CashFlowReport`：KPI 卡片顯示三層現金流；瀑布圖呈現逐層扣除
- 測試：更新 fixtures，補 trueNetCashFlow / investibleCashFlow 測試

**不做什麼（Non-goals）**
- 不動資產組合、資產成長、退休規劃報表
- 不動 PDF 匯出邏輯

---

## [SECTION 4] Generator 執行記錄（Step 4）

**已修改的檔案**
- `src/types/client.ts`：IncomeItem 新增 type；ExpenseItem type 改 category（6 類）
- `src/utils/calculations.ts`：新增 trueNetCashFlow、investibleCashFlow、incomeByType、expenseByCategory
- `src/utils/calculations.test.ts`：更新 fixtures；補新 KPI 測試（共 31 tests）
- `src/hooks/useClientStore.ts`：v3→v4 silent migration
- `src/components/InputForm/InputForm.tsx`：合併支出區塊，dropdown on each row
- `src/components/reports/CashFlowReport.tsx`：三層現金流 KPI cards + 瀑布圖重設計

---

## [SECTION 7] Human Decision（Step 8）

**決定**
approved

**Commit**
`38ce292`
