/**
 * useConnectToken Hook
 * React hook to get and refresh JWT tokens for Connect SDK authentication
 *
 * Usage:
 *   const { token, loading, error, refresh, isExpired } = useConnectToken();
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectStoreId,
  selectTenantId,
  selectMemberId,
  selectMemberName,
  selectMemberRole,
  selectMember,
} from '@/store/slices/authSlice';
import { supabase } from '@/services/supabase/client';
import { useConnectConfig } from './useConnectConfig';
import type { ConnectTokenResponse } from '@/types';

/** Time before expiry to trigger refresh (5 minutes in seconds) */
const REFRESH_BUFFER_SECONDS = 5 * 60;

/** LocalStorage keys for auth data fallback */
const STORE_SESSION_KEY = 'mango_store_session';
// Try multiple keys - memberAuthService uses different key than authService
const MEMBER_SESSION_KEYS = ['mango_member_session', 'member_auth_session'];

/**
 * Helper to get auth data from localStorage as fallback
 * when Redux state is not yet populated
 */
function getAuthFromLocalStorage(): {
  storeId: string | null;
  tenantId: string | null;
  memberId: string | null;
  memberEmail: string | null;
  memberName: string | null;
  memberRole: string | null;
  permissions: Record<string, boolean> | null;
} {
  try {
    const storeData = localStorage.getItem(STORE_SESSION_KEY);

    // Try multiple member session keys (different services use different keys)
    let member = null;
    for (const key of MEMBER_SESSION_KEYS) {
      const memberData = localStorage.getItem(key);
      if (memberData) {
        try {
          member = JSON.parse(memberData);
          if (member?.memberId && member?.email) {
            break; // Found valid member data
          }
        } catch {
          continue;
        }
      }
    }

    const store = storeData ? JSON.parse(storeData) : null;

    return {
      storeId: store?.storeId || null,
      tenantId: store?.tenantId || null,
      memberId: member?.memberId || null,
      memberEmail: member?.email || null,
      // Handle both 'name' (flat) and 'firstName'/'lastName' (split) formats
      memberName: member?.name || (member?.firstName && member?.lastName
        ? `${member.firstName} ${member.lastName}`
        : null),
      memberRole: member?.role || null,
      permissions: member?.permissions || null,
    };
  } catch {
    return {
      storeId: null,
      tenantId: null,
      memberId: null,
      memberEmail: null,
      memberName: null,
      memberRole: null,
      permissions: null,
    };
  }
}

interface UseConnectTokenResult {
  /** Current JWT token for Connect SDK (null if disabled or not fetched) */
  token: string | null;
  /** Whether token is being fetched */
  loading: boolean;
  /** Error if token fetch failed */
  error: Error | null;
  /** Force refresh token */
  refresh: () => Promise<void>;
  /** Whether current token is expired or about to expire */
  isExpired: boolean;
}

/**
 * Hook to get and refresh JWT tokens for Connect SDK
 * Returns null token if Connect is not enabled
 */
export function useConnectToken(): UseConnectTokenResult {
  // Get auth state from Redux
  const reduxStoreId = useAppSelector(selectStoreId);
  const reduxTenantId = useAppSelector(selectTenantId);
  const reduxMemberId = useAppSelector(selectMemberId);
  const reduxMemberName = useAppSelector(selectMemberName);
  const reduxMemberRole = useAppSelector(selectMemberRole);
  const reduxMember = useAppSelector(selectMember);

  // Fallback to localStorage if Redux state is not populated
  // This handles the case where member_auth_session has different structure than Redux expects
  const localAuth = useMemo(() => {
    if (reduxMemberId && reduxMember?.email) {
      return null; // Redux has the data, no fallback needed
    }
    return getAuthFromLocalStorage();
  }, [reduxMemberId, reduxMember?.email]);

  // Use Redux data first, fallback to localStorage
  const storeId = reduxStoreId || localAuth?.storeId || null;
  const tenantId = reduxTenantId || localAuth?.tenantId || null;
  const memberId = reduxMemberId || localAuth?.memberId || null;
  const memberName = reduxMemberName || localAuth?.memberName || null;
  const memberRole = reduxMemberRole || localAuth?.memberRole || null;
  const memberEmail = reduxMember?.email || localAuth?.memberEmail || null;
  const memberPermissions = reduxMember?.permissions || localAuth?.permissions || {};

  // Get Connect config to check if enabled
  const { config } = useConnectConfig();

  // Token state
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for cleanup and preventing concurrent requests
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);

  /**
   * Check if token is expired or about to expire (within buffer period)
   */
  const isExpired = useMemo(() => {
    if (!expiresAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= expiresAt - REFRESH_BUFFER_SECONDS;
  }, [expiresAt]);

  /**
   * Clear token state
   */
  const clearToken = useCallback(() => {
    setToken(null);
    setExpiresAt(null);
  }, []);

  /**
   * Fetch a new token from the Edge Function
   */
  const fetchToken = useCallback(async () => {
    // Don't fetch if Connect is disabled
    if (!config.enabled) {
      clearToken();
      return;
    }

    // Don't fetch if required auth data is missing
    if (!storeId || !tenantId || !memberId || !memberEmail) {
      console.warn('[useConnectToken] Missing required auth data:', {
        hasStoreId: !!storeId,
        hasTenantId: !!tenantId,
        hasMemberId: !!memberId,
        hasMemberEmail: !!memberEmail,
      });
      setError(new Error('Missing required authentication data'));
      return;
    }

    // Prevent concurrent fetch requests
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        storeId,
        tenantId,
        memberId,
        memberEmail,
        memberName: memberName || 'Unknown',
        role: memberRole || 'staff',
        permissions: Object.entries(memberPermissions || {})
          .filter(([, value]) => value === true)
          .map(([key]) => key),
      };

      console.log('[useConnectToken] Fetching token with body:', {
        storeId,
        tenantId,
        memberId,
        memberEmail,
        memberName: memberName || 'Unknown',
        role: memberRole || 'staff',
      });

      // The Supabase client automatically includes the auth session token
      // from the user's Supabase Auth session when calling functions.invoke()
      const { data, error: functionError } = await supabase.functions.invoke<ConnectTokenResponse>(
        'generate-connect-token',
        { body: requestBody }
      );

      if (functionError) {
        console.error('[useConnectToken] Edge function error:', functionError);
        throw new Error(functionError.message || 'Failed to generate token');
      }

      if (!data?.token || !data?.expiresAt) {
        throw new Error('Invalid token response from server');
      }

      console.log('[useConnectToken] Token fetched successfully, expires at:', new Date(data.expiresAt * 1000));
      setToken(data.token);
      setExpiresAt(data.expiresAt);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch Connect token');
      console.error('[useConnectToken] Fetch error:', fetchError.message);
      setError(fetchError);
      clearToken();
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [config.enabled, storeId, tenantId, memberId, memberEmail, memberName, memberRole, memberPermissions, clearToken]);

  // Fetch token on mount and when dependencies change
  useEffect(() => {
    if (config.enabled && storeId && memberId && memberEmail) {
      console.log('[useConnectToken] Config enabled, auth data available, fetching token...');
      fetchToken();
    } else {
      if (config.enabled) {
        console.log('[useConnectToken] Config enabled but missing auth data:', {
          hasStoreId: !!storeId,
          hasMemberId: !!memberId,
          hasMemberEmail: !!memberEmail,
        });
      }
      clearToken();
      setError(null);
    }
  }, [config.enabled, storeId, memberId, memberEmail, fetchToken, clearToken]);

  // Auto-refresh when token is about to expire
  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!config.enabled || !expiresAt) return;

    const now = Math.floor(Date.now() / 1000);
    const refreshAt = expiresAt - REFRESH_BUFFER_SECONDS;
    const timeUntilRefresh = refreshAt - now;

    // If already past refresh time, refresh now
    if (timeUntilRefresh <= 0) {
      fetchToken();
      return;
    }

    // Schedule refresh
    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      fetchToken();
    }, timeUntilRefresh * 1000);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [config.enabled, expiresAt, fetchToken]);

  return {
    token,
    loading,
    error,
    refresh: fetchToken,
    isExpired,
  };
}

export default useConnectToken;
