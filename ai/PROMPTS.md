# PROMPTS.md — 可重複使用的 Prompt 模板

---

## 聯動提醒 Prompt（每次啟動 agent 前貼入）

```
請先讀取 ai/ 目錄下所有 harness 檔案：
- ai/AGENTS.md
- ai/PROJECT.md
- ai/PRODUCT.md
- ai/WORKFLOW.md
- ai/EVALS.md
- ai/DECISIONS.md
- ai/PROMPTS.md

讀完後宣告「已讀取以下 harness 檔案：[列出]」，再開始處理任務。
若任何 harness 內容與你對專案的理解有衝突，以 harness 為準，並告知 Sean。
```

---

## Role Prompts

### Planner
```
你是 IFA-Report 的 Planner。
執行前必須讀取 ai/ 目錄下所有 harness 檔案。
任務：將需求拆解為具體步驟，列出需修改的檔案，識別潛在風險。
禁止：寫任何程式碼。
輸出格式：理解確認 → 需修改檔案清單（含位置） → 新增依賴（是/否） → 風險清單（至多 3 項）。
```

### Generator
```
你是 IFA-Report 的 Generator。
Planner 計畫已由 Sean 確認，請開始執行。
規則：每個檔案必須先 Read 再 Edit。不引入新依賴（除非 Planner 明確指定）。
每次改動範圍限於單一關注點，完成後告知 Evaluator 可以開始驗收。
```

### Evaluator
```
你是 IFA-Report 的 Evaluator。Generator 已完成，請開始驗收。
行動：
1. 執行 npm run lint
2. 執行 npx tsc --noEmit
3. 對照 ai/EVALS.md 選擇對應的功能驗收清單執行
輸出：通過清單 + 失敗清單（含具體錯誤訊息）。
若有失敗，請 Generator 修正後重跑。
```

---

## Task Prompts

### 新增報表欄位
```
任務：在 [報表名稱（CashFlow / AssetGrowth / Retirement）] 中新增顯示 [欄位名]。
資料來源：[ClientProfile 中的資料路徑]。
Planner 請先確認：
- types/client.ts 是否需要更新？
- calculations.ts 是否需要新函數或修改現有函數？
- 是否需要 useClientStore migration？
```

### 修改計算邏輯
```
任務：修改 [函數名] 的計算邏輯。
現有邏輯：[描述]
目標邏輯：[描述]
Evaluator 請在完成後執行 EVALS.md 中對應的「計算邏輯」驗收清單。
```

### 新增客戶資料欄位
```
任務：在 ClientProfile 中新增欄位 [欄位名]，TypeScript 型別 [型別]，預設值 [值]。
必須同步更新：
1. src/types/client.ts（型別定義）
2. src/hooks/useClientStore.ts（migration 補預設值）
3. src/components/InputForm/InputForm.tsx（輸入欄位）
4. 對應報表元件（顯示欄位）
```

### 修改 PDF 匯出
```
任務：調整 PDF 匯出邏輯：[描述]。
注意事項：
- .report-page 截圖範圍必須完整
- html2canvas 回傳 px，jsPDF 用 mm，注意換算
- 中文字體必須測試（CJK 顯示）
Evaluator 請執行 EVALS.md 中「PDF 匯出」完整驗收清單。
```

### Debug Chart.js 問題
```
問題描述：[描述圖表顯示異常的現象]
受影響元件：[CashFlowReport / AssetGrowthReport / RetirementReport]
請先確認：
- chartjs-plugin-datalabels 版本是否對應 Chart.js 4.x API
- tooltip callback 是否使用正確的 fmtNTD / fmtPct 函數
- container 是否有明確高度（maintainAspectRatio: false 時必須）
```

---

## 快速 One-liner（常用指令）

```bash
# 開發
npm run dev

# 驗收三步驟
npm run lint && npx tsc --noEmit && echo "✓ lint + tsc passed"

# 看 localStorage 資料（browser console）
JSON.parse(localStorage.getItem('ifa_clients') || '[]')

# 清除所有 localStorage（測試 migration 用）
localStorage.clear()
```
