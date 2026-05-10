# TASK-011 — 投資偏好與資產成長輸入優化

<!-- 狀態由資料夾決定：open / in-progress / review / done -->
<!-- 每個 pipeline 步驟把輸出追加到對應的 section -->

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
InputForm 的「投資偏好」tab 目前有三個資訊斷層：
1. 「定期投入金額」是手動輸入的孤立欄位，IFA 必須先切到現金流 tab 看可投資現金流，再切回來手填，容易填錯或忘記連動。
2. 選擇風險承受度後沒有任何即時回饋，IFA 不知道「穩健型」對應的預期年化報酬率是多少，只能靠記憶或猜測。
3. 目標配置（各資產類別 %）分散輸入，沒有即時合計，IFA 容易超過 100% 或填完才發現還剩配額。

**Objective（成功定義）**
IFA 在「投資偏好」tab 填寫時，可即時看到定期投入與現金流的連動、風險承受度對應的預期報酬率、以及目標配置的即時合計，不需要切換 tab 或口頭換算。

**要求（Scope）**

1. **定期投入連動現金流**
   - 在「每月定期投入」欄位旁加一個 toggle：「自定金額」vs「使用可投資現金流」
   - 切換到「使用可投資現金流」時，輸入框 disable，自動帶入 `calcCashFlow(client).investibleCashFlow`（即每月可投資現金流）
   - 若現金流為負，帶入 0 並顯示灰色提示文字「可投資現金流為負，建議先優化收支」
   - client 資料結構新增欄位 `useInvestibleCashFlow: boolean`（預設 false），同步存 localStorage

2. **風險承受度選項顯示預設報酬率**
   - 三個風險等級（保守型 / 穩健型 / 積極型）的選項卡片下方，顯示對應的 `RISK_RETURN` 三情境年化報酬率
   - 格式：「保守 X% ／ 基準 X% ／ 積極 X%」
   - 目前已選取的卡片高亮顯示；若 `customReturnRate` 非 null，在卡片下方額外標注「已使用自定報酬率 X%」

3. **目標配置即時占比提示**
   - 目標配置輸入區（各資產類別的 % 欄位）下方加一行：
     「已配置 XX%，剩餘 XX%」
   - 超過 100% 時文字變紅，顯示「已超配 XX%，請調整」
   - 所有類別皆為空（或 0）時顯示「尚未設定目標配置」（灰色）

**不做什麼（Non-goals）**
- AssetGrowth report 內的 inline 編輯 / 直接在圖表上改數字
- 自動重新分配剩餘 %（只顯示提示，不幫用戶調整）
- 改動現金流報表的計算邏輯

**受影響的模組（猜測）**
- [ ] calculations.ts（`calcCashFlow` 已存在，直接呼叫）
- [x] types/client.ts（新增 `useInvestibleCashFlow` 欄位）
- [x] useClientStore.ts（v7→v8 migration：補 `useInvestibleCashFlow: false`）
- [x] InputForm（主要改動位置）
- [ ] CashFlowReport / AssetGrowthReport / RetirementReport（不需改動）
- [ ] pdfExport.ts（不需改動）
- [ ] App.tsx（不需改動）

**Test Expectation（如何測試）**
手動測試步驟：
1. `npm run dev` → 建立測試客戶，月收入 80,000、月支出 47,000（可投資現金流約 33,000）
2. 切到「投資偏好」tab → 找到「每月定期投入」欄位
3. 點選「使用可投資現金流」toggle → 輸入框應 disable，數字自動帶入約 33,000
4. 切回「現金流分析」tab 修改支出，讓可投資現金流變負 → 回到投資偏好 tab，應顯示 0 加提示文字
5. 選擇風險承受度為「穩健型」→ 卡片下方應出現「保守 4% ／ 基準 7% ／ 積極 10%」
6. 設定 customReturnRate = 0.08 → 卡片下方額外出現「已使用自定報酬率 8%」
7. 在目標配置填入 stock 40%、fund 30%、cash 20% → 下方顯示「已配置 90%，剩餘 10%」
8. 再填入 bond 20% → 合計 110%，文字變紅顯示「已超配 10%，請調整」

**驗收重點**
1. toggle 狀態存 localStorage，reload 後保留
2. 風險卡片報酬率數字與 `RISK_RETURN` 常數一致（不 hard-code 數字）
3. 目標配置合計即時更新，不需按 Enter 或切換焦點

---

## [SECTION 2] Planner 輸出（Step 2）

<!-- Planner 填寫 -->

**理解確認**
[用自己的話重述任務]

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| src/... | ... |

**新增/刪除依賴**
否 / 是（說明：）

**預期風險**
1.
2.

---

## [SECTION 3] Acceptance Criteria（Step 2）

<!-- Planner 依 AC_TEMPLATE.md 填寫 -->

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors

### 功能驗收
- [ ]
- [ ]

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] localStorage key 未改動

---

## [SECTION 4] Generator 執行記錄（Step 4）

<!-- Generator 填寫 -->

**已修改的檔案**
- src/[路徑]：[改了什麼]

**設計決策**
[說明非顯而易見的選擇]

---

## [SECTION 5] Evaluator Review（Step 5）

<!-- Evaluator 填寫 -->

**邏輯審查**
| AC 項目 | 結果 |
|---------|------|
| ... | 通過 / 失敗 |

**結論**
通過 / 失敗（失敗請列問題清單）

---

## [SECTION 6] Harness 測試結果（Step 7）

<!-- task-submit.sh 自動追加 -->

```
[等待執行]
```

---

## [SECTION 7] Human Decision（Step 8）

<!-- Sean 填寫 -->

**決定**
approved / rejected

**備註**
[若 rejected，說明原因與下一步]

**Commit**
`[commit hash]`
