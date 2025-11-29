/**
 * Store Authentication Manager
 * Manages store login session and member authentication
 */

import { secureStorage } from './secureStorage';
import {
  loginStore,
  loginMember,
  loginWithPin,
  type StoreLoginResponse,
  type MemberLoginResponse,
  type AuthError,
} from '../api/storeAuthApi';

const OFFLINE_GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ==================== TYPES ====================

export type StoreAuthStatus =
  | 'not_logged_in'      // No store session
  | 'active'             // Store logged in and validated
  | 'offline_grace'      // Offline but within grace period
  | 'offline_expired'    // Offline grace period expired
  | 'suspended'          // Store suspended
  | 'inactive'           // Store inactive
  | 'checking';          // Currently validating

export interface StoreSession {
  storeId: string;
  storeName: string;
  storeLoginId: string;
  tier: string;
  token?: string;
}

export interface MemberSession {
  memberId: string;
  memberName: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  token?: string;
}

export interface StoreAuthState {
  status: StoreAuthStatus;
  store?: StoreSession;
  member?: MemberSession;
  message?: string;
  defaults?: any;
}

type AuthStateListener = (state: StoreAuthState) => void;

// ==================== MANAGER CLASS ====================

class StoreAuthManager {
  private listeners: AuthStateListener[] = [];
  private currentState: StoreAuthState = {
    status: 'checking',
  };

  /**
   * Initialize auth manager - check for existing session
   */
  async initialize(): Promise<StoreAuthState> {
    console.log('🔐 Initializing Store Auth Manager...');

    const storeId = await secureStorage.getStoreId();

    // No stored session
    if (!storeId) {
      console.log('⚠️ No store session found - login required');
      this.updateState({
        status: 'not_logged_in',
        message: 'Please log in to your store.',
      });
      return this.currentState;
    }

    // Check if we can validate online
    const lastValidation = await secureStorage.getLastValidation();
    const tier = await secureStorage.getTier();

    // We have a stored session - check grace period
    if (lastValidation) {
      const timeSinceValidation = Date.now() - lastValidation;

      if (timeSinceValidation < OFFLINE_GRACE_PERIOD) {
        // Within grace period - allow offline use
        const daysRemaining = Math.ceil(
          (OFFLINE_GRACE_PERIOD - timeSinceValidation) / (24 * 60 * 60 * 1000)
        );
        console.log(`✅ Store session restored (offline: ${daysRemaining} days remaining)`);

        this.updateState({
          status: 'offline_grace',
          store: {
            storeId,
            storeName: await this.getStoredStoreName() || 'Your Store',
            storeLoginId: await this.getStoredStoreLoginId() || storeId,
            tier: tier || 'basic',
          },
          message: `Offline mode: ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining.`,
        });
        return this.currentState;
      } else {
        // Grace period expired
        console.warn('⚠️ Offline grace period expired');
        this.updateState({
          status: 'offline_expired',
          message: 'Session expired. Please log in again.',
        });
        return this.currentState;
      }
    }

    // No last validation - need to log in
    this.updateState({
      status: 'not_logged_in',
      message: 'Please log in to your store.',
    });
    return this.currentState;
  }

  /**
   * Log in to a store
   */
  async loginStore(storeId: string, password: string): Promise<StoreAuthState> {
    console.log('🔐 Logging in to store:', storeId);
    this.updateState({ status: 'checking' });

    try {
      const response = await loginStore(storeId, password);

      if (!response.success) {
        throw {
          code: 'INVALID_CREDENTIALS',
          message: response.error || 'Login failed',
        } as AuthError;
      }

      // Save session data
      if (response.store) {
        await secureStorage.setStoreId(response.store.id);
        await this.setStoredStoreName(response.store.name);
        await this.setStoredStoreLoginId(response.store.storeLoginId);
      }
      if (response.license?.tier) {
        await secureStorage.setTier(response.license.tier);
      }
      if (response.defaults) {
        await secureStorage.setDefaults(response.defaults);
      }
      await secureStorage.setLastValidation(Date.now());

      console.log('✅ Store login successful');
      this.updateState({
        status: 'active',
        store: {
          storeId: response.store!.id,
          storeName: response.store!.name,
          storeLoginId: response.store!.storeLoginId,
          tier: response.license?.tier || 'basic',
          token: response.token,
        },
        defaults: response.defaults,
        message: 'Logged in successfully.',
      });

      return this.currentState;
    } catch (error) {
      const authError = error as AuthError;
      console.error('❌ Store login failed:', authError);

      if (authError.code === 'NETWORK_ERROR') {
        // Try to use cached session
        return await this.handleNetworkError();
      }

      if (authError.code === 'SUSPENDED') {
        this.updateState({
          status: 'suspended',
          message: authError.message,
        });
        return this.currentState;
      }

      if (authError.code === 'INACTIVE') {
        this.updateState({
          status: 'inactive',
          message: authError.message,
        });
        return this.currentState;
      }

      this.updateState({
        status: 'not_logged_in',
        message: authError.message,
      });
      return this.currentState;
    }
  }

  /**
   * Log in as a member
   */
  async loginMember(email: string, password: string): Promise<MemberLoginResponse> {
    console.log('👤 Logging in member:', email);

    const storeId = this.currentState.store?.storeId;

    const response = await loginMember(email, password, storeId);

    if (response.success && response.member) {
      this.updateState({
        ...this.currentState,
        member: {
          memberId: response.member.id,
          memberName: response.member.name,
          email: response.member.email,
          role: response.member.role,
          token: response.token,
        },
      });
    }

    return response;
  }

  /**
   * Quick login with PIN
   */
  async loginWithPin(pin: string): Promise<MemberSession | null> {
    const storeId = this.currentState.store?.storeId;
    if (!storeId) {
      throw new Error('No store session - cannot use PIN login');
    }

    console.log('🔢 PIN login attempt');

    try {
      const response = await loginWithPin(pin, storeId);

      if (response.success && response.member) {
        const memberSession: MemberSession = {
          memberId: response.member.id,
          memberName: response.member.name,
          email: response.member.email,
          role: response.member.role,
          token: response.token,
        };

        this.updateState({
          ...this.currentState,
          member: memberSession,
        });

        return memberSession;
      }

      return null;
    } catch (error) {
      console.error('❌ PIN login failed:', error);
      return null;
    }
  }

  /**
   * Log out current member (but keep store session)
   */
  logoutMember(): void {
    console.log('👤 Member logged out');
    this.updateState({
      ...this.currentState,
      member: undefined,
    });
  }

  /**
   * Log out from store completely
   */
  async logoutStore(): Promise<void> {
    console.log('🔓 Logging out from store...');

    await secureStorage.clearLicenseData();
    await this.clearStoredStoreName();
    await this.clearStoredStoreLoginId();

    this.updateState({
      status: 'not_logged_in',
      store: undefined,
      member: undefined,
      message: 'Logged out.',
    });
  }

  /**
   * Handle network errors by using cached session
   */
  private async handleNetworkError(): Promise<StoreAuthState> {
    const lastValidation = await secureStorage.getLastValidation();

    if (lastValidation) {
      const timeSinceValidation = Date.now() - lastValidation;

      if (timeSinceValidation < OFFLINE_GRACE_PERIOD) {
        const daysRemaining = Math.ceil(
          (OFFLINE_GRACE_PERIOD - timeSinceValidation) / (24 * 60 * 60 * 1000)
        );
        console.log(`⚠️ Network error - using offline mode (${daysRemaining} days remaining)`);

        const storeId = await secureStorage.getStoreId();
        const tier = await secureStorage.getTier();

        this.updateState({
          status: 'offline_grace',
          store: {
            storeId: storeId || '',
            storeName: await this.getStoredStoreName() || 'Your Store',
            storeLoginId: await this.getStoredStoreLoginId() || storeId || '',
            tier: tier || 'basic',
          },
          message: `Offline mode: ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining. Please reconnect soon.`,
        });
        return this.currentState;
      }
    }

    this.updateState({
      status: 'not_logged_in',
      message: 'Cannot reach server and no valid session cached. Please check your connection.',
    });
    return this.currentState;
  }

  /**
   * Get current auth state
   */
  getState(): StoreAuthState {
    return this.currentState;
  }

  /**
   * Check if store is operational (logged in or within grace period)
   */
  isOperational(): boolean {
    return this.currentState.status === 'active' || this.currentState.status === 'offline_grace';
  }

  /**
   * Check if login is required
   */
  isLoginRequired(): boolean {
    return (
      this.currentState.status === 'not_logged_in' ||
      this.currentState.status === 'offline_expired' ||
      this.currentState.status === 'suspended' ||
      this.currentState.status === 'inactive'
    );
  }

  /**
   * Check if there's an active member session
   */
  hasMemberSession(): boolean {
    return !!this.currentState.member;
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<StoreAuthState>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  // Helper methods for storing additional session data
  private async getStoredStoreName(): Promise<string | null> {
    // Using localStorage for non-sensitive data
    return localStorage.getItem('mango_store_name');
  }

  private async setStoredStoreName(name: string): Promise<void> {
    localStorage.setItem('mango_store_name', name);
  }

  private async clearStoredStoreName(): Promise<void> {
    localStorage.removeItem('mango_store_name');
  }

  private async getStoredStoreLoginId(): Promise<string | null> {
    return localStorage.getItem('mango_store_login_id');
  }

  private async setStoredStoreLoginId(id: string): Promise<void> {
    localStorage.setItem('mango_store_login_id', id);
  }

  private async clearStoredStoreLoginId(): Promise<void> {
    localStorage.removeItem('mango_store_login_id');
  }
}

// Singleton instance
export const storeAuthManager = new StoreAuthManager();
