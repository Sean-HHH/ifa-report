# TASK-014 — 型別定義 + App routing skeleton

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
客戶端模式功能：建立 SharedSnapshot 型別與 /c/:id 路由基底。

**Branch 名稱**
`task/TASK-014-types-routing`

**背景**
後續所有 task 都需要 SharedSnapshot 型別與 App routing。這個 task 定義共享型別，並將 App.tsx 包裹進 Router，加入 /c/:id route 的 shell（暫時 render 空元件），讓 TASK-015、016 可以接手填入實作。

**Objective（成功定義）**
`SharedSnapshot` 型別可被所有 feature 引用；打開 `/c/:id` URL 不報 404，進入 Client View shell 頁面。

**要求（Scope）**
1. `src/types/client.ts` 新增：
   - `VisibleModules` type（各模塊 boolean 開關）
   - `SharedSnapshot` interface（id, snapshot_data, visible_modules, password_hash, created_at）
2. `src/App.tsx`：
   - 引入 `BrowserRouter`（或 `HashRouter`，見風險說明）包裹現有 App 內容
   - 新增 `/c/:id` route → 暫時 render `<ClientViewPage />` 空殼元件
   - 建立 `src/pages/ClientView/index.tsx` 作為空殼（只 render `<div>Client View</div>`）
3. Supabase schema 說明（README 格式，附在此 task 的 Section 4）：
   - Sean 需在 Supabase console 手動執行的 SQL

**不做什麼（Non-goals）**
- 不實作 PasswordGate 邏輯（TASK-016）
- 不實作 ShareModal（TASK-015）
- 不實作 BasicInfoPage / ChartsPage（TASK-017, 018）

**作業檔案（實作範圍）**
- `src/types/client.ts`（高衝突檔案，此 task 獨佔）
- `src/App.tsx`（高衝突檔案，此 task 完成後才可被 TASK-015 繼續修改）
- `src/pages/ClientView/index.tsx`（新增，空殼）

**Test Expectation（如何測試）**
1. `npm run dev`
2. 瀏覽器開啟 `http://localhost:5173/c/test-id`
3. 預期看到：畫面顯示「Client View」文字（空殼），不報錯
4. 主 app 路徑 `/` 行為不變

**驗收重點**
1. TypeScript 能正確 import `SharedSnapshot`、`VisibleModules`
2. `/c/:id` route 存在且可進入
3. 主 app 現有功能不受影響

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
這個 task 是「打樁」：定義型別、建立 routing 骨架、留好插槽給後續 task，自身不含業務邏輯。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/types/client.ts` | 新增 VisibleModules、SharedSnapshot |
| `src/App.tsx` | 加 Router wrapper + /c/:id route |
| `src/pages/ClientView/index.tsx` | 新增（空殼） |

**平行相容性**
可與以下 TASK 同時執行：無（TASK-015、016 依賴本 task 完成）
需等以下 TASK 完成後才能開始：TASK-013

**新增/刪除依賴**
否（使用 TASK-013 已安裝的 react-router-dom）

**預期風險**
1. GitHub Pages 部署使用 hash-based routing（`/ifa-report/#/c/:id`）較安全，避免 404；需確認用 `HashRouter` 而非 `BrowserRouter`
2. `src/types/client.ts` 是高衝突檔案，本 task 完成前 TASK-015/016 不可開始

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] `VisibleModules` 型別包含：assetGrowth, retirement, cashflow, basicInfo（皆為 boolean）
- [ ] `SharedSnapshot` interface 包含：id, snapshot_data, visible_modules, password_hash, created_at
- [ ] `/#/c/test-id` 可進入，render Client View 空殼，不報 JS 錯誤
- [ ] `/#/` 主 app 功能不受影響

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入 TASK-013 以外的新 npm 套件
- [ ] localStorage key 未改動

---

## [SECTION 4] Generator 執行記錄（Step 4）

<!-- Generator 填寫 -->

**已修改的檔案**
- （待填）

**Supabase 建表 SQL（Sean 手動執行）**
```sql
-- 在 Supabase SQL Editor 執行
create table shared_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_data jsonb not null,
  visible_modules jsonb not null,
  password_hash text not null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- 允許匿名讀取（客戶端不需登入）
alter table shared_snapshots enable row level security;
create policy "public read" on shared_snapshots for select using (true);
create policy "public insert" on shared_snapshots for insert with check (true);
```

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
