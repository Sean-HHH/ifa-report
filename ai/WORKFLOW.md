# WORKFLOW.md — Agentic Pipeline（8 步驟）

## 流程圖

```
[你] 填寫 ISSUE_TEMPLATE.md
         ↓
[Planner] 讀 harness → 拆解計畫 + 填 AC_TEMPLATE.md
         ↓
[你] 確認計畫（plan approval）
         ↓
[Generator] Read → Edit（單一關注點）
         ↓
[Evaluator] 邏輯審查 + 對照 AC_TEMPLATE.md
         ↓ 有問題
[Generator] 修正（fix loop，最多 3 輪）
         ↓ 無問題
[Harness] 執行 ai/run-tests.sh（機器驗證）
         ↓ 失敗 → 回到 Generator 修正
         ↓ 通過
[你] Final approval → commit
```

---

## Step 1：你寫 Issue

**行動：** 複製 `ai/ISSUE_TEMPLATE.md`，填寫任務描述。
**完成條件：** Issue 有明確的「任務標題」、「要求」、「不做什麼」、「驗收重點」。
**移交給：** Planner（把填好的 issue 交給 Planner）

---

## Step 2：Planner 拆解

**觸發：** 收到填好的 Issue
**讀取：** `ai/PROJECT.md` → `ai/PRODUCT.md` → `ai/DECISIONS.md` → `ai/AGENTS.md`

**輸出格式：**
```
## Planner 輸出

### 理解確認
[用自己的話重述任務，一段話]

### 需修改的檔案
- src/[路徑]：[預計改動說明]
- src/[路徑]：[預計改動說明]

### 新增/刪除依賴
是 / 否（若是：說明套件名稱與理由）

### 預期風險
1. [風險描述]
2. [風險描述]（至多 3 項）

### AC（Acceptance Criteria）
（依 ai/AC_TEMPLATE.md 填寫，Evaluator 驗收時逐項確認）
```

**移交給：** Sean 確認

---

## Step 3：你確認 Plan

**行動：** 閱讀 Planner 輸出，確認：
- 理解是否正確？
- 修改範圍是否符合預期？（沒有偷偷擴大）
- AC 是否完整？

**兩種回應：**
- `ok` 或 `confirmed` → Generator 開始
- 修改意見 → Planner 重新拆解（回到 Step 2）

---

## Step 4：Generator 實作

**觸發：** Sean 確認 Planner 輸出

**規則：**
- 每個檔案必須先 Read 再 Edit，絕不盲寫
- 一次只改一個關注點（single concern）
- TypeScript 嚴格模式：不用 `any`，不留 `TODO`
- 不加多餘 comment，除非邏輯非顯而易見

**完成後輸出：**
```
## Generator 完成

### 已修改的檔案
- src/[路徑]：[改了什麼]

### 未動的檔案
[列出 Planner 計畫中預計修改但最終未動的檔案，說明原因]

→ 移交 Evaluator 審查
```

---

## Step 5：Evaluator Review

**觸發：** Generator 完成

**行動：**
1. 閱讀所有修改過的檔案（不跑指令，先做邏輯審查）
2. 對照 Planner 填寫的 AC，逐項確認邏輯是否正確
3. 確認沒有違反 `ai/AGENTS.md` 的禁止事項與慣例

**輸出格式：**
```
## Evaluator Review

### 邏輯審查
- [AC 項目]：通過 / 失敗（失敗請說明原因）

### 禁止事項確認
- ai/ 目錄未被修改：是 / 否
- 未引入新 npm 套件：是 / 否
- localStorage key 未改動：是 / 否

### 結論
通過 → 移交 Harness 跑測試
失敗 → [列出問題清單，移交 Generator 修正]
```

---

## Step 6：Generator 修正

**觸發：** Evaluator 回報失敗

**規則：**
- 只修正 Evaluator 指出的問題，不做額外改動
- 修正完成後輸出簡短的「修正摘要」
- 最多修正 3 輪；若第 3 輪仍失敗，停下來詢問 Sean

**輸出格式：**
```
## Generator 修正（第 N 輪）

### 修正內容
- [問題描述] → [修正方式]

→ 移交 Evaluator 重新審查（回到 Step 5）
```

---

## Step 7：Harness 跑測試

**觸發：** Evaluator Review 通過

**行動：** 執行 shell script：
```bash
cd ifa-report && bash ai/run-tests.sh
```

**預期輸出：**
```
[lint]  PASS
[tsc]   PASS
[build] PASS
✓ All checks passed
```

若任何一項失敗：輸出錯誤訊息，移交 Generator 修正（回到 Step 6）。

**注意：** 這一步是機器驗證，不替代 Evaluator 的邏輯審查（Step 5）。兩者互補。

---

## Step 8：你做 Final Approval

**觸發：** Harness 測試全部通過

**Evaluator 輸出交付格式：**
```
## 交付摘要

### 改動了什麼
- src/[路徑]：[一句話說明]

### 為什麼這樣改
[設計決策說明，不逐行解釋程式碼]

### 驗收結果
- Evaluator review：通過
- lint：通過
- tsc：通過
- build：通過
- 功能 AC：[列出通過項目]

### Commit message
`<type>(<scope>): <description>`

---
等待 Sean 確認後執行 commit。
```

**Commit message 格式：**
```
<type>(<scope>): <description>

type: feat / fix / refactor / style / docs / chore
scope: calculations / reports / input / client / pdf / harness
```

---

## 快速路徑（小改動 ≤ 5 行）

改動明確、風險低（typo、樣式微調、不涉及型別與計算邏輯）：

```
Step 4 → Step 7 → Step 8
（跳過 Planner、跳過 Evaluator review，直接 Generator 改 → Harness 跑測試 → Sean 確認）
```

---

## 聯動規則

`ai/` 目錄下任何檔案變動時：
- Planner 必須重新讀取整個 `ai/` 後再規劃
- Generator 不得以上一個任務的記憶執行新任務
- 若 harness 內容與程式碼現況有衝突，以 harness 為準，回報 Sean
