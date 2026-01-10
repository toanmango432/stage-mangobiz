/**
 * Analytics Service - Abstraction layer for event tracking
 *
 * This service provides a unified interface for tracking user events
 * throughout the check-in flow. It's designed to be provider-agnostic,
 * allowing easy integration with various analytics backends:
 * - Supabase (via Edge Functions)
 * - Google Analytics
 * - Mixpanel
 * - Amplitude
 * - Custom backend
 *
 * Events are queued when offline and sent when connection is restored.
 */

import { supabase } from './supabase';
import type { TechnicianPreference, PartyPreference } from '../types';

export type AnalyticsEventType =
  | 'checkin_started'
  | 'phone_entered'
  | 'services_selected'
  | 'technician_selected'
  | 'guest_added'
  | 'checkin_completed'
  | 'checkin_abandoned';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: string;
  storeId: string;
  deviceId: string;
  sessionId: string;
  properties?: Record<string, unknown>;
}

export interface CheckinStartedProps {
  source: 'phone' | 'qr_code';
}

export interface PhoneEnteredProps {
  isReturningClient: boolean;
  lookupDurationMs: number;
}

export interface ServicesSelectedProps {
  serviceCount: number;
  services: Array<{ serviceId: string; serviceName: string; price: number }>;
  totalPrice: number;
  totalDuration: number;
  usedSearch: boolean;
}

export interface TechnicianSelectedProps {
  technicianPreference: TechnicianPreference;
  technicianId?: string;
  technicianName?: string;
}

export interface GuestAddedProps {
  guestCount: number;
  partyPreference: PartyPreference;
  guestServiceCount: number;
}

export interface CheckinCompletedProps {
  checkInId: string;
  checkInNumber: string;
  isNewClient: boolean;
  serviceCount: number;
  totalPrice: number;
  guestCount: number;
  flowDurationMs: number;
}

export interface CheckinAbandonedProps {
  step: 'welcome' | 'verify' | 'services' | 'technician' | 'guests' | 'confirm';
  reason?: 'timeout' | 'back_navigation' | 'browser_close';
  flowDurationMs: number;
}

const ANALYTICS_QUEUE_KEY = 'mango_analytics_queue';
const SESSION_KEY = 'mango_analytics_session';

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getOrCreateSession(): { sessionId: string; startTime: number } {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      if (parsed.startTime > thirtyMinutesAgo) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  const session = {
    sessionId: generateSessionId(),
    startTime: Date.now(),
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
  return session;
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function getQueuedEvents(): AnalyticsEvent[] {
  try {
    const stored = localStorage.getItem(ANALYTICS_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueuedEvents(events: AnalyticsEvent[]): void {
  try {
    localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(events));
  } catch {
    console.warn('[analyticsService] Failed to save queued events');
  }
}

function queueEvent(event: AnalyticsEvent): void {
  const events = getQueuedEvents();
  events.push(event);
  saveQueuedEvents(events.slice(-100));
}

async function sendEvent(event: AnalyticsEvent): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('track-event', {
      body: event,
    });

    if (error) {
      console.warn('[analyticsService] Failed to send event:', error);
      return false;
    }

    console.debug('[analyticsService] Event sent:', event.type);
    return true;
  } catch (error) {
    console.warn('[analyticsService] Exception sending event:', error);
    return false;
  }
}

async function flushQueue(): Promise<void> {
  if (!isOnline()) return;

  const events = getQueuedEvents();
  if (events.length === 0) return;

  const remaining: AnalyticsEvent[] = [];
  for (const event of events) {
    const success = await sendEvent(event);
    if (!success) {
      remaining.push(event);
    }
  }

  saveQueuedEvents(remaining);
}

let storeId: string | null = null;
let deviceId: string | null = null;

export const analyticsService = {
  init(config: { storeId: string; deviceId: string }): void {
    storeId = config.storeId;
    deviceId = config.deviceId;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        flushQueue();
      });
    }

    flushQueue();
  },

  async track<T extends AnalyticsEventType>(
    type: T,
    properties?: T extends 'checkin_started'
      ? CheckinStartedProps
      : T extends 'phone_entered'
        ? PhoneEnteredProps
        : T extends 'services_selected'
          ? ServicesSelectedProps
          : T extends 'technician_selected'
            ? TechnicianSelectedProps
            : T extends 'guest_added'
              ? GuestAddedProps
              : T extends 'checkin_completed'
                ? CheckinCompletedProps
                : T extends 'checkin_abandoned'
                  ? CheckinAbandonedProps
                  : Record<string, unknown>
  ): Promise<void> {
    const session = getOrCreateSession();

    const event: AnalyticsEvent = {
      type,
      timestamp: new Date().toISOString(),
      storeId: storeId || 'unknown',
      deviceId: deviceId || 'unknown',
      sessionId: session.sessionId,
      properties: properties as unknown as Record<string, unknown>,
    };

    console.debug('[analyticsService] Tracking:', type, properties);

    if (isOnline()) {
      const success = await sendEvent(event);
      if (!success) {
        queueEvent(event);
      }
    } else {
      queueEvent(event);
    }
  },

  trackCheckinStarted(props: CheckinStartedProps): Promise<void> {
    return this.track('checkin_started', props);
  },

  trackPhoneEntered(props: PhoneEnteredProps): Promise<void> {
    return this.track('phone_entered', props);
  },

  trackServicesSelected(props: ServicesSelectedProps): Promise<void> {
    return this.track('services_selected', props);
  },

  trackTechnicianSelected(props: TechnicianSelectedProps): Promise<void> {
    return this.track('technician_selected', props);
  },

  trackGuestAdded(props: GuestAddedProps): Promise<void> {
    return this.track('guest_added', props);
  },

  trackCheckinCompleted(props: CheckinCompletedProps): Promise<void> {
    return this.track('checkin_completed', props);
  },

  trackCheckinAbandoned(props: CheckinAbandonedProps): Promise<void> {
    return this.track('checkin_abandoned', props);
  },

  getFlowDuration(): number {
    const session = getOrCreateSession();
    return Date.now() - session.startTime;
  },

  resetSession(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
  },

  async flushQueue(): Promise<void> {
    await flushQueue();
  },
};

export default analyticsService;
