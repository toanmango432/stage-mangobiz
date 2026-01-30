/**
 * useAnnouncements Hook
 * React hook to access active announcements
 *
 * Usage:
 *   const { announcements, banners, dismiss, isLoading } = useAnnouncements();
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getActiveAnnouncements,
  getActiveAnnouncementsSync,
  getAnnouncementsForChannel,
  dismissAnnouncement,
  recordAnnouncementView,
  recordCtaClick,
  refreshAnnouncements,
  type Announcement,
} from '../services/announcementService';

interface UseAnnouncementsResult {
  announcements: Announcement[];
  banners: Announcement[];
  modals: Announcement[];
  toasts: Announcement[];
  isLoading: boolean;
  error: Error | null;
  dismiss: (id: string, acknowledged?: boolean) => Promise<void>;
  recordView: (id: string, channel: string) => Promise<void>;
  recordClick: (id: string, ctaLabel: string, channel: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to access all active announcements
 */
export function useAnnouncements(): UseAnnouncementsResult {
  // Start with sync data for instant render
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    getActiveAnnouncementsSync()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fresh = await getActiveAnnouncements();
      setAnnouncements(fresh);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load announcements'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const dismiss = useCallback(async (id: string, acknowledged = false) => {
    await dismissAnnouncement(id, acknowledged);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const recordView = useCallback(async (id: string, channel: string) => {
    await recordAnnouncementView(id, channel);
  }, []);

  const recordClick = useCallback(async (id: string, ctaLabel: string, channel: string) => {
    await recordCtaClick(id, ctaLabel, channel);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const fresh = await refreshAnnouncements();
    setAnnouncements(fresh);
    setIsLoading(false);
  }, []);

  // Filter by channel
  const banners = announcements.filter((a) => a.channels.includes('in_app_banner'));
  const modals = announcements.filter((a) => a.channels.includes('in_app_modal'));
  const toasts = announcements.filter((a) => a.channels.includes('in_app_toast'));

  return {
    announcements,
    banners,
    modals,
    toasts,
    isLoading,
    error,
    dismiss,
    recordView,
    recordClick,
    refresh,
  };
}

/**
 * Hook for just banner announcements (lightweight)
 */
export function useBannerAnnouncements(): {
  banners: Announcement[];
  dismiss: (id: string, acknowledged?: boolean) => Promise<void>;
  isLoading: boolean;
} {
  const [banners, setBanners] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await getAnnouncementsForChannel('in_app_banner');
      setBanners(all);
      setIsLoading(false);
    }
    load();
  }, []);

  const dismiss = useCallback(async (id: string, acknowledged = false) => {
    await dismissAnnouncement(id, acknowledged);
    setBanners((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { banners, dismiss, isLoading };
}

/**
 * Hook for modal announcements (priority modals)
 */
export function useModalAnnouncements(): {
  currentModal: Announcement | null;
  dismiss: (acknowledged?: boolean) => Promise<void>;
  hasModals: boolean;
} {
  const [modals, setModals] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const all = await getAnnouncementsForChannel('in_app_modal');
      // Sort by priority (critical first)
      const sorted = all.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      setModals(sorted);
    }
    load();
  }, []);

  const currentModal = modals[currentIndex] || null;
  const hasModals = modals.length > 0;

  const dismiss = useCallback(
    async (acknowledged = false) => {
      if (currentModal) {
        await dismissAnnouncement(currentModal.id, acknowledged);
        setModals((prev) => prev.filter((a) => a.id !== currentModal.id));
        // Move to next modal if available
        if (currentIndex >= modals.length - 1) {
          setCurrentIndex(0);
        }
      }
    },
    [currentModal, currentIndex, modals.length]
  );

  return { currentModal, dismiss, hasModals };
}

export default useAnnouncements;
