import { getSupabaseUrl } from '@/lib/env';
import {
  MarketingDisplaySettings,
  MarketingDisplaySettingsPatch,
  PromoPlacementUpdate,
  AnnouncementPlacementUpdate,
  PromoDisplayConfig,
  AnnouncementDisplayConfig,
} from '@/types/marketing-settings';

const STORE_API_BASE = `${getSupabaseUrl()}/functions/v1/store`;

/**
 * Default marketing settings when API is unavailable
 */
const DEFAULT_MARKETING_SETTINGS: MarketingDisplaySettings = {
  enablePromotions: true,
  enableAnnouncements: true,
  defaults: {
    promotions: {
      homeBannerEnabled: true,
      homeStripEnabled: true,
      cartHintEnabled: false,
    },
    announcements: {
      globalBarEnabled: true,
      homeBannerEnabled: false,
    },
  },
  promotions: [],
  announcements: [],
};

/**
 * Get current marketing display settings
 * Falls back to defaults if Edge Function is unavailable
 */
export async function getMarketingSettings(): Promise<MarketingDisplaySettings> {
  try {
    const response = await fetch(`${STORE_API_BASE}/marketing-settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Marketing settings API unavailable, using defaults');
      return DEFAULT_MARKETING_SETTINGS;
    }

    const data = await response.json();
    return data.settings;
  } catch (error) {
    // Edge Function doesn't exist or CORS error - use defaults
    console.warn('Marketing settings fetch failed, using defaults:', error);
    return DEFAULT_MARKETING_SETTINGS;
  }
}

/**
 * Update marketing display settings (partial update)
 */
export async function updateMarketingSettings(
  patch: MarketingDisplaySettingsPatch
): Promise<MarketingDisplaySettings> {
  const response = await fetch(`${STORE_API_BASE}/marketing-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update marketing settings');
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Update promotion placement settings
 */
export async function updatePromotionPlacement(
  promotionId: string,
  update: PromoPlacementUpdate
): Promise<MarketingDisplaySettings> {
  const response = await fetch(`${STORE_API_BASE}/marketing-settings/promotion/${promotionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update promotion placement');
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Update announcement placement settings
 */
export async function updateAnnouncementPlacement(
  announcementId: string,
  update: AnnouncementPlacementUpdate
): Promise<MarketingDisplaySettings> {
  const response = await fetch(`${STORE_API_BASE}/marketing-settings/announcement/${announcementId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update announcement placement');
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Get effective promotion display config (with defaults merged)
 */
export function getEffectivePromoDisplay(
  promotionId: string,
  settings: MarketingDisplaySettings
): PromoDisplayConfig | null {
  const override = settings.promotions.find(p => p.id === promotionId);
  
  // If there's an override, return it
  if (override) {
    return override;
  }
  
  // Otherwise, return default behavior (all enabled placements)
  // Frontend will use settings.defaults.promotions to determine which placements are active
  return null;
}

/**
 * Get effective announcement display config (with defaults merged)
 */
export function getEffectiveAnnouncementDisplay(
  announcementId: string,
  settings: MarketingDisplaySettings
): AnnouncementDisplayConfig | null {
  const override = settings.announcements.find(a => a.id === announcementId);
  
  // If there's an override, return it
  if (override) {
    return override;
  }
  
  // Otherwise, return default behavior
  // Frontend will use settings.defaults.announcements to determine which placements are active
  return null;
}

/**
 * Apply promotion to cart
 */
export async function applyPromotionToCart(
  sessionId: string,
  promotionId: string
): Promise<any> {
  const response = await fetch(`${STORE_API_BASE.replace('/store', '')}/cart/${sessionId}/apply-promo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ promotionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to apply promotion');
  }

  const data = await response.json();
  return data.cart;
}
