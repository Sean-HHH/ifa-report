# PROJECT.md — IFA-Report 專案技術脈絡

專案：IFA Financial Planning Report
目的：台灣 IFA 使用的財務規劃工具，輸入客戶資料 → 生成報表 → 分享給客戶 / 匯出 PDF

## Tech Stack

- React 19 + TypeScript ~6.0 + Vite 8
- Tailwind CSS 4（`@tailwindcss/vite`，`@import "tailwindcss"` 語法，非 v3）
- Chart.js 4 + react-chartjs-2 5（報表視覺化）
- chartjs-plugin-datalabels 2（Chart.js 4.x 版本，不可任意升級）
- html2canvas 1.4 + jsPDF 4（PDF 匯出）
- Supabase JS 2（報告分享功能；IFA 端無帳號，僅用於寫入/讀取 shared_snapshots）
- react-router-dom 7（Client View 路由）
- vitest 4（單元測試）
- localStorage（IFA 端唯一持久化層）

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
    client/
      ClientManager.tsx          ← 左側客戶列表（選擇、新增、刪除）；深色 sidebar
      useClientStore.ts          ← （符號連結，主體在 hooks/）
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
      ShareModal.tsx             ← 快照分享 Modal（一快照一連結；create/manage/revoke 三狀態；upsert/delete Supabase）
      ShareListModal.tsx         ← 所有快照的分享管理入口（列表 + 已分享/未分享 badge）
  pages/
    ClientView/
      index.tsx                  ← 客戶端主容器（tab 切換）
      PasswordGate.tsx           ← 密碼驗證
      BasicInfoPage.tsx          ← 唯讀客戶資料展示
      ChartsPage.tsx             ← 依 visible_modules 顯示互動圖表
  components/
    InputForm/
      InputForm.tsx              ← ⚠️ 舊路徑殘留，主體已移至 features/input/
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

**localStorage（IFA 端）：**
- `ifa_clients` → 所有 ClientProfile 的 JSON 陣列
- `ifa_active_client` → 目前選中的 client UUID

**Schema 版本歷史（useClientStore.ts）：**
v1 → v2 → v3 → v4 → v5 → v6 → v7 → ... → v10 → v11 → v12 → v13 → v14（目前）
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
- 欄位: `id`, `snapshot_data`, `visible_modules`, `password_hash`, `created_at`, `expires_at`
- IFA 端無帳號，僅用 anon key 寫入/讀取

## 環境變數

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
