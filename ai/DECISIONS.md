# DECISIONS.md — 已決定的取捨（Agent 不得推翻）

這裡記錄的是已確定的技術與產品選擇。Agent 收到任務時若有衝動要推翻這些決定，必須先向 Sean 說明理由並獲得確認。

---

## 技術決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 狀態管理 | React hooks only（無 Zustand / Redux） | 專案規模小，引入狀態管理庫增加複雜度但無實質收益 |
| 持久化 | localStorage only（無後端） | 產品定位是本地工具，不需帳號系統 |
| PDF 生成 | html2canvas + jsPDF（純前端） | 無需伺服器，IFA 可在本地直接匯出 |
| 樣式系統 | Tailwind CSS utility-first | 快速開發，無 CSS module 額外心智負擔 |
| 圖表套件 | Chart.js 4 + react-chartjs-2 5 | 已整合穩定，不換 Recharts / D3 / ECharts |
| 建置工具 | Vite 8 | 快速 HMR，開發體驗好 |
| 部署平台 | GitHub Pages | 免費，CI/CD 已設定，夠用 |
| 語言 | TypeScript 嚴格模式 | noUnusedLocals、noUnusedParameters 開啟，不留 dead code |

---

## 產品決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 多客戶支援 | 是（useClientStore 管理陣列） | IFA 有多個客戶，需要切換 |
| 雲端同步 | 否 | 超出現有定位，不在路線圖 |
| 情境數量 | 固定 3 個（保守 / 基準 / 積極） | 與台灣 IFA 業界慣例對齊，避免過度複雜化 |
| Return rate 設定 | 依 riskProfile 給預設值，可 customReturnRate 覆蓋 | 彈性夠，不需要 per-scenario 自訂 |
| 貨幣單位 | TWD（台幣），大數字用萬/億 | 台灣市場，IFA 與客戶溝通習慣 |
| PDF 格式 | 一客戶一份，多頁（每頁一份報表） | 完整呈現三份報表 |
| 介面語言 | 繁體中文 | 目標市場台灣，不做多語系 |

---

## Schema Migration 原則

- `useClientStore.ts` 必須永遠向後相容，不可 breaking change
- 新欄位必須有預設值，migration 自動補齊舊資料
- Migration 版本號遞增（目前 v3）
- 改 `ClientProfile` 型別 → 必須同步改 migration → 必須在 `InputForm` 有對應輸入 → 必須在報表中有顯示

---

## 邊界情況

以下情境出現時，必須先與 Sean 討論，不可自行決定：

- 需要引入新 npm 套件
- 需要改變 localStorage key 名稱或結構
- 需要新增第 4 個投資情境
- 需要更動部署平台或 CI/CD 邏輯
- 需要新增後端或雲端依賴
