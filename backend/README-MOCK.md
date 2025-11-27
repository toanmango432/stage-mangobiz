# Mock Control Center - Development Mode

This is a simple mock backend for testing the POS licensing system during development.

## Quick Start

The mock server is already running at `http://localhost:4000`

## How to Use

1. **The mock server accepts ANY license key** - just enter any text in the format `XXXX-XXXX-XXXX-XXXX`

2. **Example license keys** (all work the same):
   - `TEST-1234-5678-9012`
   - `DEV-MODE-TEST-KEY`
   - `DEMO-DEMO-DEMO-DEMO`

3. **What happens when you activate:**
   - ✅ License validated as "Premium" tier
   - ✅ Store ID: `dev_store_001`
   - ✅ Default data populated (categories, items, tax settings, etc.)
   - ✅ Valid until Dec 31, 2026

## Starting/Stopping the Server

```bash
# Start the server
cd backend
node mock-control-center.js

# Stop the server
# Press Ctrl+C in the terminal
```

## Testing the API

```bash
# Health check
curl http://localhost:4000/health

# Test license validation
curl -X POST http://localhost:4000/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "TEST-1234-5678-9012",
    "appVersion": "1.0.0"
  }'
```

## Important Notes

- ⚠️ This is for **development only**
- ⚠️ Do NOT use in production
- ⚠️ Any license key will be accepted
- ✅ Perfect for testing the POS app
