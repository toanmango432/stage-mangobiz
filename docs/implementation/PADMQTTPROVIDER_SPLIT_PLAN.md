# Implementation Plan: Split PadMqttProvider.tsx

## Overview

**File:** `apps/mango-pad/src/providers/PadMqttProvider.tsx`
**Current Size:** 843 lines
**Target Size:** <300 lines (main provider)
**Guideline:** Files should be <500 lines, ideally <300 lines

---

## Current Structure Analysis

The file contains several distinct concerns mixed together:

| Section | Lines | Description |
|---------|-------|-------------|
| Types & Interfaces | 48-83 | Context types, props definitions |
| Constants | 85-95 | Timeouts, dev mode IDs |
| Utility Functions | 97-188 | `getOrCreateDeviceId`, `getPairingInfo`, mappers |
| Context Definitions | 79, 126 | Two contexts defined inline |
| Main Provider | 189-806 | ~617 lines - TOO BIG |
| Hooks | 808-842 | 4 exported hooks |

### Main Provider Breakdown

Within the provider component (617 lines):

| Concern | Approx Lines | Description |
|---------|--------------|-------------|
| State setup | 30 | useState, useRef, useSelector |
| Connection effects | 50 | MQTT connect/disconnect, state sync |
| Subscription effects | 110 | Topic subscriptions (ready_to_pay, payment_result, etc.) |
| Heartbeat effects | 90 | Send/receive heartbeats, timeout handling |
| Screen sync effect | 50 | Watch Redux state, publish screen changes |
| Publish callbacks | 180 | 8 publish functions |
| Transaction helpers | 50 | setActiveTransaction, clearTransaction, updateStep |
| Context render | 40 | Context value assembly, JSX |

---

## Proposed Module Structure

```
apps/mango-pad/src/providers/PadMqttProvider/
├── index.ts                    # Barrel exports
├── PadMqttProvider.tsx         # Main provider (~250-300 lines)
├── types.ts                    # All interfaces and types
├── constants.ts                # Timeouts, dev mode IDs
├── utils/
│   ├── index.ts               # Utils barrel
│   ├── deviceId.ts            # getOrCreateDeviceId
│   ├── pairing.ts             # getPairingInfo
│   └── screenMapping.ts       # flowStepToScreen, screenToFlowStep
├── hooks/
│   ├── index.ts               # Hooks barrel
│   ├── useConnectionEffects.ts    # Connection state management
│   ├── useSubscriptions.ts        # MQTT topic subscriptions
│   ├── useHeartbeat.ts            # Heartbeat send/receive
│   ├── useScreenSync.ts           # Screen change publishing
│   └── usePublishCallbacks.ts     # All publish functions
└── contexts/
    ├── index.ts               # Contexts barrel
    └── contexts.ts            # PadMqttContext, UnpairContext definitions
```

---

## Implementation Steps

### Phase 1: Extract Types & Constants (~15 min)

**1.1 Create `types.ts`**
```typescript
// Move from PadMqttProvider.tsx:
// - PosConnectionStatus interface (lines 49-52)
// - PadMqttContextValue interface (lines 54-77)
// - PadMqttProviderProps interface (lines 81-83)
// - UnpairContextValue interface (lines 121-124)
```

**1.2 Create `constants.ts`**
```typescript
// Move from PadMqttProvider.tsx:
// - HEARTBEAT_TIMEOUT_MS (line 86)
// - PAD_HEARTBEAT_INTERVAL_MS (line 89)
// - DEV_MODE_STATION_ID (line 93)
// - DEV_MODE_SALON_ID (line 94)
// - DEV_MODE_DEVICE_ID (line 95)
```

### Phase 2: Extract Utility Functions (~15 min)

**2.1 Create `utils/deviceId.ts`**
```typescript
// Move getOrCreateDeviceId function (lines 97-118)
// Uses DEV_MODE_DEVICE_ID constant
```

**2.2 Create `utils/pairing.ts`**
```typescript
// Move getPairingInfo function (lines 131-148)
```

**2.3 Create `utils/screenMapping.ts`**
```typescript
// Move flowStepToScreen function (lines 153-166)
// Move screenToFlowStep function (lines 171-187)
```

### Phase 3: Extract Contexts (~10 min)

**3.1 Create `contexts/contexts.ts`**
```typescript
// Move PadMqttContext creation (line 79)
// Move UnpairContext creation (line 126)
// Export both contexts
```

### Phase 4: Extract Hooks (~45 min)

**4.1 Create `hooks/useConnectionEffects.ts`**
- Connection state change handler (lines 285-306)
- Offline alert callback (lines 308-316)
- Queued message count polling (lines 318-324)
- MQTT connect/disconnect (lines 326-342)

**4.2 Create `hooks/useSubscriptions.ts`**
- Transaction topic subscriptions (lines 344-451)
  - ready_to_pay
  - payment_result
  - cancel
  - skip_tip, skip_signature, force_complete

**4.3 Create `hooks/useHeartbeat.ts`**
- Station heartbeat subscription (lines 453-504)
- Pad heartbeat publishing (lines 506-549)
- Timeout management

**4.4 Create `hooks/useScreenSync.ts`**
- Screen change watching effect (lines 556-598)
- customer_started publishing logic

**4.5 Create `hooks/usePublishCallbacks.ts`**
- All publish functions as a single hook returning an object:
  - publishTipSelected
  - publishSignature
  - publishReceiptPreference
  - publishTransactionComplete
  - publishHelpRequested
  - publishSplitPayment
  - publishScreenChanged
  - publishCustomerStarted

### Phase 5: Simplify Main Provider (~20 min)

**5.1 Update `PadMqttProvider.tsx`**
```typescript
// Import everything from modules
import { PadMqttContext, UnpairContext } from './contexts';
import { PadMqttContextValue, PadMqttProviderProps } from './types';
import { useConnectionEffects } from './hooks/useConnectionEffects';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useHeartbeat } from './hooks/useHeartbeat';
import { useScreenSync } from './hooks/useScreenSync';
import { usePublishCallbacks } from './hooks/usePublishCallbacks';

// Provider becomes ~250-300 lines:
// - State declarations
// - Hook calls
// - Transaction management functions
// - Context value assembly
// - JSX render
```

### Phase 6: Create Barrel Exports (~5 min)

**6.1 Create `index.ts`**
```typescript
export { PadMqttProvider } from './PadMqttProvider';
export { usePadMqtt, usePadMqttOptional, usePosConnection, useUnpairEvent } from './hooks';
export type { PadMqttContextValue, PosConnectionStatus } from './types';
```

---

## File Size Estimates

| File | Estimated Lines |
|------|-----------------|
| `PadMqttProvider.tsx` | ~250-300 |
| `types.ts` | ~50 |
| `constants.ts` | ~15 |
| `utils/deviceId.ts` | ~25 |
| `utils/pairing.ts` | ~20 |
| `utils/screenMapping.ts` | ~40 |
| `contexts/contexts.ts` | ~15 |
| `hooks/useConnectionEffects.ts` | ~70 |
| `hooks/useSubscriptions.ts` | ~120 |
| `hooks/useHeartbeat.ts` | ~100 |
| `hooks/useScreenSync.ts` | ~60 |
| `hooks/usePublishCallbacks.ts` | ~130 |

**Total:** ~895 lines (slight increase due to imports/exports)
**Main file:** ~250-300 lines ✅

---

## Verification Steps

1. **TypeScript Check**
   ```bash
   cd apps/mango-pad && npm run typecheck
   ```

2. **Lint Check**
   ```bash
   cd apps/mango-pad && npm run lint
   ```

3. **Browser Test**
   - Start dev servers for both Store App and Mango Pad
   - Verify MQTT connection establishes
   - Verify heartbeat works (POS connection indicator)
   - Test a full checkout flow:
     1. Send transaction from Store App
     2. See order review on Mango Pad
     3. Select tip
     4. Sign
     5. Choose receipt preference
     6. Complete transaction

4. **Console Log Check**
   - Verify `[PadMqttProvider]` logs still appear
   - No new errors in console

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking MQTT subscriptions | Keep exact same subscription logic, just move location |
| Stale closure issues | Pass refs and state through hook parameters |
| Import path changes | Update all imports in consuming components |
| Missing exports | Create comprehensive barrel exports |

---

## Dependencies

This refactor affects:
- **No external dependencies** - purely internal restructuring
- Importing components will use same exports from new `index.ts`

---

## Rollback Plan

If issues arise:
1. All changes are in a single commit
2. Easy `git revert` if needed
3. No database or external system changes

---

## Additional Code Review Items (Lower Priority)

After splitting, also consider:

1. **Remove debug console.log statements** in production
   - ~30+ console.log/warn calls
   - Consider using a logging utility with log levels

2. **Add reconnection strategy documentation**
   - Document the heartbeat timeout behavior
   - Document offline queue behavior
