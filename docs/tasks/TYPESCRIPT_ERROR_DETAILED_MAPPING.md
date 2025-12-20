# Detailed TypeScript Error Mapping

Generated: December 2, 2025

---

## Error Code Reference & Solutions

### TS2322: Type Mismatch (249 errors) - PRIMARY FOCUS

**What it means:** A value of one type is being assigned to a variable expecting a different type.

**Common patterns in this project:**
1. `string` assigned to `Date` field
2. Component props not matching interface
3. Wrong object type passed to function

**Examples from codebase:**
```typescript
// Example 1: String vs Date (most common)
src/db/seed.ts(816,5): error TS2322: Type 'string' is not assignable to type 'Date'.
// ROOT: createdAt: new Date().toISOString() creates string, but interface expects Date

// Example 2: Wrong component prop type
src/components/StaffManagement/StaffManagementPage.tsx(74,13): 
error TS2322: Type '"primary"' is not assignable to type '"default" | "secondary" | "ghost" | "outline" | "destructive"'.
// ROOT: Button variant "primary" doesn't exist in component definition

// Example 3: Wrong object type
src/components/StaffCard.tsx(2106,131): 
error TS2322: Type '{ size: number; color: string; strokeWidth: number; ... }' is not assignable to type 'IntrinsicAttributes & { color?: string; size?: number; ... }'.
// ROOT: Passing extra prop 'strokeWidth' not in component interface
```

**Fix approach:**
- For Date/string: Convert strings to Date objects: `new Date('2025-12-02T10:00:00Z')`
- For component props: Check component definition and use only allowed values
- For object types: Remove extra properties or update interface

**Most affected files:**
- `src/db/seed.ts` (86 errors)
- `src/data/mockSalesData.ts` (61 errors)
- `src/testing/fixtures.ts` (45 errors)
- `src/testing/factories.ts` (33 errors)
- `src/components/StaffManagement/StaffManagementPage.tsx` (9 errors)
- `src/components/StaffCard.tsx` (4 errors)

---

### TS6133: Unused Variables (145 errors) - LOW PRIORITY, QUICK WIN

**What it means:** A variable is declared but never used in the code.

**Common patterns:**
1. Unused imports from previous refactoring
2. Unused handler functions
3. Unused local variables

**Examples:**
```typescript
// Example 1: Unused handler
src/components/checkout/TicketPanel.tsx(1631,9):
error TS6133: 'handleApplyCoupon' is declared but its value is never read.

// Example 2: Unused variable
src/components/checkout/ReceiptPreview.tsx(88,9):
error TS6133: 'giftCardTotal' is declared but its value is never read.

// Example 3: Unused import
src/components/Book/WeekView.tsx(7,1):
error TS6192: All imports in import declaration are unused.
```

**Fix approach:**
- Remove the unused variable
- Remove the unused import
- Or use it: `_unused = true` (if you really need it)

**Most affected files:**
- `src/components/checkout/TicketPanel.tsx` (16 unused variables)
- Various components with unused imports

---

### TS2739: Missing Object Properties (26 errors) - HIGH PRIORITY

**What it means:** An object literal is missing required properties defined in the interface.

**Root cause:** `TicketService` type was updated to require new fields, but mock data wasn't updated.

**TicketService interface expects:**
```typescript
interface TicketService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  status: string;              // REQUIRED - MISSING IN MOCK DATA
  statusHistory: [];           // REQUIRED - MISSING IN MOCK DATA
  totalPausedDuration: number; // REQUIRED - MISSING IN MOCK DATA
  // ... other fields
}
```

**Examples from codebase:**
```typescript
src/data/mockSalesData.ts(78,7):
error TS2739: Type '{ serviceId: string; serviceName: string; staffId: string; ... }' 
is missing the following properties from type 'TicketService': status, statusHistory, totalPausedDuration

// All 26 errors are variations of this - TicketService objects missing the same 3 fields
```

**Fix approach:**
Add the three missing properties to every TicketService mock object:
```typescript
const service = {
  serviceId: 'svc-001',
  serviceName: 'Haircut',
  staffId: 'staff-001',
  status: 'in-progress',           // ADD THIS
  statusHistory: [],               // ADD THIS
  totalPausedDuration: 0,          // ADD THIS
  // ... other fields
}
```

**Most affected files:**
- `src/data/mockSalesData.ts` (26 errors across all TicketService objects)

---

### TS2339: Property Doesn't Exist (22 errors) - MEDIUM PRIORITY

**What it means:** Code tries to access a property that doesn't exist on the type.

**Root cause:** Type definitions missing properties that code expects.

**Examples:**
```typescript
// Example 1: Client type missing properties
src/components/Book/NewAppointmentModal.tsx(357,29):
error TS2339: Property 'lastVisit' does not exist on type 'Client'.

src/components/Book/NewAppointmentModal.tsx(902,66):
error TS2339: Property 'loyaltyTier' does not exist on type 'Client'.

// Example 2: Ticket type missing properties
src/components/TicketDetailsModal.tsx(136,35):
error TS2339: Property 'duration' does not exist on type 'UITicket | PendingTicket'.
```

**Fix approach:**
- Add missing properties to type definitions in `src/types/`
- Or use optional chaining: `client?.lastVisit`
- Or use type assertion (not recommended): `(client as any).lastVisit`

**Properties missing from Client type:**
- `lastVisit` (Date of last appointment)
- `loyaltyTier` (VIP/Regular status)
- `totalSpent` (lifetime value)

**Most affected files:**
- `src/components/Book/NewAppointmentModal.tsx`
- `src/components/TicketDetailsModal.tsx`

---

### TS2353: Invalid Object Properties (12 errors) - HIGH PRIORITY

**What it means:** Object literal has properties that don't exist in the interface.

**Root cause:** Mock data has incorrect property names.

**Examples:**
```typescript
src/components/Book/NewAppointmentModal.tsx(473,11):
error TS2353: Object literal may only specify known properties, 
and 'id' does not exist in type 'AppointmentService'.
// AppointmentService uses 'serviceId', not 'id'

src/components/Book/NewAppointmentModal.tsx(359,11):
error TS2353: Object literal may only specify known properties, 
and 'totalSpent' does not exist in type 'Client'.
// Client doesn't have 'totalSpent' property (or it's named differently)
```

**Fix approach:**
- Check type definition for correct property names
- Use correct property name in object: `{ serviceId: '...' }` instead of `{ id: '...' }`
- Remove invalid properties

---

### TS2551: Property/Method Doesn't Exist (12 errors) - MEDIUM PRIORITY

**What it means:** Code tries to call a method that doesn't exist on the type.

**Root cause:** Usually Date type confusion in tests.

**Examples:**
```typescript
src/utils/__tests__/smartAutoAssign.test.ts(266,32):
error TS2551: Property 'toISOString' does not exist on type 'number'. 
Did you mean 'toString'?
// A number is being passed where a Date is expected, breaking .toISOString() call
```

**Fix approach:**
- Ensure correct type is used: create Date objects, not strings or numbers
- Example: `new Date('2025-12-02T10:00:00Z')` instead of `'2025-12-02T10:00:00Z'`

**Most affected files:**
- `src/utils/__tests__/smartAutoAssign.test.ts` (multiple instances)

---

### TS6196: Unused Imports (8 errors) - LOW PRIORITY

**What it means:** An import statement brings in something that's never used.

**Examples:**
```typescript
src/components/Book/NewAppointmentModal.v2.tsx(58,11):
error TS6196: 'Staff' is declared but never used.
```

**Fix approach:**
- Remove the unused import
- Example: Remove `import { Staff } from '...'` if Staff is never referenced

---

### TS6192: Unused Import Declaration (8 errors) - LOW PRIORITY

**What it means:** Entire import statement is unused.

**Examples:**
```typescript
src/components/Book/WeekView.tsx(7,1):
error TS6192: All imports in import declaration are unused.
```

**Fix approach:**
- Remove the entire import line

---

### TS2552: Cannot Find Name (7 errors) - MEDIUM PRIORITY

**What it means:** Code references a variable that doesn't exist.

**Root cause:** Typo in variable name or undefined variable.

**Examples:**
```typescript
src/components/Book/skeletons/CalendarSkeleton.tsx(131,34):
error TS2552: Cannot find name 'cellIndex'. Did you mean '_cellIndex'?
// Variable name typo

src/components/Book/NewAppointmentModal.v2.tsx(956,23):
error TS2552: Cannot find name 'setActiveStaffName'. Did you mean 'activeStaffName'?
// Wrong variable name, likely from incomplete refactor
```

**Fix approach:**
- Use correct variable name or define the missing variable
- Check if variable is in scope
- Check if function/state setter is properly initialized

---

### TS2345: Wrong Argument Type (7 errors) - MEDIUM PRIORITY

**What it means:** Function argument has wrong type.

**Root cause:** Usually Date/string confusion in tests.

**Examples:**
```typescript
src/utils/__tests__/smartAutoAssign.test.ts(752,9):
error TS2345: Argument of type 'string' is not assignable to parameter of type 'Date'.
```

**Fix approach:**
- Convert string to Date: `new Date(dateString)`
- Check function parameter type and pass correct type

---

### TS18048: Possibly Undefined (6 errors) - MEDIUM PRIORITY

**What it means:** Code uses value that could be undefined.

**Examples:**
```typescript
src/components/checkout/CheckoutScreen.tsx(140,31):
error TS18048: 'product.unitPrice' is possibly 'undefined'.
```

**Fix approach:**
- Use optional chaining: `product?.unitPrice`
- Add null check: `if (product.unitPrice) { ... }`
- Use nullish coalescing: `product.unitPrice ?? 0`

---

## Error-to-File Matrix

### By Root Cause

**Root Cause 1: Date/String Type (180+ errors)**
- `src/db/seed.ts` - 86 errors
- `src/data/mockSalesData.ts` - 61 errors
- `src/utils/__tests__/smartAutoAssign.test.ts` - 53 errors
- `src/testing/fixtures.ts` - 45 errors
- `src/testing/factories.ts` - 33 errors

**Root Cause 2: Missing TicketService Properties (26 errors)**
- `src/data/mockSalesData.ts` - 26 errors (same file, different issue)

**Root Cause 3: Component Props (40+ errors)**
- `src/components/StaffManagement/StaffManagementPage.tsx` - 9 errors
- `src/components/StaffCard.tsx` - 4 errors
- `src/components/StaffSidebar.tsx` - 9 errors
- `src/components/schedule/ScheduleView.tsx` - 4 errors

**Root Cause 4: Unused Code (145+ errors)**
- `src/components/checkout/TicketPanel.tsx` - 16 errors
- `src/components/checkout/ProductSales.tsx` - 1 error
- Various components - scattered 1-3 errors

**Root Cause 5: Missing Type Properties (22 errors)**
- `src/components/Book/NewAppointmentModal.tsx` - 6 errors
- `src/components/TicketDetailsModal.tsx` - 5 errors
- Various components - scattered 1-2 errors

---

## Fix Sequence

### Quick Wins (Low Effort, High Impact)
1. **TicketService Missing Properties** - Add 3 properties to all instances in mockSalesData.ts (30 min)
2. **Unused Variables** - Remove 145+ unused declarations (1-2 hours)
3. **Simple Missing Properties** - Add Client properties to type definition (30 min)

### Medium Effort, High Impact
1. **Date/String Conversion** - Convert all mock/test data to use Date objects (3-4 hours)
2. **Component Props** - Fix button variants and prop types (1-2 hours)

### Final Cleanup
1. **Remaining edge cases** - Fix last 20-30 errors (1 hour)

---

## Testing After Fixes

After completing each phase:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Run tests
npm test

# Build production
npm run build
```

