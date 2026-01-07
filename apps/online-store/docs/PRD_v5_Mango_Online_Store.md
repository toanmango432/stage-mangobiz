# 🛍️ Mango Online Store — Product Requirements Document (v5)
**Clean Architecture & Integration-Ready Development Guide**

---

## 📋 Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 5.0 | Oct 2025 | Product Team | Clean architecture with AI-as-external-API, integration-ready |
| 4.0 | Oct 2025 | Product Team | Refocused on product requirements and UX |
| 3.0 | Oct 2025 | Product Team | Added API plan and standalone mode |
| 2.0 | Sep 2025 | Product Team | Integration architecture updates |
| 1.0 | Aug 2025 | Product Team | Initial PRD |

**Last Updated:** October 21, 2025  
**Status:** Active Development  
**Priority:** P0 (Strategic Initiative)

---

## 1. Product Overview

### Product Vision
**Mango Online Store transforms salon websites into intelligent, automated storefronts** that give clients a beautiful, frictionless way to discover services, book appointments, and shop products — while eliminating manual website management for merchants.

### Architecture Philosophy
**Clean, Integration-Ready Design:**
- **API-First**: All features exposed via REST APIs (`/api/v1/*`)
- **Service-Oriented**: Clear boundaries between Store, Mango Biz, and AI Service
- **Multi-Mode Support**: Standalone (MSW mocks) and Connected (real APIs)
- **Database-Agnostic**: Ready for SQL Server migration
- **Integration Contracts**: OpenAPI specs for all external services

### User Problems We're Solving

**For Clients (Salon Customers):**
- Can't book appointments online when they think of it (11pm on a Tuesday)
- Have to call during business hours to check availability
- Can't browse services, pricing, or products before visiting
- Don't know which provider to choose or what services they offer
- Miss promotions because they're not informed in real-time

**For Merchants (Salon Owners):**
- Spend 4-8 hours/month manually updating website prices and schedules
- Data lives in two places (Mango Biz + separate website) causing sync issues
- Pay $35-80/month for website builders that don't integrate with their POS
- Lose 30-40% of potential bookings due to lack of online presence
- Can't easily showcase their team, services, or promotions

### Product Value Proposition

**For Clients:**
- ✅ Book appointments 24/7 in under 3 taps
- ✅ Browse services, products, and pricing anytime
- ✅ Get AI-powered recommendations based on preferences
- ✅ See real-time availability and staff profiles
- ✅ Mobile-first, fast-loading experience

**For Merchants:**
- ✅ Professional website setup in 5 minutes (not 4+ hours)
- ✅ Zero manual updates — everything auto-syncs from Mango Biz
- ✅ Showcase services, team, and products beautifully
- ✅ Capture more bookings with 24/7 online scheduling
- ✅ Integrated payments, inventory, and analytics

### Business Context (Brief)
3-tier pricing: Essential ($29), Professional ($49), Enterprise ($149). Target: 500+ merchants Year 1. Builds on existing Mango Biz ecosystem

---

## 2. User Personas & Use Cases

### Primary Personas

#### 👤 Sarah — The Client (Salon Customer)
**Demographics:** 28 years old, marketing professional, tech-savvy  
**Goals:**
- Book hair appointments during her commute or late at night
- See service options and pricing before deciding
- Choose a specific stylist based on their work
- Buy hair products without visiting the salon

**Pain Points:**
- Salon's current website has no online booking
- Has to call during work hours to schedule
- Doesn't know which stylist specializes in what
- Forgets to buy products during appointments

**How Mango Online Store Helps:**
- Books appointments in 3 taps from her phone
- Browses full service menu with photos and descriptions
- Sees stylist profiles with portfolios and availability
- Orders products for home delivery or in-store pickup

---

#### 👤 Marcus — The Merchant (Salon Owner)
**Demographics:** 42 years old, owns a 5-chair salon, busy managing day-to-day  
**Goals:**
- Have a professional online presence without hiring a web designer
- Stop spending hours updating prices and services on his website
- Fill booking gaps with online appointments
- Showcase his team and build their personal brands

**Pain Points:**
- Current Squarespace site takes 2 hours/week to maintain
- Often forgets to update prices, causing client confusion
- Website doesn't sync with his Mango Biz calendar
- Losing bookings to competitors with online scheduling

**How Mango Online Store Helps:**
- Sets up professional website in 5 minutes using existing Mango data
- All updates happen automatically when he changes things in Mango Biz
- Clients book directly into his Mango calendar
- Team profiles auto-populate from staff database

---

## 3. Core Features

### 3.1 Service Booking
**Purpose:** Seamless appointment scheduling experience

**Booking Flow:**
1. Client browses services → selects service
2. Chooses preferred provider (optional)
3. Views available time slots
4. Selects date/time
5. Enters contact information
6. Confirms booking
7. Receives confirmation email + calendar invite

**Requirements:**
- Real-time availability from Mango Biz
- Mobile-optimized calendar interface
- Guest checkout (no account required)
- Booking confirmation with all details
- Automatic calendar sync

---

### 3.2 Product Shopping
**Purpose:** E-commerce functionality for salon products

**Shopping Flow:**
1. Browse product catalog
2. View product details and photos
3. Add to cart
4. Proceed to checkout
5. Enter shipping information
6. Select payment method
7. Complete purchase
8. Receive order confirmation

**Requirements:**
- Product catalog with photos and descriptions
- Shopping cart persistence
- Guest checkout available
- Inventory status display
- Order tracking

---

### 3.3 Team Showcase
**Purpose:** Showcase salon staff and their expertise

**Features:**
- Staff profiles with photos and bios
- Specialties and certifications
- Work portfolios (before/after photos)
- Client reviews specific to each provider
- "Book with [Name]" functionality
- Social media integration

---

### 3.4 Gallery & Reviews
**Purpose:** Visual showcase and social proof

**Gallery:**
- High-quality photos of salon work
- Categorized by service type
- Lightbox view with navigation
- Mobile-optimized display

**Reviews:**
- Client testimonials with ratings
- Service-specific reviews
- Aggregate rating display
- Verified client badges

---

## 4. AI Features (External Service)

### 4.1 AI Architecture Overview

**Key Principle:** AI Service is a **separate microservice** managed independently from Mango Online Store.

**Store Responsibilities:**
- Chat UI component (bubble, conversation history, typing indicators)
- API client for AI endpoints (`/api/v1/ai/*`)
- Response rendering and error handling
- Rate limiting display (quota exceeded messages)

**AI Service Responsibilities (External):**
- Provider selection and routing (Gemini, OpenAI, Claude, Grok)
- Prompt engineering and context management
- Response caching (Redis)
- Safety filters and content moderation
- Knowledge base (vector DB)
- Cost optimization and fallback logic

### 4.2 AI Chat Assistant
**Purpose:** Instant, intelligent client support

**API Contract:**
- `POST /api/v1/ai/chat` - Send message, get response
- `POST /api/v1/ai/recommend` - Get personalized recommendations
- `POST /api/v1/ai/search` - AI-powered search
- `GET /api/v1/ai/suggestions` - Contextual quick replies

**Requirements:**
- Chat bubble in bottom-right corner (all pages)
- Understands natural language queries
- Can handle:
  - Service recommendations ("What color treatment do I need?")
  - Booking questions ("When is Jordan available?")
  - Product recommendations ("Best shampoo for dry hair?")
  - Policy questions ("What's your cancellation policy?")
  - General info ("What are your hours?")

**Standalone Mode:**
- Uses MSW handlers with canned responses
- No actual AI provider calls
- Perfect for development and testing

**Connected Mode:**
- Real-time API calls to AI Service
- Full AI capabilities available
- Graceful degradation if service unavailable

### 4.3 Smart Recommendations
**Purpose:** Personalized product and service suggestions

**Implementation:**
- "Recommended for You" section on homepage
- Based on browsing history, cart contents, similar clients
- Real-time recommendations via AI Service API
- Can be disabled per merchant

### 4.4 AI-Powered Search
**Purpose:** Help clients find what they need fast

**Features:**
- Search bar in header (all pages)
- Searches across services, products, team members, reviews
- Natural language understanding
- Instant results as you type
- Categorized results with suggestions

---

## 5. Technical Architecture

### 5.1 Technology Stack

**Frontend (Storefront):**
- Framework: React 18 with TypeScript
- Build Tool: Vite (fast development and building)
- Styling: Tailwind CSS (utility-first CSS)
- Components: Radix UI (accessible component primitives)
- State Management: React Context + Custom hooks
- API Client: Custom typed client with error handling
- Mocking: MSW (Mock Service Worker) for development
- PWA: Service Worker for offline support

**Backend (API Layer for Store):**
- Runtime: Node.js 20+ with Express
- Database: SQL Server 2019+ (synced from Mango Biz)
- Cache: Redis (API response caching)
- File Storage: Cloudflare R2 (images, assets)
- Language: TypeScript

**External Services (Integration Points):**
- **Mango Biz API** - Core business data (services, products, staff, bookings)
- **AI Service API** - Chat, recommendations, search (external microservice)
- **Stripe API** - Payment processing
- **SendGrid/Postmark** - Transactional emails

**Development Tools:**
- TypeScript for type safety
- ESLint + Prettier for code quality
- Vitest for testing
- MSW for API mocking
- OpenAPI specs for contract documentation

### 5.2 Data Architecture

**Principles:**
- **Single Source of Truth:** All business data lives in Mango Biz
- **Store as Presentation Layer:** Mango Online Store stores only store-specific data
- **Real-Time Sync:** Webhooks push updates from Mango Biz to Store
- **No Data Duplication:** Never copy business data to Store database

**Store-Owned Data (SQL Server):**
- Store configuration (template, theme, custom domain)
- Analytics events (page views, conversions)
- Cache of Mango Biz data (for performance)
- User preferences (theme, language)

**Mango Biz-Owned Data (via API):**
- Services catalog
- Products inventory
- Staff profiles
- Client information
- Appointments and bookings
- Orders and payments

### 5.3 API Structure

**Store API (`/api/v1/*`):**
- `/storefront/*` - Public storefront data
- `/booking/*` - Appointment booking
- `/cart/*` - Shopping cart and checkout
- `/promotions/*` - Promotions and discounts
- `/announcements/*` - Store announcements

**External Service APIs:**
- **Mango Biz:** `/biz-api/v1/*` - Business data
- **AI Service:** `/api/v1/ai/*` - AI features
- **Stripe:** `/v1/*` - Payment processing

**Webhooks (from Mango Biz):**
- `POST /webhooks/services/updated` - Service catalog changed
- `POST /webhooks/products/updated` - Inventory changed
- `POST /webhooks/staff/updated` - Staff info changed
- `POST /webhooks/booking/updated` - Booking changed

### 5.4 Development Modes

#### Standalone Mode (Default)
- Uses MSW (Mock Service Worker) for API mocking
- Data stored in localStorage
- Perfect for development and testing
- No external dependencies
- AI features use canned responses

#### Connected Mode
- Connects to real backend services
- Uses SQL Server database
- Integrates with Mango Biz and AI Service
- Production-ready
- Full AI capabilities available

---

## 6. Integration Architecture

### 6.1 Service Dependencies

**Mango Biz (Required)**
- **Provides:** Services, products, staff, bookings, client data
- **Sync:** Webhooks push updates to Store
- **Fallback:** Cached data in Store database
- **API Contract:** `/docs/api/store-to-biz.openapi.yaml`

**AI Service (Optional)**
- **Provides:** Chat, recommendations, search
- **Sync:** Real-time API calls
- **Fallback:** Canned responses or disable feature
- **API Contract:** `/docs/api/store-to-ai.openapi.yaml`

**Stripe (Required for checkout)**
- **Provides:** Payment processing
- **Sync:** Real-time API calls
- **Fallback:** Show "payment processing unavailable"

### 6.2 Integration Principles

- **API-First Design:** All integrations via REST APIs
- **Contract-Driven:** OpenAPI specs define all contracts
- **Loose Coupling:** No direct database access between services
- **Idempotent Operations:** Safe retry logic
- **Graceful Degradation:** Store works even if external services are down

### 6.3 Data Flow

#### Webhook Flow (Biz → Store)
1. Merchant updates service price in Mango Biz
2. Biz sends webhook: POST /webhooks/services/updated
3. Store invalidates cache for that service
4. Next request fetches fresh data from Biz API
5. Store caches response for 5 minutes

#### Booking Flow (Store → Biz)
1. Client selects service + time on Store
2. Store creates draft booking (POST /api/v1/booking/draft)
3. Draft stored in Store DB temporarily
4. Client confirms
5. Store sends to Biz: POST /biz-api/v1/bookings
6. Biz creates appointment in calendar
7. Biz returns confirmation
8. Store shows success page

---

## 7. Performance Requirements

**Page Load Times:**
- First Contentful Paint (FCP): <1.5 seconds
- Largest Contentful Paint (LCP): <2.5 seconds
- Time to Interactive (TTI): <3.5 seconds
- All pages on 4G mobile connection

**API Response Times:**
- Read endpoints: <200ms (p95)
- Write endpoints: <500ms (p95)
- Search: <300ms (p95)
- AI chat: <2 seconds (p95)

**Uptime:**
- Essential tier: 99% uptime
- Professional tier: 99.5% uptime
- Enterprise tier: 99.9% uptime

---

## 8. Security Requirements

**Authentication:**
- Merchant login via Mango SSO
- Client login optional (for saved preferences)
- JWT tokens with 24-hour expiration
- Refresh token rotation

**Data Protection:**
- All data in transit encrypted (TLS 1.3)
- Sensitive data at rest encrypted (AES-256)
- PCI DSS compliant payment processing (via Stripe)
- GDPR and CCPA compliant

**API Security:**
- Rate limiting (100 requests/minute per IP)
- CORS properly configured
- Input validation on all endpoints
- SQL injection prevention
- XSS prevention

---

## 9. Success Metrics

### 9.1 User-Centric Metrics

**For Clients:**
- Booking completion rate: ≥30%
- Product cart conversion rate: ≥40%
- Average time to book: ≤60 seconds
- Mobile booking rate: ≥70%
- Return visitor rate: ≥40%
- AI chat satisfaction: ≥80%

**For Merchants:**
- Setup completion time: ≤5 minutes
- Setup completion rate: ≥80%
- Time saved per week: ≥4 hours
- Satisfaction score (NPS): ≥50
- Merchant activation rate: 70% of Mango Biz users in 6 months

### 9.2 Technical Metrics

**Performance:**
- Lighthouse Performance score: ≥90
- Core Web Vitals: All passing
- API success rate: ≥99.9%

**Reliability:**
- Uptime: As per tier (99-99.9%)
- Error rate: <0.1%
- Mean time to recovery (MTTR): <15 minutes

---

## 10. Documentation References

### 10.1 Technical Documentation
- **[Architecture Overview](architecture/README.md)** - System architecture and design principles
- **[Integration Guide](integration/README.md)** - Integration instructions for Biz and AI teams
- **[API Documentation](api/)** - OpenAPI specifications for all services
- **[Database Migrations](database/migrations/)** - SQL Server migration scripts

### 10.2 API Contracts
- **[Store API](api/store-api.openapi.yaml)** - Complete Store API specification
- **[AI Service Contract](api/store-to-ai.openapi.yaml)** - AI Service integration contract
- **[Mango Biz Contract](api/store-to-biz.openapi.yaml)** - Mango Biz integration contract

### 10.3 Development Resources
- **[Local API Documentation](LOCAL_API.md)** - MSW mock API reference
- **[Environment Configuration](env.example)** - Development and production settings
- **[Testing Guide](__tests__/README.md)** - Unit and integration testing

---

## 11. Out of Scope (This Version)

**Not Included:**
- Email marketing campaigns (beyond transactional emails)
- Loyalty programs (may integrate with Mango Biz later)
- Advanced inventory management (handled by Mango Biz)
- Multi-currency/multi-language (English + USD only for now)
- Franchise/multi-location consolidated view (Enterprise tier roadmap)
- Custom mobile apps (PWA only)
- Live chat with human agents (AI chat only)

---

## 12. Open Questions & Decisions Needed

1. **Domain Strategy:** Do we offer free custom domain setup or charge extra?
2. **Photo Storage:** What's max gallery size per merchant? (Impacts storage costs)
3. **AI Chat Limits:** How many messages per month before rate limiting?
4. **Review Moderation:** Auto-approve or manual review before publishing?
5. **Template Customization:** How much CSS control do merchants get?
6. **Booking Deposits:** Do we support deposit collection at booking time?
7. **Gift Card Balance:** Can clients check gift card balance on website?
8. **Waitlist:** If time slot fully booked, can clients join waitlist?

---

## 13. Appendix

### A. Design System References
- Typography: Inter (headings), Open Sans (body)
- Color palette: Warm, inviting (oranges, soft pinks, creams)
- Spacing: 8px base unit
- Border radius: 8px (cards), 4px (buttons)
- Shadows: Subtle, layered depth

### B. Development Environment
- **Standalone Mode:** `MODE=standalone npm run dev`
- **Connected Mode:** `MODE=connected npm run dev`
- **Testing:** `npm run test`
- **Build:** `npm run build`

### C. Integration Testing
- Contract tests for all API endpoints
- Integration tests for external services
- End-to-end tests for critical user flows
- Performance tests for load scenarios

---

**End of Document**

---

*This PRD v5 serves as the definitive reference for the Mango Online Store development team, ensuring clean architecture, clear integration boundaries, and seamless collaboration with Mango Biz and AI Service teams.*



