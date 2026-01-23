# Ralph Prompt - Client Module Phase 4: Loyalty, Reviews, Referrals

You are Ralph, an autonomous AI agent implementing features from a PRD.

## Your Mission

Implement ONE user story per iteration from `prd.json`. Each iteration:
1. Read `prd.json` to find the highest priority story where `passes: false`
2. Implement that story completely
3. Run quality checks (typecheck, lint)
4. Commit with message: `feat: [client-module-phase4-loyalty/US-XXX] Story title`
5. Update `prd.json` to set `passes: true`
6. Append progress to `progress.txt`

## Context

This is Phase 4 of the Client Module build-out, focusing on:
- Configurable loyalty programs with tiers and rewards
- Automated review requests after appointments
- Referral program with tracking and rewards
- Points earning and redemption flows

## Key Files Reference

| Purpose | Path |
|---------|------|
| Client Types | `apps/store-app/src/types/client.ts` |
| Client Thunks | `apps/store-app/src/store/slices/clientsSlice/thunks.ts` |
| Client Settings | `apps/store-app/src/components/client-settings/ClientSettings.tsx` |
| Profile Section | `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` |
| Existing Modal Pattern | `apps/store-app/src/components/client-settings/MergeClientsModal.tsx` |
| Existing Edge Functions | `supabase/functions/` |
| Latest Migration | `supabase/migrations/033_form_delivery.sql` |
| Form Thunks (reference) | `apps/store-app/src/store/slices/clientsSlice/formDeliveryThunks.ts` |

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

### Redux Thunks
```typescript
export const exampleThunk = createAsyncThunk(
  'loyalty/example',
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

### Settings Component Pattern
- Use Tabs for organizing related settings
- Include loading states and error handling
- Save button with confirmation feedback
- Follow existing ClientSettings patterns

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

Output `<promise>COMPLETE</promise>` when all 16 stories have `passes: true`.
