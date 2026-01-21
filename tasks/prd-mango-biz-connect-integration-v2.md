# PRD: Mango Biz - Connect Integration (v2)

## Overview

Enable Mango Connect to be embedded within Mango Biz Store App. Connect will read client/appointment data directly from Biz's Supabase database.

**Key Change from v1:** No webhooks needed! Connect reads Biz's database directly.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANGO BIZ STORE APP                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 CONNECT SDK (Embedded)                   │   │
│  │                                                         │   │
│  │   Receives from Biz:                                    │   │
│  │   - JWT token (for auth)                                │   │
│  │   - Supabase URL (for direct data access)               │   │
│  │   - Supabase Key (for direct data access)               │   │
│  │                                                         │   │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │   │Conversations│ │AI Assistant │ │  Campaigns  │      │   │
│  │   └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│        Biz Supabase    Connect Supabase    JWT Auth            │
│        (clients,       (conversations,     Endpoint            │
│         appointments)   campaigns)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Biz Provides to Connect

| Item | Description |
|------|-------------|
| **JWT Token** | Signed token with user/store info |
| **Supabase URL** | Biz's Supabase project URL |
| **Supabase Anon Key** | For SDK to query clients/appointments |

---

## What's NOT Needed (Removed from v1)

| Removed | Why |
|---------|-----|
| Webhook sending | Connect reads DB directly |
| Webhook handlers | Not needed |
| Bulk sync API calls | Not needed |
| Client/Appointment sync logic | Not needed |

---

## User Stories

### Phase 1: JWT Authentication (Priority 1-2)

---

### US-001: Create JWT token generator Edge Function
**Description:** Generate signed JWT for Connect SDK authentication.

**Files to create:**
- `supabase/functions/generate-connect-token/index.ts` (~80 lines)

**Acceptance Criteria:**
- [ ] Accepts authenticated request from Biz frontend
- [ ] Generates JWT with: storeId, tenantId, memberId, memberEmail, memberName, role, permissions
- [ ] Signs with HMAC-SHA256 using `MANGO_CONNECT_JWT_SECRET`
- [ ] Token expires in 1 hour
- [ ] Returns `{ token: string, expiresAt: number }`
- [ ] pnpm run typecheck passes

**JWT Payload:**
```typescript
{
  storeId: string;      // Current store ID
  tenantId: string;     // Biz tenant ID
  memberId: string;     // Current member ID
  memberEmail: string;
  memberName: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  permissions: string[];
  exp: number;          // Expiration (1 hour)
  iat: number;          // Issued at
}
```

**Priority:** 1

---

### US-002: Create useConnectToken hook
**Description:** Hook to get and refresh Connect JWT token.

**Files to create:**
- `apps/store-app/src/hooks/useConnectToken.ts` (~60 lines)

**Acceptance Criteria:**
- [ ] `useConnectToken()` returns `{ token, loading, error, refresh }`
- [ ] Automatically fetches token on mount
- [ ] Caches token until near expiry
- [ ] `refresh()` forces new token
- [ ] pnpm run typecheck passes

**Priority:** 2

---

### Phase 2: SDK Integration (Priority 3-6)

---

### US-003: Create Connect integration config type
**Description:** TypeScript types for Connect integration settings.

**Files to create:**
- `apps/store-app/src/types/connectIntegration.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] `ConnectIntegrationConfig` type with: enabled, features
- [ ] `ConnectFeatures` type: conversations, aiAssistant, campaigns
- [ ] Export from types index
- [ ] pnpm run typecheck passes

**Priority:** 3

---

### US-004: Create MangoConnectWrapper component
**Description:** Wrapper that loads and initializes Connect SDK.

**Files to create:**
- `apps/store-app/src/components/integrations/MangoConnectWrapper.tsx` (~120 lines)

**Acceptance Criteria:**
- [ ] Lazy loads Connect SDK from CDN
- [ ] Passes JWT token from useConnectToken
- [ ] Passes Biz Supabase URL and Anon Key
- [ ] Handles loading state
- [ ] Handles SDK errors
- [ ] Refreshes token when SDK requests
- [ ] pnpm run typecheck passes

**Usage:**
```tsx
<MangoConnectWrapper>
  <ConversationsModule />
</MangoConnectWrapper>
```

**Priority:** 4

---

### US-005: Create Messages page with Connect SDK
**Description:** Messages page that embeds Connect Conversations module.

**Files to create:**
- `apps/store-app/src/pages/MessagesPage.tsx` (~60 lines)

**Acceptance Criteria:**
- [ ] Renders MangoConnectWrapper with ConversationsModule
- [ ] Full height layout
- [ ] Shows loading state while SDK initializes
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 5

---

### US-006: Add Messages to navigation
**Description:** Add Messages tab to Store App main navigation.

**Files to modify:**
- `apps/store-app/src/components/layout/AppShell.tsx` (~20 lines)
- `apps/store-app/src/App.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] "Messages" icon/tab in main navigation
- [ ] Route `/messages` → MessagesPage
- [ ] Only visible if Connect integration enabled
- [ ] Badge shows unread count (if available)
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 6

---

### Phase 3: AI Assistant Integration (Priority 7-8)

---

### US-007: Create AI Assistant panel
**Description:** Floating AI Assistant panel using Connect SDK.

**Files to create:**
- `apps/store-app/src/components/integrations/AIAssistantPanel.tsx` (~80 lines)

**Acceptance Criteria:**
- [ ] Floating button in bottom-right corner
- [ ] Click opens AI Assistant module from Connect SDK
- [ ] Can minimize/expand
- [ ] Only visible if AI feature enabled
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 7

---

### US-008: Add AI Assistant to AppShell
**Description:** Include AI Assistant panel in main app layout.

**Files to modify:**
- `apps/store-app/src/components/layout/AppShell.tsx` (~15 lines)

**Acceptance Criteria:**
- [ ] AIAssistantPanel rendered in AppShell
- [ ] Conditionally shown based on feature flag
- [ ] Doesn't interfere with other UI
- [ ] pnpm run typecheck passes

**Priority:** 8

---

### Phase 4: Settings & Configuration (Priority 9-11)

---

### US-009: Create Connect settings section
**Description:** Settings UI to enable/disable Connect features.

**Files to create:**
- `apps/store-app/src/components/settings/ConnectSettings.tsx` (~100 lines)

**Acceptance Criteria:**
- [ ] Toggle to enable/disable Connect integration
- [ ] Feature toggles: Conversations, AI Assistant, Campaigns
- [ ] Shows connection status
- [ ] Saves to store settings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 9

---

### US-010: Add Connect settings to Settings page
**Description:** Include Connect settings in main Settings page.

**Files to modify:**
- `apps/store-app/src/pages/SettingsPage.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] Connect section in Settings page
- [ ] Collapsible/expandable section
- [ ] pnpm run typecheck passes

**Priority:** 10

---

### US-011: Store Connect settings in database
**Description:** Persist Connect integration settings.

**Files to modify:**
- `apps/store-app/src/services/supabase/storeService.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] Add `connect_config` to store settings
- [ ] `getConnectConfig(storeId)` function
- [ ] `updateConnectConfig(storeId, config)` function
- [ ] pnpm run typecheck passes

**Priority:** 11

---

## Environment Variables

Add to Biz's environment:

```bash
# Shared secret for JWT signing (must match Connect's MANGO_BIZ_JWT_SECRET)
MANGO_CONNECT_JWT_SECRET=<shared-secret>

# Connect SDK URL (production)
MANGO_CONNECT_SDK_URL=https://connect.mango.ai/sdk/v1/mango-connect-sdk.js
```

---

## SDK Integration Example

```tsx
// In MangoConnectWrapper.tsx
import { MangoConnectSDK, ConversationsModule } from '@mango/connect-sdk';

function MangoConnectWrapper({ children }) {
  const { token, refresh } = useConnectToken();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!token) return <LoadingSpinner />;

  return (
    <MangoConnectSDK
      authToken={token}
      bizSupabaseUrl={supabaseUrl}
      bizSupabaseKey={supabaseKey}
      onTokenRefresh={(callback) => {
        refresh().then(newToken => callback(newToken));
      }}
      onError={(error) => {
        console.error('Connect SDK error:', error);
        toast.error('Connection error');
      }}
    >
      {children}
    </MangoConnectSDK>
  );
}
```

---

## Summary

| Metric | Value |
|--------|-------|
| User Stories | 11 |
| New Edge Functions | 1 |
| New Components | 5 |
| New Pages | 1 |
| Modified Files | 5 |
| Estimated Lines | ~600 |

---

## Comparison: v1 vs v2

| Aspect | v1 (Webhooks) | v2 (Direct DB) |
|--------|---------------|----------------|
| User Stories | 18 | 11 |
| Estimated Lines | ~1,000 | ~600 |
| Complexity | High | Low |
| Data freshness | Delayed (webhook) | Real-time |
| Sync issues | Possible | None |

**v2 is simpler because Connect reads Biz's database directly.**
