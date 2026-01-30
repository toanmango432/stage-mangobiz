import { getSupabaseUrl } from '@/lib/env';
import { Announcement, AnnouncementCategory, AnnouncementPriority } from '@/types/announcement';

const API_BASE = getSupabaseUrl() + '/functions/v1/store';

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  placement: 'global_bar' | 'home_banner' | 'updates_page_only' | 'hidden';
  pinned?: boolean;
  startsAt: string;
  endsAt?: string;
}

/**
 * Fetch all announcements with optional status filter
 */
export async function getAnnouncements(
  status?: 'active' | 'archived' | 'all'
): Promise<Announcement[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  
  const response = await fetch(`${API_BASE}/announcements?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch announcements');
  }
  
  const data = await response.json();
  return data.announcements;
}

/**
 * Fetch single announcement by ID
 */
export async function getAnnouncementById(id: string): Promise<Announcement> {
  const response = await fetch(`${API_BASE}/announcements/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Announcement not found');
    }
    throw new Error('Failed to fetch announcement');
  }
  
  const data = await response.json();
  return data.announcement;
}

/**
 * Create new announcement
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput
): Promise<Announcement> {
  const response = await fetch(`${API_BASE}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create announcement');
  }
  
  const data = await response.json();
  return data.announcement;
}

/**
 * Update existing announcement
 */
export async function updateAnnouncement(
  id: string,
  updates: Partial<CreateAnnouncementInput>
): Promise<Announcement> {
  const response = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update announcement');
  }
  
  const data = await response.json();
  return data.announcement;
}

/**
 * Archive announcement (soft delete)
 */
export async function archiveAnnouncement(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to archive announcement');
  }
}

/**
 * Duplicate an existing announcement
 */
export async function duplicateAnnouncement(id: string): Promise<Announcement> {
  const original = await getAnnouncementById(id);
  
  return createAnnouncement({
    title: `${original.title} (Copy)`,
    content: original.content,
    category: original.category,
    priority: original.priority,
    placement: 'hidden',
    pinned: false,
    startsAt: new Date().toISOString(),
  });
}
