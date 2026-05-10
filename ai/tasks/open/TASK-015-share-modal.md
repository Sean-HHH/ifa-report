# TASK-015 — IFA 端分享 Modal

<!-- 狀態由資料夾決定：open / in-progress / review / done -->

---

## [SECTION 1] 任務描述（Planner 填寫）

**來源需求**
客戶端模式功能：IFA 設定密碼與可見模塊後，產生分享連結。

**Branch 名稱**
`task/TASK-015-share-modal`

**背景**
IFA 完成快照編輯後，需要一個入口設定分享條件（密碼 + 可見模塊），並將快照資料寫入 Supabase，取得可分享的 `/c/:id` 連結。

**Objective（成功定義）**
IFA 在 app 內點擊「分享」按鈕，填入密碼並選擇可見模塊，確認後取得一條可複製的短連結。

**要求（Scope）**
1. 新增 `src/features/share/ShareModal.tsx`：
   - 密碼輸入欄（明文輸入，送出前 SHA-256 hash）
   - 可見模塊勾選清單（`VisibleModules` 四個欄位）
   - 確認按鈕：呼叫 Supabase insert，取得 UUID → 組成連結
   - 成功後顯示可複製的連結（Click to copy）
2. `src/App.tsx` 加入「分享當前快照」按鈕（僅在有 activeClient 時顯示），點擊開啟 ShareModal

**不做什麼（Non-goals）**
- 不實作「撤銷連結」或「更新連結」功能
- 不做連結過期邏輯（expires_at 留空）
- 不修改 ClientView 相關頁面

**作業檔案（實作範圍）**
- `src/features/share/ShareModal.tsx`（新增）
- `src/App.tsx`（加分享按鈕 + modal state）

**Test Expectation（如何測試）**
1. `npm run dev`，建立測試客戶並輸入資料
2. 點擊「分享」按鈕 → ShareModal 開啟
3. 輸入密碼「test123」、勾選「資產成長圖」與「基本資料」
4. 點擊確認 → 應顯示連結（格式：`http://localhost:5173/#/c/[uuid]`）
5. 複製連結，新分頁貼上 → 進入密碼驗證頁（Client View，TASK-016 完成後可驗證）
6. 邊界案例：密碼欄空白時確認按鈕不可點擊

**驗收重點**
1. ShareModal 可開啟／關閉
2. Supabase 成功寫入一筆 shared_snapshots 記錄（可在 Supabase console 確認）
3. 密碼以 SHA-256 hash 儲存（非明文）
4. 連結格式正確，可複製

---

## [SECTION 2] Planner 輸出（Step 2）

**理解確認**
這個 task 負責 IFA 端的分享操作入口，核心動作是：hash 密碼 → Supabase insert → 顯示連結。

**需修改的檔案**
| 檔案 | 預計改動 |
|------|---------|
| `src/features/share/ShareModal.tsx` | 新增完整元件 |
| `src/App.tsx` | 加分享按鈕 + modal open state |

**平行相容性**
可與以下 TASK 同時執行：TASK-016（作業檔案無交集）
需等以下 TASK 完成後才能開始：TASK-014（需要 SharedSnapshot 型別 + App routing）

**新增/刪除依賴**
否（SHA-256 使用瀏覽器內建 `crypto.subtle.digest`，不需額外套件）

**預期風險**
1. SHA-256 無鹽雜湊安全性較低，但對報表分享場景可接受；需在 Modal UI 提示 IFA 不要使用重要密碼
2. Supabase anon key 有 insert 權限，若 RLS 設定不當可能被濫用（TASK-014 的 SQL 已設定基本 policy）

---

## [SECTION 3] Acceptance Criteria（Step 2）

### 必跑
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → 通過

### 功能驗收
- [ ] 有 activeClient 時，UI 顯示「分享」按鈕
- [ ] ShareModal 可開啟，包含密碼欄與四個模塊勾選
- [ ] 密碼空白時確認按鈕 disabled
- [ ] 確認後 Supabase 寫入成功（console 可見 insert）
- [ ] 顯示可複製連結，格式為 `/#/c/[uuid]`
- [ ] 密碼欄輸入值在 Supabase 以 hash 儲存（非明文）

### 禁止事項確認
- [ ] ai/ 目錄未被修改
- [ ] 未引入新 npm 套件
- [ ] localStorage key 未改動
- [ ] 未修改 ClientView 相關頁面

---

## [SECTION 4] Generator 執行記錄（Step 4）

<!-- Generator 填寫 -->

**已修改的檔案**
- （待填）

**設計決策**
（待填）

---

## [SECTION 5] Evaluator Review（Step 5）

**邏輯審查**
| AC 項目 | 結果 |
|---------|------|
| ... | 待審 |

**結論**
待審

---

## [SECTION 6] Harness 測試結果（Step 7）

```
[等待執行]
```

---

## [SECTION 7] Human Decision（Step 8）

**決定**
pending

**備註**

**Commit**
`—`
