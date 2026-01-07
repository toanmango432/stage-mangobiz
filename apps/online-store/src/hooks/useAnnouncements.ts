import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  duplicateAnnouncement,
  CreateAnnouncementInput,
} from '@/lib/api/announcements';

/**
 * Hook to fetch announcements with optional status filter
 */
export function useAnnouncements(status?: 'active' | 'archived' | 'all') {
  return useQuery({
    queryKey: ['announcements', status],
    queryFn: () => getAnnouncements(status),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single announcement by ID
 */
export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['announcements', id],
    queryFn: () => getAnnouncementById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => createAnnouncement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

/**
 * Hook to update an existing announcement
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateAnnouncementInput> }) =>
      updateAnnouncement(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

/**
 * Hook to archive an announcement
 */
export function useArchiveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

/**
 * Hook to duplicate an announcement
 */
export function useDuplicateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => duplicateAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}
