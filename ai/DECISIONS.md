# DECISIONS.md — 已決定的取捨（Agent 不得推翻）

這裡記錄的是已確定的技術與產品選擇。Agent 收到任務時若有衝動要推翻這些決定，必須先向 Sean 說明理由並獲得確認。

---

## 技術決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 狀態管理 | React hooks only（無 Zustand / Redux） | 專案規模小，引入狀態管理庫增加複雜度但無實質收益 |
| 持久化（IFA 端） | Supabase `ifa_clients` 表（JSONB）+ email/password 登入 | 多裝置共用資料；active client id 仍用 localStorage 記憶 |
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
| 雲端同步 | 是（debounce 2 秒自動儲存）| 單一使用者，解決換裝置/瀏覽器資料遺失問題 |
| IFA 帳號系統 | 是（email + 密碼，單使用者） | 帳號在 Supabase Dashboard 手動建立，不提供 Registration UI |
| 情境數量 | 固定 3 個（保守 / 基準 / 積極） | 與台灣 IFA 業界慣例對齊，避免過度複雜化 |
| Return rate 設定 | 依 riskProfile 給預設值，可 customReturnRate 覆蓋 | 彈性夠，不需要 per-scenario 自訂 |
| 貨幣顯示 | TWD 為主，支援多幣別，大數字用萬/億 | 台灣市場；多幣別資產需求真實存在 |
| PDF 格式 | 一客戶一份，多頁（每頁一份報表） | 完整呈現四份報表 |
| 介面語言 | 繁體中文 | 目標市場台灣，不做多語系 |
| InputForm 結構 | 6 tabs（基本/收支/資產/投資/支出/退休） | 依資料類型分組，比原先 3 tabs 更清晰 |
| 分享密碼 | hash 存 Supabase，不存明文 | 基本安全性，IFA 不需要登入系統 |
| 資產變動追蹤（Ledger） | LedgerEntry → LedgerLine 雙層結構；交易記錄存於 ClientProfile.ledgerEntries（全局），以 snapshotId 關聯期間快照；確認後套用至 assetItems；差額自動建 MajorExpense；avgCost 由 ledger 自動維護（加權平均成本），unitPrice 仍為手填市價 | 交易記錄不依附快照，刪快照不遺失歷史；avgCost 與 unitPrice 分離，成本追蹤與市值評估互不干擾 |
| 快照 UI 改名 | 「快照」→「期間記錄」（UI 層）；型別名 `AssetPeriodSnapshot` 保留不動 | 語意更精確；型別名不動避免大量 import 更新 |
| Ledger UI 隱藏 | `LedgerPanel` 元件保留但在 SnapshotPanel 中隱藏（不渲染）；資料結構（`ledgerEntries`、`LedgerEntry`、`LedgerLine`）完整保留 | 主要工作流程已改為「更新 Input → 建立快照」，逐筆交易記錄對目前 IFA 使用情境過重；隱藏而非刪除，保留日後重啟的彈性 |
| 分享連結綁定 | 一快照一連結；`AssetPeriodSnapshot.shareId` 存 Supabase row UUID；upsert（修改已分享）/ delete（撤銷）模式 | 避免同一快照出現多條分享連結；分享狀態對齊快照版本 |
| 資產成長雙池模型 | 流動資產（現金/股票/基金/債券/加密/其他）與不動產分池獨立成長；不動產使用 `realEstateReturnRate`（預設同通膨率）；流動池每年扣除重大支出後複利 | 不動產難以即時變現，與流動資產混算會高估流動性；重大支出衝擊只從流動池扣 |
| 不動產不計入退休提領缺口 | `projectedUsableBase = projectedLiquidBase + lumpSum`；gap 比較與退休後模擬均以此為基準；不動產另列顯示 | 不動產通常為自住，退休時不一定能提領；高估可用資產對客戶有風險 |
| 月退年金假設 | 名目固定（不隨通膨調升）；保守假設 | 台灣勞保月退有條件調升但非每年，保守估算讓缺口計算不低估；客戶接受後可視實際條件手動調整 |
| 退休目標資產計算法 | 成長型年金現值法（PV of growing annuity）為主，SWR 法為輔助參考；`targetAsset = annualSpend × [1 − ((1+g)/(1+r))^n] / (r−g)`；`targetAssetSWR = annualSpend / withdrawalRate` 並排顯示 | SWR 隱含永續假設，對有限餘命高估需求；PV 法顯式建模通膨與報酬率，更精確反映實際退休規劃需求 |
| 退休期重大支出 | 提領模擬連動 `majorExpenses`（發生年在退休期間者），從 `remaining` 扣除並觸發 liquidityWarning；`targetAsset` 額外加上退休期重大支出的折現值（pvMajor） | 退休前後重大支出應一致處理；確保缺口計算與提領模擬邏輯一致 |

---

## Schema Migration 原則

- `useClientStore.ts` 必須永遠向後相容，不可 breaking change
- 新欄位必須有預設值，migration 自動補齊舊資料
- Migration 版本號遞增（目前 v14）
- 改 `ClientProfile` 型別 → 必須同步改 migration → 必須在 `InputForm` 有對應輸入 → 視情況在報表中顯示
- Optional 欄位且 calc 層有 `?? default` fallback 者，可不遞增版本（`...raw` spread 自動帶入舊值）

---

## 邊界情況

以下情境出現時，必須先與 Sean 討論，不可自行決定：

- 需要引入新 npm 套件
- 需要改變 localStorage key 名稱或結構（`ifa_active_client` 目前仍用）
- 需要新增第 4 個投資情境
- 需要更動部署平台或 CI/CD 邏輯
- 需要更換 Supabase 或 FX 供應商
- 需要新增多使用者支援或修改帳號架構
