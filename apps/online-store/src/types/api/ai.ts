// AI Service API types
export interface AIChatRequest {
  sessionId: string;
  message: string;
  context?: {
    page?: string;
    cart?: CartSummary;
    user?: UserContext;
    previousMessages?: ChatMessage[];
  };
}

export interface AIChatResponse {
  response: string;
  suggestions?: string[];
  actions?: AIAction[];
  metadata?: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
}

export interface AIRecommendationRequest {
  userId?: string;
  context: 'homepage' | 'cart' | 'product' | 'service' | 'checkout';
  items?: string[]; // IDs for context
  limit?: number;
}

export interface AIRecommendationResponse {
  recommendations: Array<{
    type: 'product' | 'service' | 'membership';
    id: string;
    reason: string;
    confidence: number;
    metadata?: {
      category?: string;
      price?: number;
      imageUrl?: string;
    };
  }>;
  metadata?: {
    model: string;
    processingTime: number;
  };
}

export interface AISearchRequest {
  query: string;
  filters?: {
    category?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    availability?: boolean;
  };
  limit?: number;
  offset?: number;
}

export interface AISearchResponse {
  results: Array<{
    type: 'product' | 'service' | 'content';
    id: string;
    title: string;
    description: string;
    relevanceScore: number;
    metadata?: {
      category?: string;
      price?: number;
      imageUrl?: string;
      availability?: boolean;
    };
  }>;
  suggestions?: string[];
  metadata?: {
    model: string;
    processingTime: number;
    totalResults: number;
  };
}

export interface AISuggestionsRequest {
  context: 'homepage' | 'product' | 'service' | 'cart' | 'checkout';
  currentMessage?: string;
  limit?: number;
}

export interface AISuggestionsResponse {
  suggestions: Array<{
    text: string;
    type: 'question' | 'action' | 'recommendation';
    confidence: number;
  }>;
  metadata?: {
    model: string;
    processingTime: number;
  };
}

// Supporting types
export interface CartSummary {
  itemCount: number;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface UserContext {
  id?: string;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
  history?: {
    recentServices?: string[];
    recentProducts?: string[];
    lastVisit?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    actions?: AIAction[];
  };
}

export interface AIAction {
  type: 'navigate' | 'add_to_cart' | 'book_appointment' | 'view_details';
  label: string;
  payload: {
    url?: string;
    productId?: string;
    serviceId?: string;
    appointmentData?: any;
  };
}

// Error types
export interface AIError {
  code: 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'MODEL_UNAVAILABLE' | 'INVALID_REQUEST' | 'INTERNAL_ERROR';
  message: string;
  details?: {
    retryAfter?: number;
    quotaReset?: string;
    availableModels?: string[];
  };
}

// Zod schemas for validation
import { z } from 'zod';

export const AIChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(1000),
  context: z.object({
    page: z.string().optional(),
    cart: z.object({
      itemCount: z.number(),
      total: z.number(),
      items: z.array(z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
      })),
    }).optional(),
    user: z.object({
      id: z.string().optional(),
      preferences: z.object({
        theme: z.string().optional(),
        language: z.string().optional(),
        notifications: z.boolean().optional(),
      }).optional(),
      history: z.object({
        recentServices: z.array(z.string()).optional(),
        recentProducts: z.array(z.string()).optional(),
        lastVisit: z.string().optional(),
      }).optional(),
    }).optional(),
    previousMessages: z.array(z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string(),
    })).optional(),
  }).optional(),
});

export const AIChatResponseSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()).optional(),
  actions: z.array(z.object({
    type: z.enum(['navigate', 'add_to_cart', 'book_appointment', 'view_details']),
    label: z.string(),
    payload: z.object({
      url: z.string().optional(),
      productId: z.string().optional(),
      serviceId: z.string().optional(),
      appointmentData: z.any().optional(),
    }),
  })).optional(),
  metadata: z.object({
    model: z.string(),
    tokensUsed: z.number(),
    processingTime: z.number(),
  }).optional(),
});

export const AIRecommendationRequestSchema = z.object({
  userId: z.string().optional(),
  context: z.enum(['homepage', 'cart', 'product', 'service', 'checkout']),
  items: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).optional(),
});

export const AIRecommendationResponseSchema = z.object({
  recommendations: z.array(z.object({
    type: z.enum(['product', 'service', 'membership']),
    id: z.string(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
    metadata: z.object({
      category: z.string().optional(),
      price: z.number().optional(),
      imageUrl: z.string().optional(),
    }).optional(),
  })),
  metadata: z.object({
    model: z.string(),
    processingTime: z.number(),
  }).optional(),
});

export const AISearchRequestSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.object({
    category: z.string().optional(),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    availability: z.boolean().optional(),
  }).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const AISearchResponseSchema = z.object({
  results: z.array(z.object({
    type: z.enum(['product', 'service', 'content']),
    id: z.string(),
    title: z.string(),
    description: z.string(),
    relevanceScore: z.number().min(0).max(1),
    metadata: z.object({
      category: z.string().optional(),
      price: z.number().optional(),
      imageUrl: z.string().optional(),
      availability: z.boolean().optional(),
    }).optional(),
  })),
  suggestions: z.array(z.string()).optional(),
  metadata: z.object({
    model: z.string(),
    processingTime: z.number(),
    totalResults: z.number(),
  }).optional(),
});

export const AISuggestionsRequestSchema = z.object({
  context: z.enum(['homepage', 'product', 'service', 'cart', 'checkout']),
  currentMessage: z.string().optional(),
  limit: z.number().min(1).max(20).optional(),
});

export const AISuggestionsResponseSchema = z.object({
  suggestions: z.array(z.object({
    text: z.string(),
    type: z.enum(['question', 'action', 'recommendation']),
    confidence: z.number().min(0).max(1),
  })),
  metadata: z.object({
    model: z.string(),
    processingTime: z.number(),
  }).optional(),
});




