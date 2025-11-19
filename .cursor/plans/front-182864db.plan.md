<!-- 182864db-b3b2-4a20-a0dc-7247bf134783 8b1c8d23-7d35-4ab3-b67d-920073a546c7 -->
# POS Terminal Integration

## Objective

Deliver card-present payment support (charge, split/tip, refunds) across PAX, Clover, and BBPOS devices using existing sandbox accounts and hardware.

## Implementation Steps

1. **Research & API Alignment**

- Review vendor docs for PAX, Clover, BBPOS card-present SDKs.
- Verify supported flows (sale, tip adjust, split, refund, void) and security requirements (TLS, key injection, certifications).

2. **Shared Abstraction Design**

- Draft a terminal-agnostic interface (init, connect, sale, auth, tip adjust, void/refund, disconnect).
- Define event model for status updates (device ready, signature needed, completed, errors).

3. **Backend Service Layer**

- Create a payments service module to orchestrate terminal commands, tokenization, and reconciliation.
- Implement audit logging & error handling; persist transaction metadata with terminal provider references.

4. **Frontend UX Updates**

- Build a unified POS payment modal/flow with steps for amount entry, split/tip options, terminal status, and receipt options.
- Handle edge cases (device offline, cancel, retry, manual fallback).

5. **Vendor-specific Adapters**

- Implement drivers for PAX, Clover, BBPOS using the shared interface.
- Support device discovery, pairing, encrypted transport, and transaction flows per vendor SDK.

6. **Testing & Certification**

- Create integration tests/smoke scripts per vendor.
- Run manual end-to-end tests with sandbox hardware for sale, split tip, refund, void.
- Document certification steps if required before production.

7. **Deployment Readiness**

- Add configuration management (API keys, device IDs) with secure storage.
- Provide rollback plan and operational runbooks for support teams.