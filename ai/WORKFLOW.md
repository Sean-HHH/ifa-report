# WORKFLOW.md — Agentic Pipeline（8 步驟）

## 流程圖

```
━━━━━━━━━━━━━━  規劃階段（一次完成）  ━━━━━━━━━━━━━━

[你] plan mode 描述需求（一段話，可含多個需求）
         ↓
[Planner] 兩層拆解：
  1. 理解需求意圖
  2. 分析系統改動範圍
  3. 依 worktree 邊界切成 N 個 task
  → 產出 N 個 TASK 檔案草稿（含 Branch、作業檔案、平行相容性）
         ↓
[你] 確認 N 個 task 的邊界、AC、平行關係
  → 確認後 task 檔案存入 ai/tasks/open/

━━━━━━━━━━━━━━  實作階段（每個 task 獨立執行）  ━━━━━━━━━━━━━━

[你] bash ai/task-pick.sh TASK-xxx
  → 自動建立 worktree + branch，task 移入 in-progress
         ↓
[Generator] Read → Edit（單一關注點）
         ↓
[Evaluator] 邏輯審查 + 對照 AC
         ↓ 有問題
[Generator] 修正（fix loop，最多 3 輪）
         ↓ 無問題
[Harness] 執行 ai/run-tests.sh（機器驗證）
         ↓ 失敗 → 回到 Generator 修正
         ↓ 通過
[你] Final approval → commit → merge（串行，依平行相容性決定順序）
```

---

## Step 1：描述需求

**行動：** 開啟 plan mode，用自然語言描述需求。可以一次說多個需求，不需要自己切分或填表。

**重點：一段描述 ≠ 一個 task。**  
Planner 會分析你的描述涉及哪些系統改動，再依 worktree 邊界切成若干個獨立 task。你不需要預先判斷要幾個 task。

**若描述不夠具體：** Planner 會在 Step 2 之前先問你釐清問題，確認邊界後才拆解。

---

## Step 2：Planner 兩層拆解

**觸發：** 收到需求描述  
**讀取：** `ai/PROJECT.md` → `ai/PRODUCT.md` → `ai/DECISIONS.md` → `ai/AGENTS.md`

### 兩層拆解流程

**第一層：理解需求**  
用自己的話重述使用者要達成的目標，確認意圖正確。

**第二層：系統分析 → Task 切割**  
1. 列出這個需求涉及的所有系統改動（哪些檔案要動、各自改什麼）
2. 依《Worktree 決策指引》判斷哪些改動可以切成獨立 task
3. 每個獨立 task = 一個 TASK 檔案，作業檔案集合不與其他 task 重疊

### 輸出格式

```
## Planner 拆解輸出

### 需求理解
[用自己的話重述 Sean 的意圖，一段話]

### 系統改動總覽
[列出這個需求涉及的所有系統改動，不分 task]
- src/[路徑]：[要做什麼]
- src/[路徑]：[要做什麼]

### Task 切割結果
共 N 個 task：

**TASK-[ID]-A：[標題]**
- 作業檔案：src/[路徑]
- 可與以下 task 平行：TASK-[ID]-B（原因：檔案不重疊）
- 需等以下 task 完成：無

**TASK-[ID]-B：[標題]**
- 作業檔案：src/[路徑]
- 可與以下 task 平行：TASK-[ID]-A
- 需等以下 task 完成：無

### Merge 順序
任意順序 / A → B → C（原因：[說明依賴關係]）

### 各 Task 的 AC
（每個 task 個別列出，Evaluator 驗收時逐項確認）
```

**你確認後：** Planner 將每個 task 寫成獨立 TASK 檔案存入 `ai/tasks/open/`。  
**移交給：** Sean 確認

---

## Step 3：你確認 Task 清單

**行動：** 閱讀 Planner 拆解輸出，確認：
- 需求理解是否正確？
- 每個 task 的邊界是否合理？有沒有偷偷擴大或遺漏？
- Task 之間的平行 / 依賴關係是否正確？
- Merge 順序是否可接受？
- 各 task 的 AC 是否可觀察、可驗證？

**兩種回應：**
- `ok` 或 `confirmed` → Planner 將 task 寫入 `ai/tasks/open/`，實作階段開始
- 修改意見 → Planner 重新拆解（回到 Step 2）

**實作階段啟動：**  
每個 task 執行 `bash ai/task-pick.sh TASK-xxx`，自動建立 worktree + branch，再開 Agent session。
可相容的 task 可同時 pick，不相容的 task 等前一個 merge 完才 pick。

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

---

## Step 9：更新 AI 文件（每次 task 完成後必做）

**觸發：** Sean 確認 commit 完成後，Generator 執行此步驟

**規則：每個 task 完成後，必須主動檢查並更新以下文件，不可跳過。**

### 必須檢查的文件

| 文件 | 更新時機 |
|------|---------|
| `ai/PRODUCT.md` | 功能範圍異動（新增功能、改變 tab 結構、新 UX 行為） |
| `ai/PROJECT.md` | 新增/刪除檔案、依賴異動、schema 版本更新、資料夾結構異動 |
| `ai/DECISIONS.md` | 新的技術選型、產品邊界決策 |
| `ai/WORKFLOW.md` | 新的 worktree 衝突規則、流程調整 |

### 更新格式

逐一檢查，只更新有異動的文件。輸出：

```
## 文件更新摘要

- PRODUCT.md：[更新了什麼 / 無需更新]
- PROJECT.md：[更新了什麼 / 無需更新]
- DECISIONS.md：[更新了什麼 / 無需更新]
- WORKFLOW.md：[更新了什麼 / 無需更新]
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

---

## Worktree 決策指引

Planner 在 Step 2 依此判斷要不要分 worktree。Sean 不需要自己判斷，看 Planner 輸出確認即可。

### 分 worktree 的條件（三個都要成立）

1. **有 2 個以上獨立任務**
2. **各任務的作業檔案集合無交集**（用下表對照）
3. **任務之間沒有依賴**（Task B 不需要等 Task A 的結果）

若任何一條不成立 → 單線串行，不分 worktree。

### 快速判斷：哪些任務天然隔離

| 任務類型 | 主要作業檔案 | 與其他任務衝突？ |
|---|---|---|
| 基本資料 tab | `features/input/tabs/BasicTab.tsx` | 無 |
| 收入 tab | `features/input/tabs/IncomeTab.tsx` | 只有 ExpenseTab 同時改才衝突 |
| 支出 tab | `features/input/tabs/ExpenseTab.tsx` | 同上 |
| 資產 tab | `features/input/tabs/AssetTab.tsx` | 無 |
| 負債 tab | `features/input/tabs/LiabilityTab.tsx` | 無 |
| 投資偏好 tab | `features/input/tabs/InvestTab.tsx` | 無 |
| 重大支出 tab | `features/input/tabs/MajorExpenseTab.tsx` | 無 |
| 退休規劃 tab | `features/input/tabs/RetirementTab.tsx` | 無 |
| 現金流計算 | `features/cashflow/calc.ts` | 無 |
| 現金流報表 | `features/cashflow/CashFlowReport.tsx` | 無 |
| 資產計算 | `features/assets/calc.ts` | 無 |
| 資產報表 | `features/assets/AssetReport.tsx` | 無 |
| 資產成長報表 | `features/assets/AssetGrowthReport.tsx` | 無 |
| 退休計算 + 報表 | `features/retirement/` | 若同時改 assets/calc.ts 則衝突 |
| 匯率 | `features/fx/` | 無 |
| 分享 Modal | `features/share/ShareModal.tsx` | 無 |
| 客戶端頁面 | `pages/ClientView/` | 無（與 IFA 端完全隔離） |
| PDF | `shared/pdfExport.ts` | 無 |

### 高衝突檔案（以下任何一個被兩個任務同時修改 → 必須串行）

- `src/types/client.ts`（新欄位、型別定義）
- `src/features/client/useClientStore.ts`（schema migration）
- `src/App.tsx`（新元件接線）

### 範例判斷

```
任務 A：改 AssetTab UI
任務 B：改 calcAssetGrowth 通膨邏輯

作業檔案 A：features/input/tabs/AssetTab.tsx
作業檔案 B：features/assets/calc.ts
交集：無 → 可分 worktree，任意順序 merge
```

```
任務 A：在 types/client.ts 加新欄位
任務 B：在 useClientStore.ts 加 migration

作業檔案 A：types/client.ts
作業檔案 B：useClientStore.ts（且 B 依賴 A 先完成）
交集：無，但有依賴 → 串行，A 先，B 後
```

---

## 多 Agent 平行工作規則

### 核心原則
- 兩個 agent 的 worktree 可以同時開發，但 **merge 必須串行**，不可同時合併
- Agent B 必須在 Agent A merge 後才能 rebase 並合併

### 標準流程

**Agent A 完成時：**
```bash
cd .claude/worktrees/<branch-a>
git status           # 確認無意外修改
git diff origin/main # 確認改動範圍
bash ai/run-tests.sh # lint / tsc / test / build 全過
git commit -am "feat: ..."
# → 開 PR → review → merge to main
```

**Agent A merge 後，Agent B 才開始 merge 流程：**
```bash
cd .claude/worktrees/<branch-b>
git fetch origin
git rebase origin/main   # 此時解 conflict（若有）
bash ai/run-tests.sh     # 重新驗證
# → 開 PR → review → merge to main
```

### 不可做的事
- ❌ Agent A 和 Agent B 同時開 PR 並同時 merge
- ❌ 在 Agent A merge 前讓 Agent B 開始修改共享檔案
- ❌ 跳過 rebase 直接 merge（會製造 conflict 給 CI 處理）

### 高衝突檔案（排程時注意）
以下檔案若兩個 task 都需要動，**必須串行排程，不可並行**：
- `src/types/client.ts`（新欄位 + 型別）
- `src/features/client/useClientStore.ts`（schema migration）
- `src/App.tsx`（新元件接線）

### 功能模塊與作業範圍對照
| Agent 任務 | 主要作業資料夾 |
|-----------|--------------|
| 現金流功能 | `src/features/cashflow/` |
| 資產功能 | `src/features/assets/` |
| 退休功能 | `src/features/retirement/` |
| 幣別/FX | `src/features/fx/` |
| 基本資料 tab | `src/features/input/tabs/BasicTab.tsx` |
| 收入 tab | `src/features/input/tabs/IncomeTab.tsx` |
| 支出 tab | `src/features/input/tabs/ExpenseTab.tsx` |
| 資產 tab | `src/features/input/tabs/AssetTab.tsx` |
| 負債 tab | `src/features/input/tabs/LiabilityTab.tsx` |
| 投資偏好 tab | `src/features/input/tabs/InvestTab.tsx` |
| 重大支出 tab | `src/features/input/tabs/MajorExpenseTab.tsx` |
| 退休規劃 tab | `src/features/input/tabs/RetirementTab.tsx` |
| 分享功能 | `src/features/share/ShareModal.tsx` |
| 客戶端 View | `src/pages/ClientView/` |
| PDF | `src/shared/pdfExport.ts` |
