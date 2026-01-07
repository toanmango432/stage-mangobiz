import { useQuery } from '@tanstack/react-query';
import { getActiveAnnouncements } from '@/lib/api/promotions';
import { AnnouncementBar } from './promotions/AnnouncementBar';

export const GlobalAnnouncementBar = () => {
  const { data: announcements } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: getActiveAnnouncements,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Show the highest priority announcement
  const topAnnouncement = announcements?.[0];

  if (!topAnnouncement) return null;

  return <AnnouncementBar announcement={topAnnouncement} />;
};
