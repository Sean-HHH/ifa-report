#!/usr/bin/env bash
# ai/run-tests.sh — Harness test runner (Step 7 of pipeline)
# Run from project root: bash ai/run-tests.sh

set -e
PASS="\033[0;32mPASS\033[0m"
FAIL="\033[0;31mFAIL\033[0m"
ERRORS=0

run_check() {
  local label="$1"
  local cmd="$2"
  printf "%-8s running..." "[$label]"
  if output=$(eval "$cmd" 2>&1); then
    printf "\r%-8s %b\n" "[$label]" "$PASS"
  else
    printf "\r%-8s %b\n" "[$label]" "$FAIL"
    echo "$output"
    ERRORS=$((ERRORS + 1))
  fi
}

run_check "lint"  "npm run lint --silent"
run_check "tsc"   "npx tsc --noEmit"
run_check "test"  "npm test"
run_check "build" "npm run build --silent"

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "✓ All checks passed — ready for final approval"
  exit 0
else
  echo "✗ $ERRORS check(s) failed — return to Generator (Step 6)"
  exit 1
fi
