# DECISIONS.md — 已決定的取捨（Agent 不得推翻）

這裡記錄的是已確定的技術與產品選擇。Agent 收到任務時若有衝動要推翻這些決定，必須先向 Sean 說明理由並獲得確認。

---

## 技術決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 狀態管理 | React hooks only（無 Zustand / Redux） | 專案規模小，引入狀態管理庫增加複雜度但無實質收益 |
| 持久化（IFA 端） | localStorage only | 本地工具定位，不需帳號系統 |
| 持久化（分享） | Supabase（anon key） | 無伺服器端程式碼，只用 Supabase 存取 shared_snapshots |
| PDF 生成 | html2canvas + jsPDF（純前端） | 無需伺服器，IFA 可在本地直接匯出 |
| 樣式系統 | Tailwind CSS v4 utility-first | 快速開發；v4 語法（`@import "tailwindcss"`），不可用 v3 語法 |
| 圖表套件 | Chart.js 4 + react-chartjs-2 5 | 已整合穩定，不換 Recharts / D3 / ECharts |
| 建置工具 | Vite 8 | 快速 HMR，開發體驗好 |
| 部署平台 | GitHub Pages | 免費，CI/CD 已設定，夠用 |
| 語言 | TypeScript 嚴格模式 | noUnusedLocals、noUnusedParameters 開啟，不留 dead code |
| 路由 | react-router-dom 7 | Client View 需要獨立路由（`/share/:id`） |
| FX 匯率 | open.er-api.com（免費，無 API key） | 無需設定 API key，可手動覆蓋率值 |
| 設計系統 | Analytics Dashboard Light Professional | IBM Plex Sans + 深藍 #1E40AF + 琥珀 #D97706；token 定義在 index.css |
| icon | SVG inline（無 icon library） | 零依賴，只用到少量圖示 |

---

## 產品決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 多客戶支援 | 是（useClientStore 管理陣列） | IFA 有多個客戶，需要切換 |
| 雲端同步 | 否 | 超出現有定位，不在路線圖 |
| IFA 帳號系統 | 否 | 降低使用門檻；分享功能以 snapshot 為單位，不需帳號 |
| 情境數量 | 固定 3 個（保守 / 基準 / 積極） | 與台灣 IFA 業界慣例對齊，避免過度複雜化 |
| Return rate 設定 | 依 riskProfile 給預設值，可 customReturnRate 覆蓋 | 彈性夠，不需要 per-scenario 自訂 |
| 貨幣顯示 | TWD 為主，支援多幣別，大數字用萬/億 | 台灣市場；多幣別資產需求真實存在 |
| PDF 格式 | 一客戶一份，多頁（每頁一份報表） | 完整呈現四份報表 |
| 介面語言 | 繁體中文 | 目標市場台灣，不做多語系 |
| InputForm 結構 | 6 tabs（基本/收支/資產/投資/支出/退休） | 依資料類型分組，比原先 3 tabs 更清晰 |
| 分享密碼 | hash 存 Supabase，不存明文 | 基本安全性，IFA 不需要登入系統 |

---

## Schema Migration 原則

- `useClientStore.ts` 必須永遠向後相容，不可 breaking change
- 新欄位必須有預設值，migration 自動補齊舊資料
- Migration 版本號遞增（目前 v10）
- 改 `ClientProfile` 型別 → 必須同步改 migration → 必須在 `InputForm` 有對應輸入 → 視情況在報表中顯示

---

## 邊界情況

以下情境出現時，必須先與 Sean 討論，不可自行決定：

- 需要引入新 npm 套件
- 需要改變 localStorage key 名稱或結構
- 需要新增第 4 個投資情境
- 需要更動部署平台或 CI/CD 邏輯
- 需要新增帳號系統或 IFA 登入功能
- 需要更換 Supabase 或 FX 供應商
