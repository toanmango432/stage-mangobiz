/**
 * Gift Card Storage - localStorage CRUD for gift card configuration
 * Mock data only - no Supabase
 */

const STORAGE_KEY = 'mango-gift-card-config';

export interface GiftCardConfig {
  id: string;
  enabled: boolean;
  presetAmounts: number[];
  customAmountMin: number;
  customAmountMax: number;
  expiryMonths: number | null;
  deliveryMethods: ('instant' | 'scheduled')[];
  allowMessage: boolean;
  maxMessageLength: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Initialize gift card config with default values
 */
export function initializeGiftCardConfig(): void {
  const config = localStorage.getItem(STORAGE_KEY);
  if (!config) {
    const defaultConfig: GiftCardConfig = {
      id: 'default-giftcard-config',
      enabled: true,
      presetAmounts: [25, 50, 100, 150, 200],
      customAmountMin: 10,
      customAmountMax: 500,
      expiryMonths: 12,
      deliveryMethods: ['instant', 'scheduled'],
      allowMessage: true,
      maxMessageLength: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
  }
}

/**
 * Get gift card config
 */
export function getGiftCardConfig(): GiftCardConfig | null {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Update gift card config
 */
export function updateGiftCardConfig(data: Partial<GiftCardConfig>): GiftCardConfig {
  const current = getGiftCardConfig();
  
  const updated: GiftCardConfig = {
    ...(current || {
      id: 'default-giftcard-config',
      enabled: true,
      presetAmounts: [25, 50, 100, 150, 200],
      customAmountMin: 10,
      customAmountMax: 500,
      expiryMonths: 12,
      deliveryMethods: ['instant', 'scheduled'],
      allowMessage: true,
      maxMessageLength: 200,
      createdAt: new Date().toISOString(),
    }),
    ...data,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
