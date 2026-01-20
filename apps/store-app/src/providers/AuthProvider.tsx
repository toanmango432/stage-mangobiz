/**
 * Auth Provider
 *
 * Provides member authentication context and integrates memberAuthService.
 * Features:
 * - Restores cached member session on mount
 * - Manages grace period checker lifecycle
 * - Handles force logout display
 * - Provides offline grace indicator data
 *
 * @see docs/AUTH_MIGRATION_PLAN.md
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectMember,
  selectForceLogoutReason,
  selectForceLogoutMessage,
  clearForceLogoutReason,
  setMemberSession,
} from '@/store/slices/authSlice';
import { memberAuthService } from '@/services/memberAuthService';
import type { MemberAuthSession, GraceInfo, LoginContext } from '@/types/memberAuth';

// ==================== TYPES ====================

interface AuthContextValue {
  /** Current member session from cache (if any) */
  memberSession: MemberAuthSession | null;

  /** Login context: 'store' for store-login devices, 'member' for member-login */
  loginContext: LoginContext;

  /** Whether device is currently online */
  isOnline: boolean;

  /** Grace period info for offline indicator */
  graceInfo: GraceInfo | null;

  /** Force logout reason (if session was invalidated) */
  forceLogoutReason: string | null;

  /** Force logout message to display to user */
  forceLogoutMessage: string | null;

  /** Clear the force logout reason after user acknowledges */
  clearForceLogout: () => void;

  /** Refresh member session from cache */
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ==================== HOOK ====================

/**
 * Hook to access member auth context
 *
 * @throws Error if used outside AuthProvider
 */
export function useMemberAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useMemberAuth must be used within an AuthProvider');
  }
  return context;
}

// ==================== PROVIDER ====================

interface AuthProviderProps {
  children: ReactNode;
  /** Login context: 'store' for store-login devices, 'member' for member-login */
  loginContext?: LoginContext;
}

/**
 * Auth Provider Component
 *
 * Wraps the app to provide member authentication context and manage:
 * - Session restoration from cache
 * - Grace period checker lifecycle
 * - Force logout handling
 * - Online/offline status tracking
 *
 * @example
 * <AuthProvider loginContext="member">
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({
  children,
  loginContext = 'member',
}: AuthProviderProps) {
  const dispatch = useAppDispatch();

  // Redux state
  const member = useAppSelector(selectMember);
  const forceLogoutReason = useAppSelector(selectForceLogoutReason);
  const forceLogoutMessage = useAppSelector(selectForceLogoutMessage);

  // Local state
  const [memberSession, setLocalMemberSession] = useState<MemberAuthSession | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [graceInfo, setGraceInfo] = useState<GraceInfo | null>(null);

  // ==================== ONLINE/OFFLINE TRACKING ====================

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ==================== SESSION RESTORATION ====================

  /**
   * Refresh member session from cache
   */
  const refreshSession = useCallback(() => {
    const cached = memberAuthService.getCachedMemberSession();
    setLocalMemberSession(cached);

    if (cached) {
      // Update grace info
      const grace = memberAuthService.checkOfflineGrace(cached);
      setGraceInfo(grace);
    } else {
      setGraceInfo(null);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Sync with Redux member state
  useEffect(() => {
    if (member?.memberId) {
      // Member logged in - refresh session cache
      refreshSession();
    }
  }, [member?.memberId, refreshSession]);

  // ==================== GRACE CHECKER LIFECYCLE ====================

  useEffect(() => {
    // Start grace checker when member is logged in
    if (member?.memberId && memberSession) {
      memberAuthService.startGraceChecker();
    }

    // Cleanup: stop grace checker on unmount
    return () => {
      memberAuthService.stopGraceChecker();
    };
  }, [member?.memberId, memberSession]);

  // ==================== GRACE INFO UPDATES ====================

  // Periodically update grace info (every minute)
  useEffect(() => {
    if (!memberSession) return;

    const updateGraceInfo = () => {
      const grace = memberAuthService.checkOfflineGrace(memberSession);
      setGraceInfo(grace);
    };

    // Update immediately
    updateGraceInfo();

    // Update every minute
    const interval = setInterval(updateGraceInfo, 60 * 1000);

    return () => clearInterval(interval);
  }, [memberSession]);

  // ==================== FORCE LOGOUT HANDLING ====================

  const clearForceLogout = useCallback(() => {
    dispatch(clearForceLogoutReason());
  }, [dispatch]);

  // ==================== CONTEXT VALUE ====================

  const contextValue: AuthContextValue = {
    memberSession,
    loginContext,
    isOnline,
    graceInfo,
    forceLogoutReason,
    forceLogoutMessage,
    clearForceLogout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
