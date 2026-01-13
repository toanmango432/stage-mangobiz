# Mango Pad Implementation Plan

> **Generated:** 2026-01-12
> **Based on:** Browser automation testing results (TESTING_RESULTS.md)
> **Goal:** Complete bi-directional MQTT communication for Store App ↔ Mango Pad

---

## Executive Summary

Testing revealed that **MQTT communication is one-way only**:
- ✅ Mango Pad → Store App: Working (heartbeats received)
- ❌ Store App → Mango Pad: NOT working (heartbeats not received)

This blocks ALL functionality. We must fix the MQTT subscription issue before implementing the transaction flow.

---

## Priority Order

| Priority | Phase | Description | Blocks |
|----------|-------|-------------|--------|
| 🔴 P0 | Phase 0 | Fix MQTT Subscription Bug | Everything |
| 🔴 P0 | Phase 0.5 | Fix ReconnectingOverlay Bug | Pairing UX |
| 🟠 P1 | Phase 1 | Clean Up Redundant Code | None (tech debt) |
| 🟢 P2 | Phase 2-6 | Transaction Flow | N/A |

---

## Phase 0: Fix MQTT Subscription Bug (CRITICAL)

**Status:** 🔴 BLOCKING
**Impact:** Mango Pad cannot receive ANY messages from Store App

### Root Cause Analysis

1. **Evidence:**
   - Store App publishes to: `salon/c0000000.../station/5a055452.../heartbeat`
   - Mango Pad subscribes to: `salon/c0000000.../station/5a055452.../heartbeat`
   - Topics match EXACTLY, but messages never arrive

2. **Suspected Issues:**
   - `mqttClient.subscribe()` doesn't log subscription success
   - No callback to verify MQTT broker accepted the subscription
   - Possible timing: subscription added to local Set but not sent to broker
   - Client may not be fully connected when subscribe() is called

### Files to Fix

| File | Issue | Fix |
|------|-------|-----|
| `apps/mango-pad/src/services/mqttClient.ts` | Lines 183-204: subscribe() lacks confirmation | Add callback with success/error logging |
| `apps/mango-pad/src/services/mqttClient.ts` | Lines 78-93: onConnect() resubscribes but no verification | Add logging and error handling |

### Implementation Steps

#### Step 0.1: Add Subscription Confirmation Logging

```typescript
// mqttClient.ts - subscribe() method
subscribe<T>(topic: string, handler: MessageHandler<T>): () => void {
  console.log(`[MqttClient] Subscribing to: ${topic}`);

  if (!this.subscriptions.has(topic)) {
    this.subscriptions.set(topic, new Set());
    if (this.client?.connected) {
      this.client.subscribe(topic, { qos: 1 }, (err, granted) => {
        if (err) {
          console.error(`[MqttClient] Subscription FAILED for ${topic}:`, err);
        } else {
          console.log(`[MqttClient] Subscription SUCCESS for ${topic}:`, granted);
        }
      });
    } else {
      console.warn(`[MqttClient] Client not connected, queuing subscription for: ${topic}`);
    }
  }
  // ... rest of handler registration
}
```

#### Step 0.2: Verify onConnect Resubscription

```typescript
// mqttClient.ts - onConnect handler
private setupEventHandlers(): void {
  this.client?.on('connect', () => {
    console.log('[MqttClient] Connected to broker');
    this.connectionState = 'connected';
    this.notifyStateChange();

    // Resubscribe to all topics
    const topics = Array.from(this.subscriptions.keys());
    console.log(`[MqttClient] Resubscribing to ${topics.length} topics:`, topics);

    topics.forEach((topic) => {
      this.client?.subscribe(topic, { qos: 1 }, (err, granted) => {
        if (err) {
          console.error(`[MqttClient] Resubscription FAILED for ${topic}:`, err);
        } else {
          console.log(`[MqttClient] Resubscription SUCCESS for ${topic}`);
        }
      });
    });
  });
}
```

#### Step 0.3: Add Connection State Check in PadMqttProvider

```typescript
// PadMqttProvider.tsx - when subscribing to heartbeat
useEffect(() => {
  if (!pairing || mqttConnectionStatus !== 'connected') {
    console.log('[PadMqttProvider] Waiting for MQTT connection before subscribing');
    return;
  }

  console.log('[PadMqttProvider] MQTT connected, setting up subscriptions');
  // ... rest of subscription logic
}, [pairing, mqttConnectionStatus]);
```

### Verification

After implementing:
1. Open browser DevTools console on both apps
2. Look for:
   - `[MqttClient] Subscription SUCCESS for salon/.../station/.../heartbeat`
   - `[MqttClient] Message received on topic: salon/.../station/.../heartbeat`
3. Mango Pad should show "POS Connected" within 15 seconds

---

## Phase 0.5: Fix ReconnectingOverlay Bug (CRITICAL)

**Status:** 🔴 BLOCKING PAIRING UX
**Impact:** Full-screen overlay blocks Welcome/Pairing pages

### Root Cause

1. `mqttService` initializes with `connectionState = 'disconnected'`
2. `onStateChange()` immediately fires callback with 'disconnected'
3. This triggers `setShowReconnecting(true)` BEFORE pairing can happen

### Files to Fix

| File | Issue | Fix |
|------|-------|-----|
| `apps/mango-pad/src/providers/PadMqttProvider.tsx` | Lines 138-159: Shows overlay on any 'disconnected' state | Don't show overlay until AFTER successful pairing AND was previously connected |
| `apps/mango-pad/src/components/ReconnectingOverlay.tsx` | May need conditional rendering | Add route-based exclusion |

### Implementation Steps

#### Step 0.5.1: Track Previous Connection State

```typescript
// PadMqttProvider.tsx
const [wasConnected, setWasConnected] = useState(false);
const [showReconnecting, setShowReconnecting] = useState(false);

// Update logic
useEffect(() => {
  if (mqttConnectionStatus === 'connected') {
    setWasConnected(true);
    setShowReconnecting(false);
  } else if (mqttConnectionStatus === 'disconnected' && wasConnected && isPaired()) {
    // Only show reconnecting if:
    // 1. We were previously connected
    // 2. We are paired (not on welcome/pair pages)
    setShowReconnecting(true);
  }
}, [mqttConnectionStatus, wasConnected]);
```

#### Step 0.5.2: Route-Based Exclusion (Alternative)

```typescript
// App.tsx or PadMqttProvider.tsx
const location = useLocation();
const excludedRoutes = ['/welcome', '/pair'];
const shouldShowOverlay = showReconnecting && !excludedRoutes.includes(location.pathname);
```

### Verification

1. Clear localStorage: `localStorage.clear()`
2. Navigate to Mango Pad
3. Welcome page should be visible (no overlay)
4. Enter pairing code
5. After pairing, if connection drops, THEN show overlay

---

## Phase 1: Clean Up Redundant Code (Medium)

**Status:** 🟠 Tech Debt
**Impact:** Multiple MQTT connections, confusion, wasted resources

### Issues to Fix

| Issue | File | Fix |
|-------|------|-----|
| Redundant `PosHeartbeatProvider` | `apps/store-app/src/providers/PosHeartbeatProvider.tsx` | Remove or update to use station-specific topic |
| Wrong topic pattern | Line 53: `salon/${STORE_ID}/pos/heartbeat` | Should be: `salon/${STORE_ID}/station/${STATION_ID}/heartbeat` |
| Multiple MQTT connections | Various hooks create separate clients | Consolidate into single MqttProvider |
| Parse errors | `usePadHeartbeat.ts` | Handle wrapped message format |

### Implementation Steps

#### Step 1.1: Remove PosHeartbeatProvider

The `usePosHeartbeat` hook already handles station heartbeats correctly. Remove the redundant provider:

```typescript
// App.tsx - Remove PosHeartbeatProvider wrapper
// BEFORE:
<PosHeartbeatProvider>
  <MqttProvider>
    <App />
  </MqttProvider>
</PosHeartbeatProvider>

// AFTER:
<MqttProvider>
  <App />
</MqttProvider>
```

#### Step 1.2: Fix Message Parse Errors

```typescript
// usePadHeartbeat.ts - Handle wrapped message format
const handleMessage = (message: string) => {
  try {
    const parsed = JSON.parse(message);
    // Check if message is wrapped in MqttMessage format
    const payload = parsed.payload || parsed;
    // ... process payload
  } catch (err) {
    console.error('[usePadHeartbeat] Failed to parse message:', err);
  }
};
```

---

## Phase 2-6: Transaction Flow Implementation

> **Prerequisite:** Phases 0 and 0.5 must be complete and verified

See original plan in `/Users/seannguyen/.claude/plans/purring-brewing-whale.md` for detailed transaction flow implementation.

### Quick Summary

| Phase | Description | Files |
|-------|-------------|-------|
| Phase 2 | Add transaction types to Mango Pad | `types/index.ts` |
| Phase 3 | Extend PadMqttProvider with transaction state | `PadMqttProvider.tsx` |
| Phase 4 | Add publish functions (tip, signature, receipt) | `PadMqttProvider.tsx` |
| Phase 5 | Update existing pages (Waiting, Receipt, Tip, Signature) | `pages/*.tsx` |
| Phase 6 | Create new pages (Processing, Complete, Failed) | `pages/*.tsx` |
| Phase 7 | Fix sendPaymentResult in Store App | `PaymentModal.tsx` |

---

## Implementation Order (Prioritized)

| # | Task | Priority | Est. Time | Depends On |
|---|------|----------|-----------|------------|
| 1 | Fix mqttClient.subscribe() with confirmation callbacks | 🔴 P0 | 30 min | - |
| 2 | Fix PadMqttProvider subscription timing | 🔴 P0 | 20 min | #1 |
| 3 | Add connection state logging | 🔴 P0 | 15 min | #1 |
| 4 | Test bi-directional heartbeat | 🔴 P0 | 15 min | #1-3 |
| 5 | Fix ReconnectingOverlay route exclusion | 🔴 P0 | 20 min | - |
| 6 | Remove/fix PosHeartbeatProvider | 🟠 P1 | 15 min | - |
| 7 | Fix message parse errors | 🟠 P1 | 15 min | - |
| 8 | Add transaction types | 🟢 P2 | 15 min | #4 |
| 9 | Extend PadMqttProvider with transaction state | 🟢 P2 | 45 min | #8 |
| 10 | Add publish functions | 🟢 P2 | 30 min | #9 |
| 11 | Create navigation hook | 🟢 P2 | 20 min | #9 |
| 12 | Update WaitingPage | 🟢 P2 | 15 min | #9 |
| 13 | Update ReceiptPage | 🟢 P2 | 20 min | #9 |
| 14 | Update TipPage | 🟢 P2 | 25 min | #10 |
| 15 | Update SignaturePage | 🟢 P2 | 20 min | #10 |
| 16 | Create ReceiptPreferencePage | 🟢 P2 | 30 min | #10 |
| 17 | Create ProcessingPage | 🟢 P2 | 15 min | #9 |
| 18 | Create CompletePage | 🟢 P2 | 20 min | #9 |
| 19 | Create FailedPage | 🟢 P2 | 15 min | #9 |
| 20 | Update App.tsx routes | 🟢 P2 | 10 min | #16-19 |
| 21 | Fix sendPaymentResult in Store App | 🔴 P0 | 30 min | #4 |
| 22 | Full integration test | 🟢 P2 | 30 min | All |

**Total Estimated Time:** ~7.5 hours

---

## Success Criteria

### Phase 0 Complete When:
- [ ] Console shows `[MqttClient] Subscription SUCCESS` for heartbeat topic
- [ ] Console shows `[MqttClient] Message received` when Store App publishes
- [ ] Mango Pad shows "POS Connected" within 15 seconds of Store App starting

### Phase 0.5 Complete When:
- [ ] Welcome page visible without overlay after clearing localStorage
- [ ] Pairing code can be entered
- [ ] Overlay only appears after successful pairing AND connection drops

### Phase 1 Complete When:
- [ ] Only ONE heartbeat topic being published by Store App
- [ ] No parse errors in console
- [ ] Single MQTT connection per app

### Full Flow Complete When:
- [ ] Staff clicks "Send to Pad" → Mango Pad shows receipt
- [ ] Customer completes tip/signature/receipt preference
- [ ] Store App receives all customer selections
- [ ] Payment result shows on Mango Pad
- [ ] Cancellation works from both sides
- [ ] Demo mode still works without MQTT

---

## Files Changed Summary

### Must Fix First (Phase 0)
- `apps/mango-pad/src/services/mqttClient.ts` - Subscription callbacks
- `apps/mango-pad/src/providers/PadMqttProvider.tsx` - Timing/overlay logic

### Clean Up (Phase 1)
- `apps/store-app/src/providers/PosHeartbeatProvider.tsx` - Remove or fix
- `apps/store-app/src/services/mqtt/hooks/usePadHeartbeat.ts` - Fix parse errors

### Transaction Flow (Phase 2+)
- See detailed list in original plan file

---

## Testing Commands

```bash
# Terminal 1: Store App
cd apps/store-app && npm run dev

# Terminal 2: Mango Pad
cd apps/mango-pad && npm run dev

# Browser DevTools Console filters:
# Store App: [usePosHeartbeat], [usePadHeartbeat]
# Mango Pad: [MqttClient], [PadMqttProvider]
```

---

## Notes

- EMQX public broker: `wss://broker.emqx.io:8084/mqtt`
- Store ID: `c0000000-0000-0000-0000-000000000001`
- Station ID: `5a055452-00a3-4bfb-86b6-6018ce13d8b6`
- Heartbeat interval: 15 seconds (consider reducing to 5s or increasing timeout to 30s)
