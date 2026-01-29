# Mango POS - High-Performance Tool Adoption Plan (v2 - Validated)

> **Philosophy:** Use tools, don't build. Every hour saved on infrastructure = an hour gained on product.
>
> **This version:** Validated against actual codebase on January 2026. All LOC counts verified.

---

## Executive Summary

| Phase | Timeline | Focus | ROI |
|-------|----------|-------|-----|
| Phase 1 | Week 1-2 | AI Development Tools | 10x faster code reviews, debugging |
| Phase 2 | Week 3-4 | Online Payments (Stripe) | Enable real online prepayments |
| Phase 3 | Month 2 | AI SDK Standardization | Consistent AI patterns, new features |
| Phase 4 | Month 3 | Optional Enhancements | Clerk evaluation, additional tooling |

---

## Codebase Reality Check

### Auth Architecture (KEEP AS-IS)

The store-app has a sophisticated **offline-first auth system** that CANNOT be replaced:

| Component | File | LOC | Purpose |
|-----------|------|-----|---------|
| `memberAuthService.ts` | store-app/src/services/ | 1,557 | bcrypt PIN validation, 7-day offline grace, SecureStorage |
| `storeAuthManager.ts` | store-app/src/services/ | 1,172 | Two-tier auth (store + member), device management |
| `authService.ts` | store-app/src/services/supabase/ | ~900 | 7-day store grace, 24-hour member grace, session caching |

**Key offline-first features that third-party auth (Clerk) cannot replace:**
- 7-day offline grace period for store sessions
- 24-hour grace period for member sessions
- bcrypt PIN validation with local SecureStorage
- Session caching in localStorage for offline access
- Background session validation when online

**Verdict:** store-app auth is **correctly architected** for offline-first POS. Do not replace.

### online-store Auth (EVALUATE FOR CLERK)

| Component | File | LOC | Can Replace? |
|-----------|------|-----|--------------|
| `AuthContext.tsx` | online-store/src/contexts/ | 462 | ✅ Potentially |
| `authService.ts` | online-store/src/services/auth/ | 442 | ✅ Potentially |

**Total online-store auth:** ~904 LOC (not 2000+ as originally claimed)

**Clerk tradeoffs for online-store:**
- ✅ Pre-built UI, magic link, OAuth
- ✅ Always-online app (no offline requirement)
- ⚠️ Need to maintain `client_auth` sync via webhook
- ⚠️ Adds vendor dependency
- ⚠️ Migration effort ~1 week

**Verdict:** Clerk is **optional** for online-store. Current Supabase Auth works. Evaluate in Phase 4.

### Payment Architecture (VALIDATED)

**store-app (In-Store POS):**
```
paymentBridge.ts → MockPaymentProvider (dev) → FiservTTPProvider (future iOS/Android)
```
- `paymentBridge.ts`: Platform-agnostic abstraction ✅
- `mockPaymentProvider.ts`: Development/testing ✅
- Future: FiservTTPProvider for Tap to Pay (hardware)
- Future: USB card reader for Electron/desktop

**This is correct architecture.** Fiserv TTP is required for hardware payments.

**online-store (Online Bookings):**
- Current: `PaymentForm.tsx` collects card details but **does not process real payments**
- Current: `MockPaymentForm.tsx` for booking deposits (mock only)
- Gap: **No real payment processing for online prepayments/deposits**

**Stripe fills THIS specific gap:** Real payment processing for online booking deposits.

### Notification Architecture (VALIDATED)

**Existing abstraction in `docs/architecture/NOTIFICATION_ABSTRACTION.md`:**
```typescript
NotificationProvider interface
├── DirectProvider (Twilio + SendGrid) - CURRENT
└── MangoAIProvider (future)
```

**Key capabilities already designed:**
- Provider pattern for swapping implementations
- SMS templates, email templates
- Bulk campaign support with BullMQ queue
- Template rendering with variables

**packages/notifications does NOT exist yet** - it's documented but not implemented.

**What Composio/Novu would add vs. DirectProvider:**
- Composio: Pre-built OAuth for Gmail/Slack (if you want those channels beyond Twilio/SendGrid)
- Novu: Dashboard for non-developer template editing, delivery tracking UI, user preferences

**Verdict:** Implement `DirectProvider` first (as designed). Evaluate Novu only if non-developer template editing is needed.

### AI SDK (VALIDATED)

**Current state in online-store:**
- `@ai-sdk/google` in package.json ✅
- `src/lib/api/local/chat.ts`: Full chat implementation using Lovable AI gateway
- Function calling with tools: `search_services`, `get_availability`, `navigate_to`
- Rate limiting, grounding/RAG, fallback responses

**What "standardization" means:**
1. Replace raw fetch to Lovable gateway with Vercel AI SDK patterns (`streamText`, `generateObject`)
2. Add `@ai-sdk/anthropic` for model flexibility
3. Use Zod schemas with `generateObject` for typed AI outputs

---

## Phase 1: AI Development Acceleration (Week 1-2)

### 1.1 Grail - AI Code Review (Day 1)

**What it does:** Automatically reviews every PR for bugs, security issues, performance problems.

**Setup:**
```bash
# 1. Go to https://grail.dev
# 2. Connect GitHub repo: Mango-POS-Offline-V2
# 3. Enable auto-review on PRs
```

**Cost:** ~$20/month
**Time saved:** 30-60 min per PR

---

### 1.2 Cursor Rules File (Day 1)

Create `.cursorrules` at project root:

```markdown
# Mango POS Cursor Rules

## Architecture
- Monorepo with Turbo: apps/store-app, apps/online-store, apps/mango-pad, apps/check-in
- Shared packages: @mango/ui, @mango/mqtt, @mango/types, @mango/supabase

## Always
- Use TypeScript strict mode
- Use existing components from @mango/ui before creating new ones
- Use dataService for all data operations, never call Supabase directly from components
- Use Redux Toolkit for state management in store-app
- Use buildTopic() helper for MQTT topics
- Follow existing patterns in each app

## Auth Patterns
- store-app: Uses memberAuthService + storeAuthManager (offline-first, DO NOT MODIFY)
- online-store: Uses customerAuthService with Supabase Auth

## Data Patterns
- snake_case in database, camelCase in TypeScript
- Use type adapters to convert between formats

## Never
- Add inline styles (use Tailwind + design tokens)
- Create custom REST endpoints (use Supabase Edge Functions)
- Skip TypeScript types
- Use `any` type
- Call Supabase directly from React components

## Testing
- Run `pnpm exec tsc --noEmit` before committing
- Write tests for new business logic
- Use vitest for unit tests, playwright for E2E
```

---

### 1.3 Multi-Model Strategy (Day 2)

| Task | Best Model | Why |
|------|------------|-----|
| Complex architecture | Claude Opus 4 | Deep reasoning |
| Bug fixing | **o3-mini** or **Claude Sonnet 4** | Fast, accurate pattern matching |
| General coding | Claude Sonnet 4 | Speed + quality balance |
| Documentation | GPT-4.1 | Good prose |

**Note:** Codex was deprecated by OpenAI in March 2023. Use o3-mini for bug fixing.

**OpenRouter setup:**
```bash
# Get API key from https://openrouter.ai
export OPENROUTER_API_KEY="sk-or-..."
```

---

### 1.4 Ghostty Terminal (Day 2)

```bash
# Install
brew install ghostty

# Config (~/.config/ghostty/config)
font-family = "JetBrains Mono"
font-size = 14
theme = "catppuccin-mocha"
cursor-style = "block"
shell-integration = "zsh"
```

---

## Phase 2: Stripe for Online Prepayments (Week 3-4)

### The Actual Gap

| Payment Type | Current | What's Needed |
|--------------|---------|---------------|
| In-store card (iOS/Android) | MockPaymentProvider → FiservTTPProvider (future) | Nothing - correct architecture |
| In-store card (Electron) | MockPaymentProvider → USB reader (future) | Nothing - correct architecture |
| **Online booking deposit** | MockPaymentForm (no real processing) | **Stripe** |
| **Online gift card purchase** | Not implemented | **Stripe** |

### Implementation

```bash
cd apps/online-store
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

**Backend (Supabase Edge Function):**
```typescript
// supabase/functions/create-payment-intent/index.ts
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { amount, currency = 'usd', metadata } = await req.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses cents
    currency,
    metadata,
  });
  
  return new Response(JSON.stringify({ 
    clientSecret: paymentIntent.client_secret 
  }));
});
```

**Frontend (Replace MockPaymentForm):**
```tsx
// apps/online-store/src/components/booking/StripePaymentForm.tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export function StripePaymentForm({ amount, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={!stripe}>
        Pay ${amount.toFixed(2)} Deposit
      </Button>
    </form>
  );
}
```

**Cost:** 2.9% + $0.30 per transaction
**Code replaced:** `MockPaymentForm.tsx` (~150 LOC) → `StripePaymentForm.tsx` (~80 LOC)

---

## Phase 3: AI SDK Standardization (Month 2)

### Current State

`apps/online-store/src/lib/api/local/chat.ts`:
- Uses Lovable AI gateway with raw fetch
- Has function calling (tools)
- Has grounding/RAG
- Has rate limiting

### Migration to Vercel AI SDK Patterns

```typescript
// apps/online-store/src/lib/ai/booking-assistant.ts
import { streamText, generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Replace raw fetch with Vercel AI SDK
export async function streamBookingAssistant(messages: Message[]) {
  return streamText({
    model: google('gemini-2.0-flash'),
    system: BOOKING_ASSISTANT_PROMPT,
    messages,
    tools: {
      searchServices: {
        description: 'Search for salon services',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          // existing mangoClient.getServices() logic
        },
      },
      getAvailability: {
        description: 'Check available times',
        parameters: z.object({ 
          serviceId: z.string(),
          date: z.string().optional(),
        }),
        execute: async ({ serviceId, date }) => {
          // existing mangoClient.getAvailability() logic
        },
      },
    },
  });
}

// NEW: Typed service recommendations
export async function getServiceRecommendations(clientHistory: string, request: string) {
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      recommendations: z.array(z.object({
        serviceId: z.string(),
        serviceName: z.string(),
        reason: z.string(),
        confidence: z.number().min(0).max(1),
      })),
    }),
    prompt: `Based on client history: ${clientHistory}
             And request: "${request}"
             Recommend relevant services.`,
  });
  
  return object.recommendations;
}
```

**Benefits:**
- Typed outputs with Zod schemas
- Built-in streaming
- Tool calling with automatic execution
- Model-agnostic (switch providers easily)

---

## Phase 4: Optional Enhancements (Month 3)

### 4.1 Clerk Evaluation (online-store only)

**Only consider if:**
- You want pre-built sign-in/sign-up UI components
- You want social login (Google, Apple) without building OAuth flows
- Current Supabase Auth is causing development friction

**Migration approach (if approved):**
1. Keep `client_auth` table for POS client linking
2. Clerk webhook creates `client_auth` record on sign-up
3. Replace `AuthContext.tsx` with ClerkProvider
4. Update protected routes to use Clerk hooks

**Effort:** ~1 week
**Code change:** ~900 LOC replaced, ~200 LOC new

### 4.2 Notification Implementation

**Implement the existing design in `NOTIFICATION_ABSTRACTION.md`:**

```bash
mkdir -p packages/notifications/src/{providers,templates}
```

**Start with DirectProvider (Twilio + SendGrid):**
```typescript
// packages/notifications/src/providers/DirectProvider.ts
// Implement as designed in docs/architecture/NOTIFICATION_ABSTRACTION.md
```

**Only add Novu if:**
- Non-developers need to edit templates without code deploys
- You need delivery tracking dashboard
- You need user notification preferences UI

### 4.3 Daytona for AI Agent Testing

```bash
brew install daytonaio/tap/daytona
daytona create https://github.com/your-org/Mango-POS-Offline-V2
```

Use for running AI-generated code in sandboxed environments before applying to main codebase.

---

## Updated Tool Stack Summary

| Category | Tool | Status | Monthly Cost |
|----------|------|--------|--------------|
| **Code Review** | Grail | ✅ Implement Phase 1 | $20 |
| **Terminal** | Ghostty | ✅ Implement Phase 1 | Free |
| **Multi-Model** | OpenRouter | ✅ Implement Phase 1 | $20-50 |
| **Online Payments** | Stripe | ✅ Implement Phase 2 | 2.9% + $0.30/tx |
| **AI Features** | Vercel AI SDK | ✅ Implement Phase 3 | Model costs |
| **Customer Auth** | Clerk | ⚠️ Evaluate Phase 4 | Free-$50 |
| **Notifications** | DirectProvider first | ⚠️ Implement existing design | Twilio/SendGrid costs |
| **AI Sandboxes** | Daytona | ⚠️ Optional Phase 4 | Free tier |

**Total new monthly cost:** ~$50-150
**Development time saved:** 20-30 hours/month

---

## What NOT to Change (Validated)

| Component | Files | Why Keep |
|-----------|-------|----------|
| **store-app Auth** | memberAuthService.ts, storeAuthManager.ts, authSlice.ts | 2,700+ LOC of offline-first auth with 7-day grace, bcrypt PIN, SecureStorage. Cannot be replaced by cloud-only auth. |
| **Payment Bridge** | paymentBridge.ts, mockPaymentProvider.ts | Correct abstraction for multi-platform (iOS/Android/Electron). Fiserv TTP required for hardware. |
| **MQTT** | @mango/mqtt package | Correct for device sync (POS ↔ iPad). Real-time pub/sub with QoS levels. |
| **Supabase** | Database + Edge Functions | Works well. No reason to migrate to Convex for existing system. |
| **Redux Toolkit** | store/slices/* | Mature, tested, handles offline state well. |
| **Dexie/SQLite** | IndexedDB + better-sqlite3 | Required for offline-first POS. |

---

## Implementation Checklist (Revised)

### Week 1-2: AI Dev Tools
- [ ] Sign up for Grail, connect repo
- [ ] Create `.cursorrules` file (copy from above)
- [ ] Install Ghostty, configure
- [ ] Set up OpenRouter account for multi-model

### Week 3-4: Stripe Integration
- [ ] Create Stripe account, get test keys
- [ ] Create `supabase/functions/create-payment-intent`
- [ ] Create `StripePaymentForm.tsx` component
- [ ] Integrate into booking confirmation flow
- [ ] Test end-to-end with Stripe test cards
- [ ] Switch to production keys after testing

### Month 2: AI SDK
- [ ] Refactor `chat.ts` to use Vercel AI SDK patterns
- [ ] Add `@ai-sdk/anthropic` for model flexibility
- [ ] Implement `getServiceRecommendations()` with `generateObject`
- [ ] Add streaming to booking assistant UI

### Month 3: Evaluate & Enhance
- [ ] Evaluate Clerk for online-store (decision checkpoint)
- [ ] Implement DirectProvider for notifications (as designed)
- [ ] Set up Daytona for agent testing (optional)

---

## Validation Checkpoints

| Phase | Validation |
|-------|------------|
| Phase 1 | Grail catches a real bug on a PR |
| Phase 2 | Customer can pay real deposit for online booking |
| Phase 3 | AI recommends services using `generateObject` with typed output |
| Phase 4 | Decision made on Clerk (adopt or keep Supabase Auth) |

---

*Created: January 2026*
*Validated: January 2026 (v2)*
*Review: Monthly*
