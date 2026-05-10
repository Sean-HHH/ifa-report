# TASK-004 — 收入穩定性指標 + 成長率欄位

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
TASK-003 完成三層現金流後，IFA 還需要能快速判斷客戶財務健康程度的指標，以及對收入成長率的預測能力。

**Objective（成功定義）**
IFA 在收支分析報表上能直接看到財務健康指標（收入穩定比、固定支出比、隱性支出比），並可對每筆收入設定年化成長率。

**要求（Scope）**
- `IncomeItem`：新增 optional `growthRate` 欄位（年化成長 %）
- `calcCashFlow`：新增 `incomeStabilityRatio`、`fixedExpenseRatio`、`hiddenExpenseRatio`
- `InputForm`：每列收入顯示 optional growthRate 輸入框
- `CashFlowReport`：新增「財務健康指標」區塊（穩定比帶色彩警示、固定支出比、隱性支出比）；收入明細顯示 growth rate badge

**不做什麼（Non-goals）**
- 不動支出分類邏輯（TASK-003 剛完成）
- 不動其他三個報表

---

## [SECTION 4] Generator 執行記錄（Step 4）

**已修改的檔案**
- `src/types/client.ts`：IncomeItem 新增 optional `growthRate: number`
- `src/utils/calculations.ts`：新增 incomeStabilityRatio、fixedExpenseRatio、hiddenExpenseRatio
- `src/components/InputForm/InputForm.tsx`：每列收入加 growthRate input
- `src/components/reports/CashFlowReport.tsx`：財務健康指標 section + growth rate badge

---

## [SECTION 7] Human Decision（Step 8）

**決定**
approved

**Commit**
`c6152c0`
