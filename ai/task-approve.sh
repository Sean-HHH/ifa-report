#!/usr/bin/env bash
# ai/task-approve.sh — Sean 做 final approval，commit 並歸檔
# 用法：bash ai/task-approve.sh TASK-001 "commit message"

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TASKS_DIR="$SCRIPT_DIR/tasks"

if [ -z "$1" ]; then
  echo "=== Tasks in Review ==="
  REVIEW_TASKS=$(find "$TASKS_DIR/review" -name "TASK-*.md" | sort)
  if [ -z "$REVIEW_TASKS" ]; then
    echo "  (無等待 approval 的任務)"
  else
    for f in $REVIEW_TASKS; do
      TASK_ID=$(basename "$f" .md | grep -oE 'TASK-[0-9]+')
      TITLE=$(head -1 "$f" | sed 's/^# //')
      echo "  [$TASK_ID] $TITLE"
    done
  fi
  echo ""
  echo "用法：bash ai/task-approve.sh TASK-001 \"commit message\""
  exit 0
fi

TASK_ID="$1"
COMMIT_MSG="${2:-}"
REVIEW_FILE=$(find "$TASKS_DIR/review" -name "${TASK_ID}-*.md" | head -1)

if [ -z "$REVIEW_FILE" ]; then
  echo "✗ 找不到 review 任務：$TASK_ID"
  exit 1
fi

FILENAME=$(basename "$REVIEW_FILE")
DONE_FILE="$TASKS_DIR/done/$FILENAME"
BRANCH_NAME="task/$(echo "$TASK_ID" | tr '[:upper:]' '[:lower:]')"
WORKTREE_PATH="${PROJECT_DIR}/../ifa-report-${TASK_ID,,}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# commit message 預設值
if [ -z "$COMMIT_MSG" ]; then
  TASK_TITLE=$(head -1 "$REVIEW_FILE" | sed "s/^# $TASK_ID — //")
  COMMIT_MSG="feat: $TASK_TITLE"
fi

cd "$PROJECT_DIR"

# 如果有 worktree，從 worktree commit
if [ -d "$WORKTREE_PATH" ]; then
  echo "=== Committing from worktree ==="
  cd "$WORKTREE_PATH"
  git add -p  # 讓 Sean 選擇要 stage 的改動
  git commit -m "$COMMIT_MSG

Task: $TASK_ID
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  COMMIT_HASH=$(git rev-parse --short HEAD)

  # merge 回 main
  cd "$PROJECT_DIR"
  git merge "$BRANCH_NAME" --no-ff -m "merge($TASK_ID): $TASK_TITLE"
  git worktree remove "$WORKTREE_PATH" --force
  git branch -d "$BRANCH_NAME" 2>/dev/null || true
  echo "✓ Worktree merged & removed"

else
  # 無 worktree，直接在目前分支 commit
  echo "=== Committing in current branch ==="
  git add -p
  git commit -m "$COMMIT_MSG

Task: $TASK_ID
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  COMMIT_HASH=$(git rev-parse --short HEAD)
fi

# 更新任務文件的 SECTION 7
python3 -c "
import re
content = open('$REVIEW_FILE').read()
decision = '''approved

**備註**
（無）

**Commit**
\`$COMMIT_HASH\` — $(date '+%Y-%m-%d %H:%M:%S')'''
content = re.sub(r'approved / rejected', decision, content)
open('$REVIEW_FILE', 'w').write(content)
"

# 移動到 done
mv "$REVIEW_FILE" "$DONE_FILE"

# 寫入 CHANGELOG
CHANGELOG="$SCRIPT_DIR/CHANGELOG.md"
TASK_TITLE_CLEAN=$(head -1 "$DONE_FILE" | sed 's/^# //' | sed "s/^$TASK_ID — //")

# 取得 Generator 修改的檔案（從 SECTION 4）
CHANGED_FILES=$(grep -A20 '^\*\*已修改的檔案\*\*' "$DONE_FILE" 2>/dev/null | grep '^- src/' | head -5 | sed 's/^- /  - /' || echo "  - （見任務文件）")

if [ ! -f "$CHANGELOG" ]; then
  printf "# CHANGELOG\n\n每次任務完成後自動追加。格式：日期 | TaskID | commit | 改了什麼。\n\n" > "$CHANGELOG"
fi

{
  printf "## %s — %s (%s)\n\n" "$(date '+%Y-%m-%d')" "$TASK_TITLE_CLEAN" "$TASK_ID"
  printf "**Commit:** \`%s\`  \n" "$COMMIT_HASH"
  printf "**Message:** %s  \n\n" "$COMMIT_MSG"
  printf "**Changed files:**\n%s\n\n" "$CHANGED_FILES"
  printf "**Task log:** \`ai/tasks/done/%s\`\n\n" "$FILENAME"
  printf "---\n\n"
} >> "$CHANGELOG"

echo ""
echo "✓ 任務狀態：review → done"
echo "  Commit：$COMMIT_HASH"
echo "  歸檔：ai/tasks/done/$FILENAME"
echo "  CHANGELOG 已更新：ai/CHANGELOG.md"
