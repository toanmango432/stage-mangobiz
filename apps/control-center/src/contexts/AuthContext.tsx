/**
 * Authentication Context for Control Center
 *
 * Uses Supabase Auth for admin user authentication.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase/client";
import { AdminUser, AdminRole, ADMIN_ROLE_PERMISSIONS } from "@/types/auth";
import { toast } from "sonner";

interface AuthContextType {
  user: AdminUser | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Permission check
  hasPermission: (permission: string) => boolean;
  hasRole: (role: AdminRole) => boolean;
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
 * Convert Supabase user to AdminUser
 * Uses JWT user_metadata as primary source (set during user creation)
 */
function toAdminUser(supabaseUser: SupabaseUser): AdminUser {
  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: metadata.name || 'Admin User',
    role: (metadata.role as AdminRole) || 'support',
    isActive: true,
    lastLoginAt: supabaseUser.last_sign_in_at,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update user object when supabaseUser changes
  useEffect(() => {
    if (supabaseUser) {
      const adminUser = toAdminUser(supabaseUser);
      setUser(adminUser);
    } else {
      setUser(null);
    }
  }, [supabaseUser]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user) {
          setSession(existingSession);
          setSupabaseUser(existingSession.user);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setSupabaseUser(newSession?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email/password
   * User role is retrieved from JWT user_metadata (set during user creation)
   */
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Login failed', { description: error.message });
      throw new Error(error.message);
    }

    if (data.user) {
      // Check if user has admin role in metadata
      const role = data.user.user_metadata?.role;
      if (!role || !['super_admin', 'admin', 'support'].includes(role)) {
        await supabase.auth.signOut();
        toast.error('Access denied', { description: 'Your account is not authorized for the Control Center.' });
        throw new Error('Not authorized');
      }

      toast.success('Welcome back!', { description: `Signed in as ${email}` });
    }
  };

  /**
   * Sign out
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setSupabaseUser(null);
    setSession(null);
    setUser(null);
    toast.info('Signed out');
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = ADMIN_ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  /**
   * Check if user has specific role or higher
   */
  const hasRole = (role: AdminRole): boolean => {
    if (!user) return false;

    const roleHierarchy: AdminRole[] = ['support', 'admin', 'super_admin'];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(role);

    return userRoleIndex >= requiredRoleIndex;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isLoading,
        isAuthenticated: !!supabaseUser,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
