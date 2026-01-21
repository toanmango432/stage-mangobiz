#!/bin/bash
# Ralph Wiggum - Autonomous AI Agent Loop for Claude Code
# Version: 2.3.0
#
# Usage: ./ralph.sh [max_iterations] [run_name]
#
# Examples:
#   ./ralph.sh 50                    # Auto-detect run from git branch
#   ./ralph.sh 50 frontdesk-fixes    # Use specific run directory
#   ./ralph.sh --yes 50              # Non-interactive mode (auto-confirm)
#   ./ralph.sh --version             # Show version
#   ./ralph.sh --help                # Show help
#
# Ralph runs Claude Code repeatedly until all PRD items are complete.
# Each iteration is a fresh Claude instance with clean context.
# Memory persists via git history, progress.txt, and prd.json.
#
# Run directories: scripts/ralph/runs/<run_name>/
# Each run is isolated to prevent accidental modifications by other agents.

RALPH_VERSION="2.3.0"
RALPH_TEMPLATE_DATE="2026-01-20"

# Strict mode: exit on error, undefined vars, pipe failures
set -euo pipefail
IFS=$'\n\t'

# =============================================================================
# HELP AND VERSION
# =============================================================================

show_help() {
    cat << 'EOF'
Ralph Wiggum - Autonomous AI Agent Loop for Claude Code

Usage: ./ralph.sh [options] [max_iterations] [run_name]

Options:
  --help, -h       Show this help message
  --version, -v    Show version information
  --dry-run        Show what would happen without running
  --yes, -y        Non-interactive mode (auto-confirm all prompts)
  --list-runs      List available run directories

Arguments:
  max_iterations   Maximum iterations to run (default: 10)
  run_name         Run directory name (default: auto-detect from branch)

Examples:
  ./ralph.sh 50                    # Run 50 iterations, auto-detect run
  ./ralph.sh 50 my-feature         # Run 50 iterations on 'my-feature' run
  ./ralph.sh --yes 50              # Non-interactive mode for CI/automation
  ./ralph.sh --dry-run 50          # Show what would happen
  ./ralph.sh --list-runs           # List available runs

Run directories: scripts/ralph/runs/<run_name>/

Config file: scripts/ralph/config (optional)
  NOTE: The config file is SHELL CODE that gets sourced.
  Only use trusted config files. Example variables:
    NOTIFICATIONS_ENABLED=true
    TEXTMEBOT_API_KEY="your-key"
    TEXTMEBOT_PHONE="your-phone"
    CLAUDE_FLAGS="--dangerously-skip-permissions"

Environment:
  RALPH_DEBUG=true    Enable verbose debug output
  
Note: Ralph unsets ANTHROPIC_API_KEY to force OAuth authentication.
EOF
}

show_version() {
    echo "Ralph Wiggum v$RALPH_VERSION ($RALPH_TEMPLATE_DATE)"
    echo ""
    echo "Template location: ~/.claude/templates/ralph/"
    echo "To update: /ralph sync"
}

# =============================================================================
# UTILITIES
# =============================================================================

# Check if running in interactive terminal
is_tty() {
    [[ -t 0 ]]
}

# Prompt for yes/no, respects AUTO_YES and non-TTY
prompt_yes_no() {
    local msg="$1"
    local default="${2:-n}"
    
    if [[ "$AUTO_YES" == true ]]; then
        echo "$msg [auto-yes]"
        return 0
    fi
    
    if ! is_tty; then
        echo "$msg [non-interactive, defaulting to $default]"
        [[ "$default" == "y" ]]
        return $?
    fi
    
    read -p "$msg (y/n) " -n 1 -r
    echo ""
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Debug logging
debug() {
    if [[ "${RALPH_DEBUG:-false}" == true ]]; then
        echo "[DEBUG] $*" >&2
    fi
}

# =============================================================================
# PARSE OPTIONS
# =============================================================================

DRY_RUN=false
AUTO_YES=false
LIST_RUNS=false

while [[ $# -gt 0 && "$1" == -* ]]; do
    case "$1" in
        --help|-h)
            show_help
            exit 0
            ;;
        --version|-v)
            show_version
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --yes|-y)
            AUTO_YES=true
            shift
            ;;
        --list-runs)
            LIST_RUNS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

MAX_ITERATIONS="${1:-10}"
RUN_NAME="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# =============================================================================
# DEPENDENCY CHECKS
# =============================================================================

check_dependencies() {
    local missing=()
    
    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi
    
    if ! command -v git &> /dev/null; then
        missing+=("git")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "ERROR: Missing required dependencies: ${missing[*]}"
        echo ""
        echo "Install them with:"
        echo "  macOS:  brew install ${missing[*]}"
        echo "  Ubuntu: sudo apt install ${missing[*]}"
        exit 1
    fi
    
    if ! command -v claude &> /dev/null; then
        echo "ERROR: Claude CLI not found."
        echo ""
        echo "Install Claude Code CLI:"
        echo "  npm install -g @anthropic-ai/claude-code"
        echo ""
        echo "Or visit: https://claude.ai/code"
        exit 1
    fi
}

check_dependencies

# =============================================================================
# VALIDATE ARGUMENTS
# =============================================================================

if ! [[ "$MAX_ITERATIONS" =~ ^[0-9]+$ ]] || [[ "$MAX_ITERATIONS" -le 0 ]]; then
    echo "ERROR: max_iterations must be a positive integer (got: $MAX_ITERATIONS)"
    echo ""
    echo "Usage: ./ralph.sh [max_iterations] [run_name]"
    exit 1
fi

# =============================================================================
# LOAD CONFIG FILE (if exists)
# =============================================================================

CONFIG_FILE="$SCRIPT_DIR/config"

# Defaults
NOTIFICATIONS_ENABLED=false
TEXTMEBOT_API_KEY=""
TEXTMEBOT_PHONE=""
CLAUDE_FLAGS="--dangerously-skip-permissions"
MAX_CONSECUTIVE_FAILURES=3

# Load config if exists (NOTE: This is shell code, not just data!)
if [[ -f "$CONFIG_FILE" ]]; then
    debug "Loading config from $CONFIG_FILE"
    # shellcheck source=/dev/null
    source "$CONFIG_FILE"
fi

# =============================================================================
# AUTO-SYNC FROM TEMPLATE (ensures latest version)
# =============================================================================

TEMPLATE_DIR="$HOME/.claude/templates/ralph"

sync_from_template() {
    if [[ ! -d "$TEMPLATE_DIR" ]]; then
        debug "Template directory not found: $TEMPLATE_DIR"
        return 0
    fi

    local template_version
    template_version=$(cat "$TEMPLATE_DIR/VERSION" 2>/dev/null || echo "0.0.0")

    if [[ "$template_version" != "$RALPH_VERSION" ]]; then
        echo "⚠️  Template v$template_version available (current: v$RALPH_VERSION)"

        # Update ralph.sh
        if [[ -f "$TEMPLATE_DIR/ralph.sh" ]]; then
            echo "   Updating ralph.sh..."
            cp "$TEMPLATE_DIR/ralph.sh" "$SCRIPT_DIR/ralph.sh"
            chmod +x "$SCRIPT_DIR/ralph.sh"
        fi

        # Update prompt.md in all run directories
        if [[ -f "$TEMPLATE_DIR/prompt.md" ]] && [[ -d "$SCRIPT_DIR/runs" ]]; then
            for run_dir in "$SCRIPT_DIR/runs"/*/; do
                if [[ -d "$run_dir" ]]; then
                    local run_name
                    run_name=$(basename "$run_dir")
                    echo "   Updating prompt.md for run: $run_name"
                    cp "$TEMPLATE_DIR/prompt.md" "$run_dir/prompt.md"
                    # Replace placeholders with run name
                    sed -i '' "s/{{RUN_NAME}}/$run_name/g" "$run_dir/prompt.md" 2>/dev/null || \
                    sed -i "s/{{RUN_NAME}}/$run_name/g" "$run_dir/prompt.md"
                fi
            done
        fi

        echo "✅ Updated to v$template_version"
        echo ""
        echo "⚠️  ralph.sh was updated. Please re-run the command to use the new version."
        exit 0
    else
        debug "Template is current (v$RALPH_VERSION)"
    fi
}

# Run auto-sync (can be disabled with RALPH_SKIP_SYNC=true)
if [[ "${RALPH_SKIP_SYNC:-false}" != true ]]; then
    sync_from_template
fi

# =============================================================================
# NOTIFICATIONS
# =============================================================================

notify() {
    local message="$1"

    # WhatsApp via TextMeBot
    if [[ "$NOTIFICATIONS_ENABLED" == true ]] && [[ -n "$TEXTMEBOT_API_KEY" ]] && [[ -n "$TEXTMEBOT_PHONE" ]]; then
        # Use jq for URL encoding (more reliable than Python)
        local encoded_message
        encoded_message=$(printf '%s' "$message" | jq -sRr @uri 2>/dev/null || echo "$message")
        
        if [[ "${RALPH_DEBUG:-false}" == true ]]; then
            curl -sS "https://api.textmebot.com/send.php?recipient=${TEXTMEBOT_PHONE}&apikey=${TEXTMEBOT_API_KEY}&text=${encoded_message}" || echo "Notification failed" >&2
        else
            curl -s "https://api.textmebot.com/send.php?recipient=${TEXTMEBOT_PHONE}&apikey=${TEXTMEBOT_API_KEY}&text=${encoded_message}" > /dev/null 2>&1 &
        fi
    fi
}

# =============================================================================
# LIST RUNS (if requested)
# =============================================================================

if [[ "$LIST_RUNS" == true ]]; then
    echo "Available runs in $SCRIPT_DIR/runs/:"
    echo ""
    if [[ -d "$SCRIPT_DIR/runs" ]]; then
        for run_dir in "$SCRIPT_DIR/runs"/*/; do
            if [[ -d "$run_dir" ]]; then
                run_name=$(basename "$run_dir")
                prd_file="$run_dir/prd.json"
                if [[ -f "$prd_file" ]]; then
                    total=$(jq '.userStories | length' "$prd_file" 2>/dev/null || echo "?")
                    complete=$(jq '[.userStories[] | select(.passes == true)] | length' "$prd_file" 2>/dev/null || echo "?")
                    branch=$(jq -r '.branchName // "unknown"' "$prd_file" 2>/dev/null || echo "unknown")
                    echo "  $run_name ($complete/$total complete) - $branch"
                else
                    echo "  $run_name (no prd.json)"
                fi
            fi
        done
    else
        echo "  (no runs directory found)"
    fi
    exit 0
fi

# =============================================================================
# DETERMINE RUN DIRECTORY
# =============================================================================

# If no run name provided, try to detect from current branch
if [[ -z "$RUN_NAME" ]]; then
    CURRENT_BRANCH=$(cd "$MONOREPO_ROOT" && git branch --show-current 2>/dev/null || echo "")

    # Extract run name from branch (e.g., "ralph/frontdesk-fixes" -> "frontdesk-fixes")
    if [[ "$CURRENT_BRANCH" == ralph/* ]]; then
        RUN_NAME="${CURRENT_BRANCH#ralph/}"
        echo "Auto-detected run from branch: $RUN_NAME"
    else
        # Check if there's only one run directory
        if [[ -d "$SCRIPT_DIR/runs" ]]; then
            RUN_COUNT=$(find "$SCRIPT_DIR/runs" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
            if [[ "$RUN_COUNT" -eq 1 ]]; then
                RUN_NAME=$(basename "$(find "$SCRIPT_DIR/runs" -mindepth 1 -maxdepth 1 -type d 2>/dev/null)")
                echo "Auto-detected single run directory: $RUN_NAME"
            elif [[ "$RUN_COUNT" -eq 0 ]]; then
                echo "ERROR: No run directories found in $SCRIPT_DIR/runs/"
                echo ""
                echo "To create a new run, use: /ralph init <run-name>"
                exit 1
            else
                echo "ERROR: Cannot determine run directory."
                echo "Either:"
                echo "  1. Be on a ralph/* branch (e.g., ralph/frontdesk-fixes)"
                echo "  2. Specify run name: ./ralph.sh 50 frontdesk-fixes"
                echo ""
                echo "Available runs:"
                find "$SCRIPT_DIR/runs" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null || echo "  (none)"
                exit 1
            fi
        else
            echo "ERROR: No runs directory found at $SCRIPT_DIR/runs/"
            echo ""
            echo "To initialize Ralph, use: /ralph init <run-name>"
            exit 1
        fi
    fi
fi

RUN_DIR="$SCRIPT_DIR/runs/$RUN_NAME"

# Verify run directory exists
if [[ ! -d "$RUN_DIR" ]]; then
    echo "ERROR: Run directory not found: $RUN_DIR"
    echo ""
    echo "Available runs:"
    find "$SCRIPT_DIR/runs" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null || echo "  (none)"
    echo ""
    echo "To create a new run, use: /ralph init $RUN_NAME"
    exit 1
fi

PRD_FILE="$RUN_DIR/prd.json"
PROGRESS_FILE="$RUN_DIR/progress.txt"
PROMPT_FILE="$RUN_DIR/prompt.md"
PATTERNS_FILE="$SCRIPT_DIR/patterns.md"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$RUN_DIR/.last-branch"

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RALPH WIGGUM v$RALPH_VERSION - Autonomous AI Agent Loop"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check prd.json exists
if [[ ! -f "$PRD_FILE" ]]; then
    echo "ERROR: PRD file not found at $PRD_FILE"
    echo ""
    echo "Create a prd.json with your user stories first."
    echo "Use: /ralph convert <prd-file.md>"
    exit 1
fi

# Check prompt.md exists
if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "ERROR: Prompt file not found at $PROMPT_FILE"
    echo ""
    echo "Run: /ralph init $RUN_NAME"
    exit 1
fi

# Validate prd.json is valid JSON
if ! jq empty "$PRD_FILE" 2>/dev/null; then
    echo "ERROR: prd.json is not valid JSON"
    echo ""
    echo "Check syntax at: $PRD_FILE"
    exit 1
fi

# Get branch from PRD
PRD_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
if [[ -z "$PRD_BRANCH" ]]; then
    echo "ERROR: prd.json missing 'branchName' field"
    echo ""
    echo "Add to $PRD_FILE:"
    echo '  "branchName": "ralph/your-feature-name"'
    exit 1
fi

# Check current git branch matches PRD
cd "$MONOREPO_ROOT"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [[ -n "$CURRENT_BRANCH" ]] && [[ "$CURRENT_BRANCH" != "$PRD_BRANCH" ]]; then
    echo "WARNING: Current branch ($CURRENT_BRANCH) doesn't match PRD branch ($PRD_BRANCH)"
    echo ""
    if [[ "$DRY_RUN" == true ]]; then
        echo "[DRY RUN] Would prompt to switch branches"
    elif prompt_yes_no "Switch to $PRD_BRANCH?"; then
        git checkout "$PRD_BRANCH" 2>/dev/null || git checkout -b "$PRD_BRANCH"
    else
        echo "Continuing on $CURRENT_BRANCH..."
    fi
fi

# =============================================================================
# ARCHIVE PREVIOUS RUN (if branch changed)
# =============================================================================

if [[ -f "$LAST_BRANCH_FILE" ]]; then
    LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

    if [[ -n "$LAST_BRANCH" ]] && [[ "$PRD_BRANCH" != "$LAST_BRANCH" ]]; then
        # Check for uncommitted changes before archiving
        if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
            echo "WARNING: Uncommitted changes detected."
            echo "Commit or stash changes before switching PRDs to avoid losing work."
            if [[ "$DRY_RUN" == true ]]; then
                echo "[DRY RUN] Would prompt to continue"
            elif ! prompt_yes_no "Continue anyway?"; then
                exit 1
            fi
        fi

        # Archive the previous run
        DATE=$(date +%Y-%m-%d)
        FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||' | sed 's|/|-|g')
        ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME-$RUN_NAME"

        echo "Archiving previous run: $LAST_BRANCH"
        if [[ "$DRY_RUN" == false ]]; then
            mkdir -p "$ARCHIVE_FOLDER"
            [[ -f "$PRD_FILE" ]] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
            [[ -f "$PROGRESS_FILE" ]] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
            echo "   Archived to: $ARCHIVE_FOLDER"

            # Preserve patterns - copy to patterns.md if not already there
            if [[ -f "$PROGRESS_FILE" ]]; then
                # Extract Codebase Patterns section and append to patterns.md
                PATTERNS=$(sed -n '/^## Codebase Patterns/,/^---$/p' "$PROGRESS_FILE" | head -n -1) || true
                if [[ -n "$PATTERNS" ]] && [[ -f "$PATTERNS_FILE" ]]; then
                    echo "" >> "$PATTERNS_FILE"
                    echo "<!-- From $LAST_BRANCH -->" >> "$PATTERNS_FILE"
                    echo "$PATTERNS" >> "$PATTERNS_FILE"
                fi
            fi

            # Reset progress file for new run (with patterns header)
            echo "## Codebase Patterns" > "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
            if [[ -f "$PATTERNS_FILE" ]]; then
                echo "See patterns.md for accumulated patterns from previous runs." >> "$PROGRESS_FILE"
            fi
            echo "" >> "$PROGRESS_FILE"
            echo "---" >> "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
            echo "# Ralph Progress Log" >> "$PROGRESS_FILE"
            echo "Started: $(date)" >> "$PROGRESS_FILE"
            echo "Branch: $PRD_BRANCH" >> "$PROGRESS_FILE"
            echo "" >> "$PROGRESS_FILE"
        else
            echo "[DRY RUN] Would archive to: $ARCHIVE_FOLDER"
        fi
    fi
fi

# Track current branch
if [[ "$DRY_RUN" == false ]]; then
    echo "$PRD_BRANCH" > "$LAST_BRANCH_FILE"
fi

# Initialize progress file if it doesn't exist
if [[ ! -f "$PROGRESS_FILE" ]] && [[ "$DRY_RUN" == false ]]; then
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
if [[ ! -f "$PATTERNS_FILE" ]] && [[ "$DRY_RUN" == false ]]; then
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

echo "Project Root:   $MONOREPO_ROOT"
echo "Run Directory:  $RUN_DIR"
echo "PRD:            $PRD_FILE"
echo "Branch:         $PRD_BRANCH"
echo "Stories:        $COMPLETED_STORIES/$TOTAL_STORIES complete ($REMAINING_STORIES remaining)"
echo "Max iterations: $MAX_ITERATIONS"
echo "Notifications:  $([ "$NOTIFICATIONS_ENABLED" = true ] && echo "enabled" || echo "disabled")"
echo "Mode:           $([ "$AUTO_YES" = true ] && echo "non-interactive" || echo "interactive")"
echo ""

if [[ "$REMAINING_STORIES" -eq 0 ]]; then
    echo "All stories already complete!"
    notify "✅ Ralph: All $TOTAL_STORIES stories already complete."
    exit 0
fi

if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY RUN] Would run $MAX_ITERATIONS iterations"
    echo "[DRY RUN] Command: cat \"$PROMPT_FILE\" | claude $CLAUDE_FLAGS -p"
    exit 0
fi

# =============================================================================
# MAIN LOOP
# =============================================================================

notify "🚀 Ralph starting: $REMAINING_STORIES stories remaining"

CONSECUTIVE_FAILURES=0

for ((i = 1; i <= MAX_ITERATIONS; i++)); do
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  Ralph Iteration $i of $MAX_ITERATIONS"
    echo "═══════════════════════════════════════════════════════"

    # CRITICAL: Run Claude from project root so all paths resolve correctly
    cd "$MONOREPO_ROOT"

    # Run Claude with the ralph prompt from run directory
    # Use subshell to unset ANTHROPIC_API_KEY without affecting parent environment
    set +e
    CLAUDE_OUTPUT=$(
        unset ANTHROPIC_API_KEY
        cat "$PROMPT_FILE" | claude $CLAUDE_FLAGS -p 2>&1
    )
    CLAUDE_STATUS=$?
    set -e

    # Display output
    echo "$CLAUDE_OUTPUT"

    # Check for Claude CLI failures
    if [[ $CLAUDE_STATUS -ne 0 ]]; then
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        echo ""
        echo "WARNING: Claude CLI exited with status $CLAUDE_STATUS (failure $CONSECUTIVE_FAILURES/$MAX_CONSECUTIVE_FAILURES)"
        
        if [[ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]]; then
            echo ""
            echo "ERROR: $MAX_CONSECUTIVE_FAILURES consecutive failures. Stopping Ralph."
            notify "❌ Ralph stopped: $MAX_CONSECUTIVE_FAILURES consecutive Claude failures"
            exit 1
        fi
        
        echo "Retrying after brief pause..."
        sleep 5
        continue
    fi

    # Reset failure counter on success
    CONSECUTIVE_FAILURES=0

    # Get updated story count after iteration
    COMPLETED_NOW=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")

    # Check for completion signal
    if echo "$CLAUDE_OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo "  RALPH COMPLETE!"
        echo "  All stories done at iteration $i of $MAX_ITERATIONS"
        echo "═══════════════════════════════════════════════════════"
        notify "🎉 Ralph Complete! All $TOTAL_STORIES stories done in $i iterations."
        exit 0
    fi

    # Notify progress after each iteration
    notify "📦 Ralph iteration $i: $COMPLETED_NOW/$TOTAL_STORIES stories complete"

    echo ""
    echo "Iteration $i complete. Stories: $COMPLETED_NOW/$TOTAL_STORIES"
    sleep 2
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Ralph reached max iterations ($MAX_ITERATIONS)"
echo "  Stories: $COMPLETED_NOW/$TOTAL_STORIES complete"
echo "  Progress: $PROGRESS_FILE"
echo "═══════════════════════════════════════════════════════"
notify "⚠️ Ralph stopped: max iterations ($MAX_ITERATIONS). $COMPLETED_NOW/$TOTAL_STORIES stories."
exit 1
