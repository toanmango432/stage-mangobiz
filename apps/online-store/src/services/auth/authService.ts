/**
 * Supabase Authentication Service for Mango Online Store
 *
 * Handles customer authentication separate from POS staff authentication.
 * Uses Supabase Auth with client_auth table for linking to POS clients.
 */

import { supabase, withCircuitBreaker } from '../supabase/client';
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import type { ClientAuthInsert, ClientAuthUpdate } from '../supabase/types';

// Types for auth operations
export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  storeId: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ClientAuthRecord {
  id: string;
  auth_user_id: string;
  client_id: string | null;
  store_id: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  link_method: string | null;
  link_token: string | null;
  link_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: SupabaseUser | null;
  session?: Session | null;
  clientAuth?: ClientAuthRecord | null;
  error?: string;
  errorCode?: string;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

/**
 * Customer Authentication Service
 */
export const customerAuthService = {
  /**
   * Sign up a new customer
   * Creates Supabase Auth user + client_auth record
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            store_id: data.storeId,
          },
        },
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
          errorCode: authError.code,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account',
        };
      }

      // 2. Create client_auth record to link with store
      const insertData: ClientAuthInsert = {
        auth_user_id: authData.user!.id,
        store_id: data.storeId,
        email: data.email,
        phone: data.phone || null,
        email_verified: false,
        link_method: 'signup',
      };
      const { data: clientAuth, error: clientAuthError } = await withCircuitBreaker(async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('client_auth') as any)
          .insert(insertData)
          .select()
          .single()
      ) as { data: ClientAuthRecord | null; error: any };

      if (clientAuthError) {
        console.error('Failed to create client_auth record:', clientAuthError);
        // Don't fail the signup if client_auth creation fails
        // The record can be created later
      }

      return {
        success: true,
        user: authData.user,
        session: authData.session,
        clientAuth: clientAuth as ClientAuthRecord | null,
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign up',
      };
    }
  },

  /**
   * Sign in an existing customer
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
          errorCode: authError.code,
        };
      }

      // Get the client_auth record if it exists
      let clientAuth: ClientAuthRecord | null = null;
      if (authData.user) {
        const { data: clientAuthData } = await withCircuitBreaker(async () =>
          supabase
            .from('client_auth')
            .select('*')
            .eq('auth_user_id', authData.user!.id)
            .single()
        ) as { data: ClientAuthRecord | null; error: any };
        clientAuth = clientAuthData;
      }

      return {
        success: true,
        user: authData.user,
        session: authData.session,
        clientAuth,
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign in',
      };
    }
  },

  /**
   * Sign in with magic link (passwordless)
   */
  async signInWithMagicLink(email: string, storeId: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            store_id: storeId,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Magic link error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get the current session
   */
  async getSession(): Promise<{ session: Session | null; error?: AuthError }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session || null, error: error || undefined };
  },

  /**
   * Get the current user
   */
  async getUser(): Promise<{ user: SupabaseUser | null; error?: AuthError }> {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user || null, error: error || undefined };
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update password (after reset or change)
   */
  async updatePassword(newPassword: string): Promise<PasswordResetResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Verify email (called when user clicks verification link)
   */
  async verifyEmail(token: string, type: 'signup' | 'email_change'): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'signup' ? 'signup' : 'email_change',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update client_auth email_verified status
      if (data.user) {
        const updateData: ClientAuthUpdate = { email_verified: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('client_auth') as any)
          .update(updateData)
          .eq('auth_user_id', data.user.id);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Link authenticated user to existing POS client
   * This connects the Supabase Auth user to their client record in the POS system
   */
  async linkToClient(
    authUserId: string,
    clientId: string,
    method: 'manual' | 'email_match' | 'phone_match' = 'manual'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: ClientAuthUpdate = {
        client_id: clientId,
        link_method: method,
        updated_at: new Date().toISOString(),
      };
      const { error } = await withCircuitBreaker(async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('client_auth') as any)
          .update(updateData)
          .eq('auth_user_id', authUserId)
      ) as { error: any };

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Auto-link: Find matching POS client by email
   */
  async findAndLinkClientByEmail(
    authUserId: string,
    email: string,
    storeId: string
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      // Search for client with matching email in the store
      const { data: clients, error: searchError } = await withCircuitBreaker(async () =>
        supabase
          .from('clients')
          .select('id, email, first_name, last_name')
          .eq('store_id', storeId)
          .ilike('email', email)
          .limit(1)
      ) as { data: Array<{ id: string; email: string; first_name: string; last_name: string }> | null; error: any };

      if (searchError) {
        return { success: false, error: searchError.message };
      }

      if (!clients || clients.length === 0) {
        return { success: false, error: 'No matching client found' };
      }

      const client = clients[0];

      // Link the auth user to the client
      const linkResult = await this.linkToClient(authUserId, client.id, 'email_match');

      if (!linkResult.success) {
        return linkResult;
      }

      return { success: true, clientId: client.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get the client_auth record for the current user
   */
  async getClientAuth(authUserId: string): Promise<{ data: ClientAuthRecord | null; error?: string }> {
    try {
      const { data, error } = await withCircuitBreaker(async () =>
        supabase
          .from('client_auth')
          .select('*')
          .eq('auth_user_id', authUserId)
          .single()
      ) as { data: ClientAuthRecord | null; error: any };

      if (error) {
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Get the linked POS client record
   */
  async getLinkedClient(clientId: string): Promise<{ data: any | null; error?: string }> {
    try {
      const { data, error } = await withCircuitBreaker(async () =>
        supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()
      ) as { data: any | null; error: any };

      if (error) {
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

export default customerAuthService;
