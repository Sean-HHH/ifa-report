# TASK-008 — 資產組合標的明細輸入（股票／基金／債券／加密貨幣）

<!-- 狀態由資料夾決定：open / in-progress / review / done -->
<!-- 每個 pipeline 步驟把輸出追加到對應的 section -->

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
InputForm 內「目標配置」區塊的用法與目前設計方向不符，暫時不需要此功能。

**Objective（成功定義）**
移除 InputForm 中「目標配置」整個 Section，UI 不再顯示這 10 個輸入框。

**要求（Scope）**
- 移除 `InputForm.tsx` 第 405–440 行的 `<Section title="目標配置">...</Section>` 整個區塊
- 僅移除 UI 渲染，不刪除 types/store/calculations 中的相關欄位（保留資料結構，方便日後恢復）

**不做什麼（Non-goals）**
- 不動 `targetAllocation`、`toleranceBand` 的 type 定義
- 不動 `useClientStore` 的預設值或 patch 邏輯
- 不動 `calculations.ts` 中任何計算
- 不動 `AssetReport.tsx` 對 targetAllocation 的使用
- 不動目標金額、儲蓄目標等其他目標相關欄位

**受影響的模組**
- [x] InputForm/InputForm.tsx（主要修改點）

**Test Expectation（如何測試）**
1. `npm run dev` → 切換到「資產配置」tab
2. 預期看到：「目標配置」區塊消失，不顯示現金存款／不動產等 9 個百分比輸入框及容許偏離
3. 其他 tab（人生目標、收支概況等）功能正常

**驗收重點**
1. InputForm 資產配置 tab 不再顯示「目標配置」Section
2. `npm run lint` 與 `npx tsc --noEmit` 0 errors

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
