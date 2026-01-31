/**
 * Announcement Service
 * Fetches active announcements from Supabase for POS devices
 *
 * Usage:
 *   const announcements = await getActiveAnnouncements();
 *   // or use the hook: const { announcements, dismiss } = useAnnouncements();
 */

import { supabase } from './supabase/client';
import { storeAuthManager } from './storeAuthManager';

export interface AnnouncementContent {
  title: string;
  body: string;
  summary?: string;
  imageUrl?: string;
  iconEmoji?: string;
  ctas?: {
    label: string;
    url?: string;
    action?: string;
    style: 'primary' | 'secondary' | 'link';
    trackClicks: boolean;
  }[];
}

export interface AnnouncementBehavior {
  dismissible: boolean;
  requireAcknowledgment: boolean;
  showOnce: boolean;
  startsAt?: string;
  expiresAt?: string;
}

export interface Announcement {
  id: string;
  content: AnnouncementContent;
  category: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  priority: 'low' | 'normal' | 'high' | 'critical';
  channels: string[];
  targeting: {
    tiers: string[];
    roles: string[];
  };
  behavior: AnnouncementBehavior;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

// Cache for announcements
let announcementsCache: Announcement[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track dismissed announcements in localStorage
const DISMISSED_KEY = 'mango_dismissed_announcements';

function getDismissedIds(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addDismissedId(id: string): void {
  try {
    const dismissed = getDismissedIds();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  } catch {
    // Ignore localStorage errors
  }
}

// Convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
}

/**
 * Get the current license tier
 */
function getCurrentTier(): string {
  const state = storeAuthManager.getState();
  return state.store?.tier || 'free';
}

/**
 * Get current user role
 */
function getCurrentRole(): string {
  const state = storeAuthManager.getState();
  return state.member?.role || 'staff';
}

/**
 * Fetch active announcements from Supabase
 */
async function fetchAnnouncements(): Promise<Announcement[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (announcementsCache && now - lastFetchTime < CACHE_TTL) {
    return announcementsCache;
  }

  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return loadFromLocalStorage();
    }

    // Convert to camelCase and filter by tier/role
    const tier = getCurrentTier();
    const role = getCurrentRole();

    const announcements = (data || [])
      .map(toCamelCase)
      .filter((a: Announcement) => {
        // Check tier targeting
        const tiers = a.targeting?.tiers || ['all'];
        const tierMatch = tiers.includes('all') || tiers.includes(tier);

        // Check role targeting
        const roles = a.targeting?.roles || ['all'];
        const roleMatch = roles.includes('all') || roles.includes(role);

        return tierMatch && roleMatch;
      });

    // Update cache
    announcementsCache = announcements;
    lastFetchTime = now;
    saveToLocalStorage(announcements);

    return announcements;
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return loadFromLocalStorage();
  }
}

/**
 * Save announcements to localStorage for offline access
 */
function saveToLocalStorage(announcements: Announcement[]): void {
  try {
    localStorage.setItem('mango_announcements', JSON.stringify(announcements));
    localStorage.setItem('mango_announcements_time', String(Date.now()));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Load announcements from localStorage
 */
function loadFromLocalStorage(): Announcement[] {
  try {
    const stored = localStorage.getItem('mango_announcements');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get active announcements (async)
 * Filters out dismissed announcements
 */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const all = await fetchAnnouncements();
  const dismissed = getDismissedIds();

  return all.filter(a => {
    // Filter out dismissed announcements that have showOnce enabled
    if (a.behavior.showOnce && dismissed.includes(a.id)) {
      return false;
    }
    return true;
  });
}

/**
 * Get active announcements sync (from cache or localStorage)
 */
export function getActiveAnnouncementsSync(): Announcement[] {
  if (announcementsCache) {
    const dismissed = getDismissedIds();
    return announcementsCache.filter(a => {
      if (a.behavior.showOnce && dismissed.includes(a.id)) {
        return false;
      }
      return true;
    });
  }

  const stored = loadFromLocalStorage();
  const dismissed = getDismissedIds();
  return stored.filter(a => {
    if (a.behavior.showOnce && dismissed.includes(a.id)) {
      return false;
    }
    return true;
  });
}

/**
 * Get announcements for a specific channel
 */
export async function getAnnouncementsForChannel(channel: string): Promise<Announcement[]> {
  const all = await getActiveAnnouncements();
  return all.filter(a => a.channels.includes(channel));
}

/**
 * Dismiss an announcement
 */
export async function dismissAnnouncement(
  announcementId: string,
  acknowledged = false
): Promise<void> {
  // Add to dismissed list
  addDismissedId(announcementId);

  // Record interaction in Supabase
  try {
    const state = storeAuthManager.getState();

    await supabase.from('announcement_interactions').insert({
      announcement_id: announcementId,
      tenant_id: state.store?.tenantId,
      user_id: state.member?.memberId,
      store_id: state.store?.storeId,
      action: acknowledged ? 'acknowledge' : 'dismiss',
      channel: 'in_app_banner',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording announcement interaction:', error);
  }

  // Update cache
  if (announcementsCache) {
    announcementsCache = announcementsCache.filter(a => a.id !== announcementId);
  }
}

/**
 * Record a view interaction
 */
export async function recordAnnouncementView(
  announcementId: string,
  channel: string
): Promise<void> {
  try {
    const state = storeAuthManager.getState();

    await supabase.from('announcement_interactions').insert({
      announcement_id: announcementId,
      tenant_id: state.store?.tenantId,
      user_id: state.member?.memberId,
      store_id: state.store?.storeId,
      action: 'view',
      channel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording announcement view:', error);
  }
}

/**
 * Record a CTA click
 */
export async function recordCtaClick(
  announcementId: string,
  ctaLabel: string,
  channel: string
): Promise<void> {
  try {
    const state = storeAuthManager.getState();

    await supabase.from('announcement_interactions').insert({
      announcement_id: announcementId,
      tenant_id: state.store?.tenantId,
      user_id: state.member?.memberId,
      store_id: state.store?.storeId,
      action: 'cta_click',
      cta_label: ctaLabel,
      channel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording CTA click:', error);
  }
}

/**
 * Refresh announcements from server
 */
export async function refreshAnnouncements(): Promise<Announcement[]> {
  lastFetchTime = 0; // Invalidate cache
  announcementsCache = null;
  return fetchAnnouncements();
}

/**
 * Announcement service singleton
 */
export const announcementService = {
  getActiveAnnouncements,
  getActiveAnnouncementsSync,
  getAnnouncementsForChannel,
  dismissAnnouncement,
  recordAnnouncementView,
  recordCtaClick,
  refreshAnnouncements,
};

export default announcementService;
