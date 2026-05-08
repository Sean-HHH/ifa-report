#!/usr/bin/env bash
# ai/task-log.sh — 顯示所有任務狀態一覽
# 用法：bash ai/task-log.sh [--all | --open | --done]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TASKS_DIR="$SCRIPT_DIR/tasks"

FILTER="${1:---all}"

print_section() {
  local label="$1"
  local dir="$2"
  local tasks
  tasks=$(find "$dir" -name "TASK-*.md" 2>/dev/null | sort)
  [ -z "$tasks" ] && return

  echo ""
  echo "── $label ──────────────────────────────────"
  for f in $tasks; do
    TASK_ID=$(basename "$f" .md | grep -oE 'TASK-[0-9]+')
    TITLE=$(head -1 "$f" | sed 's/^# //' | sed "s/^$TASK_ID — //")
    COMMIT=$(grep -A2 '^\*\*Commit\*\*' "$f" 2>/dev/null | grep -oE '`[a-f0-9]{7,}`' | tr -d '`' | head -1)
    DATE=$(stat -f "%Sm" -t "%Y-%m-%d" "$f" 2>/dev/null || stat -c "%y" "$f" 2>/dev/null | cut -c1-10)

    if [ -n "$COMMIT" ]; then
      printf "  %-10s %-40s %s  %s\n" "[$TASK_ID]" "$TITLE" "$DATE" "commit:$COMMIT"
    else
      printf "  %-10s %-40s %s\n" "[$TASK_ID]" "$TITLE" "$DATE"
    fi
  done
}

echo "=== IFA-Report Task Log ==="
echo "$(date '+%Y-%m-%d %H:%M')"

case "$FILTER" in
  --open)
    print_section "OPEN      (待領取)" "$TASKS_DIR/open"
    ;;
  --done)
    print_section "DONE      (已完成)" "$TASKS_DIR/done"
    ;;
  *)
    print_section "OPEN      (待領取)" "$TASKS_DIR/open"
    print_section "IN PROGRESS (進行中)" "$TASKS_DIR/in-progress"
    print_section "REVIEW    (待審查)" "$TASKS_DIR/review"
    print_section "DONE      (已完成)" "$TASKS_DIR/done"
    ;;
esac

# 統計
OPEN_N=$(find "$TASKS_DIR/open" -name "TASK-*.md" 2>/dev/null | wc -l | tr -d ' ')
PROG_N=$(find "$TASKS_DIR/in-progress" -name "TASK-*.md" 2>/dev/null | wc -l | tr -d ' ')
REV_N=$(find "$TASKS_DIR/review" -name "TASK-*.md" 2>/dev/null | wc -l | tr -d ' ')
DONE_N=$(find "$TASKS_DIR/done" -name "TASK-*.md" 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "────────────────────────────────────────────"
echo "  Open: $OPEN_N  |  In Progress: $PROG_N  |  Review: $REV_N  |  Done: $DONE_N"
echo ""
