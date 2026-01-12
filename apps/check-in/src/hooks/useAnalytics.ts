/**
 * useAnalytics Hook
 *
 * Provides analytics tracking with automatic store/device context
 * and convenient wrappers for all check-in flow events.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { analyticsService } from '../services/analyticsService';
import type {
  CheckinStartedProps,
  PhoneEnteredProps,
  ServicesSelectedProps,
  TechnicianSelectedProps,
  GuestAddedProps,
  CheckinCompletedProps,
  CheckinAbandonedProps,
} from '../services/analyticsService';

export function useAnalytics() {
  const authState = useAppSelector((state) => state.auth);
  const storeId = authState?.storeId || null;
  const deviceId = authState?.deviceId || null;
  const initializedRef = useRef(false);

  useEffect(() => {
    if (storeId && deviceId && !initializedRef.current) {
      analyticsService.init({ storeId, deviceId });
      initializedRef.current = true;
    }
  }, [storeId, deviceId]);

  const trackCheckinStarted = useCallback((props: CheckinStartedProps) => {
    return analyticsService.trackCheckinStarted(props);
  }, []);

  const trackPhoneEntered = useCallback((props: PhoneEnteredProps) => {
    return analyticsService.trackPhoneEntered(props);
  }, []);

  const trackServicesSelected = useCallback((props: ServicesSelectedProps) => {
    return analyticsService.trackServicesSelected(props);
  }, []);

  const trackTechnicianSelected = useCallback((props: TechnicianSelectedProps) => {
    return analyticsService.trackTechnicianSelected(props);
  }, []);

  const trackGuestAdded = useCallback((props: GuestAddedProps) => {
    return analyticsService.trackGuestAdded(props);
  }, []);

  const trackCheckinCompleted = useCallback((props: CheckinCompletedProps) => {
    return analyticsService.trackCheckinCompleted(props);
  }, []);

  const trackCheckinAbandoned = useCallback((props: CheckinAbandonedProps) => {
    return analyticsService.trackCheckinAbandoned(props);
  }, []);

  const getFlowDuration = useCallback(() => {
    return analyticsService.getFlowDuration();
  }, []);

  const resetSession = useCallback(() => {
    analyticsService.resetSession();
  }, []);

  return {
    trackCheckinStarted,
    trackPhoneEntered,
    trackServicesSelected,
    trackTechnicianSelected,
    trackGuestAdded,
    trackCheckinCompleted,
    trackCheckinAbandoned,
    getFlowDuration,
    resetSession,
  };
}

export default useAnalytics;
