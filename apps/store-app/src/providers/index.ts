/**
 * Providers Index
 * Export all React context providers
 *
 * NOTE: Hooks are exported from @/hooks/ for HMR compatibility.
 * Component files should only export components.
 */

export { default as SupabaseSyncProvider, SupabaseSyncContext } from './SupabaseSyncProvider';
export { default as AuthProvider, AuthContext } from './AuthProvider';
export type { AuthContextValue } from './AuthProvider';

// Re-export hooks for convenience
export { useSupabaseSync } from '@/hooks/useSupabaseSync';
export { useMemberAuth } from '@/hooks/useMemberAuth';
