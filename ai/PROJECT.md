# PROJECT.md — IFA-Report 專案技術脈絡

專案：IFA Financial Planning Report
目的：台灣 IFA 使用的財務規劃工具，輸入客戶資料 → 生成報表 → 分享給客戶 / 匯出 PDF

## Tech Stack

- React 19 + TypeScript ~6.0 + Vite 8
- Tailwind CSS 4（`@tailwindcss/vite`，`@import "tailwindcss"` 語法，非 v3）
- Chart.js 4 + react-chartjs-2 5（報表視覺化）
- chartjs-plugin-datalabels 2（Chart.js 4.x 版本，不可任意升級）
- html2canvas 1.4 + jsPDF 4（PDF 匯出）
- Supabase JS 2（IFA Auth、客戶資料與安全分享 RPC）
- react-router-dom 7（Client View 路由）
- vitest 4（單元測試）
- Supabase Auth（IFA 端 email/password 登入）
- Supabase `ifa_clients` 表（JSONB，IFA 端客戶資料）

## 設計系統

- 風格：Analytics Dashboard（Light Professional）
- 字型：IBM Plex Sans（Google Fonts）
- 主色：`--color-primary: #1E40AF`（深海藍）
- 強調色：`--color-accent: #D97706`（琥珀）
- 側欄背景：`#0F172A`（深海軍藍）
- 設計 token 定義於 `src/index.css`（CSS custom properties）

## 資料夾結構

```
src/
  App.tsx                        ← 主佈局（IFA 端）；報表顯示、FX panel、分享按鈕
  index.css                      ← CSS variables 設計 token + Tailwind base + print styles
  main.tsx                       ← 路由設定（react-router-dom）
  types/
    client.ts                    ← 所有 TypeScript 型別（ClientProfile、VisibleModules、SharedSnapshot）
  hooks/
    useClientStore.ts            ← 客戶 CRUD + localStorage + schema migration（目前 v11）
    useAppSettings.ts            ← 報告幣別、FX 匯率狀態
  utils/
    calculations.ts              ← 財務計算（純函數，含 calcCashFlow / calcAssetGrowth / calcRetirement）
    calculations.test.ts         ← vitest 單元測試
  shared/
    StatCard.tsx                 ← KPI 卡片元件（color: blue/green/orange/red）
    pdfExport.ts                 ← PDF 產生邏輯（html2canvas → jsPDF）
    format.ts                    ← 格式化工具函數
  lib/
    supabase.ts                  ← Supabase client 初始化
  services/
    exchangeRate.ts              ← FX 匯率 API（open.er-api.com）
  features/
    auth/
      useAuth.ts                 ← Supabase Auth 狀態 hook（user / loading / signOut）
      AuthGate.tsx               ← 登入 UI（email + 密碼；AuthGate 包住整個 App）
    client/
      ClientManager.tsx          ← 左側客戶列表（選擇、新增、刪除）；深色 sidebar
      useClientStore.ts          ← 客戶 CRUD + Supabase 同步 + schema migration（v15）
    input/
      InputForm.tsx              ← 6 tabs 資料輸入容器
      shared.tsx                 ← NoteField / Section / NumField / AddBtn 共用元件
      utils.ts                   ← 季付/年付工具函數
      tabs/
        BasicTab.tsx             ← 基本資訊（出生年份、職業、諮詢重點、諮詢建議）
        IncomeTab.tsx            ← 收入項目
        ExpenseTab.tsx           ← 支出項目
        AssetTab.tsx             ← 資產項目
        LiabilityTab.tsx         ← 負債項目
        InvestTab.tsx            ← 投資偏好（風險、報酬率、定期投入、目標配置）
        MajorExpenseTab.tsx      ← 重大支出計劃
        RetirementTab.tsx        ← 退休規劃
        GoalTab.tsx              ← ⚠️ 已廢棄（功能已拆入 MajorExpenseTab + RetirementTab）
    cashflow/
      CashFlowReport.tsx         ← 收支分析報表
      calc.ts                    ← 現金流計算
    assets/
      AssetReport.tsx            ← 資產配置報表（圓餅圖 × 3 + 期間記錄比對 + Layer 2 交易明細）
      AssetGrowthReport.tsx      ← 資產成長路徑報表（三情境折線圖）
      SnapshotPanel.tsx          ← 期間記錄管理面板（浮動 panel；整合 LedgerPanel；onCommit 處理 persistence）
      LedgerPanel.tsx            ← 交易記錄輸入 UI（LedgerEntry/LedgerLine 新增刪除、鉤稽摘要、確認並更新資產）
      calc.ts                    ← 資產計算
    retirement/
      RetirementReport.tsx       ← 退休規劃報表
      calc.ts                    ← 退休缺口計算
    fx/
      FxPanel.tsx                ← 匯率設定面板（浮動 panel）
      exchangeRate.ts            ← FX 類型定義
      useAppSettings.ts          ← （符號連結）
    share/
      ShareModal.tsx             ← 快照分享 Modal（一快照一連結；透過安全 RPC create/update/revoke）
      ShareListModal.tsx         ← 所有快照的分享管理入口（列表 + 已分享/未分享 badge）
  pages/
    ClientView/
      index.tsx                  ← 客戶端主容器（tab 切換）
      PasswordGate.tsx           ← 密碼輸入 UI；由 Supabase RPC 在後端驗證
      BasicInfoPage.tsx          ← 唯讀客戶資料展示
      ChartsPage.tsx             ← 依 visible_modules 顯示互動圖表
  components/
    InputForm/
      InputForm.tsx              ← ⚠️ 舊路徑殘留，主體已移至 features/input/
```

```
supabase/
  migrations/
    202607040001_secure_client_and_sharing.sql ← ifa_clients/shared_snapshots RLS、grants、分享 RPC
```

## 啟動與指令

```bash
npm run dev      # Vite dev server（port 自動選擇，預設 5173，衝突時遞增）
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run test     # vitest run
npm run preview  # 預覽 production build
```

## 部署

- GitHub Actions → GitHub Pages
- Vite base path: `/ifa-report/`
- 目標 URL: `https://<user>.github.io/ifa-report/`

## 資料持久化

**Supabase `ifa_clients` 表（IFA 端主要持久化）：**
- `id` uuid PK（= ClientProfile.id）
- `user_id` uuid → auth.users（RLS 保護）
- `name` text
- `data` jsonb（整個 ClientProfile）
- 讀寫由 `useClientStore` 管理；Input 修改先標記 dirty，使用者按「儲存」後才 upsert
- UI 明確顯示「未儲存／儲存中／已儲存時間／儲存失敗」；未儲存離頁時觸發 browser warning

**localStorage（輔助）：**
- `ifa_active_client` → 目前選中的 client UUID（跨分頁記憶用）

**Schema 版本歷史（useClientStore.ts）：**
v1 → v2 → v3 → v4 → v5 → v6 → v7 → ... → v10 → v11 → v12 → v13 → v14 → v15（目前）
- v11：`InvestmentItem` 補 `id`（UUID）；`AssetPeriodSnapshot` 補 `ledgerEntries: []`
- v12：`ClientProfile` 新增 `ledgerEntries: LedgerEntry[]`（全局交易記錄）；`LedgerEntry` 新增 `snapshotId?: string`；`InvestmentItem` 新增 `avgCost?: number`
- v13：`LiabilityItem` 新增 `annualInterestRate?: number`（optional，舊資料保持 undefined）
- v14：`LedgerLine` 新增 `type?: LedgerLineType`（舊資料預設 'buy'）
新欄位加入時必須在 migration 中補齊預設值。

**近期新增欄位（optional，migration 以 spread + fallback 處理，無須遞增版本）：**
- `ClientProfile.realEstateReturnRate?: number` — 不動產年化增值率（預設同 globalInflationRate）
- `ClientProfile.withdrawalRate?: number` — 退休安全提領率（預設 0.04；現作為 SWR 參考值，targetAsset 改用 PV 年金法）
- `ClientProfile.retirementLumpSum?: number` — 一次性退休金，退休時名目值（預設 0）
- `ClientProfile.monthlyPension?: number` — 月退休年金，今日幣值（預設 0）
- `AssetPeriodSnapshot.shareId?: string` — Supabase shared_snapshots 行 UUID；undefined = 未分享

**Supabase（分享）：**
- Table: `shared_snapshots`
- 欄位: `id`, `user_id`, `snapshot_data`, `visible_modules`, `password_hash`, `created_at`, `expires_at`
- IFA 端必須登入；建立、更新、撤銷分別透過 `create_shared_snapshot`、`update_shared_snapshot`、`revoke_shared_snapshot` RPC
- 客戶端只能呼叫 `verify_shared_snapshot` RPC；anon 無法直接 SELECT `shared_snapshots`
- 密碼由 PostgreSQL `pgcrypto` bcrypt hash/verify，hash 與 snapshot 在驗證成功前不回傳前端
- Database grants、RLS policies 與 RPC 定義由 `supabase/migrations/` 版本控制

## 環境變數

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
