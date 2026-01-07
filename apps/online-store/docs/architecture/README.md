# Mango Online Store Architecture

## Overview

Mango Online Store is a modern, API-first storefront that integrates with:
- **Mango Biz** (business management system) - Core business data
- **AI Service** (chat, recommendations, search) - AI-powered features
- **Stripe** (payment processing) - Payment handling

## Architecture Principles

1. **API-First**: All features exposed via REST APIs
2. **Service-Oriented**: Clear boundaries between services
3. **Cache-First**: Heavy caching for performance
4. **Graceful Degradation**: Works even if external services are down
5. **Multi-Tenant**: Every request scoped to tenant

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mango Store   │    │   Mango Biz     │    │   AI Service    │
│   (Frontend)    │◄──►│   (Backend)     │    │   (External)    │
│                 │    │                 │    │                 │
│ • React SPA     │    │ • Services      │    │ • Chat          │
│ • MSW Mocks     │    │ • Products      │    │ • Recommendations│
│ • localStorage  │    │ • Staff         │    │ • Search        │
│ • PWA           │    │ • Bookings      │    │ • Suggestions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SQL Server    │    │   SQL Server    │    │   Vector DB     │
│   (Store DB)    │    │   (Biz DB)      │    │   (AI DB)       │
│                 │    │                 │    │                 │
│ • Store config  │    │ • Business data │    │ • Knowledge     │
│ • Cache         │    │ • Transactions  │    │ • Embeddings    │
│ • Analytics     │    │ • Users         │    │ • Context       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Development Modes

### Standalone Mode (Default)
- Uses MSW (Mock Service Worker) for API mocking
- Data stored in localStorage
- Perfect for development and testing
- No external dependencies

### Connected Mode
- Connects to real backend services
- Uses SQL Server database
- Integrates with Mango Biz and AI Service
- Production-ready

## Directory Structure

```
src/
├── components/           # React components
│   ├── admin/           # Admin dashboard components
│   ├── auth/            # Authentication components
│   ├── booking/         # Booking flow components
│   ├── cart/            # Shopping cart components
│   ├── chat/            # AI chat components
│   └── ui/              # Reusable UI components
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # User authentication
│   ├── CartContext.tsx  # Shopping cart state
│   └── ThemeContext.tsx # Theme management
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── api-client/      # API client layer
│   ├── analytics/       # Analytics tracking
│   ├── seo/             # SEO utilities
│   └── storage/         # Data storage utilities
├── mocks/               # MSW mock handlers
│   └── handlers/        # API mock implementations
├── pages/               # Page components
├── types/               # TypeScript type definitions
│   └── api/             # API-specific types
└── __tests__/           # Test files
    ├── integration/     # Integration tests
    ├── unit/            # Unit tests
    └── contracts/       # API contract tests

docs/
├── api/                 # OpenAPI specifications
├── architecture/        # Architecture documentation
└── integration/         # Integration guides

database/
├── migrations/          # SQL Server migration scripts
└── seeds/              # Development seed data
```

## API Structure

### Store API (`/api/v1/*`)
- `/storefront/*` - Public storefront data
- `/booking/*` - Appointment booking
- `/cart/*` - Shopping cart and checkout
- `/promotions/*` - Promotions and discounts
- `/announcements/*` - Store announcements

### External APIs
- **Mango Biz**: `/biz-api/v1/*` - Business data
- **AI Service**: `/api/v1/ai/*` - AI features
- **Stripe**: `/v1/*` - Payment processing

## Data Flow

### 1. Store-Owned Data
Data that lives in Store database:
- Store configuration (template, theme, custom domain)
- Analytics events (page views, conversions)
- Cache of Mango Biz data (for performance)
- User preferences (theme, language)

### 2. Mango Biz-Owned Data
Data that comes from Mango Biz via API/webhooks:
- Services catalog
- Products inventory
- Staff profiles
- Client information
- Appointments and bookings
- Orders and payments

### 3. Integration Flow

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

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **MSW** for API mocking
- **PWA** capabilities

### Backend (API Layer)
- **Node.js 20+** with Express
- **SQL Server 2019+** (synced from Mango Biz)
- **Redis** (API response caching)
- **Cloudflare R2** (images, assets)

### External Services
- **Mango Biz API** - Core business data
- **AI Service API** - Chat, recommendations, search
- **Stripe API** - Payment processing
- **SendGrid/Postmark** - Transactional emails

## Security

- **API Keys** stored server-side only
- **JWT tokens** for authentication
- **CORS** properly configured
- **Rate limiting** on all endpoints
- **Input validation** with Zod schemas

## Performance

- **Code splitting** by feature
- **Image optimization** and lazy loading
- **API response caching** (Redis)
- **CDN** for static assets
- **PWA** for offline support

## Monitoring

- **Analytics** tracking (page views, conversions)
- **Error tracking** (Sentry)
- **Performance monitoring**
- **API response times**
- **Cache hit rates**

## Deployment

### Development
- Local development with MSW mocks
- Hot reload with Vite
- TypeScript compilation
- ESLint and Prettier

### Production
- Build optimization
- Asset minification
- CDN deployment
- Database migrations
- Health checks

## Future Considerations

- **Microservices** architecture
- **Event-driven** communication
- **GraphQL** API layer
- **Real-time** updates with WebSockets
- **Multi-region** deployment




