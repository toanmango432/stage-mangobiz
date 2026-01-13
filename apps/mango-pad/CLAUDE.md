# Mango Pad - AI Agent Instructions

## Overview

Mango Pad is a customer-facing iPad app for signature capture, tip selection, and receipt preference during checkout.

## Ralph (Autonomous Agent Loop)

Ralph has been moved to the monorepo root. See `/CLAUDE.md` for usage instructions.

```bash
# Run Ralph from monorepo root
cd "/Users/seannguyen/Winsurf built/Mango-monorepo"
./scripts/ralph/ralph.sh [max_iterations]
```

## Key Patterns

- Uses React + Capacitor for iPad deployment
- MQTT communication with Store App via PadMqttProvider
- Transaction flow: Receipt → Tip → Signature → Receipt Preference → Processing → Complete/Failed

## Codebase Patterns (Updated by Ralph)

<!-- Ralph will append discovered patterns here -->
