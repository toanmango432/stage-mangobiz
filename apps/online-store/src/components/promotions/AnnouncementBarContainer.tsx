'use client';

import { useQuery } from '@tanstack/react-query';
import { getActiveAnnouncements } from '@/lib/api/promotions';
import { useMarketingSettings } from '@/hooks/useMarketingSettings';
import { AnnouncementBar } from './AnnouncementBar';
import { getVisibleAnnouncements } from '@/lib/utils/marketingDisplay';

export const AnnouncementBarContainer = () => {
  const { data: settings } = useMarketingSettings();
  const { data: announcements } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: getActiveAnnouncements,
    refetchInterval: 5 * 60 * 1000,
  });

  // Get visible announcements for global bar placement
  const visibleAnnouncements = getVisibleAnnouncements(announcements, settings, 'global_bar');
  
  // Show the first (highest priority) announcement
  const visibleAnnouncement = visibleAnnouncements[0];

  if (!visibleAnnouncement) return null;

  return <AnnouncementBar announcement={visibleAnnouncement} />;
};
