# TEST_COMMANDS.md — 可直接執行的指令清單

所有指令以 `ifa-report/` 為工作目錄執行。

---

## 必跑（每次任何改動後）

```bash
npm run lint
npx tsc --noEmit
```

**預期結果：** 兩者均無任何 error 或 warning 輸出。

---

## 開發驗證

```bash
# 啟動開發伺服器，用瀏覽器手動驗收 UI 與功能
npm run dev
# → http://localhost:5173

# 確認 production build 正常
npm run build

# 預覽 production build（與 GitHub Pages 行為接近）
npm run preview
# → http://localhost:4173
```

---

## 驗證 TypeScript 型別

```bash
# 只做型別檢查，不輸出編譯產物
npx tsc --noEmit

# 看詳細錯誤（含行號）
npx tsc --noEmit --pretty
```

---

## 驗證 ESLint

```bash
# 掃整個 src/
npm run lint

# 只掃特定檔案
npx eslint src/utils/calculations.ts
npx eslint src/components/reports/RetirementReport.tsx
```

---

## localStorage 操作（Browser DevTools Console）

```javascript
// 查看所有客戶資料
JSON.parse(localStorage.getItem('ifa_clients') || '[]')

// 查看目前選中的 client id
localStorage.getItem('ifa_active_client')

// 清除所有資料（測試 migration / 重置用）
localStorage.clear()

// 手動插入測試客戶（測試 migration 用）
localStorage.setItem('ifa_clients', JSON.stringify([
  { id: 'test-001', name: '測試客戶', updatedAt: new Date().toISOString() }
]))
```

---

## 驗證 PDF 匯出

無自動化測試，手動步驟：

1. `npm run dev` 啟動伺服器
2. 建立測試客戶，填入資料
3. 點擊「匯出 PDF」按鈕
4. 確認項目：
   - 三份報表各佔一頁
   - 中文字體顯示正常（非豆腐塊）
   - 數字格式正確（萬/億）
   - 截圖範圍不含 sidebar 與 InputForm

---

## 驗證 Chart.js 圖表

無自動化測試，手動步驟：

1. `npm run dev` 啟動伺服器
2. 建立測試客戶，填入收支與資產資料
3. 切換三個報表 tab，確認：
   - CashFlow：Pie chart + waterfall chart 有資料
   - AssetGrowth：三條折線（保守/基準/積極）可見差異
   - Retirement：缺口 bar chart + 提款 line chart 顯示正確

---

## 完整驗收流程（每次任務結束）

```bash
# 步驟 1：靜態檢查
npm run lint && npx tsc --noEmit

# 步驟 2：確認 build 通過
npm run build

# 步驟 3：手動啟動確認功能
npm run dev
```

三步驟全部通過後，進入 Evaluator 報告 → Sean 確認 → commit。
