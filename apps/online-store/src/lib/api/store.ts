import type {
  SalonInfo,
  ReviewsResponse,
  ReviewFilters,
  GalleryResponse,
  GalleryFilters,
  TeamMember,
  StoreService,
  StoreProduct,
  MembershipPlan,
  Policies,
  FAQResponse,
  SocialPost,
  NavConfig,
} from "@/types/store";

// Import API clients
import { storeAPI, bookingAPI, cartAPI } from '@/lib/api-client/clients';

// Import local API implementations for fallback
import {
  getSalonInfo as getSalonInfoLocal,
  getReviews as getReviewsLocal,
  getReviewServices as getReviewServicesLocal,
  getReviewStaff as getReviewStaffLocal,
  getGallery as getGalleryLocal,
  getTeamMembers as getTeamMembersLocal,
  getTeamMember as getTeamMemberLocal,
  getMarketingSettings as getMarketingSettingsLocal,
  updateMarketingSettings as updateMarketingSettingsLocal,
  updatePromotionPlacement as updatePromotionPlacementLocal,
  updateAnnouncementPlacement as updateAnnouncementPlacementLocal,
  applyPromotionToCart as applyPromotionToCartLocal,
  getFAQ as getFAQLocal,
  getPolicies as getPoliciesLocal,
} from './local/store';

/**
 * Unified store API client - single source of truth for all data
 * Never throws to UI, always returns safe fallbacks
 */

export async function getSalonInfo(): Promise<SalonInfo | null> {
  try {
    const result = await getSalonInfoLocal();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch salon info');
    }
    return result.data?.info || null;
  } catch (error) {
    console.error('Failed to fetch salon info:', error);
    return null;
  }
}

export async function getReviews(filters?: ReviewFilters): Promise<ReviewsResponse> {
  try {
    const result = await getReviewsLocal({
      limit: filters?.limit,
      offset: filters?.offset,
      serviceId: filters?.serviceId,
      staffId: filters?.staffId,
      minRating: filters?.minRating,
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch reviews');
    }
    return result.data || { reviews: [], aggregate: { count: 0, avg: 0 } };
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return { reviews: [], aggregate: { count: 0, avg: 0 } };
  }
}

export async function getReviewServices(): Promise<Array<{ id: string; name: string }>> {
  try {
    const result = await getReviewServicesLocal();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch services');
    }
    return result.data?.services || [];
  } catch (error) {
    console.error('Failed to fetch review services:', error);
    return [];
  }
}

export async function getReviewStaff(): Promise<Array<{ id: string; name: string }>> {
  try {
    const result = await getReviewStaffLocal();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch staff');
    }
    return result.data?.staff || [];
  } catch (error) {
    console.error('Failed to fetch review staff:', error);
    return [];
  }
}

export async function getGallery(filters?: GalleryFilters): Promise<GalleryResponse> {
  try {
    const result = await getGalleryLocal({
      limit: filters?.limit,
      offset: filters?.offset,
      tags: filters?.tag ? [filters.tag] : undefined,
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch gallery');
    }
    return result.data || { items: [] };
  } catch (error) {
    console.error('Failed to fetch gallery:', error);
    return { items: [] };
  }
}

export async function getTeam(): Promise<TeamMember[]> {
  try {
    const result = await getTeamMembersLocal();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch team');
    }
    return result.data?.team || [];
  } catch (error) {
    console.error('Failed to fetch team:', error);
    return [];
  }
}

export async function getServices(): Promise<StoreService[]> {
  try {
    const response = await storeAPI.get('/services');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch services');
    }
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return [];
  }
}

export async function getProducts(): Promise<StoreProduct[]> {
  try {
    const response = await storeAPI.get('/products');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch products');
    }
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  try {
    const response = await storeAPI.get('/memberships');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch membership plans');
    }
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch membership plans, falling back to localStorage:', error);
    // Fallback to localStorage
    const { getActiveMembershipPlans } = await import('@/lib/storage/membershipStorage');
    return getActiveMembershipPlans() as any;
  }
}

export async function getPolicies(): Promise<Policies | null> {
  try {
    const response = await storeAPI.get('/policies');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch policies');
    }
    return response.data;
  } catch (error) {
    console.error('Failed to fetch policies:', error);
    return null;
  }
}

export async function getFAQ(): Promise<FAQResponse> {
  try {
    const response = await storeAPI.get('/faq');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch FAQ');
    }
    return response.data;
  } catch (error) {
    console.error('Failed to fetch FAQ:', error);
    return { items: [] };
  }
}

export async function getSocialPosts(limit = 6): Promise<SocialPost[]> {
  try {
    // For now, return empty array since we don't have social posts in our MSW handlers
    // This can be added later if needed
    return [];
  } catch (error) {
    console.error('Failed to fetch social posts:', error);
    return [];
  }
}

export async function getNavConfig(): Promise<NavConfig | null> {
  try {
    const response = await fetch(`${STORE_API_URL}/settings/nav`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch nav config:', error);
    return null;
  }
}

// Gift Cards
export async function getGiftCardDesigns(): Promise<Array<{ id: string; name: string; previewUrl?: string; description?: string; colors?: { primary: string; secondary: string } }>> {
  try {
    const response = await fetch(`${STORE_API_URL}/giftcards/designs`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.designs || [];
  } catch (error) {
    console.error('Failed to fetch gift card designs:', error);
    return [];
  }
}

export async function getGiftCardConfig(): Promise<any> {
  try {
    const response = await fetch(`${STORE_API_URL}/giftcards/config`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.config || null;
  } catch (error) {
    console.error('Failed to fetch gift card config, falling back to localStorage:', error);
    // Fallback to localStorage
    const { getGiftCardConfig: getLocalConfig } = await import('@/lib/storage/giftCardStorage');
    return getLocalConfig();
  }
}

// Providers & Slots
export async function getProviders(): Promise<Array<{ id: string; name: string; skills?: string[]; rating?: number; avatarUrl?: string }>> {
  try {
    const response = await fetch(`${STORE_API_URL}/providers`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.providers || [];
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    return [];
  }
}

export async function getSlots(filters?: { serviceId?: string; date?: string }): Promise<Array<any>> {
  try {
    const params = new URLSearchParams();
    if (filters?.serviceId) params.set('serviceId', filters.serviceId);
    if (filters?.date) params.set('date', filters.date);

    const response = await fetch(`${STORE_API_URL}/slots?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.slots || [];
  } catch (error) {
    console.error('Failed to fetch slots:', error);
    return [];
  }
}

// Cart Management
export async function getCart(sessionId: string): Promise<any> {
  try {
    const response = await cartAPI.get(`/${sessionId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch cart');
    }
    return response.data?.cart;
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    return { id: `cart_${sessionId}`, sessionId, items: [], currency: 'USD', updatedAt: new Date().toISOString() };
  }
}

export async function addToCart(sessionId: string, item: {
  type: 'service' | 'product' | 'membership' | 'giftcard';
  refId: string;
  qty: number;
  price: number;
  meta?: Record<string, unknown>;
}): Promise<any> {
  try {
    const response = await cartAPI.post(`/${sessionId}/add`, item);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add to cart');
    }
    return response.data?.cart;
  } catch (error) {
    console.error('Failed to add to cart:', error);
    throw error;
  }
}

export async function removeFromCart(sessionId: string, itemId: string): Promise<any> {
  try {
    const response = await cartAPI.post(`/${sessionId}/remove`, { itemId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove from cart');
    }
    return response.data?.cart;
  } catch (error) {
    console.error('Failed to remove from cart:', error);
    throw error;
  }
}

export async function clearCart(sessionId: string): Promise<boolean> {
  try {
    const response = await cartAPI.post(`/${sessionId}/clear`, {});
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to clear cart');
    }
    return true;
  } catch (error) {
    console.error('Failed to clear cart:', error);
    return false;
  }
}

// Checkout
export async function checkout(sessionId: string): Promise<any> {
  try {
    const response = await fetch(`${STORE_API_URL}/checkout/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Checkout failed');
    }
    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error('Failed to checkout:', error);
    throw error;
  }
}

// Bookings
export async function createBookingDraft(payload: {
  clientId?: string;
  serviceId: string;
  providerId?: string;
  slotStartISO: string;
  slotEndISO: string;
  price: number;
}): Promise<any> {
  try {
    const response = await bookingAPI.post('/draft', payload);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create booking draft');
    }
    return response.data?.booking;
  } catch (error) {
    console.error('Failed to create booking draft:', error);
    throw error;
  }
}

export async function confirmBooking(bookingId: string): Promise<any> {
  try {
    const response = await bookingAPI.post('/confirm', { bookingId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to confirm booking');
    }
    return response.data?.booking;
  } catch (error) {
    console.error('Failed to confirm booking:', error);
    throw error;
  }
}

export async function cancelBooking(bookingId: string): Promise<any> {
  try {
    const response = await bookingAPI.post('/cancel', { bookingId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel booking');
    }
    return response.data?.booking;
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    throw error;
  }
}

// Account Management
export async function getClientByEmail(email: string): Promise<any> {
  try {
    const response = await fetch(`${STORE_API_URL}/account/by-email/${encodeURIComponent(email)}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.client;
  } catch (error) {
    console.error('Failed to fetch client by email:', error);
    return null;
  }
}

export async function getAccountSummary(clientId: string): Promise<any> {
  try {
    const response = await fetch(`${STORE_API_URL}/account/summary/${clientId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch account summary:', error);
    return null;
  }
}

export async function getClientOrders(clientId: string): Promise<any[]> {
  try {
    const response = await fetch(`${STORE_API_URL}/account/orders/${clientId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Failed to fetch client orders:', error);
    return [];
  }
}

export async function getClientBookings(clientId: string): Promise<any[]> {
  try {
    const response = await fetch(`${STORE_API_URL}/account/bookings/${clientId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.bookings || [];
  } catch (error) {
    console.error('Failed to fetch client bookings:', error);
    return [];
  }
}
