# TASK-009 — 多幣別支援：外幣資產換算與閱讀幣別切換

<!-- 狀態由資料夾決定：open / in-progress / review / done -->
<!-- 每個 pipeline 步驟把輸出追加到對應的 section -->

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
IFA 客戶常持有外幣資產（USD 美股、JPY 日本不動產、USDT 穩定幣等）。現有系統的 `currency` 欄位只是裝飾標籤，計算時把所有幣別金額直接加總（USD 10,000 + TWD 300,000 = 310,000，數字無意義）。IFA 在報告中無法正確呈現客戶的真實資產規模，也無法在與外籍客戶或海外業務場景中切換閱讀幣別。

**Objective（成功定義）**
IFA 可以用外幣計價輸入資產（如「USD 10,000 美股」），報表自動依即時匯率換算成台幣（或任意指定的閱讀幣別），並在 header 一鍵切換所有報表的顯示幣別。

**要求（Scope）**
1. 新增 `src/services/exchangeRate.ts`：從 `open.er-api.com` 抓取匯率，快取 24 小時在 localStorage，失敗時 fallback 到預設值
2. 新增 `src/hooks/useAppSettings.ts`：管理全局閱讀幣別（`reportCurrency`）與手動匯率覆蓋（`manualRates`）
3. 新增 `src/components/FxPanel.tsx`：header 旁的匯率 popover，可手動覆蓋各幣別匯率
4. `calculations.ts` 新增：`convertCurrency()`、`totalAssetsConverted()`、`netWorthConverted()`、`fmtAmount()`
5. `App.tsx` header 右側加閱讀幣別下拉 + 「匯率」按鈕
6. `InputForm.tsx` 資產 amount 欄位加幣別提示與 TWD 等值小字
7. 各報表（Asset / CashFlow / AssetGrowth / Retirement）接受 `rates + reportCurrency` props，display 層換算
8. `useClientStore.ts` v6→v7 migration：assetItems.currency 全部重設為 'TWD'（舊資料 amount 均為 TWD 等值，保持數字正確性）

**不做什麼（Non-goals）**
- 不支援 income/expense 項目的幣別化（假設台灣客戶，收支全為 TWD）
- 不做即時匯率（每日更新已足夠）
- 不做多幣別間的複雜稅務或換匯成本計算
- 不連動 AssetGrowth 的月定投金額（TASK-007 deferred）

**受影響的模組（猜測）**
- [x] calculations.ts
- [ ] types/client.ts（不需改，AssetCurrency 已有）
- [x] useClientStore.ts（migration v6→v7）
- [x] InputForm
- [x] CashFlowReport / AssetGrowthReport / RetirementReport / AssetReport
- [ ] pdfExport.ts（不改）
- [x] App.tsx
- [x] 其他：src/services/exchangeRate.ts（新增）、src/hooks/useAppSettings.ts（新增）、src/components/FxPanel.tsx（新增）

**Test Expectation（如何測試）**
1. `npm run dev`
2. Header 右上角選閱讀幣別 USD → 所有報表 KPI 數字換算成 USD
3. InputForm 資產項目幣別選 USD，填入 10000 → 下方顯示「≈ NT$ 315,000 TWD」
4. 點「匯率」按鈕 → FxPanel 出現，顯示各幣別對 TWD 匯率
5. 在 FxPanel 手動覆蓋 USD = 32.0 → 資產報表總計即時更新
6. 重整頁面 → 手動覆蓋值保留，API 快取仍存在（24h 內）

**驗收重點**
1. 閱讀幣別切換後，所有 KPI 數字正確換算（不是手動填入，是自動計算）
2. InputForm 輸入外幣資產時有 TWD 等值提示
3. tsc / lint / test / build 全過

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
