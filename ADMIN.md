# Admin Portal Documentation

## Overview

The Admin Portal is a separate administrative interface for the Mango POS provider to manage all customer installations, issue licenses, control features, and configure system settings.

**Important**: This is NOT part of the customer-facing POS application. It's a provider-only portal for managing the entire multi-tenant system.

## Accessing the Admin Portal

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin portal:
   ```
   http://localhost:5173/admin
   ```

### Demo Credentials

- **Email**: `admin@mangopos.com`
- **Password**: `admin123`

## Features

### 1. Dashboard
- Overview of all customers and system status
- Total customers, active licenses, and revenue metrics
- Recent customer activity
- Expiring licenses warnings
- System health monitoring

### 2. Customer Management
- View all customer installations (tenants)
- Search and filter by tier and status
- Customer details with usage tracking:
  - Business information
  - License tier (Starter, Professional, Enterprise)
  - Device and location usage vs. limits
  - Monthly recurring revenue (MRR)
  - Last active timestamp
- Actions: View, Edit, Manage License, Suspend

### 3. License Management
- Issue new licenses to customers
- View all licenses with status tracking
- License key format: `MANGO-{TIER}-XXXX-XXXX-XXXX-XXXX`
- Track device and location usage per license
- Actions: Issue New, Renew, Suspend

### 4. Feature Flags Management
- Control feature availability across tiers
- Features grouped by category:
  - Infrastructure: Multi-Device Sync, Multi-Location Management
  - Operations: Inventory Management
  - Analytics: Advanced Reporting
  - Marketing: Customer Loyalty Program
  - Communication: SMS Notifications
  - Integration: API Access
  - Security: Advanced Permissions
  - Payment: Payment Gateway Integration
  - Finance: Commission Tracking
- Toggle features globally or per-tier
- View affected customer count per feature

### 5. System Configuration (Coming Soon)
- Global system settings
- Configuration options

### 6. Analytics (Coming Soon)
- System-wide analytics
- Business intelligence reports

## Architecture

### Directory Structure

```
src/admin/
├── AdminPortal.tsx           # Main entry point with routing
├── auth/
│   └── AdminLogin.tsx        # Login page
├── layouts/
│   └── AdminLayout.tsx       # Sidebar navigation layout
└── pages/
    ├── AdminDashboard.tsx
    ├── CustomerManagement.tsx
    ├── LicenseManagement.tsx
    └── FeatureFlagsManagement.tsx
```

### Routing

The admin portal is accessed via the `/admin` path. The routing logic is handled in `src/App.tsx`:

- When the URL path starts with `/admin`, the `AdminPortal` component is rendered
- Otherwise, the regular POS app (`AppShell`) is rendered
- The admin portal has its own internal routing for different sections

### Authentication

Currently using localStorage for session management:
- Session key: `mango_admin_session`
- Stores admin email and login timestamp
- Session persists across browser refreshes
- Logout clears the session

### Data

Currently using mock data for demonstration:
- Customer records with realistic business information
- License records with tier and usage tracking
- Feature flags with category grouping

All data structures are designed to be easily replaceable with real API calls when backend is integrated.

## Future Integration

The admin portal is ready for backend API integration. Key integration points:

1. **Authentication API**
   - Replace localStorage with JWT/session tokens
   - Connect to provider authentication service

2. **Customer Management API**
   - CRUD operations for customer records
   - Real-time usage tracking
   - Subscription management

3. **License Management API**
   - License generation and validation
   - Device/location tracking
   - License renewal and suspension

4. **Feature Flags API**
   - Centralized feature flag service
   - Real-time feature toggling
   - Customer-specific overrides

5. **Analytics API**
   - System-wide metrics
   - Customer usage analytics
   - Revenue reporting

## Security Considerations

- Implement proper authentication and authorization
- Use secure session management (not localStorage in production)
- Add role-based access control (RBAC)
- Implement audit logging for admin actions
- Add rate limiting for API endpoints
- Use HTTPS in production
- Add CSRF protection
- Validate all inputs server-side

## Development Notes

- The admin portal is completely separate from the customer POS Redux state
- No Redux is used in the admin portal (can be added if needed)
- Uses same Tailwind CSS styling as the main app
- Uses Lucide React icons for consistency
- Fully responsive design
- Session management is client-side only (demo purposes)

## Production Deployment

For production deployment:

1. Set up separate subdomain or path for admin portal (e.g., `admin.mangopos.com` or `/admin`)
2. Implement proper backend API with authentication
3. Replace localStorage session with secure token management
4. Add SSL/TLS encryption
5. Implement proper error handling and logging
6. Add monitoring and alerting
7. Set up backup and recovery procedures
8. Implement rate limiting and DDoS protection
