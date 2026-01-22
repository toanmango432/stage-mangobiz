/**
 * useConnectToken Hook
 * React hook to get and refresh JWT tokens for Connect SDK authentication
 *
 * Usage:
 *   const { token, loading, error, refresh, isExpired } = useConnectToken();
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface TokenState {
  token: string | null;
  expiresAt: number | null;
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
  const storeId = useAppSelector(selectStoreId);
  const tenantId = useAppSelector(selectTenantId);
  const memberId = useAppSelector(selectMemberId);
  const memberName = useAppSelector(selectMemberName);
  const memberRole = useAppSelector(selectMemberRole);
  const member = useAppSelector(selectMember);

  // Get Connect config to check if enabled
  const { config } = useConnectConfig();

  // Token state
  const [tokenState, setTokenState] = useState<TokenState>({
    token: null,
    expiresAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Check if token is expired or about to expire (within buffer period)
   */
  const isExpired = useMemo(() => {
    if (!tokenState.expiresAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= tokenState.expiresAt - REFRESH_BUFFER_SECONDS;
  }, [tokenState.expiresAt]);

  /**
   * Fetch a new token from the Edge Function
   */
  const fetchToken = useCallback(async () => {
    // Don't fetch if Connect is disabled
    if (!config.enabled) {
      setTokenState({ token: null, expiresAt: null });
      return;
    }

    // Don't fetch if required auth data is missing
    if (!storeId || !tenantId || !memberId || !member?.email) {
      setError(new Error('Missing required authentication data'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build request payload for Edge Function
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

      // Call Edge Function via Supabase client
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

      setTokenState({
        token: data.token,
        expiresAt: data.expiresAt,
      });
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch Connect token');
      setError(fetchError);
      setTokenState({ token: null, expiresAt: null });
    } finally {
      setLoading(false);
    }
  }, [config.enabled, storeId, tenantId, memberId, memberName, memberRole, member]);

  /**
   * Force refresh token
   */
  const refresh = useCallback(async () => {
    await fetchToken();
  }, [fetchToken]);

  // Fetch token on mount and when dependencies change
  useEffect(() => {
    // Only fetch if Connect is enabled and we have auth data
    if (config.enabled && storeId && memberId) {
      fetchToken();
    } else {
      // Clear token if Connect disabled or no auth
      setTokenState({ token: null, expiresAt: null });
      setError(null);
    }
  }, [config.enabled, storeId, memberId, fetchToken]);

  // Auto-refresh when token is about to expire
  useEffect(() => {
    if (!config.enabled || !tokenState.expiresAt) return;

    // Calculate time until we should refresh (5 min before expiry)
    const now = Math.floor(Date.now() / 1000);
    const refreshAt = tokenState.expiresAt - REFRESH_BUFFER_SECONDS;
    const timeUntilRefresh = refreshAt - now;

    // If already past refresh time, refresh now
    if (timeUntilRefresh <= 0) {
      fetchToken();
      return;
    }

    // Schedule refresh
    const timeoutId = setTimeout(() => {
      fetchToken();
    }, timeUntilRefresh * 1000);

    return () => clearTimeout(timeoutId);
  }, [config.enabled, tokenState.expiresAt, fetchToken]);

  return {
    token: tokenState.token,
    loading,
    error,
    refresh,
    isExpired,
  };
}

export default useConnectToken;
