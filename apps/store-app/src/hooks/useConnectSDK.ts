/**
 * useConnectSDK Hook
 *
 * React hook to access the Connect SDK context from ConnectSDKProvider.
 * Provides access to the SDK module, loading state, errors, and connection status.
 *
 * IMPORTANT: Due to React version conflicts, SDK modules cannot be rendered
 * directly as JSX components. Use the `renderInContainer` function instead.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sdkModule, loading, error, isReady, retry, renderInContainer } = useConnectSDK();
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useEffect(() => {
 *     if (!containerRef.current || !sdkModule) return;
 *
 *     // Render SDK module into container using SDK's React
 *     const cleanup = renderInContainer(
 *       containerRef.current,
 *       sdkModule.ConversationsModule
 *     );
 *
 *     return cleanup || undefined;
 *   }, [sdkModule, renderInContainer]);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error onRetry={retry} />;
 *   if (!sdkModule) return null;
 *
 *   // Provide a container for the SDK to render into
 *   return <div ref={containerRef} className="h-full" />;
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
