'use client';

/**
 * Authentication Context for Mango Online Store
 *
 * Uses Supabase Auth for customer authentication.
 * Links authenticated users to POS clients via client_auth table.
 *
 * SSR Safety: This is a client-only component ('use client').
 * Auth state initializes as loading on the server and resolves
 * after client-side hydration via useEffect.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { User } from "@/types/user";
import { AppRole } from "@/types/role";
import {
  customerAuthService,
  type ClientAuthRecord,
  type AuthResult,
} from "@/services/auth/authService";
import { supabase } from "@/services/supabase/client";

// Store ID - should come from environment or route params in production
// Support both Vite (import.meta.env) and Next.js (process.env) env patterns during migration
const getDefaultStoreId = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: try both env patterns
    const viteEnv = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_STORE_ID;
    const nextEnv = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID;
    return viteEnv || nextEnv || 'c0000000-0000-0000-0000-000000000001';
  }
  // Server-side: use process.env (Next.js)
  return process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'c0000000-0000-0000-0000-000000000001';
};
const DEFAULT_STORE_ID = getDefaultStoreId();

interface AuthContextType {
  // User state
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  clientAuth: ClientAuthRecord | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Auth methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  // Profile methods
  updateUser: (updates: Partial<User>) => void;

  // Role check
  hasRole: (role: AppRole) => boolean;

  // Client linking
  linkToExistingClient: (clientId: string) => Promise<void>;
  autoLinkByEmail: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/**
 * Convert Supabase user + client data to app User format
 */
function toAppUser(
  supabaseUser: SupabaseUser,
  clientAuth: ClientAuthRecord | null,
  clientData: any | null
): User {
  // If linked to POS client, use that data
  if (clientData) {
    return {
      id: clientData.id,
      email: clientData.email || supabaseUser.email || '',
      firstName: clientData.first_name || '',
      lastName: clientData.last_name || '',
      phone: clientData.phone || '',
      avatar: clientData.avatar_url,
      memberSince: clientData.created_at,
      preferences: {
        notifications: {
          email: true,
          sms: true,
          bookingReminders: true,
          promotional: false,
          newsletter: false,
        },
        communication: {
          preferredMethod: 'email',
          language: 'en',
        },
        service: {
          preferredStaff: [],
          favoriteServices: [],
          timePreference: [],
        },
      },
      addresses: [],
      paymentMethods: [],
    };
  }

  // Use Supabase user metadata
  const metadata = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: metadata.first_name || '',
    lastName: metadata.last_name || '',
    phone: metadata.phone || '',
    memberSince: supabaseUser.created_at || new Date().toISOString(),
    preferences: {
      notifications: {
        email: true,
        sms: true,
        bookingReminders: true,
        promotional: false,
        newsletter: false,
      },
      communication: {
        preferredMethod: 'email',
        language: 'en',
      },
      service: {
        preferredStaff: [],
        favoriteServices: [],
        timePreference: [],
      },
    },
    addresses: [],
    paymentMethods: [],
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // All state initializes as "loading" / null — safe for SSR.
  // Auth resolution happens in useEffect (client-only).
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [clientAuth, setClientAuth] = useState<ClientAuthRecord | null>(null);
  const [clientData, setClientData] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load client data when clientAuth changes
  const loadClientData = useCallback(async (clientId: string | null) => {
    if (!clientId) {
      setClientData(null);
      return;
    }

    const { data } = await customerAuthService.getLinkedClient(clientId);
    setClientData(data);
  }, []);

  // Update user object when dependencies change
  useEffect(() => {
    if (supabaseUser) {
      const appUser = toAppUser(supabaseUser, clientAuth, clientData);
      setUser(appUser);
    } else {
      setUser(null);
    }
  }, [supabaseUser, clientAuth, clientData]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔐 Checking existing session...');

        // Get current session
        const { session: existingSession } = await customerAuthService.getSession();

        if (existingSession?.user) {
          console.log('✅ Session found:', existingSession.user.email);
          setSession(existingSession);
          setSupabaseUser(existingSession.user);

          // Get client_auth record
          const { data: clientAuthData } = await customerAuthService.getClientAuth(
            existingSession.user.id
          );
          setClientAuth(clientAuthData);

          // Load linked client data if exists
          if (clientAuthData?.client_id) {
            await loadClientData(clientAuthData.client_id);
          }
        }

        setIsLoading(false);
        console.log('✅ AuthProvider initialized successfully');
      } catch (error) {
        console.error('❌ AuthProvider initialization failed:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = customerAuthService.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔐 Auth state changed:', event);

        setSession(newSession);
        setSupabaseUser(newSession?.user || null);

        if (newSession?.user) {
          // Refresh client_auth data
          const { data: clientAuthData } = await customerAuthService.getClientAuth(
            newSession.user.id
          );
          setClientAuth(clientAuthData);

          if (clientAuthData?.client_id) {
            await loadClientData(clientAuthData.client_id);
          }
        } else {
          setClientAuth(null);
          setClientData(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadClientData]);

  /**
   * Sign in with email/password
   */
  const login = async (email: string, password: string, _rememberMe = false) => {
    const result = await customerAuthService.signIn({ email, password });

    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }

    // State will be updated via onAuthStateChange
  };

  /**
   * Sign up new user
   */
  const signup = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    const result = await customerAuthService.signUp({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      storeId: DEFAULT_STORE_ID,
    });

    if (!result.success) {
      throw new Error(result.error || 'Sign up failed');
    }

    // Try to auto-link with existing POS client
    if (result.user) {
      await customerAuthService.findAndLinkClientByEmail(
        result.user.id,
        data.email,
        DEFAULT_STORE_ID
      );
    }

    // State will be updated via onAuthStateChange
  };

  /**
   * Sign in with magic link
   */
  const loginWithMagicLink = async (email: string) => {
    const result = await customerAuthService.signInWithMagicLink(email, DEFAULT_STORE_ID);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send magic link');
    }
  };

  /**
   * Sign out
   */
  const logout = async () => {
    await customerAuthService.signOut();
    setSupabaseUser(null);
    setSession(null);
    setClientAuth(null);
    setClientData(null);
    setUser(null);
    setIsAdmin(false);
  };

  /**
   * Request password reset
   */
  const requestPasswordReset = async (email: string) => {
    const result = await customerAuthService.requestPasswordReset(email);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send reset email');
    }
  };

  /**
   * Update password
   */
  const updatePassword = async (newPassword: string) => {
    const result = await customerAuthService.updatePassword(newPassword);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update password');
    }
  };

  /**
   * Change password (requires current password verification)
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!supabaseUser?.email) {
      throw new Error('Not authenticated');
    }

    // Verify current password by attempting to sign in
    const verifyResult = await customerAuthService.signIn({
      email: supabaseUser.email,
      password: currentPassword,
    });

    if (!verifyResult.success) {
      throw new Error('Current password is incorrect');
    }

    // Update to new password
    await updatePassword(newPassword);
  };

  /**
   * Update user profile
   */
  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    // Update local state
    setUser({ ...user, ...updates });

    // Update Supabase user metadata
    if (supabaseUser) {
      supabase.auth.updateUser({
        data: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone: updates.phone,
        },
      });
    }
  };

  /**
   * Check user role
   */
  const hasRole = (role: AppRole): boolean => {
    if (!user) return false;
    // For now, only admin role check
    if (role === 'admin') return isAdmin;
    return role === 'user';
  };

  /**
   * Link to existing POS client
   */
  const linkToExistingClient = async (clientId: string) => {
    if (!supabaseUser) {
      throw new Error('Not authenticated');
    }

    const result = await customerAuthService.linkToClient(
      supabaseUser.id,
      clientId,
      'manual'
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to link account');
    }

    // Refresh client_auth data
    const { data: clientAuthData } = await customerAuthService.getClientAuth(supabaseUser.id);
    setClientAuth(clientAuthData);

    if (clientAuthData?.client_id) {
      await loadClientData(clientAuthData.client_id);
    }
  };

  /**
   * Auto-link by email match
   */
  const autoLinkByEmail = async (): Promise<boolean> => {
    if (!supabaseUser?.email) return false;

    const result = await customerAuthService.findAndLinkClientByEmail(
      supabaseUser.id,
      supabaseUser.email,
      DEFAULT_STORE_ID
    );

    if (result.success && result.clientId) {
      // Refresh client_auth data
      const { data: clientAuthData } = await customerAuthService.getClientAuth(supabaseUser.id);
      setClientAuth(clientAuthData);
      await loadClientData(result.clientId);
      return true;
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        clientAuth,
        isLoading,
        isAuthenticated: !!supabaseUser,
        isAdmin,
        login,
        signup,
        loginWithMagicLink,
        logout,
        requestPasswordReset,
        updatePassword,
        changePassword,
        updateUser,
        hasRole,
        linkToExistingClient,
        autoLinkByEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
