# TASK-006 — 現金流時間錯配分析

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
IFA 客戶年收入不低，但某幾個月現金吃緊甚至需要信用卡周轉。工具原本把所有收支視為月均值，無法偵測這個問題。

**Objective**
IFA 可以在收支分析報表直接看到客戶的 12 個月現金流時序，識別低谷月份與是否需要周轉。

**要求（Scope）**
- IncomeItem / ExpenseItem 加 frequency（月/季/年）+ payMonths
- calcCashFlow 非月度項目換算月均（不影響現有 KPI）
- 新增 calcMonthlyTimeline：12個月時序 + crunchMonths + needsBridging
- InputForm：每列加頻率選擇器 + 條件顯示月份選單
- CashFlowReport：新增「現金流時序分析」區塊（KPI摘要 + 混合柱線圖）

**不做什麼（Non-goals）**
- 不動其他三個報表
- 不改計算邏輯以外的資產/退休模型

---

## [SECTION 4] Generator 執行記錄

**已修改的檔案**
- `src/types/client.ts`：新增 PayFrequency type、PAY_FREQUENCY_LABELS；IncomeItem/ExpenseItem 加 frequency? / payMonths?
- `src/utils/calculations.ts`：toMonthlyEquiv helper；calcCashFlow 換算月均；新增 MonthlyTimelineResult + calcMonthlyTimeline
- `src/hooks/useClientStore.ts`：v4→v5 migration（income/expense 加 frequency: 'monthly'）
- `src/utils/calculations.test.ts`：新增 calcMonthlyTimeline 5 個測試（40 tests 全通過）
- `src/components/InputForm/InputForm.tsx`：收入/支出列加頻率下拉 + 條件月份選單
- `src/components/reports/CashFlowReport.tsx`：import Chart；import calcMonthlyTimeline；時序分析區塊（KPI badges + Bar/Line 混合圖）

**設計決策**
- amount 語意改為「每次發生金額」，calcCashFlow 透過 toMonthlyEquiv 換算，現有 KPI 數值不受影響
- frequency=undefined 一律視為 monthly（向後相容）
- quarterly 預設 payMonths=[3,6,9,12]，annual 預設 payMonths=[12]；可在 InputForm 調整
- needsBridging 為純計算值（任何月份 net<0 即為 true），不需客戶自填

---

## [SECTION 5] Evaluator Review

**邏輯審查**

| AC 項目 | 結果 |
|---------|------|
| InputForm 頻率選擇可用 | 通過 |
| 12個月圖表正確反映設定 | 通過（calcMonthlyTimeline 邏輯驗證 ✓） |
| crunchMonths 判斷正確 | 通過（測試覆蓋） |
| needsBridging 警示 | 通過 |
| calcCashFlow KPI 不變 | 通過（全月度項目月均=per-occurrence，既有測試 31 tests 全通過） |
| v4→v5 migration | 通過 |
| ai/ 目錄未被修改 | 通過 |
| 未引入新 npm 套件 | 通過（Chart 從現有 react-chartjs-2 import） |

---

## [SECTION 6] Harness 測試結果

```
[lint]  PASS  (0 errors)
[tsc]   PASS  (0 errors)
[tests] PASS  (40 tests, 5 new calcMonthlyTimeline tests)
[build] PASS  (vite 8.0.10, 199ms)
✓ All checks passed
```

---

## [SECTION 7] Human Decision

**決定**
[approved / rejected]

**Commit**
`[commit hash]`
