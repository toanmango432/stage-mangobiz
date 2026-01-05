/**
 * AddTeamMember Utilities
 */

import type { MemberRow } from '@/services/supabase/types';
import type { StaffRole } from '../../types';
import { allDefaultRoles } from '../../../role-settings/constants';

/**
 * Generate dynamic role labels from role-settings
 */
export const getDynamicRoleLabels = (): Record<string, string> => {
  const labels: Record<string, string> = {};
  allDefaultRoles.forEach(role => {
    labels[role.id] = role.name;
  });
  return labels;
};

/**
 * UUID v4 generator
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate random password (8 chars: letters + numbers)
 */
export function generateRandomPassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

/**
 * Generate random PIN (4 digits)
 */
export function generateRandomPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate invite token
 */
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Send credentials notification via email/sms
 */
export async function sendCredentialsNotification(params: {
  method: 'email' | 'sms' | 'both';
  email: string;
  phone: string;
  firstName: string;
  pin: string;
  password?: string;
  inviteLink?: string;
}): Promise<void> {
  const { method, email, phone, firstName, pin, password, inviteLink } = params;

  let message = `Hi ${firstName},\n\nYour account has been created.\n\nYour PIN: ${pin}\n`;
  if (password) {
    message += `Your Password: ${password}\n`;
  }
  if (inviteLink) {
    message += `\nSet up your password here: ${inviteLink}\n`;
  }
  message += `\nYou can change your PIN and password anytime in your profile settings.`;

  if (method === 'email' || method === 'both') {
    const subject = encodeURIComponent('Your account credentials');
    const body = encodeURIComponent(message);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    console.log('Email notification sent to:', email);
  }

  if (method === 'sms' || method === 'both') {
    const smsBody = encodeURIComponent(`Hi ${firstName}, your PIN is: ${pin}${password ? `. Password: ${password}` : ''}${inviteLink ? `. Setup: ${inviteLink}` : ''}`);
    window.open(`sms:${phone}?body=${smsBody}`, '_blank');
    console.log('SMS notification sent to:', phone);
  }
}

/**
 * Map local role to Supabase role
 */
export function mapRoleToSupabase(role: StaffRole): MemberRow['role'] {
  const roleMap: Record<string, MemberRow['role']> = {
    'owner': 'admin',
    'manager': 'manager',
    'senior_stylist': 'staff',
    'stylist': 'staff',
    'junior_stylist': 'staff',
    'apprentice': 'staff',
    'receptionist': 'staff',
    'assistant': 'staff',
    'nail_technician': 'staff',
    'esthetician': 'staff',
    'massage_therapist': 'staff',
    'barber': 'staff',
    'colorist': 'staff',
    'makeup_artist': 'staff',
  };
  return roleMap[role] || 'staff';
}
