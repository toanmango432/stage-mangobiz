# Client Module Deployment Checklist

**Branch:** ralph/client-module-phase2
**Last Updated:** 2026-01-23

---

## ✅ Pre-Deployment Verification

### Code Quality
- [ ] All TypeScript errors fixed: `pnpm run typecheck`
  - Expected: 0 errors
- [ ] All tests passing: `pnpm test --run`
  - Expected: 3363/3363 passing
- [ ] Linting clean: `pnpm run lint`
  - Expected: 0 errors
- [ ] Build successful: `pnpm run build`
  - Expected: Clean build output

### Git Status
- [ ] All fixes committed
- [ ] Git working directory clean: `git status`
- [ ] Branch pushed to remote: `git push origin ralph/client-module-phase2`
- [ ] Pull request created (if applicable)

---

## 🗄️ Database Migrations

### Backup First
```bash
# Create backup before running migrations
pg_dump -h your-db-host -U postgres -d your-db > backup_pre_client_module_$(date +%Y%m%d).sql
```

### Phase 5 Migration 037: Mango Identities (Tier 1 - Ecosystem)
- [ ] Review migration: `cat supabase/migrations/037_mango_identities.sql`
- [ ] Run migration:
  ```bash
  psql -h your-db-host -U postgres -d your-db -f supabase/migrations/037_mango_identities.sql
  ```
- [ ] Verify tables created:
  ```sql
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename LIKE 'mango_%' OR tablename LIKE '%link%';
  ```
  - Expected: `mango_identities`, `linked_stores`, `profile_link_requests`, `ecosystem_consent_log`

- [ ] Verify RLS enabled:
  ```sql
  SELECT tablename, policyname FROM pg_policies
  WHERE tablename IN ('mango_identities', 'linked_stores', 'profile_link_requests', 'ecosystem_consent_log');
  ```

- [ ] Verify indexes:
  ```sql
  \di mango_*
  \di *link*
  ```

- [ ] Verify column added to clients:
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'clients' AND column_name = 'mango_identity_id';
  ```

### Phase 5 Migration 038: Organization Sharing (Tier 2)
- [ ] Review migration: `cat supabase/migrations/038_org_client_sharing.sql`
- [ ] Run migration:
  ```bash
  psql -h your-db-host -U postgres -d your-db -f supabase/migrations/038_org_client_sharing.sql
  ```

- [ ] Verify organizations table:
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'organizations';
  ```
  - Expected: `client_sharing_settings` JSONB column

- [ ] Verify cross_location_visits table:
  ```sql
  \d cross_location_visits
  ```

- [ ] Verify new client columns:
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'clients'
  AND column_name IN ('home_location_id', 'organization_id', 'organization_visible');
  ```

- [ ] Verify function exists:
  ```sql
  \df can_access_org_client
  ```

### Rollback Scripts (Prepare Before Deploy)

Create rollback scripts:

**File:** `rollback_037_mango_identities.sql`
```sql
-- Rollback 037_mango_identities.sql
ALTER TABLE clients DROP COLUMN IF EXISTS mango_identity_id;
DROP TABLE IF EXISTS ecosystem_consent_log CASCADE;
DROP TABLE IF EXISTS profile_link_requests CASCADE;
DROP TABLE IF EXISTS linked_stores CASCADE;
DROP TABLE IF EXISTS mango_identities CASCADE;
DROP FUNCTION IF EXISTS update_mango_identity_updated_at() CASCADE;
```

**File:** `rollback_038_org_client_sharing.sql`
```sql
-- Rollback 038_org_client_sharing.sql
ALTER TABLE clients DROP COLUMN IF EXISTS organization_visible;
ALTER TABLE clients DROP COLUMN IF EXISTS organization_id;
ALTER TABLE clients DROP COLUMN IF EXISTS home_location_id;
ALTER TABLE stores DROP COLUMN IF EXISTS organization_id;
DROP TABLE IF EXISTS cross_location_visits CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP FUNCTION IF EXISTS can_access_org_client(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_organization_updated_at() CASCADE;
```

---

## 🚀 Edge Functions Deployment

### Prerequisites
- [ ] Supabase CLI installed: `supabase --version`
- [ ] Logged in: `supabase login`
- [ ] Project linked: `supabase link --project-ref your-project-ref`

### Deploy Functions

#### 1. identity-lookup
```bash
supabase functions deploy identity-lookup
```
- [ ] Deployment successful
- [ ] Test endpoint:
  ```bash
  curl -X POST https://your-project.supabase.co/functions/v1/identity-lookup \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"hashedPhone": "test_hash"}'
  ```
- [ ] Expected: `{"exists": false, "canRequest": false}`

#### 2. identity-request-link
```bash
supabase functions deploy identity-request-link
```
- [ ] Deployment successful
- [ ] Test with invalid identity:
  ```bash
  curl -X POST https://your-project.supabase.co/functions/v1/identity-request-link \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "requestingStoreId": "test-store-id",
      "requestingStoreName": "Test Store",
      "mangoIdentityId": "invalid-id"
    }'
  ```
- [ ] Expected: `{"error": "Identity not found"}`

#### 3. identity-approve-link
```bash
supabase functions deploy identity-approve-link
```
- [ ] Deployment successful

#### 4. identity-sync-safety
```bash
supabase functions deploy identity-sync-safety
```
- [ ] Deployment successful

### Verify All Functions
```bash
supabase functions list
```
- [ ] All 4 functions listed with status "deployed"

---

## 🔑 Environment Variables

### Development (.env)
- [ ] `VITE_ECOSYSTEM_SALT` - Set to a secure random value
  ```bash
  openssl rand -hex 32
  ```
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `APPROVAL_BASE_URL` - Base URL for approval links (e.g., `https://yourdomain.com`)

### Production (.env.production)
- [ ] All variables set with production values
- [ ] `VITE_ECOSYSTEM_SALT` - Different from development!
- [ ] Verify no hardcoded credentials in code
- [ ] Check `src/services/supabase/client.ts` for hardcoded fallbacks

### Edge Function Environment
- [ ] `SUPABASE_URL` - Auto-provided by Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase
- [ ] `APPROVAL_BASE_URL` - Set via dashboard or CLI:
  ```bash
  supabase secrets set APPROVAL_BASE_URL=https://yourdomain.com
  ```

---

## 🧪 Testing on Staging

### Phase 1: Client Merge & Blocks
- [ ] Merge duplicate client profiles
- [ ] Add client to block list
- [ ] Verify blocked client cannot book

### Phase 2: GDPR Compliance
- [ ] Request data export for a client
- [ ] Verify export includes all data
- [ ] Request data deletion
- [ ] Verify data deletion completes
- [ ] Check consent logs

### Phase 3: Forms & Segments
- [ ] Create custom intake form
- [ ] Fill out form for new client
- [ ] View form data in client profile
- [ ] Create client segment
- [ ] Export segment to CSV

### Phase 4: Loyalty Program
- [ ] Create loyalty program
- [ ] Configure rewards
- [ ] Client earns points on visit
- [ ] Client redeems reward
- [ ] Send review request after appointment
- [ ] Track referral code

### Phase 5: Multi-Store Client Sharing

#### Tier 1: Ecosystem (Cross-Brand)
- [ ] Client opts into Mango ecosystem
- [ ] Create profile at Store A
- [ ] Create profile at Store B (different brand)
- [ ] Store B searches for client (ecosystem lookup)
- [ ] Store B requests profile link
- [ ] Client approves link request
- [ ] Verify Store B sees client's safety data (allergies, blocks)
- [ ] Verify Store B sees linked store indicator

#### Tier 2: Organization (Same Brand Multi-Location)
- [ ] Create organization with 2 locations
- [ ] Set sharing mode to "Full"
- [ ] Create client at Location 1
- [ ] Verify client visible at Location 2
- [ ] Client books appointment at Location 2
- [ ] Verify cross-location visit logged
- [ ] Set sharing mode to "Isolated"
- [ ] Verify client NOT visible at Location 2 (except safety data)
- [ ] Verify loyalty points scope (location vs org-wide)

---

## 📊 Monitoring & Validation

### Database Health
```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('mango_identities', 'linked_stores', 'profile_link_requests',
                  'ecosystem_consent_log', 'organizations', 'cross_location_visits')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for orphaned records
SELECT COUNT(*) as orphaned_clients
FROM clients
WHERE mango_identity_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM mango_identities WHERE id = clients.mango_identity_id
);

-- Check RLS is active
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('mango_identities', 'linked_stores', 'profile_link_requests');
```

### Edge Function Logs
```bash
# View recent logs
supabase functions logs identity-lookup --tail 50
supabase functions logs identity-request-link --tail 50
supabase functions logs identity-approve-link --tail 50
supabase functions logs identity-sync-safety --tail 50
```

### Application Logs
- [ ] Check browser console for errors
- [ ] Verify no PII in console logs
- [ ] Check network tab for failed API calls
- [ ] Verify Redux DevTools shows correct state updates

---

## 🔄 Rollback Plan

### If Issues Discovered Post-Deploy

#### Database Rollback
```bash
# Stop the application first
# Run rollback scripts
psql -h your-db-host -U postgres -d your-db -f rollback_038_org_client_sharing.sql
psql -h your-db-host -U postgres -d your-db -f rollback_037_mango_identities.sql

# Restore from backup if needed
psql -h your-db-host -U postgres -d your-db < backup_pre_client_module_YYYYMMDD.sql
```

#### Edge Function Rollback
```bash
# Undeploy functions (or deploy previous version)
# Note: No built-in rollback, must redeploy previous code
```

#### Application Rollback
```bash
# Revert git commits
git revert HEAD~5..HEAD  # Revert last 5 commits (adjust as needed)
git push origin ralph/client-module-phase2 --force

# Or checkout previous version
git checkout <previous-commit-sha>
```

---

## ✅ Post-Deployment

### Immediate (Within 1 Hour)
- [ ] Monitor error logs for 30 minutes
- [ ] Check database performance metrics
- [ ] Verify no spike in 500 errors
- [ ] Test critical user flows

### Short Term (Within 24 Hours)
- [ ] Review all error logs
- [ ] Check for unusual patterns in data
- [ ] Gather user feedback
- [ ] Monitor performance metrics

### Medium Term (Within 1 Week)
- [ ] Analyze usage of new features
- [ ] Collect metrics on ecosystem adoption
- [ ] Review edge function costs
- [ ] Plan optimizations if needed

---

## 📝 Documentation

- [ ] Update CHANGELOG.md with new features
- [ ] Document new database tables in schema docs
- [ ] Add multi-store feature guide for users
- [ ] Update API documentation for Edge Functions
- [ ] Create troubleshooting guide for common issues

---

## 🆘 Emergency Contacts

**Database Issues:**
- Primary: [DBA Name/Contact]
- Backup: [Engineering Lead]

**Edge Function Issues:**
- Primary: [Backend Engineer]
- Supabase Support: support@supabase.io

**Application Issues:**
- Primary: [Frontend Lead]
- Secondary: [Full Stack Engineer]

---

## Sign-off

**Pre-Deployment Checklist Completed By:** _______________
**Date:** _______________
**Signature:** _______________

**Deployment Executed By:** _______________
**Date:** _______________
**Signature:** _______________

**Post-Deployment Validation By:** _______________
**Date:** _______________
**Signature:** _______________

---

**Deployment Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back
