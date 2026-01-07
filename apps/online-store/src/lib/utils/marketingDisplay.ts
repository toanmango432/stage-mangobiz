import { MarketingDisplaySettings } from '@/types/marketing-settings';
import { Promotion } from '@/types/promotion';
import { Announcement } from '@/types/announcement';

/**
 * Check if promotion banner should be shown on home page
 */
export const shouldShowPromotionBanner = (
  settings: MarketingDisplaySettings | undefined,
  promotion: Promotion | undefined
): boolean => {
  if (!settings?.enablePromotions) return false;
  if (!promotion) return false;

  // Check per-item override first
  const override = settings.promotions.find(p => p.id === promotion.id);
  if (override) {
    return override.placement === 'home_banner';
  }

  // Fall back to global default
  return settings.defaults.promotions.homeBannerEnabled;
};

/**
 * Check if promotions strip should be shown
 */
export const shouldShowPromotionsStrip = (
  settings: MarketingDisplaySettings | undefined
): boolean => {
  if (!settings?.enablePromotions) return false;
  return settings.defaults.promotions.homeStripEnabled;
};

/**
 * Filter promotions for strip display
 */
export const filterPromotionsForStrip = (
  promotions: Promotion[] | undefined,
  settings: MarketingDisplaySettings | undefined
): Promotion[] => {
  if (!promotions || !settings?.enablePromotions) return [];
  if (!settings.defaults.promotions.homeStripEnabled) return [];

  // Filter based on per-item overrides
  return promotions.filter(promo => {
    const override = settings.promotions.find(p => p.id === promo.id);
    if (override) {
      return override.placement === 'home_strip';
    }
    // If no override, show by default if strip is enabled
    return true;
  });
};

export const getVisibleAnnouncements = (
  announcements: Announcement[] | undefined,
  settings: MarketingDisplaySettings | undefined,
  placement: 'global_bar' | 'home_banner' | 'updates_page_only'
): Announcement[] => {
  if (!announcements || !settings?.enableAnnouncements) return [];
  
  const now = new Date();
  
  // Filter by placement, active status, and date range
  const filtered = announcements.filter(ann => {
    // Check if active
    if (ann.status !== 'active') return false;
    
    // Check date range
    const startDate = new Date(ann.startsAt);
    const endDate = ann.endsAt ? new Date(ann.endsAt) : null;
    if (startDate > now) return false;
    if (endDate && endDate < now) return false;
    
    // Check per-item override
    const override = settings.announcements.find(a => a.id === ann.id);
    if (override) {
      return override.placement === placement;
    }
    
    // Fall back to global defaults for placement matching
    if (placement === 'global_bar') {
      return settings.defaults.announcements.globalBarEnabled;
    }
    if (placement === 'home_banner') {
      return settings.defaults.announcements.homeBannerEnabled;
    }
    
    // updates_page_only shows all announcements
    return placement === 'updates_page_only';
  });
  
  // Sort by: pinned first, then priority (urgent > important > normal > info), then createdAt desc
  const priorityOrder: Record<string, number> = {
    urgent: 4,
    important: 3,
    normal: 2,
    info: 1,
  };
  
  return filtered.sort((a, b) => {
    // Check pinned status from settings
    const aOverride = settings.announcements.find(x => x.id === a.id);
    const bOverride = settings.announcements.find(x => x.id === b.id);
    const aPinned = aOverride?.pinned || false;
    const bPinned = bOverride?.pinned || false;
    
    if (aPinned !== bPinned) return bPinned ? 1 : -1;
    
    // Then by priority
    const aPriority = priorityOrder[a.priority] || 0;
    const bPriority = priorityOrder[b.priority] || 0;
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Then by creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * Check if cart hint should be shown
 */
export const shouldShowCartHint = (
  settings: MarketingDisplaySettings | undefined
): boolean => {
  if (!settings?.enablePromotions) return false;
  return settings.defaults.promotions.cartHintEnabled;
};
