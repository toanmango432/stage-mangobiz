# Control Center API Documentation

Complete API specification for the Control Center backend to control Mango POS licensing and remote operations.

---

## Configuration

**Environment Variable:**
```bash
VITE_CONTROL_CENTER_URL=http://localhost:4000
```

**Default URL:** `http://localhost:4000`
**Timeout:** 10 seconds per request

---

## API Endpoints

### 1. License Validation

**Endpoint:** `POST /api/validate-license`

**Purpose:**
- Validate license keys
- Activate/deactivate stores
- Enforce version requirements
- Push default configurations on first activation

**Called When:**
- ✅ App startup (every launch)
- ✅ User enters license key in activation screen
- ✅ User clicks "Refresh License" in settings
- ✅ Background check (every 24 hours)

---

## Request Format

### POST /api/validate-license

```typescript
{
  "licenseKey": string,      // Required: License key from user
  "appVersion": string,       // Required: Current app version (e.g., "1.0.0")
  "deviceInfo": {             // Optional: Device information
    "platform": string,       // e.g., "linux", "darwin", "win32"
    "userAgent": string       // Browser user agent
  }
}
```

**Example Request:**
```json
{
  "licenseKey": "ABC123-DEF456-GHI789-JKL012",
  "appVersion": "1.0.0",
  "deviceInfo": {
    "platform": "linux",
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
  }
}
```

---

## Response Formats

### Success Response (License Active)

**HTTP Status:** `200 OK`

```typescript
{
  "valid": true,                              // Required: License is valid
  "storeId": string,                          // Required: Unique store identifier
  "tier": string,                             // Required: Plan tier (e.g., "free", "premium", "enterprise")
  "status": "active",                         // Required: License status
  "message": string,                          // Optional: Success message
  "defaults": {                               // Optional: First-time setup data
    "taxSettings": Array<{
      "name": string,
      "rate": number,
      "isDefault": boolean
    }>,
    "categories": Array<{
      "name": string,
      "icon": string,
      "color": string
    }>,
    "items": Array<{
      "name": string,
      "category": string,
      "description": string,
      "duration": number,        // in minutes
      "price": number,
      "commissionRate": number   // percentage (0-100)
    }>,
    "employeeRoles": Array<{
      "name": string,
      "permissions": string[],
      "color": string
    }>,
    "paymentMethods": Array<{
      "name": string,
      "type": "cash" | "card" | "other",
      "isActive": boolean
    }>
  },
  "requiredVersion": string,                  // Optional: Minimum app version required
  "expiresAt": string                         // Optional: ISO 8601 expiration date
}
```

**Example Success Response:**
```json
{
  "valid": true,
  "storeId": "store_123456",
  "tier": "premium",
  "status": "active",
  "message": "License activated successfully",
  "defaults": {
    "taxSettings": [
      {
        "name": "Sales Tax",
        "rate": 8.5,
        "isDefault": true
      }
    ],
    "categories": [
      {
        "name": "Manicure",
        "icon": "💅",
        "color": "#FF6B9D"
      },
      {
        "name": "Pedicure",
        "icon": "🦶",
        "color": "#4ECDC4"
      }
    ],
    "items": [
      {
        "name": "Basic Manicure",
        "category": "Manicure",
        "description": "Filing, shaping, cuticle care, buffing, and regular polish",
        "duration": 30,
        "price": 20,
        "commissionRate": 50
      },
      {
        "name": "Gel Manicure",
        "category": "Manicure",
        "description": "Premium gel polish with long-lasting shine",
        "duration": 45,
        "price": 35,
        "commissionRate": 50
      }
    ],
    "employeeRoles": [
      {
        "name": "Manager",
        "permissions": ["all"],
        "color": "#10B981"
      },
      {
        "name": "Technician",
        "permissions": ["create_ticket", "checkout"],
        "color": "#3B82F6"
      }
    ],
    "paymentMethods": [
      {
        "name": "Cash",
        "type": "cash",
        "isActive": true
      },
      {
        "name": "Credit Card",
        "type": "card",
        "isActive": true
      }
    ]
  },
  "requiredVersion": "1.0.0",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

---

### Deactivated License Response

**HTTP Status:** `400 Bad Request` or `403 Forbidden`

```typescript
{
  "valid": false,
  "status": "deactivated" | "inactive" | "expired",
  "message": string  // User-friendly error message
}
```

**Example Deactivated Response:**
```json
{
  "valid": false,
  "status": "deactivated",
  "message": "This license has been deactivated. Please contact support@example.com"
}
```

**What Happens in POS:**
- ❌ All operations blocked (checkout, booking, inventory edits)
- 🔴 Red banner displayed: "Store Deactivated"
- 🔒 App switches to read-only mode
- 📱 Activation screen shown with message
- 🗑️ Local license data cleared

---

### Invalid License Response

**HTTP Status:** `400 Bad Request` or `401 Unauthorized`

```json
{
  "valid": false,
  "status": "inactive",
  "message": "Invalid license key"
}
```

**What Happens in POS:**
- Shows activation screen
- Displays error message
- Allows user to re-enter license key

---

### Version Mismatch Response

**HTTP Status:** `426 Upgrade Required`

```typescript
{
  "valid": false,
  "status": "inactive",
  "message": string,
  "requiredVersion": string  // Minimum required version
}
```

**Example Version Mismatch:**
```json
{
  "valid": false,
  "status": "inactive",
  "message": "App version 0.9.0 is outdated. Please update to version 1.2.0 or higher.",
  "requiredVersion": "1.2.0"
}
```

**What Happens in POS:**
- 🚫 App completely blocked
- 📲 "Update Required" screen shown
- ℹ️ Displays current version and required version
- 🔄 "Reload App" button provided

---

### Server Error Response

**HTTP Status:** `500 Internal Server Error`

```json
{
  "valid": false,
  "message": "Internal server error. Please try again later."
}
```

**What Happens in POS:**
- If previously validated within 7 days → offline mode
- Shows warning banner with days remaining
- Otherwise → blocks app and shows error

---

## Control Center Capabilities

### 1. **Remote Activation**
- User enters license key → Control Center validates
- Control Center returns `valid: true` → POS activates immediately
- Store data (ID, tier) saved locally

### 2. **Remote Deactivation**
- Control Center returns `valid: false` or `status: "deactivated"`
- POS blocks all operations instantly
- Next app launch → forced to activation screen
- Background check detects deactivation within 24 hours

### 3. **Force App Update**
- Set `requiredVersion` in response (e.g., `"1.5.0"`)
- If POS version < required → blocks app completely
- Shows update screen with version info

### 4. **Push Default Configurations**
- Send `defaults` object in first successful validation
- POS automatically creates:
  - Tax settings
  - Service categories
  - Menu items/inventory
  - Employee roles
  - Payment methods
- **Only applied once** (never overwrites user changes)

### 5. **License Tiers**
- Set `tier` field: `"free"`, `"basic"`, `"premium"`, `"enterprise"`
- POS stores tier locally
- Can be used for feature gating (future enhancement)

### 6. **Expiration Control**
- Set `expiresAt` to ISO 8601 date
- POS checks expiration on each validation
- Expired licenses treated as deactivated

---

## Validation Flow

```
┌─────────────┐
│  POS App    │
│  Launches   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Check Local License │
└──────┬──────────────┘
       │
       ├─── No License ────────────────┐
       │                               ▼
       │                      ┌──────────────────┐
       │                      │ Activation Screen│
       │                      │ User Enters Key  │
       │                      └────────┬─────────┘
       │                               │
       ▼                               │
┌───────────────────────┐             │
│ POST /validate-license│◄────────────┘
└──────┬────────────────┘
       │
       ├─── 200 OK (valid: true) ────────────┐
       │                                      ▼
       │                            ┌──────────────────┐
       │                            │ Save License Data│
       │                            │ Apply Defaults   │
       │                            │ Start App        │
       │                            └──────────────────┘
       │
       ├─── 400/403 (deactivated) ───────────┐
       │                                      ▼
       │                            ┌──────────────────┐
       │                            │ Clear License    │
       │                            │ Show Deactivated │
       │                            │ Block All Ops    │
       │                            └──────────────────┘
       │
       ├─── 426 (version mismatch) ──────────┐
       │                                      ▼
       │                            ┌──────────────────┐
       │                            │ Show Update      │
       │                            │ Required Screen  │
       │                            └──────────────────┘
       │
       └─── Network Error ───────────────────┐
                                             ▼
                                   ┌──────────────────┐
                                   │ Check Last Valid │
                                   │ < 7 days?        │
                                   └────┬─────────────┘
                                        │
                                        ├─ Yes → Offline Mode
                                        └─ No  → Block App
```

---

## Background Validation

**Frequency:** Every 24 hours (when app is operational)

**Process:**
1. Silent API call to `/api/validate-license`
2. Updates local license state
3. If deactivated → marks for blocking on next launch
4. If active → updates expiration, tier, etc.

**No user interruption unless license is revoked**

---

## Error Handling

### Network Timeout (10 seconds)
```
POS Behavior:
- If last validation < 7 days ago → Offline mode (yellow banner)
- If last validation > 7 days ago → Block app
- Shows "Cannot reach control center" message
```

### HTTP Status Codes

| Status | Meaning | POS Behavior |
|--------|---------|-------------|
| `200` | License valid | Activate app |
| `400` | Invalid license | Show activation screen |
| `401` | Unauthorized | Show activation screen |
| `403` | Forbidden/Deactivated | Block app, show error |
| `426` | Upgrade Required | Force update screen |
| `500` | Server error | Offline mode (if within grace period) |
| `503` | Service unavailable | Offline mode (if within grace period) |

---

## Testing Scenarios

### Test 1: First-Time Activation
```bash
curl -X POST http://localhost:4000/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "TEST-KEY-123",
    "appVersion": "1.0.0",
    "deviceInfo": {
      "platform": "linux",
      "userAgent": "Test"
    }
  }'
```

**Expected:** `200 OK` with `valid: true` and `defaults`

### Test 2: Deactivate Store
```bash
# Return deactivated response
{
  "valid": false,
  "status": "deactivated",
  "message": "Store has been deactivated"
}
```

**Expected:** POS blocks all operations, shows red banner

### Test 3: Force Update
```bash
# Return version mismatch
{
  "valid": false,
  "status": "inactive",
  "message": "Update required",
  "requiredVersion": "2.0.0"
}
```

**Expected:** POS shows update screen, blocks app

### Test 4: Offline Mode
```bash
# Stop control center server
# POS should continue working for 7 days
```

**Expected:** Yellow banner "Offline mode: X days remaining"

---

## Security Considerations

### License Key Storage
- Encrypted with base64 obfuscation in IndexedDB
- Not truly secure (client-side), but provides basic protection
- For production: recommend server-side validation only

### Device Tracking
- POS sends `platform` and `userAgent`
- Control Center can track which devices use each license
- Can implement device limits per license

### API Key (Optional Enhancement)
- Consider adding API key authentication:
  ```
  Headers: {
    "X-API-Key": "your-secret-key"
  }
  ```

---

## Implementation Checklist for Control Center

- [ ] Implement `POST /api/validate-license` endpoint
- [ ] License key database/lookup system
- [ ] Store activation/deactivation logic
- [ ] Default configurations storage (tax, categories, items, etc.)
- [ ] Version requirement enforcement
- [ ] Expiration date tracking
- [ ] Device tracking (optional)
- [ ] Admin dashboard to manage licenses
- [ ] Logging for all validation requests
- [ ] Rate limiting to prevent abuse

---

## Next Steps

1. **Control Center Backend:** Implement the `/api/validate-license` endpoint
2. **Database:** Store licenses, stores, tiers, and defaults
3. **Admin UI:** Create dashboard to manage licenses
4. **Testing:** Test all scenarios (activate, deactivate, version mismatch, offline)
5. **Monitoring:** Log all requests for analytics

---

## Support

For POS integration questions, see: `src/components/licensing/README.md`
