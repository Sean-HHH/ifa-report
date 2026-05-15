# TASK-040 — 快照與資產總計的 FX 換算 Bug 修正

---

## [SECTION 1] 任務描述

**來源需求**
「左邊的資產總計 182 萬是不是算錯了？」「快照結果有 -12 萬，有 bug 吧」

**背景**
兩個相關 bug，根因相同：非 TWD 資產的 `amount` 以原幣存放，但加總時未經 FX 換算，導致與報表數字不一致；快照的 `openingAssets` 用 `totalAssetsConverted`（有換算），但 `closingAssets`、`draftTotal`、`actualClosing` 均用 raw reduce（無換算），造成假損益。

**Objective**
AssetTab header 總計、快照 closingAssets、draftTotal、收倉 actualClosing 均與報表一致（FX 換算後的數字）。

**作業檔案**
- `src/features/input/tabs/AssetTab.tsx`
- `src/features/assets/SnapshotPanel.tsx`

---

## [SECTION 4] Generator 執行記錄

**已修改的檔案**
- `AssetTab.tsx`：`totalAssetsRaw` 改用 `convertCurrency`（當 rates 存在時）
- `SnapshotPanel.tsx`：import `convertCurrency`；`newTotal`、`draftTotal`、`actualClosing` 三處改用 `convertCurrency` 換算至 `reportCurrency`

---

## [SECTION 6] Harness 測試結果

```
[tsc]   PASS
[build] PASS
```

---

## [SECTION 7] Human Decision

**決定** approved
**Commit** `9b80f82`（AssetTab）、`f5d801d`（SnapshotPanel）
