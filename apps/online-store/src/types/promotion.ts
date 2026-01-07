export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'percent' | 'fixed' | 'bogo' | 'free_shipping' | 'new_client' | 'bundle';
  value: number; // percentage or fixed amount
  code?: string; // optional promo code
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
  displayConfig: {
    showOnHomepage: boolean;
    showOnCart: boolean;
    showOnCheckout: boolean;
    showBanner: boolean;
    bannerStyle: 'top' | 'inline' | 'modal' | 'badge';
    priority: number; // for sorting
  };
  conditions?: {
    minPurchase?: number;
    maxDiscount?: number;
    firstTimeOnly?: boolean;
    productCategories?: string[];
    services?: string[];
    applicableTypes?: Array<'product' | 'service' | 'membership' | 'gift-card'>;
  };
  imageUrl?: string;
  badgeText?: string; // e.g., "NEW CLIENT", "LIMITED TIME"
  termsUrl?: string;
}

export interface PromotionValidation {
  valid: boolean;
  reason?: string;
  discount?: {
    amount: number;
    type: 'percent' | 'fixed';
    value: number;
  };
  promotion?: Promotion;
}

export interface AppliedDiscount {
  promotionId: string;
  code: string;
  amount: number;
  type: 'percent' | 'fixed' | 'bogo' | 'free_shipping' | 'new_client' | 'bundle';
  appliedAt: string;
}

export interface PromotionDisplaySettings {
  enablePromotions: boolean;
  homepageLayout: 'banner' | 'grid' | 'carousel' | 'inline';
  cartDisplayMode: 'auto-suggest' | 'manual-code' | 'both';
  bannerPosition: 'top' | 'hero-overlay' | 'between-sections';
  showCountdown: boolean;
  maxVisiblePromotions: number;
  autoApplyBestOffer: boolean;
}

export interface PromotionFilters {
  status?: 'active' | 'scheduled' | 'expired';
  type?: Promotion['type'];
  showOnHomepage?: boolean;
  showBanner?: boolean;
  showOnCart?: boolean;
}
