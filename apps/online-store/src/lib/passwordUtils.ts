import { PasswordStrength } from "@/types/user";

/**
 * Validates password strength against common security requirements.
 * This is a client-side utility for UI feedback only.
 * Actual password validation should happen server-side via Supabase Auth.
 */
export const validatePasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { checks, strength, score };
};
