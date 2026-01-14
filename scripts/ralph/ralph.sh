#!/bin/bash
# Ralph Wiggum - Autonomous AI Agent Loop for Claude Code
# Usage: ./ralph.sh [max_iterations] [run_name]
#
# Examples:
#   ./ralph.sh 50                    # Auto-detect run from git branch
#   ./ralph.sh 50 frontdesk-fixes    # Use specific run directory
#
# Ralph runs Claude Code repeatedly until all PRD items are complete.
# Each iteration is a fresh Claude instance with clean context.
# Memory persists via git history, progress.txt, and prd.json.
#
# Run directories: scripts/ralph/runs/<run_name>/
# Each run is isolated to prevent accidental modifications by other agents.

set -e

MAX_ITERATIONS=${1:-10}
RUN_NAME=${2:-""}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(git rev-parse --show-toplevel)"

# =============================================================================
# DETERMINE RUN DIRECTORY
# =============================================================================

# If no run name provided, try to detect from current branch
if [ -z "$RUN_NAME" ]; then
    CURRENT_BRANCH=$(cd "$MONOREPO_ROOT" && git branch --show-current)
    # Extract run name from branch (e.g., "ralph/frontdesk-fixes" -> "frontdesk-fixes")
    if [[ "$CURRENT_BRANCH" == ralph/* ]]; then
        RUN_NAME="${CURRENT_BRANCH#ralph/}"
    else
        # Check if there's only one run directory
        RUN_COUNT=$(ls -d "$SCRIPT_DIR/runs"/*/ 2>/dev/null | wc -l | tr -d ' ')
        if [ "$RUN_COUNT" -eq 1 ]; then
            RUN_NAME=$(basename "$(ls -d "$SCRIPT_DIR/runs"/*/ 2>/dev/null)")
        else
            echo "ERROR: Cannot determine run directory."
            echo "Either:"
            echo "  1. Be on a ralph/* branch (e.g., ralph/frontdesk-fixes)"
            echo "  2. Specify run name: ./ralph.sh 50 frontdesk-fixes"
            echo ""
            echo "Available runs:"
            ls -d "$SCRIPT_DIR/runs"/*/ 2>/dev/null | xargs -I {} basename {} || echo "  (none)"
            exit 1
        fi
    fi
fi

RUN_DIR="$SCRIPT_DIR/runs/$RUN_NAME"

# Verify run directory exists
if [ ! -d "$RUN_DIR" ]; then
    echo "ERROR: Run directory not found: $RUN_DIR"
    echo ""
    echo "Available runs:"
    ls -d "$SCRIPT_DIR/runs"/*/ 2>/dev/null | xargs -I {} basename {} || echo "  (none)"
    echo ""
    echo "To create a new run:"
    echo "  mkdir -p $SCRIPT_DIR/runs/<run-name>"
    echo "  # Add prd.json, progress.txt, prompt.md"
    exit 1
fi

PRD_FILE="$RUN_DIR/prd.json"
PROGRESS_FILE="$RUN_DIR/progress.txt"
PROMPT_FILE="$RUN_DIR/prompt.md"
PATTERNS_FILE="$SCRIPT_DIR/patterns.md"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$RUN_DIR/.last-branch"

# =============================================================================
# WHATSAPP NOTIFICATIONS (via TextMeBot)
# =============================================================================

TEXTMEBOT_API_KEY="ongFo9YyJ5n3"
TEXTMEBOT_PHONE="+12709940616"

notify_whatsapp() {
    local message="$1"
    # URL encode the message
    local encoded_message=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$message'''))")
    curl -s "https://api.textmebot.com/send.php?recipient=${TEXTMEBOT_PHONE}&apikey=${TEXTMEBOT_API_KEY}&text=${encoded_message}" > /dev/null 2>&1 &
}

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RALPH WIGGUM - Autonomous AI Agent Loop"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "ERROR: Claude CLI not found. Install it first."
    exit 1
fi

# Check prd.json exists
if [ ! -f "$PRD_FILE" ]; then
    echo "ERROR: PRD file not found at $PRD_FILE"
    echo "Create a prd.json with your user stories first."
    exit 1
fi

# Validate prd.json is valid JSON
if ! jq empty "$PRD_FILE" 2>/dev/null; then
    echo "ERROR: prd.json is not valid JSON"
    exit 1
fi

# Get branch from PRD
PRD_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
if [ -z "$PRD_BRANCH" ]; then
    echo "ERROR: prd.json missing 'branchName' field"
    exit 1
fi

# Check current git branch matches PRD
cd "$MONOREPO_ROOT"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$PRD_BRANCH" ]; then
    echo "WARNING: Current branch ($CURRENT_BRANCH) doesn't match PRD branch ($PRD_BRANCH)"
    echo ""
    read -p "Switch to $PRD_BRANCH? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout "$PRD_BRANCH" 2>/dev/null || git checkout -b "$PRD_BRANCH"
    else
        echo "Continuing on $CURRENT_BRANCH..."
    fi
fi

# =============================================================================
# ARCHIVE PREVIOUS RUN (if branch changed)
# =============================================================================

if [ -f "$LAST_BRANCH_FILE" ]; then
    LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

    if [ -n "$LAST_BRANCH" ] && [ "$PRD_BRANCH" != "$LAST_BRANCH" ]; then
        # Check for uncommitted changes before archiving
        if [ -n "$(git status --porcelain)" ]; then
            echo "WARNING: Uncommitted changes detected."
            echo "Commit or stash changes before switching PRDs to avoid losing work."
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi

        # Archive the previous run
        DATE=$(date +%Y-%m-%d)
        FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||' | sed 's|/|-|g')
        ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

        echo "Archiving previous run: $LAST_BRANCH"
        mkdir -p "$ARCHIVE_FOLDER"
        [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
        [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
        echo "   Archived to: $ARCHIVE_FOLDER"

        # Preserve patterns - copy to patterns.md if not already there
        if [ -f "$PROGRESS_FILE" ]; then
            # Extract Codebase Patterns section and append to patterns.md
            PATTERNS=$(sed -n '/^## Codebase Patterns/,/^---$/p' "$PROGRESS_FILE" | head -n -1)
            if [ -n "$PATTERNS" ] && [ -f "$PATTERNS_FILE" ]; then
                echo "" >> "$PATTERNS_FILE"
                echo "<!-- From $LAST_BRANCH -->" >> "$PATTERNS_FILE"
                echo "$PATTERNS" >> "$PATTERNS_FILE"
            fi
        fi

        # Reset progress file for new run (with patterns header)
        echo "## Codebase Patterns" > "$PROGRESS_FILE"
        echo "" >> "$PROGRESS_FILE"
        if [ -f "$PATTERNS_FILE" ]; then
            echo "See patterns.md for accumulated patterns from previous runs." >> "$PROGRESS_FILE"
        fi
        echo "" >> "$PROGRESS_FILE"
        echo "---" >> "$PROGRESS_FILE"
        echo "" >> "$PROGRESS_FILE"
        echo "# Ralph Progress Log" >> "$PROGRESS_FILE"
        echo "Started: $(date)" >> "$PROGRESS_FILE"
        echo "Branch: $PRD_BRANCH" >> "$PROGRESS_FILE"
        echo "" >> "$PROGRESS_FILE"
    fi
fi

# Track current branch
echo "$PRD_BRANCH" > "$LAST_BRANCH_FILE"

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
    echo "## Codebase Patterns" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "# Ralph Progress Log" >> "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "Branch: $PRD_BRANCH" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
fi

# Initialize patterns file if it doesn't exist
if [ ! -f "$PATTERNS_FILE" ]; then
    echo "# Persistent Codebase Patterns" > "$PATTERNS_FILE"
    echo "" >> "$PATTERNS_FILE"
    echo "> Patterns accumulated across all Ralph runs. Never deleted." >> "$PATTERNS_FILE"
    echo "" >> "$PATTERNS_FILE"
fi

# =============================================================================
# SHOW STATUS
# =============================================================================

TOTAL_STORIES=$(jq '.userStories | length' "$PRD_FILE")
COMPLETED_STORIES=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")
REMAINING_STORIES=$((TOTAL_STORIES - COMPLETED_STORIES))

echo "Monorepo Root: $MONOREPO_ROOT"
echo "Run Directory: $RUN_DIR"
echo "PRD: $PRD_FILE"
echo "Branch: $PRD_BRANCH"
echo "Stories: $COMPLETED_STORIES/$TOTAL_STORIES complete ($REMAINING_STORIES remaining)"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

if [ "$REMAINING_STORIES" -eq 0 ]; then
    echo "All stories already complete!"
    exit 0
fi

# =============================================================================
# MAIN LOOP
# =============================================================================

for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  Ralph Iteration $i of $MAX_ITERATIONS"
    echo "═══════════════════════════════════════════════════════"

    # CRITICAL: Run Claude from monorepo root so all paths resolve correctly
    cd "$MONOREPO_ROOT"

    # Run Claude with the ralph prompt from run directory
    # Unset ANTHROPIC_API_KEY to force OAuth authentication (Claude Code Max)
    unset ANTHROPIC_API_KEY
    OUTPUT=$(cat "$PROMPT_FILE" | claude --dangerously-skip-permissions -p 2>&1 | tee /dev/stderr) || true

    # Get updated story count after iteration
    COMPLETED_NOW=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")

    # Check for completion signal
    if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo "  RALPH COMPLETE!"
        echo "  All stories done at iteration $i of $MAX_ITERATIONS"
        echo "═══════════════════════════════════════════════════════"
        notify_whatsapp "🎉 Ralph Complete! All $TOTAL_STORIES stories done in $i iterations."
        exit 0
    fi

    # Notify progress after each iteration
    notify_whatsapp "📦 Ralph iteration $i done: $COMPLETED_NOW/$TOTAL_STORIES stories complete"

    echo ""
    echo "Iteration $i complete. Continuing..."
    sleep 2
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Ralph reached max iterations ($MAX_ITERATIONS)"
echo "  Check progress: $PROGRESS_FILE"
echo "═══════════════════════════════════════════════════════"
notify_whatsapp "⚠️ Ralph stopped: reached max iterations ($MAX_ITERATIONS). $COMPLETED_NOW/$TOTAL_STORIES stories complete."
exit 1
