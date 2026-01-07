// Enhanced Analytics Tracking System
import type { AnalyticsEvent, EventType, SessionData } from '@/types/analytics';

const STORAGE_KEY = 'mango-analytics-events';
const SESSION_KEY = 'mango-analytics-session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

class AnalyticsTracker {
  private sessionId: string;
  private userId?: string;
  private sessionStart: number;

  constructor() {
    this.sessionId = this.getOrCreateSession();
    this.sessionStart = Date.now();
    this.loadUserId();
  }

  private getOrCreateSession(): string {
    if (typeof window === 'undefined') return 'ssr-session';
    
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        const age = Date.now() - session.timestamp;
        if (age < SESSION_TIMEOUT) {
          // Update timestamp
          session.timestamp = Date.now();
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return session.id;
        }
      } catch (e) {
        // Invalid session, create new
      }
    }
    
    const newSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    return newSession.id;
  }

  private loadUserId() {
    if (typeof window === 'undefined') return;
    
    try {
      const auth = localStorage.getItem('mango-auth');
      if (auth) {
        const authData = JSON.parse(auth);
        this.userId = authData.user?.id;
      }
    } catch (e) {
      // No user logged in
    }
  }

  /**
   * Track a custom event
   */
  track(type: EventType, metadata?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      metadata,
      page: window.location.pathname,
      referrer: document.referrer || undefined
    };

    this.saveEvent(event);
    
    // Also push to window.dataLayer for GTM/GA4 if available
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: type,
        ...metadata,
        sessionId: this.sessionId,
        userId: this.userId
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(page?: string): void {
    this.track('page_view', {
      page: page || window.location.pathname,
      title: document.title
    });
  }

  /**
   * Track booking funnel steps
   */
  trackBookingStep(step: string, serviceId?: string): void {
    this.track('booking_step_completed', {
      step,
      serviceId
    });
  }

  /**
   * Track booking completion
   */
  trackBookingCompleted(bookingId: string, revenue: number, serviceId: string): void {
    this.track('booking_completed', {
      bookingId,
      revenue,
      serviceId,
      timestamp: Date.now()
    });
  }

  /**
   * Track cart events
   */
  trackCartAdd(itemId: string, itemType: string, price: number): void {
    this.track('cart_add', {
      itemId,
      itemType,
      price
    });
  }

  trackCartRemove(itemId: string): void {
    this.track('cart_remove', {
      itemId
    });
  }

  /**
   * Track checkout funnel
   */
  trackCheckoutStarted(cartTotal: number, itemCount: number): void {
    this.track('checkout_started', {
      cartTotal,
      itemCount
    });
  }

  trackCheckoutCompleted(orderId: string, revenue: number, items: any[]): void {
    this.track('checkout_completed', {
      orderId,
      revenue,
      items,
      itemCount: items.length
    });
  }

  /**
   * Track membership events
   */
  trackMembershipViewed(planId: string): void {
    this.track('membership_viewed', {
      planId
    });
  }

  trackMembershipPurchased(planId: string, revenue: number): void {
    this.track('membership_purchased', {
      planId,
      revenue
    });
  }

  /**
   * Track product events
   */
  trackProductViewed(productId: string, productName: string, price: number): void {
    this.track('product_viewed', {
      productId,
      productName,
      price
    });
  }

  /**
   * Track promotion engagement
   */
  trackPromotionViewed(promotionId: string): void {
    this.track('promotion_viewed', {
      promotionId
    });
  }

  trackPromotionClicked(promotionId: string, promotionName: string): void {
    this.track('promotion_clicked', {
      promotionId,
      promotionName
    });
  }

  /**
   * Track announcement engagement
   */
  trackAnnouncementViewed(announcementId: string): void {
    this.track('announcement_viewed', {
      announcementId
    });
  }

  /**
   * Track AI chat usage
   */
  trackAIChatStarted(): void {
    this.track('ai_chat_started');
  }

  trackAIChatMessage(message: string): void {
    this.track('ai_chat_message_sent', {
      messageLength: message.length
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number): void {
    this.track('search_performed', {
      query,
      resultsCount
    });
  }

  /**
   * Save event to localStorage
   */
  private saveEvent(event: AnalyticsEvent): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      
      events.push(event);
      
      // Keep only last 1000 events to prevent storage overflow
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save analytics event:', e);
    }
  }

  /**
   * Get all events
   */
  getEvents(filter?: {
    startDate?: number;
    endDate?: number;
    type?: EventType;
  }): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      let events: AnalyticsEvent[] = JSON.parse(stored);
      
      if (filter) {
        if (filter.startDate) {
          events = events.filter(e => e.timestamp >= filter.startDate!);
        }
        if (filter.endDate) {
          events = events.filter(e => e.timestamp <= filter.endDate!);
        }
        if (filter.type) {
          events = events.filter(e => e.type === filter.type);
        }
      }
      
      return events;
    } catch (e) {
      console.error('Failed to get analytics events:', e);
      return [];
    }
  }

  /**
   * Get current session data
   */
  getSessionData(): SessionData {
    const events = this.getEvents({
      startDate: this.sessionStart
    });

    const conversionEventTypes: EventType[] = [
      'booking_completed',
      'checkout_completed',
      'membership_purchased'
    ];

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.sessionStart,
      endTime: Date.now(),
      duration: Date.now() - this.sessionStart,
      events,
      pageViews: events.filter(e => e.type === 'page_view').length,
      conversionEvents: events.filter(e => conversionEventTypes.includes(e.type)).length
    };
  }

  /**
   * Clear all analytics data (for testing/privacy)
   */
  clearData(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}

// Export singleton instance
export const analyticsTracker = new AnalyticsTracker();

// Export convenience functions
export const trackEvent = (type: EventType, metadata?: Record<string, any>) => {
  analyticsTracker.track(type, metadata);
};

export const trackPageView = (page?: string) => {
  analyticsTracker.trackPageView(page);
};

export const trackBookingCompleted = (bookingId: string, revenue: number, serviceId: string) => {
  analyticsTracker.trackBookingCompleted(bookingId, revenue, serviceId);
};

export const trackCheckoutCompleted = (orderId: string, revenue: number, items: any[]) => {
  analyticsTracker.trackCheckoutCompleted(orderId, revenue, items);
};

export const trackPromotionClicked = (promotionId: string, promotionName: string) => {
  analyticsTracker.trackPromotionClicked(promotionId, promotionName);
};

