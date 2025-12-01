# Implementation Guide: Opt-In Offline Mode

**Purpose:** Step-by-step implementation prompt for AI agents  
**PRD:** [PRD-Opt-In-Offline-Mode.md](../product/PRD-Opt-In-Offline-Mode.md)  
**Status:** Ready for Implementation

---

## Overview

Change the app from "always offline-first" to "online-only by default" with opt-in offline capability for designated devices.

---

## Required Reading (MUST read before implementing)

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | [PRD-Opt-In-Offline-Mode.md](../product/PRD-Opt-In-Offline-Mode.md) | Full requirements |
| 2 | [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md) | Current architecture |
| 3 | [DATA_STORAGE_STRATEGY.md](../architecture/DATA_STORAGE_STRATEGY.md) | Data storage patterns |
| 4 | [ARCHITECTURE_DECISION_RECORDS.md](../architecture/ARCHITECTURE_DECISION_RECORDS.md) | See ADR-016 |
| 5 | [CLAUDE.md](../../CLAUDE.md) | Agent instructions |

---

## Implementation Phases

### Phase 1: Device Registration & Auth

**Files to modify:**

| File | Changes |
|------|---------|
| `src/services/storeAuthManager.ts` | Add device mode handling in login flow |
| `src/store/slices/authSlice.ts` | Add device state (id, mode, registeredAt) |
| `src/types/device.ts` | **NEW** - Create Device, DevicePolicy, DeviceMode types |
| `src/services/deviceManager.ts` | **NEW** - Device fingerprinting & registration |

**Key implementation:**

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

---

### Phase 2: DataProvider Abstraction

**Files to modify:**

| File | Changes |
|------|---------|
| `src/services/dataProvider.ts` | **NEW** - Abstract data access (API vs IndexedDB) |
| `src/db/database.ts` | Conditional initialization based on mode |
| `src/db/schema.ts` | Add deviceSettings table |
| `src/hooks/useDataMode.ts` | **NEW** - Hook to check current mode |
| `src/contexts/ModeContext.tsx` | **NEW** - React context for current mode |

**Key implementation:**

```typescript
// src/services/dataProvider.ts
class DataProvider {
  private mode: DeviceMode;
  
  constructor(mode: DeviceMode) {
    this.mode = mode;
  }
  
  async getAppointments(date: string): Promise<Appointment[]> {
    if (this.mode === 'offline-enabled') {
      return db.appointments.where('date').equals(date).toArray();
    } else {
      const response = await api.get(`/appointments?date=${date}`);
      return response.data;
    }
  }
  
  async createAppointment(data: CreateAppointmentInput): Promise<Appointment> {
    if (this.mode === 'offline-enabled') {
      // Current flow: IndexedDB → Sync Queue
      const appointment = { ...data, id: generateId(), syncStatus: 'pending' };
      await db.appointments.add(appointment);
      await syncQueue.add('create', 'appointment', appointment);
      return appointment;
    } else {
      // Online-only: Direct API call
      const response = await api.post('/appointments', data);
      return response.data;
    }
  }
  
  // ... similar pattern for all entities
}
```

---

### Phase 3: Redux Thunk Updates

**Files to modify (all slices need conditional IndexedDB logic):**

- `src/store/slices/appointmentsSlice.ts`
- `src/store/slices/ticketsSlice.ts`
- `src/store/slices/transactionsSlice.ts`
- `src/store/slices/clientsSlice.ts`
- `src/store/slices/staffSlice.ts`
- `src/store/slices/servicesSlice.ts`

**Pattern for each thunk:**

```typescript
export const createAppointment = createAsyncThunk(
  'appointments/create',
  async (data: CreateAppointmentInput, { getState }) => {
    const state = getState() as RootState;
    const offlineModeEnabled = state.auth.device?.offlineModeEnabled ?? false;
    
    if (offlineModeEnabled) {
      // Current flow: Redux → IndexedDB → Sync Queue
      const appointment = {
        ...data,
        id: generateId(),
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      await db.appointments.add(appointment);
      await syncQueue.add('create', 'appointment', appointment);
      return appointment;
    } else {
      // Online-only: Direct API call
      const response = await api.post('/appointments', data);
      return response.data;
    }
  }
);
```

---

### Phase 4: Sync System Updates

**Files to modify:**

| File | Changes |
|------|---------|
| `src/services/syncManager.ts` | Disable if online-only mode |
| `src/services/syncService.ts` | No-op in online mode |

**Key implementation:**

```typescript
// src/services/syncManager.ts
class SyncManager {
  private offlineModeEnabled: boolean;
  
  async initialize(offlineModeEnabled: boolean) {
    this.offlineModeEnabled = offlineModeEnabled;
    
    if (!this.offlineModeEnabled) {
      console.log('Sync disabled - online-only mode');
      return;
    }
    
    // Current initialization logic...
    this.startBackgroundSync();
  }
  
  async pushChanges() {
    if (!this.offlineModeEnabled) return;
    // Current push logic...
  }
  
  async pullChanges() {
    if (!this.offlineModeEnabled) return;
    // Current pull logic...
  }
}
```

---

### Phase 5: UI Updates

**Files to modify:**

| File | Changes |
|------|---------|
| `src/components/auth/LoginScreen.tsx` | Add device name input, offline toggle (if policy allows) |
| `src/components/common/OnlineModeIndicator.tsx` | **NEW** - Show current mode in header |
| `src/components/common/NetworkErrorScreen.tsx` | **NEW** - For online-only network failures |
| `src/App.tsx` | Initialize based on mode, add revocation checker |

**Login screen additions:**

```tsx
// Add to LoginScreen.tsx
const [deviceName, setDeviceName] = useState('');
const [enableOffline, setEnableOffline] = useState(false);

// In form
<Input
  label="Device Name (optional)"
  placeholder="e.g., Front Desk iPad"
  value={deviceName}
  onChange={(e) => setDeviceName(e.target.value)}
/>

{storePolicy?.allowUserOverride && (
  <Checkbox
    label="Enable offline mode"
    description="Store data on this device for offline access"
    checked={enableOffline}
    onChange={setEnableOffline}
  />
)}
```

**Mode indicator component:**

```tsx
// src/components/common/OnlineModeIndicator.tsx
import { Cloud, WifiOff, CheckCircle } from 'lucide-react';

const OnlineModeIndicator = () => {
  const { device } = useAuth();
  const isOnline = useOnlineStatus();
  const { pendingCount } = useSync();
  
  if (!device?.offlineModeEnabled) {
    return (
      <Badge variant="outline" className="gap-1">
        <Cloud className="h-3 w-3" />
        Online Mode
      </Badge>
    );
  }
  
  if (!isOnline) {
    return (
      <Badge variant="warning" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Offline {pendingCount > 0 && `(${pendingCount} pending)`}
      </Badge>
    );
  }
  
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle className="h-3 w-3" />
      Synced
    </Badge>
  );
};
```

**Network error screen:**

```tsx
// src/components/common/NetworkErrorScreen.tsx
const NetworkErrorScreen = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <WifiOff className="h-16 w-16 text-gray-400 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Connection Required</h2>
      <p className="text-gray-600 text-center mb-6">
        This device requires an internet connection to operate.
        Please check your connection and try again.
      </p>
      <Button onClick={onRetry}>Retry</Button>
      <p className="text-sm text-gray-500 mt-4">
        Need offline access? Contact your administrator.
      </p>
    </div>
  );
};
```

---

### Phase 6: Admin Portal - Device Management

**Files to create/modify:**

| File | Changes |
|------|---------|
| `src/admin/pages/DeviceManagement.tsx` | **NEW** - List devices, toggle offline, revoke |
| `src/admin/pages/StoreSettings.tsx` | Add device policy section |

**Device management page:**

```tsx
// src/admin/pages/DeviceManagement.tsx
const DeviceManagement = () => {
  const { storeId } = useParams();
  const { devices, policy, isLoading } = useDevices(storeId);
  
  const handleToggleOffline = async (deviceId: string, enabled: boolean) => {
    await api.put(`/devices/${deviceId}`, { offlineModeEnabled: enabled });
    refetch();
  };
  
  const handleRevoke = async (deviceId: string, reason: string) => {
    await api.post(`/devices/${deviceId}/revoke`, { reason });
    refetch();
  };
  
  return (
    <div>
      <PageHeader 
        title="Devices" 
        description={`Offline: ${policy.currentOfflineCount} of ${policy.maxOfflineDevices}`}
      />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <span>Store Policy: {policy.defaultMode}</span>
            <Button variant="outline" onClick={() => setShowPolicyModal(true)}>
              Edit Policy
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {devices.map(device => (
            <DeviceRow
              key={device.id}
              device={device}
              onToggleOffline={handleToggleOffline}
              onRevoke={handleRevoke}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## API Endpoints Needed (Backend)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/stores/login` | POST | Modified to include device registration |
| `/api/devices` | GET | List store devices |
| `/api/devices/:id` | PUT | Update device settings |
| `/api/devices/:id/revoke` | POST | Revoke device |
| `/api/devices/check` | GET | Revocation check (called every 5 min) |
| `/api/stores/:id/device-policy` | PUT | Update store policy |

---

## Database Changes (Supabase)

```sql
-- Device Registry
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  user_agent TEXT,
  offline_mode_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revoke_reason TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  registered_by UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  UNIQUE(store_id, device_fingerprint)
);

-- Store device policy (add column)
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
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_devices_store ON devices(store_id);
CREATE INDEX idx_devices_fingerprint ON devices(device_fingerprint);
CREATE INDEX idx_devices_active ON devices(store_id, is_active, is_revoked);
```

---

## Revocation Checker

Add to `src/App.tsx` or create `src/services/revocationChecker.ts`:

```typescript
// src/services/revocationChecker.ts
class RevocationChecker {
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 5 * 60 * 1000; // 5 minutes
  
  start(deviceId: string) {
    this.intervalId = setInterval(() => this.check(deviceId), this.checkInterval);
    // Also check immediately
    this.check(deviceId);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private async check(deviceId: string) {
    try {
      const response = await api.get('/devices/check', {
        headers: { 'X-Device-ID': deviceId }
      });
      
      if (!response.data.valid) {
        await this.handleRevocation(response.data.reason);
      }
    } catch (error) {
      // Network error - continue with grace period if offline-enabled
      console.warn('Revocation check failed:', error);
    }
  }
  
  private async handleRevocation(reason: string) {
    // Clear all local data
    await clearLocalData();
    
    // Logout
    store.dispatch(logout());
    
    // Show message
    toast.error(`Device access revoked: ${reason}`);
  }
}

async function clearLocalData() {
  // Clear IndexedDB
  await db.delete();
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear service worker cache
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
}
```

---

## Testing Requirements

| Test Case | Expected Behavior |
|-----------|-------------------|
| Login (online-only, new device) | No IndexedDB created, device registered |
| Login (offline-enabled, new device) | Full sync, IndexedDB populated |
| Login (existing device, mode unchanged) | Use existing mode |
| Login (existing device, mode changed) | Apply new mode on next login |
| Network failure (online-only) | Show NetworkErrorScreen, retry option |
| Network failure (offline-enabled) | Continue working offline |
| Device revocation | Logout within 5 min, clear all data |
| Mode switch: online → offline | Re-auth required, full sync |
| Mode switch: offline → online | Clear IndexedDB, confirm with user |
| Max offline devices reached | Reject new offline requests |

---

## Feature Flags

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  DEVICE_REGISTRY: true,           // Phase 1
  DEVICE_TRACKING: true,           // Phase 2
  ADMIN_DEVICE_MANAGEMENT: true,   // Phase 4
  ONLINE_ONLY_MODE: true,          // Phase 5
  DEFAULT_ONLINE_ONLY: false,      // Phase 6 (opt-in per store)
};
```

---

## Migration Strategy

1. **Existing devices:** Auto-register on next login, set to `offline-enabled` (preserve current behavior)
2. **New devices:** Follow store policy (default: online-only)
3. **Gradual rollout:** Use feature flags to enable per store

---

## Important Notes

- ✅ Preserve current behavior for existing offline-enabled devices
- ✅ Use feature flags for gradual rollout
- ✅ DataProvider must handle both modes transparently
- ✅ Clear ALL local data when switching from offline to online mode
- ✅ Revocation check should run every 5 minutes
- ❌ Do NOT break existing offline functionality
- ❌ Do NOT force online-only on existing users without migration

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Devices with local data per store | < 20% of logins |
| Time to revoke device access | Immediate (< 5 min) |
| Initial login time (online-only) | < 2 seconds |
| Sync conflicts per day | 50% reduction |

---

## Related Documents

- [PRD-Opt-In-Offline-Mode.md](../product/PRD-Opt-In-Offline-Mode.md) - Full PRD
- [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md) - Architecture
- [DATA_STORAGE_STRATEGY.md](../architecture/DATA_STORAGE_STRATEGY.md) - Data patterns
- [ARCHITECTURE_DECISION_RECORDS.md](../architecture/ARCHITECTURE_DECISION_RECORDS.md) - ADR-016

---

*Last Updated: December 1, 2025*
