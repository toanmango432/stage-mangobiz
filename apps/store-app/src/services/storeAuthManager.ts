/**
 * Store Authentication Manager
 * Manages store login session and member authentication
 * Updated for Supabase-based two-tier authentication (Option C)
 *
 * LOCAL-FIRST Authentication Flow:
 * 1. Check cached session first (instant access if valid)
 * 2. Validate with Supabase in background (non-blocking)
 * 3. Only hit Supabase on first login or expired session
 */

import { secureStorage } from './secureStorage';
import {
  authService,
  AuthError as SupabaseAuthError,
} from './supabase';
import { memberAuthService } from './memberAuthService';
import { devicesDB } from './devicesDB';
import { setStoreTimezone } from '@/utils/dateUtils';
import { auditLogger } from './audit/auditLogger';
import type { DeviceMode, Device } from '@/types/device';
import type { MemberAuthSession } from '@/types/memberAuth';

const OFFLINE_GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ==================== TYPES ====================

export type StoreAuthStatus =
  | 'not_logged_in'      // No store session
  | 'store_logged_in'    // Store authenticated, awaiting member PIN
  | 'active'             // Store + member logged in and validated
  | 'offline_grace'      // Offline but within grace period
  | 'offline_expired'    // Offline grace period expired
  | 'suspended'          // Store suspended
  | 'inactive'           // Store inactive
  | 'checking';          // Currently validating

export interface StoreSession {
  storeId: string;
  storeName: string;
  storeLoginId: string;
  tenantId: string;
  tier: string;
  timezone?: string;  // IANA timezone (e.g., "America/Los_Angeles")
  token?: string;
  deviceMode?: DeviceMode;
  deviceId?: string;
}

export interface LoginOptions {
  deviceMode?: DeviceMode;
  skipMemberLogin?: boolean; // Allow store-only login for some flows
}

export interface MemberSession {
  memberId: string;
  memberName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior' | 'admin';
  avatarUrl?: string;
  permissions?: Record<string, boolean>;
}

export interface StoreAuthState {
  status: StoreAuthStatus;
  store?: StoreSession;
  member?: MemberSession;
  message?: string;
  defaults?: any;
}

type AuthStateListener = (state: StoreAuthState) => void;

// Legacy type alias for backward compatibility
export interface AuthError {
  code: 'NETWORK_ERROR' | 'INVALID_CREDENTIALS' | 'SUSPENDED' | 'INACTIVE' | 'NO_ACCESS' | 'UNKNOWN';
  message: string;
  details?: any;
}

// ==================== MANAGER CLASS ====================

class StoreAuthManager {
  private listeners: AuthStateListener[] = [];
  private currentState: StoreAuthState = {
    status: 'checking',
  };

  /**
   * Initialize auth manager - LOCAL-FIRST: Check cached session first
   */
  async initialize(): Promise<StoreAuthState> {
    console.log('🔐 Initializing Store Auth Manager (LOCAL-FIRST)...');

    // LOCAL-FIRST: Check if session was marked invalid by background validation
    if (authService.isSessionMarkedInvalid()) {
      console.log('⚠️ Session was invalidated - clearing and requiring re-login');
      authService.clearInvalidMarkers();
      await this.logoutStore();
      this.updateState({
        status: 'not_logged_in',
        message: 'Session expired. Please log in again.',
      });
      return this.currentState;
    }

    // LOCAL-FIRST: Check for valid cached session first (instant access)
    const cachedStore = authService.getCachedStoreSession();
    const cachedMember = authService.getCachedMemberSession();

    if (cachedStore?.session && cachedStore.isValid) {
      const storeSession = cachedStore.session;
      const tier = await secureStorage.getTier();

      // Grant IMMEDIATE access with cached session
      console.log('✅ Cached session valid - granting immediate access (LOCAL-FIRST)');

      // Restore timezone from cached session or localStorage
      const storedTz = await this.getStoredTimezone();
      const timezone = storeSession.timezone || storedTz || undefined;
      if (timezone) {
        setStoreTimezone(timezone);
      }

      // Check if we also have a valid member session
      if (cachedMember?.session && cachedMember.isValid) {
        const memberSession = cachedMember.session;
        console.log('✅ Full session restored from cache (store + member)');

        this.updateState({
          status: 'active',
          store: {
            storeId: storeSession.storeId,
            storeName: storeSession.storeName,
            storeLoginId: storeSession.storeLoginId,
            tenantId: storeSession.tenantId,
            tier: tier || storeSession.tier || 'basic',
            timezone,
          },
          member: {
            memberId: memberSession.memberId,
            memberName: `${memberSession.firstName} ${memberSession.lastName}`,
            firstName: memberSession.firstName,
            lastName: memberSession.lastName,
            email: memberSession.email,
            role: memberSession.role,
            avatarUrl: memberSession.avatarUrl || undefined,
            permissions: memberSession.permissions || undefined,
          },
          message: 'Session restored.',
        });

        // Validate in background (non-blocking)
        authService.validateStoreSessionInBackground(storeSession.storeId);
        authService.validateMemberSessionInBackground(memberSession.memberId);

        // Start grace period checker for memberAuthService
        memberAuthService.startGraceChecker();

        return this.currentState;
      }

      // Store session only - grant access
      this.updateState({
        status: 'active',
        store: {
          storeId: storeSession.storeId,
          storeName: storeSession.storeName,
          storeLoginId: storeSession.storeLoginId,
          tenantId: storeSession.tenantId,
          tier: tier || storeSession.tier || 'basic',
          timezone,
        },
        message: 'Store session restored.',
      });

      // Validate in background (non-blocking)
      authService.validateStoreSessionInBackground(storeSession.storeId);

      return this.currentState;
    }

    // Fallback: Check legacy authService session (for backward compatibility)
    const existingSession = authService.getCurrentSession();

    // If we have a store session in authService, restore it
    if (existingSession.isStoreLoggedIn && existingSession.store) {
      const storeSession = existingSession.store;
      const tier = await secureStorage.getTier();
      const deviceMode = await this.getStoredDeviceMode();
      const storedLegacyTz = await this.getStoredTimezone();
      const legacyTimezone = storeSession.timezone || storedLegacyTz || undefined;

      // Restore timezone
      if (legacyTimezone) {
        setStoreTimezone(legacyTimezone);
      }

      // Check if we also have a member session
      if (existingSession.isMemberLoggedIn && existingSession.member) {
        const memberSession = existingSession.member;
        console.log('✅ Full session restored (store + member)');

        this.updateState({
          status: 'active',
          store: {
            storeId: storeSession.storeId,
            storeName: storeSession.storeName,
            storeLoginId: storeSession.storeLoginId,
            tenantId: storeSession.tenantId,
            tier: tier || 'basic',
            timezone: legacyTimezone,
            deviceMode,
          },
          member: {
            memberId: memberSession.memberId,
            memberName: `${memberSession.firstName} ${memberSession.lastName}`,
            firstName: memberSession.firstName,
            lastName: memberSession.lastName,
            email: memberSession.email,
            role: memberSession.role,
            avatarUrl: memberSession.avatarUrl || undefined,
            permissions: memberSession.permissions || undefined,
          },
          message: 'Session restored.',
        });

        // Validate in background
        authService.validateStoreSessionInBackground(storeSession.storeId);

        return this.currentState;
      }

      // Store logged in - grant access (PIN is used inside app for locked features)
      console.log('✅ Store session restored - granting access');
      this.updateState({
        status: 'active',
        store: {
          storeId: storeSession.storeId,
          storeName: storeSession.storeName,
          storeLoginId: storeSession.storeLoginId,
          tenantId: storeSession.tenantId,
          tier: tier || 'basic',
          timezone: legacyTimezone,
          deviceMode,
        },
        message: 'Store session restored.',
      });

      // Validate in background
      authService.validateStoreSessionInBackground(storeSession.storeId);

      return this.currentState;
    }

    // Fallback: Check legacy secureStorage for backward compatibility
    const storeId = await secureStorage.getStoreId();

    if (!storeId) {
      console.log('⚠️ No store session found - login required');
      this.updateState({
        status: 'not_logged_in',
        message: 'Please log in to your store.',
      });
      return this.currentState;
    }

    // We have a legacy stored session - check grace period
    const lastValidation = await secureStorage.getLastValidation();
    const tier = await secureStorage.getTier();

    if (lastValidation) {
      const timeSinceValidation = Date.now() - lastValidation;
      const deviceMode = await this.getStoredDeviceMode();

      if (timeSinceValidation < OFFLINE_GRACE_PERIOD) {
        // Within grace period - allow offline use
        const daysRemaining = Math.ceil(
          (OFFLINE_GRACE_PERIOD - timeSinceValidation) / (24 * 60 * 60 * 1000)
        );
        console.log(`✅ Legacy session restored (offline: ${daysRemaining} days remaining)`);

        this.updateState({
          status: 'offline_grace',
          store: {
            storeId,
            storeName: await this.getStoredStoreName() || 'Your Store',
            storeLoginId: await this.getStoredStoreLoginId() || storeId,
            tenantId: '', // Legacy sessions don't have tenantId
            tier: tier || 'basic',
            deviceMode,
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
   * Log in to a store using Supabase
   * @param loginId - Store login ID (email)
   * @param password - Store password
   * @param options - Login options including device mode
   *
   * Note: Store login grants immediate access to the POS.
   * PIN is used INSIDE the app for restricted features, not for initial login.
   */
  async loginStore(loginId: string, password: string, options?: LoginOptions): Promise<StoreAuthState> {
    const deviceMode = options?.deviceMode || 'online-only';
    // Default: skip member login - store login is sufficient for POS access
    // PIN is used later inside the app for locked features
    const skipMemberLogin = options?.skipMemberLogin !== false;
    console.log('🔐 Logging in to store (Supabase):', loginId, 'device mode:', deviceMode);
    this.updateState({ status: 'checking' });

    try {
      // Use Supabase authService for store login
      const storeSession = await authService.loginStoreWithCredentials(loginId, password);

      // Save session data for offline support
      await secureStorage.setStoreId(storeSession.storeId);
      await this.setStoredStoreName(storeSession.storeName);
      await this.setStoredStoreLoginId(storeSession.storeLoginId);
      await this.setStoredTenantId(storeSession.tenantId);
      await secureStorage.setLastValidation(Date.now());

      // Get license info
      const licenseInfo = await authService.getLicenseInfo(storeSession.tenantId);
      if (licenseInfo?.tier) {
        await secureStorage.setTier(licenseInfo.tier);
      }

      // Store device mode
      await this.setStoredDeviceMode(deviceMode);

      // Set store timezone for date formatting
      if (storeSession.timezone) {
        setStoreTimezone(storeSession.timezone);
        await this.setStoredTimezone(storeSession.timezone);
      }

      console.log('✅ Store login successful (Supabase) with device mode:', deviceMode);

      // Determine next status based on skipMemberLogin option
      const nextStatus = skipMemberLogin ? 'active' : 'store_logged_in';

      this.updateState({
        status: nextStatus,
        store: {
          storeId: storeSession.storeId,
          storeName: storeSession.storeName,
          storeLoginId: storeSession.storeLoginId,
          tenantId: storeSession.tenantId,
          tier: licenseInfo?.tier || 'basic',
          timezone: storeSession.timezone || undefined,
          deviceMode,
        },
        message: skipMemberLogin ? 'Logged in successfully.' : 'Please enter your PIN.',
      });

      // Audit log successful login
      auditLogger.setContext({
        storeId: storeSession.storeId,
        storeName: storeSession.storeName,
        tenantId: storeSession.tenantId,
      });
      auditLogger.log({
        action: 'login',
        entityType: 'store',
        entityId: storeSession.storeId,
        description: `Store login: ${storeSession.storeName}`,
        severity: 'medium',
        success: true,
        metadata: {
          loginId,
          deviceMode,
          tier: licenseInfo?.tier,
        },
      }).catch(console.warn);

      return this.currentState;
    } catch (error) {
      console.error('❌ Store login failed:', error);

      // Audit log failed login attempt
      auditLogger.log({
        action: 'login',
        entityType: 'store',
        description: `Failed login attempt for: ${loginId}`,
        severity: 'high',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Login failed',
        metadata: {
          loginId,
          errorCode: error instanceof SupabaseAuthError ? error.code : undefined,
        },
      }).catch(console.warn);

      // Handle Supabase auth errors
      if (error instanceof SupabaseAuthError) {
        if (error.code === 'NETWORK_ERROR') {
          return await this.handleNetworkError();
        }

        if (error.code === 'STORE_SUSPENDED') {
          this.updateState({
            status: 'suspended',
            message: error.message,
          });
          return this.currentState;
        }

        if (error.code === 'STORE_NOT_FOUND' || error.code === 'INVALID_PASSWORD') {
          this.updateState({
            status: 'not_logged_in',
            message: error.message,
          });
          return this.currentState;
        }
      }

      // Generic error
      this.updateState({
        status: 'not_logged_in',
        message: error instanceof Error ? error.message : 'Login failed',
      });
      return this.currentState;
    }
  }

  /**
   * Log in as a member with email and password (Supabase)
   * Requires store to be logged in first
   */
  async loginMember(email: string, password: string): Promise<{ success: boolean; member?: MemberSession; error?: string }> {
    console.log('👤 Logging in member (Supabase):', email);

    const storeId = this.currentState.store?.storeId;

    try {
      const memberSession = await authService.loginMemberWithPassword(email, password, storeId);

      const member: MemberSession = {
        memberId: memberSession.memberId,
        memberName: `${memberSession.firstName} ${memberSession.lastName}`,
        firstName: memberSession.firstName,
        lastName: memberSession.lastName,
        email: memberSession.email,
        role: memberSession.role,
        avatarUrl: memberSession.avatarUrl || undefined,
        permissions: memberSession.permissions || undefined,
      };

      this.updateState({
        ...this.currentState,
        status: 'active',
        member,
        message: 'Logged in successfully.',
      });

      // Start grace period checker for member session
      memberAuthService.startGraceChecker();

      return { success: true, member };
    } catch (error) {
      console.error('❌ Member login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Direct member login with email and password (without store login first)
   * This method also fetches and sets up the store session automatically
   */
  async loginMemberWithPassword(email: string, password: string): Promise<{ success: boolean; member?: MemberSession; store?: StoreSession; availableStores?: StoreSession[]; error?: string }> {
    console.log('👤 Direct member login (Supabase):', email);

    try {
      // First, authenticate the member
      const memberSession = await authService.loginMemberWithPassword(email, password);

      // Get the member's store access list
      const storeIds = memberSession.storeIds || [];
      if (storeIds.length === 0) {
        throw new Error('No store access assigned to this member');
      }

      // Fetch all store details for switching
      const allStores: StoreSession[] = [];
      for (const storeId of storeIds) {
        const storeDetails = await authService.getStoreById(storeId);
        if (storeDetails) {
          allStores.push({
            storeId: storeDetails.storeId,
            storeName: storeDetails.storeName,
            storeLoginId: storeDetails.storeLoginId,
            tenantId: storeDetails.tenantId,
            tier: storeDetails.tier,
            timezone: storeDetails.timezone || undefined,
          });
        }
      }

      if (allStores.length === 0) {
        throw new Error('Could not load store details');
      }

      // Use the first store as the primary
      const store = allStores[0];

      // Set store timezone for date formatting
      if (store.timezone) {
        setStoreTimezone(store.timezone);
        await this.setStoredTimezone(store.timezone);
      }

      // IMPORTANT: Persist the store session to localStorage for session restoration on refresh
      authService.setStoreSession({
        storeId: store.storeId,
        storeName: store.storeName,
        storeLoginId: store.storeLoginId,
        tenantId: store.tenantId,
        tier: store.tier,
        timezone: store.timezone,
      });

      // Create member session
      const member: MemberSession = {
        memberId: memberSession.memberId,
        memberName: `${memberSession.firstName} ${memberSession.lastName}`,
        firstName: memberSession.firstName,
        lastName: memberSession.lastName,
        email: memberSession.email,
        role: memberSession.role,
        avatarUrl: memberSession.avatarUrl || undefined,
        permissions: memberSession.permissions || undefined,
      };

      // Update state with both store and member
      this.updateState({
        status: 'active',
        store,
        member,
        message: 'Logged in successfully.',
      });

      // Start grace period checker for member session
      memberAuthService.startGraceChecker();

      console.log(`✅ Member has access to ${allStores.length} store(s):`, allStores.map(s => s.storeName).join(', '));

      return { success: true, member, store, availableStores: allStores };
    } catch (error) {
      console.error('❌ Direct member login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Quick login with PIN (Supabase)
   */
  async loginWithPin(pin: string): Promise<MemberSession | null> {
    const storeId = this.currentState.store?.storeId;
    if (!storeId) {
      throw new Error('No store session - cannot use PIN login');
    }

    console.log('🔢 PIN login attempt (Supabase)');

    try {
      const memberSession = await authService.loginMemberWithPin(storeId, pin);

      const member: MemberSession = {
        memberId: memberSession.memberId,
        memberName: `${memberSession.firstName} ${memberSession.lastName}`,
        firstName: memberSession.firstName,
        lastName: memberSession.lastName,
        email: memberSession.email,
        role: memberSession.role,
        avatarUrl: memberSession.avatarUrl || undefined,
        permissions: memberSession.permissions || undefined,
      };

      this.updateState({
        ...this.currentState,
        status: 'active',
        member,
        message: 'Logged in successfully.',
      });

      // Start grace period checker for member session
      memberAuthService.startGraceChecker();

      return member;
    } catch (error) {
      console.error('❌ PIN login failed:', error);
      return null;
    }
  }

  /**
   * Get all members for the current store (for PIN selection UI)
   */
  async getStoreMembers(): Promise<MemberSession[]> {
    const storeId = this.currentState.store?.storeId;
    if (!storeId) {
      return [];
    }

    try {
      const members = await authService.getStoreMembers(storeId);
      return members.map((m) => ({
        memberId: m.memberId,
        memberName: `${m.firstName} ${m.lastName}`,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        role: m.role,
        avatarUrl: m.avatarUrl || undefined,
        permissions: m.permissions || undefined,
      }));
    } catch (error) {
      console.error('❌ Failed to fetch store members:', error);
      return [];
    }
  }

  /**
   * Log out current member (but keep store session)
   */
  logoutMember(): void {
    console.log('👤 Member logged out');

    // Stop grace period checker (will restart when member logs back in)
    memberAuthService.stopGraceChecker();

    authService.logoutMember();
    this.updateState({
      ...this.currentState,
      status: 'store_logged_in',
      member: undefined,
      message: 'Please enter your PIN.',
    });
  }

  /**
   * Log out from store completely
   */
  async logoutStore(): Promise<void> {
    console.log('🔓 Logging out from store...');

    // Audit log logout BEFORE clearing state (so we have context)
    const storeId = this.currentState.store?.storeId;
    const storeName = this.currentState.store?.storeName;
    const memberName = this.currentState.member?.memberName;

    if (storeId) {
      auditLogger.log({
        action: 'logout',
        entityType: 'store',
        entityId: storeId,
        description: memberName
          ? `Logout: ${memberName} from ${storeName}`
          : `Store logout: ${storeName}`,
        severity: 'medium',
        success: true,
        metadata: {
          storeName,
          memberName,
        },
      }).catch(console.warn);

      // Flush immediately since we're logging out
      await auditLogger.flush().catch(console.warn);
    }

    // Stop grace period checker
    memberAuthService.stopGraceChecker();

    // Clear Supabase auth sessions (legacy)
    authService.logoutStore();

    // Clear member auth session
    await memberAuthService.logout();

    // Clear legacy storage
    await secureStorage.clearLicenseData();
    await this.clearStoredStoreName();
    await this.clearStoredStoreLoginId();
    await this.clearStoredTenantId();
    await this.clearStoredDeviceMode();
    await this.clearStoredDeviceId();
    await this.clearStoredTimezone();

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
        const tenantId = await this.getStoredTenantId();
        const deviceMode = await this.getStoredDeviceMode();

        this.updateState({
          status: 'offline_grace',
          store: {
            storeId: storeId || '',
            storeName: await this.getStoredStoreName() || 'Your Store',
            storeLoginId: await this.getStoredStoreLoginId() || storeId || '',
            tenantId: tenantId || '',
            tier: tier || 'basic',
            deviceMode,
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
   * Check if store is operational (fully logged in or within grace period)
   */
  isOperational(): boolean {
    return this.currentState.status === 'active' || this.currentState.status === 'offline_grace';
  }

  /**
   * Check if store login is required (no store session at all)
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
   * Check if member PIN is required (store logged in but no member)
   */
  isMemberLoginRequired(): boolean {
    return this.currentState.status === 'store_logged_in';
  }

  /**
   * Check if store has a valid session (logged in, awaiting PIN, or offline grace)
   */
  hasStoreSession(): boolean {
    return (
      this.currentState.status === 'active' ||
      this.currentState.status === 'store_logged_in' ||
      this.currentState.status === 'offline_grace'
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

  // Tenant ID storage methods
  private async getStoredTenantId(): Promise<string | null> {
    return localStorage.getItem('mango_tenant_id');
  }

  private async setStoredTenantId(id: string): Promise<void> {
    localStorage.setItem('mango_tenant_id', id);
  }

  private async clearStoredTenantId(): Promise<void> {
    localStorage.removeItem('mango_tenant_id');
  }

  // Device ID storage methods
  private async getStoredDeviceId(): Promise<string | null> {
    return localStorage.getItem('mango_device_id');
  }

  private async setStoredDeviceId(id: string): Promise<void> {
    localStorage.setItem('mango_device_id', id);
  }

  private async clearStoredDeviceId(): Promise<void> {
    localStorage.removeItem('mango_device_id');
  }

  // Device mode storage methods
  private async getStoredDeviceMode(): Promise<DeviceMode> {
    const mode = localStorage.getItem('mango_device_mode');
    return (mode === 'offline-enabled' ? 'offline-enabled' : 'online-only') as DeviceMode;
  }

  private async setStoredDeviceMode(mode: DeviceMode): Promise<void> {
    localStorage.setItem('mango_device_mode', mode);
  }

  private async clearStoredDeviceMode(): Promise<void> {
    localStorage.removeItem('mango_device_mode');
  }

  // Timezone storage methods
  private async getStoredTimezone(): Promise<string | null> {
    return localStorage.getItem('mango_store_timezone');
  }

  private async setStoredTimezone(timezone: string): Promise<void> {
    localStorage.setItem('mango_store_timezone', timezone);
  }

  private async clearStoredTimezone(): Promise<void> {
    localStorage.removeItem('mango_store_timezone');
  }

  /**
   * Get the current device mode
   */
  getDeviceMode(): DeviceMode {
    return this.currentState.store?.deviceMode || 'online-only';
  }

  /**
   * Update device mode - syncs to both localStorage and Supabase
   */
  async updateDeviceMode(mode: DeviceMode): Promise<void> {
    const deviceId = this.currentState.store?.deviceId;
    const storeId = this.currentState.store?.storeId;

    // 1. Update localStorage (for immediate local persistence)
    await this.setStoredDeviceMode(mode);

    // 2. Update Supabase (for cross-device sync) if online and we have a device ID
    if (deviceId && navigator.onLine) {
      try {
        await devicesDB.update(deviceId, {
          offlineModeEnabled: mode === 'offline-enabled'
        });
        console.log('✅ Device mode synced to Supabase:', mode);
      } catch (error) {
        console.warn('⚠️ Failed to sync device mode to Supabase:', error);
        // Don't fail - local update is sufficient for now
      }
    } else if (!deviceId && storeId && navigator.onLine) {
      // Try to find device by fingerprint and update
      try {
        const fingerprint = this.getCurrentDeviceFingerprint();
        if (fingerprint) {
          const device = await devicesDB.getByFingerprint(storeId, fingerprint);
          if (device) {
            await devicesDB.update(device.id, {
              offlineModeEnabled: mode === 'offline-enabled'
            });
            // Store the device ID for future updates
            await this.setStoredDeviceId(device.id);
            console.log('✅ Device mode synced to Supabase (found by fingerprint):', mode);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to find/update device in Supabase:', error);
      }
    }

    // 3. Update Redux state
    if (this.currentState.store) {
      this.updateState({
        ...this.currentState,
        store: {
          ...this.currentState.store,
          deviceMode: mode,
        },
      });
    }
  }

  /**
   * Check if offline mode is enabled for this device
   */
  isOfflineModeEnabled(): boolean {
    return this.getDeviceMode() === 'offline-enabled';
  }

  /**
   * Get current device fingerprint
   */
  getCurrentDeviceFingerprint(): string {
    return localStorage.getItem('mango_device_fingerprint') || '';
  }

  /**
   * Get all devices for the current store from Supabase
   */
  async getStoreDevices(): Promise<Array<{
    id: string;
    name?: string;
    deviceFingerprint: string;
    deviceMode: DeviceMode;
    status: 'active' | 'inactive' | 'blocked';
    lastSeenAt: Date;
    platform?: string;
  }>> {
    const storeId = this.currentState.store?.storeId;
    const currentFingerprint = this.getCurrentDeviceFingerprint();

    // If no store ID or offline, return current device only
    if (!storeId || !navigator.onLine) {
      return [{
        id: await this.getStoredDeviceId() || 'current',
        name: 'This Device',
        deviceFingerprint: currentFingerprint || 'current',
        deviceMode: this.getDeviceMode(),
        status: 'active' as const,
        lastSeenAt: new Date(),
        platform: navigator.platform,
      }];
    }

    try {
      // Fetch devices from Supabase
      const devices: Device[] = await devicesDB.getByStoreId(storeId);

      // Map to the expected format
      return devices.map(device => ({
        id: device.id,
        name: device.deviceName || undefined,
        deviceFingerprint: device.deviceFingerprint,
        deviceMode: device.offlineModeEnabled ? 'offline-enabled' as DeviceMode : 'online-only' as DeviceMode,
        status: device.status as 'active' | 'inactive' | 'blocked',
        lastSeenAt: device.lastSeenAt ? new Date(device.lastSeenAt) : new Date(device.registeredAt),
        platform: device.os || device.browser || undefined,
      }));
    } catch (error) {
      console.warn('⚠️ Failed to fetch devices from Supabase:', error);

      // Fallback to current device only
      return [{
        id: await this.getStoredDeviceId() || 'current',
        name: 'This Device',
        deviceFingerprint: currentFingerprint || 'current',
        deviceMode: this.getDeviceMode(),
        status: 'active' as const,
        lastSeenAt: new Date(),
        platform: navigator.platform,
      }];
    }
  }

  /**
   * Update device mode for a remote device via Supabase
   */
  async updateRemoteDeviceMode(deviceId: string, mode: DeviceMode): Promise<void> {
    console.log(`Updating device ${deviceId} to mode: ${mode}`);

    if (!navigator.onLine) {
      throw new Error('Cannot update device while offline');
    }

    try {
      await devicesDB.update(deviceId, {
        offlineModeEnabled: mode === 'offline-enabled'
      });
      console.log('✅ Remote device mode updated:', deviceId, mode);
    } catch (error) {
      console.error('❌ Failed to update remote device mode:', error);
      throw error;
    }
  }

  /**
   * Block/revoke a device via Supabase
   */
  async blockDevice(deviceId: string): Promise<void> {
    console.log(`Blocking device: ${deviceId}`);

    if (!navigator.onLine) {
      throw new Error('Cannot block device while offline');
    }

    const memberId = this.currentState.member?.memberId || 'system';

    try {
      await devicesDB.revoke(deviceId, memberId, 'Blocked by administrator');
      console.log('✅ Device blocked:', deviceId);
    } catch (error) {
      console.error('❌ Failed to block device:', error);
      throw error;
    }
  }

  /**
   * Unblock a device - re-enables a blocked device
   * Note: This requires a custom Supabase update since devicesDB doesn't have unblock
   */
  async unblockDevice(deviceId: string): Promise<void> {
    console.log(`Unblocking device: ${deviceId}`);

    if (!navigator.onLine) {
      throw new Error('Cannot unblock device while offline');
    }

    try {
      // We need to use a direct update to unrevoke
      const { supabase } = await import('@/services/supabase/client');
      await supabase
        .from('devices')
        .update({
          is_revoked: false,
          revoked_at: null,
          revoked_by: null,
          revoke_reason: null,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId);
      console.log('✅ Device unblocked:', deviceId);
    } catch (error) {
      console.error('❌ Failed to unblock device:', error);
      throw error;
    }
  }

  /**
   * Delete/remove a device from Supabase
   */
  async deleteDevice(deviceId: string): Promise<void> {
    console.log(`Deleting device: ${deviceId}`);

    if (!navigator.onLine) {
      throw new Error('Cannot delete device while offline');
    }

    try {
      await devicesDB.delete(deviceId);
      console.log('✅ Device deleted:', deviceId);
    } catch (error) {
      console.error('❌ Failed to delete device:', error);
      throw error;
    }
  }
}

// Singleton instance
export const storeAuthManager = new StoreAuthManager();
