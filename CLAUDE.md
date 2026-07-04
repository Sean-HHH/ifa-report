# CLAUDE.md — ifa-report 專案規則

## 啟動協議（每次對話必做，不可跳過）

**無論是新對話或 context 壓縮後恢復的對話**，收到第一個技術需求前，必須先完成以下步驟：

依序讀取：
1. `ai/PROJECT.md`
2. `ai/PRODUCT.md`
3. `ai/DECISIONS.md`
4. `ai/AGENTS.md`
5. `ai/WORKFLOW.md`
6. `ai/EVALS.md`
7. `ai/TEST_COMMANDS.md`

讀完後宣告：「已讀取 harness：[列出檔案名]，開始處理任務。」

**若 context 中已有 harness 內容的摘要，仍需重讀確認版本最新。**

---

## 任務入口規則

收到任何改動需求時，**必須先聲明以下判斷，再動手**：

> 「這是 [快速路徑 / plan mode 任務]，原因：[說明]。」

- **快速路徑**（≤ 5 行、typo / 樣式微調、無型別與計算邏輯）→ 直接實作，Harness 測試，等 Sean 確認後 commit
- **plan mode 任務**（> 5 行 / 涉及型別、計算、多檔案）→ 進入 plan mode 拆解 → Sean 確認 task → 才開始實作
- **任何 commit 前必須先獲得 Sean 明確確認**
- **每次 commit 後，立即執行 WORKFLOW.md Step 9 文件更新（不可跳過）**

---

## 可改動範圍（白名單）

```
src/
  types/client.ts
  features/auth/useAuth.ts
  features/auth/AuthGate.tsx
  features/client/useClientStore.ts   ← schema migration 在這裡
  features/cashflow/calc.ts
  features/cashflow/CashFlowReport.tsx
  features/assets/calc.ts
  features/assets/AssetReport.tsx
  features/assets/AssetGrowthReport.tsx
  features/assets/LedgerPanel.tsx
  features/assets/SnapshotPanel.tsx
  features/retirement/calc.ts
  features/retirement/RetirementReport.tsx
  features/input/InputForm.tsx
  features/input/tabs/*.tsx
  features/fx/
  features/share/ShareModal.tsx
  features/client/ClientManager.tsx
  pages/ClientView/
  shared/pdfExport.ts
  utils/calculations.ts
  App.tsx                             ← 謹慎
  index.css                           ← 謹慎
```

**不在白名單的路徑，必須先告知 Sean 並獲得確認才能修改。**

---

## 禁止事項

- `ai/` 目錄：**僅允許** WORKFLOW.md Step 9 的文件更新（PRODUCT / PROJECT / DECISIONS / WORKFLOW）；禁止修改其他 harness 檔案（AGENTS、EVALS、TEST_COMMANDS、task scripts）
- 禁止引入新 npm 套件（除非 Planner 明確指定且 Sean 確認）
- 禁止新增 CSS framework 或 UI component library
- 禁止刪除 `useClientStore.ts` 內的 backward migration 邏輯
- 禁止更動 `.github/workflows/deploy.yml`，除非任務明確涉及 CI/CD
- 禁止修改 Vite base path（`/ifa-report/`），除非任務明確要求
- 禁止新增第二個使用者帳號或修改 Auth 架構（目前為單使用者）
- 禁止修改 `ifa_clients` 表結構或 RLS policy，除非 Sean 明確確認

---

## 高衝突檔案（兩個 task 同時碰 → 必須串行）

- `src/types/client.ts`
- `src/features/client/useClientStore.ts`
- `src/App.tsx`
