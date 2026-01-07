# Control Center Security Guide

## Overview

This document outlines security best practices for the Mango Control Center application.

## Environment Configuration

### Required Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Security Rules

1. **NEVER commit `.env` files** - Always use `.env.example` as a template
2. **Rotate credentials immediately** if accidentally exposed
3. **Use environment-specific files** - `.env.development`, `.env.production`

## Authentication

Control Center uses **Supabase Auth** for authentication:

1. **Admin users** are created in Supabase Auth dashboard
2. **Role-based access** is stored in JWT `user_metadata.role`
3. **Supported roles**: `super_admin`, `admin`, `support`

### Creating Admin Users

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" with email/password
3. After creation, update user metadata:
   ```json
   {
     "role": "admin",
     "name": "Admin Name"
   }
   ```

## Row Level Security (RLS)

**All tables have RLS enabled.** Policies check JWT metadata for admin role.

### Policy Structure

```sql
-- Helper function checks user role from JWT
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() -> 'user_metadata' ->> 'role' IN ('super_admin', 'admin', 'support');
END;
$$ LANGUAGE plpgsql;

-- Example policy
CREATE POLICY "Admins can manage tenants" ON tenants
  FOR ALL USING (is_admin());
```

### Tables with RLS

| Table | Policy |
|-------|--------|
| tenants | Admins only |
| licenses | Admins only |
| stores | Admins only |
| members | Admins only |
| devices | Admins only |
| admin_users | Super admins only |
| audit_logs | Admins read, system insert |
| feature_flags | Admins only |
| announcements | Admins only |
| surveys | Admins only |
| survey_responses | Admins read, anyone insert |

## Session Security

- Sessions are managed by Supabase Auth
- Tokens auto-refresh via `autoRefreshToken: true`
- Session persisted in localStorage (managed by Supabase)

## Password Security

**Production Requirements:**
- Use bcrypt or Argon2 for password hashing (NOT SHA-256)
- Enforce minimum password complexity
- Implement rate limiting on login attempts
- Add account lockout after failed attempts

## API Security

1. **All requests go through Supabase** - No custom backend
2. **RLS enforces data access** - Can't bypass via direct API calls
3. **Circuit breaker** protects against repeated failures

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Seed data | Use `supabase-seed-dev.sql` | Never use seed data |
| Error messages | Detailed | Generic |
| Config validation | Warning only | Throws error |

## Security Checklist

Before deploying to production:

- [ ] Rotate any exposed credentials
- [ ] Verify RLS is enabled on all tables
- [ ] Test RLS policies with non-admin users
- [ ] Remove development seed data
- [ ] Update password hashing to bcrypt
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Enable audit logging
- [ ] Review and test all policies

## Reporting Security Issues

If you discover a security vulnerability, please report it to:
- Email: security@mangobiz.com
- Do NOT create public issues for security vulnerabilities
