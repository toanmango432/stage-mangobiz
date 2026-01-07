// Local API Configuration
// This replaces Supabase Edge Functions with local mock implementations

export const LOCAL_API_CONFIG = {
  // API endpoints that will be replaced with local functions
  CHAT_API_URL: '/api/local/chat',
  STORE_API_URL: '/api/local/store',
  
  // Rate limiting configuration
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 30000, // 30 seconds
  },
  
  // AI Configuration
  AI: {
    PROVIDER: 'gemini',
    MODEL: 'google/gemini-2.5-flash',
    GATEWAY_URL: 'https://ai.gateway.lovable.dev/v1/chat/completions',
  },
  
  // Mock data configuration
  MOCK_DATA: {
    ENABLE_DELAYS: true, // Simulate network delays
    DEFAULT_DELAY: 1000, // 1 second
  }
} as const;

export type LocalApiConfig = typeof LOCAL_API_CONFIG;
