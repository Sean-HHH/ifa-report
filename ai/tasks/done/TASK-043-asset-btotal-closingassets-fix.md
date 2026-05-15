# TASK-043 — 資產變化 bTotal 使用 closingAssets 修正

---

## [SECTION 1] 任務描述

**來源需求**
「bug? 總資產有變動卻沒反應在 UI」— 資產變化 tab 的「總資產」列顯示 165萬 → 165萬（+0），但 P&L 卡正確顯示 173萬。

**背景**
`bTotal`（右側「B 端」總資產）在 2+ 快照情境下使用 `toSnap.openingAssets`（快照建立時記錄的起始值），而非 `toSnap.closingAssets`（快照實際記錄的期末值），導致 A 端與 B 端實際上指向同一個快照的相同欄位，變動永遠為 0。P&L strip 的計算走 `calcPeriodPnL`（讀 `closingAssets`），因此正確；只有總資產列異常。

**Objective**
`bTotal` 在 2+ 快照時改用 `toSnap.closingAssets`，fallback 為 `totalAssetsConverted`（目前資產）。

**作業檔案**
- `src/features/assets/AssetReport.tsx`

---

## [SECTION 4] Generator 執行記錄

**已修改的檔案**
- `AssetReport.tsx` line 367：`toSnap?.openingAssets ?? 0` → `toSnap?.closingAssets ?? totalAssetsConverted(client, rates, reportCurrency)`

**設計決策**
快速路徑（1 行、無型別與計算邏輯變更）。Fallback 改為 `totalAssetsConverted` 而非 `0`，確保單快照 case 的邏輯一致性（B 端缺失時顯示目前值而非歸零）。

---

## [SECTION 6] Harness 測試結果

```
[tsc]   PASS
[build] PASS
```

---

## [SECTION 7] Human Decision

**決定** approved
**Commit** `b850125`
