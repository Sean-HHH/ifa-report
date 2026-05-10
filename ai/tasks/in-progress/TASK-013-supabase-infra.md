# TASK-013 — 基礎設施：Supabase + React Router 安裝

<!-- 狀態由資料夾決定：open / in-progress / review / done -->
<!-- 每個 pipeline 步驟把輸出追加到對應的 section -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
客戶端模式功能（Client View）：IFA 分享快照給客戶查看。

**Branch 名稱**
`task/TASK-013-supabase-infra`

**背景**
客戶端模式需要雲端持久化（Supabase）儲存快照資料，以及 URL routing（react-router-dom）支援 `/c/:id` 路由。目前專案無後端、無 router，需先建立基礎設施層。

**Objective（成功定義）**
專案可成功 import Supabase client 與 react-router-dom，且 `npm run build` 通過，為後續 task 提供基礎。

**要求（Scope）**
1. 安裝 `@supabase/supabase-js` 與 `react-router-dom`
2. 建立 `src/lib/supabase.ts`（Supabase client singleton，讀取 env vars）
3. 建立 `.env.local`（`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 佔位，由 Sean 填入實際值）
4. 確認 `.env.local` 已加入 `.gitignore`

**不做什麼（Non-goals）**
- 不建立 Supabase 資料表（TASK-014 負責型別；資料表由 Sean 在 Supabase console 手動建立）
- 不修改任何現有元件或 App.tsx
- 不設定 Router（TASK-014 負責）

**作業檔案（實作範圍）**
- `package.json`
- `src/lib/supabase.ts`（新增）
- `.env.local`（新增）
- `.gitignore`（確認 .env.local 已列入）

**Test Expectation（如何測試）**
1. `npm install` 無報錯
2. `npm run build` 通過（tsc + vite build）
3. `src/lib/supabase.ts` 可被其他檔案 import 而不報型別錯誤

**驗收重點**
1. `@supabase/supabase-js` 與 `react-router-dom` 出現在 package.json dependencies
2. `src/lib/supabase.ts` export 一個 `supabase` client instance
3. `.env.local` 存在且包含兩個佔位 key
4. `.gitignore` 包含 `.env.local`
5. `npm run build` 通過

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
這個 task 只負責安裝套件與建立基礎設施檔案，不動任何現有業務邏輯。是整個 Client View 功能的地基。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `package.json` | 新增兩個 dependencies |
| `src/lib/supabase.ts` | 新增（createClient singleton） |
| `.env.local` | 新增（佔位 env vars） |
| `.gitignore` | 確認 .env.local 已列入，若無則加 |

**平行相容性**
可與以下 TASK 同時執行：無（為所有後續 task 的前置）
需等以下 TASK 完成後才能開始：無

**新增/刪除依賴**
是：新增 `@supabase/supabase-js`、`react-router-dom`（已獲 Sean 確認，覆蓋 DECISIONS.md）

**預期風險**
1. `.env.local` 未填入真實值時，Supabase client 初始化會有 placeholder URL，build 仍通過但 runtime 請求會失敗（可接受，由 Sean 在執行前填入）
2. react-router-dom 版本需確認與 React 19 相容（使用 v7）

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] `package.json` 包含 `@supabase/supabase-js` 與 `react-router-dom`
- [ ] `src/lib/supabase.ts` 存在且 export `supabase` client
- [ ] `.env.local` 存在，包含 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`
- [ ] `.gitignore` 包含 `.env.local`

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未修改任何現有 src/ 業務邏輯檔案
- [ ] localStorage key 未改動

---

## [SECTION 4] Generator 執行記錄（Step 4）

<!-- Generator 填寫 -->

**已修改的檔案**
- （待填）

**設計決策**
（待填）

---

## [SECTION 5] Evaluator Review（Step 5）

<!-- Evaluator 填寫 -->

**邏輯審查**
| AC 項目 | 結果 |
|---------|------|
| ... | 待審 |

**結論**
待審

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
pending

**備註**

**Commit**
`—`
