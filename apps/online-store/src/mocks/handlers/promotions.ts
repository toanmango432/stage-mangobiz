import { http, HttpResponse } from 'msw';
import { PromotionsResponseSchema } from '@/types/api/schemas';

// In-memory data storage
let promotionsData: any[] = [];

// Load seed data
async function loadPromotionsData() {
  try {
    // Check if we're in a test environment
    const isTestEnv = typeof window === 'undefined' || process.env.NODE_ENV === 'test';
    
      if (isTestEnv) {
        // Use mock data for tests with valid UUIDs
        promotionsData = [
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            publicId: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Test Promotion',
            description: 'A test promotion',
            code: 'TEST20',
            type: 'percentage',
            value: 20,
            startsAt: '2025-01-01T00:00:00Z',
            endsAt: '2025-12-31T23:59:59Z',
            isActive: true,
            usageCount: 0,
            displaySettings: {
              showInHero: false,
              showInBanner: true,
              priority: 5,
            }
          }
        ];
      } else {
      // Load from seed files in browser
      const promotions = await fetch('/seed/promotions.json').then(r => r.json());
      promotionsData = promotions;
    }
  } catch (error) {
    console.error('Failed to load promotions data:', error);
  }
}

// Load data on module initialization
loadPromotionsData();

// Helper function to add latency and simulate errors
async function simulateLatency() {
  const latency = 100 + Math.random() * 200; // 100-300ms
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Simulate random 500 errors if MOCK_TURBULENCE is enabled
  if (__MOCK_TURBULENCE__ && Math.random() < 0.01) {
    throw new Error('Simulated server error');
  }
}

// Check if promotion is valid
function isPromotionValid(promotion: any): boolean {
  const now = new Date();
  const startsAt = new Date(promotion.startsAt);
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
  
  return promotion.isActive && 
         startsAt <= now && 
         (!endsAt || endsAt >= now) &&
         (!promotion.usageLimit || promotion.usageCount < promotion.usageLimit);
}

// Get active promotions
function getActivePromotions() {
  return promotionsData.filter(isPromotionValid);
}

export const promotionHandlers = [
  // GET /api/v1/promotions
  http.get('/api/v1/promotions', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const active = url.searchParams.get('active') === 'true';
    
    let filteredPromotions = promotionsData;
    if (active) {
      filteredPromotions = getActivePromotions();
    }

    const result = { data: filteredPromotions };
    const validatedResult = PromotionsResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/promotions/:code/validate
  http.get('/api/v1/promotions/:code/validate', async ({ params }) => {
    await simulateLatency();
    
    const promotion = promotionsData.find(p => p.code === params.code);
    
    if (!promotion) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Promotion code not found' } },
        { status: 404 }
      );
    }

    const isValid = isPromotionValid(promotion);
    
    return HttpResponse.json({
      valid: isValid,
      promotion: isValid ? promotion : null,
      message: isValid ? 'Promotion code is valid' : 'Promotion code is not valid or has expired'
    });
  }),

  // POST /api/v1/promotions/apply
  http.post('/api/v1/promotions/apply', async ({ request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    const { code, cartTotal, items } = body;
    
    if (!code) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'Promotion code is required' } },
        { status: 400 }
      );
    }

    const promotion = promotionsData.find(p => p.code === code);
    
    if (!promotion) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Promotion code not found' } },
        { status: 404 }
      );
    }

    if (!isPromotionValid(promotion)) {
      return HttpResponse.json(
        { error: { code: 'INVALID_PROMOTION', message: 'Promotion code is not valid or has expired' } },
        { status: 400 }
      );
    }

    // Check minimum purchase amount
    if (promotion.minPurchaseAmount && cartTotal < promotion.minPurchaseAmount) {
      return HttpResponse.json(
        { error: { code: 'MIN_PURCHASE_NOT_MET', message: `Minimum purchase amount of $${promotion.minPurchaseAmount} required` } },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (promotion.type === 'percentage') {
      discount = cartTotal * (promotion.value / 100);
    } else if (promotion.type === 'fixed_amount') {
      discount = promotion.value;
    }

    // Apply maximum discount limit
    if (promotion.maxDiscountAmount) {
      discount = Math.min(discount, promotion.maxDiscountAmount);
    }

    // Check applicable services/products
    if (promotion.applicableServices && items) {
      const hasApplicableService = items.some((item: any) => 
        item.type === 'service' && promotion.applicableServices.includes(item.itemId)
      );
      if (!hasApplicableService) {
        return HttpResponse.json(
          { error: { code: 'NOT_APPLICABLE', message: 'Promotion code is not applicable to items in cart' } },
          { status: 400 }
        );
      }
    }

    if (promotion.applicableProducts && items) {
      const hasApplicableProduct = items.some((item: any) => 
        item.type === 'product' && promotion.applicableProducts.includes(item.itemId)
      );
      if (!hasApplicableProduct) {
        return HttpResponse.json(
          { error: { code: 'NOT_APPLICABLE', message: 'Promotion code is not applicable to items in cart' } },
          { status: 400 }
        );
      }
    }

    return HttpResponse.json({
      valid: true,
      discount: Math.round(discount * 100) / 100,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
      }
    });
  }),

  // GET /api/v1/store/promotions/analytics
  http.get('/api/v1/store/promotions/analytics', async () => {
    await simulateLatency();
    
    // Mock analytics data
    const analytics = {
      totalPromotions: promotionsData.length,
      activePromotions: getActivePromotions().length,
      totalUsage: promotionsData.reduce((sum, p) => sum + p.usageCount, 0),
      topPromotions: promotionsData
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          usageCount: p.usageCount,
          conversionRate: Math.random() * 0.3 + 0.1, // Mock conversion rate
        })),
      recentActivity: [
        {
          id: '1',
          promotion: 'WELCOME20',
          action: 'applied',
          timestamp: new Date().toISOString(),
          value: 15.00,
        },
        {
          id: '2',
          promotion: 'HOLIDAY25',
          action: 'applied',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          value: 25.00,
        },
      ]
    };
    
    return HttpResponse.json(analytics);
  }),
];
