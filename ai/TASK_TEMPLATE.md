# TASK-[ID] — [任務標題]

<!-- 狀態由資料夾決定：open / in-progress / review / done -->
<!-- 每個 pipeline 步驟把輸出追加到對應的 section -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
[Sean 的原始需求描述，一句話摘要。同一個需求拆出多個 task 時，各 task 的來源需求相同。]

**Branch 名稱**
`task/TASK-[ID]-[slug]`

**背景**
[為什麼要做這個？什麼情境需要？]

**Objective（成功定義）**
[完成這個 task 後，系統哪個部分的什麼行為改變了？一句話。]

**要求（Scope）**
[具體說明要改什麼或新增什麼]

**不做什麼（Non-goals）**
[明確排除的部分，避免 agent 擴大範圍]

**作業檔案（實作範圍）**
[列出這個 task 會動到的所有檔案，worktree 隔離依此判斷]
- src/[路徑]

**Test Expectation（如何測試）**
手動測試步驟：
1. `npm run dev` → 建立測試客戶（輸入：[具體資料]）
2. 操作步驟：[做什麼]
3. 預期看到：[具體輸出 / 畫面呈現]
4. 邊界案例：[特殊輸入的預期行為]

**驗收重點**
1. [具體可觀察的結果]
2. [具體可觀察的結果]

---

## [SECTION 2] Planner 輸出（Step 2）

<!-- Planner 填寫 -->

**理解確認**
[用自己的話重述這個 task 的實作邊界]

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| src/... | ... |

**平行相容性**
可與以下 TASK 同時執行（作業檔案不重疊）：TASK-xxx, TASK-xxx
需等以下 TASK 完成後才能開始：TASK-xxx（原因：[依賴說明]）

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
