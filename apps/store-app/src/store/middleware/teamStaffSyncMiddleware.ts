/**
 * Team-Staff Sync Middleware
 *
 * This middleware synchronizes service permissions across all staff data systems.
 *
 * Problem: The app has THREE staff data systems:
 * - teamSlice: TeamMemberSettings with rich services[] (ServicePricing with canPerform, customPrice, etc.)
 * - staffSlice: Staff with simple specialties[] (array of service IDs) - used by Booking
 * - uiStaffSlice: UIStaff for Front Desk display - has specialty field
 *
 * Solution: When team services are updated, sync to both staffSlice and uiStaffSlice
 *
 * Following offline-first pattern: Redux → IndexedDB → Sync Queue
 */

import type { Middleware } from '@reduxjs/toolkit';
import { updateStaffSpecialties } from '../slices/staffSlice';
import { loadStaff } from '../slices/uiStaffSlice';

// Action types we need to sync
const TEAM_SERVICE_UPDATE_ACTIONS = [
  'team/updateMemberServices',
  'team/save/fulfilled',
];

interface ServicePayload {
  serviceId: string;
  serviceName?: string;
  serviceCategory?: string;
  canPerform: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const teamStaffSyncMiddleware: Middleware = (storeApi) => (next) => (action: any) => {
  // First, let the action complete
  const result = next(action);

  // Check if this is an action we need to sync
  if (!TEAM_SERVICE_UPDATE_ACTIONS.includes(action.type)) {
    return result;
  }

  // Handle different action types
  if (action.type === 'team/updateMemberServices') {
    // Optimistic update - sync immediately
    const { id, services } = action.payload;
    syncServicesToAllSlices(storeApi.dispatch, id, services);
  } else if (action.type === 'team/save/fulfilled') {
    // After save completes - sync the saved member's services
    const savedMember = action.payload;
    if (savedMember && savedMember.id && savedMember.services) {
      syncServicesToAllSlices(storeApi.dispatch, savedMember.id, savedMember.services);

      // Also reload uiStaffSlice to get fresh data from DB
      // This ensures Front Desk display is updated
      const storeId = 'salon-001'; // TODO: Get from auth state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storeApi.dispatch(loadStaff(storeId) as any);
    }
  }

  return result;
};

/**
 * Extracts service IDs where canPerform is true and syncs to staffSlice
 */
function syncServicesToAllSlices(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  memberId: string,
  services: ServicePayload[]
) {
  // Extract enabled service IDs
  const specialties = services
    .filter(s => s.canPerform)
    .map(s => s.serviceId);

  // Dispatch to staffSlice (this also persists to IndexedDB via the thunk)
  // staffSlice.updateStaffSpecialties → staffDB.update() → IndexedDB
  dispatch(updateStaffSpecialties({ staffId: memberId, specialties }));

  // Note: uiStaffSlice.loadStaff will be called after save/fulfilled
  // to reload fresh data from IndexedDB
}

export default teamStaffSyncMiddleware;
