# Mango Online Store - Standalone Mode

This document explains how to use the Mango Online Store in standalone mode, which provides a fully functional demo environment using Mock Service Worker (MSW) to intercept API calls.

## Quick Start

### Running in Standalone Mode

```bash
# Set environment to standalone mode (default)
MODE=standalone npm run dev

# Or explicitly set it
export MODE=standalone
npm run dev
```

The application will start on `http://localhost:8080` with all API calls intercepted by MSW.

### Running in Connected Mode

```bash
# Set environment to connected mode
MODE=connected npm run dev
```

In connected mode, the application will make real API calls to your backend services.

## Features

### Demo Mode Features
- **Fully Functional Storefront**: Browse services, products, and book appointments
- **Complete Booking Flow**: Select services, choose time slots, and confirm appointments
- **Shopping Cart & Checkout**: Add items to cart and complete purchases
- **Promotions**: Apply discount codes and see them reflected in pricing
- **Announcements**: View salon announcements and updates
- **AI Chat**: Interactive chat with AI assistant (using canned responses)
- **Admin Dashboard**: Full admin interface for managing content

### Data Sources
All data comes from seed JSON files in `/public/seed/`:
- `tenant.json` - Salon configuration and contact info
- `services.json` - Available beauty services
- `products.json` - Retail products catalog
- `memberships.json` - Membership tiers and benefits
- `gift-cards.json` - Gift card options
- `team.json` - Staff profiles and specialties
- `reviews.json` - Customer reviews and ratings
- `gallery.json` - Work portfolio images
- `promotions.json` - Active promotions and discount codes
- `announcements.json` - Salon announcements and updates
- `ai-suggestions.json` - Canned AI responses

## Customizing Demo Data

### Editing Seed Files

1. **Navigate to `/public/seed/`** directory
2. **Edit any JSON file** with your desired data
3. **Refresh the browser** - changes are loaded automatically
4. **Check browser console** for validation errors

### Example: Adding a New Service

Edit `/public/seed/services.json`:

```json
{
  "id": "new-service-id",
  "publicId": "new-service-public-id",
  "name": "New Service",
  "description": "Description of the new service",
  "category": "hair",
  "duration": 90,
  "price": 120.00,
  "image": "/path/to/image.jpg",
  "isActive": true,
  "isBookableOnline": true,
  "requirements": ["Clean hair preferred"],
  "benefits": ["Expert styling", "Quality products"]
}
```

### Example: Adding a Promotion

Edit `/public/seed/promotions.json`:

```json
{
  "id": "new-promo-id",
  "publicId": "new-promo-public-id",
  "name": "Special Offer",
  "description": "20% off all services",
  "code": "SPECIAL20",
  "type": "percentage",
  "value": 20,
  "startsAt": "2025-01-01T00:00:00Z",
  "endsAt": "2025-12-31T23:59:59Z",
  "isActive": true,
  "displaySettings": {
    "showInHero": true,
    "showInBanner": true,
    "priority": 8
  }
}
```

## API Endpoints

The standalone mode provides the following API endpoints:

### Storefront APIs
- `GET /api/v1/storefront/services` - List all services
- `GET /api/v1/storefront/services/:id` - Get service details
- `GET /api/v1/storefront/products` - List all products
- `GET /api/v1/storefront/products/:id` - Get product details
- `GET /api/v1/storefront/memberships` - List membership tiers
- `GET /api/v1/storefront/gift-cards` - List gift card options
- `GET /api/v1/storefront/team` - List team members
- `GET /api/v1/storefront/reviews` - List customer reviews
- `GET /api/v1/storefront/gallery` - List gallery items
- `GET /api/v1/storefront/info` - Get salon information

### Booking APIs
- `GET /api/v1/booking/availability` - Get available time slots
- `POST /api/v1/booking/draft` - Create booking draft
- `GET /api/v1/booking/draft/:id` - Get booking draft
- `POST /api/v1/booking/confirm` - Confirm booking
- `GET /api/v1/booking/:id` - Get booking details

### Cart APIs
- `POST /api/v1/cart/session` - Create cart session
- `GET /api/v1/cart/session/:id` - Get cart details
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:lineId` - Update cart item
- `DELETE /api/v1/cart/items/:lineId` - Remove cart item
- `POST /api/v1/cart/checkout` - Complete checkout

### Promotion APIs
- `GET /api/v1/promotions` - List active promotions
- `GET /api/v1/promotions/:code/validate` - Validate promotion code
- `POST /api/v1/promotions/apply` - Apply promotion to cart

### Announcement APIs
- `GET /api/v1/store/announcements` - List announcements
- `POST /api/v1/store/announcements` - Create announcement
- `PUT /api/v1/store/announcements/:id` - Update announcement
- `DELETE /api/v1/store/announcements/:id` - Delete announcement

### AI APIs
- `POST /api/v1/ai/query` - Send AI query
- `GET /api/v1/ai/suggestions` - Get AI suggestions

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Application Mode
MODE=standalone

# Mock API Configuration
MOCK_TURBULENCE=false

# AI Features
FEATURE_AI=true
AI_PROVIDER_KEY=your_key_here

# Development Settings
VITE_DEV_SERVER_PORT=8080
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Mock Turbulence

Enable random errors and latency simulation:

```bash
MOCK_TURBULENCE=true npm run dev
```

This will:
- Add 100-300ms latency to all requests
- Inject 1% random 500 errors
- Help test error handling

## Troubleshooting

### Common Issues

#### 1. Seed Data Not Loading
**Problem**: API calls return empty data or errors
**Solution**: 
- Check browser console for validation errors
- Ensure seed files are valid JSON
- Verify file paths in `/public/seed/`

#### 2. MSW Not Starting
**Problem**: API calls go to real endpoints instead of being intercepted
**Solution**:
- Check that `MODE=standalone` is set
- Look for MSW startup messages in console
- Ensure `mockServiceWorker.js` exists in `/public/`

#### 3. Validation Errors
**Problem**: Console shows Zod validation errors
**Solution**:
- Check seed file structure matches schemas in `/src/types/api/schemas.ts`
- Ensure required fields are present
- Verify data types match schema expectations

#### 4. Demo Ribbon Not Showing
**Problem**: Demo ribbon doesn't appear
**Solution**:
- Check that `MODE=standalone` is set
- Clear localStorage: `localStorage.removeItem('demo-ribbon-dismissed')`
- Refresh the page

### Debug Mode

Enable detailed logging:

```bash
# In browser console
localStorage.setItem('debug', 'msw:*')
```

### Resetting Demo Data

Clear all demo state:

```bash
# In browser console
localStorage.clear()
sessionStorage.clear()
```

## Development

### Adding New API Endpoints

1. **Create handler** in `/src/mocks/handlers/`
2. **Add to handlers index** in `/src/mocks/handlers/index.ts`
3. **Update API client** in `/src/lib/api-client/index.ts`
4. **Add Zod schema** in `/src/types/api/schemas.ts`

### Testing API Changes

1. **Edit seed data** in `/public/seed/`
2. **Modify handlers** in `/src/mocks/handlers/`
3. **Refresh browser** to see changes
4. **Check console** for validation errors

## Production Deployment

### Switching to Connected Mode

1. **Set environment**: `MODE=connected`
2. **Configure API endpoints** in your backend
3. **Deploy with real data sources**
4. **Test all functionality** with live data

### Building for Production

```bash
# Build with standalone mode
MODE=standalone npm run build

# Build with connected mode
MODE=connected npm run build
```

## Support

For issues with standalone mode:

1. **Check this README** for common solutions
2. **Review browser console** for error messages
3. **Validate seed data** against schemas
4. **Test with MOCK_TURBULENCE=false** to isolate issues

---

*Standalone mode provides a complete demo environment for testing and showcasing the Mango Online Store without requiring backend services.*




