# Technical Specification: Multi-Store Client Handling

**Version:** 1.0
**Created:** January 6, 2026
**Status:** Draft
**Related PRD:** [PRD-Clients-CRM-Module.md](../product/PRD-Clients-CRM-Module.md) - Section 12

---

## Overview

This document provides detailed technical implementation guidance for the two-tier multi-store client handling system:

- **Tier 1: Mango Ecosystem** - Cross-brand client sharing (client-controlled)
- **Tier 2: Organization** - Same-brand multi-location sharing (business-controlled)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MANGO CLOUD                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │  Mango Identity      │    │  Organization        │                       │
│  │  Service (Tier 1)    │    │  Service (Tier 2)    │                       │
│  │                      │    │                      │                       │
│  │  - Hashed lookups    │    │  - Sharing config    │                       │
│  │  - Consent mgmt      │    │  - Location groups   │                       │
│  │  - Link requests     │    │  - Safety sync       │                       │
│  └──────────┬───────────┘    └──────────┬───────────┘                       │
│             │                           │                                    │
│             └───────────┬───────────────┘                                   │
│                         │                                                    │
│                         ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Supabase PostgreSQL                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ mango_       │  │ linked_      │  │ profile_link │                │   │
│  │  │ identities   │  │ stores       │  │ _requests    │                │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ organizations│  │ stores       │  │ clients      │                │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ Store A   │   │ Store B   │   │ Store C   │
            │ (Org XYZ) │   │ (Org XYZ) │   │ (Ind.)    │
            └───────────┘   └───────────┘   └───────────┘
```

### Data Flow Patterns

#### Tier 1: Ecosystem Profile Lookup

```
1. Staff enters phone number for new client
2. App hashes phone: SHA-256(normalize(phone) + ECOSYSTEM_SALT)
3. API call: GET /identity/lookup?hash={hashedPhone}
4. If found AND ecosystemOptIn:
   - Return { exists: true, canRequest: true }
   - Staff clicks "Request Profile Link"
   - SMS/email sent to client with approval link
5. If client approves:
   - linked_stores record created
   - Shared data synced based on client's preferences
6. If not found OR not opted in:
   - Staff creates new local profile
```

#### Tier 2: Organization Client Access

```
1. Client visits Location B (first time)
2. Staff enters phone number
3. API checks: clients WHERE phone = X AND organization_id = {orgId}
4. If found in another location:
   - Check organization sharing mode
   - FULL: Return full profile, create location link
   - SELECTIVE: Return allowed categories only
   - ISOLATED: Return only safety data (allergies, blocks)
5. If not found:
   - Create new client profile
   - Associate with organization
   - Set home_location_id = current location
```

---

## Database Schema

### New Tables

```sql
-- ============================================================
-- TIER 1: MANGO ECOSYSTEM TABLES
-- ============================================================

-- Central identity registry (hashed, no PII)
CREATE TABLE mango_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashed_phone VARCHAR(64) UNIQUE NOT NULL,
  hashed_email VARCHAR(64),
  ecosystem_opt_in BOOLEAN DEFAULT FALSE,
  opt_in_date TIMESTAMPTZ,
  opt_out_date TIMESTAMPTZ,
  sharing_preferences JSONB DEFAULT '{
    "basicInfo": true,
    "preferences": true,
    "visitHistory": false,
    "loyaltyData": false
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_mango_identities_hashed_phone ON mango_identities(hashed_phone);
CREATE INDEX idx_mango_identities_hashed_email ON mango_identities(hashed_email);
CREATE INDEX idx_mango_identities_opt_in ON mango_identities(ecosystem_opt_in) WHERE ecosystem_opt_in = true;

-- Stores linked to a mango identity
CREATE TABLE linked_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mango_identity_id UUID NOT NULL REFERENCES mango_identities(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  local_client_id UUID NOT NULL,  -- Reference to client in that store
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  linked_by VARCHAR(20) NOT NULL CHECK (linked_by IN ('client', 'request_approved')),
  access_level VARCHAR(20) DEFAULT 'basic' CHECK (access_level IN ('full', 'basic')),
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mango_identity_id, store_id)
);

CREATE INDEX idx_linked_stores_identity ON linked_stores(mango_identity_id);
CREATE INDEX idx_linked_stores_store ON linked_stores(store_id);

-- Profile link requests (24-hour expiry)
CREATE TABLE profile_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_store_id UUID NOT NULL,
  requesting_store_name VARCHAR(255) NOT NULL,
  mango_identity_id UUID NOT NULL REFERENCES mango_identities(id),
  requesting_staff_id UUID,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  approval_token VARCHAR(64) UNIQUE,  -- For client approval link
  notification_sent_at TIMESTAMPTZ,
  notification_method VARCHAR(10) CHECK (notification_method IN ('sms', 'email', 'both'))
);

CREATE INDEX idx_link_requests_status ON profile_link_requests(status) WHERE status = 'pending';
CREATE INDEX idx_link_requests_token ON profile_link_requests(approval_token) WHERE status = 'pending';

-- Consent audit log
CREATE TABLE ecosystem_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mango_identity_id UUID NOT NULL REFERENCES mango_identities(id),
  action VARCHAR(50) NOT NULL,  -- 'opt_in', 'opt_out', 'update_preferences', 'link_store', 'unlink_store'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_log_identity ON ecosystem_consent_log(mango_identity_id);

-- ============================================================
-- TIER 2: ORGANIZATION TABLES (extend existing)
-- ============================================================

-- Add to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS client_sharing_settings JSONB DEFAULT '{
  "sharingMode": "isolated",
  "sharedCategories": {
    "profiles": false,
    "safetyData": true,
    "visitHistory": false,
    "staffNotes": false,
    "loyaltyData": false,
    "walletData": false
  },
  "loyaltyScope": "location",
  "giftCardScope": "location",
  "membershipScope": "location",
  "allowCrossLocationBooking": false
}';

-- Add to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS home_location_id UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mango_identity_id UUID REFERENCES mango_identities(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_visible BOOLEAN DEFAULT TRUE;

CREATE INDEX idx_clients_organization ON clients(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_clients_mango_identity ON clients(mango_identity_id) WHERE mango_identity_id IS NOT NULL;

-- Cross-location visit tracking
CREATE TABLE cross_location_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  organization_id UUID NOT NULL,
  location_id UUID NOT NULL,
  visit_date DATE NOT NULL,
  appointment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cross_visits_client ON cross_location_visits(client_id, organization_id);
```

### Row Level Security (RLS) Policies

```sql
-- Mango identities: No direct access, only through functions
ALTER TABLE mango_identities ENABLE ROW LEVEL SECURITY;

-- Linked stores: Store can see their own links
ALTER TABLE linked_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY linked_stores_select ON linked_stores
  FOR SELECT USING (store_id = current_setting('app.store_id')::uuid);

-- Profile link requests: Requesting store can see their requests
ALTER TABLE profile_link_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY link_requests_select ON profile_link_requests
  FOR SELECT USING (requesting_store_id = current_setting('app.store_id')::uuid);

-- Organization clients: Based on sharing mode
CREATE POLICY clients_org_select ON clients
  FOR SELECT USING (
    -- Always see own store's clients
    store_id = current_setting('app.store_id')::uuid
    OR
    -- See organization clients based on settings
    (
      organization_id = current_setting('app.organization_id')::uuid
      AND organization_visible = true
      AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id
        AND (o.client_sharing_settings->>'sharingMode') != 'isolated'
      )
    )
  );
```

---

## API Endpoints

### Tier 1: Ecosystem APIs

```typescript
// Supabase Edge Functions

// POST /functions/v1/identity/lookup
interface LookupRequest {
  hashedPhone: string;
  hashedEmail?: string;
}
interface LookupResponse {
  exists: boolean;
  canRequest: boolean;  // True if opted in
  identityId?: string;  // Only if canRequest
}

// POST /functions/v1/identity/request-link
interface RequestLinkRequest {
  identityId: string;
  storeId: string;
  storeName: string;
  staffId?: string;
  notificationMethod: 'sms' | 'email' | 'both';
}
interface RequestLinkResponse {
  requestId: string;
  expiresAt: string;
}

// POST /functions/v1/identity/approve-link (called via client approval link)
interface ApproveLinkRequest {
  token: string;  // From approval link
  approved: boolean;
}

// POST /functions/v1/identity/opt-in
interface OptInRequest {
  clientId: string;  // Local client ID
  phone: string;
  email?: string;
  sharingPreferences: SharingPreferences;
}

// POST /functions/v1/identity/opt-out
interface OptOutRequest {
  identityId: string;
}

// GET /functions/v1/identity/linked-stores
interface LinkedStoresResponse {
  stores: {
    storeId: string;
    storeName: string;
    linkedAt: string;
    accessLevel: 'full' | 'basic';
  }[];
}

// DELETE /functions/v1/identity/unlink-store/:storeId
```

### Tier 2: Organization APIs

```typescript
// GET /rest/v1/clients?organization_id=eq.{orgId}&select=*
// RLS automatically filters based on sharing mode

// PATCH /rest/v1/organizations/{orgId}
// Update client_sharing_settings

// GET /rest/v1/clients/{clientId}/cross-location-history
interface CrossLocationHistory {
  visits: {
    locationId: string;
    locationName: string;
    visitDate: string;
    services: string[];
  }[];
}
```

---

## Frontend Implementation

### Redux Slice Extensions

```typescript
// src/store/slices/clientsSlice.ts

interface ClientsState {
  // ... existing state

  // Multi-store extensions
  ecosystemLookupResult: EcosystemLookupResult | null;
  pendingLinkRequests: ProfileLinkRequest[];
  organizationClients: Client[];  // Clients from other locations
  sharingSettings: OrganizationClientSettings | null;
}

// New thunks
export const lookupEcosystemProfile = createAsyncThunk(
  'clients/lookupEcosystemProfile',
  async ({ phone, email }: { phone: string; email?: string }, { getState }) => {
    const hashedPhone = await hashIdentifier(phone);
    const hashedEmail = email ? await hashIdentifier(email) : undefined;

    const response = await supabase.functions.invoke('identity/lookup', {
      body: { hashedPhone, hashedEmail }
    });

    return response.data;
  }
);

export const requestProfileLink = createAsyncThunk(
  'clients/requestProfileLink',
  async ({ identityId }: { identityId: string }, { getState }) => {
    const state = getState() as RootState;
    const store = state.auth.currentStore;

    const response = await supabase.functions.invoke('identity/request-link', {
      body: {
        identityId,
        storeId: store.id,
        storeName: store.name,
        staffId: state.auth.currentUser?.id,
        notificationMethod: 'sms'
      }
    });

    return response.data;
  }
);

export const fetchOrganizationClients = createAsyncThunk(
  'clients/fetchOrganizationClients',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const orgId = state.auth.currentStore?.organizationId;

    if (!orgId) return [];

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', orgId)
      .neq('store_id', state.auth.currentStore.id);

    return toClients(data);
  }
);
```

### Hashing Utility

```typescript
// src/utils/identityHash.ts

const ECOSYSTEM_SALT = import.meta.env.VITE_ECOSYSTEM_SALT;

export async function hashIdentifier(value: string): Promise<string> {
  // Normalize: lowercase, remove spaces, format phone
  const normalized = normalizeIdentifier(value);

  // Combine with salt
  const toHash = `${normalized}${ECOSYSTEM_SALT}`;

  // SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(toHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeIdentifier(value: string): string {
  // Phone: remove all non-digits, ensure country code
  if (/^\+?\d[\d\s\-()]+$/.test(value)) {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('1') ? digits : `1${digits}`;
  }

  // Email: lowercase, trim
  return value.toLowerCase().trim();
}
```

### UI Components

```typescript
// src/components/clients/EcosystemLookupPrompt.tsx

interface EcosystemLookupPromptProps {
  phone: string;
  lookupResult: EcosystemLookupResult;
  onRequestLink: () => void;
  onCreateNew: () => void;
}

export function EcosystemLookupPrompt({
  phone,
  lookupResult,
  onRequestLink,
  onCreateNew
}: EcosystemLookupPromptProps) {
  if (!lookupResult.exists || !lookupResult.canRequest) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Search className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900">
            Mango Profile Found
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            This number is registered in the Mango ecosystem.
            Request permission to link their profile?
          </p>
          <ul className="text-sm text-blue-600 mt-2 space-y-1">
            <li>No duplicate data entry</li>
            <li>Access to allergies & safety info</li>
            <li>Client preferences pre-filled</li>
          </ul>
          <div className="flex gap-2 mt-4">
            <Button onClick={onRequestLink} variant="primary">
              Request Profile Link
            </Button>
            <Button onClick={onCreateNew} variant="outline">
              Create New Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Safety Data Sync

Safety data (allergies, blocks, staff alerts) requires special handling as it must ALWAYS be shared regardless of consent settings.

### Sync Logic

```typescript
// src/services/safetyDataSync.ts

interface SafetyData {
  allergies: string;
  isBlocked: boolean;
  blockReason?: string;
  staffAlert?: StaffAlert;
}

export async function syncSafetyData(
  clientId: string,
  safetyData: SafetyData,
  scope: 'ecosystem' | 'organization'
): Promise<void> {
  if (scope === 'ecosystem') {
    // Sync to all linked stores
    const linkedStores = await getLinkedStores(clientId);

    for (const store of linkedStores) {
      await supabase.functions.invoke('identity/sync-safety', {
        body: {
          sourceStoreId: currentStoreId,
          targetStoreId: store.storeId,
          clientId: store.localClientId,
          safetyData
        }
      });
    }
  } else {
    // Organization scope: update all org locations
    const { data: clients } = await supabase
      .from('clients')
      .select('id, store_id')
      .eq('mango_identity_id', await getIdentityId(clientId))
      .eq('organization_id', currentOrgId);

    for (const client of clients) {
      if (client.store_id !== currentStoreId) {
        await updateSafetyData(client.id, safetyData);
      }
    }
  }
}

// Called when allergies or block status changes
export function useSafetyDataSync() {
  const dispatch = useAppDispatch();

  const syncOnChange = useCallback(async (
    clientId: string,
    field: 'allergies' | 'isBlocked' | 'staffAlert',
    value: any
  ) => {
    const client = await getClient(clientId);

    // Sync within organization (if applicable)
    if (client.organizationId) {
      await syncSafetyData(clientId, {
        allergies: client.allergies,
        isBlocked: client.isBlocked,
        blockReason: client.blockReason,
        staffAlert: client.staffAlert
      }, 'organization');
    }

    // Sync to ecosystem (if opted in)
    if (client.mangoIdentityId) {
      await syncSafetyData(clientId, {
        allergies: client.allergies,
        isBlocked: client.isBlocked,
        blockReason: client.blockReason,
        staffAlert: client.staffAlert
      }, 'ecosystem');
    }
  }, []);

  return { syncOnChange };
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/utils/__tests__/identityHash.test.ts

describe('identityHash', () => {
  it('normalizes phone numbers consistently', async () => {
    const variations = [
      '+1 (555) 123-4567',
      '5551234567',
      '1-555-123-4567',
      '555.123.4567'
    ];

    const hashes = await Promise.all(
      variations.map(v => hashIdentifier(v))
    );

    // All should produce same hash
    expect(new Set(hashes).size).toBe(1);
  });

  it('normalizes emails consistently', async () => {
    const variations = [
      'Test@Email.com',
      'test@email.com',
      '  TEST@EMAIL.COM  '
    ];

    const hashes = await Promise.all(
      variations.map(v => hashIdentifier(v))
    );

    expect(new Set(hashes).size).toBe(1);
  });
});
```

### Integration Tests

```typescript
// e2e/multistore/ecosystem-linking.spec.ts

test.describe('Ecosystem Profile Linking', () => {
  test('shows ecosystem prompt for opted-in client', async ({ page }) => {
    // Pre-condition: Client opted into ecosystem at Store A

    await page.goto('/store-b/clients/new');
    await page.fill('[data-testid="phone-input"]', '5551234567');
    await page.click('[data-testid="lookup-button"]');

    await expect(page.locator('[data-testid="ecosystem-prompt"]')).toBeVisible();
    await expect(page.locator('text=Mango Profile Found')).toBeVisible();
  });

  test('sends link request on approval', async ({ page }) => {
    await page.click('[data-testid="request-link-button"]');

    await expect(page.locator('text=Link request sent')).toBeVisible();

    // Verify SMS was sent (mock check)
    // Verify pending request in database
  });
});
```

---

## Migration Strategy

### Phase 1: Schema Migration

```sql
-- 1. Create new tables (non-breaking)
-- Run: 20260106_001_create_mango_identities.sql

-- 2. Add columns to existing tables (non-breaking)
-- Run: 20260106_002_extend_clients_organizations.sql

-- 3. Backfill organization IDs where missing
UPDATE clients c
SET organization_id = s.organization_id
FROM stores s
WHERE c.store_id = s.id
AND c.organization_id IS NULL
AND s.organization_id IS NOT NULL;
```

### Phase 2: Feature Flags

```typescript
// Feature flags for gradual rollout
const FEATURES = {
  ECOSYSTEM_LOOKUP: 'ecosystem_lookup_enabled',
  ECOSYSTEM_OPT_IN: 'ecosystem_opt_in_enabled',
  ORG_CLIENT_SHARING: 'org_client_sharing_enabled',
};

// Check before showing ecosystem features
if (await isFeatureEnabled(FEATURES.ECOSYSTEM_LOOKUP)) {
  // Show ecosystem lookup UI
}
```

### Phase 3: Rollout Plan

1. **Week 1-2**: Deploy schema changes, feature flags OFF
2. **Week 3-4**: Enable ORG_CLIENT_SHARING for beta organizations
3. **Week 5-6**: Enable ECOSYSTEM_LOOKUP for all (opt-in only)
4. **Week 7-8**: Enable ECOSYSTEM_OPT_IN UI for client portal
5. **Week 9+**: General availability

---

## Security Considerations

### PII Protection

- Phone/email NEVER stored in mango_identities (only hashes)
- Salt stored in environment variable, rotated quarterly
- Hashing performed client-side before API call
- No cleartext PII in API request logs

### Consent Compliance

- All consent changes logged with IP and user agent
- Right to erasure: DELETE cascade removes all links
- Consent withdrawal takes immediate effect
- Annual consent re-confirmation option

### Access Control

- RLS policies enforce store-level access
- Organization access requires matching org_id
- Ecosystem access requires explicit linked_stores entry
- Safety data bypass for critical alerts only

---

## Monitoring & Observability

### Key Metrics

```typescript
// Metrics to track
const METRICS = {
  // Ecosystem
  ecosystem_opt_in_rate: 'Percentage of clients opting into ecosystem',
  link_request_approval_rate: 'Percentage of link requests approved',
  link_request_expiry_rate: 'Percentage of requests expiring',

  // Organization
  org_sharing_mode_distribution: 'Full vs Selective vs Isolated usage',
  cross_location_visit_rate: 'Clients visiting multiple locations',
  safety_sync_latency: 'Time to sync safety data across locations',
};
```

### Alerts

```yaml
alerts:
  - name: HighLinkRequestExpiry
    condition: link_request_expiry_rate > 50%
    action: Investigate UX friction

  - name: SafetySyncDelay
    condition: safety_sync_latency > 5000ms
    action: Page on-call engineer

  - name: ConsentAuditFailure
    condition: consent_log_write_errors > 0
    action: Critical - compliance risk
```

---

## Related Documents

- [PRD-Clients-CRM-Module.md](../product/PRD-Clients-CRM-Module.md) - Product requirements
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Data sync patterns
- [REALTIME_COMMUNICATION.md](./REALTIME_COMMUNICATION.md) - Cross-device sync
- [MONOREPO_ARCHITECTURE.md](./MONOREPO_ARCHITECTURE.md) - Multi-app architecture

---

*Document Version: 1.0 | Created: January 6, 2026*
