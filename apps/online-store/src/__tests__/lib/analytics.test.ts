import { describe, it, expect, beforeEach } from 'vitest';
import { analyticsTracker } from '@/lib/analytics/tracker';
import { 
  calculateBookingConversion,
  calculateCartConversion,
  generateAnalyticsReport 
} from '@/lib/analytics/metrics';
import type { AnalyticsEvent } from '@/types/analytics';

describe('Analytics Tracker', () => {
  beforeEach(() => {
    analyticsTracker.clearData();
  });

  it('should track events correctly', () => {
    analyticsTracker.track('page_view', { page: '/home' });
    
    const events = analyticsTracker.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('page_view');
    expect(events[0].metadata?.page).toBe('/home');
  });

  it('should track booking completion', () => {
    analyticsTracker.trackBookingCompleted('booking-123', 150, 'service-1');
    
    const events = analyticsTracker.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('booking_completed');
    expect(events[0].metadata?.revenue).toBe(150);
  });

  it('should filter events by type', () => {
    analyticsTracker.track('page_view');
    analyticsTracker.track('booking_started');
    analyticsTracker.track('page_view');
    
    const pageViews = analyticsTracker.getEvents({ type: 'page_view' });
    expect(pageViews).toHaveLength(2);
  });

  it('should filter events by date range', () => {
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;
    
    analyticsTracker.track('page_view');
    
    const recent = analyticsTracker.getEvents({ startDate: yesterday });
    expect(recent).toHaveLength(1);
    
    const future = analyticsTracker.getEvents({ startDate: now + 1000 });
    expect(future).toHaveLength(0);
  });

  it('should get session data', () => {
    analyticsTracker.track('page_view');
    analyticsTracker.track('booking_completed', { revenue: 100 });
    
    const session = analyticsTracker.getSessionData();
    expect(session.pageViews).toBe(1);
    expect(session.conversionEvents).toBe(1);
    expect(session.events).toHaveLength(2);
  });
});

describe('Analytics Metrics', () => {
  const mockEvents: AnalyticsEvent[] = [
    {
      id: '1',
      type: 'booking_started',
      timestamp: Date.now() - 1000,
      sessionId: 'session-1'
    },
    {
      id: '2',
      type: 'booking_completed',
      timestamp: Date.now() - 500,
      sessionId: 'session-1',
      metadata: { revenue: 100 }
    },
    {
      id: '3',
      type: 'checkout_started',
      timestamp: Date.now() - 1000,
      sessionId: 'session-2'
    },
    {
      id: '4',
      type: 'checkout_completed',
      timestamp: Date.now() - 500,
      sessionId: 'session-2',
      metadata: { revenue: 200 }
    }
  ];

  it('should calculate booking conversion rate', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const conversion = calculateBookingConversion(
      mockEvents,
      yesterday,
      now,
      twoDaysAgo,
      yesterday
    );
    
    expect(conversion.current).toBeGreaterThan(0);
    expect(conversion).toHaveProperty('previous');
    expect(conversion).toHaveProperty('change');
  });

  it('should calculate cart conversion rate', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const conversion = calculateCartConversion(
      mockEvents,
      yesterday,
      now,
      twoDaysAgo,
      yesterday
    );
    
    expect(conversion.current).toBeGreaterThan(0);
  });

  it('should generate analytics report', () => {
    const report = generateAnalyticsReport(mockEvents, 'week');
    
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('funnels');
    expect(report).toHaveProperty('timeSeries');
    expect(report.funnels).toHaveLength(2); // Booking and Checkout funnels
  });
});

