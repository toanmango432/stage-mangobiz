# 📱 Mango Biz Store App: Operations Module
## Product Requirements Document

**Product Version:** 1.0
**Document Revision:** 2.0
**Document Owner:** Product Team
**Last Updated:** December 28, 2025
**Status:** Active Development

---

## Revision History

| Rev | Date | Author | Changes |
|-----|------|--------|---------|
| 2.0 | Dec 28, 2025 | Product Team | Restructured to modular format; extracted 5 module PRDs; added competitive analysis, risks & mitigations sections |
| 1.0 | Dec 2024 | Product Team | Initial comprehensive PRD (monolithic 168KB document) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Objectives](#2-product-vision--objectives)
3. [User Personas](#3-user-personas)
4. [System Overview](#4-system-overview)
5. [Module Index](#5-module-index)
6. [Competitive Analysis](#6-competitive-analysis)
7. [Global Features](#7-global-features)
8. [User Flows](#8-user-flows)
9. [Technical Architecture](#9-technical-architecture)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Success Metrics](#12-success-metrics)
13. [Implementation Plan](#13-implementation-plan)

---

## 1. Executive Summary

### 1.1 Product Overview

The **Mango Biz Store App Operations Module** is the offline-first, mobile-optimized command center for daily salon and spa operations. Operating in **Salon Mode**, this module enables salon managers and front desk staff to orchestrate all client services, staff coordination, and transactions from a single iPad or tablet interface.

### 1.2 Key Problems Solved

| Problem | Impact | Solution |
|---------|--------|----------|
| **Operational Chaos** | Multiple systems create confusion | Unified operations hub |
| **Offline Limitations** | Internet outages halt business | True offline-first architecture |
| **Poor Staff Coordination** | No visibility into availability | Real-time staff status board |
| **Slow Checkout** | Manual processes delay clients | Streamlined checkout flow |
| **Limited Floor Visibility** | Managers fly blind | Live service status dashboard |

### 1.3 Core Value Proposition

> A unified, offline-capable operations hub that gives salons complete control over their daily workflow—from appointment scheduling to checkout—while intelligently managing staff coordination and maintaining seamless multi-device synchronization.

### 1.4 Success Criteria

| Metric | Target |
|--------|--------|
| System uptime (including offline) | 95%+ |
| Checkout time reduction | 40% vs. legacy |
| Revenue loss during outages | Zero |
| Multi-device sync accuracy | 100% within 30s |
| Staff adoption rate | 90%+ within 30 days |

---

## 2. Product Vision & Objectives

### 2.1 Vision Statement

> "Empower salon operators with an intelligent, offline-first operations platform that eliminates operational friction, maximizes staff efficiency, and ensures every client receives seamless service—regardless of connectivity."

### 2.2 Strategic Objectives

**Q1 2026:**
1. Launch core operations module (Book, Front Desk, Checkout)
2. Achieve 500+ active salon deployments
3. Process $10M+ in offline-capable transactions

**Q2 2026:**
4. Add advanced Turn Queue automation with AI-powered staff matching
5. Implement real-time multi-location coordination
6. Launch comprehensive analytics dashboard

### 2.3 Key Differentiators

| Differentiator | Description |
|----------------|-------------|
| **True Offline-First** | Optimized for offline, not just "works offline" |
| **Intelligent Turn Queue** | Auto-assigns based on skills, preferences, availability |
| **Flexible Workflow** | Customizable service flows per salon |
| **Real-Time Coordination** | Sub-second updates across all devices |
| **Single Salon Login** | No individual login friction |

---

## 3. User Personas

### 3.1 Primary: Sarah - Salon Owner/Manager

**Profile:** Age 35-50, manages 15-person salon, tech-comfortable

**Goals:**
- Monitor all salon activities in real-time
- Ensure fair walk-in distribution
- Minimize client wait times
- Track daily revenue

**Pain Points:**
- Can't see who's available at a glance
- Walk-in assignment creates staff conflict
- Internet outages halt operations

### 3.2 Primary: Jessica - Front Desk Coordinator

**Profile:** Age 22-35, primary device user, handles check-ins, scheduling, payments

**Goals:**
- Check clients in quickly
- Assign services to available staff
- Process checkouts fast
- Handle phone calls while managing floor

**Pain Points:**
- Juggling multiple systems
- Not knowing who's free vs. busy
- Clients complaining about wait times

### 3.3 Secondary: Mike - Service Provider

**Profile:** Age 25-45, nail technician, prefers minimal tech interaction

**Goals:**
- Know when next client arrives
- Clock in/out easily
- See daily earnings

---

## 4. System Overview

### 4.1 Architecture Context

```
┌─────────────────────────────────────────────┐
│         MANGO BIZ ECOSYSTEM                 │
├─────────────────────────────────────────────┤
│  Admin Portal (Web) ← Strategic Management  │
│  Store App (Mobile) ← Daily Operations ✓    │
├─────────────────────────────────────────────┤
│         DATA LAYER                          │
│  • Supabase (PostgreSQL) - Cloud DB         │
│  • IndexedDB (Dexie.js) - Local Offline     │
│  • Real-time Subscriptions                  │
├─────────────────────────────────────────────┤
│         PLATFORMS                           │
│  • Web (Vite + React)                       │
│  • iOS/Android (Capacitor)                  │
│  • Desktop (Electron - future)              │
└─────────────────────────────────────────────┘
```

### 4.2 Operating Modes

| Mode | Description | Access Level |
|------|-------------|--------------|
| **Salon Mode** (This PRD) | Logged in as salon account | Full operational permissions |
| **Staff Mode** (Future) | Individual staff login | Personal schedule and earnings only |

### 4.3 Device Requirements

**Minimum:** iPad 8th gen or equivalent, iOS 15+ / Android 11+, 64GB storage

**Recommended:** iPad Pro 11"+, Cellular backup, External receipt printer, Card reader

---

## 5. Module Index

All modules are documented in standalone PRDs for detailed specifications. This section provides overview and navigation.

### 5.1 Core Operations Modules

| Module | Priority | Status | PRD Link | Description |
|--------|----------|--------|----------|-------------|
| **Book** | P0 | Active | [PRD-Book-Module.md](./PRD-Book-Module.md) | Appointment calendar & scheduling |
| **Front Desk** | P0 | Active | [PRD-Front-Desk-Module.md](./PRD-Front-Desk-Module.md) | Operations command center |
| **Pending** | P0 | Active | [PRD-Pending-Module.md](./PRD-Pending-Module.md) | Pre-checkout queue management |
| **Checkout** | P0 | Active | [PRD-Sales-Checkout-Module.md](./PRD-Sales-Checkout-Module.md) | Point of sale & payment processing |
| **Transactions** | P0 | Active | [PRD-Transactions-Module.md](./PRD-Transactions-Module.md) | Transaction history & management |

### 5.2 Configuration Modules

| Module | Priority | Status | PRD Link | Description |
|--------|----------|--------|----------|-------------|
| **Menu Settings** | P0 | Active | [PRD-Menu-Settings-Module.md](./PRD-Menu-Settings-Module.md) | Service catalog management |
| **Settings** | P1 | Active | [PRD-Settings-Module.md](./PRD-Settings-Module.md) | Business configuration hub |
| **Role Settings** | P1 | Planned | — | Permission management |

### 5.3 Team & Staff Modules

| Module | Priority | Status | PRD Link | Description |
|--------|----------|--------|----------|-------------|
| **Team** | P1 | Active | [PRD-Team-Module.md](./PRD-Team-Module.md) | Staff management & profiles |
| **Turn Tracker** | P1 | Active | [PRD-Turn-Tracker-Module.md](./PRD-Turn-Tracker-Module.md) | Fair walk-in distribution |
| **Schedule** | P1 | Planned | — | Staff scheduling & time-off |

### 5.4 Insights & Tools Modules

| Module | Priority | Status | PRD Link | Description |
|--------|----------|--------|----------|-------------|
| **Reports** | P1 | Active | [PRD-Reports-Module.md](./PRD-Reports-Module.md) | Analytics & daily insights |
| **Clients** | P1 | Active | [PRD-Clients-CRM-Module.md](./PRD-Clients-CRM-Module.md) | CRM & client management |
| **Device Manager** | P2 | Active | [PRD-Device-Manager-Module.md](./PRD-Device-Manager-Module.md) | Device & hardware management |

### 5.5 Module Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING FLOW                              │
│  Book → Front Desk → Pending → Checkout → Transactions       │
├─────────────────────────────────────────────────────────────┤
│                    SUPPORTING MODULES                        │
│  Menu Settings ←→ All (service catalog)                      │
│  Team ←→ Book, Front Desk, Turn Tracker                      │
│  Clients ←→ Book, Checkout, Transactions                     │
│  Reports ←→ Transactions, Team                               │
│  Device Manager ←→ All (sync, hardware)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Competitive Analysis

### 6.1 Market Overview

| Competitor | Strengths | Weaknesses | Mango Advantage |
|------------|-----------|------------|-----------------|
| **Fresha** | Free tier, large market share | No offline mode, limited customization | True offline-first |
| **Booksy** | Strong marketplace | Complex pricing, slow checkout | Simpler UX, faster checkout |
| **Square** | Ecosystem integration | Generic (not salon-specific) | Salon-optimized workflows |
| **Vagaro** | All-in-one features | Bloated interface, learning curve | Focused, intuitive design |
| **MangoMint** | Premium experience | High price point | Competitive pricing |

### 6.2 Feature Comparison Matrix

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| True offline mode | ✅ | ❌ | ❌ | ❌ | ❌ |
| Intelligent turn queue | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-device sync | ✅ | ✅ | Partial | ✅ | ✅ |
| Tap to Pay (NFC) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Pending checkout queue | ✅ | ❌ | ❌ | ❌ | ❌ |
| Staff-specific pricing | ✅ | ✅ | ❌ | ❌ | ✅ |
| Real-time staff status | ✅ | Partial | ❌ | ❌ | Partial |
| Walk-in wait time display | ✅ | ❌ | ❌ | ❌ | ❌ |

### 6.3 Unique Value Propositions

1. **Offline-First Architecture:** Only POS that truly works without internet
2. **Pending Queue Module:** Visual checkout queue with urgency indicators
3. **Turn Weight System:** Fair walk-in distribution with configurable weights
4. **Single Login Model:** No staff login friction for shared devices

---

## 7. Global Features

### 7.1 Universal Search

- Persistent search icon in top navigation
- Searches: Clients, Appointments, Transactions, Staff, Services, Tickets
- Quick actions from results (Call, Book, View, Checkout)
- Fuzzy matching and partial phone search

### 7.2 Notification Center

**Operational:** Appointment reminders, client arrivals, service completion, long-wait alerts

**System:** Sync status, device issues, payment failures

**Display:** Bell icon with badge, slide-in panel, toast notifications

### 7.3 Device Status Indicator

- Connection status (Online/Offline/Syncing)
- Pending sync operations count
- Quick reconnect action
- Last sync timestamp

### 7.4 Offline Mode

**Capabilities Matrix:**

| Feature | Offline Support |
|---------|-----------------|
| Book appointments | ✅ Full |
| Check-in clients | ✅ Full |
| Manage Front Desk | ✅ Full |
| Edit tickets | ✅ Full |
| Process cash checkout | ✅ Full |
| Process card checkout | ✅ Queued |
| Void/Refund | ❌ Requires online |
| View transactions | ⚠️ Cached only |

---

## 8. User Flows

### 8.1 Primary Flows

| Flow | Description | Detailed Spec |
|------|-------------|---------------|
| Walk-In Client | Client arrives → Wait List → Assignment → Service → Checkout | See Section 8.2 below |
| Scheduled Appointment | Coming → Check-In → Service → Pending → Checkout | Similar to walk-in |
| Multi-Staff Service | Multiple staff on one ticket → Split tips | Coordinated completion |
| Offline Operation | Internet loss → Continue operations → Sync on restore | Automatic queue management |

### 8.2 Walk-In Client Flow (Reference)

```
Check-In Kiosk                Store App                    Staff
      │                           │                          │
      ├─── Walk-in request ──────→│                          │
      │                           ├─── Notification ────────→│
      │                           │    (Turn Queue assigns)   │
      │                           │                          │
      │                           ├─── Start Service ────────→│
      │                           │    (Ticket: In-Service)   │
      │                           │                          │
      │                           │←── Mark Done ─────────────│
      │                           │    (Ticket: Pending)      │
      │                           │                          │
      │                           ├─── Checkout ──────────────│
      │                           │    (Payment processed)    │
      │                           │                          │
      │                           ├─── Transaction Complete   │
```

### 8.3 End of Day Flow

1. Pre-Check: Open tickets, pending syncs, unprocessed payments
2. Cash Reconciliation: Expected vs. counted, variance entry
3. Sales Summary: Review metrics
4. Generate Reports: Daily sales, commission, payment summary
5. Final Sync: Upload all pending data
6. Close Register: Lock device

---

## 9. Technical Architecture

> **Detailed Documentation:** See [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md)

### 9.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript 5.5, Vite |
| **State** | Redux Toolkit, React Query |
| **UI** | Tailwind CSS, Radix UI, Framer Motion |
| **Local DB** | IndexedDB (Dexie.js) |
| **Cloud DB** | Supabase (PostgreSQL) |
| **Real-time** | Supabase Realtime |
| **Platforms** | Web, iOS/Android (Capacitor), Desktop (Electron) |
| **Payments** | Fiserv CommerceHub TTP |

### 9.2 Platform Capabilities

| Feature | Web | iOS | Android | Desktop |
|---------|-----|-----|---------|---------|
| Tap to Pay (NFC) | ❌ | ✅ | ✅ | ❌ |
| Receipt Printer | Browser | Native | Native | USB |
| Offline Mode | ✅ | ✅ | ✅ | ✅ |
| Card Reader USB | ❌ | ❌ | ❌ | ✅ |

### 9.3 Data Flow (Offline-First Architecture)

> **All devices are offline-enabled by default. There is no opt-in/opt-out.**

```
┌─────────────────────────────────────────────────────────────┐
│  ALL DEVICES (Offline-First)                                 │
│                                                              │
│  User Action                                                 │
│       ↓                                                      │
│  Redux Thunk                                                 │
│       ↓                                                      │
│  dataService                                                 │
│       ↓                                                      │
│  IndexedDB (Local)  ←→  Sync Queue                          │
│       ↓                      ↓ (when online)                 │
│  Instant UI Update      Supabase → PostgreSQL                │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 Payment Integration

> **Detailed Documentation:** See [PAYMENT_INTEGRATION.md](../architecture/PAYMENT_INTEGRATION.md)

**Processor:** CardConnect/Fiserv → TSYS

**SDK:** FiservTTP (iOS Swift, Android Kotlin)

**Requirements:** iPhone XS+ (iOS 16.7+), NFC-enabled Android (10+)

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Metric | Target |
|--------|--------|
| Cold start | < 3 seconds |
| Module load | < 500ms |
| Search response | < 300ms |
| Checkout (local) | < 1 second |
| Sync batch | < 5 seconds |

### 10.2 Reliability

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Data integrity | 100% |
| Transaction success | 99.5%+ |
| Sync success (with retry) | 99%+ |

### 10.3 Security

- Authentication: JWT + biometric option
- Encryption: All data in transit and at rest
- PCI DSS: Level 1 compliance
- Audit trail: 100% action logging

### 10.4 Accessibility

- WCAG 2.1 AA compliance
- VoiceOver support
- High contrast mode
- Large text support

### 10.5 Localization

- Languages: English (primary), Spanish, Vietnamese, Chinese (planned)
- Currency: USD (primary), configurable
- Timezone: Auto-detected

---

## 11. Risks & Mitigations

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Offline sync conflicts | Medium | High | Timestamp-based resolution, user notification |
| Payment SDK integration issues | Medium | Critical | Fallback to manual entry, thorough testing |
| Device performance on older iPads | Low | Medium | Performance monitoring, minimum requirements |
| Real-time sync delays | Medium | Medium | Optimistic UI, retry logic |

### 11.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Staff resistance to change | Medium | High | Training, gradual rollout, feedback loops |
| Competitor feature parity | Medium | Medium | Focus on unique differentiators |
| Payment processor outages | Low | Critical | Cash fallback, offline queue |
| License compliance issues | Low | High | Legal review, clear terms |

### 11.3 Open Questions

1. Should client SMS on pending be opt-in or opt-out?
2. How should pending queue work across multi-location salons?
3. VIP detection: Auto from loyalty tier or manual flag?

---

## 12. Success Metrics

### 12.1 Adoption Metrics

| Metric | 6-Month Target |
|--------|----------------|
| Active salons | 500+ |
| Devices per salon | 2-3 average |
| Feature usage (Front Desk/Checkout) | 80%+ |
| Staff adoption | 70%+ |

### 12.2 Performance Metrics

| Metric | Target |
|--------|--------|
| Average checkout time | < 2 minutes |
| Offline success rate | 95%+ |
| Sync success rate | 99%+ |
| Crash-free sessions | 99.5%+ |

### 12.3 Business Impact

| Metric | Target |
|--------|--------|
| Revenue increase per salon | 10%+ |
| Checkout time reduction | 30%+ |
| NPS score | > 50 |
| Staff satisfaction | > 4/5 |

---

## 13. Implementation Plan

### 13.1 Development Phases

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Phase 1: MVP** | Months 1-3 | Book, Front Desk, Checkout, Transactions, basic offline |
| **Phase 2: Enhancement** | Months 4-5 | Auto turn queue, multi-staff, split payments, analytics |
| **Phase 3: Polish** | Month 6 | Performance, UX, testing, documentation |
| **Phase 4: Launch** | Month 7 | GA, marketing, support |

### 13.2 Rollout Plan

| Week | Activity |
|------|----------|
| 1-2 | Soft launch (5 pilot salons) |
| 3-4 | Expanded beta (50 salons) |
| 5-6 | General availability |
| 7-8 | Optimization based on data |

### 13.3 Training & Support

- Video tutorials (5-10 min per module)
- Interactive guided tours
- 24/7 chat support
- Knowledge base and FAQs

---

## Appendix

### A. Related Documents

| Document | Purpose |
|----------|---------|
| [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md) | Complete technical architecture |
| [PAYMENT_INTEGRATION.md](../architecture/PAYMENT_INTEGRATION.md) | Fiserv TTP integration guide |
| [DATA_STORAGE_STRATEGY.md](../architecture/DATA_STORAGE_STRATEGY.md) | Offline-first data patterns |
| [PRD-Offline-Mode.md](./PRD-Offline-Mode.md) | Offline-first architecture specifications |
| [FEATURE_GAP_ANALYSIS.md](./FEATURE_GAP_ANALYSIS.md) | Feature comparison analysis |

### B. Glossary

| Term | Definition |
|------|------------|
| **Salon Mode** | Device logged in as salon account with full permissions |
| **Staff Mode** | Individual staff login with personal access only (future) |
| **Turn Queue** | System for fair walk-in distribution among staff |
| **Ticket** | Service record from check-in through checkout |
| **Pending** | Status: services complete, awaiting payment |
| **Sync Queue** | Local operations waiting for backend sync |
| **Offline-First** | Architecture where all features work offline by default |

### C. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 27, 2025 | Initial comprehensive PRD |
| 2.0 | Dec 28, 2025 | Restructured as overview, extracted module PRDs |

---

*Document Version: 2.0 | Last Updated: December 28, 2025*
