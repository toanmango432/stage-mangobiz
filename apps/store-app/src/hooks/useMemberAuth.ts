/**
 * useMemberAuth Hook
 *
 * Provides access to the member authentication context.
 * Must be used within an AuthProvider.
 *
 * @returns Member session, online status, grace info, and force logout state.
 * @throws Error if used outside of AuthProvider
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/providers/AuthProvider';

export function useMemberAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useMemberAuth must be used within an AuthProvider');
  }
  return context;
}

export default useMemberAuth;
