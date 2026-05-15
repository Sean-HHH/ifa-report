# TASK-044 — UX/UI 改造 Phase 1–5（Lime Design System）

---

## [SECTION 1] 任務描述

**來源需求**
Sean 在 `ai/uxui-redesign-brief.md` 放入設計改造 brief，參考 Dribbble Financial Dashboard 設計語言，要求萃取設計語言（非 pixel-perfect clone）改造現有 UI。

**目標**
建立以 lime (#a3e635) 為 accent 的 fintech dashboard design system，從 token 層出發，逐層改造 shell、共用元件、報表頁面、輸入表單。

**作業範圍（5 Phases）**
- Phase 1：Design tokens（`src/index.css`）
- Phase 2：App shell + Sidebar（`App.tsx`、`ClientManager.tsx`）
- Phase 3：共用元件（`src/shared/` 新增 4 支、`StatCard` 重構）
- Phase 4：四個報表頁面視覺 pass
- Phase 5：InputForm 視覺微調

---

## [SECTION 4] Generator 執行記錄

**Phase 1 — `src/index.css`**
- 新增 `--color-lime` (#a3e635)、`--color-lime-hover`、`--color-lime-muted`、`--color-lime-bg`
- `--color-primary` 從藍 (#1E40AF) 改為近黑 (#111827)，用於 CTA 按鈕
- `--color-sidebar-active` 從藍 rgba 改為 lime rgba
- 新增 `--color-sidebar-active-text`
- 新增 `--chart-1~8` 統一圖表色盤
- focus-ring 從藍 → lime

**Phase 2 — `App.tsx`、`ClientManager.tsx`**
- Header 三個 toggle 按鈕 active state：lime border + lime-bg
- Report tab bar active 底線：lime
- Export PDF / CTA button boxShadow：移除藍色 tint
- ClientManager active item：lime border + lime text color
- 新增客戶 hover border：lime

**Phase 3 — `src/shared/`**
- 新增：`NoteTag.tsx`（從 CashFlowReport + AssetReport 提取）
- 新增：`EmptyState.tsx`（從 AssetReport 提取 EmptyHint）
- 新增：`SectionTitle.tsx`（uppercase small-cap 標題）
- 新增：`ChartCard.tsx`（圖表容器 wrapper）
- 重構：`StatCard.tsx`：移除彩色 top-border 和 tint bg，改為白卡 + 語義顏色數字 + lime dot indicator

**Phase 4 — 四個報表**
- 全頁 `<h3>` section title 改用 `SectionTitle` 元件
- CashFlowReport：財務健康指標 mini-cards 從 bg-slate-50 → white + border；時序 KPI pills 同步；收入列 bg-blue-50 → bg-slate-50；瀑布圖首棒改 lime
- RetirementReport：三個 detail card 從 bg-slate-50 → white + border；假設說明同步
- AssetGrowthReport：SectionTitle 套用
- AssetReport：EmptyHint → EmptyState，NoteTag 改用 shared

**Phase 5 — `InputForm.tsx`**
- Tab active：border-blue-800 → lime CSS var（inline style）
- Name input focus：focus:border-blue-300 → onFocus/onBlur lime handler

---

## [SECTION 6] Harness 測試結果

```
Phase 1: [tsc] PASS  [build] PASS
Phase 2: [tsc] PASS  [build] PASS
Phase 3: [tsc] PASS  [build] PASS（修正 useState import 遺漏）
Phase 4: [tsc] PASS  [build] PASS
Phase 5: [tsc] PASS  [build] PASS
```

---

## [SECTION 7] Human Decision

**決定** approved（逐 Phase 確認）
**Commits**
- `2097aa7` Phase 1+2 — lime tokens + shell
- `66c293d` Phase 3 — shared components + StatCard refactor
- `fd831e0` Phase 4 — report visual pass
- `5b459ba` Phase 5 — InputForm lime tabs
