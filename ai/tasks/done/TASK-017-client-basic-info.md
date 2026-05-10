# TASK-017 — 客戶端：基本資料頁

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
客戶端模式功能：客戶端要多一頁面資料，為基本資料，內容是所有他的 input。

**Branch 名稱**
`task/TASK-017-client-basic-info`

**背景**
客戶打開分享連結驗證通過後，應能查看一頁完整的基本資料，包含所有 IFA 輸入的客戶資訊：目標、收入、支出、資產、負債。此頁完全唯讀，不允許編輯。

**Objective（成功定義）**
客戶在 Client View 的「基本資料」頁，可看到快照當下所有輸入資料，格式清晰易讀。

**要求（Scope）**
1. 新增 `src/pages/ClientView/BasicInfoPage.tsx`，接受 `ClientProfile` 作為 prop，唯讀展示以下區塊：
   - **人生目標**：出生年份、目前年齡（computed）、退休年齡、退休餘命、目標月退休現金流、重大支出列表
   - **收入**：所有 IncomeItem（名稱、金額、頻率）
   - **支出**：所有 ExpenseItem（名稱、金額、類別）
   - **資產**：所有 InvestmentItem（名稱、金額、類別）
   - **負債**：所有 LiabilityItem（名稱、金額、類型）
2. `src/pages/ClientView/index.tsx` 整合 BasicInfoPage（若 `visible_modules.basicInfo === true`）

**不做什麼（Non-goals）**
- 不實作編輯功能
- 不顯示圖表（圖表在 TASK-018）
- 不顯示投資偏好設定（riskProfile 等 IFA 內部參數）

**作業檔案（實作範圍）**
- `src/pages/ClientView/BasicInfoPage.tsx`（新增）
- `src/pages/ClientView/index.tsx`（整合 BasicInfoPage）

**Test Expectation（如何測試）**
1. 完成 TASK-016，以正確密碼進入 Client View
2. 頁面顯示「基本資料」區塊
3. 確認所有收入、支出、資產、負債項目正確顯示
4. 邊界案例：空白清單（例如無負債）應顯示「無」或對應提示

**驗收重點**
1. 五個區塊全部顯示：目標、收入、支出、資產、負債
2. 數字以正確貨幣格式呈現（TWD 格式）
3. 空清單有對應空狀態顯示

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
這個 task 是純展示頁，不涉及計算邏輯，直接將 `ClientProfile` 資料渲染成易讀格式。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/pages/ClientView/BasicInfoPage.tsx` | 新增（完整展示元件） |
| `src/pages/ClientView/index.tsx` | 整合 BasicInfoPage，依 visible_modules 控制顯示 |

**平行相容性**
可與以下 TASK 同時執行：TASK-018（作業檔案無交集）
需等以下 TASK 完成後才能開始：TASK-016（需要 ClientView 容器提供 snapshot_data）

**新增/刪除依賴**
否

**預期風險**
1. 貨幣格式需複用現有 `fmtAmount` / `fmtNTD` 函數，確認可從 `src/utils/calculations.ts` import

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] 人生目標區塊顯示（含計算後的目前年齡）
- [ ] 收入、支出、資產、負債各區塊顯示
- [ ] 數字以 TWD 貨幣格式呈現
- [ ] 空清單顯示對應空狀態
- [ ] `visible_modules.basicInfo === false` 時，頁面不顯示此模塊

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] localStorage key 未改動
- [ ] 未修改 IFA 端任何現有元件

---

## [SECTION 4] Generator 執行記錄（Step 4）

<!-- Generator 填寫 -->

**已修改的檔案**
- （待填）

**設計決策**
（待填）

---

## [SECTION 5] Evaluator Review（Step 5）

**邏輯審查**
| AC 項目 | 結果 |
|---------|------|
| ... | 待審 |

**結論**
待審

---

## [SECTION 6] Harness 測試結果（Step 7）

```
[等待執行]
```

---

## [SECTION 7] Human Decision（Step 8）

**決定**
pending

**備註**

**Commit**
`—`
