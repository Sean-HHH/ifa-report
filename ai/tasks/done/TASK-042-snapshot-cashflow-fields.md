# TASK-042 — 快照資金流動欄位（淨投入 + 配息）

---

## [SECTION 1] 任務描述

**來源需求**
「比較快照時，如果有賣出股票，P&L 會怎麼計算跟正確反映？」→ 決議：在建立快照前填入本期淨投入與配息，讓系統拆解市場損益。同時將「市場損益」改名為「淨資產變動」（當無 Ledger 資料時）。

**背景**
Ledger 隱藏後，P&L 顯示的「市場損益」實際等於總變動，用語誤導。需要在快照建立時讓 IFA 填入外部資金流動，才能正確拆解市場損益 = 總變動 − 淨投入 − 配息。第一張快照（無前期基準）不需填寫。

**Objective**
第二張起的快照 create form 顯示「本期資金流動」區塊（淨投入、配息），P&L strip 依有無資料自動切換顯示標籤。

**作業檔案**
- `src/features/assets/SnapshotPanel.tsx`
- `src/features/assets/AssetReport.tsx`

---

## [SECTION 4] Generator 執行記錄

**已修改的檔案**
- `SnapshotPanel.tsx`：新增 `draftNetContribution`、`draftDividendIncome` state；create form 加入資金流動區塊（snapshots.length > 0 才顯示）；preview 行加入市場損益估算；`confirmCreate` 帶入兩個值；P&L strip 邏輯：有 decomposition → 顯示「市場損益」，無 → 顯示「淨資產變動」
- `AssetReport.tsx`：P&L 卡同邏輯；去除恆為 0 的淨投入/配息/費用卡；主卡依 `hasDecomposition` 切換標籤

**設計決策**
淨投入定義：從外部流入投資組合的資金（增資為正，提領為負）。賣股換現留在組合內 = 0（內部流動）。UI 說明文字直接標注。

---

## [SECTION 6] Harness 測試結果

```
[tsc]   PASS
[build] PASS
```

---

## [SECTION 7] Human Decision

**決定** approved
**Commit** `e46e8e2`（標籤改名）、`1f947ed`（資金流動欄位）
