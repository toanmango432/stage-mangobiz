# Licensing System

This directory contains the complete licensing and remote control system for Mango POS.

## Overview

The licensing system provides:
- ✅ License key activation and validation
- ✅ Remote control via Control Center backend
- ✅ Offline grace period (7 days)
- ✅ Background license checks (every 24 hours)
- ✅ First-time defaults population
- ✅ Operation blocking when deactivated
- ✅ Version enforcement

## Components

### ActivationScreen.tsx
Full-screen activation interface shown when:
- No license key is stored
- License is invalid/deactivated
- License expired or grace period exceeded
- App version mismatch

### LicenseBanner.tsx
Non-intrusive banner showing license status:
- Offline mode warning
- Deactivated license error
- Version mismatch alert

### LicenseSettings.tsx
Settings page for managing license:
- View current license status
- Change/update license key
- Refresh license validation
- View store ID and tier

## Services

### licenseManager.ts
Core license management:
```typescript
import { licenseManager } from '@/services/licenseManager';

// Initialize on app start
await licenseManager.initialize();

// Check if operational
if (licenseManager.isOperational()) {
  // Allow normal operation
}

// Check if blocked
if (licenseManager.isBlocked()) {
  // Block operations
}

// Subscribe to license changes
const unsubscribe = licenseManager.subscribe((state) => {
  console.log('License state changed:', state);
});
```

### secureStorage.ts
Encrypted storage for license data:
```typescript
import { secureStorage } from '@/services/secureStorage';

// Get license key
const key = await secureStorage.getLicenseKey();

// Set license key
await secureStorage.setLicenseKey('XXXX-XXXX-XXXX-XXXX');

// Clear all license data
await secureStorage.clearLicenseData();
```

### defaultsPopulator.ts
Populate defaults from Control Center:
```typescript
import { defaultsPopulator } from '@/services/defaultsPopulator';

// Apply defaults (first-time only)
await defaultsPopulator.applyDefaults(salonId);
```

## Hooks

### useLicenseGuard.ts
React hook for operation protection:
```typescript
import { useLicenseGuard } from '@/hooks/useLicenseGuard';

function MyComponent() {
  const { canPerformOperation, guardOperation, isBlocked } = useLicenseGuard();

  const handleCheckout = () => {
    // Check before operation
    if (!canPerformOperation('Checkout')) {
      return; // Shows error toast
    }

    // Perform checkout
    processCheckout();
  };

  // Or use guard wrapper
  const handleCreate = () => {
    guardOperation(() => {
      createTicket();
    }, 'Create ticket');
  };

  // Disable buttons if blocked
  return (
    <button disabled={isBlocked} onClick={handleCheckout}>
      Checkout
    </button>
  );
}
```

### useReadOnlyMode.ts
Simple read-only check:
```typescript
import { useReadOnlyMode } from '@/hooks/useLicenseGuard';

function MyComponent() {
  const { isReadOnly, canEdit } = useReadOnlyMode();

  return (
    <div>
      <input disabled={isReadOnly} />
      {canEdit && <button>Save</button>}
    </div>
  );
}
```

## API Integration

### Control Center Endpoints

**POST /api/validate-license**

Request:
```json
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "appVersion": "1.0.0",
  "deviceInfo": {
    "platform": "linux",
    "userAgent": "Mozilla/5.0..."
  }
}
```

Response (Success):
```json
{
  "valid": true,
  "storeId": "store_123",
  "tier": "premium",
  "status": "active",
  "defaults": {
    "taxSettings": [...],
    "categories": [...],
    "items": [...],
    "employeeRoles": [...],
    "paymentMethods": [...]
  },
  "requiredVersion": "1.0.0",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

Response (Error):
```json
{
  "valid": false,
  "status": "deactivated",
  "message": "License has been deactivated"
}
```

## License States

- `not_activated` - No license key stored
- `active` - Valid and operational
- `deactivated` - License revoked
- `expired` - License expired
- `offline_grace` - Offline but within 7-day grace period
- `offline_expired` - Offline grace period exceeded
- `version_mismatch` - App version too old
- `checking` - Currently validating

## Configuration

### Environment Variables

Add to `.env`:
```bash
VITE_CONTROL_CENTER_URL=http://localhost:4000
```

### App Version

Update in `src/services/licenseManager.ts`:
```typescript
const APP_VERSION = '1.0.0';
```

## Usage Examples

### Protecting a Component

```typescript
import { useLicenseGuard } from '@/hooks/useLicenseGuard';

function CheckoutButton() {
  const { guardOperationAsync, isBlocked } = useLicenseGuard();

  const handleCheckout = async () => {
    await guardOperationAsync(async () => {
      await processCheckout();
    }, 'Process checkout');
  };

  return (
    <button
      disabled={isBlocked}
      onClick={handleCheckout}
    >
      Checkout
    </button>
  );
}
```

### Manual License Check

```typescript
import { licenseManager } from '@/services/licenseManager';

// Force license revalidation
const state = await licenseManager.checkLicense();

if (state.status === 'active') {
  console.log('License is active!');
}
```

### Testing

```typescript
// Simulate offline mode
window.dispatchEvent(new Event('offline'));

// Simulate online mode
window.dispatchEvent(new Event('online'));

// Clear license data
import { secureStorage } from '@/services/secureStorage';
await secureStorage.clearAll();
```

## Notes

- License validation happens on app startup
- Background checks run every 24 hours when operational
- Offline grace period is 7 days from last successful validation
- All critical operations (checkout, booking, edits) should be guarded
- Read-only mode allows viewing but blocks all modifications
- Defaults are only applied once on first activation
