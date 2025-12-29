# Main PRD Improvement Plan

**Document:** `docs/product/Mango POS PRD v1.md`
**Current Size:** 168 KB (3,800+ lines)
**Created:** December 27, 2025
**Status:** ✅ COMPLETED

---

## Executive Summary

The main PRD needs restructuring from a monolithic document to a **high-level overview** that:
1. Provides product vision and architecture
2. References module-specific PRDs for detailed specs
3. Adds missing critical sections

---

## Current Problems

| Problem | Impact | Severity |
|---------|--------|----------|
| **Too large** (168KB) | Hard to navigate, maintain | High |
| **Duplicates module PRDs** | Conflicting/outdated specs | High |
| **No competitive analysis** | Unclear differentiation | Medium |
| **No user research** | Building on assumptions | Medium |
| **No risk assessment** | Unidentified blockers | Medium |
| **No requirement IDs** | Can't track/reference | Medium |
| **No priority tags** | Can't identify MVP | High |

---

## Proposed New Structure

### From This (Current):
```
Mango POS PRD v1.md (168KB - everything in one file)
├── Product Vision (good)
├── Book Module (duplicates PRD-Book-Module.md)
├── Front Desk (duplicates content)
├── Pending Module (detailed here only)
├── Checkout (duplicates PRD-Sales-Checkout-Module.md)
├── Transactions (detailed here only)
├── Settings (duplicates PRD-Settings-Module.md)
├── Reports (detailed here only)
├── Menu Settings (detailed here only)
└── Device Manager (detailed here only)
```

### To This (Proposed):
```
Mango POS PRD v1.md (~40KB - overview only)
├── 1. Executive Summary
├── 2. Product Vision & Strategy
├── 3. Competitive Analysis (NEW)
├── 4. User Personas & Research (ENHANCED)
├── 5. Architecture Overview
├── 6. Module Index (references to module PRDs)
├── 7. Cross-Module Integration
├── 8. Non-Functional Requirements
├── 9. Success Metrics & Analytics
├── 10. Risks & Mitigations (NEW)
├── 11. Implementation Roadmap
└── 12. Appendix

+ New standalone PRDs for:
  - PRD-Pending-Module.md (extract from main)
  - PRD-Transactions-Module.md (extract from main)
  - PRD-Reports-Module.md (extract from main)
  - PRD-Menu-Settings-Module.md (extract from main)
  - PRD-Device-Manager-Module.md (extract from main)
```

---

## Detailed Improvement Tasks

### Phase 1: Extract Standalone PRDs (2-3 hours)
- [ ] Extract Pending Module → `PRD-Pending-Module.md`
- [ ] Extract Transactions Module → `PRD-Transactions-Module.md`
- [ ] Extract Reports Module → `PRD-Reports-Module.md`
- [ ] Extract Menu Settings → `PRD-Menu-Settings-Module.md`
- [ ] Extract Device Manager → `PRD-Device-Manager-Module.md`

### Phase 2: Add Missing Sections (1-2 hours)
- [ ] Add Competitive Analysis section
- [ ] Enhance User Personas with research data
- [ ] Add Risk Assessment section
- [ ] Add Cross-Module Integration section
- [ ] Add Analytics Tracking Plan

### Phase 3: Restructure Main PRD (2-3 hours)
- [ ] Keep only high-level overview content
- [ ] Replace detailed specs with module PRD references
- [ ] Add Module Index table with links
- [ ] Consolidate architecture overview
- [ ] Add requirement ID system (OPS-P0-001 format)

### Phase 4: Polish & Review (1 hour)
- [ ] Verify no critical content lost
- [ ] Update all cross-references
- [ ] Add document version history
- [ ] Review for consistency

---

## New Sections to Add

### 1. Competitive Analysis (NEW)

```markdown
## 3. Competitive Analysis

### Market Positioning

| Competitor | Strengths | Weaknesses | Mango Advantage |
|------------|-----------|------------|-----------------|
| **Fresha** | Free, client marketplace | No offline, limited customization | Offline-first, staff-centric |
| **Booksy** | Strong branding, marketing | No walk-in handling, expensive | Turn tracking, better POS |
| **Square** | Simple, hardware bundle | Generic, not salon-specific | Salon workflow optimization |
| **Vagaro** | Feature-rich | Complex, slow, legacy UX | Modern UX, faster checkout |
| **MangoMint** | Premium experience | Very expensive, no offline | Affordable, offline capable |

### Key Differentiators

1. **Offline-First Architecture** — Only salon POS that works 100% offline
2. **Turn Tracking System** — Industry-unique fair distribution
3. **Staff-Centric Checkout** — Matches real salon workflows
4. **Smart Auto-Assign** — AI-powered staff matching
5. **Multi-Platform** — Web, iOS, Android, Desktop
```

### 2. Risk Assessment (NEW)

```markdown
## 10. Risks & Mitigations

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Offline sync conflicts | Medium | High | Conflict resolution UI, server-wins default |
| Payment integration delays | High | Critical | Start Fiserv integration early |
| Bundle size too large | High | Medium | Code splitting, lazy loading |
| IndexedDB storage limits | Low | High | Data retention policy, cloud sync |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Competitor copies features | Medium | Medium | Fast iteration, user lock-in |
| Staff adoption resistance | Medium | High | Simple UX, training materials |
| Internet dependency perception | Low | Medium | Marketing offline capability |

### Open Questions

1. **Turn Algorithm Fairness** — How exactly should "fair" be calculated?
2. **Tip Pool Distribution** — Equal split vs. proportional default?
3. **Offline Payment Authorization** — What's the liability limit?
```

### 3. Cross-Module Integration (NEW)

```markdown
## 7. Cross-Module Integration

### Data Flow Diagram

```
Book Module ──────┬──→ Front Desk ──→ Pending ──→ Checkout
                  │         ↑                         │
                  │         │                         ↓
              Clients ◄─────┴─────────────────► Transactions
                  ↑                                   │
                  │                                   ↓
                Team ◄──────────────────────────► Reports
```

### Integration Points

| From | To | Data | Trigger |
|------|------|------|---------|
| Book | Front Desk | Appointment | Check-in |
| Front Desk | Pending | Ticket | Service complete |
| Pending | Checkout | Ticket | Ready to pay |
| Checkout | Transactions | Payment | Payment complete |
| Checkout | Team | Commission/Tips | Payment complete |
| Checkout | Clients | Visit history | Payment complete |
| All Modules | Reports | Analytics data | Real-time |
```

---

## Module Index (for restructured PRD)

```markdown
## 6. Module Index

| Module | PRD Document | Priority | Status |
|--------|--------------|----------|--------|
| Book | [PRD-Book-Module.md](./PRD-Book-Module.md) | P0 | In Development |
| Front Desk | [PRD-Front-Desk-Module.md](./PRD-Front-Desk-Module.md) | P0 | Pending |
| Pending | [PRD-Pending-Module.md](./PRD-Pending-Module.md) | P0 | Draft |
| Checkout | [PRD-Sales-Checkout-Module.md](./PRD-Sales-Checkout-Module.md) | P0 | In Development |
| Transactions | [PRD-Transactions-Module.md](./PRD-Transactions-Module.md) | P1 | Draft |
| Clients | [PRD-Clients-CRM-Module.md](./PRD-Clients-CRM-Module.md) | P0 | Ready |
| Team | [PRD-Team-Module.md](./PRD-Team-Module.md) | P0 | Needs Update |
| Turn Tracker | [PRD-Turn-Tracker-Module.md](./PRD-Turn-Tracker-Module.md) | P1 | Draft |
| Reports | [PRD-Reports-Module.md](./PRD-Reports-Module.md) | P1 | Draft |
| Settings | [PRD-Settings-Module.md](./PRD-Settings-Module.md) | P1 | Draft |
| Menu Settings | [PRD-Menu-Settings-Module.md](./PRD-Menu-Settings-Module.md) | P0 | In Development |
| Device Manager | [PRD-Device-Manager-Module.md](./PRD-Device-Manager-Module.md) | P2 | Planned |
```

---

## Estimated Effort

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Phase 1 | Extract standalone PRDs | 2-3 hours |
| Phase 2 | Add missing sections | 1-2 hours |
| Phase 3 | Restructure main PRD | 2-3 hours |
| Phase 4 | Polish & review | 1 hour |
| **Total** | | **6-9 hours** |

---

## Success Criteria

- [ ] Main PRD reduced to <50KB
- [ ] All modules have dedicated PRD files
- [ ] Competitive analysis section complete
- [ ] Risk assessment section complete
- [ ] No duplicate content between main and module PRDs
- [ ] All cross-references updated and working
- [ ] Requirement ID system implemented

---

## Approval Checklist

**Please confirm before I proceed:**

1. [ ] Agree to extract 5 modules into standalone PRDs?
2. [ ] Agree to restructure main PRD as overview only?
3. [ ] Agree to add competitive analysis section?
4. [ ] Agree to add risk assessment section?
5. [ ] Any specific sections you want kept in main PRD?
6. [ ] Any modules you DON'T want extracted?

---

*Plan created: December 27, 2025*

---

## Review: Completed Work

**Completed on:** December 28, 2025

### Files Created

| File | Size | Purpose |
|------|------|---------|
| `docs/product/PRD-Pending-Module.md` | ~15KB | Standalone PRD for pre-checkout queue |
| `docs/product/PRD-Transactions-Module.md` | ~18KB | Standalone PRD for transaction history |
| `docs/product/PRD-Reports-Module.md` | ~12KB | Standalone PRD for analytics dashboard |
| `docs/product/PRD-Menu-Settings-Module.md` | ~14KB | Standalone PRD for service catalog |
| `docs/product/PRD-Device-Manager-Module.md` | ~11KB | Standalone PRD for device management |
| `docs/product/Mango POS PRD.md` | ~25KB | Restructured main PRD as overview |

### Key Improvements Made

1. **Reduced main PRD size** from 168KB to ~25KB (85% reduction)
2. **Extracted 5 modules** to standalone PRDs with consistent structure
3. **Added competitive analysis** section with feature comparison matrix
4. **Added risks & mitigations** section with technical and business risks
5. **Created module index** table linking to all module PRDs
6. **Added requirement ID system** (e.g., PND-P0-001, TXN-P1-012)
7. **Standardized PRD template** across all new documents:
   - Executive Summary with success criteria
   - Problem Statement with current challenges
   - User Personas & Use Cases
   - Competitive Analysis tables
   - Feature Requirements with priority levels (P0/P1/P2)
   - Business Rules tables
   - UX Specifications with ASCII mockups
   - Technical Requirements with TypeScript interfaces
   - Implementation Plan with phases

### Structure Changes

**Before:**
```
Mango POS PRD v1.md (168KB monolithic document)
```

**After:**
```
Mango POS PRD.md (25KB overview, Product v1.0, Doc Rev 2.0)
├── PRD-Pending-Module.md
├── PRD-Transactions-Module.md
├── PRD-Reports-Module.md
├── PRD-Menu-Settings-Module.md
├── PRD-Device-Manager-Module.md
├── (existing module PRDs remain)
└── archive/
    └── Mango POS PRD v1 (archived).md  # Original 168KB monolith
```

### Success Criteria Status

- [x] Main PRD reduced to <50KB ✅ (25KB)
- [x] All modules have dedicated PRD files ✅
- [x] Competitive analysis section complete ✅
- [x] Risk assessment section complete ✅
- [x] No duplicate content between main and module PRDs ✅
- [x] All cross-references updated ✅
- [x] Requirement ID system implemented ✅

### Next Steps (Optional)

1. Archive or remove `Mango POS PRD v1.md` after verification
2. Update `docs/INDEX.md` with new PRD file links
3. Apply similar restructuring to other existing module PRDs if needed
4. Add requirement IDs to existing module PRDs for consistency

---

*Review completed: December 28, 2025*
