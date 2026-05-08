# AC_TEMPLATE.md — Acceptance Criteria 模板

每個任務的驗收標準，由 Planner 在規劃階段填寫，Evaluator 在驗收時逐項確認。

---

## 模板（複製使用）

```
## AC — [任務標題]

### 必跑（每次）
- [ ] `npm run lint` → 0 errors, 0 warnings
- [ ] `npx tsc --noEmit` → 0 errors

### 功能驗收
（從下方選擇對應類別，刪除不需要的）

**計算邏輯**
- [ ] [具體計算結果與預期值一致]
- [ ] [邊界條件：___]

**資料欄位**
- [ ] types/client.ts 型別已更新
- [ ] useClientStore migration 補齊舊資料預設值
- [ ] InputForm 有對應輸入欄位
- [ ] 報表中有顯示

**UI**
- [ ] [具體視覺呈現符合預期]
- [ ] .report-page 截圖乾淨（若涉及報表）

**PDF**
- [ ] [PDF 輸出結果符合預期]

### 禁止事項確認（Evaluator 必查）
- [ ] ai/ 目錄下檔案未被修改
- [ ] 未新增新的 npm 套件（或已獲 Sean 確認）
- [ ] localStorage key 未改動（仍為 ifa_clients / ifa_active_client）
- [ ] useClientStore migration 邏輯未刪除

### 交付格式
- [ ] Diff summary 已呈現（改了什麼、為什麼）
- [ ] Commit message 格式正確：`<type>(<scope>): <description>`
- [ ] 等待 Sean 確認後才執行 commit
```

---

## 範例（已填寫）

```
## AC — 在退休報表頂部新增「建議月儲蓄金額」KPI 卡片

### 必跑（每次）
- [ ] `npm run lint` → 0 errors, 0 warnings
- [ ] `npx tsc --noEmit` → 0 errors

### 功能驗收

**計算邏輯**
- [ ] StatCard 顯示的金額 = calcRetirement().requiredMonthlySavings
- [ ] fmtNTD 格式：若 > 1萬，顯示「X.X萬」

**UI**
- [ ] StatCard 顏色為 orange
- [ ] 卡片位置在退休 StatCard 區塊內，順序合理
- [ ] .report-page 截圖包含新卡片（位置在截圖範圍內）

### 禁止事項確認（Evaluator 必查）
- [ ] ai/ 目錄下檔案未被修改
- [ ] 未新增新的 npm 套件
- [ ] localStorage key 未改動
- [ ] useClientStore migration 邏輯未刪除

### 交付格式
- [ ] Diff summary 已呈現
- [ ] Commit message：`feat(reports): add required monthly savings KPI to RetirementReport`
- [ ] 等待 Sean 確認後才執行 commit
```

---

## 使用流程

1. **Planner** 在規劃輸出時，同步填寫對應的 AC（複製模板，填入具體內容）
2. **Sean** 確認 Planner 計畫時，一併確認 AC 是否完整
3. **Evaluator** 完成後逐項打勾，未通過的項目列出具體錯誤訊息
4. AC 全部通過後才進入 Human Approval 步驟
