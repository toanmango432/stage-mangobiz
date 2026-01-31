/**
 * Config Storage - localStorage CRUD for storefront configuration
 * Mock data only - no Supabase
 */

const STORAGE_KEY = 'mango-storefront-config';

export interface StorefrontConfig {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Initialize storefront config with default values
 */
export function initializeStorefrontConfig(): void {
  if (typeof window === 'undefined') return;

  const config = localStorage.getItem(STORAGE_KEY);
  if (!config) {
    const defaultConfig: StorefrontConfig = {
      id: 'default-config',
      primaryColor: 'hsl(280, 65%, 60%)',
      secondaryColor: 'hsl(340, 75%, 55%)',
      accentColor: 'hsl(45, 90%, 60%)',
      fontFamily: 'Inter',
      logoUrl: null,
      faviconUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
  }
}

/**
 * Get storefront config
 */
export function getStorefrontConfig(): StorefrontConfig | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Update storefront config
 */
export function updateStorefrontConfig(data: Partial<StorefrontConfig>): StorefrontConfig | null {
  if (typeof window === 'undefined') return null;

  const current = getStorefrontConfig();
  
  const updated: StorefrontConfig = {
    ...(current || {
      id: 'default-config',
      primaryColor: 'hsl(280, 65%, 60%)',
      secondaryColor: 'hsl(340, 75%, 55%)',
      accentColor: 'hsl(45, 90%, 60%)',
      fontFamily: 'Inter',
      logoUrl: null,
      faviconUrl: null,
      createdAt: new Date().toISOString(),
    }),
    ...data,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
