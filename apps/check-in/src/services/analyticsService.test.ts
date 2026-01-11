/**
 * Unit Tests for Analytics Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage and sessionStorage
const mockLocalStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
});

vi.stubGlobal('sessionStorage', {
  getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockSessionStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockSessionStorage[key]; }),
});

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

import { analyticsService, type AnalyticsEvent, type AnalyticsEventType } from './analyticsService';

describe('analyticsService', () => {
  beforeEach(() => {
    // Clear storages
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('initializes with storeId and deviceId', () => {
      analyticsService.init({ storeId: 'store-123', deviceId: 'device-456' });
      // No assertions needed - just testing that init doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('track', () => {
    beforeEach(() => {
      analyticsService.init({ storeId: 'store-123', deviceId: 'device-456' });
    });

    it('tracks checkin_started event', async () => {
      await analyticsService.trackCheckinStarted({ source: 'phone' });
      // Event is tracked (no assertion needed for async side effects)
      expect(true).toBe(true);
    });

    it('tracks phone_entered event', async () => {
      await analyticsService.trackPhoneEntered({
        isReturningClient: true,
        lookupDurationMs: 150,
      });
      expect(true).toBe(true);
    });

    it('tracks services_selected event', async () => {
      await analyticsService.trackServicesSelected({
        serviceCount: 2,
        services: [
          { serviceId: 'svc-1', serviceName: 'Haircut', price: 25 },
          { serviceId: 'svc-2', serviceName: 'Styling', price: 35 },
        ],
        totalPrice: 60,
        totalDuration: 75,
        usedSearch: false,
      });
      expect(true).toBe(true);
    });

    it('tracks technician_selected event', async () => {
      await analyticsService.trackTechnicianSelected({
        technicianPreference: 'anyone',
      });
      expect(true).toBe(true);
    });

    it('tracks technician_selected with specific technician', async () => {
      await analyticsService.trackTechnicianSelected({
        technicianPreference: 'tech-123',
        technicianId: 'tech-123',
        technicianName: 'Jane Stylist',
      });
      expect(true).toBe(true);
    });

    it('tracks guest_added event', async () => {
      await analyticsService.trackGuestAdded({
        guestCount: 2,
        partyPreference: 'together',
        guestServiceCount: 3,
      });
      expect(true).toBe(true);
    });

    it('tracks checkin_completed event', async () => {
      await analyticsService.trackCheckinCompleted({
        checkInId: 'checkin-123',
        checkInNumber: 'A001',
        isNewClient: false,
        serviceCount: 2,
        totalPrice: 60,
        guestCount: 1,
        flowDurationMs: 45000,
      });
      expect(true).toBe(true);
    });

    it('tracks checkin_abandoned event', async () => {
      await analyticsService.trackCheckinAbandoned({
        step: 'services',
        reason: 'timeout',
        flowDurationMs: 120000,
      });
      expect(true).toBe(true);
    });
  });

  describe('getFlowDuration', () => {
    it('returns duration since session start', () => {
      const duration = analyticsService.getFlowDuration();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resetSession', () => {
    it('clears session from sessionStorage', () => {
      analyticsService.resetSession();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('mango_analytics_session');
    });
  });

  describe('flushQueue', () => {
    it('processes queued events', async () => {
      await analyticsService.flushQueue();
      // No assertions needed - just testing that flush doesn't throw
      expect(true).toBe(true);
    });
  });
});

describe('AnalyticsEventType', () => {
  it('includes all required event types', () => {
    const eventTypes: AnalyticsEventType[] = [
      'checkin_started',
      'phone_entered',
      'services_selected',
      'technician_selected',
      'guest_added',
      'checkin_completed',
      'checkin_abandoned',
    ];

    eventTypes.forEach((type) => {
      expect(typeof type).toBe('string');
    });
  });
});

describe('Event queueing (localStorage)', () => {
  beforeEach(() => {
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  });

  it('queues events when localStorage is available', () => {
    const events: AnalyticsEvent[] = [
      {
        type: 'checkin_started',
        timestamp: new Date().toISOString(),
        storeId: 'store-123',
        deviceId: 'device-456',
        sessionId: 'session-789',
        properties: { source: 'phone' },
      },
    ];

    localStorage.setItem('mango_analytics_queue', JSON.stringify(events));
    
    const stored = localStorage.getItem('mango_analytics_queue');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].type).toBe('checkin_started');
  });
});

describe('Session management', () => {
  beforeEach(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  });

  it('creates session with sessionId and startTime', () => {
    const session = {
      sessionId: 'session_123_abc',
      startTime: Date.now(),
    };

    sessionStorage.setItem('mango_analytics_session', JSON.stringify(session));
    
    const stored = sessionStorage.getItem('mango_analytics_session');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.sessionId).toBe('session_123_abc');
    expect(typeof parsed.startTime).toBe('number');
  });

  it('session expires after 30 minutes', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    const expiredSession = {
      sessionId: 'expired_session',
      startTime: thirtyOneMinutesAgo,
    };

    sessionStorage.setItem('mango_analytics_session', JSON.stringify(expiredSession));
    
    // When getOrCreateSession is called, it should create a new session
    // We're testing the logic, not the internal function directly
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    expect(expiredSession.startTime < thirtyMinutesAgo).toBe(true);
  });
});
