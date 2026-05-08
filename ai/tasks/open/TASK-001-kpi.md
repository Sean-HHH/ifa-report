# TASK-001 — 新增退休報表月儲蓄 KPI 卡片

<!-- 狀態由資料夾決定：open / in-progress / review / done -->
<!-- 每個 pipeline 步驟把輸出追加到對應的 section -->

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
[為什麼要做這個？什麼情境需要？]

**要求**
[具體說明要改什麼或新增什麼]

**不做什麼**
[明確排除的部分，避免 agent 擴大範圍]

**受影響的模組（猜測）**
- [ ] calculations.ts
- [ ] types/client.ts
- [ ] useClientStore.ts
- [ ] InputForm
- [ ] CashFlowReport / AssetGrowthReport / RetirementReport
- [ ] pdfExport.ts
- [ ] App.tsx
- [ ] 其他：___

**驗收重點**
1. [具體可觀察的結果]
2. [具體可觀察的結果]

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
