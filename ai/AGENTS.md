# AGENTS.md — Agent 工作規則與角色定義

## 啟動協議

每次任務開始，agent 必須依以下順序讀取 harness 檔案：

```
1. ai/PROJECT.md      ← 專案地圖（從哪裡找什麼）
2. ai/PRODUCT.md      ← 功能邊界（做什麼、不做什麼）
3. ai/DECISIONS.md    ← 已鎖定的取捨（不得推翻）
4. ai/AGENTS.md       ← 自己的工作規則（本檔）
5. ai/WORKFLOW.md     ← 流程與交付格式
6. ai/EVALS.md        ← 驗收標準
7. ai/TEST_COMMANDS.md ← 可執行的測試指令
```

讀完後宣告：「已讀取 harness：[列出檔案名]，開始處理任務。」

## 可改動範圍（白名單）

以下是 agent 被允許修改的範圍：

```
src/
  types/client.ts          ← 型別定義
  hooks/useClientStore.ts  ← 客戶邏輯（含 migration）
  utils/calculations.ts    ← 財務計算
  utils/pdfExport.ts       ← PDF 邏輯
  components/InputForm/    ← 輸入表單
  components/reports/      ← 三份報表元件
  components/ClientManager/ ← 客戶列表 UI
  App.tsx                  ← 主佈局（謹慎）
  index.css                ← 全域樣式（謹慎）
```

**不在白名單的路徑，必須先告知 Sean 並獲得確認才能修改。**

---

## Role 定義

### Planner
**職責**：理解需求、拆解步驟、識別風險，不寫任何程式碼。

輸入：任務描述 + `ai/PROJECT.md` + `ai/PRODUCT.md` + `ai/DECISIONS.md`

輸出格式：
```
理解確認：[用自己的話重述任務]
需修改檔案：[檔案清單，含預計修改位置]
新增/刪除依賴：是 / 否（若是，說明原因）
潛在風險：[至多 3 項]
```

### Generator
**職責**：依 Planner 輸出執行程式碼變更。

規則：
- 每個檔案必須先 Read 再 Edit，絕不盲寫
- 一次只改一個關注點（single concern per edit）
- 不加多餘 comment，除非邏輯非顯而易見
- TypeScript 嚴格模式：不用 `any`，不留 `TODO`
- 禁止引入新 npm 套件（除非 Planner 明確指定且 Sean 確認）

### Evaluator
**職責**：驗收 Generator 的改動是否符合品質標準。

行動順序：
1. `npm run lint`
2. `npx tsc --noEmit`
3. 對照 `ai/EVALS.md` 執行功能正確性驗收
4. 若失敗 → 回報具體錯誤，請 Generator 修正後重跑

輸出格式：
```
通過：[列出通過的驗收項目]
失敗：[列出失敗項目 + 具體錯誤訊息]
```

---

## 禁止事項（所有 agent）

- **禁止修改 `ai/` 目錄下任何檔案**（harness 由人類維護，agent 只讀）
- 禁止在 localStorage key 以外新增持久化機制（無 IndexedDB、無 sessionStorage）
- 禁止新增 CSS framework 或 UI component library
- 禁止刪除 `useClientStore.ts` 內的 backward migration 邏輯
- 禁止更動 `.github/workflows/deploy.yml`，除非任務明確涉及 CI/CD
- 禁止修改 Vite base path（`/ifa-report/`），除非任務明確要求

---

## 重要慣例

- 所有財務計算邏輯放在 `src/utils/calculations.ts`，不散落組件
- Chart.js 設定放在各 Report 組件內部，不抽全域 chart config
- 新的客戶資料欄位必須同步：`types/client.ts` → `useClientStore.ts` migration → `InputForm` → 對應報表
- Schema migration 版本號遞增（目前 v3），新欄位必須有預設值
