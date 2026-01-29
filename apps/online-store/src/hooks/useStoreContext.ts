import { createContext, useContext } from 'react';

export interface StoreContextValue {
  storeId: string;
  tenantId: string;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

/**
 * Hook to access the current store's storeId and tenantId.
 * Throws if values are missing — callers should be wrapped in <StoreProvider>.
 */
export function useStoreContext(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error(
      'useStoreContext must be used within a <StoreProvider>. ' +
      'Wrap admin routes with StoreProvider.'
    );
  }
  return ctx;
}
