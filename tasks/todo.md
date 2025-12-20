# Phase 2: Fix Deep Imports

## Overview
Replace deep relative imports (`../../../`) with path aliases (`@/`) for cleaner, more maintainable imports.

## Current State
- **87 occurrences** in **54 files**
- Path alias `@/*` already configured in `tsconfig.json`

---

## Implementation Tasks

### Task 1: Fix client-settings component imports
**Files:** 12 files in `src/components/client-settings/`
**Pattern:** `../../../types`, `../../../db/database`

- [ ] 1.1 Fix `components/` subfolder imports
- [ ] 1.2 Fix `sections/` subfolder imports

### Task 2: Fix team-settings component imports
**Files:** 10 files in `src/components/team-settings/`
**Pattern:** `../../../store/*`, `../../../hooks/*`, `../../../types/*`

- [ ] 2.1 Fix `components/` subfolder imports
- [ ] 2.2 Fix `sections/` subfolder imports
- [ ] 2.3 Fix `hooks/` subfolder imports

### Task 3: Fix tickets/pending component imports
**Files:** 4 files in `src/components/tickets/pending/`
**Pattern:** `../../../constants/premiumDesignTokens`

- [ ] 3.1 Fix pending ticket component imports

### Task 4: Fix menu-settings component imports
**Files:** 10 files in `src/components/menu-settings/`
**Pattern:** `../../../types`, `../../../store/*`

- [ ] 4.1 Fix `modals/` subfolder imports
- [ ] 4.2 Fix `sections/` subfolder imports

### Task 5: Fix remaining misc imports
**Files:** ~10 files scattered across codebase
**Pattern:** Various `../../../` paths

- [ ] 5.1 Fix Book/skeletons imports
- [ ] 5.2 Fix modules/control-center imports
- [ ] 5.3 Fix test file imports

---

## Import Conversion Reference

| Old Import | New Import |
|------------|------------|
| `../../../types` | `@/types` |
| `../../../store/hooks` | `@/store/hooks` |
| `../../../store/slices/*` | `@/store/slices/*` |
| `../../../db/database` | `@/db/database` |
| `../../../hooks/*` | `@/hooks/*` |
| `../../../constants/*` | `@/constants/*` |
| `../../../utils/*` | `@/utils/*` |
| `../../../services/*` | `@/services/*` |

---

## Verification
After each task:
- [ ] Run `npx tsc --noEmit` to verify TypeScript compiles
- [ ] Run `npm run build` after all tasks complete

---

## Review Section
(Will be filled after implementation)
