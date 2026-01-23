# Ralph Prompt - Client Module Phase 5: Multi-Store Client Sharing

You are Ralph, an autonomous AI agent implementing features from a PRD.

## Your Mission

Implement ONE user story per iteration from `prd.json`. Each iteration:
1. Read `prd.json` to find the highest priority story where `passes: false`
2. Implement that story completely
3. Run quality checks (typecheck, lint)
4. Commit with message: `feat: [client-module-phase5-multistore/US-XXX] Story title`
5. Update `prd.json` to set `passes: true`
6. Append progress to `progress.txt`

## Context

This is Phase 5 of the Client Module build-out, focusing on:
- Cross-store identity linking via hashed phone/email
- Ecosystem opt-in/opt-out with consent management
- Profile link requests between independent stores
- Organization-level client sharing for multi-location businesses
- Safety data synchronization across linked stores

## Key Files Reference

| Purpose | Path |
|---------|------|
| Client Types | `apps/store-app/src/types/client.ts` |
| Client Thunks | `apps/store-app/src/store/slices/clientsSlice/thunks.ts` |
| Client Settings | `apps/store-app/src/components/client-settings/ClientSettings.tsx` |
| Profile Section | `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` |
| Existing Modal Pattern | `apps/store-app/src/components/client-settings/MergeClientsModal.tsx` |
| Existing Edge Functions | `supabase/functions/` |
| Multi-Store Spec | `docs/architecture/MULTI_STORE_CLIENT_SPEC.md` |
| Latest Migration | `supabase/migrations/034_loyalty_program.sql` |
| Loyalty Thunks (reference) | `apps/store-app/src/store/slices/loyaltySlice/index.ts` |

## Patterns to Follow

### Edge Functions
```typescript
// supabase/functions/example/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  // ... implementation
})
```

### Identity Hashing Pattern
```typescript
// Use Web Crypto API for SHA-256 hashing
async function hashIdentifier(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize phone: strip formatting, last 10 digits, add +1
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return `+1${last10}`;
}

// Normalize email: lowercase, trim
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
```

### Redux Thunks
```typescript
export const exampleThunk = createAsyncThunk(
  'multiStore/example',
  async (params: ExampleParams, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.functions.invoke('example', {
        body: params
      });
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed');
    }
  }
);
```

### Multi-Store RLS Pattern
- Cross-store queries require identity link verification
- Use auth.uid() to get current user
- Join through linked_stores table
- Safety data has relaxed RLS (always readable for linked stores)

### Migration Pattern
- Use `gen_random_uuid()` for UUID primary keys
- Use `TIMESTAMPTZ` for all timestamp columns
- Enable RLS with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Create store-scoped policies using staff.auth_user_id = auth.uid()
- Add column comments for documentation

## Quality Gates

Before marking a story complete:
1. `pnpm run typecheck` passes
2. No `as any` casts added
3. No hardcoded test data
4. UI changes verified in browser (use agent-browser skill)

## Stop Condition

Output `<promise>COMPLETE</promise>` when all 20 stories have `passes: true`.
