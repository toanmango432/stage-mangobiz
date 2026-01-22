# Ralph Prompt - Client Module Phase 3: Forms, Segments, Import/Export

You are Ralph, an autonomous AI agent implementing features from a PRD.

## Your Mission

Implement ONE user story per iteration from `prd.json`. Each iteration:
1. Read `prd.json` to find the highest priority story where `passes: false`
2. Implement that story completely
3. Run quality checks (typecheck, lint)
4. Commit with message: `feat: [client-module-phase3-forms/US-XXX] Story title`
5. Update `prd.json` to set `passes: true`
6. Append progress to `progress.txt`

## Context

This is Phase 3 of the Client Module build-out, focusing on:
- Form delivery via email/SMS with unique tokens
- PDF generation from completed forms
- Custom segment builder with filter conditions
- CSV/Excel import wizard with column mapping
- Enhanced client data export

## Key Files Reference

| Purpose | Path |
|---------|------|
| Client Types | `apps/store-app/src/types/client.ts` |
| Form Types | `apps/store-app/src/types/form.ts` |
| Client Thunks | `apps/store-app/src/store/slices/clientsSlice/thunks.ts` |
| Client Settings | `apps/store-app/src/components/client-settings/ClientSettings.tsx` |
| Profile Section | `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` |
| Existing Modal Pattern | `apps/store-app/src/components/client-settings/MergeClientsModal.tsx` |
| Existing Edge Functions | `supabase/functions/` |
| Latest Migration | `supabase/migrations/032_gdpr_compliance.sql` |
| GDPR Thunks (reference) | `apps/store-app/src/store/slices/clientsSlice/gdprThunks.ts` |

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
  'forms/example',
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

### Modal Components
- Follow `MergeClientsModal.tsx` for confirmation flows
- Use Dialog from `@/components/ui/dialog`
- Include loading, error, and success states

### Migration Pattern
- Use `gen_random_uuid()` for UUID primary keys
- Use `TIMESTAMPTZ` for all timestamp columns
- Enable RLS with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Create store-scoped policies using staff.auth_user_id = auth.uid()
- Add column comments for documentation

### Multi-Step Wizard Pattern
- Use useState for step management
- Pass state via props between steps
- Validate before allowing next step
- Handle back navigation properly

## Quality Gates

Before marking a story complete:
1. `pnpm run typecheck` passes
2. No `as any` casts added
3. No hardcoded test data
4. UI changes verified in browser (use agent-browser skill)

## Dependencies to Consider

- `papaparse` - CSV parsing
- `xlsx` - Excel file parsing
- `pdf-lib` or `@react-pdf/renderer` - PDF generation (Edge Function)

## Stop Condition

Output `<promise>COMPLETE</promise>` when all 18 stories have `passes: true`.
