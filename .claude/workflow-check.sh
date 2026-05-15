#!/bin/bash
# Injected as system reminder on every user message in ifa-report project.
# Reminds Claude to follow WORKFLOW.md before acting.

cat <<'MSG'
[ifa-report workflow guard]
在回應任何技術需求前，確認以下三點：
1. 啟動協議完成了嗎？（已讀 ai/PROJECT、PRODUCT、DECISIONS、AGENTS、WORKFLOW）
   若尚未讀取 → 先讀完再回應，不可跳過。
2. 這個需求是「快速路徑」（≤5行、無型別/計算邏輯）還是「plan mode 任務」？
   → 先聲明判斷，等 Sean 確認後才動手。
3. commit 前必須獲得 Sean 明確確認；commit 後立刻執行 Step 9 文件更新。
MSG
