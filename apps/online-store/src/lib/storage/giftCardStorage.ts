/**
 * Gift Card Storage - localStorage CRUD for gift card configuration
 * @deprecated Use catalogSyncService.getGiftCardConfig() and updateGiftCardConfig() instead.
 * This file is retained only for backward compatibility with mockData.ts and api/store.ts fallback.
 * Will be deleted in US-024.
 */

import type { GiftCardConfig } from '@/types/catalog';

export type { GiftCardConfig };

const STORAGE_KEY = 'mango-gift-card-config';

/**
 * @deprecated Use catalogSyncService.getGiftCardConfig() instead
 */
export function initializeGiftCardConfig(): void {
  const config = localStorage.getItem(STORAGE_KEY);
  if (!config) {
    const defaultConfig: GiftCardConfig = {
      enabled: true,
      presetAmounts: [25, 50, 100, 150, 200],
      allowCustomAmounts: true,
      customAmountMin: 10,
      customAmountMax: 500,
      expiryMonths: 12,
      designs: [],
      deliveryOptions: {
        digital: true,
        physical: false,
        messageCharLimit: 200,
      },
      terms: '',
      emailTemplate: {
        subject: 'You received a gift card!',
        body: '',
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
  }
}

/**
 * @deprecated Use catalogSyncService.getGiftCardConfig() instead
 */
export function getGiftCardConfig(): GiftCardConfig | null {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * @deprecated Use catalogSyncService.updateGiftCardConfig() instead
 */
export function updateGiftCardConfig(data: Partial<GiftCardConfig>): GiftCardConfig {
  const current = getGiftCardConfig();

  const updated: GiftCardConfig = {
    ...(current || {
      enabled: true,
      presetAmounts: [25, 50, 100, 150, 200],
      allowCustomAmounts: true,
      customAmountMin: 10,
      customAmountMax: 500,
      expiryMonths: 12,
      designs: [],
      deliveryOptions: {
        digital: true,
        physical: false,
        messageCharLimit: 200,
      },
      terms: '',
      emailTemplate: {
        subject: 'You received a gift card!',
        body: '',
      },
    }),
    ...data,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
