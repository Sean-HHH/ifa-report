# PROJECT.md — IFA-Report 專案技術脈絡

專案：IFA Financial Planning Report
目的：台灣 IFA 使用的財務規劃工具，輸入客戶資料 → 生成三份報表 → 匯出 PDF

## Tech Stack

- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS 4（@tailwindcss/vite）
- Chart.js 4 + react-chartjs-2 5（報表視覺化）
- chartjs-plugin-datalabels 2（Chart.js 4.x 版本，不可任意升級）
- html2canvas 1.4 + jsPDF 4（PDF 匯出）
- localStorage（唯一持久化層，無後端）

## 重要資料夾

```
src/
  App.tsx                  ← 主佈局與 tab 狀態
  types/client.ts          ← 所有 TypeScript 型別定義
  hooks/useClientStore.ts  ← 客戶 CRUD + localStorage + schema migration
  utils/calculations.ts    ← 財務計算（純函數，無副作用）
  utils/pdfExport.ts       ← PDF 產生邏輯（html2canvas → jsPDF）
  components/
    ClientManager/         ← 左側客戶列表（選擇、新增、刪除）
    InputForm/             ← 資料輸入（5 tabs：收入、支出、資產、負債、目標）
    reports/
      CashFlowReport.tsx   ← 現金流 pie + waterfall chart
      AssetGrowthReport.tsx ← 三情境資產成長折線圖
      RetirementReport.tsx ← 退休缺口 + 30 年提款模擬
      StatCard.tsx         ← 可重用 KPI 卡片元件
    layout/                ← 版面元件
  index.css                ← Tailwind base styles
ai/                        ← Context Harness（本目錄，agent 啟動必讀）
```

## 啟動與指令

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # tsc --noEmit + vite build
npm run lint     # ESLint
npm run preview  # 預覽 production build
```

## 部署

- GitHub Actions → GitHub Pages
- Vite base path: `/ifa-report/`
- 目標 URL: `https://<user>.github.io/ifa-report/`

## 資料持久化

localStorage keys：
- `ifa_clients` → 所有 ClientProfile 的 JSON 陣列
- `ifa_active_client` → 目前選中的 client UUID

Schema 版本歷史（useClientStore.ts 內有 migration）：v1 → v2 → v3（目前）
