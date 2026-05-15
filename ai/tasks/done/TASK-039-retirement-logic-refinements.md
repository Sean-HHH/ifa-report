# TASK-039 — 退休規劃邏輯修正

---

## [SECTION 1] 任務描述

**來源需求**
「月退年金不需隨通膨走，確實要保守看；不可以把不動產當成流動資產一起提領；UI 不要顯示『液態資產』應是流動資產」

**Branch 名稱**
`main`（未走 worktree，直接在 main 實作）

**背景**
TASK-038 退休規劃改版完成後，發現三個邏輯問題：(1) 月退年金先扣後通膨，等於假設年金跟著通膨走，實際上台灣勞保月退未必調升；(2) 不動產計入退休缺口比較，但不動產通常難以提領；(3) UI 用語「液態資產」不直觀。

**Objective**
退休缺口比較與提領模擬僅計算可提領資產（流動 + 一次性退休金），不動產獨立顯示；月退年金以名目固定值計算（保守假設）。

**作業檔案**
- `src/features/retirement/calc.ts`
- `src/features/retirement/RetirementReport.tsx`

---

## [SECTION 4] Generator 執行記錄

**已修改的檔案**
- `retirement/calc.ts`：新增 `projectedRealEstateBase`、`projectedUsableBase`；pension 改為退休名目固定值；gap / simulation 改用 `projectedUsableBase`
- `retirement/RetirementReport.tsx`：資產來源卡重組；不動產另列標注「不計入缺口」；「液態資產」→「流動資產」；假設說明行更新

**設計決策**
保守假設：年金購買力隨時間侵蝕，讓缺口計算寧可高估也不低估。不動產保留在資產來源卡顯示，但不參與缺口與提領模擬，避免誤導客戶。

---

## [SECTION 6] Harness 測試結果

```
[tsc]   PASS
[build] PASS
```

---

## [SECTION 7] Human Decision

**決定** approved
**Commit** `5c48c8c`
