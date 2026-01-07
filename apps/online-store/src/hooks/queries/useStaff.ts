/**
 * React Query hooks for Staff
 *
 * Provides data fetching for staff/team members with caching and error handling.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { staffRepository, type StaffMember } from '@/services/supabase/repositories';

// Query key factory for staff
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (storeId: string) => [...staffKeys.lists(), storeId] as const,
  forService: (storeId: string, serviceId: string) => [...staffKeys.list(storeId), 'service', serviceId] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
  availability: (staffId: string, date: string) => [...staffKeys.detail(staffId), 'availability', date] as const,
  slots: (staffId: string, date: string, duration: number) =>
    [...staffKeys.availability(staffId, date), 'slots', duration] as const,
};

/**
 * Hook to fetch all online staff members
 */
export function useStaff(storeId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.list(storeId || ''),
    queryFn: async () => {
      if (!storeId) return [];
      return staffRepository.setStoreContext(storeId).getOnlineStaff();
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch staff who can perform a specific service
 */
export function useStaffForService(storeId: string | undefined, serviceId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.forService(storeId || '', serviceId || ''),
    queryFn: async () => {
      if (!storeId || !serviceId) return [];
      return staffRepository.setStoreContext(storeId).getStaffForService(serviceId);
    },
    enabled: !!storeId && !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single staff member by ID
 */
export function useStaffMember(storeId: string | undefined, staffId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.detail(staffId || ''),
    queryFn: async () => {
      if (!storeId || !staffId) return null;
      return staffRepository.setStoreContext(storeId).getStaffById(staffId);
    },
    enabled: !!storeId && !!staffId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch staff availability for a specific date
 */
export function useStaffAvailability(
  storeId: string | undefined,
  staffId: string | undefined,
  date: string | undefined
) {
  return useQuery({
    queryKey: staffKeys.availability(staffId || '', date || ''),
    queryFn: async () => {
      if (!storeId || !staffId || !date) {
        return { workingHours: null, bookedSlots: [] };
      }
      return staffRepository.setStoreContext(storeId).getStaffAvailability(staffId, date);
    },
    enabled: !!storeId && !!staffId && !!date,
    staleTime: 60 * 1000, // 1 minute - availability changes frequently
  });
}

/**
 * Hook to fetch available time slots for a staff member
 */
export function useAvailableSlots(
  storeId: string | undefined,
  staffId: string | undefined,
  date: string | undefined,
  serviceDuration: number
) {
  return useQuery({
    queryKey: staffKeys.slots(staffId || '', date || '', serviceDuration),
    queryFn: async () => {
      if (!storeId || !staffId || !date || !serviceDuration) return [];
      return staffRepository.setStoreContext(storeId).getAvailableSlots(staffId, date, serviceDuration);
    },
    enabled: !!storeId && !!staffId && !!date && serviceDuration > 0,
    staleTime: 60 * 1000, // 1 minute - availability changes frequently
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
}

/**
 * Hook to prefetch staff data
 */
export function usePrefetchStaff(storeId: string | undefined) {
  const queryClient = useQueryClient();

  return (staffId: string) => {
    if (!storeId) return;
    queryClient.prefetchQuery({
      queryKey: staffKeys.detail(staffId),
      queryFn: () => staffRepository.setStoreContext(storeId).getStaffById(staffId),
      staleTime: 5 * 60 * 1000,
    });
  };
}
