# EVALS.md — 驗收標準與常見失敗案例

## 必跑（每次改動，無論範圍）

```bash
npm run lint       # 0 errors, 0 warnings
npx tsc --noEmit   # 0 errors
```

---

## 功能正確性驗收（依改動範圍選擇）

### A. 計算邏輯（`calculations.ts`）

- [ ] `calcCashFlow`：月總收入 - 月總支出 = 正確月淨額
- [ ] `calcAssetGrowth`：保守 < 基準 < 積極，三條線可見差異
- [ ] `calcRetirement`：退休缺口 = 目標資產 - 預期資產；提款曲線 30 年不出現負資產（在足夠資產前提下）
- [ ] `fmtNTD`：金額 ≥ 1 億顯示「億」，≥ 1 萬顯示「萬」，否則顯示完整數字
- [ ] `fmtPct`：百分比顯示正確，無多餘小數

### B. 新增客戶資料欄位

- [ ] `types/client.ts` 已更新型別定義
- [ ] `useClientStore.ts` 有對應的 migration 邏輯，舊客戶資料不遺失
- [ ] `ClientProfile` 新欄位有預設值（migration 補齊舊資料）
- [ ] 欄位在 `InputForm` 中可輸入
- [ ] 欄位在對應報表中有顯示

### C. UI 元件改動

- [ ] Tailwind class 未衝突，`npm run build` 無警告
- [ ] `.report-page` 元素截圖乾淨（不含 sidebar、InputForm、tabs）
- [ ] StatCard 使用正確的顏色 token（blue / green / red / orange / purple）

### D. PDF 匯出

- [ ] `html2canvas` 正確捕捉所有 `.report-page` 節點
- [ ] 多頁 PDF 分頁正確，無截斷
- [ ] 中文字體（CJK）在 PDF 中顯示正常（非亂碼、非豆腐塊）
- [ ] PDF 寬度 = A4（210mm），高度依內容動態計算

### E. Chart.js 改動

- [ ] `chartjs-plugin-datalabels` 使用 Chart.js 4.x 相容 API
- [ ] tooltip callback 格式一致（`fmtNTD` 或 `fmtPct`）
- [ ] 響應式：`maintainAspectRatio: false` 時 container 需有明確高度

---

## E2E Critical Path（手動，無 Playwright）

每次影響「主流程」的改動必須手動跑完此路徑：

```
1. npm run dev → http://localhost:5173
2. 點「新增客戶」，輸入名稱
3. InputForm：輸入月薪 80000、房租 20000（固定）、飲食 10000（變動）
4. InputForm：輸入資產 100萬（現金）、月定期投入 10000
5. InputForm：設定目前年齡 35、退休年齡 60、退休月收目標 50000
6. 切換到「現金流」tab → 確認 Pie chart 有資料、月淨現金流 = 50000
7. 切換到「資產成長」tab → 確認三條折線（保守/基準/積極）可見差異
8. 切換到「退休規劃」tab → 確認缺口分析有數字、提款曲線 30 年
9. 點「匯出 PDF」→ 確認三頁 PDF 生成，中文顯示正常
10. 重新整理頁面 → 客戶資料仍存在（localStorage 持久化）
```

預期時間：5–10 分鐘。若無法完整跑完，不得進入 final approval。

---

## 常見失敗案例（歷史紀錄）

| 錯誤類型 | 說明 | 預防方式 |
|----------|------|----------|
| localStorage key 錯誤 | 用了不同的 key 名稱導致讀不到舊資料 | 只用 `ifa_clients` / `ifa_active_client` |
| jsPDF 單位混淆 | html2canvas 回傳 px，jsPDF 用 mm，換算錯誤 | 換算公式：`px / devicePixelRatio / 3.7795` |
| Chart.js 版本 API | chartjs-plugin-datalabels v2 API 與 Chart.js 3.x 不同 | 對照 Chart.js 4.x 文件 |
| React 19 ref 型別 | React 19 的 `useRef` 回傳型別與 React 18 不同 | `useRef<HTMLDivElement>(null)` 需明確泛型 |
| Migration 遺漏欄位 | 新欄位加了型別但忘記在 migration 補預設值 | 每次改 types 必連動改 migration |
| TypeScript strict | `noUnusedLocals` / `noUnusedParameters` 嚴格模式 | 不留 dead code，不留未用 import |
