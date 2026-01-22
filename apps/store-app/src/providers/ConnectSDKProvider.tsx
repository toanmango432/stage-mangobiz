/**
 * ConnectSDKProvider
 *
 * Provider component that loads the Mango Connect SDK globally and manages its lifecycle.
 * Provides SDK instance and state to children via React context.
 *
 * The SDK is loaded only when Connect is enabled. It reads client/appointment data
 * directly from Biz's Supabase database using the provided credentials.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useConnectConfig } from '@/hooks/useConnectConfig';
import { useConnectToken } from '@/hooks/useConnectToken';
import { supabaseConfig } from '@/services/supabase/client';
import type { ConnectSDKState, ConnectSDKInitOptions } from '@/types';

// ==================== SDK INTERFACE ====================

/**
 * Interface for the Connect SDK object (loaded from external script)
 * These are the methods/modules exposed by the SDK
 */
interface MangoConnectSDK {
  /** Initialize the SDK with configuration */
  init: (options: ConnectSDKInitOptions) => Promise<void>;
  /** Destroy the SDK instance and cleanup */
  destroy: () => void;
  /** Conversations module component */
  ConversationsModule: React.ComponentType;
  /** AI Assistant module component */
  AIAssistantModule: React.ComponentType;
  /** Campaigns module component (future) */
  CampaignsModule?: React.ComponentType;
}

// Declare the SDK on window for TypeScript
declare global {
  interface Window {
    MangoConnectSDK?: MangoConnectSDK;
  }
}

// ==================== CONTEXT TYPES ====================

interface ConnectSDKContextType {
  /** The loaded SDK instance (null if not loaded or disabled) */
  sdk: MangoConnectSDK | null;
  /** Whether the SDK is currently loading */
  loading: boolean;
  /** Error message if SDK failed to load or initialize */
  error: string | null;
  /** Number of unread conversations */
  unreadCount: number;
  /** Retry loading the SDK after an error */
  retry: () => void;
}

const ConnectSDKContext = createContext<ConnectSDKContextType | null>(null);

// ==================== SDK URL ====================

/** Default SDK URL if not specified in environment */
const DEFAULT_SDK_URL = 'https://connect.mango.ai/sdk/v1/mango-connect-sdk.js';

/** Get SDK URL from environment or use default */
function getSDKUrl(): string {
  return import.meta.env.VITE_MANGO_CONNECT_SDK_URL || DEFAULT_SDK_URL;
}

// ==================== PROVIDER ====================

interface ConnectSDKProviderProps {
  children: ReactNode;
}

export function ConnectSDKProvider({ children }: ConnectSDKProviderProps) {
  // Get Connect configuration and token
  const { config, loading: configLoading } = useConnectConfig();
  const { token, refresh: refreshToken, loading: tokenLoading } = useConnectToken();

  // SDK state
  const [sdkState, setSdkState] = useState<ConnectSDKState>({
    loaded: false,
    error: null,
    unreadCount: 0,
  });
  const [sdk, setSdk] = useState<MangoConnectSDK | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  // Track if we've attempted to load
  const [loadAttempted, setLoadAttempted] = useState(false);

  /**
   * Handle unread count changes from SDK
   */
  const handleUnreadCountChange = useCallback((count: number) => {
    setSdkState(prev => ({ ...prev, unreadCount: count }));
  }, []);

  /**
   * Handle SDK errors
   */
  const handleError = useCallback((error: Error) => {
    console.error('[ConnectSDKProvider] SDK error:', error.message);
    setSdkState(prev => ({ ...prev, error: error.message }));
  }, []);

  /**
   * Handle token refresh request from SDK
   */
  const handleTokenRefresh = useCallback(async (): Promise<string> => {
    await refreshToken();
    // Return the new token - this may take a moment to update
    // The hook will trigger a re-render with the new token
    return token || '';
  }, [refreshToken, token]);

  /**
   * Load the SDK script
   */
  const loadScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.MangoConnectSDK) {
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector(
        `script[src="${getSDKUrl()}"]`
      );
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () =>
          reject(new Error('Failed to load Connect SDK script'))
        );
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = getSDKUrl();
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Connect SDK script'));

      document.head.appendChild(script);
    });
  }, []);

  /**
   * Initialize the SDK after script loads
   */
  const initializeSDK = useCallback(async () => {
    if (!window.MangoConnectSDK) {
      throw new Error('Connect SDK not available on window');
    }

    if (!token) {
      throw new Error('No authentication token available');
    }

    const initOptions: ConnectSDKInitOptions = {
      authToken: token,
      bizSupabaseUrl: supabaseConfig.url,
      bizSupabaseKey: supabaseConfig.anonKey,
      onTokenRefresh: handleTokenRefresh,
      onUnreadCountChange: handleUnreadCountChange,
      onError: handleError,
    };

    await window.MangoConnectSDK.init(initOptions);
    return window.MangoConnectSDK;
  }, [token, handleTokenRefresh, handleUnreadCountChange, handleError]);

  /**
   * Load and initialize SDK
   */
  const loadAndInitialize = useCallback(async () => {
    // Don't load if Connect is disabled
    if (!config.enabled) {
      setSdkState({ loaded: false, error: null, unreadCount: 0 });
      setSdk(null);
      return;
    }

    // Don't load if we don't have a token yet
    if (!token) {
      return;
    }

    setScriptLoading(true);
    setSdkState(prev => ({ ...prev, error: null }));

    try {
      // Load the SDK script
      await loadScript();

      // Initialize the SDK
      const loadedSDK = await initializeSDK();

      setSdk(loadedSDK);
      setSdkState(prev => ({ ...prev, loaded: true, error: null }));
      console.log('[ConnectSDKProvider] SDK loaded and initialized');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load Connect SDK';
      console.error('[ConnectSDKProvider] Load error:', errorMessage);
      setSdkState(prev => ({ ...prev, loaded: false, error: errorMessage }));
      setSdk(null);
    } finally {
      setScriptLoading(false);
      setLoadAttempted(true);
    }
  }, [config.enabled, token, loadScript, initializeSDK]);

  /**
   * Retry loading the SDK
   */
  const retry = useCallback(() => {
    setSdkState({ loaded: false, error: null, unreadCount: 0 });
    setLoadAttempted(false);
    loadAndInitialize();
  }, [loadAndInitialize]);

  // Load SDK when enabled and token is available
  useEffect(() => {
    // Wait for config to load
    if (configLoading) return;

    // If Connect is disabled, cleanup and don't load
    if (!config.enabled) {
      if (sdk) {
        sdk.destroy();
        setSdk(null);
      }
      setSdkState({ loaded: false, error: null, unreadCount: 0 });
      return;
    }

    // Wait for token
    if (tokenLoading) return;

    // Load SDK if we have a token and haven't already loaded
    if (token && !loadAttempted && !sdkState.loaded) {
      loadAndInitialize();
    }
  }, [
    config.enabled,
    configLoading,
    token,
    tokenLoading,
    loadAttempted,
    sdkState.loaded,
    loadAndInitialize,
    sdk,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sdk) {
        sdk.destroy();
      }
    };
  }, [sdk]);

  // Re-initialize when token changes (refresh)
  useEffect(() => {
    // Only re-init if SDK is loaded and we get a new token
    if (sdk && token && sdkState.loaded) {
      // The SDK should handle token updates via onTokenRefresh callback
      // But if needed, we could re-init here
    }
  }, [sdk, token, sdkState.loaded]);

  // ==================== CONTEXT VALUE ====================

  const contextValue = useMemo<ConnectSDKContextType>(
    () => ({
      sdk,
      loading: configLoading || tokenLoading || scriptLoading,
      error: sdkState.error,
      unreadCount: sdkState.unreadCount,
      retry,
    }),
    [
      sdk,
      configLoading,
      tokenLoading,
      scriptLoading,
      sdkState.error,
      sdkState.unreadCount,
      retry,
    ]
  );

  // Children always render - the SDK loads in the background
  return (
    <ConnectSDKContext.Provider value={contextValue}>
      {children}
    </ConnectSDKContext.Provider>
  );
}

// ==================== HOOK ====================

/**
 * Access the Connect SDK context
 * Throws if used outside ConnectSDKProvider
 */
export function useConnectSDKContext(): ConnectSDKContextType {
  const context = useContext(ConnectSDKContext);
  if (!context) {
    throw new Error(
      'useConnectSDKContext must be used within ConnectSDKProvider'
    );
  }
  return context;
}

// Export context for external use if needed
export { ConnectSDKContext };
export type { ConnectSDKContextType, MangoConnectSDK };
