# Mango POS Store App

The main Point-of-Sale application for salon and spa management. Supports web, iOS, Android, and desktop (Electron) platforms.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## Authentication

The Store App uses a hybrid authentication system:
- **Primary authentication**: Supabase Auth (email + password)
- **Quick unlock**: Local PIN validation (bcrypt)
- **Offline access**: Cached credentials with 14-day grace period

See [AUTH_MIGRATION_PLAN.md](/docs/AUTH_MIGRATION_PLAN.md) for implementation details.

---

## Security Considerations

> **Platform Security Summary**
>
> | Platform | PIN Hash Storage | Security Level | Recommended for Production |
> |----------|------------------|----------------|---------------------------|
> | iOS (Capacitor) | Keychain | **High** - Hardware-backed | ✅ Yes |
> | Android (Capacitor) | Android Keystore | **High** - Hardware-backed | ✅ Yes |
> | Desktop (Electron) | electron-store (future) | **Medium** - Encrypted file | ✅ Yes |
> | Web Browser | localStorage (base64) | **Low** - Obfuscation only | ⚠️ Development only |

### Web Platform Limitations

The web browser platform has inherent security limitations that make it unsuitable for production POS deployment:

#### 1. SecureStorage Uses Base64 Encoding (Not Encryption)

On web, `SecureStorage` falls back to base64-encoded localStorage. This provides basic obfuscation but is **not cryptographically secure**:

```typescript
// Web fallback in secureStorage.ts
const encoded = btoa(value);       // base64 encode
localStorage.setItem(key, encoded);
```

**Impact**: PIN hashes stored in localStorage can be:
- Read by any JavaScript running on the page
- Inspected via browser DevTools → Application → Local Storage
- Extracted if the device is compromised

**Mitigation (future)**: Implement Web Crypto API with device-derived encryption keys.

#### 2. Lockout State Can Be Cleared

PIN lockout and failed attempt counters are stored in localStorage:

```typescript
localStorage.setItem(`pin_lockout_${memberId}`, lockoutUntil.toISOString());
localStorage.setItem(`pin_attempts_${memberId}`, String(attempts));
```

**Impact**: An attacker with browser access can:
- Clear lockout timers via DevTools
- Reset failed attempt counters
- Bypass PIN rate limiting

**Mitigation**: Native platforms use secure storage APIs that resist tampering.

#### 3. Session Data Accessible via DevTools

Cached member sessions and auth tokens are stored in localStorage:
- `mango_member_cache` - Member profile data
- `member_auth_session` - Current session info
- `secure_pin_hash_*` - Base64-encoded PIN hashes

**Impact**: Anyone with physical access to the device can extract session data.

### Production Deployment Recommendations

1. **Use native platforms for production POS terminals**
   - iOS (iPad) with Capacitor for retail tablets
   - Android with Capacitor for POS devices
   - Electron for desktop stations

2. **Reserve web platform for**
   - Development and testing
   - Back-office administrative tasks (non-POS)
   - Demo environments

3. **Additional security measures for web (if unavoidable)**
   - Enforce HTTPS always
   - Implement Content Security Policy (CSP)
   - Set short session timeouts
   - Consider hardware security keys for admin access

### Related Files

- `src/utils/secureStorage.ts` - Platform-specific secure storage abstraction
- `src/services/memberAuthService.ts` - Authentication service with PIN handling
- `src/components/auth/` - Login and PIN UI components

---

## Project Structure

```
apps/store-app/
├── src/
│   ├── components/     # React components
│   │   ├── auth/       # Authentication UI
│   │   ├── Book/       # Appointment calendar
│   │   ├── frontdesk/  # Front desk operations
│   │   └── checkout/   # Payment processing
│   ├── services/       # Business logic
│   ├── store/          # Redux state management
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
├── e2e/                # End-to-end tests
└── public/             # Static assets
```

## Testing

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui
```

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - AI agent instructions
- [Technical Documentation](/docs/architecture/TECHNICAL_DOCUMENTATION.md)
- [Data Storage Strategy](/docs/architecture/DATA_STORAGE_STRATEGY.md)
- [Auth Migration Plan](/docs/AUTH_MIGRATION_PLAN.md)
