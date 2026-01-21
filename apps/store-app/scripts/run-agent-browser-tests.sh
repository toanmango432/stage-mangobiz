#!/bin/bash
#
# Agent-Browser E2E Test Runner
#
# This script runs Agent-Browser E2E tests with automatic dev server management.
# It checks if the dev server is running, starts it if needed, and runs the tests.
#
# Usage: ./scripts/run-agent-browser-tests.sh
#

set -e

APP_URL="http://localhost:5173"
SERVER_PID_FILE=".agent-browser-test-server.pid"
STARTED_SERVER=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Agent-Browser E2E Test Runner ===${NC}"
echo ""

# Check if agent-browser CLI is available
if ! command -v agent-browser &> /dev/null; then
    echo -e "${RED}Error: agent-browser CLI not found${NC}"
    echo "Please install agent-browser: https://github.com/anthropics/agent-browser"
    exit 1
fi

# Function to check if server is running
check_server() {
    curl -s --head "$APP_URL" > /dev/null 2>&1
}

# Function to cleanup on exit
cleanup() {
    if [ "$STARTED_SERVER" = true ] && [ -f "$SERVER_PID_FILE" ]; then
        echo ""
        echo -e "${YELLOW}Stopping dev server...${NC}"
        kill $(cat "$SERVER_PID_FILE") 2>/dev/null || true
        rm -f "$SERVER_PID_FILE"
    fi
}
trap cleanup EXIT

# Check if dev server is already running
if check_server; then
    echo -e "${GREEN}✓ Dev server already running at $APP_URL${NC}"
else
    echo -e "${YELLOW}Starting dev server...${NC}"
    pnpm dev > /dev/null 2>&1 &
    echo $! > "$SERVER_PID_FILE"
    STARTED_SERVER=true

    # Wait for server to be ready (max 60 seconds)
    echo -n "Waiting for server to be ready"
    for i in {1..60}; do
        if check_server; then
            echo ""
            echo -e "${GREEN}✓ Dev server ready at $APP_URL${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done

    if ! check_server; then
        echo ""
        echo -e "${RED}Error: Dev server failed to start within 60 seconds${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}Running Agent-Browser E2E tests...${NC}"
echo ""

# Run vitest with the agent-browser test file specifically
# Override the exclude pattern to include e2e folder
pnpm vitest run --config vitest.config.ts \
    --include "e2e/auth-agent-browser.spec.ts" \
    --exclude "" \
    --passWithNoTests=false

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=== All Agent-Browser E2E tests PASSED ===${NC}"
else
    echo -e "${RED}=== Some Agent-Browser E2E tests FAILED ===${NC}"
fi

exit $TEST_EXIT_CODE
