/**
 * Announcements Query Hooks
 * React Query hooks for announcement management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import {
  Announcement,
  AnnouncementStatus,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@/types/announcement';
import { toast } from 'sonner';

/**
 * Fetch all announcements
 */
export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.list(),
    queryFn: () => announcementsRepository.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single announcement by ID
 */
export function useAnnouncement(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id || ''),
    queryFn: () => announcementsRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch active announcements
 */
export function useActiveAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.active(),
    queryFn: () => announcementsRepository.getActive(),
    staleTime: 2 * 60 * 1000, // 2 minutes - active announcements are time-sensitive
  });
}

/**
 * Fetch announcements by status
 */
export function useAnnouncementsByStatus(status: AnnouncementStatus | undefined) {
  return useQuery({
    queryKey: queryKeys.announcements.byStatus(status || ''),
    queryFn: () => announcementsRepository.getByStatus(status!),
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch announcements by category
 */
export function useAnnouncementsByCategory(category: Announcement['category'] | undefined) {
  return useQuery({
    queryKey: queryKeys.announcements.byCategory(category || ''),
    queryFn: () => announcementsRepository.getByCategory(category!),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch announcement stats
 */
export function useAnnouncementStats() {
  return useQuery({
    queryKey: queryKeys.announcements.stats(),
    queryFn: () => announcementsRepository.getCountByStatus(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, createdBy }: { data: CreateAnnouncementInput; createdBy: string }) =>
      announcementsRepository.createAnnouncement(data, createdBy),
    onSuccess: (newAnnouncement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success('Announcement created', {
        description: `${newAnnouncement.content.title} has been created as draft.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create announcement', { description: error.message });
    },
  });
}

/**
 * Update an announcement
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementInput }) =>
      announcementsRepository.updateAnnouncement(id, data),
    onSuccess: (updatedAnnouncement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(updatedAnnouncement.id) });
      toast.success('Announcement updated', {
        description: `${updatedAnnouncement.content.title} has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update announcement', { description: error.message });
    },
  });
}

/**
 * Delete an announcement
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success('Announcement deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete announcement', { description: error.message });
    },
  });
}

/**
 * Publish an announcement
 */
export function usePublishAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementsRepository.publish(id),
    onSuccess: (announcement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success('Announcement published', {
        description: `${announcement.content.title} is now live.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to publish announcement', { description: error.message });
    },
  });
}

/**
 * Unpublish (pause) an announcement
 */
export function useUnpublishAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementsRepository.unpublish(id),
    onSuccess: (announcement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success('Announcement paused', {
        description: `${announcement.content.title} has been paused.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to pause announcement', { description: error.message });
    },
  });
}

/**
 * Archive an announcement
 */
export function useArchiveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementsRepository.archive(id),
    onSuccess: (announcement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success('Announcement archived', {
        description: `${announcement.content.title} has been archived.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to archive announcement', { description: error.message });
    },
  });
}

/**
 * Search announcements
 */
export function useSearchAnnouncements(searchTerm: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.announcements.all, 'search', searchTerm],
    queryFn: () => announcementsRepository.search(searchTerm!),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1 * 60 * 1000,
  });
}
