import React, { useMemo } from 'react';
import { StoreContext } from '@/hooks/useStoreContext';

/**
 * StoreProvider reads storeId and tenantId from localStorage and provides
 * them to child components via StoreContext. Renders an error message when
 * either value is missing.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeId = localStorage.getItem('storeId') || '';
  const tenantId = localStorage.getItem('tenantId') || '';

  const value = useMemo(() => {
    if (!storeId || !tenantId) return null;
    return { storeId, tenantId };
  }, [storeId, tenantId]);

  if (!value) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6 text-center max-w-md">
          <h2 className="text-lg font-semibold text-destructive mb-2">Store not configured</h2>
          <p className="text-sm text-muted-foreground">
            Missing store configuration. Please ensure both <code>storeId</code> and{' '}
            <code>tenantId</code> are set in localStorage.
          </p>
        </div>
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
