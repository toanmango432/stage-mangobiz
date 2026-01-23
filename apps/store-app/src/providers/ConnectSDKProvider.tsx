/**
 * ConnectSDKProvider
 *
 * Provider component that loads the Mango Connect SDK globally and manages its lifecycle.
 * Provides SDK module reference and render functions to children via React context.
 *
 * IMPORTANT: Due to React version conflicts between the host app (bundled React) and
 * the SDK (loaded from CDN), SDK components CANNOT be rendered directly in JSX.
 * Instead, use the `renderInContainer` function to mount SDK modules into isolated
 * DOM containers.
 *
 * The SDK is loaded only when Connect is enabled. It reads client/appointment data
 * directly from Biz's Supabase database using the provided credentials.
 */

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type ComponentType,
} from 'react';
import { useConnectConfig } from '@/hooks/useConnectConfig';
import { useConnectToken } from '@/hooks/useConnectToken';
import { supabaseConfig } from '@/services/supabase/client';

// ==================== SDK TYPES ====================

/**
 * Props for the MangoConnectSDK provider component
 */
interface MangoConnectSDKProps {
  authToken: string;
  bizSupabaseUrl: string;
  bizSupabaseKey: string;
  onTokenRefresh?: () => Promise<string>;
  onError?: (error: Error) => void;
  onReady?: () => void;
  theme?: Record<string, unknown>;
  children?: ReactNode;
}

/**
 * SDK module exports from the Connect SDK package
 */
interface MangoConnectSDKModule {
  /** Provider component that wraps children with SDK context */
  MangoConnectSDK: ComponentType<MangoConnectSDKProps>;
  /** Conversations module component */
  ConversationsModule: ComponentType;
  /** AI Assistant module component */
  AIAssistantModule: ComponentType;
  /** Campaigns module component */
  CampaignsModule?: ComponentType;
  /** Automations module component */
  AutomationsModule?: ComponentType;
  /** SDK version string */
  SDK_VERSION?: string;
}

// Declare globals for SDK and React from CDN
declare global {
  interface Window {
    __MangoConnectSDKModule?: MangoConnectSDKModule;
    __MangoConnectReact?: typeof import('react');
    __MangoConnectReactDOM?: typeof import('react-dom/client');
    __MangoConnectInitialized?: boolean;
    __MangoConnectConfig?: {
      authToken: string;
      bizSupabaseUrl: string;
      bizSupabaseKey: string;
      onTokenRefresh?: () => Promise<string>;
      onError?: (error: Error) => void;
      onReady?: () => void;
    };
  }
}

// ==================== CONTEXT TYPES ====================

export interface ConnectSDKContextType {
  /** SDK module components (null if not loaded or disabled) */
  sdkModule: MangoConnectSDKModule | null;
  /** Whether the SDK is currently loading */
  loading: boolean;
  /** Error message if SDK failed to load */
  error: string | null;
  /** Whether the SDK is ready (connected and initialized) */
  isReady: boolean;
  /** Number of unread conversations */
  unreadCount: number;
  /** Retry loading the SDK after an error */
  retry: () => void;
  /**
   * Render an SDK module into a container element.
   * Use this instead of JSX to avoid React version conflicts.
   * Returns a cleanup function to unmount the component.
   */
  renderInContainer: (
    container: HTMLElement,
    ModuleComponent: ComponentType
  ) => (() => void) | null;
}

export const ConnectSDKContext = createContext<ConnectSDKContextType | null>(null);

// ==================== SDK URL ====================

/** Default SDK URL if not specified in environment */
const DEFAULT_SDK_URL = 'https://mango-connect.vercel.app/sdk/mango-connect-sdk.js';
const DEFAULT_CSS_URL = 'https://mango-connect.vercel.app/sdk/mango-connect-sdk.css';

/** Allowed SDK domains for security validation */
const ALLOWED_SDK_DOMAINS = [
  'connect.mango.ai',
  'sdk.mango.ai',
  'connect-staging.mango.ai',
  'mango-connect.vercel.app',
  'localhost',
];

/**
 * Validate SDK URL against allowed domains
 */
function isValidSDKUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      return false;
    }
    return ALLOWED_SDK_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/** Get SDK URL from environment or use default */
function getSDKUrl(): string {
  const envUrl = import.meta.env.VITE_MANGO_CONNECT_SDK_URL;
  if (envUrl) {
    if (!isValidSDKUrl(envUrl)) {
      console.error('[ConnectSDKProvider] Invalid SDK URL. Using default.');
      return DEFAULT_SDK_URL;
    }
    return envUrl;
  }
  return DEFAULT_SDK_URL;
}

/** Get CSS URL from environment or use default - exported for ShadowDOMContainer */
export function getSDKCSSUrl(): string {
  const envUrl = import.meta.env.VITE_MANGO_CONNECT_CSS_URL;
  if (envUrl && isValidSDKUrl(envUrl)) {
    return envUrl;
  }
  return DEFAULT_CSS_URL;
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
  const [sdkModule, setSdkModule] = useState<MangoConnectSDKModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scriptLoading, setScriptLoading] = useState(false);

  // Ref to hold current token for async callbacks
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Ref to store loaded SDK module (for caching)
  const sdkModuleRef = useRef<MangoConnectSDKModule | null>(null);

  /**
   * Handle SDK ready event
   */
  const handleSDKReady = useCallback(() => {
    console.log('[ConnectSDKProvider] SDK is ready');
    setIsReady(true);
  }, []);

  /**
   * Handle SDK errors
   */
  const handleSDKError = useCallback((err: Error) => {
    console.error('[ConnectSDKProvider] SDK error:', err.message);
    setError(err.message);
  }, []);

  /**
   * Handle token refresh request from SDK
   */
  const handleTokenRefresh = useCallback(async (): Promise<string> => {
    await refreshToken();
    return tokenRef.current || '';
  }, [refreshToken]);

  /**
   * Load the SDK and React from CDN using inline module script.
   * Both SDK and React are loaded from the same source (esm.sh via import map)
   * to ensure they share the same React instance.
   */
  const loadSDKModule = useCallback((): Promise<MangoConnectSDKModule> => {
    return new Promise((resolve, reject) => {
      // CSS is now loaded inside ShadowDOMContainer to prevent global style conflicts
      // See AIAssistantPanel.tsx for the new CSS loading approach

      // Return cached module if already loaded
      if (sdkModuleRef.current) {
        resolve(sdkModuleRef.current);
        return;
      }

      // Check if already loaded on window
      if (window.__MangoConnectSDKModule) {
        sdkModuleRef.current = window.__MangoConnectSDKModule;
        resolve(window.__MangoConnectSDKModule);
        return;
      }

      const sdkUrl = getSDKUrl();
      const scriptId = 'mango-connect-sdk-loader';

      // Check if script already exists
      if (document.getElementById(scriptId)) {
        const checkInterval = setInterval(() => {
          if (window.__MangoConnectSDKModule) {
            clearInterval(checkInterval);
            sdkModuleRef.current = window.__MangoConnectSDKModule;
            resolve(window.__MangoConnectSDKModule);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for SDK to load'));
        }, 10000);
        return;
      }

      // Create inline module script that imports SDK and React, exposing both to window
      // This ensures SDK components use the same React instance when rendered
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'module';
      script.textContent = `
        import * as SDK from '${sdkUrl}';
        import * as React from 'react';
        import * as ReactDOMClient from 'react-dom/client';

        window.__MangoConnectSDKModule = SDK;
        window.__MangoConnectReact = React;
        window.__MangoConnectReactDOM = ReactDOMClient;
        window.dispatchEvent(new CustomEvent('mango-connect-sdk-loaded'));
        console.log('[ConnectSDKProvider] SDK and React loaded, SDK exports:', Object.keys(SDK));
      `;

      const handleLoaded = () => {
        window.removeEventListener('mango-connect-sdk-loaded', handleLoaded);
        if (window.__MangoConnectSDKModule) {
          sdkModuleRef.current = window.__MangoConnectSDKModule;
          console.log('[ConnectSDKProvider] SDK module loaded successfully');
          resolve(window.__MangoConnectSDKModule);
        } else {
          reject(new Error('SDK module not found on window after load'));
        }
      };

      window.addEventListener('mango-connect-sdk-loaded', handleLoaded);

      script.onerror = () => {
        window.removeEventListener('mango-connect-sdk-loaded', handleLoaded);
        reject(new Error('Failed to load Connect SDK script'));
      };

      document.head.appendChild(script);

      setTimeout(() => {
        window.removeEventListener('mango-connect-sdk-loaded', handleLoaded);
        if (!sdkModuleRef.current) {
          reject(new Error('Timeout loading Connect SDK module'));
        }
      }, 15000);
    });
  }, []);

  /**
   * Load SDK module
   */
  const loadAndInitialize = useCallback(async () => {
    if (!config.enabled || !token) return;

    setScriptLoading(true);
    setError(null);
    setIsReady(false);

    try {
      const module = await loadSDKModule();
      setSdkModule(module);

      // Store config for renderInContainer
      window.__MangoConnectConfig = {
        authToken: token,
        bizSupabaseUrl: supabaseConfig.url,
        bizSupabaseKey: supabaseConfig.anonKey,
        onTokenRefresh: handleTokenRefresh,
        onError: handleSDKError,
        onReady: handleSDKReady,
      };

      console.log('[ConnectSDKProvider] SDK module ready for use');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Connect SDK';
      console.error('[ConnectSDKProvider] Load error:', errorMessage);
      setError(errorMessage);
      setSdkModule(null);
    } finally {
      setScriptLoading(false);
    }
  }, [config.enabled, token, loadSDKModule, handleTokenRefresh, handleSDKError, handleSDKReady]);

  /**
   * Render an SDK module into a container element using the SDK's React.
   * This avoids React version conflicts by using the same React that the SDK uses.
   */
  const renderInContainer = useCallback((
    container: HTMLElement,
    ModuleComponent: ComponentType
  ): (() => void) | null => {
    const React = window.__MangoConnectReact;
    const ReactDOM = window.__MangoConnectReactDOM;
    const SDK = window.__MangoConnectSDKModule;
    const sdkConfig = window.__MangoConnectConfig;

    if (!React || !ReactDOM || !SDK || !sdkConfig) {
      console.error('[ConnectSDKProvider] Cannot render: SDK or React not loaded');
      return null;
    }

    try {
      // Create the component tree: MangoConnectSDK provider wrapping the module
      const element = React.createElement(
        SDK.MangoConnectSDK,
        sdkConfig,
        React.createElement(ModuleComponent)
      );

      // Create React root and render
      const root = ReactDOM.createRoot(container);
      root.render(element);

      // Return cleanup function
      return () => {
        root.unmount();
      };
    } catch (err) {
      console.error('[ConnectSDKProvider] Render error:', err);
      return null;
    }
  }, []);

  /**
   * Retry loading the SDK
   */
  const retry = useCallback(() => {
    setError(null);
    setUnreadCount(0);
    setIsReady(false);
    loadAndInitialize();
  }, [loadAndInitialize]);

  // Load SDK when enabled and token is available
  useEffect(() => {
    if (configLoading || tokenLoading) return;

    // If Connect is disabled, cleanup
    if (!config.enabled) {
      setSdkModule(null);
      setError(null);
      setUnreadCount(0);
      setIsReady(false);
      window.__MangoConnectConfig = undefined;
      return;
    }

    // Load SDK if we have a token but no SDK yet
    if (token && !sdkModule && !scriptLoading && !error) {
      loadAndInitialize();
    }
  }, [config.enabled, configLoading, token, tokenLoading, sdkModule, scriptLoading, error, loadAndInitialize]);

  // ==================== CONTEXT VALUE ====================

  const contextValue = useMemo<ConnectSDKContextType>(() => ({
    sdkModule,
    loading: configLoading || tokenLoading || scriptLoading,
    error,
    isReady,
    unreadCount,
    retry,
    renderInContainer,
  }), [sdkModule, configLoading, tokenLoading, scriptLoading, error, isReady, unreadCount, retry, renderInContainer]);

  // ==================== RENDER ====================

  // Just provide context - don't wrap children with SDK provider
  // SDK modules should be rendered via renderInContainer to avoid React conflicts
  return (
    <ConnectSDKContext.Provider value={contextValue}>
      {children}
    </ConnectSDKContext.Provider>
  );
}

// Export SDK module type for consumers
export type { MangoConnectSDKModule };
