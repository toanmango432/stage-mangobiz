/**
 * useConnectSDK Hook
 *
 * React hook to access the Connect SDK context from ConnectSDKProvider.
 * Provides access to the SDK module, loading state, errors, and connection status.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sdkModule, loading, error, isReady, retry } = useConnectSDK();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error onRetry={retry} />;
 *   if (!sdkModule) return null;
 *
 *   // Render SDK modules as components
 *   return <sdkModule.ConversationsModule />;
 * }
 * ```
 */

import { useContext } from 'react';
import {
  ConnectSDKContext,
  type ConnectSDKContextType,
} from '@/providers/ConnectSDKProvider';

/**
 * Access the Connect SDK context
 *
 * @returns SDK context with sdk instance, loading state, error, unreadCount, and retry function
 * @throws Error if used outside of ConnectSDKProvider
 */
export function useConnectSDK(): ConnectSDKContextType {
  const context = useContext(ConnectSDKContext);

  if (!context) {
    throw new Error('useConnectSDK must be used within ConnectSDKProvider');
  }

  return context;
}

export default useConnectSDK;
