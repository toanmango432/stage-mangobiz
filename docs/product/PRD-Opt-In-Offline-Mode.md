# PRD: Opt-In Offline Mode

**Version:** 1.0.0  
**Status:** Draft  
**Author:** Engineering  
**Created:** December 1, 2025  
**Last Updated:** December 1, 2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Model](#7-data-model)
8. [API Specifications](#8-api-specifications)
9. [User Interface](#9-user-interface)
10. [Security Considerations](#10-security-considerations)
11. [Migration Strategy](#11-migration-strategy)
12. [Testing Requirements](#12-testing-requirements)
13. [Rollout Plan](#13-rollout-plan)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Future Considerations](#15-future-considerations)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

### Overview

This PRD defines the implementation of **Opt-In Offline Mode**, a feature that changes the default behavior of Mango POS from "always offline-capable" to "online-only by default with optional offline capability."

### Current State

All devices that log into Mango POS automatically:
- Download and store business data locally (IndexedDB)
- Maintain a 7-day offline grace period
- Sync data bidirectionally with the server

### Proposed State

Devices operate in **online-only mode by default**:
- No local data storage
- All operations require network connectivity
- Designated devices can opt-in to offline mode

### Key Benefits

| Benefit | Impact |
|---------|--------|
| Reduced security risk | Data on 2-3 devices instead of 20+ |
| Simplified compliance | Fewer devices to audit |
| Faster staff onboarding | No initial sync required |
| Cleaner device management | Central control over offline-capable devices |

---

## 2. Problem Statement

### Current Challenges

#### 2.1 Security Risks

| Risk | Description | Severity |
|------|-------------|----------|
| Device theft | All logged-in devices contain full business data | High |
| Ex-employee access | 7-day grace period allows continued access | High |
| Data sprawl | Business data exists on potentially 20+ unmanaged devices | Medium |
| Personal devices | Staff personal phones contain client PII | High |

#### 2.2 Compliance Concerns

- **GDPR/CCPA**: Client PII stored on uncontrolled devices
- **Data residency**: No control over where data physically resides
- **Right to deletion**: Cannot ensure data removed from all devices
- **Audit trail**: Difficult to track which devices have what data

#### 2.3 Operational Issues

- **Storage consumption**: Each device stores potentially 100s of MB
- **Sync conflicts**: More devices = more conflict resolution needed
- **Initial sync time**: New logins require full data download
- **No central control**: Admins cannot manage device data remotely

### Target Users Affected

| User Type | Current Pain | Desired State |
|-----------|--------------|---------------|
| Store Owner | No visibility into which devices have data | Dashboard showing all devices |
| Manager | Cannot revoke device access instantly | Immediate revocation capability |
| Staff | Slow initial login (sync required) | Instant login |
| IT/Compliance | Cannot audit device data | Clear device registry |

---

## 3. Goals & Success Metrics

### Primary Goals

1. **Reduce data exposure** - Minimize number of devices storing business data
2. **Enable device control** - Allow admins to manage offline permissions
3. **Maintain reliability** - Critical devices still work offline
4. **Improve onboarding** - Faster login for online-only users

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Avg devices with local data per store | 100% of logins | <20% of logins | Analytics |
| Time to revoke device access | 7 days (grace period) | Immediate | Manual test |
| Initial login time (online-only) | 5-30s (sync) | <2s | Performance monitoring |
| Sync conflicts per day | Baseline TBD | 50% reduction | Sync logs |
| Security incidents from device theft | N/A | 0 | Incident reports |

### Non-Goals

- This PRD does **not** cover:
  - Remote wipe of device data (future enhancement)
  - Encryption key rotation (separate initiative)
  - Granular data sync (e.g., only sync today's appointments)

---

## 4. User Stories

### 4.1 Store Owner Stories

```
As a store owner,
I want to designate which devices can work offline,
So that I can limit business data exposure to trusted devices only.

Acceptance Criteria:
- Can view list of all registered devices
- Can enable/disable offline mode per device
- Can set a store-wide default policy
- Changes take effect on next login
```

```
As a store owner,
I want to revoke a device's access immediately,
So that a lost/stolen device cannot access business data.

Acceptance Criteria:
- Can revoke any device from admin portal
- Revoked device is logged out within 5 minutes
- Revoked device's local data is cleared on next app open
```

### 4.2 Manager Stories

```
As a manager,
I want the front desk iPads to work offline,
So that we can continue operations during internet outages.

Acceptance Criteria:
- Can request offline mode for specific devices
- Offline devices sync automatically when online
- Clear indicator showing device is offline-capable
```

### 4.3 Staff Stories

```
As a staff member,
I want to quickly check my schedule on my phone,
So that I don't have to wait for data to sync.

Acceptance Criteria:
- Login completes in under 2 seconds
- Can view schedule immediately after login
- No data stored on my personal phone after logout
```

```
As a staff member using an offline-enabled device,
I want the app to work normally during internet outages,
So that I can continue serving customers.

Acceptance Criteria:
- All core functions work offline
- Changes sync automatically when online
- Clear indicator showing offline status
```

### 4.4 IT/Compliance Stories

```
As an IT administrator,
I want to see which devices have business data stored,
So that I can ensure compliance with data policies.

Acceptance Criteria:
- Device registry shows offline-enabled devices
- Can export device list for audits
- Last sync time visible per device
```

---

## 5. Functional Requirements

### 5.1 Device Modes

| Mode | Description | Data Storage | Network Required |
|------|-------------|--------------|------------------|
| **Online-Only** | Default mode, no local persistence | Memory only | Always |
| **Offline-Enabled** | Full offline capability | IndexedDB | Optional |

### 5.2 Mode Determination

```
Login Flow:
1. User enters credentials
2. Server authenticates
3. Server checks device policy:
   a. Is device registered? → Use device setting
   b. Is device new? → Apply store default policy
4. Return mode in login response
5. App initializes in appropriate mode
```

### 5.3 Online-Only Mode Requirements

| Requirement | Description |
|-------------|-------------|
| **No IndexedDB** | Do not create or use IndexedDB tables |
| **Memory-only Redux** | State cleared on logout/refresh |
| **API-first** | All data operations via API |
| **Graceful degradation** | Show error on network failure |
| **No sync queue** | Not applicable |
| **Session-based auth** | Token in memory only |

### 5.4 Offline-Enabled Mode Requirements

| Requirement | Description |
|-------------|-------------|
| **Full IndexedDB** | Current behavior maintained |
| **Persistent Redux** | State survives refresh |
| **Local-first** | Read from IndexedDB, sync in background |
| **Offline grace** | 7-day offline operation |
| **Sync queue** | Queue operations for later sync |
| **Encrypted storage** | Sensitive data encrypted (AES-256) |

### 5.5 Device Registration

| Requirement | Description |
|-------------|-------------|
| **Auto-registration** | Device registered on first login |
| **Fingerprinting** | Unique device identifier generated |
| **Naming** | User can name device (e.g., "Front Desk iPad") |
| **Visibility** | All devices visible in admin portal |

### 5.6 Admin Controls

| Control | Description |
|---------|-------------|
| **Store default policy** | `online-only` / `offline-enabled` / `ask-user` |
| **Per-device override** | Enable/disable offline for specific device |
| **Max offline devices** | Limit number of offline-enabled devices |
| **Device revocation** | Immediately invalidate device access |

### 5.7 Mode Switching

| Scenario | Behavior |
|----------|----------|
| Online → Offline enabled | Next login triggers full sync |
| Offline → Online only | Next login clears local data |
| Revoked device | Immediate logout, clear data on next open |

---

## 6. Technical Architecture

### 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   UI Layer   │───▶│ Data Provider│───▶│  Mode Check  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                              │                   │               │
│                              ▼                   ▼               │
│                 ┌────────────────────────────────────┐          │
│                 │         Mode Router                 │          │
│                 └────────────────────────────────────┘          │
│                        │                    │                    │
│            ┌───────────┴───────┐  ┌────────┴────────┐           │
│            ▼                   ▼  ▼                  ▼           │
│  ┌──────────────────┐  ┌──────────────────────────────┐         │
│  │   Online-Only    │  │      Offline-Enabled         │         │
│  │                  │  │                              │         │
│  │  ┌────────────┐  │  │  ┌────────────┐ ┌─────────┐ │         │
│  │  │  API Only  │  │  │  │  IndexedDB │ │Sync Queue│ │         │
│  │  └────────────┘  │  │  └────────────┘ └─────────┘ │         │
│  │                  │  │                              │         │
│  │  ┌────────────┐  │  │  ┌────────────────────────┐ │         │
│  │  │Memory Redux│  │  │  │  Persistent Redux      │ │         │
│  │  └────────────┘  │  │  └────────────────────────┘ │         │
│  └──────────────────┘  └──────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth API   │  │  Device API  │  │   Sync API   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │  Device Registry │                         │
│                    │    (Supabase)    │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Component Changes

#### New Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `DataProvider` | Abstract data access (API vs IndexedDB) | `src/services/dataProvider.ts` |
| `DeviceManager` | Device registration & fingerprinting | `src/services/deviceManager.ts` |
| `ModeContext` | React context for current mode | `src/contexts/ModeContext.tsx` |
| `OnlineModeIndicator` | UI indicator for online-only mode | `src/components/common/` |

#### Modified Components

| Component | Changes |
|-----------|---------|
| `storeAuthManager.ts` | Handle device mode in login flow |
| `authSlice.ts` | Store `offlineModeEnabled` in state |
| `database.ts` | Conditional initialization |
| `syncManager.ts` | No-op in online-only mode |
| All Redux slices | Use DataProvider instead of direct DB access |
| `App.tsx` | Initialize based on mode |
| `LoginScreen` | Optional mode toggle |

### 6.3 Data Flow: Online-Only Mode

```
User Action
    │
    ▼
┌─────────────────┐
│  Redux Dispatch │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Async Thunk    │────▶│    API Call     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │◀──────────────────────┘
         ▼
┌─────────────────┐
│  Update Redux   │ (memory only)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   UI Updates    │
└─────────────────┘
```

### 6.4 Data Flow: Offline-Enabled Mode

```
User Action
    │
    ▼
┌─────────────────┐
│  Redux Dispatch │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Async Thunk    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│ Redux │ │ IndexedDB │
└───┬───┘ └─────┬─────┘
    │           │
    │           ▼
    │     ┌───────────┐
    │     │Sync Queue │
    │     └─────┬─────┘
    │           │
    ▼           ▼
┌─────────────────┐
│   UI Updates    │
└─────────────────┘
         
(Background)
    │
    ▼
┌─────────────────┐
│  Sync Engine    │◀───▶ Server
└─────────────────┘
```

---

## 7. Data Model

### 7.1 New Tables (Cloud - Supabase)

```sql
-- Device Registry
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Device identification
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT, -- 'ios', 'android', 'web', 'desktop'
  user_agent TEXT,
  
  -- Mode settings
  offline_mode_enabled BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revoke_reason TEXT,
  
  -- Tracking
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  registered_by UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(store_id, device_fingerprint)
);

-- Store device policy
ALTER TABLE stores ADD COLUMN device_policy JSONB DEFAULT '{
  "defaultMode": "online-only",
  "allowUserOverride": false,
  "maxOfflineDevices": 5,
  "offlineGraceDays": 7
}';

-- Device activity log
CREATE TABLE device_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES devices(id),
  action TEXT NOT NULL, -- 'login', 'logout', 'sync', 'mode_change', 'revoke'
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_devices_store ON devices(store_id);
CREATE INDEX idx_devices_fingerprint ON devices(device_fingerprint);
CREATE INDEX idx_devices_active ON devices(store_id, is_active, is_revoked);
CREATE INDEX idx_device_activity_device ON device_activity_log(device_id, created_at);
```

### 7.2 New Tables (Local - IndexedDB)

```typescript
// Only created if offline mode enabled
interface LocalDeviceSettings {
  key: 'device_settings';
  deviceId: string;
  offlineModeEnabled: boolean;
  lastSyncAt: string;
  syncCheckpoint: string;
}

// Dexie schema addition
this.version(7).stores({
  // ... existing tables ...
  deviceSettings: 'key'  // Single row table
});
```

### 7.3 Modified Types

```typescript
// src/types/device.ts

export type DeviceMode = 'online-only' | 'offline-enabled';

export type DeviceType = 'ios' | 'android' | 'web' | 'desktop';

export interface Device {
  id: string;
  tenantId: string;
  storeId: string;
  deviceFingerprint: string;
  deviceName: string | null;
  deviceType: DeviceType;
  userAgent: string;
  offlineModeEnabled: boolean;
  isActive: boolean;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;
  registeredAt: string;
  registeredBy: string;
  lastLoginAt: string | null;
  lastSyncAt: string | null;
}

export interface DevicePolicy {
  defaultMode: DeviceMode;
  allowUserOverride: boolean;
  maxOfflineDevices: number;
  offlineGraceDays: number;
}

export interface DeviceRegistration {
  deviceFingerprint: string;
  deviceName?: string;
  deviceType: DeviceType;
  userAgent: string;
  requestedMode?: DeviceMode;
}
```

### 7.4 Auth State Changes

```typescript
// src/store/slices/authSlice.ts

interface AuthState {
  // ... existing fields ...
  
  // New fields
  device: {
    id: string;
    mode: DeviceMode;
    registeredAt: string;
  } | null;
}

interface LoginResponse {
  // ... existing fields ...
  
  // New fields
  device: {
    id: string;
    offlineModeEnabled: boolean;
    isNewDevice: boolean;
  };
  storePolicy: DevicePolicy;
}
```

---

## 8. API Specifications

### 8.1 Authentication Changes

#### POST /auth/stores/login

**Request** (modified):
```json
{
  "storeId": "string",
  "password": "string",
  "device": {
    "fingerprint": "string",
    "name": "string (optional)",
    "type": "web | ios | android | desktop",
    "userAgent": "string",
    "requestedMode": "online-only | offline-enabled (optional)"
  }
}
```

**Response** (modified):
```json
{
  "success": true,
  "store": { ... },
  "token": "string",
  "refreshToken": "string",
  "device": {
    "id": "uuid",
    "offlineModeEnabled": false,
    "isNewDevice": true
  },
  "storePolicy": {
    "defaultMode": "online-only",
    "allowUserOverride": false,
    "maxOfflineDevices": 5,
    "offlineGraceDays": 7
  }
}
```

### 8.2 Device Management API

#### GET /api/devices

List all devices for a store.

**Response**:
```json
{
  "devices": [
    {
      "id": "uuid",
      "deviceName": "Front Desk iPad",
      "deviceType": "ios",
      "offlineModeEnabled": true,
      "isActive": true,
      "isRevoked": false,
      "registeredAt": "2025-12-01T10:00:00Z",
      "lastLoginAt": "2025-12-01T11:30:00Z",
      "lastSyncAt": "2025-12-01T11:35:00Z"
    }
  ],
  "policy": {
    "defaultMode": "online-only",
    "maxOfflineDevices": 5,
    "currentOfflineCount": 2
  }
}
```

#### PUT /api/devices/:id

Update device settings.

**Request**:
```json
{
  "deviceName": "string (optional)",
  "offlineModeEnabled": "boolean (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "device": { ... },
  "effectiveOnNextLogin": true
}
```

#### POST /api/devices/:id/revoke

Revoke device access.

**Request**:
```json
{
  "reason": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "device": {
    "id": "uuid",
    "isRevoked": true,
    "revokedAt": "2025-12-01T12:00:00Z"
  }
}
```

#### PUT /api/stores/:id/device-policy

Update store device policy.

**Request**:
```json
{
  "defaultMode": "online-only | offline-enabled",
  "allowUserOverride": false,
  "maxOfflineDevices": 5,
  "offlineGraceDays": 7
}
```

### 8.3 Revocation Check API

#### GET /api/devices/check

Called periodically by app to check if device is revoked.

**Request Headers**:
```
Authorization: Bearer <token>
X-Device-ID: <device-id>
```

**Response** (normal):
```json
{
  "valid": true,
  "offlineModeEnabled": true
}
```

**Response** (revoked):
```json
{
  "valid": false,
  "reason": "revoked",
  "message": "This device has been revoked by administrator"
}
```

---

## 9. User Interface

### 9.1 Login Screen Changes

```
┌─────────────────────────────────────────┐
│                                         │
│            🥭 Mango POS                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Store ID                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Password                      👁  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Device Name (optional)            │  │
│  │ e.g., "Front Desk iPad"           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ☐ Enable offline mode                  │
│    Store data on this device for        │
│    offline access                       │
│    (Only shown if policy allows)        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │             Login                 │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### 9.2 Mode Indicator (App Header)

**Online-Only Mode:**
```
┌─────────────────────────────────────────┐
│ ☁️ Online Mode    │ Store Name │ 👤 User │
└─────────────────────────────────────────┘
```

**Offline-Enabled Mode (Online):**
```
┌─────────────────────────────────────────┐
│ ✅ Synced         │ Store Name │ 👤 User │
└─────────────────────────────────────────┘
```

**Offline-Enabled Mode (Offline):**
```
┌─────────────────────────────────────────┐
│ 📴 Offline (3 pending) │ Store │ 👤 User │
└─────────────────────────────────────────┘
```

### 9.3 Network Error (Online-Only Mode)

```
┌─────────────────────────────────────────┐
│                                         │
│         ⚠️ Connection Required          │
│                                         │
│   This device requires an internet      │
│   connection to operate.                │
│                                         │
│   Please check your connection and      │
│   try again.                            │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │          Retry                  │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Need offline access? Contact your     │
│   administrator.                        │
│                                         │
└─────────────────────────────────────────┘
```

### 9.4 Admin Portal - Device Management

```
┌─────────────────────────────────────────────────────────────────┐
│ Devices                                              [+ Add]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Store Policy: Online-Only by Default    [Edit Policy]          │
│ Offline Devices: 2 of 5 allowed                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📱 Front Desk iPad #1                                       │ │
│ │ iOS • Registered Nov 15, 2025 • Last seen: 2 min ago        │ │
│ │ ✅ Offline Enabled                      [Disable] [Revoke]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📱 Front Desk iPad #2                                       │ │
│ │ iOS • Registered Nov 15, 2025 • Last seen: 5 min ago        │ │
│ │ ✅ Offline Enabled                      [Disable] [Revoke]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💻 Sarah's iPhone                                           │ │
│ │ iOS • Registered Nov 20, 2025 • Last seen: 1 hour ago       │ │
│ │ ☁️ Online Only                          [Enable]  [Revoke]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💻 Mike's Android                                           │ │
│ │ Android • Registered Nov 22, 2025 • Last seen: 3 days ago   │ │
│ │ ☁️ Online Only                          [Enable]  [Revoke]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🚫 Old iPad (Revoked)                                       │ │
│ │ iOS • Revoked Dec 1, 2025 by Admin                          │ │
│ │ Reason: Device lost                         [Delete Record] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.5 Device Policy Modal

```
┌─────────────────────────────────────────┐
│ Device Policy                       ✕   │
├─────────────────────────────────────────┤
│                                         │
│ Default Mode for New Devices            │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Online-Only (Recommended)        │ │
│ │ ○ Offline-Enabled                  │ │
│ │ ○ Ask User at Login                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Maximum Offline Devices                 │
│ ┌───────┐                               │
│ │   5   │ devices                       │
│ └───────┘                               │
│                                         │
│ Offline Grace Period                    │
│ ┌───────┐                               │
│ │   7   │ days                          │
│ └───────┘                               │
│                                         │
│ ☐ Allow users to request offline mode   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │           Save Changes              │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 10. Security Considerations

### 10.1 Device Fingerprinting

Generate a stable, unique identifier per device:

```typescript
async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency,
    // Add more entropy sources
  ];
  
  const data = components.join('|');
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(data)
  );
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 10.2 Revocation Enforcement

```typescript
// Check revocation status periodically
class RevocationChecker {
  private interval: number = 5 * 60 * 1000; // 5 minutes
  
  async check(): Promise<void> {
    try {
      const response = await api.get('/devices/check');
      
      if (!response.valid) {
        await this.handleRevocation(response.reason);
      }
    } catch (error) {
      // Network error - continue with grace period if offline-enabled
    }
  }
  
  private async handleRevocation(reason: string): Promise<void> {
    // Clear all local data
    await db.delete();
    
    // Clear Redux state
    store.dispatch(logout());
    
    // Show revocation message
    showRevocationModal(reason);
  }
}
```

### 10.3 Mode Transition Security

| Transition | Security Action |
|------------|-----------------|
| First login (online-only) | No local data created |
| First login (offline) | Full sync, data encrypted |
| Online → Offline | Requires re-authentication, full sync |
| Offline → Online | Clear IndexedDB, confirm with user |
| Revocation | Immediate logout, clear all data |

### 10.4 Data Clearing

```typescript
async function clearLocalData(): Promise<void> {
  // 1. Clear IndexedDB
  await db.delete();
  
  // 2. Clear localStorage
  localStorage.clear();
  
  // 3. Clear sessionStorage
  sessionStorage.clear();
  
  // 4. Clear service worker cache
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
  
  // 5. Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
  }
}
```

---

## 11. Migration Strategy

### 11.1 Existing Devices

All existing logged-in devices will be:
1. Automatically registered in device registry
2. Set to `offline-enabled` (preserving current behavior)
3. Visible in admin portal

### 11.2 Migration Steps

| Phase | Action | Rollback |
|-------|--------|----------|
| 1 | Deploy device registry (backend) | Drop table |
| 2 | Deploy device tracking (frontend) | Feature flag off |
| 3 | Register existing devices on next login | N/A |
| 4 | Enable admin portal device management | Hide UI |
| 5 | Enable online-only mode option | Feature flag off |
| 6 | Change default to online-only (optional) | Revert config |

### 11.3 Feature Flags

```typescript
const FEATURE_FLAGS = {
  DEVICE_REGISTRY: true,           // Phase 1
  DEVICE_TRACKING: true,           // Phase 2
  ADMIN_DEVICE_MANAGEMENT: true,   // Phase 4
  ONLINE_ONLY_MODE: true,          // Phase 5
  DEFAULT_ONLINE_ONLY: false,      // Phase 6 (opt-in per store)
};
```

---

## 12. Testing Requirements

### 12.1 Unit Tests

| Component | Test Cases |
|-----------|------------|
| `DeviceManager` | Fingerprint generation, registration |
| `DataProvider` | Mode switching, API vs IndexedDB routing |
| `RevocationChecker` | Check interval, revocation handling |
| `authSlice` | Device state management |

### 12.2 Integration Tests

| Scenario | Expected Behavior |
|----------|-------------------|
| Login (online-only, new device) | No IndexedDB created, device registered |
| Login (offline-enabled, new device) | Full sync, IndexedDB populated |
| Login (existing device, mode unchanged) | Use existing mode |
| Login (existing device, mode changed) | Apply new mode |
| Network failure (online-only) | Show error, retry option |
| Network failure (offline-enabled) | Continue offline |
| Device revocation | Logout, clear data |
| Mode switch online→offline | Re-auth, full sync |
| Mode switch offline→online | Clear data, confirm |

### 12.3 E2E Tests

| Flow | Steps |
|------|-------|
| Full online-only journey | Login → Use app → Logout → Verify no data |
| Full offline journey | Login → Go offline → Use app → Go online → Verify sync |
| Admin revocation | Admin revokes → Device logged out within 5 min |
| Policy change | Admin changes policy → New logins follow policy |

### 12.4 Performance Tests

| Metric | Online-Only Target | Offline Target |
|--------|-------------------|----------------|
| Login time | <2s | <5s (with sync) |
| Page load | <1s | <500ms |
| Action response | <500ms | <100ms |
| Logout + clear | <2s | <3s |

---

## 13. Rollout Plan

### Phase 1: Foundation (Week 1-2)

- [ ] Device registry backend (Supabase)
- [ ] Device fingerprinting
- [ ] Device registration on login
- [ ] Device tracking API

### Phase 2: Admin Portal (Week 3)

- [ ] Device list page
- [ ] Device policy settings
- [ ] Revocation functionality
- [ ] Activity logging

### Phase 3: Online-Only Mode (Week 4-5)

- [ ] DataProvider abstraction
- [ ] Redux thunk modifications
- [ ] Online-only initialization
- [ ] Network error handling

### Phase 4: Mode Switching (Week 6)

- [ ] Login screen toggle
- [ ] Mode transition logic
- [ ] Data clearing on mode change
- [ ] Revocation enforcement

### Phase 5: Polish & Testing (Week 7-8)

- [ ] UI indicators
- [ ] Edge case handling
- [ ] Performance optimization
- [ ] Full test coverage

### Phase 6: Rollout (Week 9+)

- [ ] Beta with select stores
- [ ] Monitor metrics
- [ ] Gradual rollout
- [ ] Documentation

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Online-only mode too slow | Medium | High | Optimize API, add loading states |
| Users confused by modes | Medium | Medium | Clear UI, onboarding |
| Fingerprint collisions | Low | Medium | Multiple entropy sources |
| Migration breaks existing users | Low | High | Preserve current behavior as default |
| Network dependency issues | Medium | High | Graceful degradation, clear messaging |
| Admin accidentally revokes wrong device | Low | Medium | Confirmation dialog, undo option |

---

## 15. Future Considerations

### 15.1 Potential Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Remote wipe | Admin can force-clear device data | High |
| Selective sync | Only sync today's data | Medium |
| Device groups | Group policies (e.g., "Front Desk") | Low |
| Geo-fencing | Only allow offline in certain locations | Low |
| Biometric unlock | Require Face ID/fingerprint for offline | Medium |
| Encryption key rotation | Periodic key refresh | Medium |

### 15.2 Not In Scope

- MDM (Mobile Device Management) integration
- Hardware security keys
- Multi-factor authentication for offline
- Offline time limits (beyond grace period)

---

## 16. Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **Online-Only Mode** | Device mode where no data is stored locally |
| **Offline-Enabled Mode** | Device mode with full local data storage |
| **Device Fingerprint** | Unique identifier generated from device characteristics |
| **Device Registry** | Central database of all registered devices |
| **Revocation** | Immediate invalidation of device access |
| **Grace Period** | Time allowed for offline operation |

### B. Related Documents

- [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md)
- [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md)
- [ARCHITECTURE_DECISION_RECORDS.md](./architecture/ARCHITECTURE_DECISION_RECORDS.md)

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Dec 1, 2025 | Engineering | Initial draft |

---

*Document Status: Draft - Pending Review*
