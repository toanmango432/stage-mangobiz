# Database Migrations

This directory contains SQL Server migration scripts for the Mango Online Store database.

## Migration Files

- `001_create_schemas.sql` - Initial schema creation with store configuration, cache, and analytics tables

## Database Design Principles

### Store-Owned Data
The Mango Online Store database only stores:
- Store configuration (template, theme, custom domain)
- Cache of Mango Biz data (for performance)
- Analytics events and user sessions
- User preferences and settings

### Mango Biz-Owned Data
The following data comes from Mango Biz via API/webhooks:
- Services catalog
- Products inventory
- Staff profiles
- Client information
- Appointments and bookings
- Orders and payments

## Schema Organization

### store_config
- `store_settings` - Store configuration and theme settings

### store_cache
- `services` - Cached service data from Mango Biz
- `products` - Cached product data from Mango Biz
- `staff` - Cached staff data from Mango Biz

### store_analytics
- `events` - User interaction events
- `page_views` - Page view tracking
- `sessions` - User session data

## Running Migrations

```sql
-- Run all migrations in order
-- 1. Create database (if not exists)
-- 2. Run migration scripts in sequence
```

## Data Flow

1. **Webhook Flow (Biz → Store)**
   - Merchant updates service price in Mango Biz
   - Biz sends webhook: POST /webhooks/services/updated
   - Store invalidates cache for that service
   - Next request fetches fresh data from Biz API
   - Store caches response for 5 minutes

2. **Booking Flow (Store → Biz)**
   - Client selects service + time on Store
   - Store creates draft booking (POST /api/v1/booking/draft)
   - Draft stored in Store DB temporarily
   - Client confirms
   - Store sends to Biz: POST /biz-api/v1/bookings
   - Biz creates appointment in calendar
   - Biz returns confirmation
   - Store shows success page

## Performance Considerations

- All cache tables have TTL (expires_at) for automatic cleanup
- Indexes are optimized for tenant-scoped queries
- JSON columns are used for flexible data storage
- Soft deletes are handled via TTL rather than is_deleted flags




