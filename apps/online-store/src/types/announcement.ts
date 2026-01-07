export type AnnouncementPriority = 'urgent' | 'important' | 'normal' | 'info';
export type AnnouncementCategory = 'hours' | 'services' | 'staff' | 'policies' | 'events';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: 'active' | 'scheduled' | 'archived';
  startsAt: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}
