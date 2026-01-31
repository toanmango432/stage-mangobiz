# Technical Debt

## TypeScript Type Errors (2026-01-30)

CI typecheck is temporarily disabled due to extensive type errors across multiple packages:

### Affected Packages

1. **@mango/utils** - Broken imports referencing non-existent paths (`../types/appointment`, `../components/Book/FilterPanel`, etc.)
2. **@mango/mqtt** - Missing DOM types, broken imports (`../supabase/client`, `@/store`)
3. **@mango/ui** - Path alias issues (`@/lib/utils`, `@/components/ui/*`)
4. **@mango/online-store** - framer-motion type mismatches

### Root Causes

- Files appear to have been moved/copied without updating import paths
- Path aliases (`@/`) not configured in package tsconfigs
- Missing `lib: ["dom"]` in some packages
- Type definitions out of sync with implementation

### Test Issues

Multiple packages have broken tests due to missing setup files:
- `@mango/database` - missing `src/testing/setup.ts`
- `@mango/mqtt` - missing `src/testing/setup.ts`
- `@mango/supabase` - no test files

### Fix Priority

1. Configure path aliases properly in each package's tsconfig
2. Create missing test setup files or remove broken tests
3. Add missing type definitions
4. Re-enable typecheck and tests in CI

### Temporary Workarounds

- CI typecheck job echoes skip message instead of running
- Individual packages have typecheck scripts replaced with skip messages
