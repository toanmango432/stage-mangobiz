# PRD: Mango Biz - Connect Integration (Ralph-Optimized)

## Overview

Enable Mango Connect SDK to be embedded within Mango Biz Store App. Connect reads client/appointment data directly from Biz's Supabase database.

**Key Architecture:**
- SDK loaded at app startup in AppShell, globally available
- JWT tokens generated via Edge Function
- Config stored in existing `store_settings` table
- No webhooks needed - Connect reads Biz DB directly

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANGO BIZ STORE APP                          │
│                                                                 │
│  AppShell (loads SDK globally)                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 CONNECT SDK (Global)                     │   │
│  │   Receives: JWT + Supabase URL + Supabase Key           │   │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │   │Conversations│ │AI Assistant │ │  Campaigns  │      │   │
│  │   └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│        Biz Supabase    Connect Supabase    JWT Edge Function   │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Stories

### Phase 1: Configuration & Types (Priority 1-3)

---

### US-001: Create Connect integration types
**Description:** As a developer, I need TypeScript types for Connect integration settings.

**Files to create:**
- `apps/store-app/src/types/connectIntegration.ts` (NEW, ~40 lines)

**Acceptance Criteria:**
- [ ] `ConnectConfig` interface with: `enabled: boolean`, `features: ConnectFeatures`
- [ ] `ConnectFeatures` interface with: `conversations: boolean`, `aiAssistant: boolean`, `campaigns: boolean`
- [ ] `ConnectSDKState` interface with: `loaded: boolean`, `error: string | null`, `unreadCount: number`
- [ ] Export all types from `apps/store-app/src/types/index.ts`
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from `apps/store-app/src/types/ticket.ts`
- Keep types simple and flat, avoid deep nesting
- Use union types for enums: `'conversations' | 'aiAssistant' | 'campaigns'`

**Priority:** 1

---

### US-002: Add Connect config to store settings service
**Description:** As a developer, I need functions to get/set Connect config in the database.

**Files to modify:**
- `apps/store-app/src/services/supabase/storeService.ts` (~40 lines to add)

**Acceptance Criteria:**
- [ ] Add `connect_config` field handling (JSON column in `store_settings`)
- [ ] `getConnectConfig(storeId: string): Promise<ConnectConfig | null>` function
- [ ] `updateConnectConfig(storeId: string, config: ConnectConfig): Promise<void>` function
- [ ] Default config: `{ enabled: false, features: { conversations: false, aiAssistant: false, campaigns: false } }`
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- Follow existing patterns in storeService.ts for JSON field handling
- Use existing Supabase client from the service
- Handle case where `connect_config` is null (return default)

**Priority:** 2

**Dependencies:** US-001

---

### US-003: Create useConnectConfig hook
**Description:** As a developer, I need a hook to access Connect config with caching.

**Files to create:**
- `apps/store-app/src/hooks/useConnectConfig.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] `useConnectConfig()` returns `{ config, loading, error, updateConfig, refresh }`
- [ ] Loads config on mount from storeService
- [ ] Caches config in state to avoid re-fetching
- [ ] `updateConfig(updates: Partial<ConnectConfig>)` saves to DB and updates local state
- [ ] `refresh()` forces reload from database
- [ ] Returns default config while loading (not null)
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from `apps/store-app/src/hooks/useSystemConfig.ts` (174 lines)
- Use `useCallback` for stable function references
- Get storeId from auth context or Redux store

**Priority:** 3

**Dependencies:** US-001, US-002

---

### Phase 2: JWT Authentication (Priority 4-5)

---

### US-004: Create JWT token generator Edge Function
**Description:** As a developer, I need an Edge Function to generate signed JWT tokens for Connect SDK.

**Files to create:**
- `supabase/functions/generate-connect-token/index.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Handles OPTIONS request with CORS headers (copy from `supabase/functions/auth/index.ts` lines 87-91)
- [ ] POST only, returns 405 for other methods
- [ ] Validates Authorization header (Supabase user JWT)
- [ ] Extracts user info from request body: `{ storeId, tenantId, memberId, memberEmail, memberName, role, permissions }`
- [ ] Generates JWT with HMAC-SHA256 using `Deno.env.get('MANGO_CONNECT_JWT_SECRET')`
- [ ] Token expires in 1 hour (`exp: Math.floor(Date.now() / 1000) + 3600`)
- [ ] Returns `{ token: string, expiresAt: number }`
- [ ] Error responses use `jsonResponse({ error: message }, statusCode)` pattern
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'

**JWT Payload Structure:**
```typescript
{
  storeId: string;
  tenantId: string;
  memberId: string;
  memberEmail: string;
  memberName: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  permissions: string[];
  exp: number;
  iat: number;
}
```

**Notes:**
- Follow structure from `supabase/functions/auth/index.ts` (567 lines)
- Use `crypto.subtle.importKey` and `crypto.subtle.sign` for HMAC-SHA256
- Base64url encode the JWT parts (header.payload.signature)
- Log errors with prefix `[generate-connect-token]`

**Priority:** 4

---

### US-005: Create useConnectToken hook
**Description:** As a developer, I need a hook to get and refresh Connect JWT tokens.

**Files to create:**
- `apps/store-app/src/hooks/useConnectToken.ts` (NEW, ~70 lines)

**Acceptance Criteria:**
- [ ] `useConnectToken()` returns `{ token, loading, error, refresh, isExpired }`
- [ ] Fetches token from Edge Function on mount (if Connect enabled)
- [ ] Caches token in state until 5 minutes before expiry
- [ ] `refresh()` forces new token fetch
- [ ] `isExpired` computed from token's exp claim
- [ ] Returns null token if Connect not enabled
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from `apps/store-app/src/hooks/useSystemConfig.ts`
- Use `useConnectConfig()` to check if Connect is enabled
- Call Edge Function via `supabase.functions.invoke('generate-connect-token', { body: {...} })`
- Parse JWT to extract `exp` claim for expiry check

**Priority:** 5

**Dependencies:** US-003, US-004

---

### Phase 3: SDK Loading (Priority 6-7)

---

### US-006: Create ConnectSDKProvider component
**Description:** As a developer, I need a provider that loads the Connect SDK globally.

**Files to create:**
- `apps/store-app/src/providers/ConnectSDKProvider.tsx` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Loads SDK script from `import.meta.env.VITE_MANGO_CONNECT_SDK_URL`
- [ ] Provides context: `{ sdk, loading, error, unreadCount, retry }`
- [ ] Initializes SDK with: `authToken`, `bizSupabaseUrl`, `bizSupabaseKey`
- [ ] Handles `onTokenRefresh` callback from SDK
- [ ] Handles `onUnreadCountChange` callback from SDK (for badge)
- [ ] Handles `onError` callback from SDK
- [ ] Shows nothing while loading (children render regardless)
- [ ] `retry()` function to reload SDK after error
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- Create context with `createContext<ConnectSDKContextType | null>(null)`
- Use `useConnectToken()` for auth token
- Use `useConnectConfig()` to check if enabled
- SDK URL default: `https://connect.mango.ai/sdk/v1/mango-connect-sdk.js`
- Script loading pattern: create script element, set src, append to document.head

**Priority:** 6

**Dependencies:** US-003, US-005

---

### US-007: Add ConnectSDKProvider to AppShell
**Description:** As a developer, I need the Connect SDK to load at app startup.

**Files to modify:**
- `apps/store-app/src/components/layout/AppShell.tsx` (~15 lines to add)

**Acceptance Criteria:**
- [ ] Import `ConnectSDKProvider` from `@/providers/ConnectSDKProvider`
- [ ] Wrap app content with `<ConnectSDKProvider>` inside existing providers
- [ ] Provider should be inside auth provider (needs user context)
- [ ] Provider should be outside Suspense boundaries
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- AppShell is 481 lines - add provider wrapper around line 200-220
- Follow existing provider nesting pattern
- Provider placement: after AuthProvider, before main content

**Priority:** 7

**Dependencies:** US-006

---

### Phase 4: Messages Page (Priority 8-10)

---

### US-008: Create useConnectSDK hook
**Description:** As a developer, I need a hook to access the Connect SDK context.

**Files to create:**
- `apps/store-app/src/hooks/useConnectSDK.ts` (NEW, ~30 lines)

**Acceptance Criteria:**
- [ ] `useConnectSDK()` returns context from ConnectSDKProvider
- [ ] Throws error if used outside provider: "useConnectSDK must be used within ConnectSDKProvider"
- [ ] Returns `{ sdk, loading, error, unreadCount, retry }`
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- Simple context consumer hook following React patterns
- Use `useContext(ConnectSDKContext)`
- Export from hooks index

**Priority:** 8

**Dependencies:** US-006

---

### US-009: Create MessagesPage component
**Description:** As a user, I want a Messages page to view conversations via Connect SDK.

**Files to create:**
- `apps/store-app/src/pages/MessagesPage.tsx` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Full height layout (`h-full flex flex-col`)
- [ ] Uses `useConnectSDK()` to get SDK state
- [ ] Shows loading spinner while SDK loading
- [ ] Shows error state with retry button if SDK failed (see pattern below)
- [ ] Renders `<sdk.ConversationsModule />` when SDK loaded
- [ ] No hardcoded text like 'Test' or mock data
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Error State Pattern:**
```tsx
<div className="flex flex-col items-center justify-center h-full gap-4">
  <AlertCircle className="h-12 w-12 text-destructive" />
  <p className="text-muted-foreground">Failed to load Messages</p>
  <Button onClick={retry}>Try Again</Button>
</div>
```

**Notes:**
- Follow page layout pattern from existing pages
- Use Tailwind classes, not inline styles
- Import Button from `@/components/ui/button`
- Import AlertCircle from `lucide-react`

**Priority:** 9

**Dependencies:** US-008

---

### US-010: Add Messages to navigation
**Description:** As a user, I want to access Messages from the main navigation.

**Files to modify:**
- `apps/store-app/src/components/layout/AppShell.tsx` (~25 lines to add)
- `apps/store-app/src/components/layout/BottomNavBar.tsx` (~15 lines to add)

**Acceptance Criteria:**
- [ ] Add lazy import: `const MessagesPage = lazy(() => import('@/pages/MessagesPage'))`
- [ ] Add 'messages' to module switch/case in AppShell (around line 363-414)
- [ ] Add Messages nav item to BottomNavBar with MessageSquare icon
- [ ] Nav item only visible if `connectConfig.enabled && connectConfig.features.conversations`
- [ ] Badge shows unread count from `useConnectSDK().unreadCount` (if > 0)
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow existing module lazy loading pattern in AppShell (lines 8-34)
- Follow nav item pattern in BottomNavBar (146 lines)
- Import MessageSquare from `lucide-react`
- Use `useConnectConfig()` for feature check

**Priority:** 10

**Dependencies:** US-003, US-008, US-009

---

### Phase 5: AI Assistant (Priority 11-12)

---

### US-011: Create AIAssistantPanel component
**Description:** As a user, I want a floating AI Assistant button that opens a chat panel.

**Files to create:**
- `apps/store-app/src/components/integrations/AIAssistantPanel.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Floating button in bottom-right corner (`fixed bottom-4 right-4`)
- [ ] Button shows Bot icon from lucide-react
- [ ] Click toggles panel open/closed
- [ ] Panel is 400px wide, 500px tall, positioned above button
- [ ] Panel renders `<sdk.AIAssistantModule />` when SDK loaded
- [ ] Shows loading state while SDK loading
- [ ] Shows error state with retry if SDK failed
- [ ] Close button (X) in panel header
- [ ] Only renders if `connectConfig.features.aiAssistant` is true
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use `useState` for open/closed state
- Use `useConnectSDK()` for SDK access
- Use `useConnectConfig()` for feature check
- Panel styling: `bg-background border rounded-lg shadow-lg`
- Use z-index 50 to appear above other content

**Priority:** 11

**Dependencies:** US-003, US-008

---

### US-012: Add AIAssistantPanel to AppShell
**Description:** As a developer, I need the AI Assistant panel available globally.

**Files to modify:**
- `apps/store-app/src/components/layout/AppShell.tsx` (~10 lines to add)

**Acceptance Criteria:**
- [ ] Import `AIAssistantPanel` from `@/components/integrations/AIAssistantPanel`
- [ ] Render `<AIAssistantPanel />` at the end of AppShell (before closing tags)
- [ ] Component handles its own visibility based on feature flag
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- Add after main content area, before provider closing tags
- AIAssistantPanel self-manages visibility via useConnectConfig

**Priority:** 12

**Dependencies:** US-011

---

### Phase 6: Settings UI (Priority 13-15)

---

### US-013: Create ConnectSettings component
**Description:** As a user, I want to enable/disable Connect features in Settings.

**Files to create:**
- `apps/store-app/src/components/modules/settings/categories/ConnectSettings.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Section header: "Mango Connect" with connection status badge
- [ ] Master toggle: "Enable Mango Connect" (enables/disables entire integration)
- [ ] Feature toggles (only enabled if master toggle on):
  - [ ] "Conversations" - Enable messaging
  - [ ] "AI Assistant" - Enable AI chat panel
  - [ ] "Campaigns" - Enable marketing campaigns
- [ ] Status badge: "Connected" (green) / "Disconnected" (gray) / "Error" (red)
- [ ] Save changes via `useConnectConfig().updateConfig()`
- [ ] Show toast on save success/failure
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow pattern from `categories/IntegrationsSettings.tsx` (487 lines)
- Use Switch component from `@/components/ui/switch`
- Use existing SettingsSection wrapper pattern
- Get SDK status from `useConnectSDK()` for connection badge

**Priority:** 13

**Dependencies:** US-003, US-008

---

### US-014: Add Connect to Settings navigation
**Description:** As a developer, I need Connect settings accessible from Settings page.

**Files to modify:**
- `apps/store-app/src/components/modules/settings/SettingsPage.tsx` (~10 lines to add)
- `apps/store-app/src/components/modules/settings/SettingsNavigation.tsx` (~10 lines to add)

**Acceptance Criteria:**
- [ ] Add 'connect' to settings categories type
- [ ] Add "Mango Connect" item to settings navigation sidebar
- [ ] Icon: Plug or Link2 from lucide-react
- [ ] Add case 'connect' to renderCategoryContent switch
- [ ] Render `<ConnectSettings />` for connect category
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow existing category pattern in SettingsPage.tsx (187 lines)
- Add after 'integrations' category in navigation order
- Lazy load ConnectSettings if file is large

**Priority:** 14

**Dependencies:** US-013

---

### US-015: Add environment variables documentation
**Description:** As a developer, I need documentation for required environment variables.

**Files to modify:**
- `apps/store-app/.env.example` (~5 lines to add)

**Acceptance Criteria:**
- [ ] Add `VITE_MANGO_CONNECT_SDK_URL` with comment and example
- [ ] Add `MANGO_CONNECT_JWT_SECRET` note (Edge Function only, not VITE_)
- [ ] Comments explain what each variable does
- [ ] No forbidden strings: 'Test', 'Mock', 'as any', 'void _'

**Example:**
```bash
# Mango Connect Integration
VITE_MANGO_CONNECT_SDK_URL=https://connect.mango.ai/sdk/v1/mango-connect-sdk.js
# Note: MANGO_CONNECT_JWT_SECRET is set in Supabase Edge Function secrets, not here
```

**Notes:**
- Follow existing .env.example format
- Only VITE_ prefixed vars are exposed to frontend

**Priority:** 15

---

## Functional Requirements

| ID | Stories | Requirement |
|----|---------|-------------|
| FR-1 | US-001, US-002, US-003 | System stores and retrieves Connect config from database |
| FR-2 | US-004, US-005 | System generates valid JWT tokens for Connect auth |
| FR-3 | US-006, US-007, US-008 | Connect SDK loads globally at app startup |
| FR-4 | US-009, US-010 | Users can access Messages page with conversations |
| FR-5 | US-011, US-012 | Users can access AI Assistant from floating button |
| FR-6 | US-013, US-014 | Users can enable/disable Connect features in Settings |

---

## Non-Goals (Out of Scope)

- Campaigns module UI (separate PRD)
- Offline support for Connect features (SDK requires online)
- Custom Connect SDK branding/theming
- Connect analytics/metrics dashboard
- Webhook receiving from Connect (not needed with direct DB)

---

## Technical Considerations

### Existing Patterns to Follow
- Edge Function: `supabase/functions/auth/index.ts` (CORS, response format)
- Hooks: `apps/store-app/src/hooks/useSystemConfig.ts` (loading/error states)
- Settings: `apps/store-app/src/components/modules/settings/categories/IntegrationsSettings.tsx`
- Navigation: `apps/store-app/src/components/layout/AppShell.tsx` (lazy loading, module switch)

### Files Modified (Line Counts)
- `AppShell.tsx` (481 lines) - Add ~50 lines total across stories
- `BottomNavBar.tsx` (146 lines) - Add ~15 lines
- `SettingsPage.tsx` (187 lines) - Add ~10 lines
- `storeService.ts` - Add ~40 lines

### New Files Created
- 1 Edge Function (~100 lines)
- 4 Hooks (~210 lines total)
- 1 Provider (~120 lines)
- 2 Components (~180 lines total)
- 1 Page (~80 lines)
- 1 Types file (~40 lines)

**Total Estimated Lines:** ~780 lines

---

## Environment Variables

```bash
# Frontend (VITE_ prefix)
VITE_MANGO_CONNECT_SDK_URL=https://connect.mango.ai/sdk/v1/mango-connect-sdk.js

# Edge Function (Supabase secrets)
MANGO_CONNECT_JWT_SECRET=<shared-secret-with-connect-team>
```

---

## Summary

| Metric | Value |
|--------|-------|
| User Stories | 15 |
| New Files | 9 |
| Modified Files | 6 |
| Edge Functions | 1 |
| Estimated Lines | ~780 |
| Phases | 6 |
