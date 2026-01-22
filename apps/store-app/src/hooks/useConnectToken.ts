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
  const storeId = useAppSelector(selectStoreId);
  const tenantId = useAppSelector(selectTenantId);
  const memberId = useAppSelector(selectMemberId);
  const memberName = useAppSelector(selectMemberName);
  const memberRole = useAppSelector(selectMemberRole);
  const member = useAppSelector(selectMember);

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
    if (!storeId || !tenantId || !memberId || !member?.email) {
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
        memberEmail: member.email,
        memberName: memberName || 'Unknown',
        role: memberRole || 'staff',
        permissions: Object.entries(member.permissions || {})
          .filter(([, value]) => value === true)
          .map(([key]) => key),
      };

      const { data, error: functionError } = await supabase.functions.invoke<ConnectTokenResponse>(
        'generate-connect-token',
        { body: requestBody }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Failed to generate token');
      }

      if (!data?.token || !data?.expiresAt) {
        throw new Error('Invalid token response from server');
      }

      setToken(data.token);
      setExpiresAt(data.expiresAt);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch Connect token');
      setError(fetchError);
      clearToken();
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [config.enabled, storeId, tenantId, memberId, memberName, memberRole, member, clearToken]);

  // Fetch token on mount and when dependencies change
  useEffect(() => {
    if (config.enabled && storeId && memberId) {
      fetchToken();
    } else {
      clearToken();
      setError(null);
    }
  }, [config.enabled, storeId, memberId, fetchToken, clearToken]);

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
