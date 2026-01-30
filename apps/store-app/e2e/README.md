
## Test Architecture Notes

### E2E Test Business Logic (US-P6F)

**Decision: Keep business logic tests in E2E** (Documented 2026-01-22)

The E2E tests in `catalog-checkout-flow.spec.ts` include some business logic assertions:
- Price calculations with variants and add-ons
- Staff duration overrides
- Commission calculations

**Rationale for keeping these in E2E:**

1. **No Integration Test Layer**: We've decided not to implement integration tests (see `/components/checkout/__tests__/README.md`)
2. **Critical Path Coverage**: These assertions verify the MOST critical business logic - payment amounts must be correct
3. **End-to-End Confidence**: Testing calculations in the actual UI flow catches integration bugs that unit tests miss
4. **Acceptable Trade-off**: Slower feedback (E2E) vs no coverage (if we removed these assertions)

**If E2E tests become too slow:**
- Consider moving business logic assertions to integration tests
- Keep E2E focused on: navigation, element visibility, error states, happy path
- Move to integration: price calculations, complex state updates, data transformations

**Current Status:** 21 E2E tests, ~2-3 seconds per test = acceptable CI time
