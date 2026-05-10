# TASK-016 — 客戶端：PasswordGate + 快照 fetch

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
客戶端模式功能：客戶打開連結後輸入密碼，通過後載入快照資料。

**Branch 名稱**
`task/TASK-016-client-passwordgate`

**背景**
客戶打開 `/c/:id` 連結，需要先通過密碼驗證，才能看到快照內容。密碼驗證在前端完成（SHA-256 compare），快照資料從 Supabase 以 UUID 查詢。

**Objective（成功定義）**
客戶打開連結、輸入正確密碼後，進入已載入快照資料的 Client View 容器，錯誤密碼則顯示錯誤訊息。

**要求（Scope）**
1. `src/pages/ClientView/index.tsx`（原空殼，擴充為完整容器）：
   - 從 URL params 取得 `:id`
   - 呼叫 Supabase 查詢 `shared_snapshots` 取得 `password_hash` 與 `visible_modules`
   - 未驗證時 render `<PasswordGate />`
   - 驗證通過後持有 `snapshot_data`（`ClientProfile`）與 `visible_modules`，傳給子頁
2. 新增 `src/pages/ClientView/PasswordGate.tsx`：
   - 密碼輸入欄 + 送出按鈕
   - SHA-256 hash 輸入值 → 比對 `password_hash`
   - 正確：呼叫 `onSuccess()` callback
   - 錯誤：顯示「密碼錯誤」

**不做什麼（Non-goals）**
- 不實作 BasicInfoPage / ChartsPage（TASK-017、018）
- 驗證通過後暫時顯示 `<div>已驗證，快照載入中…</div>` 作為佔位

**作業檔案（實作範圍）**
- `src/pages/ClientView/index.tsx`（從空殼擴充）
- `src/pages/ClientView/PasswordGate.tsx`（新增）

**Test Expectation（如何測試）**
1. 先完成 TASK-015，取得一條有效分享連結
2. 新分頁打開連結 → 應看到密碼輸入頁
3. 輸入錯誤密碼 → 顯示「密碼錯誤」
4. 輸入正確密碼 → 頁面顯示「已驗證，快照載入中…」
5. 邊界案例：無效 UUID（不存在的 id）→ 顯示「連結無效或已過期」

**驗收重點**
1. 正確密碼通過驗證，錯誤密碼顯示錯誤訊息
2. 無效 UUID 顯示錯誤狀態
3. 快照資料（ClientProfile）正確從 Supabase 取得並持有在 state

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
這個 task 負責客戶端的驗證門，是 TASK-017、018 的容器前置。通過後持有 snapshot 資料，子頁從 props 取用。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/pages/ClientView/index.tsx` | 從空殼擴充為 fetch + gate 容器 |
| `src/pages/ClientView/PasswordGate.tsx` | 新增密碼驗證元件 |

**平行相容性**
可與以下 TASK 同時執行：TASK-015（作業檔案無交集）
需等以下 TASK 完成後才能開始：TASK-014

**新增/刪除依賴**
否（SHA-256 同樣使用 `crypto.subtle.digest`）

**預期風險**
1. Supabase 查詢若 RLS 未正確設定，`select` 可能被擋；確保 TASK-014 SQL 已執行
2. 快照資料（`snapshot_data`）型別需對齊 `ClientProfile`，反序列化時需做型別斷言

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] 打開有效連結 → 顯示密碼輸入頁
- [ ] 錯誤密碼 → 顯示「密碼錯誤」，不進入 view
- [ ] 正確密碼 → 進入已驗證狀態（顯示佔位文字）
- [ ] 無效 UUID → 顯示「連結無效或已過期」

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] localStorage key 未改動
- [ ] 未修改 IFA 端任何現有元件

---

## [SECTION 4] Generator 執行記錄（Step 4）

<!-- Generator 填寫 -->

**已修改的檔案**
- `src/pages/ClientView/index.tsx`（從空殼擴充為 fetch + gate 容器）
- `src/pages/ClientView/PasswordGate.tsx`（新增）

**設計決策**
- `loadState` 用 lazy initializer 初始化（`() => id ? 'loading' : 'not_found'`），避免 effect 內同步呼叫 setState 觸發 lint 規則
- SHA-256 hash 使用 `crypto.subtle.digest`，與 TASK-015 ShareModal 邏輯對稱
- 驗證通過後持有 `snapshotData` 與 `visibleModules` 在 state，供 TASK-017/018 子頁取用
- 驗證通過後顯示佔位文字 + 客戶名稱（快照已確認載入）

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
