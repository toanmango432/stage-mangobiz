import { http, HttpResponse } from 'msw';
import { delay, errorResponse } from '../utils';
import { 
  AIChatRequestSchema, 
  AIChatResponseSchema,
  AIRecommendationRequestSchema,
  AIRecommendationResponseSchema,
  AISearchRequestSchema,
  AISearchResponseSchema,
  AISuggestionsRequestSchema,
  AISuggestionsResponseSchema
} from '@/types/api/ai';

// Canned responses for standalone mode
const cannedResponses = [
  "Welcome to Mango Salon! How can I help you today?",
  "I'd be happy to help you find the perfect service or product!",
  "Our team of experts is here to help you look and feel your best.",
  "What type of service are you interested in? We offer hair, nails, and skincare treatments.",
  "Would you like to book an appointment or browse our products?",
  "I can help you find the right service based on your needs and preferences.",
  "Our salon offers premium beauty services with experienced professionals.",
  "Is there anything specific you'd like to know about our services or products?",
  "I'm here to help you with any questions about our salon or services.",
  "Let me know what you're looking for and I'll do my best to assist you!"
];

const suggestions = [
  "What services do you offer?",
  "How do I book an appointment?",
  "What are your prices?",
  "Do you have any special offers?",
  "What products do you recommend?",
  "Can I see your gallery?",
  "What are your hours?",
  "Do you accept walk-ins?"
];

// Helper function to get canned response
function getCannedResponse(message: string): {
  text: string;
  suggestions: string[];
  actions: any[];
} {
  const lowerMessage = message.toLowerCase();
  
  // Context-aware responses
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
    return {
      text: "I'd be happy to help you book an appointment! You can view our available services and time slots on our booking page. What type of service are you interested in?",
      suggestions: ["Hair services", "Nail services", "Skincare treatments", "View available times"],
      actions: [
        {
          type: 'navigate',
          label: 'Book Appointment',
          payload: { url: '/book' }
        }
      ]
    };
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return {
      text: "Our pricing varies by service type and duration. You can view detailed pricing on our services page, or I can help you find specific information about a particular service.",
      suggestions: ["Hair service prices", "Nail service prices", "Skincare prices", "View all services"],
      actions: [
        {
          type: 'navigate',
          label: 'View Services',
          payload: { url: '/shop' }
        }
      ]
    };
  }
  
  if (lowerMessage.includes('product') || lowerMessage.includes('shop')) {
    return {
      text: "We have a great selection of professional beauty products! You can browse our full catalog in our shop. Are you looking for hair care, skincare, or nail products?",
      suggestions: ["Hair care products", "Skincare products", "Nail products", "View all products"],
      actions: [
        {
          type: 'navigate',
          label: 'Shop Products',
          payload: { url: '/shop' }
        }
      ]
    };
  }
  
  if (lowerMessage.includes('gallery') || lowerMessage.includes('work') || lowerMessage.includes('photos')) {
    return {
      text: "You can see our beautiful work in our gallery! We showcase our latest hair, nail, and skincare transformations there.",
      suggestions: ["View hair gallery", "View nail gallery", "View skincare gallery", "View all work"],
      actions: [
        {
          type: 'navigate',
          label: 'View Gallery',
          payload: { url: '/info/gallery' }
        }
      ]
    };
  }
  
  // Default response
  const randomResponse = cannedResponses[Math.floor(Math.random() * cannedResponses.length)];
  return {
    text: randomResponse,
    suggestions: suggestions.slice(0, 4),
    actions: []
  };
}

// Helper function to get mock recommendations
function getMockRecommendations(context: string, items?: string[]) {
  const recommendations = [
    {
      type: 'service' as const,
      id: 'service-1',
      reason: 'Popular choice for new clients',
      confidence: 0.9,
      metadata: {
        category: 'Hair',
        price: 75,
        imageUrl: '/images/hair-service.jpg'
      }
    },
    {
      type: 'product' as const,
      id: 'product-1',
      reason: 'Complements your service choice',
      confidence: 0.8,
      metadata: {
        category: 'Hair Care',
        price: 25,
        imageUrl: '/images/hair-product.jpg'
      }
    },
    {
      type: 'membership' as const,
      id: 'membership-1',
      reason: 'Save money with our premium membership',
      confidence: 0.7,
      metadata: {
        category: 'Premium',
        price: 199,
        imageUrl: '/images/membership.jpg'
      }
    }
  ];
  
  return recommendations.slice(0, 3);
}

// Helper function to get mock search results
function getMockSearchResults(query: string) {
  const results = [
    {
      type: 'service' as const,
      id: 'service-1',
      title: 'Hair Cut & Style',
      description: 'Professional haircut and styling service',
      relevanceScore: 0.9,
      metadata: {
        category: 'Hair',
        price: 75,
        imageUrl: '/images/hair-cut.jpg',
        availability: true
      }
    },
    {
      type: 'product' as const,
      id: 'product-1',
      title: 'Hair Care Shampoo',
      description: 'Professional hair care shampoo for all hair types',
      relevanceScore: 0.8,
      metadata: {
        category: 'Hair Care',
        price: 25,
        imageUrl: '/images/shampoo.jpg',
        availability: true
      }
    },
    {
      type: 'service' as const,
      id: 'service-2',
      title: 'Manicure & Pedicure',
      description: 'Complete nail care service',
      relevanceScore: 0.7,
      metadata: {
        category: 'Nails',
        price: 60,
        imageUrl: '/images/nail-service.jpg',
        availability: true
      }
    }
  ];
  
  // Filter results based on query
  const filteredResults = results.filter(result => 
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description.toLowerCase().includes(query.toLowerCase())
  );
  
  return filteredResults.length > 0 ? filteredResults : results.slice(0, 2);
}

export const aiHandlers = [
  // Chat endpoint
  http.post('/api/v1/ai/chat', async ({ request }) => {
    await delay();
    if (errorResponse()) return HttpResponse.json({ error: 'Simulated AI error' }, { status: 500 });

    try {
      const body = await request.json();
      const validatedRequest = AIChatRequestSchema.parse(body);
      
      const response = getCannedResponse(validatedRequest.message);
      
      const aiResponse = {
        response: response.text,
        suggestions: response.suggestions,
        actions: response.actions,
        metadata: {
          model: 'mango-ai-mock',
          tokensUsed: response.text.length,
          processingTime: Math.random() * 1000 + 500
        }
      };
      
      return HttpResponse.json(AIChatResponseSchema.parse(aiResponse));
    } catch (error) {
      console.error('AI chat handler error:', error);
      return HttpResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
  }),

  // Recommendations endpoint
  http.post('/api/v1/ai/recommend', async ({ request }) => {
    await delay();
    if (errorResponse()) return HttpResponse.json({ error: 'Simulated AI error' }, { status: 500 });

    try {
      const body = await request.json();
      const validatedRequest = AIRecommendationRequestSchema.parse(body);
      
      const recommendations = getMockRecommendations(validatedRequest.context, validatedRequest.items);
      
      const aiResponse = {
        recommendations,
        metadata: {
          model: 'mango-ai-mock',
          processingTime: Math.random() * 500 + 200
        }
      };
      
      return HttpResponse.json(AIRecommendationResponseSchema.parse(aiResponse));
    } catch (error) {
      console.error('AI recommendations handler error:', error);
      return HttpResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
  }),

  // Search endpoint
  http.post('/api/v1/ai/search', async ({ request }) => {
    await delay();
    if (errorResponse()) return HttpResponse.json({ error: 'Simulated AI error' }, { status: 500 });

    try {
      const body = await request.json();
      const validatedRequest = AISearchRequestSchema.parse(body);
      
      const results = getMockSearchResults(validatedRequest.query);
      
      const aiResponse = {
        results,
        suggestions: ['Try "hair cut"', 'Try "nail art"', 'Try "skincare"'],
        metadata: {
          model: 'mango-ai-mock',
          processingTime: Math.random() * 800 + 300,
          totalResults: results.length
        }
      };
      
      return HttpResponse.json(AISearchResponseSchema.parse(aiResponse));
    } catch (error) {
      console.error('AI search handler error:', error);
      return HttpResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
  }),

  // Suggestions endpoint
  http.get('/api/v1/ai/suggestions', async ({ request }) => {
    await delay();
    if (errorResponse()) return HttpResponse.json({ error: 'Simulated AI error' }, { status: 500 });

    try {
      const url = new URL(request.url);
      const context = url.searchParams.get('context') || 'homepage';
      const limit = parseInt(url.searchParams.get('limit') || '5');
      
      const validatedRequest = AISuggestionsRequestSchema.parse({ context, limit });
      
      const contextSuggestions = {
        homepage: [
          { text: 'What services do you offer?', type: 'question' as const, confidence: 0.9 },
          { text: 'How do I book an appointment?', type: 'action' as const, confidence: 0.8 },
          { text: 'Show me your gallery', type: 'action' as const, confidence: 0.7 }
        ],
        product: [
          { text: 'What products do you recommend?', type: 'question' as const, confidence: 0.9 },
          { text: 'Add to cart', type: 'action' as const, confidence: 0.8 },
          { text: 'View similar products', type: 'action' as const, confidence: 0.7 }
        ],
        service: [
          { text: 'What does this service include?', type: 'question' as const, confidence: 0.9 },
          { text: 'Book this service', type: 'action' as const, confidence: 0.8 },
          { text: 'View before/after photos', type: 'action' as const, confidence: 0.7 }
        ],
        cart: [
          { text: 'Proceed to checkout', type: 'action' as const, confidence: 0.9 },
          { text: 'Add more items', type: 'action' as const, confidence: 0.8 },
          { text: 'Apply discount code', type: 'action' as const, confidence: 0.7 }
        ],
        checkout: [
          { text: 'Complete purchase', type: 'action' as const, confidence: 0.9 },
          { text: 'Add gift card', type: 'action' as const, confidence: 0.8 },
          { text: 'Change payment method', type: 'action' as const, confidence: 0.7 }
        ]
      };
      
      const suggestions = (contextSuggestions[context as keyof typeof contextSuggestions] || contextSuggestions.homepage)
        .slice(0, validatedRequest.limit);
      
      const aiResponse = {
        suggestions,
        metadata: {
          model: 'mango-ai-mock',
          processingTime: Math.random() * 200 + 100
        }
      };
      
      return HttpResponse.json(AISuggestionsResponseSchema.parse(aiResponse));
    } catch (error) {
      console.error('AI suggestions handler error:', error);
      return HttpResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
  })
];