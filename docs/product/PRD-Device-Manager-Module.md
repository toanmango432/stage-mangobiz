# Product Requirements Document: Device Manager Module

**Product:** Mango POS
**Module:** Device Manager
**Version:** 2.0
**Last Updated:** December 28, 2025
**Status:** Complete PRD with Acceptance Criteria
**Priority:** P2 (Medium)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [User Personas & Use Cases](#3-user-personas--use-cases)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Feature Requirements](#5-feature-requirements)
6. [Business Rules](#6-business-rules)
7. [UX Specifications](#7-ux-specifications)
8. [Technical Requirements](#8-technical-requirements)
9. [Hardware Specifications](#9-hardware-specifications)
10. [Success Metrics](#10-success-metrics)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Implementation Plan](#12-implementation-plan)

---

## 1. Executive Summary

### 1.1 Overview

The Device Manager Module handles device identification, fingerprinting, registration, and hardware integrations. It manages device identity for offline mode tracking and ensures secure multi-device coordination across the salon's POS ecosystem.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Device Identity** | Unique fingerprint for each device |
| **Multi-Device Sync** | Coordinate data across salon devices |
| **Hardware Integration** | Manage printers, card readers, cash drawers |
| **Offline Capability** | Track which devices can work offline |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Device registration success | 99%+ |
| Sync queue visibility | 100% |
| Hardware connection reliability | 95%+ uptime |
| Device fingerprint uniqueness | 100% unique IDs |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **No device tracking** | Can't identify which device did what | Unique device fingerprinting |
| **Hardware mystery** | Printer offline, no one knows | Real-time hardware status |
| **Sync confusion** | "Did my changes save?" | Visible sync queue |
| **Offline chaos** | Multiple devices, data conflicts | Designated offline devices |

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Salon Manager

**Use Cases:**
- DEV-UC-001: View all registered devices
- DEV-UC-002: Rename device for clarity
- DEV-UC-003: Enable/disable offline mode for device
- DEV-UC-004: Revoke access from lost device

### 3.2 Secondary User: Front Desk

**Use Cases:**
- DEV-UC-005: Check if printer is connected
- DEV-UC-006: Test print to verify connection
- DEV-UC-007: Check sync status

---

## 4. Competitive Analysis

### 4.1 Feature Comparison

| Feature | Mango POS | Square | Fresha | Lightspeed |
|---------|-----------|--------|--------|------------|
| **Device Fingerprinting** | ✅ SHA-256 | ✅ | ❌ | ✅ |
| **Offline Mode All Devices** | ✅ | ❌ Limited | ❌ | ❌ |
| **Visual Sync Queue** | ✅ | ❌ | ❌ | ❌ |
| **Hardware Status Dashboard** | ✅ | ✅ | ⚠️ Basic | ✅ |
| **Multi-Device Management** | ✅ | ✅ | ✅ | ✅ |
| **Remote Device Revocation** | ✅ | ✅ | ✅ | ✅ |
| **Tap to Pay (NFC)** | ✅ Fiserv | ✅ Native | ❌ | ⚠️ Limited |
| **Network Diagnostics** | ✅ | ❌ | ❌ | ⚠️ Basic |

### 4.2 Mango Advantages

| Advantage | Description |
|-----------|-------------|
| **Universal Offline** | All devices work offline by default, not just designated |
| **Visible Sync Queue** | Users see exactly what's pending, reducing anxiety |
| **Network Diagnostics** | Self-service troubleshooting reduces support calls |
| **Tap to Pay via Fiserv** | Industry-leading payment partner for reliability |

### 4.3 Gaps to Address

| Gap | Priority | Plan |
|-----|----------|------|
| No native apps yet | P1 | Capacitor builds in Q2 |
| Limited printer support | P2 | Expand printer compatibility |
| No kiosk mode | P3 | Future feature |

---

## 5. Feature Requirements

### 5.1 Device Identification

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DEV-P0-001 | Generate unique device ID | P0 | UUID persisted in localStorage |
| DEV-P0-002 | Device fingerprinting | P0 | SHA-256 hash of browser/hardware characteristics |
| DEV-P0-003 | Device name (user-assigned) | P0 | Editable, persisted |
| DEV-P0-004 | Device type detection | P0 | iOS, Android, Desktop, Web |
| DEV-P1-005 | Browser detection | P1 | Chrome, Safari, Firefox, Edge |
| DEV-P1-006 | OS detection | P1 | Windows, macOS, Linux, iOS, Android |

### 5.2 Device Registration

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DEV-P0-007 | Register device with backend on login | P0 | Registration payload sent |
| DEV-P0-008 | All devices offline-enabled by default | P0 | No mode selection; all devices have offline capability |
| DEV-P1-009 | Device revocation | P1 | Immediately disable access |
| DEV-P1-010 | Device list for salon | P1 | View all registered devices |
| DEV-P1-011 | Last active timestamp | P1 | When device was last used |

### 5.3 Sync & Network Status

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DEV-P0-012 | Online/Offline indicator | P0 | Real-time status in header |
| DEV-P0-013 | Pending sync operations count | P0 | Badge showing queue size |
| DEV-P0-014 | Force sync button | P0 | Manually trigger sync |
| DEV-P0-015 | Last sync timestamp | P0 | Display when last synced |
| DEV-P1-016 | Sync queue details (expandable) | P1 | List pending operations |
| DEV-P1-017 | Network diagnostics | P1 | WiFi, API reachability, latency |
| DEV-P2-018 | Sync log history | P2 | View past sync events |

### 5.4 Hardware Integrations

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DEV-P1-019 | Receipt printer status | P1 | Connected/Disconnected |
| DEV-P1-020 | Printer test print | P1 | Send test page |
| DEV-P1-021 | Printer configuration | P1 | IP, port, model selection |
| DEV-P1-022 | Card reader status | P1 | Connected/Disconnected |
| DEV-P1-023 | Card reader test | P1 | Verify connection |
| DEV-P2-024 | Cash drawer status | P2 | Connected/Disconnected |
| DEV-P2-025 | Cash drawer open test | P2 | Trigger drawer open |
| DEV-P2-026 | Barcode scanner status | P2 | Connected/Disconnected |

### 5.5 Device Maintenance

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DEV-P1-027 | Clear cache option | P1 | Confirmation dialog, clears IndexedDB |
| DEV-P1-028 | Storage usage display | P1 | Show MB used / available |
| DEV-P1-029 | App version display | P1 | Current version number |
| DEV-P2-030 | Check for updates | P2 | Compare with latest version |
| DEV-P2-031 | Diagnostic mode | P2 | Extra logging for support |

---

## 6. Business Rules

### 6.1 Offline Mode Rules

| Rule ID | Rule |
|---------|------|
| DEV-BR-001 | All devices are offline-enabled by default |
| DEV-BR-002 | No opt-in/opt-out for offline mode |
| DEV-BR-003 | All devices cache business data locally |
| DEV-BR-004 | All devices sync automatically when online |

### 6.2 Security Rules

| Rule ID | Rule |
|---------|------|
| DEV-BR-005 | Device revocation immediate |
| DEV-BR-006 | Device ID regenerated on clear cache |
| DEV-BR-007 | All device actions logged |
| DEV-BR-008 | Force sync requires confirmation |

### 6.3 Hardware Rules

| Rule ID | Rule |
|---------|------|
| DEV-BR-009 | Only one printer can be active per device |
| DEV-BR-010 | Card reader auto-detected if available |
| DEV-BR-011 | Hardware status refreshed every 30 seconds |

---

## 7. UX Specifications

### 7.1 Device Manager Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Device Manager                                                  │
├─────────────────────────────────────────────────────────────────┤
│ THIS DEVICE                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📱 Front Desk iPad                              [Edit Name] │ │
│ │ Device ID: abc123...                                        │ │
│ │ Type: iPad │ iOS 17.2 │ Safari                              │ │
│ │ Mode: Offline-Enabled (Default)                             │ │
│ │ Storage: 2.3 GB / 64 GB                                     │ │
│ │ App Version: 2.0.0                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ SYNC STATUS                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🟢 Online                    Last sync: 2 min ago           │ │
│ │ Pending operations: 0                                       │ │
│ │ [Force Sync]  [View Sync Log]                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ CONNECTED HARDWARE                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🖨️ Receipt Printer                                          │ │
│ │ Star TSP143III │ 🟢 Connected                               │ │
│ │ [Test Print]  [Configure]                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💳 Card Reader                                              │ │
│ │ Fiserv TTP │ 🟢 Connected │ Battery: 85%                    │ │
│ │ [Test Connection]                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💵 Cash Drawer                                              │ │
│ │ 🔴 Not Connected                                            │ │
│ │ [Configure]                                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ NETWORK DIAGNOSTICS                                             │
│ WiFi: 🟢 Connected (Strong)                                     │
│ API Server: 🟢 Reachable (45ms)                                 │
│ WebSocket: 🟢 Connected                                         │
│ [Run Full Diagnostics]                                          │
├─────────────────────────────────────────────────────────────────┤
│ MAINTENANCE                                                     │
│ [Clear Cache]  [Reset Settings]  [Diagnostic Mode]              │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Status Indicators

| Status | Color | Icon |
|--------|-------|------|
| Connected/Online | Green #22C55E | 🟢 |
| Disconnected/Offline | Red #EF4444 | 🔴 |
| Syncing/Connecting | Blue #3B82F6 | 🔵 |
| Warning/Limited | Yellow #EAB308 | 🟡 |

### 7.3 Sync Queue Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ Pending Sync Operations (3)                           [Sync Now]│
├─────────────────────────────────────────────────────────────────┤
│ ⏳ Appointment #APT-123 - Update                    2 min ago   │
│ ⏳ Client Sarah Johnson - New                       5 min ago   │
│ ⏳ Transaction #TXN-456 - Payment                   5 min ago   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Technical Requirements

### 8.1 Device Fingerprinting

```typescript
interface DeviceFingerprint {
  userAgent: string;
  language: string;
  colorDepth: number;
  screenResolution: string;
  timezone: string;
  sessionStorage: boolean;
  localStorage: boolean;
  indexedDB: boolean;
  platform: string;
  cpuClass?: string;
  touchSupport: boolean;
  canvas: string;  // Canvas fingerprint hash
}

interface DeviceRegistration {
  deviceId: string;
  fingerprint: string;  // SHA-256 of DeviceFingerprint
  deviceName: string;
  deviceType: 'ios' | 'android' | 'desktop' | 'web';
  browser: string;
  os: string;
  offlineEnabled: true;  // Always true - all devices are offline-enabled
  createdAt: Date;
  lastActiveAt: Date;
  lastSyncAt: Date;
  salonId: string;
}
```

### 8.2 Performance Targets

| Metric | Target |
|--------|--------|
| Device ID generation | < 100ms |
| Fingerprint generation | < 500ms |
| Sync status refresh | Every 30 seconds |
| Hardware status check | Every 30 seconds |

### 8.3 Storage

| Data | Storage |
|------|---------|
| Device ID | localStorage (persistent) |
| Device name | localStorage |
| Fingerprint | Generated on demand |
| Sync queue | IndexedDB |
| Hardware config | localStorage |

---

## 9. Hardware Specifications

### 9.1 Supported Devices

| Platform | Minimum Requirements | Recommended |
|----------|---------------------|-------------|
| **iOS (iPad)** | iPad 7th Gen+, iOS 15+ | iPad Pro, iPadOS 17+ |
| **iOS (iPhone)** | iPhone 8+, iOS 15+ | iPhone 12+, iOS 17+ |
| **Android Tablet** | Android 10+, 3GB RAM | Android 13+, 4GB+ RAM |
| **Android Phone** | Android 10+, 3GB RAM | Android 13+, 4GB+ RAM |
| **Desktop (Web)** | Chrome 100+, 4GB RAM | Chrome 115+, 8GB RAM |
| **Desktop (Electron)** | macOS 11+, Windows 10+ | macOS 13+, Windows 11 |

### 9.2 Receipt Printers

| Printer Model | Connection | Status | Notes |
|---------------|------------|--------|-------|
| **Star TSP143III** | USB, Ethernet, Bluetooth | ✅ Supported | Recommended model |
| **Star TSP654II** | USB, Ethernet | ✅ Supported | Wide-format receipts |
| **Epson TM-T88VI** | USB, Ethernet, Bluetooth | ✅ Supported | High-speed printing |
| **Epson TM-T20III** | USB | ✅ Supported | Budget option |
| **Bixolon SRP-330II** | USB, Ethernet, Bluetooth | ⚠️ Limited | Testing in progress |

**Connection Types:**

| Connection | Platform Support | Setup Complexity |
|------------|------------------|------------------|
| USB | Desktop, Electron | Easy (plug & play) |
| Ethernet/WiFi | All platforms | Medium (IP config) |
| Bluetooth | iOS, Android | Medium (pairing) |
| AirPrint | iOS | Easy |

### 9.3 Payment Hardware

| Device | Integration | Connection | Notes |
|--------|-------------|------------|-------|
| **Fiserv TTP (Tap to Pay)** | ✅ Primary | NFC | iOS/Android native |
| **CardConnect Bolt** | 🔄 Planned | USB/Bluetooth | Desktop integration |
| **Verifone (Fiserv)** | 🔄 Planned | IP/USB | Counter terminals |
| **Clover Flex** | ❌ Not supported | - | Different ecosystem |
| **Square Reader** | ❌ Not supported | - | Different ecosystem |

**Tap to Pay Requirements:**

| Platform | Hardware | Requirements |
|----------|----------|--------------|
| iOS | iPhone XS+ | iOS 16.4+, NFC chip |
| iOS | iPad | Not supported (no NFC) |
| Android | Any NFC phone | Android 9+, Google Play Services |

### 9.4 Cash Drawers

| Model | Connection | Trigger | Status |
|-------|------------|---------|--------|
| **Star CD3 Series** | Printer-driven | Receipt print | ✅ Supported |
| **APG Vasario** | Printer-driven | Receipt print | ✅ Supported |
| **USB Cash Drawers** | USB Direct | Manual/API | ⚠️ Desktop only |

### 9.5 Barcode Scanners

| Scanner Type | Connection | Platform | Status |
|--------------|------------|----------|--------|
| **Camera-based** | Built-in | All | ✅ Supported |
| **USB Barcode Gun** | USB HID | Desktop | ✅ Supported |
| **Bluetooth Scanner** | Bluetooth | iOS, Android | ⚠️ Testing |

---

## 10. Success Metrics

### 10.1 Device Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Device registration success rate | 99%+ | Backend logs |
| Device fingerprint uniqueness | 100% | No duplicate IDs |
| Device revocation effectiveness | < 1 minute | Time to block access |
| Device list accuracy | 100% | All devices visible |

### 10.2 Sync Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync queue visibility | 100% | Users see all pending ops |
| Sync completion rate | 99.5%+ | Retry analytics |
| Sync latency | < 5 seconds | Time from action to cloud |
| Conflict resolution success | 99%+ | No data loss |

### 10.3 Hardware Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Hardware detection accuracy | 95%+ | Correct status displayed |
| Printer connection uptime | 95%+ | Monitoring logs |
| Card reader connection uptime | 99%+ | Payment success rate |
| Test print/connection success | 99%+ | User feedback |

### 10.4 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Device setup time | < 2 minutes | Analytics |
| Hardware troubleshooting calls | -50% | Support tickets |
| Self-service resolution rate | 70%+ | Diagnostics usage |

---

## 11. Risks & Mitigations

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Device fingerprint collision | Very Low | High | SHA-256 + UUID combination |
| IndexedDB quota exceeded | Low | Medium | Storage monitoring, cleanup warnings |
| Sync queue grows too large offline | Medium | Medium | Queue size limits, priority ordering |
| Browser fingerprint changes | Medium | Low | Re-register device, notify user |
| Hardware detection fails | Medium | Medium | Manual configuration fallback |

### 11.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Limited printer compatibility | Medium | Medium | Partner with top 3 brands; document supported models |
| Tap to Pay not available in all regions | High | Medium | Clear regional availability documentation |
| Users confused by sync status | Medium | Low | Clear visual indicators, help tooltips |
| Too many devices registered | Low | Low | Device limit per salon (configurable) |

### 11.3 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Device Manager too technical | Medium | Medium | Simplified view with "Advanced" toggle |
| Hardware setup requires IT help | Medium | High | Step-by-step wizard, video tutorials |
| Sync anxiety during offline | High | Medium | Clear "pending" count, last sync time |

---

## 12. Implementation Plan

### Phase 1: Core Identity (Week 1)
- [ ] DEV-P0-001 to DEV-P0-004: Device ID and fingerprinting
- [ ] DEV-P0-007, DEV-P0-008: Registration and mode

### Phase 2: Sync Status (Week 2)
- [ ] DEV-P0-012 to DEV-P0-015: Sync indicators
- [ ] DEV-P1-016, DEV-P1-017: Queue details and diagnostics

### Phase 3: Hardware (Week 3-4)
- [ ] DEV-P1-019 to DEV-P1-023: Printer and card reader
- [ ] DEV-P1-027 to DEV-P1-029: Maintenance options

### Phase 4: Advanced (Future)
- [ ] DEV-P1-009 to DEV-P1-011: Device management
- [ ] DEV-P2-024 to DEV-P2-031: Cash drawer, scanner, diagnostics

---

## Appendix

### A. Related Documents

- [PRD-Opt-In-Offline-Mode.md](./PRD-Opt-In-Offline-Mode.md) - Offline mode specifications
- [PAYMENT_INTEGRATION.md](../architecture/PAYMENT_INTEGRATION.md) - Card reader integration

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 27, 2025 | Initial Device Manager PRD |
| 2.0 | Dec 28, 2025 | Added: Competitive Analysis, Hardware Specifications (printers, payment, cash drawers, scanners), Success Metrics, Risks & Mitigations, standardized section numbering |

---

*Document Version: 2.0 | Last Updated: December 28, 2025*
