# TASK-041 — Ledger UI 隱藏與初始建倉移除

---

## [SECTION 1] 任務描述

**來源需求**
「這功能現在是不是用不到了？（初始建倉）」「交易紀錄的 UI 可以先隱藏起來。因為現在追蹤變化的用法變成是，更新 input 後快照。」

**背景**
工作流程已從「Ledger 驅動（逐筆記錄）」改為「更新 Input → 建立快照」。LedgerPanel 在新流程下缺乏使用路徑，初始建倉按鈕對新使用者造成困惑。決定隱藏而非刪除，保留日後重啟彈性。

**Objective**
SnapshotPanel 不渲染 LedgerPanel；初始建倉按鈕與 `createInitialEntry` 函數移除。

**作業檔案**
- `src/features/assets/LedgerPanel.tsx`
- `src/features/assets/SnapshotPanel.tsx`

---

## [SECTION 4] Generator 執行記錄

**已修改的檔案**
- `LedgerPanel.tsx`：移除 `createInitialEntry` 函數與對應 UI 區塊（共 -46 行）；空白 Ledger 統一顯示「尚未記錄任何交易」
- `SnapshotPanel.tsx`：LedgerPanel import 改為 comment；onUpdate/onCommit handler 區塊整體移除；留下 comment 標注原因

**設計決策**
元件、型別、資料結構（ledgerEntries）完整保留，僅隱藏渲染。決策記錄於 `ai/DECISIONS.md`。

---

## [SECTION 6] Harness 測試結果

```
[tsc]   PASS
[build] PASS
```

---

## [SECTION 7] Human Decision

**決定** approved
**Commit** `0c95438`（移除初始建倉）、`cdfa35b`（隱藏 LedgerPanel）
