import { APIClient } from './base';

// API client instances for different services
export const storeAPI = new APIClient('/api/v1/storefront');
export const bookingAPI = new APIClient('/api/v1/booking');
export const cartAPI = new APIClient('/api/v1/cart');
export const aiAPI = new APIClient('/api/v1/ai');
export const promotionsAPI = new APIClient('/api/v1/promotions');
export const announcementsAPI = new APIClient('/api/v1/announcements');

// External service clients (for connected mode)
export const bizAPI = new APIClient(process.env.VITE_BIZ_API_URL || '/biz-api/v1');
export const stripeAPI = new APIClient(process.env.VITE_STRIPE_API_URL || '/stripe-api/v1');

// Helper function to configure clients based on environment
export function configureClients() {
  const mode = process.env.MODE || 'standalone';
  
  if (mode === 'connected') {
    // In connected mode, use external service URLs
    const storeBaseURL = process.env.VITE_STORE_API_URL || 'http://localhost:3000/api/v1';
    const aiBaseURL = process.env.VITE_AI_API_URL || 'http://localhost:3001/api/v1/ai';
    const bizBaseURL = process.env.VITE_BIZ_API_URL || 'http://localhost:3002/biz-api/v1';
    
    // Update base URLs for connected mode
    storeAPI['baseURL'] = `${storeBaseURL}/storefront`;
    bookingAPI['baseURL'] = `${storeBaseURL}/booking`;
    cartAPI['baseURL'] = `${storeBaseURL}/cart`;
    aiAPI['baseURL'] = aiBaseURL;
    promotionsAPI['baseURL'] = `${storeBaseURL}/promotions`;
    announcementsAPI['baseURL'] = `${storeBaseURL}/announcements`;
    bizAPI['baseURL'] = bizBaseURL;
  }
  
  // Add common headers
  const commonHeaders = {
    'X-Client-Version': process.env.VITE_APP_VERSION || '1.0.0',
    'X-Client-Platform': 'web',
  };
  
  Object.values({
    storeAPI,
    bookingAPI,
    cartAPI,
    aiAPI,
    promotionsAPI,
    announcementsAPI,
    bizAPI,
    stripeAPI,
  }).forEach(client => {
    Object.entries(commonHeaders).forEach(([key, value]) => {
      client.setHeader(key, value);
    });
  });
}

// Initialize clients on module load
configureClients();




