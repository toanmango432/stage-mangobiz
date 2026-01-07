# Integration Guide

This guide provides instructions for integrating Mango Online Store with external services.

## For Mango Biz Team

### API Endpoints Store Needs from Biz

The Store requires the following endpoints from Mango Biz:

#### Services
- `GET /biz-api/v1/sync/services` - Retrieve all active services
- `GET /biz-api/v1/sync/services/{id}` - Get specific service details

#### Products
- `GET /biz-api/v1/sync/products` - Retrieve all active products
- `GET /biz-api/v1/sync/products/{id}` - Get specific product details

#### Staff
- `GET /biz-api/v1/sync/staff` - Retrieve all bookable staff members
- `GET /biz-api/v1/sync/staff/{id}` - Get specific staff details

#### Bookings
- `POST /biz-api/v1/bookings` - Create confirmed booking
- `GET /biz-api/v1/bookings/{id}` - Get booking details
- `PUT /biz-api/v1/bookings/{id}` - Update booking
- `DELETE /biz-api/v1/bookings/{id}` - Cancel booking

#### Availability
- `GET /biz-api/v1/availability/slots` - Get available time slots
- `GET /biz-api/v1/availability/blackouts` - Get blackout periods

### Webhook Events Biz Should Send to Store

Configure these webhooks in Mango Biz to notify Store of changes:

#### Service Updates
- `POST /webhooks/services/updated` - Service price, availability, or details changed
- `POST /webhooks/services/deleted` - Service removed or deactivated

#### Product Updates
- `POST /webhooks/products/updated` - Product price, stock, or details changed
- `POST /webhooks/products/deleted` - Product removed or deactivated

#### Staff Updates
- `POST /webhooks/staff/updated` - Staff availability or details changed
- `POST /webhooks/staff/deleted` - Staff removed or deactivated

#### Booking Updates
- `POST /webhooks/bookings/created` - New booking confirmed
- `POST /webhooks/bookings/updated` - Booking modified
- `POST /webhooks/bookings/cancelled` - Booking cancelled

### Data Sync Requirements

#### Sync Frequency
- **Real-time**: Bookings, availability changes
- **5 minutes**: Service/product price changes
- **1 hour**: Staff schedule updates
- **Daily**: Full catalog sync

#### Data Format
All data should be in JSON format with the following structure:

```json
{
  "data": {
    "id": "service_123",
    "name": "Hair Cut & Style",
    "description": "Professional haircut and styling",
    "category": "hair",
    "duration": 60,
    "price": 75.00,
    "isActive": true,
    "isBookableOnline": true
  },
  "metadata": {
    "syncId": "sync_456",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": 1
  }
}
```

### Testing Integration

1. **Set up test environment** with Store in connected mode
2. **Configure webhooks** to point to Store test instance
3. **Test data sync** by updating records in Biz
4. **Verify webhook delivery** in Store logs
5. **Test booking flow** end-to-end

## For AI Service Team

### API Contract Store Expects

The Store expects the following AI Service endpoints:

#### Chat
- `POST /api/v1/ai/chat` - Send message, get response
- Request: `{ sessionId, message, context? }`
- Response: `{ response, suggestions?, actions? }`

#### Recommendations
- `POST /api/v1/ai/recommend` - Get personalized recommendations
- Request: `{ userId?, context, items?, limit? }`
- Response: `{ recommendations: [{ type, id, reason, confidence }] }`

#### Search
- `POST /api/v1/ai/search` - AI-powered search
- Request: `{ query, filters?, limit?, offset? }`
- Response: `{ results: [{ type, id, title, description, relevanceScore }] }`

#### Suggestions
- `GET /api/v1/ai/suggestions` - Contextual quick replies
- Request: `?context=homepage&limit=5`
- Response: `{ suggestions: [{ text, type, confidence }] }`

### Request/Response Formats

See `docs/api/store-to-ai.openapi.yaml` for complete API specification.

### Rate Limiting Requirements

- **Chat**: 100 requests per minute per session
- **Recommendations**: 50 requests per minute per user
- **Search**: 200 requests per minute per IP
- **Suggestions**: 100 requests per minute per session

### Fallback Behavior

When AI Service is unavailable:
- **Chat**: Show "AI temporarily unavailable" message
- **Recommendations**: Hide recommendation sections
- **Search**: Fall back to basic text search
- **Suggestions**: Show static suggestions

### Error Handling

The Store expects these error codes:
- `RATE_LIMITED` - Rate limit exceeded
- `QUOTA_EXCEEDED` - API quota exceeded
- `MODEL_UNAVAILABLE` - AI model not available
- `INVALID_REQUEST` - Malformed request
- `INTERNAL_ERROR` - Server error

## For Frontend Developers

### Adding New Features

#### 1. API Calls
Use the centralized API client:

```typescript
import { storeAPI, aiAPI } from '@/lib/api-client/clients';

// Make API call
const response = await storeAPI.get('/services');
if (response.success) {
  // Handle success
  const services = response.data;
} else {
  // Handle error
  console.error(response.error);
}
```

#### 2. Error Handling
Always handle errors gracefully:

```typescript
try {
  const response = await storeAPI.get('/services');
  if (!response.success) {
    throw new Error(response.error?.message || 'Request failed');
  }
  return response.data;
} catch (error) {
  console.error('API call failed:', error);
  // Return fallback data or show error message
  return [];
}
```

#### 3. Caching Strategy
- **Static data**: Cache for 1 hour
- **User data**: Cache for 5 minutes
- **Real-time data**: No cache

#### 4. Testing in Standalone Mode
- Use MSW handlers for API mocking
- Test with different error scenarios
- Verify fallback behavior

### Adding New API Endpoints

1. **Create MSW handler** in `src/mocks/handlers/`
2. **Add to OpenAPI spec** in `docs/api/`
3. **Create TypeScript types** in `src/types/api/`
4. **Add to API client** in `src/lib/api-client/`
5. **Write tests** in `src/__tests__/`

### Environment Configuration

#### Standalone Mode (Development)
```env
MODE=standalone
FEATURE_AI=true
MOCK_TURBULENCE=false
```

#### Connected Mode (Production)
```env
MODE=connected
VITE_STORE_API_URL=https://api.mango.com/v1
VITE_AI_API_URL=https://ai.mango.com/api/v1/ai
VITE_BIZ_API_URL=https://biz.mango.com/api/v1
```

## Integration Checklist

### Mango Biz Integration
- [ ] API endpoints implemented
- [ ] Webhook events configured
- [ ] Data sync tested
- [ ] Error handling verified
- [ ] Rate limiting configured
- [ ] Authentication setup
- [ ] Monitoring configured

### AI Service Integration
- [ ] API endpoints implemented
- [ ] Request/response formats validated
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Fallback behavior tested
- [ ] Authentication setup
- [ ] Monitoring configured

### Store Configuration
- [ ] Environment variables set
- [ ] API clients configured
- [ ] Error boundaries implemented
- [ ] Fallback UI created
- [ ] Monitoring configured
- [ ] Tests written
- [ ] Documentation updated

## Troubleshooting

### Common Issues

#### API Connection Errors
- Check environment variables
- Verify API endpoints are accessible
- Check authentication credentials
- Review network connectivity

#### Data Sync Issues
- Check webhook delivery
- Verify data format matches schema
- Review sync frequency settings
- Check for data conflicts

#### Performance Issues
- Review caching configuration
- Check API response times
- Monitor memory usage
- Review database queries

### Debug Tools

#### MSW Debugging
```javascript
// Enable MSW debugging
localStorage.setItem('msw-debug', 'true');
```

#### API Client Debugging
```javascript
// Enable API client logging
localStorage.setItem('api-debug', 'true');
```

#### Network Monitoring
- Use browser DevTools Network tab
- Check API response times
- Monitor error rates
- Review request/response payloads




