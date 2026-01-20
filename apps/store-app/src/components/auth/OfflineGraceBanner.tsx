/**
 * Offline Grace Banner
 *
 * A self-contained wrapper around OfflineGraceIndicator that:
 * - Tracks online/offline status
 * - Gets grace period info from memberAuthService
 * - Only renders when there's something to show
 *
 * This component can be dropped into any layout without
 * requiring AuthProvider context.
 */

import { useState, useEffect } from 'react';
import { OfflineGraceIndicator } from './OfflineGraceIndicator';
import { memberAuthService } from '@/services/memberAuthService';
import { useAppSelector } from '@/store/hooks';
import { selectMember } from '@/store/slices/authSlice';

/**
 * Offline Grace Banner
 *
 * Displays grace period warnings when:
 * - Device is offline
 * - Grace period <= 5 days remaining
 * - Critical when <= 2 days remaining
 *
 * Automatically hides when online with > 5 days remaining.
 */
export function OfflineGraceBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [daysRemaining, setDaysRemaining] = useState(7);

  // Get current member from Redux
  const member = useAppSelector(selectMember);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get grace period info when member changes
  useEffect(() => {
    if (!member?.memberId) {
      // No member logged in - default to full grace period
      setDaysRemaining(7);
      return;
    }

    // Get cached member session to check grace
    const cachedSession = memberAuthService.getCachedMemberSession();
    if (!cachedSession) {
      setDaysRemaining(7);
      return;
    }

    // Calculate grace period
    const graceInfo = memberAuthService.checkOfflineGrace(cachedSession);
    setDaysRemaining(graceInfo.daysRemaining);
  }, [member?.memberId]);

  // Update grace info periodically (every minute)
  useEffect(() => {
    const updateGrace = () => {
      const cachedSession = memberAuthService.getCachedMemberSession();
      if (cachedSession) {
        const graceInfo = memberAuthService.checkOfflineGrace(cachedSession);
        setDaysRemaining(graceInfo.daysRemaining);
      }
    };

    const interval = setInterval(updateGrace, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <OfflineGraceIndicator
      daysRemaining={daysRemaining}
      isOffline={isOffline}
      className="mx-4 my-2"
    />
  );
}

export default OfflineGraceBanner;
