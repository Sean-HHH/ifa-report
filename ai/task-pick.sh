#!/usr/bin/env bash
# ai/task-pick.sh — Agent 領取任務，建立 worktree
# 用法：bash ai/task-pick.sh TASK-001
# 無參數時：列出所有 open 任務

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TASKS_DIR="$SCRIPT_DIR/tasks"

# 無參數：列出 open 任務
if [ -z "$1" ]; then
  echo "=== Open Tasks ==="
  OPEN_TASKS=$(find "$TASKS_DIR/open" -name "TASK-*.md" | sort)
  if [ -z "$OPEN_TASKS" ]; then
    echo "  (無待領取的任務)"
  else
    for f in $OPEN_TASKS; do
      TASK_ID=$(basename "$f" .md | grep -oE 'TASK-[0-9]+')
      TITLE=$(head -1 "$f" | sed 's/^# //' | sed "s/^$TASK_ID — //")
      echo "  [$TASK_ID] $TITLE"
    done
  fi
  echo ""
  echo "用法：bash ai/task-pick.sh TASK-001"
  exit 0
fi

TASK_ID="$1"
OPEN_FILE=$(find "$TASKS_DIR/open" -name "${TASK_ID}-*.md" | head -1)

if [ -z "$OPEN_FILE" ]; then
  echo "✗ 找不到 open 任務：$TASK_ID"
  echo "  執行 bash ai/task-pick.sh 查看所有 open 任務"
  exit 1
fi

FILENAME=$(basename "$OPEN_FILE")
INPROG_FILE="$TASKS_DIR/in-progress/$FILENAME"
BRANCH_NAME="task/$(echo "$TASK_ID" | tr '[:upper:]' '[:lower:]')"

# 移動任務文件到 in-progress
mv "$OPEN_FILE" "$INPROG_FILE"
echo "✓ 任務狀態：open → in-progress"
echo "  檔案：ai/tasks/in-progress/$FILENAME"
echo ""

# 建立 git worktree（若目前在 git repo 內）
WORKTREE_PATH="${PROJECT_DIR}/../ifa-report-${TASK_ID,,}"
if git -C "$PROJECT_DIR" rev-parse --git-dir > /dev/null 2>&1; then
  if git -C "$PROJECT_DIR" worktree list | grep -q "$BRANCH_NAME"; then
    echo "! Worktree 已存在，跳過建立"
  else
    git -C "$PROJECT_DIR" worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" 2>/dev/null && \
      echo "✓ Worktree 建立：$WORKTREE_PATH" && \
      echo "  Branch：$BRANCH_NAME" || \
      echo "! Worktree 建立失敗，請手動切換分支：git checkout -b $BRANCH_NAME"
  fi
else
  echo "! 非 git repo，跳過 worktree 建立"
fi

echo ""
echo "=== Agent 啟動指令 ==="
echo ""
echo "請先讀取 ai/ 目錄下所有 harness 檔案，再讀取以下任務文件："
echo ""
echo "  任務文件：ai/tasks/in-progress/$FILENAME"
echo "  工作目錄：$WORKTREE_PATH（或目前目錄）"
echo ""
echo "讀完後依 WORKFLOW.md Step 2 開始 Planner 拆解。"
