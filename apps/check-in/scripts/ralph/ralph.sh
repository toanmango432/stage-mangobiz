#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh [max_iterations]

set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
LOG_FILE="$SCRIPT_DIR/ralph.log"

# Clear previous log
echo "Starting Ralph - Max iterations: $MAX_ITERATIONS" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

echo "Starting Ralph - Max iterations: $MAX_ITERATIONS"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════════════════"
  
  # Log iteration start
  echo "" >> "$LOG_FILE"
  echo "═══════════════════════════════════════════════════════" >> "$LOG_FILE"
  echo "  Ralph Iteration $i of $MAX_ITERATIONS" >> "$LOG_FILE"
  echo "═══════════════════════════════════════════════════════" >> "$LOG_FILE"

  # Run amp with the ralph prompt
  OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
  
  # Log output
  echo "$OUTPUT" >> "$LOG_FILE"

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "🎉 Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    echo "" >> "$LOG_FILE"
    echo "🎉 Ralph completed all tasks at iteration $i!" >> "$LOG_FILE"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  echo "Iteration $i complete. Continuing..." >> "$LOG_FILE"
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $LOG_FILE for status."
exit 1
