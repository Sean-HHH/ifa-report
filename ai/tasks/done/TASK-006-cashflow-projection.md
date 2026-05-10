# TASK-006 — 5年現金流 Projection + 通膨率 + 月投入比

## Background
現有收支分析只顯示當下快照。收入成長率欄位（TASK-004）未接入計算，是死欄位。

## Objective
- 加全局通膨率設定（支出成長）
- 建立 5 年現金流 projection 計算 + 折線圖 + 年度表格
- 月投入顯示佔可投資現金流的 %（InputForm + Report）

## Scope
- `src/types/client.ts` — 加 `globalInflationRate`
- `src/hooks/useClientStore.ts` — migration default 0.02
- `src/utils/calculations.ts` — 新增 `calcCashFlowProjection()`
- `src/utils/calculations.test.ts` — 5 個新測試（共 36 個）
- `src/components/InputForm/InputForm.tsx` — 通膨率輸入 + 月投入比 helper
- `src/components/reports/CashFlowReport.tsx` — 健康指標擴為 4 格 + 折線圖 + 表格

## Human Decision
approved

**Commit**
`8b45744` — 2026-05-08
