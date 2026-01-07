// Analytics helper to safely access window.dataLayer
// This file provides legacy compatibility while the new enhanced analytics system
// is in src/lib/analytics/tracker.ts

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const trackEvent = (eventData: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(eventData);
  }
};

export const trackNavClick = (page: string) => {
  trackEvent({ event: 'nav_info_click', page });
};

// Re-export enhanced analytics for convenience
export { analyticsTracker, trackPageView, trackBookingCompleted, trackCheckoutCompleted } from './analytics/tracker';
