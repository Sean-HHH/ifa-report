#!/usr/bin/env bash
# ai/task-submit.sh — 執行完後跑測試，任務進入 review
# 用法：bash ai/task-submit.sh TASK-001

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TASKS_DIR="$SCRIPT_DIR/tasks"

if [ -z "$1" ]; then
  echo "用法：bash ai/task-submit.sh TASK-001"
  exit 1
fi

TASK_ID="$1"
INPROG_FILE=$(find "$TASKS_DIR/in-progress" -name "${TASK_ID}-*.md" | head -1)

if [ -z "$INPROG_FILE" ]; then
  echo "✗ 找不到 in-progress 任務：$TASK_ID"
  exit 1
fi

FILENAME=$(basename "$INPROG_FILE")
REVIEW_FILE="$TASKS_DIR/review/$FILENAME"

echo "=== Harness 測試（Step 7）==="
echo ""

# 跑測試並捕捉輸出
cd "$PROJECT_DIR"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TEST_OUTPUT=""
TEST_PASSED=true

run_check() {
  local label="$1"
  local cmd="$2"
  printf "%-8s running..." "[$label]"
  if output=$(eval "$cmd" 2>&1); then
    printf "\r%-8s PASS\n" "[$label]"
    TEST_OUTPUT="${TEST_OUTPUT}[$label] PASS\n"
  else
    printf "\r%-8s FAIL\n" "[$label]"
    TEST_OUTPUT="${TEST_OUTPUT}[$label] FAIL\n${output}\n"
    TEST_PASSED=false
  fi
}

run_check "lint"  "npm run lint --silent"
run_check "tsc"   "npx tsc --noEmit"
run_check "build" "npm run build --silent"

echo ""

# 追加測試結果到任務文件
RESULT_BLOCK="執行時間：$TIMESTAMP\n\n\`\`\`\n$(echo -e "$TEST_OUTPUT")\`\`\`"

# 替換 SECTION 6 的 [等待執行] 佔位符
python3 -c "
import re, sys
content = open('$INPROG_FILE').read()
new_block = '''$TIMESTAMP

\`\`\`
$(echo -e "$TEST_OUTPUT")\`\`\`'''
content = re.sub(r'\[等待執行\]', new_block.strip(), content)
open('$INPROG_FILE', 'w').write(content)
"

if [ "$TEST_PASSED" = true ]; then
  echo "✓ All checks passed"
  # 移動到 review
  mv "$INPROG_FILE" "$REVIEW_FILE"
  echo "✓ 任務狀態：in-progress → review"
  echo "  檔案：ai/tasks/review/$FILENAME"
  echo ""
  echo "=== 下一步：Evaluator Review ==="
  echo ""
  echo "  任務文件：ai/tasks/review/$FILENAME"
  echo "  請 Evaluator 閱讀 SECTION 2–4，對照 SECTION 3（AC）逐項審查，填寫 SECTION 5。"
  echo "  完成後通知 Sean 做 final approval：bash ai/task-approve.sh $TASK_ID"
else
  echo "✗ 測試失敗，測試結果已追加至任務文件"
  echo "  返回 Generator 修正（Step 6）後重新提交"
  exit 1
fi
