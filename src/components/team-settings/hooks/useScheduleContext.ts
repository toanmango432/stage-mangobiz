/**
 * Hook to provide ScheduleContext for team-settings components
 * Bridges auth state to the schedule module's context requirements
 */

import { useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentUser, selectSalonId } from '../../../store/slices/authSlice';
import type { ScheduleContext } from '../../../hooks/useSchedule';

// Default device ID - in production this would come from a device fingerprint
const DEFAULT_DEVICE_ID = 'web-device-001';

/**
 * Creates a ScheduleContext from the current auth state
 * Used by team-settings components to interact with the unified schedule database
 */
export function useScheduleContext(): ScheduleContext | null {
  const user = useAppSelector(selectCurrentUser);
  const salonId = useAppSelector(selectSalonId);

  return useMemo(() => {
    if (!user || !salonId) {
      return null;
    }

    return {
      userId: user.id,
      userName: user.name,
      storeId: salonId,
      tenantId: salonId, // Using salonId as tenantId for now
      deviceId: DEFAULT_DEVICE_ID,
      isManager: user.role === 'owner' || user.role === 'manager',
    };
  }, [user, salonId]);
}

/**
 * Non-null version that throws if context is not available
 * Use when you're certain the user is authenticated
 */
export function useRequiredScheduleContext(): ScheduleContext {
  const context = useScheduleContext();

  if (!context) {
    throw new Error('useRequiredScheduleContext must be used within an authenticated context');
  }

  return context;
}
