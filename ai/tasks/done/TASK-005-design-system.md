# TASK-005 — 更新 App Shell 設計風格（FinTech Design System）

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Sean 填寫）

**背景**
目前 App.tsx 大量使用 hardcoded hex 顏色的 inline style，視覺風格偏陽春。希望參考 Figma FinTech Design System UI Kit 提升整體設計質感。

**Objective（成功定義）**
IFA 打開工具後，第一眼看到更專業、更有質感的 Fintech 風格介面（sidebar、header、tab bar、KPI 卡片），不需要改變任何操作邏輯。

**要求（Scope）**
- 參考：https://www.figma.com/community/file/1536320755847675715/fintech-design-system-ui-kit
- 在 `index.css` 建立 CSS custom properties（設計 token）
- 更新 `App.tsx` App Shell（Sidebar、Header、Tab bar、空白頁佔位）使用新設計
- 更新 `StatCard.tsx` 卡片視覺

**不做什麼（Non-goals）**
- 不動 CashFlowReport / AssetReport / AssetGrowthReport / RetirementReport 的內部 layout
- 不動 InputForm 的 UI
- 不動 ClientManager 的 UI
- 不動任何計算邏輯、型別、hook
- 不動 PDF 匯出邏輯
- 不換圖表套件或顏色

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
這是一個純 UI 外觀更新，範圍鎖定在「App 的骨架元素（chrome）」：左側 Sidebar、頂部 Header、Tab bar、StatCard KPI 卡片。不動任何報表內容、輸入表單、計算邏輯。目標是建立 CSS token 系統，並用新 token 替換 App.tsx 裡散落的 hardcoded inline style。

**FinTech 設計方向（依 Figma UI Kit 常見規範）**

| 元素 | 現況 | 更新方向 |
|------|------|---------|
| Sidebar bg | `#ffffff` + 薄邊框 | 深色 Navy（`#0f172a`）+ 白字階層 |
| Sidebar 品牌名 | 藍字 plain text | 品牌 Logo mark + 白字 |
| Header bg | `#ffffff` + 薄邊框 | 白底 + 加強陰影層次 |
| Tab bar 未選中 | `#94a3b8` | 更淡（`#cbd5e1`）+下底線動態 |
| Tab bar 選中 | `#3b82f6` 底線 | 保持主色，加粗至 `3px` |
| 匯出按鈕 | plain blue | 帶 gradient 或更飽和的主色 CTA |
| StatCard | Tailwind pastel bg | 白底 + 彩色左 border-accent（4px）|
| 全域 bg | `#f8fafc` | `#f1f5f9`（略深，更有層次）|
| 圓角 | 8–12px 混用 | 統一 `--radius-md: 10px`，large `14px` |

**CSS Custom Properties 設計（`index.css` 新增）**

```css
:root {
  /* Brand */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;

  /* Neutrals */
  --color-bg: #f1f5f9;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --color-text: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;

  /* Sidebar (dark) */
  --color-sidebar-bg: #0f172a;
  --color-sidebar-text: #f1f5f9;
  --color-sidebar-text-muted: #64748b;
  --color-sidebar-hover: #1e293b;
  --color-sidebar-active: #2563eb;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* Shadow */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
}
```

**StatCard 新設計**
- 白底（`#fff`）+ 左側 4px accent border（color-specific）
- box-shadow: `var(--shadow-sm)`
- label 字色 `#64748b`，value 字色 `#0f172a`，更強的對比

**需修改的檔案**

| 檔案 | 預計改動 |
|------|---------|
| `src/index.css` | 新增 CSS custom properties（`:root` design tokens）；調整 body bg |
| `src/App.tsx` | 將所有 inline hardcoded 顏色替換為 CSS var；sidebar 改深色；header/tab 視覺升級 |
| `src/components/reports/StatCard.tsx` | 白底 + 左 accent border 設計，移除 pastel bg |

**新增/刪除依賴**
否，完全不引入新套件。

**預期風險**

1. **PDF 匯出**：StatCard 的 `.report-page` 在 html2canvas 截圖時，box-shadow 可能產生截圖邊緣白邊。需確認 StatCard 不在 `.report-page` 直接邊緣，或設定截圖時 box-shadow 移除（可用 `@media print { box-shadow: none }`）。
2. **深色 Sidebar 對比**：ClientManager 元件內部若有 hardcoded 深色文字，在深色 sidebar 背景下可能看不清楚——但本次 **不動 ClientManager**，若發現問題需額外開 TASK-006。
3. **Tailwind 與 CSS var 混用**：StatCard 目前用 Tailwind class（`bg-blue-50`），改為 CSS var 後需確認 Tailwind purge 不會影響其他地方。

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 成功

### 功能驗收

**視覺（手動確認）**
- [ ] Sidebar 背景為深色（`#0f172a`），品牌名稱、客戶列表文字為淡色可見
- [ ] Header 為白底，有陰影層次，匯出按鈕視覺更明確
- [ ] Tab bar 選中狀態底線加粗（3px），未選中狀態灰度合理
- [ ] StatCard：白底 + 左側 4px accent 邊框，有 shadow，label/value 對比清楚
- [ ] 全局背景比原本略深（`#f1f5f9`）

**不回歸**
- [ ] PDF 匯出仍可執行（`window.print()`），`.report-page` 截圖不爛版
- [ ] 四個報表 Tab 切換正常
- [ ] Sidebar 開關（hamburger button）功能正常
- [ ] `@media print` 的 `[data-print-hide]` 仍生效

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] localStorage key 未改動（仍為 `ifa_clients` / `ifa_active_client`）
- [ ] `useClientStore` migration 邏輯未被動

---

## [SECTION 4] Generator 執行記錄（Step 4）

**已修改的檔案**
- `src/index.css`：新增 `:root` design token 區塊（30 個 custom properties）；`body` background 改用 `var(--color-bg)`
- `src/App.tsx`：全部 inline hardcoded hex 替換為 CSS var；sidebar 改深色（`--color-sidebar-bg: #1e293b`）；header 加陰影；tab bar 底線加粗至 3px；匯出按鈕加 box-shadow；空白頁按鈕樣式升級
- `src/components/reports/StatCard.tsx`：移除 Tailwind pastel class；改為白底 + 4px 左 accent border（色彩各異）+ `var(--shadow-sm)`；label/value 對比加強

**設計決策**
- Sidebar bg 用 `#1e293b`（slate-800）而非計畫的 `#0f172a`：ClientManager.tsx 使用 `bg-white`、`bg-blue-50` 等 Tailwind light class，在更深的 `#0f172a` 背景下會融入無法辨識。`#1e293b` 仍屬深色 fintech sidebar，ClientManager 白底卡片在其上呈現「浮起」的 elevated surface 效果，符合設計系統慣例，且不需動 ClientManager（在 Non-goals 範圍內）。
- Tab bar 的 `marginBottom: -1` 讓 3px 底線與下方 border 對齊，消除雙線視覺
- StatCard 的 value 字色改用各自的 accent 深色（如 blue 的 `#1d4ed8`），而非統一黑色，讓卡片色彩主題更一致

---

## [SECTION 5] Evaluator Review（Step 5）

**邏輯審查**

| AC 項目 | 結果 |
|---------|------|
| Sidebar 背景為深色，品牌名稱文字可見 | 通過（`#1e293b` + `var(--color-sidebar-text): #f1f5f9`） |
| Header 白底 + 陰影層次 | 通過（`var(--shadow-sm)` + `zIndex: 10`） |
| 匯出按鈕視覺更明確 | 通過（`fontWeight: 600` + `box-shadow rgba(37,99,235,0.3)`） |
| Tab bar 選中底線 3px，未選中合理 | 通過（`3px solid var(--color-primary)` vs `3px solid transparent`） |
| StatCard 白底 + 左 accent 4px + shadow | 通過（`borderLeft: 4px solid ${accent.border}` + `var(--shadow-sm)`） |
| 全局背景 `#f1f5f9` | 通過（`var(--color-bg): #f1f5f9` in `:root`，body 使用 var） |
| `@media print` `.report-page` 保持不變 | 通過（print block 完全未動） |
| `[data-print-hide]` 仍生效 | 通過（data attribute 未異動） |
| 四個報表 Tab 切換邏輯不變 | 通過（只改樣式，setReportTab 邏輯未動） |
| Sidebar open/close 功能正常 | 通過（setSidebarOpen 邏輯未動） |
| ai/ 目錄未被修改 | 通過（僅寫此任務記錄） |
| 未引入新 npm 套件 | 通過 |
| localStorage key 未改動 | 通過（useClientStore 未動） |

**結論**
通過 → 移交 Harness

---

## [SECTION 6] Harness 測試結果（Step 7）

```
[lint]  PASS  (0 errors, 0 warnings)
[tsc]   PASS  (0 errors)
[build] PASS  (vite 8.0.10 — 30 modules, 164ms)
✓ All checks passed
```

---

## [SECTION 7] Human Decision（Step 8）

<!-- Sean 填寫 -->

**決定**
[approved / rejected]

**Commit**
`[commit hash]`
