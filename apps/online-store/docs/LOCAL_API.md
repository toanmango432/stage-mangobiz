# Local API Documentation

## Overview

The Mango Online Store now uses a **local mock API system** instead of Supabase Edge Functions. This provides a clean, self-contained architecture that's ready for future database migration.

## Architecture

```
src/lib/api/
├── local/                    # Local mock implementations
│   ├── chat.ts              # Chat API (replaces Supabase chat function)
│   ├── store.ts             # Store API (replaces Supabase store function)
│   ├── config.ts            # API configuration
│   └── types.ts             # Type definitions
├── store.ts                 # Main API client (updated to use local)
├── promotions.ts            # Promotions API
├── marketing-settings.ts    # Marketing API
└── ai.ts                    # AI API
```

## Local API Features

### ✅ **Chat API** (`src/lib/api/local/chat.ts`)

**Functions:**
- `handleChatMessage(sessionId, message, pageContext)` - Process chat messages
- `startChatSession(sessionId?)` - Initialize chat session
- `getChatSuggestions(page)` - Get contextual suggestions
- `isRateLimited(identifier)` - Check rate limiting

**Features:**
- Gemini AI integration via Lovable AI gateway
- Tool calling for services, availability, navigation
- Rate limiting (10 requests per 30 seconds)
- Fallback responses for offline scenarios
- Mock Mango client data

### ✅ **Store API** (`src/lib/api/local/store.ts`)

**Functions:**
- `getSalonInfo()` - Salon information
- `getReviews(params)` - Reviews with filtering
- `getReviewServices()` - Available services for reviews
- `getReviewStaff()` - Staff members for reviews
- `getGallery(params)` - Gallery items with filtering
- `getTeamMembers()` - Team member list
- `getTeamMember(id)` - Individual team member
- `getMarketingSettings()` - Marketing display settings
- `updateMarketingSettings(updates)` - Update marketing settings
- `updatePromotionPlacement(id, update)` - Update promotion placement
- `updateAnnouncementPlacement(id, update)` - Update announcement placement
- `applyPromotionToCart(sessionId, promotionId)` - Apply promotion to cart
- `getFAQ()` - FAQ data
- `getPolicies()` - Salon policies

**Features:**
- In-memory data storage
- Simulated network delays
- Comprehensive mock data
- Marketing settings management
- Error handling with fallbacks

## Configuration

### Environment Variables

**Required:**
```bash
VITE_LOVABLE_API_KEY=your_lovable_api_key
```

**Removed (no longer needed):**
```bash
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### API Configuration (`src/lib/api/local/config.ts`)

```typescript
export const LOCAL_API_CONFIG = {
  CHAT_API_URL: '/api/local/chat',
  STORE_API_URL: '/api/local/store',
  
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 30000, // 30 seconds
  },
  
  AI: {
    PROVIDER: 'gemini',
    MODEL: 'google/gemini-2.5-flash',
    GATEWAY_URL: 'https://ai.gateway.lovable.dev/v1/chat/completions',
  },
  
  MOCK_DATA: {
    ENABLE_DELAYS: true, // Simulate network delays
    DEFAULT_DELAY: 1000, // 1 second
  }
};
```

## Data Storage

### Current Implementation
- **In-memory storage** for all data
- **localStorage** for user preferences and sessions
- **No external database** dependencies

### Mock Data Sources
- Salon information and team data
- Reviews and gallery items
- Services and products
- Marketing settings and promotions
- FAQ and policies

## Migration Benefits

### ✅ **Simplified Architecture**
- No external service dependencies
- Faster local development
- Easier debugging and testing
- Reduced complexity

### ✅ **Future-Ready**
- Clean separation of concerns
- Easy to migrate to real database
- Mock data structure matches expected schema
- API interfaces remain consistent

### ✅ **Performance**
- No network latency for mock data
- Configurable delays for realistic testing
- Direct function calls (no HTTP overhead)
- Faster build and startup times

## Usage Examples

### Chat API
```typescript
import { handleChatMessage, startChatSession } from '@/lib/api/local/chat';

// Start chat session
const session = await startChatSession();
console.log(session.greeting); // "Hi! I'm Mango Assistant 🤍..."

// Send message
const response = await handleChatMessage(
  session.sessionId, 
  "What services do you offer?", 
  "/book"
);
console.log(response.message); // AI response
console.log(response.cards); // Service cards
```

### Store API
```typescript
import { getSalonInfo, getReviews } from '@/lib/api/local/store';

// Get salon information
const salonInfo = await getSalonInfo();
console.log(salonInfo?.name); // "Mango Nail & Beauty Salon"

// Get reviews with filtering
const reviews = await getReviews({
  limit: 10,
  offset: 0,
  minRating: 4
});
console.log(reviews.reviews); // Array of reviews
```

## Future Database Migration

When ready to add a real database:

### Option 1: PostgreSQL Direct
```typescript
// Replace local functions with database calls
export async function getSalonInfo(): Promise<SalonInfo | null> {
  const client = new Pool({ connectionString: DATABASE_URL });
  const result = await client.query('SELECT * FROM salon_info LIMIT 1');
  return result.rows[0] || null;
}
```

### Option 2: Prisma ORM
```typescript
// Use Prisma for type-safe database access
export async function getSalonInfo(): Promise<SalonInfo | null> {
  return await prisma.salonInfo.findFirst();
}
```

### Option 3: Mango Backend Integration
```typescript
// Connect to existing Mango API
export async function getSalonInfo(): Promise<SalonInfo | null> {
  const response = await fetch(`${MANGO_API_URL}/salon-info`);
  return await response.json();
}
```

## Development Workflow

### Local Development
1. **Start dev server:** `npm run dev`
2. **All APIs work locally** - no external setup needed
3. **Mock data loads automatically** - no database seeding required
4. **AI chat works** - requires `VITE_LOVABLE_API_KEY`

### Testing
1. **Unit tests** - test local functions directly
2. **Integration tests** - test API client functions
3. **E2E tests** - test full user workflows
4. **No external dependencies** - tests run faster

### Production Deployment
1. **Build:** `npm run build` - works without external services
2. **Deploy:** Static files + environment variables
3. **Database migration** - when ready, replace local functions
4. **Zero downtime** - gradual migration possible

## Troubleshooting

### Common Issues

**Chat not working:**
- Check `VITE_LOVABLE_API_KEY` is set
- Verify Lovable AI gateway is accessible
- Check browser console for errors

**Data not loading:**
- Check browser console for API errors
- Verify local functions are imported correctly
- Check mock data is properly structured

**Build errors:**
- Run `npm install` to ensure dependencies are clean
- Check for any remaining Supabase imports
- Verify TypeScript types are correct

### Debug Mode

Enable debug logging:
```typescript
// In src/lib/api/local/config.ts
export const LOCAL_API_CONFIG = {
  // ... other config
  DEBUG: true, // Enable console logging
  MOCK_DATA: {
    ENABLE_DELAYS: false, // Disable delays for faster testing
  }
};
```

## API Reference

### Chat API Types
```typescript
interface ChatResponse {
  sessionId: string;
  message: string;
  cards?: ChatCard[];
  suggestions?: string[];
}

interface ChatCard {
  type: 'service' | 'availability' | 'navigation';
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  action?: { label: string; path: string };
  slots?: string[];
  path?: string;
  label?: string;
}
```

### Store API Types
```typescript
interface StoreApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MangoService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}
```

## Support

For questions or issues with the local API:

1. **Check this documentation** first
2. **Review the code** in `src/lib/api/local/`
3. **Test individual functions** in browser console
4. **Check browser network tab** for any failed requests

The local API is designed to be self-contained and easy to understand. All functions include comprehensive error handling and fallbacks.
