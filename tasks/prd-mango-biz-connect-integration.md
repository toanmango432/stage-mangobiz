# PRD: Mango Biz - Connect Integration (Biz Side)

## Overview

This PRD covers the **Mango Biz side** of the Mango Connect integration. Another AI agent is implementing the Mango Connect side separately.

**Goal:** Enable Mango Biz to embed Mango Connect SDK, send auth tokens, and sync data via webhooks.

---

## Architecture (Biz's Responsibilities)

```
MANGO BIZ (This PRD)                    MANGO CONNECT (External)
┌─────────────────────────────────────┐  ┌─────────────────────────┐
│                                     │  │                         │
│  Generate JWT token ────────────────┼─▶│  Validates JWT          │
│  (storeId, memberId, role)          │  │                         │
│                                     │  │                         │
│  Embed SDK in UI ───────────────────┼─▶│  Provides SDK bundle    │
│  (Messages tab, AI panel)           │  │                         │
│                                     │  │                         │
│  Send webhooks ─────────────────────┼─▶│  Receives & syncs       │
│  (client.*, appointment.*)          │  │                         │
│                                     │  │                         │
│  Call provision API ────────────────┼─▶│  Creates tenant         │
│  on integration enable              │  │                         │
│                                     │  │                         │
└─────────────────────────────────────┘  └─────────────────────────┘
```

---

## Existing Infrastructure (Already Built - No Work Needed)

The following already exists in Mango Biz:

| Feature | Location | Notes |
|---------|----------|-------|
| Webhook Infrastructure | `apps/store-app/src/types/integration.ts` | WebhookSubscription entity, signing helpers |
| Integration Entity | `apps/store-app/src/db/schema.ts` | Can store Connect config |
| JWT Auth Service | `apps/store-app/src/services/supabase/authService.ts` | Generates tokens |
| Crypto Helpers | `apps/store-app/src/types/integration.ts` | `createWebhookSignature()` |

---

## Shared Configuration

**Environment Variables (add to Mango Biz):**
```
MANGO_CONNECT_JWT_SECRET=<shared-secret-for-jwt-signing>
MANGO_CONNECT_WEBHOOK_SECRET=<shared-secret-for-webhook-signing>
MANGO_CONNECT_SDK_URL=https://connect.mangobiz.com/sdk/mango-connect-sdk.js
MANGO_CONNECT_API_URL=https://connect.mangobiz.com/api
```

**JWT Token Structure (Biz generates, Connect validates):**
```typescript
{
  storeId: string;      // Biz store ID → Connect tenant_id
  tenantId: string;     // Biz tenant ID → Connect organization_id
  memberId: string;     // Biz member ID → Connect user_id
  memberEmail: string;
  memberName: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  permissions: string[];
  exp: number;          // Expiration (1 hour from now)
  iat: number;          // Issued at
}
```

**Webhook Payload Structure (Biz sends, Connect receives):**
```typescript
// Header: X-Mango-Signature: <hmac-sha256-signature>
{
  event: 'client.created' | 'client.updated' | 'appointment.created' | 'appointment.updated' | 'appointment.cancelled';
  storeId: string;
  timestamp: string;    // ISO 8601
  data: {
    // Entity data (see individual stories)
  }
}
```

---

## User Stories

### Phase 1: Integration Configuration (Priority 1-3)

---

### US-001: Add Mango Connect integration type
**Description:** Define Connect integration configuration type.

**Files to modify:**
- `apps/store-app/src/types/integration.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] Add `MangoConnectIntegration` interface extending base Integration:
  ```typescript
  interface MangoConnectIntegration extends Integration {
    type: 'mango_connect';
    config: {
      enabled: boolean;
      connectTenantId: string;      // Returned from provisioning
      connectTenantSlug: string;
      webhookUrl: string;           // Where to send webhooks
      apiUrl: string;               // Connect API base URL
      sdkUrl: string;               // SDK bundle URL
      features: {
        conversations: boolean;
        aiAssistant: boolean;
        campaigns: boolean;
      };
      lastSyncAt?: string;
    };
  }
  ```
- [ ] Add to IntegrationType union
- [ ] pnpm run typecheck passes

**Priority:** 1

---

### US-002: Create Connect integration service
**Description:** Service to manage Connect integration lifecycle.

**Files to create:**
- `apps/store-app/src/services/integrations/connectIntegrationService.ts` (~100 lines)

**Acceptance Criteria:**
- [ ] `getConnectIntegration(storeId)` - returns Connect integration config or null
- [ ] `enableConnectIntegration(storeId, config)` - creates/enables integration
- [ ] `disableConnectIntegration(storeId)` - disables integration
- [ ] `updateConnectConfig(storeId, config)` - updates config
- [ ] `isConnectEnabled(storeId)` - returns boolean
- [ ] Stores in Integration entity via Dexie/Supabase
- [ ] pnpm run typecheck passes

**Priority:** 2

---

### US-003: Create Connect settings UI
**Description:** Settings page to enable/configure Connect integration.

**Files to create:**
- `apps/store-app/src/pages/settings/ConnectIntegrationPage.tsx` (~150 lines)

**Files to modify:**
- `apps/store-app/src/App.tsx` (~5 lines - add route)
- Settings navigation (~5 lines - add link)

**Acceptance Criteria:**
- [ ] Page shows Connect integration status (enabled/disabled)
- [ ] Toggle to enable/disable
- [ ] When enabling, calls provisioning API (see US-008)
- [ ] Shows connection status and last sync time
- [ ] Feature toggles for: Conversations, AI Assistant, Campaigns
- [ ] "Sync Now" button triggers initial data sync
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 3

---

### Phase 2: JWT Token Generation (Priority 4-5)

---

### US-004: Create JWT signing utility
**Description:** Utility to generate signed JWT tokens for Connect.

**Files to create:**
- `packages/api-client/src/connect/connectJwt.ts` (~80 lines)

**Acceptance Criteria:**
- [ ] `generateConnectToken(storeSession, memberSession)` function:
  - Creates JWT payload with: storeId, tenantId, memberId, memberEmail, memberName, role, permissions
  - Sets exp to 1 hour from now
  - Sets iat to current time
  - Signs with HMAC-SHA256 using `MANGO_CONNECT_JWT_SECRET`
  - Returns base64url encoded token
- [ ] `decodeConnectToken(token)` - decodes without verification (for debugging)
- [ ] `isTokenExpired(token)` - checks if token needs refresh
- [ ] Uses Web Crypto API (works in browser and Deno)
- [ ] pnpm run typecheck passes

**Notes:**
- JWT format: header.payload.signature (standard)
- Use existing crypto patterns from webhook signing

**Priority:** 4

---

### US-005: Add token refresh mechanism
**Description:** Automatically refresh Connect token before expiry.

**Files to create:**
- `apps/store-app/src/hooks/useConnectToken.ts` (~60 lines)

**Acceptance Criteria:**
- [ ] `useConnectToken()` hook returns: `{ token, isValid, refresh }`
- [ ] Automatically generates token from current session
- [ ] Refreshes token 5 minutes before expiry
- [ ] Returns null if Connect integration not enabled
- [ ] Returns null if no active member session
- [ ] pnpm run typecheck passes

**Priority:** 5

---

### Phase 3: SDK Embedding (Priority 6-9)

---

### US-006: Create SDK loader component
**Description:** Component to load Connect SDK dynamically.

**Files to create:**
- `apps/store-app/src/components/integrations/ConnectSDKLoader.tsx` (~80 lines)

**Acceptance Criteria:**
- [ ] Loads SDK script from `config.sdkUrl` dynamically
- [ ] Caches loaded SDK (doesn't reload on re-render)
- [ ] Shows loading spinner while loading
- [ ] Shows error state if SDK fails to load
- [ ] Provides SDK components via context/render prop
- [ ] pnpm run typecheck passes

**Notes:**
- SDK URL comes from integration config
- SDK exports: MangoConnectSDK, ConversationsModule, AIAssistantModule, CampaignsModule

**Priority:** 6

---

### US-007: Create Connect wrapper component
**Description:** Wrapper that initializes SDK with auth token.

**Files to create:**
- `apps/store-app/src/components/integrations/ConnectWrapper.tsx` (~100 lines)

**Acceptance Criteria:**
- [ ] Uses `useConnectToken()` for auth token
- [ ] Uses `ConnectSDKLoader` to load SDK
- [ ] Passes token to SDK's `MangoConnectSDK` component
- [ ] Handles token refresh callback
- [ ] Handles error callback (shows toast/notification)
- [ ] Shows "Connect not configured" if integration disabled
- [ ] pnpm run typecheck passes

**Priority:** 7

---

### US-008: Add Messages page with Conversations module
**Description:** New page in Store App showing Connect Conversations.

**Files to create:**
- `apps/store-app/src/pages/MessagesPage.tsx` (~50 lines)

**Files to modify:**
- `apps/store-app/src/App.tsx` (~10 lines - add route)
- `apps/store-app/src/components/layout/AppShell.tsx` (~15 lines - add nav item)

**Acceptance Criteria:**
- [ ] New "Messages" tab in main navigation
- [ ] Page renders `ConnectWrapper` with `ConversationsModule`
- [ ] Only visible if Connect integration enabled
- [ ] Icon: MessageSquare from lucide-react
- [ ] Mobile/tablet responsive
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 8

---

### US-009: Add AI Assistant panel
**Description:** AI Assistant accessible from header or floating button.

**Files to create:**
- `apps/store-app/src/components/integrations/AIAssistantButton.tsx` (~40 lines)
- `apps/store-app/src/components/integrations/AIAssistantPanel.tsx` (~60 lines)

**Files to modify:**
- `apps/store-app/src/components/layout/TopHeaderBar.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] AI button in header bar (or floating button on mobile)
- [ ] Clicking opens side panel with `AIAssistantModule`
- [ ] Panel can be closed
- [ ] Only visible if Connect AI feature enabled
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 9

---

### Phase 4: Webhook Sending (Priority 10-14)

---

### US-010: Create webhook sending service
**Description:** Service to send webhooks to Connect.

**Files to create:**
- `apps/store-app/src/services/integrations/connectWebhookService.ts` (~100 lines)

**Acceptance Criteria:**
- [ ] `sendConnectWebhook(storeId, event, data)` function:
  - Gets Connect integration config
  - Creates payload: { event, storeId, timestamp, data }
  - Signs payload with HMAC-SHA256 using webhook secret
  - Sends POST to webhookUrl with X-Mango-Signature header
  - Handles response (log success/failure)
- [ ] `createWebhookPayload(event, storeId, data)` - creates structured payload
- [ ] `signWebhookPayload(payload, secret)` - creates HMAC signature
- [ ] Retry logic with exponential backoff (use existing helpers)
- [ ] pnpm run typecheck passes

**Notes:**
- Use existing `createWebhookSignature()` helper
- Use existing retry helpers from integration.ts

**Priority:** 10

---

### US-011: Send webhook on client changes
**Description:** Fire webhook when clients are created/updated.

**Files to modify:**
- `apps/store-app/src/services/supabase/clientService.ts` (~40 lines)
- OR create dedicated webhook trigger service

**Acceptance Criteria:**
- [ ] After `createClient()`, check if Connect enabled, send `client.created` webhook
- [ ] After `updateClient()`, check if Connect enabled, send `client.updated` webhook
- [ ] Webhook data includes: id, name, email, phone, notes, createdAt, updatedAt
- [ ] Fire-and-forget (don't block main operation)
- [ ] Log webhook send result
- [ ] pnpm run typecheck passes

**Notes:**
- Use existing client service patterns
- Consider using event emitter pattern for cleaner separation

**Priority:** 11

---

### US-012: Send webhook on appointment changes
**Description:** Fire webhook when appointments change.

**Files to modify:**
- `apps/store-app/src/services/supabase/appointmentService.ts` (~50 lines)

**Acceptance Criteria:**
- [ ] After `createAppointment()`, send `appointment.created` webhook
- [ ] After `updateAppointment()`, send `appointment.updated` webhook
- [ ] After `cancelAppointment()`, send `appointment.cancelled` webhook
- [ ] Webhook data includes: id, clientId, clientName, scheduledAt, duration, serviceName, staffName, status
- [ ] Include client info for context
- [ ] Fire-and-forget
- [ ] pnpm run typecheck passes

**Priority:** 12

---

### US-013: Create webhook subscription on integration enable
**Description:** Set up webhook subscription when Connect is enabled.

**Files to modify:**
- `apps/store-app/src/services/integrations/connectIntegrationService.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] When `enableConnectIntegration()` called, create WebhookSubscription:
  - url: config.webhookUrl
  - events: ['client.created', 'client.updated', 'appointment.created', 'appointment.updated', 'appointment.cancelled']
  - secret: from env or generated
  - isActive: true
- [ ] Store subscription reference in integration config
- [ ] When `disableConnectIntegration()`, deactivate webhook subscription
- [ ] pnpm run typecheck passes

**Priority:** 13

---

### US-014: Add webhook delivery logging
**Description:** Log webhook deliveries for debugging.

**Files to modify:**
- `apps/store-app/src/services/integrations/connectWebhookService.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] Create WebhookDelivery record for each send attempt
- [ ] Log: subscriptionId, event, status (success/failed), responseCode, responseBody, sentAt
- [ ] Update failure count on subscription if failed
- [ ] Viewable in Connect settings page
- [ ] pnpm run typecheck passes

**Priority:** 14

---

### Phase 5: Provisioning & Initial Sync (Priority 15-18)

---

### US-015: Call provisioning API on integration enable
**Description:** Provision Connect tenant when integration is enabled.

**Files to modify:**
- `apps/store-app/src/services/integrations/connectIntegrationService.ts` (~50 lines)

**Acceptance Criteria:**
- [ ] When enabling Connect, call Connect provisioning API:
  - POST to `{MANGO_CONNECT_API_URL}/provision-mango-biz-tenant`
  - Body: { storeId, storeName, tenantId, ownerEmail, ownerName }
  - Headers: Authorization with service key or signed request
- [ ] Store returned: connectTenantId, connectTenantSlug, webhookUrl, apiUrl
- [ ] Handle provisioning failure gracefully
- [ ] pnpm run typecheck passes

**Priority:** 15

---

### US-016: Perform initial client sync
**Description:** Push all existing clients to Connect on enable.

**Files to create:**
- `apps/store-app/src/services/integrations/connectSyncService.ts` (~80 lines)

**Acceptance Criteria:**
- [ ] `syncClientsToConnect(storeId)` function:
  - Fetches all clients for store from local DB
  - Batches into groups of 100
  - POST to Connect bulk sync API
  - Tracks progress
- [ ] Returns: { total, synced, failed }
- [ ] Can be triggered manually from settings
- [ ] pnpm run typecheck passes

**Priority:** 16

---

### US-017: Perform initial appointment sync
**Description:** Push upcoming appointments to Connect on enable.

**Files to modify:**
- `apps/store-app/src/services/integrations/connectSyncService.ts` (~50 lines)

**Acceptance Criteria:**
- [ ] `syncAppointmentsToConnect(storeId)` function:
  - Fetches appointments from now to +30 days
  - Batches and sends to Connect bulk sync API
  - Includes client info for each appointment
- [ ] Returns: { total, synced, failed }
- [ ] Can be triggered manually from settings
- [ ] pnpm run typecheck passes

**Priority:** 17

---

### US-018: Show sync status in settings
**Description:** Display sync progress and status in settings page.

**Files to modify:**
- `apps/store-app/src/pages/settings/ConnectIntegrationPage.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] Shows last sync time for clients and appointments
- [ ] Shows sync counts (total synced)
- [ ] "Sync Now" button triggers full sync
- [ ] Progress indicator during sync
- [ ] Shows any sync errors
- [ ] pnpm run typecheck passes
- [ ] Verify in browser

**Priority:** 18

---

## Functional Requirements

| ID | Story | Requirement |
|----|-------|-------------|
| FR-1 | US-001-003 | Biz stores and manages Connect integration config |
| FR-2 | US-004-005 | Biz generates valid JWT tokens for Connect auth |
| FR-3 | US-006-009 | Biz embeds Connect SDK in Store App UI |
| FR-4 | US-010-014 | Biz sends webhooks to Connect on data changes |
| FR-5 | US-015-018 | Biz provisions tenant and syncs initial data |

---

## Non-Goals (Biz Side)

- Validating JWTs (Connect does this)
- Receiving webhooks from Connect (future enhancement)
- Storing Connect data locally (data lives in Connect)
- Offline support for Connect features (SDK requires online)

---

## Testing Checklist

1. **Integration Config**
   - [ ] Can enable Connect integration
   - [ ] Config stored and retrieved correctly
   - [ ] Can disable integration

2. **JWT Tokens**
   - [ ] Token generated with correct claims
   - [ ] Token signature valid
   - [ ] Token refresh works before expiry

3. **SDK Embedding**
   - [ ] SDK loads successfully
   - [ ] Messages page renders Conversations
   - [ ] AI panel opens and works
   - [ ] Auth passed correctly to SDK

4. **Webhooks**
   - [ ] Client create fires webhook
   - [ ] Appointment create fires webhook
   - [ ] Signature is valid
   - [ ] Delivery logged

5. **Provisioning**
   - [ ] Tenant provisioned on enable
   - [ ] Initial sync completes
   - [ ] Sync status shown correctly

---

## File Summary

| Action | Files |
|--------|-------|
| Create | 12 |
| Modify | 8 |
| Total | 20 |

**Estimated Lines:** ~1,000

---

## Dependencies

This implementation depends on Mango Connect having:
- [ ] JWT validation endpoint (`/auth-mango-biz`)
- [ ] SDK bundle available at configured URL
- [ ] Webhook handler (`/webhook-mango-biz`)
- [ ] Provisioning API (`/provision-mango-biz-tenant`)
- [ ] Bulk sync API (`/api-mango-biz-sync`)

Coordinate with Connect team on:
- Shared secrets (JWT + webhook)
- API URLs
- SDK bundle hosting

