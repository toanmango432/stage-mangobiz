import { GiftCard } from './giftcard';

export interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
  isDefaultBilling: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'discover';
  last4: string;
  expiry: string;
  holderName: string;
  billingAddressId: string;
  isDefault: boolean;
}

export interface LoginActivity {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  timestamp: string;
  success: boolean;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    bookingReminders: boolean;
    promotional: boolean;
    newsletter: boolean;
  };
  communication: {
    preferredMethod: 'email' | 'phone' | 'sms';
    language: string;
  };
  service: {
    preferredStaff: string[];
    favoriteServices: string[];
    timePreference: string[];
  };
}

export interface UserMembership {
  plan: 'basic' | 'premium' | 'vip';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  renewalDate: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'female' | 'male' | 'non-binary' | 'other';
  memberSince: string;
  membership?: UserMembership;
  preferences: UserPreferences;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  giftCards?: GiftCard[];
}

export interface PasswordStrength {
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}
