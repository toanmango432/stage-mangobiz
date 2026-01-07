import { http, HttpResponse } from 'msw';
import { ServicesResponseSchema, ProductsResponseSchema, MembershipsResponseSchema, GiftCardsResponseSchema, TeamResponseSchema, ReviewsResponseSchema, GalleryResponseSchema } from '@/types/api/schemas';

// In-memory data storage
let servicesData: any[] = [];
let productsData: any[] = [];
let membershipsData: any[] = [];
let giftCardsData: any[] = [];
let teamData: any[] = [];
let reviewsData: any[] = [];
let galleryData: any[] = [];

// Load seed data
async function loadSeedData() {
  try {
    // Check if we're in a test environment
    const isTestEnv = typeof window === 'undefined' || process.env.NODE_ENV === 'test';
    
      if (isTestEnv) {
        // Use mock data for tests with valid UUIDs
        servicesData = [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            publicId: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Test Service',
            description: 'A test service',
            category: 'hair',
            duration: 60,
            price: 75.00,
            isActive: true,
            isBookableOnline: true,
          }
        ];
        productsData = [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            publicId: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Test Product',
            description: 'A test product',
            price: 25.00,
            category: 'hair',
            stockStatus: 'in_stock',
            isActive: true,
          }
        ];
        membershipsData = [];
        giftCardsData = [];
        teamData = [];
        reviewsData = [];
        galleryData = [];
      } else {
      // Load from seed files in browser
      const [services, products, memberships, giftCards, team, reviews, gallery] = await Promise.all([
        fetch('/seed/services.json').then(r => r.json()),
        fetch('/seed/products.json').then(r => r.json()),
        fetch('/seed/memberships.json').then(r => r.json()),
        fetch('/seed/gift-cards.json').then(r => r.json()),
        fetch('/seed/team.json').then(r => r.json()),
        fetch('/seed/reviews.json').then(r => r.json()),
        fetch('/seed/gallery.json').then(r => r.json()),
      ]);

      servicesData = services;
      productsData = products;
      membershipsData = memberships;
      giftCardsData = giftCards;
      teamData = team;
      reviewsData = reviews;
      galleryData = gallery;
    }
  } catch (error) {
    console.error('Failed to load seed data:', error);
  }
}

// Load data on module initialization
loadSeedData();

// Helper function to add latency and simulate errors
async function simulateLatency() {
  const latency = 100 + Math.random() * 200; // 100-300ms
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Simulate random 500 errors if MOCK_TURBULENCE is enabled
  if (__MOCK_TURBULENCE__ && Math.random() < 0.01) {
    throw new Error('Simulated server error');
  }
}

// Helper function to paginate data
function paginateData<T>(data: T[], page: number = 1, limit: number = 20) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      hasMore: endIndex < data.length,
    }
  };
}

// Helper function to filter services
function filterServices(filters: {
  category?: string;
  isActive?: boolean;
  isBookableOnline?: boolean;
  minPrice?: number;
  maxPrice?: number;
}) {
  return servicesData.filter(service => {
    if (filters.category && service.category !== filters.category) return false;
    if (filters.isActive !== undefined && service.isActive !== filters.isActive) return false;
    if (filters.isBookableOnline !== undefined && service.isBookableOnline !== filters.isBookableOnline) return false;
    if (filters.minPrice !== undefined && service.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && service.price > filters.maxPrice) return false;
    return true;
  });
}

// Helper function to filter products
function filterProducts(filters: {
  category?: string;
  isActive?: boolean;
  stockStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) {
  return productsData.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.isActive !== undefined && product.isActive !== filters.isActive) return false;
    if (filters.stockStatus && product.stockStatus !== filters.stockStatus) return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!product.name.toLowerCase().includes(searchLower) && 
          !product.description?.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });
}

export const storefrontHandlers = [
  // GET /api/v1/storefront/services
  http.get('/api/v1/storefront/services', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category') || undefined;
    const isActive = url.searchParams.get('isActive') === 'true' ? true : url.searchParams.get('isActive') === 'false' ? false : undefined;
    const isBookableOnline = url.searchParams.get('isBookableOnline') === 'true' ? true : url.searchParams.get('isBookableOnline') === 'false' ? false : undefined;
    const minPrice = url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')!) : undefined;
    const maxPrice = url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')!) : undefined;

    const filteredServices = filterServices({
      category,
      isActive,
      isBookableOnline,
      minPrice,
      maxPrice,
    });

    const result = paginateData(filteredServices, page, limit);
    
    // Validate response
    const validatedResult = ServicesResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/storefront/services/:id
  http.get('/api/v1/storefront/services/:id', async ({ params }) => {
    await simulateLatency();
    
    const service = servicesData.find(s => s.id === params.id || s.publicId === params.id);
    
    if (!service) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json(service);
  }),

  // GET /api/v1/storefront/products
  http.get('/api/v1/storefront/products', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category') || undefined;
    const isActive = url.searchParams.get('isActive') === 'true' ? true : url.searchParams.get('isActive') === 'false' ? false : undefined;
    const stockStatus = url.searchParams.get('stockStatus') || undefined;
    const minPrice = url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')!) : undefined;
    const maxPrice = url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')!) : undefined;
    const search = url.searchParams.get('search') || undefined;

    const filteredProducts = filterProducts({
      category,
      isActive,
      stockStatus,
      minPrice,
      maxPrice,
      search,
    });

    const result = paginateData(filteredProducts, page, limit);
    
    // Validate response
    const validatedResult = ProductsResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/storefront/products/:id
  http.get('/api/v1/storefront/products/:id', async ({ params }) => {
    await simulateLatency();
    
    const product = productsData.find(p => p.id === params.id || p.publicId === params.id);
    
    if (!product) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json(product);
  }),

  // GET /api/v1/storefront/memberships
  http.get('/api/v1/storefront/memberships', async () => {
    await simulateLatency();
    
    const result = { data: membershipsData };
    const validatedResult = MembershipsResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/storefront/gift-cards
  http.get('/api/v1/storefront/gift-cards', async () => {
    await simulateLatency();
    
    const result = { data: giftCardsData };
    const validatedResult = GiftCardsResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/storefront/team
  http.get('/api/v1/storefront/team', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const isBookableOnline = url.searchParams.get('isBookableOnline') === 'true';
    
    let filteredTeam = teamData;
    if (isBookableOnline) {
      filteredTeam = teamData.filter(member => member.isBookableOnline);
    }

    const result = { data: filteredTeam };
    const validatedResult = TeamResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/storefront/reviews
  http.get('/api/v1/storefront/reviews', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const serviceId = url.searchParams.get('serviceId') || undefined;

    let filteredReviews = reviewsData;
    if (serviceId) {
      filteredReviews = reviewsData.filter(review => review.serviceId === serviceId);
    }

    const paginatedResult = paginateData(filteredReviews, page, limit);
    
    // Calculate aggregate ratings
    const aggregate = {
      count: filteredReviews.length,
      average: filteredReviews.reduce((sum, review) => sum + review.rating, 0) / filteredReviews.length || 0,
      distribution: {
        five: filteredReviews.filter(r => r.rating === 5).length,
        four: filteredReviews.filter(r => r.rating === 4).length,
        three: filteredReviews.filter(r => r.rating === 3).length,
        two: filteredReviews.filter(r => r.rating === 2).length,
        one: filteredReviews.filter(r => r.rating === 1).length,
      }
    };

    const result = {
      ...paginatedResult,
      aggregate
    };
    
    const validatedResult = ReviewsResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/storefront/gallery
  http.get('/api/v1/storefront/gallery', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category') || undefined;
    const featured = url.searchParams.get('featured') === 'true';

    let filteredGallery = galleryData;
    if (category) {
      filteredGallery = filteredGallery.filter(item => item.category === category);
    }
    if (featured) {
      filteredGallery = filteredGallery.filter(item => item.featured);
    }

    // Sort by order
    filteredGallery.sort((a, b) => a.order - b.order);

    const result = paginateData(filteredGallery, page, limit);
    const validatedResult = GalleryResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/storefront/info
  http.get('/api/v1/storefront/info', async () => {
    await simulateLatency();
    
    // Load tenant info
    const tenantResponse = await fetch('/seed/tenant.json');
    const tenant = await tenantResponse.json();
    
    return HttpResponse.json(tenant);
  }),
];
