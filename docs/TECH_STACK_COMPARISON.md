# Mango POS Tech Stack Comparison & Improvement Proposal

> **Date:** January 23, 2026  
> **Version:** 1.0  
> **Status:** Draft for Review  
> **Reference:** Ras Mic's AI-Optimized Stack (January 2026)

---

## Executive Summary

This document compares Mango POS's current tech stack against a modern AI-optimized stack used by developer Ras Mic for rapid AI-assisted development. The goal is to identify actionable improvements while preserving our critical offline-first architecture.

**Key Finding:** Our stack is optimized for **offline-first POS operations** which has different constraints than cloud-first apps. We should adopt AI dev tools (Grail, Vercel AI SDK, Tailwind V4) but keep our core architecture intact.

---

## Part 1: Our Current Tech Stack

### Frameworks

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| **Frontend (store-app)** | React + Vite | 18.3.1 / 6.4.1 | SPA, not SSR |
| **Frontend (online-store)** | Vite (React SPA) | 5.4.19 | NOT Next.js |
| **Backend** | Supabase (PostgreSQL + Edge Functions) | 2.49.1 | No custom Node.js server |
| **Mobile** | Capacitor | 6.2.0 | iOS/Android via WebView |
| **Desktop** | Electron | 35.1.5 | For store-app |
| **Monorepo** | Turborepo + pnpm | 2.5.4 | 5 apps, 10 packages |

### Styling

| Technology | Version | Notes |
|------------|---------|-------|
| **Tailwind CSS** | 3.4.17 | V3, not V4 |
| **Radix UI** | Various | Headless components |
| **Framer Motion** | 12.23.24 | Animations |
| **Lucide React** | 0.511.0 | Icons |
| **Custom design-system** | Internal | `@mango/design-system` package |

### Payments

| Technology | Purpose | Status |
|------------|---------|--------|
| **Fiserv TTP** | Tap to Pay (iOS/Android) | Planned, not implemented |
| **Mock Provider** | Development | Current |
| **Stripe** | Online payments | NOT integrated |

### Authentication

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Supabase Auth** | All apps | Full implementation |
| **Custom PIN system** | store-app member auth | bcrypt + SecureStorage |
| **Offline grace period** | 7-day store, 24-hour member | Critical for offline-first |

### AI Integrations

| Technology | App | Notes |
|------------|-----|-------|
| **@ai-sdk/google** | online-store | Installed but using Lovable gateway |
| **Custom chat** | online-store | ~370 LOC, function calling |
| **Vercel AI SDK patterns** | None | Not using `generateText`/`streamText` |

### Deployments

| App | Platform | Notes |
|-----|----------|-------|
| **store-app** | Electron (local) | Not cloud-deployed |
| **online-store** | Unknown | No Vercel config found |
| **Edge Functions** | Supabase | Deno runtime |

### Dev Tools

| Category | Current |
|----------|---------|
| **Editor** | Cursor/Windsurf |
| **Terminal** | Default (not Ghostty) |
| **AI Models** | Claude (via Cursor) |
| **Code Review** | Manual (no Grail) |

### Real-time Communication

| Technology | Purpose |
|------------|---------|
| **MQTT (mqtt.js)** | Device-to-device (Pad, Check-in) |
| **Mosquitto** | Local broker in store-app |
| **HiveMQ/EMQX** | Cloud broker |
| **Supabase Realtime** | Database subscriptions |

### Local Storage

| Technology | Purpose |
|------------|---------|
| **Dexie.js (IndexedDB)** | Offline data |
| **better-sqlite3** | SQLite adapter (Electron) |
| **localStorage** | Session caching |

---

## Part 2: Ras Mic's AI-Optimized Stack (January 2026)

### Frameworks
- **Next.js** - Frontend, AI-friendly over Tanstack Start
- **ElysiaJS** - Backend in Next.js for performance/type safety via Eden
- **Convex** - Main backend for real-time DB, functions, webhooks, jobs (all code-based)
- **Turbo Repo** - Monorepos
- **Expo** - Cross-platform mobile (React Native)

### Styling
- **Tailwind CSS V4** - Latest version with CSS-first config
- **Shadcn UI** - CLI for customizable themes

### Payments
- **Stripe** - Via Convex components
- **Lemon Squeezy** - Alternative for usage-based billing

### Auth
- **Clerk** - Easiest, pre-built UI
- **Better Auth** - Integrations/Convex component
- **WorkOS** - Enterprise

### AI App Tools
- **Daytona** - Cloud sandboxes for agents
- **Vercel AI SDK** - Agent building
- **Claude Agent SDK** - Cloud code
- **Composio** - API/tool integrations (Gmail/Slack)

### Deployments
- **Vercel** - Next.js hosting
- **Railway** - Servers/DBs like Postgres

### AI Tools/Models
- **Cursor** - Editor/CLI
- **Ghostty** - Terminal (GPU-accelerated)
- **Grail** - AI code review for PRs/fixes
- **Models:** Claude Opus 4.5 Thinking (programming), Codex (bugs), OpenAI 5.2 (general)
- **Chat Apps:** T3 Chat (main), OpenAI/Claude subs

---

## Part 3: Point-by-Point Comparison

| Category | **Ras Mic's Stack** | **Our Stack** | **Match** | **Analysis** |
|----------|---------------------|---------------|-----------|--------------|
| **Frontend Framework** | Next.js (SSR, AI-friendly) | Vite + React (SPA) | ❌ | His: Better SEO, server components. Ours: Simpler, faster dev server, but no SSR. |
| **Backend Framework** | ElysiaJS (in Next.js) | None (Supabase direct) | ❌ | His: Type-safe API routes. Ours: No backend code = less to maintain, but less flexibility. |
| **Main Backend/DB** | Convex (real-time, code-based) | Supabase (PostgreSQL + RLS) | ❌ | **Critical.** His: All backend logic in code, AI excels. Ours: SQL + Edge Functions, more config. |
| **Monorepo** | Turbo Repo | Turborepo | ✅ | Same tool. |
| **Mobile** | Expo | Capacitor | ❌ | His: React Native, better native perf. Ours: WebView, easier web→mobile but slower. |
| **Styling** | Tailwind V4 + Shadcn | Tailwind V3 + Radix | ⚠️ | His: Latest Tailwind, Shadcn CLI. Ours: Older Tailwind, manual Radix setup. |
| **Payments** | Stripe (via Convex) | Fiserv TTP (planned) + None | ❌ | His: Stripe for everything. Ours: Hardware TTP for in-store, nothing for online. |
| **Auth** | Clerk / Better Auth / WorkOS | Supabase Auth | ❌ | His: Pre-built UI, easier. Ours: More control, works offline. |
| **AI App Tools** | Daytona, Vercel AI SDK, Claude Agent SDK, Composio | @ai-sdk/google (partial) | ❌ | His: Full AI agent stack. Ours: Minimal, custom implementation. |
| **Deployments** | Vercel + Railway | Supabase + Unknown | ⚠️ | His: Optimized for Next.js. Ours: No clear deployment story for online-store. |
| **Editor** | Cursor + Ghostty | Cursor/Windsurf | ⚠️ | Similar, but no Ghostty. |
| **Code Review** | Grail (AI) | Manual | ❌ | His: Automated AI review. Ours: None. |
| **AI Models** | Claude Opus 4.5, Codex, OpenAI 5.2 | Claude (via editor) | ⚠️ | His: Multi-model strategy. Ours: Single model. |
| **Chat Apps** | T3 Chat | None | ❌ | His: Dedicated AI chat. Ours: Editor only. |

---

## Part 4: Honest Pros/Cons Analysis

### Where Ras Mic's Stack Wins (AI-Optimized Shipping)

| Advantage | Why It Matters for AI Coding |
|-----------|------------------------------|
| **Convex (code-based backend)** | AI can write all backend logic as TypeScript functions. No SQL migrations, no config files. AI excels at this. |
| **Next.js** | Server components, API routes in same codebase. AI understands the patterns well. |
| **Expo** | True React Native. AI can generate native-feeling mobile code. |
| **Grail** | AI reviews AI-generated code. Catches bugs before merge. |
| **Vercel AI SDK** | Standard patterns (`generateText`, `streamText`) that AI knows how to use. |
| **Shadcn CLI** | AI can run `npx shadcn add button` and get consistent components. |

### Where Our Stack Wins

| Advantage | Why It Matters |
|-----------|----------------|
| **Offline-first architecture** | POS MUST work without internet. Convex requires network. Supabase + IndexedDB gives us 7-day offline. |
| **MQTT for device sync** | Real-time Pad/Check-in communication at 2-10ms latency. Convex can't do local broker. |
| **Fiserv TTP** | Hardware payment integration. Stripe can't do Tap to Pay on merchant's own device. |
| **Supabase RLS** | Row-level security per store. Multi-tenant without code. |
| **No vendor lock-in** | PostgreSQL is portable. Convex is proprietary. |

### Where Our Stack Loses

| Weakness | Impact |
|----------|--------|
| **No SSR (Vite SPA)** | online-store has poor SEO, slower initial load. |
| **Tailwind V3** | Missing V4 features (CSS-first config, better performance). |
| **No AI code review** | AI-generated code goes unreviewed. Bugs slip through. |
| **No Stripe for online** | Can't take deposits for online bookings. |
| **Capacitor vs Expo** | WebView is slower than native. Harder to get native-feeling UX. |
| **Custom AI chat** | Not using standard Vercel AI SDK patterns. Harder for AI to help. |

---

## Part 5: Improvement Proposal

### 🟢 Phase 1: Immediate Wins (Week 1)

| Action | Effort | Benefit | Cost |
|--------|--------|---------|------|
| **Add Grail for PR reviews** | 1 hour | AI catches bugs in AI-generated code | $20/month |
| **Upgrade Tailwind V3 → V4** | 2-4 hours | Better DX, CSS-first config, smaller bundle | Free |
| **Add Shadcn CLI** | 1 hour | Consistent component generation, AI-friendly | Free |
| **Install Ghostty terminal** | 10 min | Faster terminal, GPU-accelerated | Free |
| **Add T3 Chat or OpenRouter** | 30 min | Multi-model access for different tasks | $20-50/month |

**Total Phase 1:** ~1 day effort, ~$40-70/month

### 🟡 Phase 2: AI Standardization (Week 2-3)

| Action | Effort | Benefit | Trade-off |
|--------|--------|---------|-----------|
| **Refactor chat to Vercel AI SDK** | 1-2 days | Standard patterns (`generateText`, `streamText`) | Rewrite ~370 LOC |
| **Add Stripe to online-store** | 1 week | Accept deposits for online bookings | Stripe fees (2.9% + $0.30) |

**Total Phase 2:** ~1.5 weeks effort

### 🟠 Phase 3: Architecture Improvement (Month 2)

| Action | Effort | Benefit | Trade-off |
|--------|--------|---------|-----------|
| **Migrate online-store to Next.js** | 2-3 weeks | SSR, better SEO, API routes, Vercel deploy | Rewrite routing, learn App Router |
| **Deploy online-store to Vercel** | 1 day | Automatic deploys, edge functions, analytics | Vercel pricing at scale |

**Total Phase 3:** ~3 weeks effort

### 🔴 Phase 4: Evaluate Carefully (Q2+)

| Action | Effort | Benefit | Trade-off |
|--------|--------|---------|-----------|
| **Convex for online-store only** | 1-2 months | Code-based backend, AI-friendly | Vendor lock-in, learning curve |
| **Expo for new mobile apps** | 3-6 months | True React Native | Complete rewrite, lose web compatibility |

**Note:** These are optional and require careful evaluation.

---

## Part 6: What NOT to Change

| Component | Reason |
|-----------|--------|
| **Supabase for store-app** | Offline-first requires local data. Convex requires network. |
| **Fiserv TTP** | Hardware Tap to Pay. Stripe can't replace this. |
| **MQTT** | Local device sync at 2-10ms. No cloud service matches this. |
| **Capacitor for existing apps** | Migration to Expo too costly for existing apps. |
| **Supabase Auth for store-app** | Offline grace period is critical. Clerk requires network. |

---

## Part 7: Cost-Benefit Summary

### Monthly Costs (After Implementation)

| Tool | Cost | Value |
|------|------|-------|
| Grail | $20 | AI code review |
| T3 Chat / OpenRouter | $20-50 | Multi-model access |
| Vercel (online-store) | $0-20 | Hobby tier sufficient initially |
| Stripe | Transaction fees only | Online payments |

**Total:** ~$40-90/month

### Development Time Saved

| Improvement | Time Saved Per Week |
|-------------|---------------------|
| Grail (fewer bugs in PRs) | 2-4 hours |
| Shadcn CLI (component generation) | 1-2 hours |
| Vercel AI SDK (standard patterns) | 1-2 hours |
| Tailwind V4 (better DX) | 30 min |

**Estimated:** 4-8 hours/week saved

### ROI Calculation

- **Investment:** ~40 hours (Phases 1-2)
- **Monthly savings:** 16-32 hours
- **Payback period:** 1-2 months

---

## Part 8: Implementation Timeline

```
Week 1 (Phase 1 - Immediate Wins)
├── Day 1: Add Grail, Ghostty, T3 Chat
├── Day 2-3: Upgrade Tailwind V3 → V4
└── Day 4: Add Shadcn CLI

Week 2-3 (Phase 2 - AI Standardization)
├── Days 1-3: Refactor chat to Vercel AI SDK
└── Days 4-10: Add Stripe to online-store

Month 2 (Phase 3 - Architecture)
├── Week 1-2: Migrate online-store to Next.js
└── Week 3: Deploy to Vercel

Q2+ (Phase 4 - Evaluate)
├── Evaluate Convex for online-store
└── Evaluate Expo for future mobile apps
```

---

## Appendix A: Ras Mic Stack Corrections

The original TOOL_ADOPTION_PLAN.md had some issues:

| Issue | Correction |
|-------|------------|
| "Codex" for bug fixing | Codex deprecated March 2023. Use GPT-4o or o3-mini. |
| "2000+ LOC savings" for auth | Actual savings ~200 lines. Most auth code needed for offline. |
| Clerk for store-app | Not viable - breaks offline-first. Only for online-store. |
| Composio for notifications | Unnecessary - we have Twilio/SendGrid abstraction already. |

---

## Appendix B: Decision Matrix

| Decision | Adopt? | Confidence | Notes |
|----------|--------|------------|-------|
| Grail | ✅ Yes | High | Low effort, high value |
| Tailwind V4 | ✅ Yes | High | Minor migration |
| Shadcn CLI | ✅ Yes | High | Complements Radix |
| Ghostty | ✅ Yes | High | Personal tool |
| T3 Chat | ✅ Yes | High | Multi-model access |
| Vercel AI SDK | ✅ Yes | High | Standardization |
| Stripe (online) | ✅ Yes | High | Fills real gap |
| Next.js (online) | ⚠️ Maybe | Medium | Significant effort |
| Vercel deploy | ⚠️ Maybe | Medium | Depends on Next.js |
| Clerk | ❌ No | High | Breaks offline |
| Convex | ❌ No | High | Breaks offline |
| Expo | ❌ No | Medium | Too costly to migrate |
| Composio | ❌ No | High | Already have abstraction |

---

## Conclusion

Ras Mic's stack is optimized for **AI-assisted shipping of cloud-first apps**. Our stack is optimized for **offline-first POS** which has fundamentally different constraints.

**Adopt:**
- Dev tools (Grail, Ghostty, T3 Chat)
- Styling updates (Tailwind V4, Shadcn)
- AI patterns (Vercel AI SDK)
- Online payments (Stripe for online-store)

**Keep:**
- Supabase (offline-first, no lock-in)
- MQTT (local device sync)
- Fiserv TTP (hardware payments)
- Capacitor (existing apps)

**Skip:**
- Clerk (breaks offline)
- Convex (breaks offline)
- Expo (migration too costly)

---

*Last updated: January 23, 2026*
