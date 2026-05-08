#!/usr/bin/env bash
# ai/task-new.sh — 建立新任務
# 用法：bash ai/task-new.sh "任務標題"
# 範例：bash ai/task-new.sh "新增退休報表月儲蓄 KPI 卡片"

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TASKS_DIR="$SCRIPT_DIR/tasks"

if [ -z "$1" ]; then
  echo "用法：bash ai/task-new.sh \"任務標題\""
  exit 1
fi

TITLE="$1"
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-40)

# 找下一個可用的 task ID
LAST_ID=$(find "$TASKS_DIR" -name "TASK-*.md" | grep -oE 'TASK-[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1)
if [ -z "$LAST_ID" ]; then
  NEXT_ID="001"
else
  NEXT_ID=$(printf "%03d" $((10#$LAST_ID + 1)))
fi

TASK_ID="TASK-$NEXT_ID"
FILENAME="${TASK_ID}-${SLUG}.md"
FILEPATH="$TASKS_DIR/open/$FILENAME"

# 複製 TASK_TEMPLATE.md，替換 header
sed "s/TASK-\[ID\]/$TASK_ID/; s/\[任務標題\]/$TITLE/" "$SCRIPT_DIR/TASK_TEMPLATE.md" > "$FILEPATH"

echo "✓ 任務建立：ai/tasks/open/$FILENAME"
echo ""
echo "下一步："
echo "  1. 開啟 $FILEPATH，填寫 SECTION 1（任務描述）"
echo "  2. 交給 Planner：bash ai/task-pick.sh $TASK_ID"
