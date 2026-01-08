# Security Audit Report

**Date:** January 8, 2026
**Scope:** `/apps/store-app/src`
**Overall Risk Rating:** HIGH

---

## Executive Summary

The Mango POS Store App contains several critical and high-risk security vulnerabilities that require immediate attention before production deployment:

1. Weak encryption/obfuscation of sensitive data (base64 is NOT encryption)
2. Hardcoded demo passwords in authentication service
3. PIN storage in plaintext in the database
4. Potential SQL injection via unsanitized user input
5. Excessive console logging exposing sensitive information
6. XSS vulnerabilities through `dangerouslySetInnerHTML`
7. Session data stored in unencrypted localStorage

---

## Critical Vulnerabilities

### 1. [CRITICAL] Fake Encryption - Base64 Obfuscation

**File:** `src/services/secureStorage.ts:24-40`

**Issue:** The `secureStorage` service uses base64 encoding with `btoa()`/`atob()` claiming to "encrypt" license keys and store IDs. Base64 is NOT encryption - it's trivially reversible.

**Impact:** Any attacker with access to IndexedDB can decode license keys and store IDs instantly.

**Vulnerable Code:**
```typescript
function encrypt(data: string): string {
  try {
    return btoa(encodeURIComponent(data)); // NOT ENCRYPTION!
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Returns plaintext on failure!
  }
}
```

**Remediation:**
- [ ] Use Web Crypto API with proper AES-GCM encryption
- [ ] Or store sensitive data server-side only

```typescript
// FIXED: Use Web Crypto API
async function encrypt(data: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
}
```

---

### 2. [CRITICAL] Hardcoded Demo Passwords Bypass Authentication

**File:** `src/services/supabase/authService.ts:869`

**Issue:** The `verifyPassword()` function contains hardcoded bypass passwords `'demo123'` and `'password'` that authenticate any user.

**Impact:** Complete authentication bypass in production if bcrypt hash is detected.

**Vulnerable Code:**
```typescript
return password === 'demo123' || password === 'password';
```

**Remediation:**
- [ ] Remove hardcoded passwords immediately
- [ ] Implement proper bcrypt verification via Supabase Edge Function

```typescript
// FIXED: Remove demo passwords, use proper verification
async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  // Call Supabase Edge Function for bcrypt verification
  const { data, error } = await supabase.functions.invoke('verify-password', {
    body: { hash: storedHash, password }
  });
  if (error) throw error;
  return data.valid;
}
```

---

### 3. [CRITICAL] PIN Stored in Plaintext in Database

**File:** `src/services/supabase/authService.ts:407`

**Issue:** Member PINs are queried directly via `.eq('pin', pin)` indicating plaintext storage.

**Impact:** Database breach exposes all staff PINs; PINs can be brute-forced via API.

**Vulnerable Code:**
```typescript
const { data: members, error } = await supabase
  .from('members')
  .select('*')
  .eq('pin', pin) // Plaintext PIN comparison!
```

**Remediation:**
- [ ] Hash PINs with bcrypt before storage
- [ ] Implement rate limiting on PIN verification attempts
- [ ] Add account lockout after N failed attempts

---

## High Risk Issues

### 4. [HIGH] SQL Injection via Unsanitized Search Queries

**Files:**
- `src/services/supabase/tables/clientsTable.ts:46`
- `src/services/supabase/pagination.ts:327`

**Issue:** User-provided search queries are directly interpolated into Supabase `.or()` filters.

**Vulnerable Code:**
```typescript
.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
```

**Remediation:**
- [ ] Sanitize/escape special characters in search queries
- [ ] Use parameterized queries

```typescript
// FIXED: Sanitize search input
function sanitizeSearchQuery(query: string): string {
  return query.replace(/[%_\\'"()]/g, '');
}

const safeQuery = sanitizeSearchQuery(query);
.or(`first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%`)
```

---

### 5. [HIGH] XSS via dangerouslySetInnerHTML

**File:** `src/components/forms/FormCompletionPortal.tsx:186-194`

**Issue:** User-provided form content rendered via `dangerouslySetInnerHTML` with insufficient sanitization.

**Remediation:**
- [ ] Install DOMPurify: `npm install dompurify @types/dompurify`
- [ ] Sanitize all HTML before rendering

```typescript
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(processedContent, {
  ALLOWED_TAGS: ['h2', 'h3', 'p', 'ul', 'li', 'strong', 'em'],
  ALLOWED_ATTR: ['class']
});

<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

---

### 6. [HIGH] Session Data in Unencrypted localStorage

**File:** `src/services/supabase/authService.ts:78-80`

**Issue:** Store and member sessions stored as plaintext JSON in localStorage.

**Remediation:**
- [ ] Use HttpOnly cookies for session storage
- [ ] Or encrypt localStorage data with Web Crypto API

---

### 7. [HIGH] No Rate Limiting on Authentication

**File:** `src/services/supabase/authService.ts`

**Issue:** Rate limiter exists but not applied to authentication functions.

**Remediation:**
- [ ] Apply rate limiting to `loginStoreWithCredentials`
- [ ] Apply rate limiting to `loginMemberWithPin`
- [ ] Apply rate limiting to `verifyMemberPin`

---

## Medium Risk Issues

### 8. [MEDIUM] Excessive Console Logging

**Files:** 164 files with 995 console.log/warn/error occurrences

**Remediation:**
- [ ] Add `vite-plugin-remove-console` for production builds
- [ ] Create structured logging utility

---

### 9. [MEDIUM] 7-Day Session Grace Period Too Long

**File:** `src/services/supabase/authService.ts:74`

**Remediation:**
- [ ] Reduce grace period from 7 days to 24 hours
- [ ] Implement session revocation mechanism

---

## OWASP Top 10 Mapping

| OWASP Category | Status | Action Required |
|----------------|--------|-----------------|
| A01: Broken Access Control | HIGH | Add IDOR checks |
| A02: Cryptographic Failures | CRITICAL | Replace base64, hash PINs |
| A03: Injection | HIGH | Sanitize search inputs, add DOMPurify |
| A04: Insecure Design | MEDIUM | Reduce session grace period |
| A05: Security Misconfiguration | MEDIUM | Remove demo passwords |
| A06: Vulnerable Components | UNKNOWN | Run dependency audit |
| A07: Authentication Failures | CRITICAL | Fix all auth issues |
| A08: Data Integrity Failures | MEDIUM | Add CSRF protection |
| A09: Logging Failures | LOW | Implement structured logging |
| A10: SSRF | LOW | N/A |

---

## Action Checklist

### Immediate (Before Production)
- [ ] Remove hardcoded demo passwords (`authService.ts:869`)
- [ ] Hash PINs with bcrypt (database migration required)
- [ ] Replace base64 with Web Crypto API (`secureStorage.ts`)
- [ ] Sanitize search inputs (`clientsTable.ts`, `pagination.ts`)
- [ ] Add DOMPurify (`FormCompletionPortal.tsx`)

### Short-term (1-2 weeks)
- [ ] Implement rate limiting on all auth endpoints
- [ ] Reduce session grace period to 24 hours
- [ ] Move sensitive session data to HttpOnly cookies
- [ ] Remove unnecessary console.log statements

### Long-term (1-3 months)
- [ ] Server-side bcrypt verification via Edge Functions
- [ ] Add CSRF protection tokens
- [ ] Set up security logging infrastructure
- [ ] Implement security headers (CSP, HSTS)
- [ ] Penetration testing before launch

---

## Compliance Notes

### PCI-DSS (if processing payments)
- Payment card data should NEVER be stored locally
- Current base64 "encryption" does not meet PCI requirements

### GDPR/Privacy
- Client PII stored in IndexedDB needs data retention policies
- Export/deletion capabilities required
