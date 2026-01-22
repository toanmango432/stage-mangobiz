/**
 * Mango Connect Integration Types
 *
 * TypeScript interfaces for Connect SDK integration settings and state.
 * Connect enables embedding Mango Connect features (messaging, AI assistant)
 * within Mango Biz Store App.
 */

/**
 * Feature flags for individual Connect modules
 */
export interface ConnectFeatures {
  /** Enable client conversations/messaging module */
  conversations: boolean;
  /** Enable AI assistant floating panel */
  aiAssistant: boolean;
  /** Enable marketing campaigns module */
  campaigns: boolean;
}

/**
 * Connect integration configuration stored in store_settings
 */
export interface ConnectConfig {
  /** Master toggle to enable/disable entire Connect integration */
  enabled: boolean;
  /** Individual feature toggles */
  features: ConnectFeatures;
}

/**
 * Runtime state of the Connect SDK
 */
export interface ConnectSDKState {
  /** Whether the SDK script has loaded successfully */
  loaded: boolean;
  /** Error message if SDK failed to load or initialize */
  error: string | null;
  /** Number of unread conversations (for badge display) */
  unreadCount: number;
}

/**
 * JWT token payload for Connect authentication
 */
export interface ConnectTokenPayload {
  storeId: string;
  tenantId: string;
  memberId: string;
  memberEmail: string;
  memberName: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  permissions: string[];
  /** Token expiration timestamp (Unix seconds) */
  exp: number;
  /** Token issued at timestamp (Unix seconds) */
  iat: number;
}

/**
 * Response from generate-connect-token Edge Function
 */
export interface ConnectTokenResponse {
  token: string;
  expiresAt: number;
}

/**
 * Props for the MangoConnectSDK provider component
 * Note: The SDK is a React Provider, not an imperative API
 */
export interface ConnectSDKProviderProps {
  authToken: string;
  bizSupabaseUrl: string;
  bizSupabaseKey: string;
  onTokenRefresh?: () => Promise<string>;
  onError?: (error: Error) => void;
  onReady?: () => void;
  theme?: Record<string, unknown>;
  children?: React.ReactNode;
}

/**
 * Default Connect configuration (all features disabled)
 */
export const DEFAULT_CONNECT_CONFIG: ConnectConfig = {
  enabled: false,
  features: {
    conversations: false,
    aiAssistant: false,
    campaigns: false,
  },
};
