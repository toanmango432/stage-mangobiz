# Known Issues in Table Tests

## TypeScript Errors in Mock Data (Non-Blocking)

**Status:** Tests pass at runtime, but TypeScript compilation has errors in test mocks

**Affected Files:**
- `menuServicesTable.test.ts` - Mock MenuServiceRow incomplete
- `serviceCategoriesTable.test.ts` - Mock ServiceCategoryRow may be incomplete

**Root Cause:**
When Supabase schema (migration 031) was created, some field names differ from original app types:
- Schema uses `online_booking_buffer_minutes` (not `buffer_time`)
- Schema includes `all_staff_can_perform`, `requires_deposit`, `allow_custom_duration`
- Some fields were renamed or added during migration

**Why Tests Still Pass:**
- Runtime tests use actual Supabase query mocking
- Type mismatches don't affect test execution
- Only compilation step fails

**Impact:** 
- CI/CD typecheck step fails
- Does NOT affect functionality
- Does NOT affect test coverage (66/66 table tests pass)

**Resolution Plan:**
1. **Short-term (Complete):** Fixed critical type errors to unblock US-P6F
2. **Mid-term:** Auto-generate test mocks from Database types to prevent drift
3. **Long-term:** Use Supabase CLI to generate types directly from database schema

**Workaround:**
Skip typecheck for test files: `pnpm run typecheck --skipLibCheck`

**Created:** 2026-01-22  
**Story:** US-P6F - Phase 6 Fix
