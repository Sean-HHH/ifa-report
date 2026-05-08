# ISSUE_TEMPLATE.md — Agent 任務描述模板

每次交給 agent 的任務，請依此格式填寫。格式越清楚，agent 規劃越準確。

---

## 模板（複製使用）

```
## 任務標題
[一句話描述，動詞開頭。例：新增退休規劃的月儲蓄建議顯示]

## 背景
[為什麼要做這個？什麼情境下需要？]

## 要求
[具體說明要改變什麼，或要新增什麼。越具體越好。]

## 不做什麼（範圍限制）
[明確排除的部分，避免 agent 自行擴大範圍。]

## 受影響的模組（猜測）
[ ] calculations.ts
[ ] types/client.ts
[ ] useClientStore.ts
[ ] InputForm
[ ] CashFlowReport
[ ] AssetGrowthReport
[ ] RetirementReport
[ ] pdfExport.ts
[ ] App.tsx
[ ] 其他：___

## 驗收重點（填 1–3 條）
1. [具體可觀察的結果]
2. [具體可觀察的結果]
3. [可選]

## 參考資料
[截圖、設計稿、相關 issue、外部文件連結]
```

---

## 範例（已填寫）

```
## 任務標題
在退休報表頂部新增「建議月儲蓄金額」KPI 卡片

## 背景
目前退休缺口分析只顯示缺口數字，但 IFA 最常被問的問題是「每個月要存多少」，
需要直接在報表中顯示計算結果，減少 IFA 口頭換算的負擔。

## 要求
在 RetirementReport.tsx 的 StatCard 區塊新增一張卡片，
顯示 calcRetirement 回傳的 requiredMonthlySavings 值，
格式：fmtNTD，顏色：orange。

## 不做什麼（範圍限制）
- 不修改計算邏輯（requiredMonthlySavings 已存在）
- 不動 InputForm
- 不影響 PDF 匯出邏輯（StatCard 已在 .report-page 內）

## 受影響的模組（猜測）
[x] RetirementReport.tsx
[ ] 其他模組不需要動

## 驗收重點
1. StatCard 顯示正確的月儲蓄金額（與手算一致）
2. fmtNTD 格式正確（萬/億）
3. npm run lint + npx tsc --noEmit 均通過

## 參考資料
calcRetirement 回傳值：src/utils/calculations.ts，return 型別中的 requiredMonthlySavings
```

---

## 填寫提示

- **任務標題**：用「動詞 + 對象 + 目的」格式，避免「修改一下」、「調整看看」
- **不做什麼**：這欄最容易被跳過，但對控制 agent 範圍最關鍵
- **受影響模組**：猜錯沒關係，Planner 會確認，但先填可以節省來回
- **驗收重點**：寫可觀察的結果（「顯示正確金額」），不寫技術步驟（「修改 function」）
