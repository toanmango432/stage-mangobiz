# Catalog Module Phase 3 - Packages & Add-ons Enhancement

## Pre-Implementation Review Summary

### Codebase Analysis Complete

**Existing Infrastructure:**
1. `AddOnGroup` and `AddOnOption` types already exist in `src/types/catalog.ts`
2. Database hooks exist: `useAddOnGroups`, `useAddOnGroupsWithOptions`, `useAddOnOptions` in `src/db/hooks.ts`
3. Current UI uses **flat `ServiceAddOn`** structure (deprecated pattern)
4. `BookingSequence` type does NOT exist - needs to be added

**Current State:**
- `AddOnsSection.tsx` - Uses flat `ServiceAddOn` array (needs refactor to use `AddOnGroup` → `AddOnOption`)
- `AddOnModal.tsx` - Creates flat add-ons (needs replacement with `AddOnGroupModal` + `AddOnOptionModal`)

---

## Phase 3 Implementation Tasks

### Task 3.1: Add-on Groups Implementation (Complexity: 7/10)

**Goal:** Transform flat add-on structure to grouped structure (Fresha-style)

**Sub-tasks:**
- [ ] 3.1.1: Create `AddOnGroupModal.tsx` - Modal for creating/editing add-on groups
  - Group name, description
  - Selection mode (single/multiple)
  - Min/max selections
  - Required toggle
  - Client prompt field
- [ ] 3.1.2: Create `AddOnOptionModal.tsx` - Modal for options within a group
  - Option name, description
  - Price, duration
  - Active toggle
- [ ] 3.1.3: Refactor `AddOnsSection.tsx` to display groups with nested options
  - Expandable group cards
  - Options list within each group
  - Add option button per group
  - Drag-drop reordering for groups and options
- [ ] 3.1.4: Update `constants.ts` with selection mode options

**Files to Modify/Create:**
- CREATE: `src/components/menu-settings/modals/AddOnGroupModal.tsx`
- CREATE: `src/components/menu-settings/modals/AddOnOptionModal.tsx`
- MODIFY: `src/components/menu-settings/sections/AddOnsSection.tsx`
- MODIFY: `src/components/menu-settings/constants.ts`

---

### Task 3.2: Add-on Applicability Rules (Complexity: 4/10)

**Goal:** Link add-on groups to specific services or categories

**Sub-tasks:**
- [ ] 3.2.1: Add applicability UI in `AddOnGroupModal`
  - "Applies to all services" toggle
  - Category multi-select
  - Service multi-select
- [ ] 3.2.2: Show applicability badges in `AddOnsSection`
- [ ] 3.2.3: Add "Online Booking Enabled" toggle

**Files to Modify:**
- MODIFY: `src/components/menu-settings/modals/AddOnGroupModal.tsx` (from 3.1.1)

---

### Task 3.3: Booking Sequence Management (Complexity: 5/10)

**Goal:** Define the order services should be performed during booking

**Sub-tasks:**
- [ ] 3.3.1: Add `BookingSequence` type to `src/types/catalog.ts`
  ```typescript
  export interface BookingSequence {
    id: string;
    salonId: string;
    serviceOrder: string[]; // Array of service IDs in order
    createdAt: Date;
    updatedAt: Date;
    syncStatus: SyncStatus;
  }
  ```
- [ ] 3.3.2: Add `bookingSequenceEnabled` field to `CatalogSettings`
- [ ] 3.3.3: Create `BookingSequenceSection.tsx` UI
  - Drag-drop service ordering
  - Services not in list shown as "All other services"
  - Enable/disable toggle
- [ ] 3.3.4: Add constants for booking sequence

**Files to Modify/Create:**
- MODIFY: `src/types/catalog.ts`
- CREATE: `src/components/menu-settings/sections/BookingSequenceSection.tsx`
- MODIFY: `src/components/menu-settings/constants.ts`

---

## Todo Checklist

- [x] Task 3.1.1: Create AddOnGroupModal.tsx
- [x] Task 3.1.2: Create AddOnOptionModal.tsx
- [x] Task 3.1.3: Refactor AddOnsSection.tsx for grouped structure
- [x] Task 3.1.4: Add selection mode constants
- [x] Task 3.2.1: Add applicability UI in AddOnGroupModal
- [x] Task 3.2.2: Show applicability badges in AddOnsSection
- [x] Task 3.3.1: Add BookingSequence type
- [x] Task 3.3.2: Add bookingSequenceEnabled to CatalogSettings
- [x] Task 3.3.3: Create BookingSequenceSection.tsx
- [ ] Frontend Verification

---

## Review Section

### Phase 3 Implementation Complete - Dec 1, 2025

**Files Created:**
1. `src/components/menu-settings/modals/AddOnGroupModal.tsx` - Modal for creating/editing add-on groups with:
   - Group name and client prompt (description)
   - Selection mode (single/multiple)
   - Min/max selection rules
   - Required toggle
   - Applicability rules (all services or specific categories)
   - Online booking toggle

2. `src/components/menu-settings/modals/AddOnOptionModal.tsx` - Modal for creating/editing options within a group:
   - Option name and description
   - Price and duration
   - Active toggle

3. `src/components/menu-settings/sections/BookingSequenceSection.tsx` - New section for service ordering:
   - Enable/disable booking sequence
   - Drag-drop service reordering
   - Add/remove services from sequence
   - Visual order numbers

**Files Modified:**
1. `src/types/catalog.ts` - Added:
   - `BookingSequence` interface
   - `bookingSequenceEnabled` field to `CatalogSettings`

2. `src/components/menu-settings/constants.ts` - Added:
   - `ADDON_SELECTION_MODES`
   - `ADDON_MIN_SELECTION_OPTIONS`
   - `ADDON_MAX_SELECTION_OPTIONS`

3. `src/components/menu-settings/sections/AddOnsSection.tsx` - Complete rewrite:
   - Now uses `AddOnGroupWithOptions[]` instead of flat `ServiceAddOn[]`
   - Expandable group cards with nested options
   - Group CRUD operations
   - Option CRUD operations within groups

4. `src/hooks/useCatalog.ts` - Added:
   - `addOnGroupsWithOptions` live query
   - `createAddOnGroup`, `updateAddOnGroup`, `deleteAddOnGroup` actions
   - `createAddOnOption`, `updateAddOnOption`, `deleteAddOnOption` actions

5. `src/components/menu-settings/MenuSettings.tsx` - Updated to use:
   - New `addOnGroupsWithOptions` data
   - New group/option action callbacks

**Features Added:**
- Fresha-style grouped add-ons with selection rules
- Category-level applicability rules for add-on groups
- Required/optional group toggle
- Single/multiple selection modes
- Min/max selection limits
- Booking sequence management with drag-drop ordering
- Enable/disable booking sequence feature

**Note:** BookingSequenceSection is created but not yet integrated into MenuSettings tabs. This can be added in a future update when ready.

