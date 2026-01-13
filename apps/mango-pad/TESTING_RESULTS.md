# Mango Pad Integration - Testing Results

**Date:** 2026-01-12
**Test Method:** Browser automation via Chrome DevTools MCP
**Store App URL:** http://localhost:5173
**Mango Pad URL:** http://localhost:5176

---

## Executive Summary

Testing revealed that MQTT communication between Store App and Mango Pad is **one-way only**:
- ✅ Mango Pad → Store App: Working (heartbeats received)
- ❌ Store App → Mango Pad: NOT working (heartbeats not received)

This causes Mango Pad to show "POS Offline" even though Store App IS publishing heartbeats to the correct topic.

---

## Issues Found (Prioritized)

### 🔴 CRITICAL - Must Fix for Basic Functionality

#### Issue #1: Mango Pad Not Receiving MQTT Messages
**Symptom:** Mango Pad shows "POS Offline" despite Store App publishing heartbeats
**Evidence:**
- Store App logs: `[usePosHeartbeat] Published heartbeat to: salon/c0000000.../station/5a055452.../heartbeat`
- Mango Pad logs: `[PadMqttProvider] Subscribing to station heartbeat: salon/c0000000.../station/5a055452.../heartbeat`
- Topics match exactly, but Mango Pad never receives the messages

**Root Cause Investigation:**
- Mango Pad's mqttClient.subscribe() doesn't log confirmation of successful subscription
- No callback to verify MQTT broker actually accepted the subscription
- Possible timing issue where subscription isn't sent to broker

**Files:**
- `apps/mango-pad/src/services/mqttClient.ts` (lines 183-204)
- `apps/mango-pad/src/providers/PadMqttProvider.tsx` (lines 271-321)

---

#### Issue #2: ReconnectingOverlay Blocks Pairing Flow
**Symptom:** Full-screen "Reconnecting..." overlay appears immediately, blocking Welcome/Pairing pages
**Evidence:**
- User cannot see or interact with Welcome page
- Pairing code input is blocked
- Workaround required: manually dispatch Redux action to hide overlay

**Root Cause:**
1. `mqttService` initializes with `connectionState = 'disconnected'`
2. `onStateChange()` immediately calls callback with 'disconnected'
3. This triggers `setShowReconnecting(true)` before pairing can happen

**Files:**
- `apps/mango-pad/src/services/mqttClient.ts` (line 26, 71)
- `apps/mango-pad/src/providers/PadMqttProvider.tsx` (lines 138-159)
- `apps/mango-pad/src/components/ReconnectingOverlay.tsx`

**Solution:** Don't show ReconnectingOverlay on `/welcome` and `/pair` routes, OR don't trigger reconnecting state until after pairing is complete.

---

#### Issue #3: Redundant PosHeartbeatProvider with Wrong Topic
**Symptom:** Store App publishes heartbeats to TWO different topics
**Evidence:**
- `[PosHeartbeat] Published heartbeat to: salon/.../pos/heartbeat` ← WRONG
- `[usePosHeartbeat] Published heartbeat to: salon/.../station/.../heartbeat` ← CORRECT

**Root Cause:**
- `PosHeartbeatProvider.tsx` uses hardcoded topic: `salon/${STORE_ID}/pos/heartbeat`
- `usePosHeartbeat.ts` uses correct station-specific topic
- Both run simultaneously, creating redundant traffic

**Files:**
- `apps/store-app/src/providers/PosHeartbeatProvider.tsx` (line 53)
- `apps/store-app/src/services/mqtt/hooks/usePosHeartbeat.ts`

**Solution:** Remove or update `PosHeartbeatProvider` to use station-specific topic, or remove it entirely since `usePosHeartbeat` handles this.

---

### 🟠 MEDIUM - Affects User Experience

#### Issue #4: Store App "Paired Devices" Section Empty
**Symptom:** After successful pairing, Store App's Devices settings shows "No devices paired yet"
**Evidence:**
- Pairing completes successfully (Mango Pad shows WaitingPage with station name)
- Store App receives Mango Pad heartbeats
- But paired devices list remains empty

**Root Cause:** Query for paired devices may not be finding the device, or UI isn't updating

**Files:**
- `apps/store-app/src/components/modules/settings/categories/MangoPadSettings.tsx`
- `apps/store-app/src/services/deviceRegistration.ts` (getPairedDevices function)

---

#### Issue #5: Multiple Independent MQTT Connections
**Symptom:** Store App creates 3+ separate MQTT connections
**Evidence:**
- `PosHeartbeatProvider` creates its own connection
- `usePosHeartbeat` creates its own connection
- `usePadHeartbeat` creates its own connection
- Each has different clientId

**Impact:** Inefficient resource usage, potential for race conditions

**Files:**
- `apps/store-app/src/providers/PosHeartbeatProvider.tsx`
- `apps/store-app/src/services/mqtt/hooks/usePosHeartbeat.ts`
- `apps/store-app/src/services/mqtt/hooks/usePadHeartbeat.ts`

**Solution:** Consolidate into single MQTT connection with shared client

---

#### Issue #6: Heartbeat Message Parse Errors
**Symptom:** Store App logs show "Failed to parse message" errors
**Evidence:** `[usePadHeartbeat] Failed to parse message: JSHandle@error`

**Root Cause:** Message format mismatch:
- Mango Pad sends: `{ id, timestamp, payload: {...} }`
- Store App expects: Direct JSON payload without wrapper

**Files:**
- `apps/mango-pad/src/services/mqttClient.ts` (publish function wraps in MqttMessage)
- `apps/store-app/src/services/mqtt/hooks/usePadHeartbeat.ts` (parse logic)

---

#### Issue #7: Heartbeat Timing Issue
**Symptom:** Potential for false disconnect detection
**Evidence:**
- Store App publishes heartbeats every 15 seconds
- Mango Pad timeout is 15 seconds
- Any network latency could cause false "offline" state

**Solution:** Increase timeout to 20-30 seconds, or decrease heartbeat interval to 5 seconds

---

### 🟢 LOW - Minor Issues

#### Issue #8: Duplicate Log Messages
**Symptom:** `[PadMqttProvider] Loaded pairing info` appears twice on mount

#### Issue #9: Missing MQTT Connection Log
**Symptom:** Mango Pad doesn't log when MQTT connection succeeds, making debugging difficult

---

## Verified Working

1. ✅ Device registration in Supabase (Store App gets pairing code)
2. ✅ Pairing code verification (Mango Pad validates code against DB)
3. ✅ Pairing info saved to localStorage on both apps
4. ✅ Station ID values match between apps
5. ✅ Mango Pad publishes heartbeats (Store App receives them)
6. ✅ MQTT broker (EMQX public) is reachable from both apps

---

## Test Data Used

| Item | Value |
|------|-------|
| Store ID | `c0000000-0000-0000-0000-000000000001` |
| Station ID | `5a055452-00a3-4bfb-86b6-6018ce13d8b6` |
| Pairing Code | `783-VRA` |
| Mango Pad Device ID | `pad-ceef5055` |
| MQTT Broker | `wss://broker.emqx.io:8084/mqtt` |

---

## Next Steps

1. Fix Issue #1 (MQTT subscription) - Critical for any functionality
2. Fix Issue #2 (ReconnectingOverlay) - Critical for pairing UX
3. Fix Issue #3 (Redundant heartbeat) - Clean up architecture
4. Then proceed with transaction flow testing
