# Data Flow Architecture

## Overview

This document outlines the data flow architecture for Mango Online Store, defining data ownership, integration patterns, and synchronization strategies between the Store, Mango Biz, and AI Service.

## Data Ownership

### Store-Owned Data
Data that lives in the Mango Online Store database (SQL Server):

- **Store Configuration**
  - Template selection and customization
  - Theme settings (colors, fonts, branding)
  - Custom domain configuration
  - Display preferences and settings

- **Analytics Events**
  - Page views and user interactions
  - Conversion tracking (bookings, purchases)
  - User behavior analytics
  - Performance metrics

- **Cache Data**
  - Cached responses from Mango Biz API
  - Temporary data for performance optimization
  - Session-specific information

- **User Preferences**
  - Theme preferences (light/dark mode)
  - Language settings
  - Notification preferences
  - Saved preferences for returning users

### Mango Biz-Owned Data
Data that comes from Mango Biz via API/webhooks:

- **Business Data**
  - Services catalog and pricing
  - Products inventory and stock levels
  - Staff profiles and availability
  - Client information and history
  - Business hours and location details

- **Operational Data**
  - Appointments and bookings
  - Orders and transactions
  - Payment information
  - Client communication history

- **Content Data**
  - Team photos and bios
  - Gallery images and portfolios
  - Reviews and testimonials
  - Business policies and procedures

### AI Service-Owned Data
Data managed by the external AI Service:

- **Knowledge Base**
  - Salon industry knowledge
  - Service recommendations
  - FAQ responses
  - Best practices and tips

- **User Context**
  - Conversation history
  - User preferences and behavior
  - Recommendation models
  - Learning data for personalization

## Integration Flows

### 1. Webhook Flow (Mango Biz → Store)

**Purpose:** Real-time updates when business data changes

**Flow:**
1. Merchant updates service price in Mango Biz
2. Mango Biz sends webhook: `POST /webhooks/services/updated`
3. Store receives webhook with updated service data
4. Store invalidates cache for that specific service
5. Next client request fetches fresh data from Mango Biz API
6. Store caches the new response for 5 minutes

**Webhook Events:**
- `services/updated` - Service catalog changes
- `products/updated` - Product inventory changes
- `staff/updated` - Staff information changes
- `bookings/updated` - Appointment changes
- `business/updated` - Hours, location, contact changes

**Error Handling:**
- Retry failed webhooks with exponential backoff
- Log webhook failures for monitoring
- Fallback to periodic sync if webhooks fail

### 2. Booking Flow (Store → Mango Biz)

**Purpose:** Create confirmed appointments in Mango Biz

**Flow:**
1. Client selects service and time slot on Store
2. Store creates draft booking: `POST /api/v1/booking/draft`
3. Draft stored temporarily in Store database
4. Client reviews and confirms booking
5. Store sends to Mango Biz: `POST /biz-api/v1/bookings`
6. Mango Biz creates appointment in calendar
7. Mango Biz returns confirmation with booking ID
8. Store updates booking status to confirmed
9. Store sends confirmation email to client
10. Store shows success page with booking details

**Error Handling:**
- If Mango Biz is unavailable, store booking as pending
- Retry failed bookings when service is restored
- Notify client of booking status changes

### 3. AI Service Integration (Store ↔ AI Service)

**Purpose:** Provide intelligent chat, recommendations, and search

**Chat Flow:**
1. Client sends message via chat UI
2. Store calls AI Service: `POST /api/v1/ai/chat`
3. AI Service processes message and returns response
4. Store displays response to client
5. Store logs interaction for analytics

**Recommendation Flow:**
1. Client visits homepage or product page
2. Store calls AI Service: `POST /api/v1/ai/recommend`
3. AI Service analyzes context and returns recommendations
4. Store displays personalized recommendations
5. Store tracks recommendation performance

**Search Flow:**
1. Client enters search query
2. Store calls AI Service: `POST /api/v1/ai/search`
3. AI Service searches knowledge base and returns results
4. Store displays categorized search results
5. Store logs search queries for analytics

**Fallback Behavior:**
- If AI Service is unavailable, use canned responses
- Hide AI features if service is down
- Show "AI temporarily unavailable" message

### 4. Payment Flow (Store → Stripe)

**Purpose:** Process payments for products and services

**Flow:**
1. Client proceeds to checkout
2. Store creates payment intent with Stripe
3. Client enters payment information
4. Stripe processes payment
5. Stripe returns payment confirmation
6. Store creates order in Mango Biz
7. Store sends confirmation email to client
8. Store redirects to success page

**Error Handling:**
- Handle payment failures gracefully
- Retry failed payments if appropriate
- Notify client of payment issues

## Data Synchronization

### Real-Time Sync (Webhooks)
- **Trigger:** Data changes in Mango Biz
- **Method:** HTTP webhooks
- **Latency:** <5 seconds
- **Reliability:** 99.9% delivery rate

### Periodic Sync (Backup)
- **Trigger:** Scheduled every 15 minutes
- **Method:** API polling
- **Purpose:** Catch missed webhooks
- **Scope:** All business data

### Cache Management
- **TTL:** 5 minutes for business data
- **Invalidation:** On webhook receipt
- **Storage:** Redis for performance
- **Fallback:** Direct API calls if cache miss

## Data Security

### Data in Transit
- All API calls use TLS 1.3 encryption
- Webhook payloads are signed and verified
- API keys are rotated regularly

### Data at Rest
- Sensitive data encrypted with AES-256
- Database access is tenant-scoped
- Regular security audits and penetration testing

### Privacy Compliance
- GDPR compliant data handling
- CCPA compliant for California users
- Data retention policies enforced
- User consent management

## Monitoring and Observability

### Data Flow Monitoring
- Webhook delivery success rates
- API response times and error rates
- Cache hit/miss ratios
- Data sync lag times

### Alerting
- Webhook delivery failures
- API timeout errors
- Data sync delays >5 minutes
- Cache performance degradation

### Logging
- All API calls logged with request/response
- Webhook events logged with payload
- Error conditions logged with context
- Performance metrics logged for analysis

## Troubleshooting

### Common Issues

#### Webhook Delivery Failures
- Check webhook endpoint availability
- Verify webhook signature validation
- Review rate limiting configuration
- Check network connectivity

#### Data Sync Delays
- Verify webhook processing
- Check API response times
- Review cache configuration
- Monitor database performance

#### AI Service Integration Issues
- Check API key configuration
- Verify rate limiting
- Review error responses
- Test fallback behavior

### Debug Tools
- Webhook delivery logs
- API call tracing
- Cache inspection tools
- Performance monitoring dashboards

---

*This data flow architecture ensures reliable, secure, and performant data synchronization between all services while maintaining clear data ownership boundaries.*



