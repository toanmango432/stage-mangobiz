/**
 * TOTP (Time-based One-Time Password) Service
 * Wraps Supabase MFA APIs for authenticator app integration
 */

import { supabase } from './supabase/client';

export interface TOTPEnrollmentData {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export interface TOTPEnrollmentStatus {
  enrolled: boolean;
  factorId?: string;
}

export const totpService = {
  /**
   * Check if TOTP is enrolled for the current user
   */
  async isEnrolled(): Promise<TOTPEnrollmentStatus> {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error('[TOTP] Error listing factors:', error);
        return { enrolled: false };
      }

      // Find verified TOTP factor
      const totpFactor = data?.totp?.find(
        (factor) => factor.status === 'verified'
      );

      return {
        enrolled: !!totpFactor,
        factorId: totpFactor?.id,
      };
    } catch (error) {
      console.error('[TOTP] Error checking enrollment:', error);
      return { enrolled: false };
    }
  },

  /**
   * Start TOTP enrollment - returns QR code and secret for authenticator app
   */
  async startEnrollment(): Promise<TOTPEnrollmentData> {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      console.error('[TOTP] Enrollment error:', error);
      throw new Error(error.message || 'Failed to start TOTP enrollment');
    }

    if (!data || data.type !== 'totp') {
      throw new Error('Invalid enrollment response');
    }

    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  },

  /**
   * Complete TOTP enrollment by verifying the first code from authenticator app
   */
  async completeEnrollment(factorId: string, code: string): Promise<boolean> {
    try {
      // Challenge the factor
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        console.error('[TOTP] Challenge error:', challengeError);
        throw new Error(challengeError.message || 'Failed to create challenge');
      }

      // Verify with the user's code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        console.error('[TOTP] Verification error:', verifyError);
        // Check if it's an invalid code error
        if (verifyError.message?.includes('Invalid')) {
          throw new Error('Invalid code. Please try again.');
        }
        throw new Error(verifyError.message || 'Verification failed');
      }

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to complete enrollment');
    }
  },

  /**
   * Check if TOTP verification is required for the current session
   * Returns true if user has TOTP enrolled but hasn't verified this session (aal1 -> aal2)
   */
  async isVerificationRequired(): Promise<boolean> {
    try {
      const { data, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        console.error('[TOTP] Error getting AAL:', error);
        return false;
      }

      // If next level is aal2 but current is aal1, verification is required
      return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
    } catch (error) {
      console.error('[TOTP] Error checking verification requirement:', error);
      return false;
    }
  },

  /**
   * Verify TOTP code during login
   * Used when user has TOTP enrolled and needs to complete 2FA
   */
  async verifyCode(code: string): Promise<boolean> {
    try {
      // Get the enrolled TOTP factor
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        console.error('[TOTP] Error listing factors:', factorsError);
        throw new Error('Failed to get authentication factors');
      }

      const totpFactor = factorsData?.totp?.find(
        (factor) => factor.status === 'verified'
      );

      if (!totpFactor) {
        throw new Error('No TOTP factor found');
      }

      // Create challenge
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totpFactor.id });

      if (challengeError) {
        console.error('[TOTP] Challenge error:', challengeError);
        throw new Error('Failed to create verification challenge');
      }

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        console.error('[TOTP] Verification error:', verifyError);
        if (verifyError.message?.includes('Invalid')) {
          throw new Error('Invalid code. Please try again.');
        }
        throw new Error(verifyError.message || 'Verification failed');
      }

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Verification failed');
    }
  },

  /**
   * Unenroll TOTP factor (disable 2FA)
   */
  async unenroll(factorId: string): Promise<void> {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      console.error('[TOTP] Unenroll error:', error);
      throw new Error(error.message || 'Failed to disable two-factor authentication');
    }
  },

  /**
   * Get the current authentication assurance level
   */
  async getAssuranceLevel(): Promise<{
    currentLevel: 'aal1' | 'aal2' | null;
    nextLevel: 'aal1' | 'aal2' | null;
  }> {
    try {
      const { data, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        console.error('[TOTP] Error getting AAL:', error);
        return { currentLevel: null, nextLevel: null };
      }

      return {
        currentLevel: data.currentLevel,
        nextLevel: data.nextLevel,
      };
    } catch (error) {
      console.error('[TOTP] Error getting assurance level:', error);
      return { currentLevel: null, nextLevel: null };
    }
  },
};
